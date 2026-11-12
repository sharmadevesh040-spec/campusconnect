import { Router, Response } from 'express'
import crypto from 'crypto'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import { fallbackStore } from '../db'

const router = Router()

// All student routes require student role (or admin testing)
router.use(requireAuth)
router.use(requireRole('student', 'admin', 'super_admin'))

// GET /api/student/dashboard
router.get('/dashboard', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id

    // Next interview for this student
    const myInterviews = fallbackStore.data.interviews.filter(i => i.student_id === studentId)
    const nextInterview = myInterviews
      .filter(i => ['Scheduled', 'Confirmed', 'Rescheduled'].includes(i.status))
      .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())[0] || null

    // Pending tasks for this student
    const myTasks = fallbackStore.data.tasks.filter(t => t.student_id === studentId)
    const pendingTasks = myTasks.filter(t => ['Pending', 'In Progress'].includes(t.status))

    // Certificates for this student
    const myCertificates = fallbackStore.data.certificates.filter(c => c.student_id === studentId && c.status === 'Valid')

    // Upcoming events
    const upcomingEvents = fallbackStore.data.events.filter(e => new Date(e.date).getTime() >= Date.now() - 86400000)
    const nextEvent = upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || null

    // Latest announcements
    const announcements = fallbackStore.data.announcements.slice(0, 5)

    // Unread notifications
    const unreadCount = fallbackStore.data.notifications.filter(n => n.user_id === studentId && !n.is_read).length

    res.json({
      stats: {
        upcomingInterviewsCount: myInterviews.length,
        pendingTasksCount: pendingTasks.length,
        certificatesCount: myCertificates.length,
        upcomingEventsCount: upcomingEvents.length,
        unreadNotificationsCount: unreadCount
      },
      nextInterview,
      nextEvent,
      pendingTasks: pendingTasks.slice(0, 5),
      certificates: myCertificates.slice(0, 4),
      announcements: announcements.slice(0, 3)
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load dashboard' })
  }
})

// GET /api/student/interviews
router.get('/interviews', async (req: AuthRequest, res: Response): Promise<void> => {
  const studentId = req.user!.id
  const interviews = fallbackStore.data.interviews.filter(i => i.student_id === studentId)
  res.json(interviews)
})

// GET /api/student/interviews/:id
router.get('/interviews/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const studentId = req.user!.id
  const interview = fallbackStore.data.interviews.find(i => i.id === req.params.id)
  
  if (!interview) {
    res.status(404).json({ error: 'Interview not found' })
    return
  }

  // Enforce student ownership
  if (req.user!.role === 'student' && interview.student_id !== studentId) {
    res.status(403).json({ error: 'Forbidden: You cannot access another student interview' })
    return
  }

  res.json(interview)
})

// GET /api/student/certificates
router.get('/certificates', async (req: AuthRequest, res: Response): Promise<void> => {
  const studentId = req.user!.id
  const certificates = fallbackStore.data.certificates.filter(c => c.student_id === studentId)
  res.json(certificates)
})

// GET /api/student/events
router.get('/events', async (req: AuthRequest, res: Response): Promise<void> => {
  const studentId = req.user!.id
  const events = fallbackStore.data.events.map(event => {
    const isRegistered = fallbackStore.data.event_registrations.some(
      r => r.event_id === event.id && r.student_id === studentId && r.status === 'Registered'
    )
    const attendeeCount = fallbackStore.data.event_registrations.filter(
      r => r.event_id === event.id && r.status === 'Registered'
    ).length
    return {
      ...event,
      isRegistered,
      attendeeCount
    }
  })
  res.json(events)
})

// POST /api/student/events/:id/register
router.post('/events/:id/register', async (req: AuthRequest, res: Response): Promise<void> => {
  const studentId = req.user!.id
  const eventId = req.params.id
  const event = fallbackStore.data.events.find(e => e.id === eventId)

  if (!event) {
    res.status(404).json({ error: 'Event not found' })
    return
  }

  const existing = fallbackStore.data.event_registrations.find(
    r => r.event_id === eventId && r.student_id === studentId
  )

  if (existing && existing.status === 'Registered') {
    res.status(409).json({ error: 'You are already registered for this event' })
    return
  }

  const currentCount = fallbackStore.data.event_registrations.filter(
    r => r.event_id === eventId && r.status === 'Registered'
  ).length

  if (currentCount >= event.max_participants) {
    res.status(400).json({ error: 'Registration is full for this event' })
    return
  }

  if (existing) {
    existing.status = 'Registered'
    existing.registered_at = new Date().toISOString()
  } else {
    fallbackStore.data.event_registrations.push({
      id: crypto.randomUUID(),
      event_id: eventId,
      student_id: studentId,
      status: 'Registered',
      registered_at: new Date().toISOString()
    })
  }

  // Create notification
  fallbackStore.data.notifications.push({
    id: crypto.randomUUID(),
    user_id: studentId,
    title: 'Event Registration Confirmed',
    message: `You are confirmed for ${event.title} on ${event.date}.`,
    type: 'event',
    is_read: false,
    link: `/student/events/${eventId}`,
    created_at: new Date().toISOString()
  })

  res.json({ message: 'Successfully registered for event' })
})

// POST /api/student/events/:id/cancel
router.post('/events/:id/cancel', async (req: AuthRequest, res: Response): Promise<void> => {
  const studentId = req.user!.id
  const eventId = req.params.id
  const reg = fallbackStore.data.event_registrations.find(
    r => r.event_id === eventId && r.student_id === studentId
  )

  if (reg) {
    reg.status = 'Cancelled'
  }

  res.json({ message: 'Event registration cancelled' })
})

// GET /api/student/tasks
router.get('/tasks', async (req: AuthRequest, res: Response): Promise<void> => {
  const studentId = req.user!.id
  const tasks = fallbackStore.data.tasks.filter(t => t.student_id === studentId)
  res.json(tasks)
})

// PATCH /api/student/tasks/:id/status
router.patch('/tasks/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  const studentId = req.user!.id
  const { status } = req.body
  const task = fallbackStore.data.tasks.find(t => t.id === req.params.id)

  if (!task) {
    res.status(404).json({ error: 'Task not found' })
    return
  }

  if (req.user!.role === 'student' && task.student_id !== studentId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  task.status = status
  task.updated_at = new Date().toISOString()

  res.json(task)
})

// GET /api/student/announcements
router.get('/announcements', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json(fallbackStore.data.announcements)
})

// GET /api/student/notifications
router.get('/notifications', async (req: AuthRequest, res: Response): Promise<void> => {
  const studentId = req.user!.id
  const notes = fallbackStore.data.notifications.filter(n => n.user_id === studentId)
  res.json(notes)
})

// PATCH /api/student/notifications/:id/read
router.patch('/notifications/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  const studentId = req.user!.id
  const note = fallbackStore.data.notifications.find(n => n.id === req.params.id && n.user_id === studentId)
  if (note) {
    note.is_read = true
  }
  res.json({ message: 'Notification marked as read' })
})

// PATCH /api/student/notifications/read-all
router.patch('/notifications/read-all', async (req: AuthRequest, res: Response): Promise<void> => {
  const studentId = req.user!.id
  fallbackStore.data.notifications.forEach(n => {
    if (n.user_id === studentId) n.is_read = true
  })
  res.json({ message: 'All notifications marked as read' })
})

// GET /api/student/profile
router.get('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  const studentId = req.user!.id
  const profile = fallbackStore.data.profiles.find(p => p.user_id === studentId)
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' })
    return
  }
  res.json(profile)
})

// PUT /api/student/profile
router.put('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  const studentId = req.user!.id
  const profile = fallbackStore.data.profiles.find(p => p.user_id === studentId)
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' })
    return
  }

  const { phone, university, college, course, branch, year, semester, skills, bio } = req.body
  if (phone !== undefined) profile.phone = phone
  if (university !== undefined) profile.university = university
  if (college !== undefined) profile.college = college
  if (course !== undefined) profile.course = course
  if (branch !== undefined) profile.branch = branch
  if (year !== undefined) profile.year = year
  if (semester !== undefined) profile.semester = semester
  if (skills !== undefined) profile.skills = skills
  if (bio !== undefined) profile.bio = bio
  profile.updated_at = new Date().toISOString()

  res.json(profile)
})

// GET /api/student/resources
router.get('/resources', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json(fallbackStore.data.resources)
})

export default router
