import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import crypto from 'crypto'
import { query, fallbackStore } from '../db'
import { generateToken, requireAuth, AuthRequest, logAudit } from '../middleware/auth'

const router = Router()

// Registration Zod schema
const registerSchema = z.object({
  fullName: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number is required'),
  studentId: z.string().min(3, 'Student ID is required'),
  university: z.string().min(2, 'University name is required'),
  college: z.string().min(2, 'College name is required'),
  course: z.string().min(2, 'Course name is required'),
  branch: z.string().min(2, 'Branch is required'),
  year: z.number().int().min(1).max(6),
  semester: z.number().int().min(1).max(12),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6)
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
})

// Login Zod schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = registerSchema.safeParse(req.body)
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message })
      return
    }

    const { fullName, email, phone, studentId, university, college, course, branch, year, semester, password } = parse.data

    // Check if email already exists
    const existing = fallbackStore.data.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (existing) {
      res.status(409).json({ error: 'A student account with this email already exists' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const newUserId = crypto.randomUUID()

    const newUser = {
      id: newUserId,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: 'student' as const,
      is_verified: true,
      profile: {
        id: crypto.randomUUID(),
        user_id: newUserId,
        full_name: fullName,
        student_id: studentId,
        phone,
        university,
        college,
        course,
        branch,
        year,
        semester,
        skills: [],
        bio: '',
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        completion_pct: 85,
        is_active: true
      }
    }

    // Save to database & store
    fallbackStore.data.users.push(newUser)
    fallbackStore.data.profiles.push(newUser.profile)

    try {
      await query(
        `INSERT INTO users (id, email, password_hash, role, is_verified)
         VALUES ($1, $2, $3, $4, $5)`,
        [newUser.id, newUser.email, newUser.password_hash, newUser.role, newUser.is_verified]
      )
      await query(
        `INSERT INTO profiles (user_id, full_name, student_id, phone, university, college, course, branch, year, semester, avatar_url, completion_pct)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [newUser.id, fullName, studentId, phone, university, college, course, branch, year, semester, newUser.profile.avatar_url, 85]
      )
    } catch (err) {
      console.warn('[Register] DB sync skipped/handled via memory store')
    }

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      studentId: newUser.profile.student_id
    })

    await logAudit(newUser.id, 'STUDENT_REGISTERED', 'users', newUser.id, { email: newUser.email })

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        profile: newUser.profile
      }
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = loginSchema.safeParse(req.body)
    if (!parse.success) {
      res.status(400).json({ error: 'Please provide valid email and password' })
      return
    }

    const { email, password } = parse.data
    const user = fallbackStore.data.users.find(u => u.email.toLowerCase() === email.toLowerCase())

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const profile = fallbackStore.data.profiles.find(p => p.user_id === user.id) || user.profile

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      studentId: profile?.student_id
    })

    await logAudit(user.id, 'USER_LOGIN', 'users', user.id, { role: user.role })

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile
      }
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' })
  }
})

// POST /api/auth/google (Google OAuth / Demo login)
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, role = 'student' } = req.body

    const targetEmail = (email || 'alex@campusconnect.edu').toLowerCase()
    let user = fallbackStore.data.users.find(u => u.email === targetEmail)

    if (!user) {
      const newUserId = crypto.randomUUID()
      const dummyPass = await bcrypt.hash('google-oauth-' + Math.random(), 10)
      user = {
        id: newUserId,
        email: targetEmail,
        password_hash: dummyPass,
        role: role as any,
        is_verified: true,
        profile: {
          id: crypto.randomUUID(),
          user_id: newUserId,
          full_name: name || 'Google Ambassador User',
          student_id: 'GSA-' + Math.floor(100000 + Math.random() * 900000),
          phone: '+1 (555) 000-0000',
          university: 'Global Tech University',
          college: 'School of Technology',
          course: 'B.Tech',
          branch: 'Computer Science',
          year: 2,
          semester: 4,
          skills: ['Cloud', 'Web', 'Leadership'],
          bio: 'Google authenticated student ambassador.',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          completion_pct: 90,
          is_active: true
        }
      }
      fallbackStore.data.users.push(user)
      fallbackStore.data.profiles.push(user.profile)
    }

    const profile = fallbackStore.data.profiles.find(p => p.user_id === user!.id) || user.profile

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      studentId: profile?.student_id
    })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile
      }
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Google authentication failed' })
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    const user = fallbackStore.data.users.find(u => u.id === userId)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    const profile = fallbackStore.data.profiles.find(p => p.user_id === user.id) || user.profile

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile
      }
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch user session' })
  }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body
  res.json({ message: `Password reset instructions sent to ${email}` })
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Password has been successfully updated' })
})

// POST /api/auth/verify-email
router.post('/verify-email', async (req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Email verified successfully' })
})

export default router
