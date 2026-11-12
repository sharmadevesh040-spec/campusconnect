import { Router, Response } from 'express'
import fs from 'fs'
import crypto from 'crypto'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import { query } from '../db'
import { getFilePath, generateSignedDownloadUrl } from '../storage'
import { generateCertificatePdfBuffer } from '../storage/pdfGenerator'

const router = Router()

// All student routes require student role (or admin inspection)
router.use(requireAuth)
router.use(requireRole('student', 'admin', 'super_admin'))

// GET /api/student/dashboard
router.get('/dashboard', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id

    // Next interview for this student from PostgreSQL
    const intRes = await query(
      `SELECT * FROM interviews 
       WHERE student_id = $1 AND status IN ('Scheduled', 'Confirmed', 'Rescheduled')
       ORDER BY date ASC, time ASC LIMIT 1`,
      [studentId]
    )
    const nextInterview = intRes.rows[0] || null

    // Pending tasks for this student
    const taskRes = await query(
      `SELECT * FROM tasks 
       WHERE student_id = $1 AND status IN ('Pending', 'In Progress')
       ORDER BY deadline ASC`,
      [studentId]
    )

    // Certificates for this student
    const certRes = await query(
      `SELECT * FROM certificates 
       WHERE student_id = $1 
          OR student_id IN (SELECT student_id FROM profiles WHERE user_id = $1)
          OR student_id IN (SELECT email FROM users WHERE id = $1)
       ORDER BY issue_date DESC`,
      [studentId]
    )

    // Upcoming events
    const evtRes = await query(
      `SELECT e.*, 
        EXISTS(SELECT 1 FROM event_registrations r WHERE r.event_id = e.id AND r.student_id = $1 AND r.status = 'Registered') as is_registered,
        (SELECT count(*) FROM event_registrations r WHERE r.event_id = e.id AND r.status = 'Registered')::int as attendee_count
       FROM events e
       WHERE date >= CURRENT_DATE - INTERVAL '1 day'
       ORDER BY date ASC`,
      [studentId]
    )
    const nextEvent = evtRes.rows[0] || null

    // Latest announcements
    const annRes = await query(
      `SELECT * FROM announcements ORDER BY publish_date DESC LIMIT 5`
    )

    // Unread notifications count
    const noteRes = await query(
      `SELECT count(*)::int FROM notifications WHERE user_id = $1 AND is_read = false`,
      [studentId]
    )
    const unreadCount = noteRes.rows[0]?.count || 0

    // Total interviews count
    const totalIntRes = await query(
      `SELECT count(*)::int FROM interviews WHERE student_id = $1`,
      [studentId]
    )

    res.json({
      stats: {
        upcomingInterviewsCount: totalIntRes.rows[0]?.count || 0,
        pendingTasksCount: taskRes.rows.length,
        certificatesCount: certRes.rows.length,
        upcomingEventsCount: evtRes.rows.length,
        unreadNotificationsCount: unreadCount
      },
      nextInterview,
      nextEvent,
      pendingTasks: taskRes.rows.slice(0, 5),
      certificates: certRes.rows.slice(0, 4),
      announcements: annRes.rows.slice(0, 3)
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load dashboard' })
  }
})

// GET /api/student/interviews
router.get('/interviews', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id
    const resSql = await query(
      `SELECT * FROM interviews WHERE student_id = $1 ORDER BY date ASC, time ASC`,
      [studentId]
    )
    res.json(resSql.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/student/interviews/:id
router.get('/interviews/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id
    const resSql = await query(`SELECT * FROM interviews WHERE id = $1`, [req.params.id])
    const interview = resSql.rows[0]

    if (!interview) {
      res.status(404).json({ error: 'Interview not found' })
      return
    }

    // Enforce student data isolation
    if (req.user!.role === 'student' && interview.student_id !== studentId) {
      res.status(403).json({ error: 'Forbidden: You cannot access another student interview' })
      return
    }

    res.json(interview)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/student/certificates
router.get('/certificates', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id
    const resSql = await query(
      `SELECT c.*, 
              COALESCE(c.title, c.certificate_name) as title,
              COALESCE(c.type, 'Participation') as type,
              p.full_name as "studentName", 
              u.email as "studentEmail", 
              p.student_id as "studentCode",
              p.university as "studentUniversity"
       FROM certificates c
       LEFT JOIN users u ON (c.student_id = u.id::text OR LOWER(c.student_id) = LOWER(u.email))
       LEFT JOIN profiles p ON (u.id = p.user_id OR c.student_id = p.student_id)
       WHERE c.student_id = $1 
          OR c.student_id IN (SELECT student_id FROM profiles WHERE user_id = $1)
          OR c.student_id IN (SELECT email FROM users WHERE id = $1)
       ORDER BY c.issue_date DESC, c.created_at DESC`,
      [studentId]
    )
    res.json(resSql.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/student/certificates/:id/view (Secure view verifying ownership)
router.get('/certificates/:id/view', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id
    const isPrivileged = req.user!.role === 'admin' || req.user!.role === 'super_admin'

    const resSql = await query(
      `SELECT c.*, 
              COALESCE(c.title, c.certificate_name) as title,
              COALESCE(c.type, 'Participation') as type,
              p.full_name as "studentName", 
              u.email as "studentEmail", 
              p.student_id as "studentCode",
              p.university as "studentUniversity"
       FROM certificates c
       LEFT JOIN users u ON (c.student_id = u.id::text OR LOWER(c.student_id) = LOWER(u.email))
       LEFT JOIN profiles p ON (u.id = p.user_id OR c.student_id = p.student_id)
       WHERE c.id = $1 OR LOWER(c.certificate_id) = LOWER($1)`,
      [req.params.id]
    )

    if (resSql.rows.length === 0) {
      res.status(404).json({ error: 'Certificate not found' })
      return
    }

    const cert = resSql.rows[0]

    // Verify ownership
    const ownsCert =
      cert.student_id === studentId ||
      cert.studentCode === req.user!.studentId ||
      cert.studentEmail?.toLowerCase() === req.user!.email.toLowerCase()

    if (!isPrivileged && !ownsCert) {
      res.status(403).json({ error: 'Forbidden: You cannot access another student certificate' })
      return
    }

    const filename = `${cert.certificate_id}.pdf`
    if (cert.file_key) {
      const physicalPath = getFilePath(cert.file_key)
      if (physicalPath && fs.existsSync(physicalPath)) {
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
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
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
    res.send(pdfBuffer)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/student/certificates/:id/download (Secure download verifying ownership)
router.get('/certificates/:id/download', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id
    const isPrivileged = req.user!.role === 'admin' || req.user!.role === 'super_admin'

    const resSql = await query(
      `SELECT c.*, 
              COALESCE(c.title, c.certificate_name) as title,
              COALESCE(c.type, 'Participation') as type,
              p.full_name as "studentName", 
              u.email as "studentEmail", 
              p.student_id as "studentCode",
              p.university as "studentUniversity"
       FROM certificates c
       LEFT JOIN users u ON (c.student_id = u.id::text OR LOWER(c.student_id) = LOWER(u.email))
       LEFT JOIN profiles p ON (u.id = p.user_id OR c.student_id = p.student_id)
       WHERE c.id = $1 OR LOWER(c.certificate_id) = LOWER($1)`,
      [req.params.id]
    )

    if (resSql.rows.length === 0) {
      res.status(404).json({ error: 'Certificate not found' })
      return
    }

    const cert = resSql.rows[0]

    // Verify ownership
    const ownsCert =
      cert.student_id === studentId ||
      cert.studentCode === req.user!.studentId ||
      cert.studentEmail?.toLowerCase() === req.user!.email.toLowerCase()

    if (!isPrivileged && !ownsCert) {
      res.status(403).json({ error: 'Forbidden: You cannot access another student certificate' })
      return
    }

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

// GET /api/student/certificates/:id/signed-url (Temporary signed URL)
router.get('/certificates/:id/signed-url', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id
    const isPrivileged = req.user!.role === 'admin' || req.user!.role === 'super_admin'

    const resSql = await query(
      `SELECT c.*, p.full_name as "studentName", u.email as "studentEmail", p.student_id as "studentCode"
       FROM certificates c
       LEFT JOIN users u ON (c.student_id = u.id::text OR LOWER(c.student_id) = LOWER(u.email))
       LEFT JOIN profiles p ON (u.id = p.user_id OR c.student_id = p.student_id)
       WHERE c.id = $1 OR LOWER(c.certificate_id) = LOWER($1)`,
      [req.params.id]
    )

    if (resSql.rows.length === 0) {
      res.status(404).json({ error: 'Certificate not found' })
      return
    }

    const cert = resSql.rows[0]
    const ownsCert =
      cert.student_id === studentId ||
      cert.studentCode === req.user!.studentId ||
      cert.studentEmail?.toLowerCase() === req.user!.email.toLowerCase()

    if (!isPrivileged && !ownsCert) {
      res.status(403).json({ error: 'Forbidden: You cannot access another student certificate' })
      return
    }

    const fileKey = cert.file_key || `certificates/${cert.certificate_id}.pdf`
    const signedUrl = generateSignedDownloadUrl(fileKey, studentId)

    res.json({
      signedUrl,
      certificateId: cert.certificate_id,
      expiresIn: 3600
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/student/events
router.get('/events', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id
    const resSql = await query(
      `SELECT e.*,
        EXISTS(SELECT 1 FROM event_registrations r WHERE r.event_id = e.id AND r.student_id = $1 AND r.status = 'Registered') as "isRegistered",
        (SELECT count(*) FROM event_registrations r WHERE r.event_id = e.id AND r.status = 'Registered')::int as "attendeeCount"
       FROM events e
       ORDER BY date ASC`,
      [studentId]
    )
    res.json(resSql.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/student/events/:id/register
router.post('/events/:id/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id
    const eventId = req.params.id

    const evtCheck = await query(`SELECT * FROM events WHERE id = $1`, [eventId])
    const event = evtCheck.rows[0]
    if (!event) {
      res.status(404).json({ error: 'Event not found' })
      return
    }

    await query(
      `INSERT INTO event_registrations (event_id, student_id, status)
       VALUES ($1, $2, 'Registered')
       ON CONFLICT (event_id, student_id) DO UPDATE SET status = 'Registered'`,
      [eventId, studentId]
    )

    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, 'event', $4)`,
      [
        studentId,
        'Event Registration Confirmed',
        `You are confirmed for ${event.title} on ${event.date}.`,
        `/student/events/${eventId}`
      ]
    )

    res.json({ message: 'Successfully registered for event' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/student/events/:id/cancel
router.post('/events/:id/cancel', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id
    const eventId = req.params.id
    await query(
      `UPDATE event_registrations SET status = 'Cancelled' WHERE event_id = $1 AND student_id = $2`,
      [eventId, studentId]
    )
    res.json({ message: 'Event registration cancelled' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/student/tasks
router.get('/tasks', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id
    const resSql = await query(
      `SELECT * FROM tasks WHERE student_id = $1 ORDER BY deadline ASC`,
      [studentId]
    )
    res.json(resSql.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/student/tasks/:id/status
router.patch('/tasks/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id
    const { status } = req.body

    const resSql = await query(
      `UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND student_id = $3
       RETURNING *`,
      [status, req.params.id, studentId]
    )

    if (resSql.rowCount === 0) {
      res.status(404).json({ error: 'Task not found or access denied' })
      return
    }

    res.json(resSql.rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/student/announcements
router.get('/announcements', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resSql = await query(`SELECT * FROM announcements ORDER BY publish_date DESC`)
    res.json(resSql.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/student/notifications
router.get('/notifications', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id
    const resSql = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [studentId]
    )
    res.json(resSql.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/student/notifications/:id/read
router.patch('/notifications/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id
    await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [req.params.id, studentId]
    )
    res.json({ message: 'Notification marked as read' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/student/notifications/read-all
router.patch('/notifications/read-all', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id
    await query(`UPDATE notifications SET is_read = true WHERE user_id = $1`, [studentId])
    res.json({ message: 'All notifications marked as read' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/student/profile
router.get('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id
    const resSql = await query(
      `SELECT p.*, u.email, u.role FROM profiles p JOIN users u ON p.user_id = u.id WHERE p.user_id = $1`,
      [studentId]
    )
    if (resSql.rows.length === 0) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }
    res.json(resSql.rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/student/profile
router.put('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id
    const { phone, university, college, course, branch, year, semester, skills, bio } = req.body

    const resSql = await query(
      `UPDATE profiles SET
        phone = COALESCE($1, phone),
        university = COALESCE($2, university),
        college = COALESCE($3, college),
        course = COALESCE($4, course),
        branch = COALESCE($5, branch),
        year = COALESCE($6, year),
        semester = COALESCE($7, semester),
        skills = COALESCE($8, skills),
        bio = COALESCE($9, bio),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $10
       RETURNING *`,
      [phone, university, college, course, branch, year, semester, skills, bio, studentId]
    )

    res.json(resSql.rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/student/resources
router.get('/resources', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resSql = await query(`SELECT * FROM resources ORDER BY title ASC`)
    res.json(resSql.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
