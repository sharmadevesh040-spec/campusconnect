import { Router, Response } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import Papa from 'papaparse'
import QRCode from 'qrcode'
import { requireAuth, requireRole, AuthRequest, logAudit } from '../middleware/auth'
import { query } from '../db'
import { saveFile } from '../storage'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// All admin routes require admin or super_admin
router.use(requireAuth)
router.use(requireRole('admin', 'super_admin'))

// GET /api/admin/dashboard (Platform-wide analytics from PostgreSQL)
router.get('/dashboard', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentCountRes = await query(`SELECT count(*)::int FROM users WHERE role = 'student'`)
    const totalStudents = studentCountRes.rows[0]?.count || 0

    const intCountRes = await query(
      `SELECT count(*)::int FROM interviews WHERE status IN ('Scheduled', 'Confirmed', 'Rescheduled')`
    )
    const upcomingInterviews = intCountRes.rows[0]?.count || 0

    const certCountRes = await query(`SELECT count(*)::int FROM certificates WHERE status = 'Valid'`)
    const certificatesIssued = certCountRes.rows[0]?.count || 0

    const evtCountRes = await query(
      `SELECT count(*)::int FROM events WHERE date >= CURRENT_DATE - INTERVAL '1 day'`
    )
    const upcomingEvents = evtCountRes.rows[0]?.count || 0

    const taskCountRes = await query(`SELECT count(*)::int FROM tasks WHERE status IN ('Pending', 'In Progress')`)
    const pendingTasks = taskCountRes.rows[0]?.count || 0

    // Real student registration growth from PostgreSQL
    const growthRes = await query(`
      SELECT to_char(created_at, 'Mon') as month, count(*)::int as count
      FROM users
      WHERE role = 'student'
      GROUP BY to_char(created_at, 'Mon'), date_trunc('month', created_at)
      ORDER BY date_trunc('month', created_at) ASC
    `)
    const studentGrowth = growthRes.rows.length > 0
      ? growthRes.rows
      : [{ month: new Date().toLocaleString('en-US', { month: 'short' }), count: totalStudents }]

    // Real interview status breakdown from PostgreSQL
    const intStatusRes = await query(`
      SELECT status as name, count(*)::int as value
      FROM interviews
      GROUP BY status
    `)
    const interviewStatus = intStatusRes.rows

    // Real task status breakdown from PostgreSQL
    const taskStatusRes = await query(`
      SELECT status, count(*)::int as count
      FROM tasks
      GROUP BY status
    `)
    const taskCompletion = taskStatusRes.rows

    res.json({
      metrics: {
        totalStudents,
        upcomingInterviews,
        certificatesIssued,
        upcomingEvents,
        pendingTasks
      },
      charts: {
        studentGrowth,
        interviewStatus,
        taskCompletion
      }
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch admin metrics' })
  }
})

// GET /api/admin/students
router.get('/students', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = ((req.query.q as string) || '').toLowerCase()
    let sql = `
      SELECT u.id, u.email, u.created_at as "createdAt",
             p.full_name as name, p.student_id as "studentId", p.university,
             p.college, p.course, p.branch, p.year, p.phone,
             p.completion_pct as "completionPct", p.is_active as "isActive",
             p.avatar_url as "avatarUrl"
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE (p.id IS NOT NULL OR u.role IN ('student', 'super_admin', 'admin'))
    `
    const params: any[] = []

    if (q) {
      sql += ` AND (LOWER(p.full_name) LIKE $1 OR LOWER(u.email) LIKE $1 OR LOWER(p.student_id) LIKE $1)`
      params.push(`%${q}%`)
    }

    sql += ` ORDER BY u.created_at DESC`
    const resSql = await query(sql, params)
    res.json(resSql.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/students (Create individual student)
router.post('/students', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, email, studentId, course, branch, year = 1, phone = '' } = req.body
    if (!fullName || !email || !studentId) {
      res.status(400).json({ error: 'Full Name, Email, and Student ID are required' })
      return
    }

    const newId = crypto.randomUUID()
    const passwordHash = await bcrypt.hash('welcome123', 10)

    await query(
      `INSERT INTO users (id, email, password_hash, role, is_verified)
       VALUES ($1, $2, $3, 'student', true)`,
      [newId, email.toLowerCase(), passwordHash]
    )

    await query(
      `INSERT INTO profiles (id, user_id, full_name, student_id, phone, university, college, course, branch, year, semester, avatar_url, completion_pct, is_active)
       VALUES ($1, $2, $3, $4, $5, 'CampusConnect University Network', 'School of Technology', $6, $7, $8, $9, $10, 85, true)`,
      [
        crypto.randomUUID(),
        newId,
        fullName,
        studentId,
        phone,
        course || 'B.Tech',
        branch || 'Computer Science',
        Number(year) || 1,
        (Number(year) || 1) * 2 - 1,
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`
      ]
    )

    await logAudit(req.user!.id, 'STUDENT_CREATED', 'users', newId, { email, studentId })

    res.status(201).json({ message: 'Student created successfully', id: newId })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create student' })
  }
})

// PATCH /api/admin/students/:id (Activate or Disable student)
router.patch('/students/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isActive, fullName, phone, branch, year } = req.body

    await query(
      `UPDATE profiles SET
        is_active = COALESCE($1, is_active),
        full_name = COALESCE($2, full_name),
        phone = COALESCE($3, phone),
        branch = COALESCE($4, branch),
        year = COALESCE($5, year),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6`,
      [isActive, fullName, phone, branch, year, req.params.id]
    )

    await logAudit(req.user!.id, 'STUDENT_UPDATED', 'profiles', req.params.id, req.body)
    res.json({ message: 'Student updated successfully' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
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

    let imported = 0
    const defaultPasswordHash = await bcrypt.hash('welcome123', 10)

    for (const item of validRows) {
      try {
        const newId = crypto.randomUUID()
        await query(
          `INSERT INTO users (id, email, password_hash, role, is_verified)
           VALUES ($1, $2, $3, 'student', true)
           ON CONFLICT (email) DO NOTHING`,
          [newId, item.email.toLowerCase(), defaultPasswordHash]
        )

        await query(
          `INSERT INTO profiles (id, user_id, full_name, student_id, phone, university, college, course, branch, year, semester, avatar_url, completion_pct, is_active)
           VALUES ($1, $2, $3, $4, '', 'CampusConnect University Network', 'School of Technology', $5, $6, $7, $8, $9, 80, true)
           ON CONFLICT (student_id) DO UPDATE SET full_name = EXCLUDED.full_name`,
          [
            crypto.randomUUID(),
            newId,
            item.name,
            item.studentId,
            item.course,
            item.branch,
            item.year,
            item.year * 2 - 1,
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name)}`
          ]
        )
        imported++
      } catch (insertErr) {
        errors.push({ row: 0, error: 'Database constraint violation', data: item })
      }
    }

    await logAudit(req.user!.id, 'STUDENTS_BULK_IMPORTED', 'users', undefined, {
      totalFound: rows.length,
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
  try {
    const resSql = await query(`
      SELECT i.*, p.full_name as "studentName", u.email as "studentEmail", p.student_id as "studentCode"
      FROM interviews i
      LEFT JOIN profiles p ON i.student_id = p.user_id
      LEFT JOIN users u ON i.student_id = u.id
      ORDER BY i.date ASC, i.time ASC
    `)
    res.json(resSql.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
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

    const newId = 'int-' + Date.now()

    await query(
      `INSERT INTO interviews (id, student_id, title, organization, date, time, duration, type, location, meeting_link, interviewer, instructions, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Scheduled')`,
      [newId, studentId, title, organization, date, time, Number(duration), type, location || 'Online Room', meetingLink || 'https://meet.google.com/sample', interviewer || 'Program Coordinator', instructions || 'Join on time.']
    )

    // Notify student
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, 'interview', $4)`,
      [
        studentId,
        'New Interview Scheduled',
        `Your interview "${title}" is scheduled for ${date} at ${time}.`,
        `/student/interviews/${newId}`
      ]
    )

    await logAudit(req.user!.id, 'INTERVIEW_CREATED', 'interviews', newId, { studentId, title, date })

    res.status(201).json({ id: newId, title, date, time })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/admin/interviews/:id
router.patch('/interviews/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, time, status, instructions, meetingLink } = req.body

    const resSql = await query(
      `UPDATE interviews SET
        date = COALESCE($1, date),
        time = COALESCE($2, time),
        status = COALESCE($3, status),
        instructions = COALESCE($4, instructions),
        meeting_link = COALESCE($5, meeting_link),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [date, time, status, instructions, meetingLink, req.params.id]
    )

    if (resSql.rowCount === 0) {
      res.status(404).json({ error: 'Interview not found' })
      return
    }

    await logAudit(req.user!.id, 'INTERVIEW_UPDATED', 'interviews', req.params.id, req.body)
    res.json(resSql.rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/interviews/:id
router.delete('/interviews/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await query(`DELETE FROM interviews WHERE id = $1`, [req.params.id])
    await logAudit(req.user!.id, 'INTERVIEW_DELETED', 'interviews', req.params.id)
    res.json({ message: 'Interview deleted' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/certificates
router.get('/certificates', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resSql = await query(`
      SELECT c.*, p.full_name as "studentName", u.email as "studentEmail", p.student_id as "studentCode"
      FROM certificates c
      LEFT JOIN profiles p ON c.student_id = p.user_id
      LEFT JOIN users u ON c.student_id = u.id
      ORDER BY c.issue_date DESC
    `)
    res.json(resSql.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/certificates (Upload and issue certificate)
router.post('/certificates', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, certificateName, program, issueDate } = req.body
    if (!studentId || !certificateName || !program) {
      res.status(400).json({ error: 'Student, Certificate Name, and Program are required' })
      return
    }

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

    const newId = 'cert-' + Date.now()

    // Resolve student user ID from UUID, student_id code, or email
    const stuLookup = await query(
      `SELECT u.id, u.email, p.student_id, p.full_name
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id::text = $1 OR p.student_id = $1 OR LOWER(u.email) = LOWER($1)
       LIMIT 1`,
      [studentId]
    )
    const resolvedStudentId = stuLookup.rows[0]?.id || studentId

    await query(
      `INSERT INTO certificates (id, certificate_id, student_id, certificate_name, program, issue_date, file_key, file_url, qr_code, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Valid')`,
      [newId, certCode, resolvedStudentId, certificateName, program, issueDate || new Date().toISOString().split('T')[0], fileKey, fileUrl, qrCodeDataUrl]
    )

    // Notify student
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, 'certificate', '/student/certificates')`,
      [
        resolvedStudentId,
        '🏆 New Certificate Issued!',
        `Your verified certificate for "${certificateName}" is now available to download.`
      ]
    )

    await logAudit(req.user!.id, 'CERTIFICATE_ISSUED', 'certificates', certCode, { studentId: resolvedStudentId, certificateName })

    res.status(201).json({ id: newId, certificate_id: certCode, certificate_name: certificateName })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/admin/certificates/:id/revoke
router.patch('/certificates/:id/revoke', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await query(
      `UPDATE certificates SET status = 'Revoked', updated_at = CURRENT_TIMESTAMP WHERE id = $1 OR certificate_id = $1`,
      [req.params.id]
    )
    await logAudit(req.user!.id, 'CERTIFICATE_REVOKED', 'certificates', req.params.id)
    res.json({ message: 'Certificate revoked' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/events
router.get('/events', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resSql = await query(`
      SELECT e.*,
        (SELECT count(*) FROM event_registrations r WHERE r.event_id = e.id AND r.status = 'Registered')::int as "attendeeCount"
      FROM events e
      ORDER BY e.date ASC
    `)
    res.json(resSql.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/events
router.post('/events', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, date, time, venue, meetingLink, maxParticipants = 100, organizer, bannerUrl, registrationDeadline } = req.body
    const newId = 'evt-' + Date.now()

    await query(
      `INSERT INTO events (id, title, description, date, time, venue, meeting_link, max_participants, banner_url, organizer, registration_deadline, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Open')`,
      [
        newId, title, description || '', date, time, venue || 'Online Room',
        meetingLink || '', Number(maxParticipants),
        bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
        organizer || 'CampusConnect',
        registrationDeadline || date + 'T23:59:59Z'
      ]
    )

    await logAudit(req.user!.id, 'EVENT_CREATED', 'events', newId, { title, date })
    res.status(201).json({ id: newId, title })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/events/:id
router.delete('/events/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await query(`DELETE FROM events WHERE id = $1`, [req.params.id])
    await logAudit(req.user!.id, 'EVENT_DELETED', 'events', req.params.id)
    res.json({ message: 'Event deleted' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/tasks
router.get('/tasks', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resSql = await query(`
      SELECT t.*, p.full_name as "studentName", u.email as "studentEmail"
      FROM tasks t
      LEFT JOIN profiles p ON t.student_id = p.user_id
      LEFT JOIN users u ON t.student_id = u.id
      ORDER BY t.deadline ASC
    `)
    res.json(resSql.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/tasks
router.post('/tasks', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, title, description, deadline, priority = 'Medium' } = req.body
    const newId = 'tsk-' + Date.now()

    await query(
      `INSERT INTO tasks (id, student_id, title, description, deadline, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending')`,
      [newId, studentId, title, description || '', deadline, priority]
    )

    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, 'task', '/student/tasks')`,
      [studentId, 'New Task Assigned', `You have been assigned "${title}" (Due: ${deadline}).`]
    )

    await logAudit(req.user!.id, 'TASK_CREATED', 'tasks', newId, { studentId, title })
    res.status(201).json({ id: newId, title })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/tasks/:id
router.delete('/tasks/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await query(`DELETE FROM tasks WHERE id = $1`, [req.params.id])
    res.json({ message: 'Task deleted' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/announcements
router.get('/announcements', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resSql = await query(`SELECT * FROM announcements ORDER BY publish_date DESC`)
    res.json(resSql.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/announcements
router.post('/announcements', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, message, category = 'General', priority = 'Normal', isImportant = false } = req.body
    const newId = 'ann-' + Date.now()

    await query(
      `INSERT INTO announcements (id, title, message, category, priority, is_important, publish_date)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [newId, title, message, category, priority, Boolean(isImportant)]
    )

    // Broadcast notification to all active students in PostgreSQL
    const studentsRes = await query(`SELECT id FROM users WHERE role = 'student'`)
    for (const s of studentsRes.rows) {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES ($1, $2, $3, 'announcement', '/student/announcements')`,
        [s.id, '📢 ' + title, message]
      )
    }

    await logAudit(req.user!.id, 'ANNOUNCEMENT_PUBLISHED', 'announcements', newId, { title })
    res.status(201).json({ id: newId, title })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/announcements/:id
router.delete('/announcements/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await query(`DELETE FROM announcements WHERE id = $1`, [req.params.id])
    res.json({ message: 'Announcement deleted' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/resources
router.get('/resources', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resSql = await query(`SELECT * FROM resources ORDER BY title ASC`)
    res.json(resSql.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/resources
router.post('/resources', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category, type = 'PDF', url } = req.body
    const newId = 'res-' + Date.now()
    await query(
      `INSERT INTO resources (id, title, description, category, type, url)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [newId, title, description || '', category, type, url]
    )
    await logAudit(req.user!.id, 'RESOURCE_CREATED', 'resources', newId, { title })
    res.status(201).json({ id: newId, title })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/resources/:id
router.delete('/resources/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await query(`DELETE FROM resources WHERE id = $1`, [req.params.id])
    res.json({ message: 'Resource deleted' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/audit-logs
router.get('/audit-logs', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resSql = await query(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`)
    res.json(resSql.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/admins
router.get('/admins', requireRole('super_admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resSql = await query(`
      SELECT u.id, u.email, u.role, p.full_name as name, p.phone, p.college, u.created_at as "createdAt"
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.role IN ('admin', 'super_admin')
      ORDER BY u.created_at DESC
    `)
    res.json(resSql.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
