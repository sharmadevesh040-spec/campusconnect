import { Router, Response } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import Papa from 'papaparse'
import QRCode from 'qrcode'
import { requireAuth, requireRole, AuthRequest, logAudit } from '../middleware/auth'
import { fallbackStore } from '../db'
import { saveFile } from '../storage'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// All admin routes require admin or super_admin
router.use(requireAuth)
router.use(requireRole('admin', 'super_admin'))

// GET /api/admin/dashboard (Platform-wide analytics)
router.get('/dashboard', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const students = fallbackStore.data.users.filter(u => u.role === 'student')
    const totalStudents = students.length
    const interviews = fallbackStore.data.interviews
    const certificates = fallbackStore.data.certificates
    const events = fallbackStore.data.events
    const tasks = fallbackStore.data.tasks

    const upcomingInterviews = interviews.filter(i => ['Scheduled', 'Confirmed', 'Rescheduled'].includes(i.status)).length
    const certificatesIssued = certificates.filter(c => c.status === 'Valid').length
    const upcomingEvents = events.filter(e => new Date(e.date).getTime() >= Date.now() - 86400000).length
    const pendingTasks = tasks.filter(t => ['Pending', 'In Progress'].includes(t.status)).length

    res.json({
      metrics: {
        totalStudents,
        upcomingInterviews,
        certificatesIssued,
        upcomingEvents,
        pendingTasks
      },
      charts: {
        studentGrowth: [
          { month: 'Jun', count: 420 },
          { month: 'Jul', count: 680 },
          { month: 'Aug', count: 910 },
          { month: 'Sep', count: 1050 },
          { month: 'Oct', count: 1180 },
          { month: 'Nov', count: totalStudents || 1248 }
        ],
        interviewStatus: [
          { name: 'Confirmed', value: interviews.filter(i => i.status === 'Confirmed').length || 45 },
          { name: 'Scheduled', value: interviews.filter(i => i.status === 'Scheduled').length || 25 },
          { name: 'Completed', value: interviews.filter(i => i.status === 'Completed').length || 60 },
          { name: 'Selected', value: interviews.filter(i => i.status === 'Selected').length || 18 }
        ],
        taskCompletion: [
          { status: 'Completed', count: tasks.filter(t => t.status === 'Completed').length || 310 },
          { status: 'In Progress', count: tasks.filter(t => t.status === 'In Progress').length || 85 },
          { status: 'Pending', count: tasks.filter(t => t.status === 'Pending').length || 42 },
          { status: 'Overdue', count: tasks.filter(t => t.status === 'Overdue').length || 12 }
        ]
      }
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch admin metrics' })
  }
})

// GET /api/admin/students
router.get('/students', async (req: AuthRequest, res: Response): Promise<void> => {
  const q = ((req.query.q as string) || '').toLowerCase()
  const branch = (req.query.branch as string) || ''
  
  let students = fallbackStore.data.users
    .filter(u => u.role === 'student')
    .map(u => {
      const p = fallbackStore.data.profiles.find(prof => prof.user_id === u.id) || u.profile
      return {
        id: u.id,
        email: u.email,
        name: p?.full_name || 'Student',
        studentId: p?.student_id || 'N/A',
        university: p?.university || 'University',
        college: p?.college || 'College',
        course: p?.course || 'B.Tech',
        branch: p?.branch || 'General',
        year: p?.year || 1,
        phone: p?.phone || '',
        completionPct: p?.completion_pct || 80,
        isActive: p?.is_active ?? true,
        createdAt: u.created_at || new Date().toISOString()
      }
    })

  if (q) {
    students = students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q)
    )
  }

  if (branch && branch !== 'all') {
    students = students.filter(s => s.branch.toLowerCase() === branch.toLowerCase())
  }

  res.json(students)
})

// POST /api/admin/students (Create individual student)
router.post('/students', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, email, studentId, course, branch, year = 1, phone = '' } = req.body
    if (!fullName || !email || !studentId) {
      res.status(400).json({ error: 'Full Name, Email, and Student ID are required' })
      return
    }

    const existing = fallbackStore.data.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (existing) {
      res.status(409).json({ error: 'A user with this email already exists' })
      return
    }

    const newId = crypto.randomUUID()
    const passwordHash = await bcrypt.hash('welcome123', 10)
    const newUser = {
      id: newId,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: 'student' as const,
      is_verified: true,
      profile: {
        id: crypto.randomUUID(),
        user_id: newId,
        full_name: fullName,
        student_id: studentId,
        phone,
        university: 'CampusConnect University Network',
        college: 'School of Technology',
        course: course || 'B.Tech',
        branch: branch || 'Computer Science',
        year: Number(year) || 1,
        semester: (Number(year) || 1) * 2 - 1,
        skills: ['Student Ambassador'],
        bio: 'Student ambassador cohort member.',
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        completion_pct: 85,
        is_active: true
      }
    }

    fallbackStore.data.users.push(newUser)
    fallbackStore.data.profiles.push(newUser.profile)

    await logAudit(req.user!.id, 'STUDENT_CREATED', 'users', newId, { email, studentId })

    res.status(201).json({ message: 'Student created successfully', student: newUser })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create student' })
  }
})

// PATCH /api/admin/students/:id (Update student info / activate / disable)
router.patch('/students/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const profile = fallbackStore.data.profiles.find(p => p.user_id === req.params.id)
  if (!profile) {
    res.status(404).json({ error: 'Student not found' })
    return
  }

  const { isActive, fullName, phone, branch, year } = req.body
  if (isActive !== undefined) profile.is_active = isActive
  if (fullName !== undefined) profile.full_name = fullName
  if (phone !== undefined) profile.phone = phone
  if (branch !== undefined) profile.branch = branch
  if (year !== undefined) profile.year = year

  await logAudit(req.user!.id, 'STUDENT_UPDATED', 'profiles', req.params.id, req.body)

  res.json({ message: 'Student updated successfully', profile })
})

// POST /api/admin/students/bulk-import (CSV bulk student import)
router.post('/students/bulk-import', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { csvData } = req.body
    if (!csvData || typeof csvData !== 'string') {
      res.status(400).json({ error: 'Please provide CSV content in csvData field' })
      return
    }

    const parseResult = Papa.parse(csvData, { header: true, skipEmptyLines: true })
    const rows = parseResult.data as Record<string, string>[]

    const validRows: any[] = []
    const errors: { row: number; error: string; data: any }[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const name = row.name || row.fullName || row.full_name
      const email = row.email
      const studentId = row.student_id || row.studentId || row.id
      const course = row.course || 'B.Tech'
      const branch = row.branch || 'CSE'
      const year = parseInt(row.year || '1', 10)

      if (!name || !email || !studentId) {
        errors.push({ row: i + 1, error: 'Missing name, email, or student_id', data: row })
        continue
      }

      if (!email.includes('@')) {
        errors.push({ row: i + 1, error: 'Invalid email address', data: row })
        continue
      }

      validRows.push({ name, email, studentId, course, branch, year })
    }

    // Insert valid rows
    let imported = 0
    const defaultPasswordHash = await bcrypt.hash('welcome123', 10)

    for (const item of validRows) {
      const exists = fallbackStore.data.users.find(u => u.email.toLowerCase() === item.email.toLowerCase())
      if (exists) {
        errors.push({ row: 0, error: `Email ${item.email} already registered`, data: item })
        continue
      }

      const newId = crypto.randomUUID()
      const newUser = {
        id: newId,
        email: item.email.toLowerCase(),
        password_hash: defaultPasswordHash,
        role: 'student' as const,
        is_verified: true,
        profile: {
          id: crypto.randomUUID(),
          user_id: newId,
          full_name: item.name,
          student_id: item.studentId,
          phone: '',
          university: 'CampusConnect University Network',
          college: 'School of Technology',
          course: item.course,
          branch: item.branch,
          year: item.year,
          semester: item.year * 2 - 1,
          skills: ['Ambassador'],
          bio: 'Cohort student member.',
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name)}`,
          completion_pct: 80,
          is_active: true
        }
      }

      fallbackStore.data.users.push(newUser)
      fallbackStore.data.profiles.push(newUser.profile)
      imported++
    }

    await logAudit(req.user!.id, 'STUDENTS_BULK_IMPORTED', 'users', undefined, {
      totalFound: rows.length,
      valid: validRows.length,
      imported,
      errorsCount: errors.length
    })

    res.json({
      total: rows.length,
      validCount: validRows.length,
      importedCount: imported,
      errors
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'CSV bulk import failed' })
  }
})

// GET /api/admin/interviews
router.get('/interviews', async (_req: AuthRequest, res: Response): Promise<void> => {
  const interviews = fallbackStore.data.interviews.map(i => {
    const student = fallbackStore.data.profiles.find(p => p.user_id === i.student_id)
    return {
      ...i,
      studentName: student?.full_name || 'Student',
      studentEmail: fallbackStore.data.users.find(u => u.id === i.student_id)?.email || '',
      studentCode: student?.student_id || ''
    }
  })
  res.json(interviews)
})

// POST /api/admin/interviews (Create and assign interview)
router.post('/interviews', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      studentId, title, organization = 'CampusConnect Program',
      date, time, duration = 45, type = 'Online', location, meetingLink,
      interviewer, instructions
    } = req.body

    if (!studentId || !title || !date || !time) {
      res.status(400).json({ error: 'Student, Title, Date, and Time are required' })
      return
    }

    const newInterview = {
      id: 'int-' + Date.now(),
      student_id: studentId,
      title,
      organization,
      date,
      time,
      duration: Number(duration),
      type,
      location: location || 'Online Room',
      meeting_link: meetingLink || 'https://meet.google.com/sample',
      interviewer: interviewer || 'Program Coordinator',
      instructions: instructions || 'Please join on time with your camera enabled.',
      status: 'Scheduled' as const,
      created_at: new Date().toISOString()
    }

    fallbackStore.data.interviews.push(newInterview)

    // Notify student
    fallbackStore.data.notifications.push({
      id: crypto.randomUUID(),
      user_id: studentId,
      title: 'New Interview Scheduled',
      message: `Your interview "${title}" is scheduled for ${date} at ${time}.`,
      type: 'interview',
      is_read: false,
      link: `/student/interviews/${newInterview.id}`,
      created_at: new Date().toISOString()
    })

    await logAudit(req.user!.id, 'INTERVIEW_CREATED', 'interviews', newInterview.id, { studentId, title, date })

    res.status(201).json(newInterview)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create interview' })
  }
})

// PATCH /api/admin/interviews/:id (Reschedule or update status)
router.patch('/interviews/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const interview = fallbackStore.data.interviews.find(i => i.id === req.params.id)
  if (!interview) {
    res.status(404).json({ error: 'Interview not found' })
    return
  }

  const { date, time, status, instructions, meetingLink } = req.body
  if (date !== undefined) interview.date = date
  if (time !== undefined) interview.time = time
  if (status !== undefined) interview.status = status
  if (instructions !== undefined) interview.instructions = instructions
  if (meetingLink !== undefined) interview.meeting_link = meetingLink

  // Notify student of schedule change
  fallbackStore.data.notifications.push({
    id: crypto.randomUUID(),
    user_id: interview.student_id,
    title: `Interview ${status || 'Updated'}`,
    message: `Your interview "${interview.title}" status is now ${interview.status}.`,
    type: 'interview',
    is_read: false,
    link: `/student/interviews/${interview.id}`,
    created_at: new Date().toISOString()
  })

  await logAudit(req.user!.id, 'INTERVIEW_UPDATED', 'interviews', interview.id, req.body)

  res.json(interview)
})

// DELETE /api/admin/interviews/:id
router.delete('/interviews/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const idx = fallbackStore.data.interviews.findIndex(i => i.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ error: 'Interview not found' })
    return
  }
  fallbackStore.data.interviews.splice(idx, 1)
  await logAudit(req.user!.id, 'INTERVIEW_DELETED', 'interviews', req.params.id)
  res.json({ message: 'Interview deleted' })
})

// GET /api/admin/certificates
router.get('/certificates', async (_req: AuthRequest, res: Response): Promise<void> => {
  const certificates = fallbackStore.data.certificates.map(c => {
    const student = fallbackStore.data.profiles.find(p => p.user_id === c.student_id)
    return {
      ...c,
      studentName: student?.full_name || 'Student',
      studentEmail: fallbackStore.data.users.find(u => u.id === c.student_id)?.email || '',
      studentCode: student?.student_id || ''
    }
  })
  res.json(certificates)
})

// POST /api/admin/certificates (Upload and assign certificate PDF)
router.post('/certificates', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, certificateName, program, issueDate } = req.body
    if (!studentId || !certificateName || !program) {
      res.status(400).json({ error: 'Student, Certificate Name, and Program are required' })
      return
    }

    // Generate unique Certificate ID (e.g. GSA-2026-104928)
    const certCode = 'GSA-2026-' + Math.floor(100000 + Math.random() * 900000)
    const verifyUrl = `${req.protocol}://${req.get('host')}/verify/${certCode}`
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl)

    let fileKey = `certificates/${certCode}.pdf`
    let fileUrl = `/api/certificates/${certCode}/download`

    if (req.file) {
      const stored = await saveFile(req.file.buffer, `${certCode}.pdf`, 'certificates')
      fileKey = stored.fileKey
      fileUrl = stored.fileUrl
    }

    const newCert = {
      id: 'cert-' + Date.now(),
      certificate_id: certCode,
      student_id: studentId,
      certificate_name: certificateName,
      program,
      issue_date: issueDate || new Date().toISOString().split('T')[0],
      file_key: fileKey,
      file_url: fileUrl,
      qr_code: qrCodeDataUrl,
      status: 'Valid' as const,
      created_at: new Date().toISOString()
    }

    fallbackStore.data.certificates.push(newCert)

    // Notify student
    fallbackStore.data.notifications.push({
      id: crypto.randomUUID(),
      user_id: studentId,
      title: '🏆 New Certificate Issued!',
      message: `Your verified certificate for "${certificateName}" is now available to download.`,
      type: 'certificate',
      is_read: false,
      link: '/student/certificates',
      created_at: new Date().toISOString()
    })

    await logAudit(req.user!.id, 'CERTIFICATE_ISSUED', 'certificates', certCode, {
      studentId, certificateName, certCode
    })

    res.status(201).json(newCert)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to issue certificate' })
  }
})

// PATCH /api/admin/certificates/:id/revoke (Revoke certificate)
router.patch('/certificates/:id/revoke', async (req: AuthRequest, res: Response): Promise<void> => {
  const cert = fallbackStore.data.certificates.find(c => c.id === req.params.id || c.certificate_id === req.params.id)
  if (!cert) {
    res.status(404).json({ error: 'Certificate not found' })
    return
  }

  cert.status = 'Revoked'
  await logAudit(req.user!.id, 'CERTIFICATE_REVOKED', 'certificates', cert.certificate_id)

  res.json({ message: 'Certificate revoked', certificate: cert })
})

// GET /api/admin/events
router.get('/events', async (_req: AuthRequest, res: Response): Promise<void> => {
  const events = fallbackStore.data.events.map(event => {
    const registrations = fallbackStore.data.event_registrations.filter(
      r => r.event_id === event.id && r.status === 'Registered'
    )
    return {
      ...event,
      attendeeCount: registrations.length
    }
  })
  res.json(events)
})

// POST /api/admin/events
router.post('/events', async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, description, date, time, venue, meetingLink, maxParticipants = 100, organizer, bannerUrl, registrationDeadline } = req.body
  if (!title || !date || !time) {
    res.status(400).json({ error: 'Title, Date, and Time are required' })
    return
  }

  const newEvent = {
    id: 'evt-' + Date.now(),
    title,
    description: description || '',
    date,
    time,
    venue: venue || 'Online Room',
    meeting_link: meetingLink || '',
    max_participants: Number(maxParticipants),
    organizer: organizer || 'CampusConnect',
    banner_url: bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    registration_deadline: registrationDeadline || date + 'T23:59:59Z',
    status: 'Open' as const,
    created_at: new Date().toISOString()
  }

  fallbackStore.data.events.push(newEvent)
  await logAudit(req.user!.id, 'EVENT_CREATED', 'events', newEvent.id, { title, date })

  res.status(201).json(newEvent)
})

// DELETE /api/admin/events/:id
router.delete('/events/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const idx = fallbackStore.data.events.findIndex(e => e.id === req.params.id)
  if (idx !== -1) {
    fallbackStore.data.events.splice(idx, 1)
    await logAudit(req.user!.id, 'EVENT_DELETED', 'events', req.params.id)
  }
  res.json({ message: 'Event deleted' })
})

// GET /api/admin/tasks
router.get('/tasks', async (_req: AuthRequest, res: Response): Promise<void> => {
  const tasks = fallbackStore.data.tasks.map(t => {
    const student = fallbackStore.data.profiles.find(p => p.user_id === t.student_id)
    return {
      ...t,
      studentName: student?.full_name || 'Student',
      studentEmail: fallbackStore.data.users.find(u => u.id === t.student_id)?.email || ''
    }
  })
  res.json(tasks)
})

// POST /api/admin/tasks (Assign task to student)
router.post('/tasks', async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId, title, description, deadline, priority = 'Medium' } = req.body
  if (!studentId || !title || !deadline) {
    res.status(400).json({ error: 'Student, Title, and Deadline are required' })
    return
  }

  const newTask = {
    id: 'tsk-' + Date.now(),
    student_id: studentId,
    title,
    description: description || '',
    deadline,
    priority,
    status: 'Pending' as const,
    created_at: new Date().toISOString()
  }

  fallbackStore.data.tasks.push(newTask)

  // Notify student
  fallbackStore.data.notifications.push({
    id: crypto.randomUUID(),
    user_id: studentId,
    title: 'New Task Assigned',
    message: `You have been assigned "${title}" (Due: ${deadline}).`,
    type: 'task',
    is_read: false,
    link: '/student/tasks',
    created_at: new Date().toISOString()
  })

  await logAudit(req.user!.id, 'TASK_CREATED', 'tasks', newTask.id, { studentId, title })

  res.status(201).json(newTask)
})

// GET /api/admin/announcements
router.get('/announcements', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json(fallbackStore.data.announcements)
})

// POST /api/admin/announcements
router.post('/announcements', async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, message, category = 'General', priority = 'Normal', isImportant = false } = req.body
  if (!title || !message) {
    res.status(400).json({ error: 'Title and Message are required' })
    return
  }

  const newAnn = {
    id: 'ann-' + Date.now(),
    title,
    message,
    category,
    priority,
    is_important: Boolean(isImportant),
    publish_date: new Date().toISOString()
  }

  fallbackStore.data.announcements.unshift(newAnn)

  // Broadcast notification to all active students
  const students = fallbackStore.data.users.filter(u => u.role === 'student')
  for (const s of students) {
    fallbackStore.data.notifications.push({
      id: crypto.randomUUID(),
      user_id: s.id,
      title: '📢 ' + title,
      message,
      type: 'announcement',
      is_read: false,
      link: '/student/announcements',
      created_at: new Date().toISOString()
    })
  }

  await logAudit(req.user!.id, 'ANNOUNCEMENT_PUBLISHED', 'announcements', newAnn.id, { title })

  res.status(201).json(newAnn)
})

// DELETE /api/admin/announcements/:id
router.delete('/announcements/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const idx = fallbackStore.data.announcements.findIndex(a => a.id === req.params.id)
  if (idx !== -1) {
    fallbackStore.data.announcements.splice(idx, 1)
  }
  res.json({ message: 'Announcement deleted' })
})

// GET /api/admin/resources
router.get('/resources', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json(fallbackStore.data.resources)
})

// POST /api/admin/resources
router.post('/resources', async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, description, category, type = 'PDF', url } = req.body
  if (!title || !category || !url) {
    res.status(400).json({ error: 'Title, Category, and URL are required' })
    return
  }

  const newRes = {
    id: 'res-' + Date.now(),
    title,
    description: description || '',
    category,
    type,
    url
  }

  fallbackStore.data.resources.push(newRes)
  await logAudit(req.user!.id, 'RESOURCE_CREATED', 'resources', newRes.id, { title })

  res.status(201).json(newRes)
})

// DELETE /api/admin/resources/:id
router.delete('/resources/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const idx = fallbackStore.data.resources.findIndex(r => r.id === req.params.id)
  if (idx !== -1) {
    fallbackStore.data.resources.splice(idx, 1)
  }
  res.json({ message: 'Resource deleted' })
})

// GET /api/admin/audit-logs
router.get('/audit-logs', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json(fallbackStore.data.audit_logs)
})

// Super Admin Only: /api/admin/admins
router.get('/admins', requireRole('super_admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  const admins = fallbackStore.data.users
    .filter(u => u.role === 'admin' || u.role === 'super_admin')
    .map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      name: u.profile?.full_name || 'Admin',
      phone: u.profile?.phone || '',
      college: u.profile?.college || 'Administration',
      createdAt: u.created_at || new Date().toISOString()
    }))
  res.json(admins)
})

export default router
