import { Router, Response } from 'express'
import fs from 'fs'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import Papa from 'papaparse'
import QRCode from 'qrcode'
import { requireAuth, requireRole, AuthRequest, logAudit } from '../middleware/auth'
import { query } from '../db'
import { firestoreStore, FirestoreMember, FirestoreUser, FirestoreStudentProfile } from '../db/firestore'
import { saveFile, getFilePath } from '../storage'
import { generateCertificatePdfBuffer } from '../storage/pdfGenerator'
import { uploadCertificateTool, deleteCertificateTool } from '../mcp/certificateTools'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// All admin routes require admin or super_admin
router.use(requireAuth)
router.use(requireRole('admin', 'super_admin'))

// POST /api/admin/members (Add Member Account directly into Firestore)
router.post('/members', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, name, role } = req.body
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email address is required.' })
      return
    }

    const normalizedEmail = email.toLowerCase().trim()
    const memberName = name?.trim() || normalizedEmail.split('@')[0]
    const assignedRole = role === 'admin' ? 'admin' : 'member'

    // Check if account already exists in members collection or users
    const existingMember = firestoreStore.collections.members.find(
      m => m.email.toLowerCase().trim() === normalizedEmail
    )
    if (existingMember) {
      res.status(409).json({ error: `An account with email ${normalizedEmail} already exists.` })
      return
    }

    const memberId = 'mem-' + crypto.randomUUID()
    const DEFAULT_PASS = 'Ambassador@123'

    // 1. Add to members collection
    const newMember: FirestoreMember = {
      id: memberId,
      name: memberName,
      email: normalizedEmail,
      password: DEFAULT_PASS,
      role: assignedRole,
      status: 'active',
      createdAt: new Date(),
      lastLoginAt: null
    }
    firestoreStore.collections.members.unshift(newMember)
    await firestoreStore.syncDocToFirestore('members', memberId, newMember).catch(() => {})

    // 2. Add corresponding user record in users collection
    const passHash = await bcrypt.hash(DEFAULT_PASS, 10)
    const newUser: FirestoreUser = {
      id: memberId,
      uid: memberId,
      email: normalizedEmail,
      password_hash: passHash,
      role: assignedRole === 'admin' ? 'admin' : 'student',
      name: memberName,
      firstLogin: false,
      status: 'active',
      is_verified: true,
      createdAt: new Date(),
      created_at: new Date()
    }
    firestoreStore.collections.users.unshift(newUser)
    await firestoreStore.syncDocToFirestore('users', memberId, newUser).catch(() => {})

    // 3. Add student profile in students collection
    const studentId = 'GSA-2026-' + Math.floor(100000 + Math.random() * 900000)
    const newProfile: FirestoreStudentProfile = {
      id: `prof-${memberId}`,
      user_id: memberId,
      full_name: memberName,
      student_id: studentId,
      phone: '+91 98765 43211',
      university: 'Delhi Technological University',
      college: 'Faculty of Engineering',
      course: 'B.Tech',
      branch: 'Computer Science',
      year: 2,
      semester: 3,
      skills: ['Student Ambassador', 'Leadership'],
      bio: 'Campus Ambassador & Student Representative',
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(memberName)}`,
      completion_pct: 100,
      is_active: true,
      status: 'active',
      firstLogin: false,
      login_count: 0,
      created_at: new Date()
    }
    firestoreStore.collections.students.unshift(newProfile)
    await firestoreStore.syncDocToFirestore('students', memberId, newProfile).catch(() => {})

    await logAudit(req.user?.id || 'admin', 'MEMBER_CREATE', 'members', memberId, {
      email: normalizedEmail,
      role: assignedRole
    })

    res.status(201).json({
      message: `Member account successfully created for ${normalizedEmail}`,
      member: {
        id: memberId,
        uid: memberId,
        email: normalizedEmail,
        name: memberName,
        role: assignedRole,
        status: 'active',
        firstLogin: false,
        createdAt: newMember.createdAt
      }
    })
  } catch (err: any) {
    console.error('[Create Member Error]', err)
    res.status(500).json({ error: err.message || 'Failed to create member account.' })
  }
})

// GET /api/admin/members (List all members and students with telemetry)
router.get('/members', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = ((req.query.q as string) || '').toLowerCase().trim()
    const statusFilter = ((req.query.status as string) || 'all').toLowerCase().trim()
    const roleFilter = ((req.query.role as string) || 'all').toLowerCase().trim()

    let sql = `
      SELECT u.id, u.email, u.created_at as "createdAt", u.role,
             p.id as "profileId", p.full_name as name, p.student_id as "studentId",
             p.is_active as "isActive",
             p.last_login_at as "lastLoginAt",
             p.last_active_at as "lastActiveAt",
             COALESCE(p.login_count, 0) as "loginCount",
             p.last_login_device as "device",
             p.last_login_browser as "browser",
             p.last_login_ip as "ipAddress"
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE 1=1
    `
    const params: any[] = []

    if (q) {
      params.push(`%${q}%`)
      sql += ` AND (LOWER(p.full_name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(p.student_id) LIKE $${params.length})`
    }

    if (roleFilter !== 'all') {
      params.push(roleFilter)
      sql += ` AND u.role = $${params.length}`
    }

    sql += ` ORDER BY p.last_login_at DESC NULLS LAST, u.created_at DESC`

    const resSql = await query(sql, params)

    const mapped = resSql.rows.map(row => ({
      id: row.id,
      uid: row.id,
      email: row.email,
      name: row.name || row.email.split('@')[0],
      role: row.role || 'member',
      status: row.status || (row.isActive ? 'active' : 'disabled'),
      firstLogin: Boolean(row.firstLogin),
      createdAt: row.createdAt,
      lastLoginAt: row.lastLoginAt,
      lastActiveAt: row.lastActiveAt,
      loginCount: row.loginCount || 0,
      device: row.device || 'Windows PC',
      browser: row.browser || 'Chrome'
    }))

    const filtered = statusFilter === 'all'
      ? mapped
      : mapped.filter(m => m.status === statusFilter)

    res.json(filtered)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/admin/members/:id/status (Enable or disable member account)
router.put('/members/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.params.id
    const { status } = req.body
    if (status !== 'active' && status !== 'disabled') {
      res.status(400).json({ error: 'Status must be active or disabled' })
      return
    }

    const isActive = status === 'active'
    await query(`UPDATE users SET status = $1 WHERE id = $2`, [status, memberId])
    await query(`UPDATE profiles SET is_active = $1 WHERE user_id = $2`, [isActive, memberId]).catch(() => {})
    await query(`UPDATE members SET status = $1 WHERE id = $2`, [status, memberId]).catch(() => {})

    await logAudit(req.user?.id || 'admin', 'MEMBER_STATUS_CHANGE', 'users', memberId, { status })

    res.json({ message: `Member account status updated to ${status}.`, status })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update member status' })
  }
})

// GET /api/admin/dashboard (Platform-wide analytics from Firestore)
router.get('/dashboard', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentCountRes = await query(`SELECT count(*)::int FROM users WHERE role = 'student'`)
    const totalStudents = studentCountRes.rows[0]?.count || 0

    // Active (Online) Students: active within last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const activeStudentsRes = await query(`
      SELECT count(DISTINCT user_id)::int FROM profiles
      WHERE last_active_at >= $1
    `, [fiveMinutesAgo]).catch(() => ({ rows: [{ count: 0 }] }))
    const activeStudents = activeStudentsRes.rows[0]?.count || 0

    // Today's Logins
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const todayLoginsRes = await query(`
      SELECT count(*)::int FROM student_login_activity
      WHERE login_at >= $1
    `, [startOfToday]).catch(() => ({ rows: [{ count: 0 }] }))
    const todayLogins = todayLoginsRes.rows[0]?.count || 0

    // Total Logins across all students
    const totalLoginsRes = await query(`
      SELECT COALESCE(SUM(login_count), 0)::int as total FROM profiles
    `).catch(() => ({ rows: [{ total: 0 }] }))
    const totalLogins = totalLoginsRes.rows[0]?.total || 0

    // Total Certificates
    const certCountRes = await query(`SELECT count(*)::int FROM certificates WHERE status = 'Valid'`)
    const totalCertificates = certCountRes.rows[0]?.count || 0

    // Certificates Uploaded Today
    const todayCertsRes = await query(`
      SELECT count(*)::int FROM certificates WHERE created_at >= $1
    `, [startOfToday]).catch(() => ({ rows: [{ count: 0 }] }))
    const todayCertificates = todayCertsRes.rows[0]?.count || 0

    // Real student registration growth from Firestore
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

    // Recent 6 Student Login Activities
    const recentActivityRes = await query(`
      SELECT a.*, p.full_name as "studentName", u.email as "studentEmail"
      FROM student_login_activity a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN profiles p ON a.user_id = p.user_id
      ORDER BY a.login_at DESC
      LIMIT 6
    `).catch(() => ({ rows: [] }))

    res.json({
      metrics: {
        totalStudents,
        activeStudents,
        todayLogins,
        totalLogins,
        totalCertificates,
        todayCertificates,
        certificatesIssued: totalCertificates
      },
      charts: {
        studentGrowth
      },
      recentActivity: recentActivityRes.rows
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch admin metrics' })
  }
})

// GET /api/admin/students & /api/admin/student-activity (Comprehensive activity and tracking)
router.get(['/students', '/student-activity'], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = ((req.query.q as string) || '').toLowerCase().trim()
    const filter = ((req.query.filter as string) || 'all').toLowerCase().trim()
    const sort = ((req.query.sort as string) || 'latest').toLowerCase().trim()

    let sql = `
      SELECT u.id, u.email, u.created_at as "createdAt",
             p.id as "profileId", p.full_name as name, p.student_id as "studentId",
             p.university, p.college, p.course, p.branch, p.year, p.phone,
             p.completion_pct as "completionPct", p.is_active as "isActive",
             p.avatar_url as "avatarUrl",
             p.last_login_at as "lastLoginAt",
             p.last_active_at as "lastActiveAt",
             COALESCE(p.login_count, 0) as "loginCount",
             p.last_login_device as "device",
             p.last_login_browser as "browser",
             p.last_login_ip as "ipAddress",
             (SELECT count(*)::int FROM certificates c WHERE c.student_id = u.id OR c.student_id = p.student_id OR c.student_id = u.email) as "certificatesCount"
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.role = 'student'
    `
    const params: any[] = []

    if (q) {
      params.push(`%${q}%`)
      sql += ` AND (LOWER(p.full_name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(p.student_id) LIKE $${params.length})`
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    if (filter === 'online') {
      params.push(fiveMinutesAgo)
      sql += ` AND p.last_active_at >= $${params.length}`
    } else if (filter === 'active' || filter === 'recently_active') {
      params.push(twentyFourHoursAgo)
      sql += ` AND p.last_active_at >= $${params.length}`
    } else if (filter === 'today') {
      params.push(startOfToday)
      sql += ` AND p.last_login_at >= $${params.length}`
    } else if (filter === 'week') {
      params.push(startOfWeek)
      sql += ` AND p.last_login_at >= $${params.length}`
    }

    if (sort === 'oldest') {
      sql += ` ORDER BY p.last_login_at ASC NULLS LAST`
    } else if (sort === 'name') {
      sql += ` ORDER BY p.full_name ASC`
    } else if (sort === 'logins') {
      sql += ` ORDER BY p.login_count DESC, p.last_login_at DESC`
    } else {
      sql += ` ORDER BY p.last_login_at DESC NULLS LAST, u.created_at DESC`
    }

    const resSql = await query(sql, params)
    
    // Calculate live Online status (within 5 minutes)
    const nowTime = Date.now()
    const mapped = resSql.rows.map(row => {
      const lastActiveTime = row.lastActiveAt ? new Date(row.lastActiveAt).getTime() : 0
      const isOnline = (nowTime - lastActiveTime) <= 5 * 60 * 1000
      return {
        ...row,
        status: isOnline ? 'Online' : 'Offline',
        device: row.device || 'Windows PC',
        browser: row.browser || 'Chrome',
        ipAddress: row.ipAddress || '127.0.0.1'
      }
    })

    res.json(mapped)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/students/:id/details (Comprehensive student drilldown with certificates and login history)
router.get('/students/:id/details', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentIdParam = req.params.id

    // Fetch user and profile
    const userRes = await query(`
      SELECT u.id, u.email, u.created_at as "createdAt",
             p.id as "profileId", p.full_name as name, p.student_id as "studentId",
             p.university, p.college, p.course, p.branch, p.year, p.semester, p.phone,
             p.bio, p.skills, p.avatar_url as "avatarUrl", p.completion_pct as "completionPct",
             p.is_active as "isActive",
             p.last_login_at as "lastLoginAt",
             p.last_active_at as "lastActiveAt",
             COALESCE(p.login_count, 0) as "loginCount",
             p.last_login_device as "device",
             p.last_login_browser as "browser",
             p.last_login_ip as "ipAddress"
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1 OR p.user_id = $1 OR p.student_id = $1 OR u.email = $1
    `, [studentIdParam])

    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'Student not found' })
      return
    }

    const student = userRes.rows[0]
    const nowTime = Date.now()
    const lastActiveTime = student.lastActiveAt ? new Date(student.lastActiveAt).getTime() : 0
    const isOnline = (nowTime - lastActiveTime) <= 5 * 60 * 1000

    // Fetch student certificates
    const certsRes = await query(`
      SELECT id, certificate_id as "certificateId", title, certificate_name as "certificateName",
             type, certificate_type as "certificateType", program, issue_date as "issueDate",
             file_url as "fileUrl", status, created_at as "createdAt"
      FROM certificates
      WHERE student_id = $1 OR student_id = $2 OR student_id = $3
      ORDER BY issue_date DESC
    `, [student.id, student.studentId, student.email])

    // Fetch student's recent login history
    const loginsRes = await query(`
      SELECT id, login_at as "loginAt", logout_at as "logoutAt", last_active_at as "lastActiveAt",
             device, browser, ip_address as "ipAddress", user_agent as "userAgent"
      FROM student_login_activity
      WHERE user_id = $1 OR student_id = $2
      ORDER BY login_at DESC
      LIMIT 25
    `, [student.id, student.studentId])

    res.json({
      student: {
        ...student,
        status: isOnline ? 'Online' : 'Offline'
      },
      certificates: certsRes.rows,
      loginHistory: loginsRes.rows
    })
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

// GET /api/admin/certificates (Search by student name, student ID, or certificate ID)
router.get('/certificates', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = ((req.query.q as string) || '').trim().toLowerCase()
    let sql = `
      SELECT c.*, 
             COALESCE(c.title, c.certificate_name) as title,
             COALESCE(c.type, 'Participation') as type,
             p.full_name as "studentName", 
             u.email as "studentEmail", 
             p.student_id as "studentCode",
             p.university as "studentUniversity"
      FROM certificates c
      LEFT JOIN profiles p ON (c.student_id = p.user_id OR c.student_id = p.student_id)
      LEFT JOIN users u ON (c.student_id = u.id::text OR LOWER(c.student_id) = LOWER(u.email))
    `
    const params: any[] = []
    if (q) {
      params.push(`%${q}%`)
      sql += ` WHERE LOWER(COALESCE(p.full_name, '')) LIKE $1 
               OR LOWER(COALESCE(p.student_id, '')) LIKE $1 
               OR LOWER(c.certificate_id) LIKE $1 
               OR LOWER(COALESCE(c.title, c.certificate_name, '')) LIKE $1 
               OR LOWER(COALESCE(c.program, '')) LIKE $1
               OR LOWER(COALESCE(u.email, '')) LIKE $1`
    }
    sql += ` ORDER BY c.issue_date DESC, c.created_at DESC`
    const resSql = await query(sql, params)
    res.json(resSql.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/certificates (Upload PDF, store metadata & link to unique student ID via MCP)
router.post('/certificates', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, certificateName, title, program, type, issueDate, description, certificate_file, certificate_file_base64 } = req.body
    const certTitle = (title || certificateName || '').trim()
    const fileData = req.file ? req.file.buffer : (certificate_file || certificate_file_base64)

    if (!studentId || !certTitle) {
      res.status(400).json({ error: 'Student and Certificate Name are required' })
      return
    }

    if (!fileData) {
      res.status(400).json({ error: 'Certificate PDF file is required' })
      return
    }

    // Delegate to MCP tool
    const result = await uploadCertificateTool({
      student_id: studentId,
      certificate_name: certTitle,
      issue_date: issueDate || new Date().toISOString().split('T')[0],
      certificate_file: fileData,
      caller_user_id: req.user!.id,
      caller_role: req.user!.role,
      certificate_type: type || 'Ambassador',
      program: program || 'CampusConnect Ambassador Program 2026',
      description: description || ''
    })

    if (!result.success) {
      res.status(result.statusCode || 400).json({ error: result.error })
      return
    }

    // Notify student account
    if (result.certificate?.student_id) {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES ($1, $2, $3, 'certificate', '/student/certificates')`,
        [
          result.certificate.student_id,
          '🏆 New Certificate Issued!',
          `Your verified certificate for "${certTitle}" is now available to download.`
        ]
      ).catch(() => {})
    }

    res.status(201).json(result.certificate)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/admin/certificates/:id (Edit certificate metadata)
router.patch('/certificates/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, type, issueDate, description, status, program } = req.body

    const resSql = await query(
      `UPDATE certificates SET
        title = COALESCE($1, title),
        certificate_name = COALESCE($1, certificate_name),
        type = COALESCE($2, type),
        issue_date = COALESCE($3, issue_date),
        description = COALESCE($4, description),
        status = COALESCE($5, status),
        program = COALESCE($6, program),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 OR certificate_id = $7
       RETURNING *`,
      [title, type, issueDate, description, status, program, req.params.id]
    )

    if (resSql.rowCount === 0) {
      res.status(404).json({ error: 'Certificate not found' })
      return
    }

    await logAudit(req.user!.id, 'CERTIFICATE_UPDATED', 'certificates', req.params.id, req.body)
    res.json(resSql.rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/admin/certificates/:id/replace (Replace certificate PDF)
router.put('/certificates/:id/replace', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'New PDF file is required' })
      return
    }

    const check = await query(`SELECT * FROM certificates WHERE id = $1 OR certificate_id = $1`, [req.params.id])
    if (check.rows.length === 0) {
      res.status(404).json({ error: 'Certificate not found' })
      return
    }

    const cert = check.rows[0]
    const stored = await saveFile(req.file.buffer, `${cert.certificate_id}.pdf`, 'certificates')

    const updateRes = await query(
      `UPDATE certificates SET
        file_key = $1,
        file_url = $2,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [stored.fileKey, stored.fileUrl, cert.id]
    )

    await logAudit(req.user!.id, 'CERTIFICATE_FILE_REPLACED', 'certificates', cert.certificate_id, { fileKey: stored.fileKey })
    res.json(updateRes.rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/certificates/:id (Delete certificate record and file via MCP)
router.delete('/certificates/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await deleteCertificateTool({
      certificate_id: req.params.id,
      caller_user_id: req.user!.id,
      caller_role: req.user!.role
    })

    if (!result.success) {
      res.status(result.statusCode || 400).json({ error: result.error })
      return
    }

    res.json({ message: result.message })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/certificates/:id/view (Admin view PDF)
router.get('/certificates/:id/view', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const check = await query(
      `SELECT c.*, p.full_name as "studentName", p.university as "studentUniversity" 
       FROM certificates c 
       LEFT JOIN profiles p ON (c.student_id = p.user_id OR c.student_id = p.student_id)
       WHERE c.id = $1 OR certificate_id = $1`,
      [req.params.id]
    )
    if (check.rows.length === 0) {
      res.status(404).json({ error: 'Certificate not found' })
      return
    }
    const cert = check.rows[0]
    if (cert.file_key) {
      const physicalPath = getFilePath(cert.file_key)
      if (physicalPath && fs.existsSync(physicalPath)) {
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="${cert.certificate_id}.pdf"`)
        fs.createReadStream(physicalPath).pipe(res)
        return
      }
    }

    const pdfBuffer = generateCertificatePdfBuffer({
      studentName: cert.studentName,
      title: cert.title || cert.certificate_name,
      type: cert.type,
      certificate_id: cert.certificate_id,
      program: cert.program,
      issue_date: cert.issue_date,
      studentUniversity: cert.studentUniversity
    })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${cert.certificate_id}.pdf"`)
    res.send(pdfBuffer)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/certificates/:id/download (Admin download PDF)
router.get('/certificates/:id/download', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const check = await query(
      `SELECT c.*, p.full_name as "studentName", p.university as "studentUniversity" 
       FROM certificates c 
       LEFT JOIN profiles p ON (c.student_id = p.user_id OR c.student_id = p.student_id)
       WHERE c.id = $1 OR certificate_id = $1`,
      [req.params.id]
    )
    if (check.rows.length === 0) {
      res.status(404).json({ error: 'Certificate not found' })
      return
    }
    const cert = check.rows[0]
    const studentNameClean = (cert.studentName || 'Student').replace(/[^a-zA-Z0-9]/g, '_')
    const titleClean = (cert.title || cert.certificate_name || 'Certificate').replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${studentNameClean}_${titleClean}_Certificate.pdf`

    if (cert.file_key) {
      const physicalPath = getFilePath(cert.file_key)
      if (physicalPath && fs.existsSync(physicalPath)) {
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        fs.createReadStream(physicalPath).pipe(res)
        return
      }
    }

    const pdfBuffer = generateCertificatePdfBuffer({
      studentName: cert.studentName,
      title: cert.title || cert.certificate_name,
      type: cert.type,
      certificate_id: cert.certificate_id,
      program: cert.program,
      issue_date: cert.issue_date,
      studentUniversity: cert.studentUniversity
    })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(pdfBuffer)
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

    // Broadcast notification to all active students in Firestore
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
