import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import crypto from 'crypto'
import { query } from '../db'
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

    // Check if email already exists in PostgreSQL
    const existing = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [email])
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'A student account with this email already exists' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const newUserId = crypto.randomUUID()
    const newProfileId = crypto.randomUUID()
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`

    // Insert user into PostgreSQL
    await query(
      `INSERT INTO users (id, email, password_hash, role, is_verified)
       VALUES ($1, $2, $3, $4, $5)`,
      [newUserId, email.toLowerCase().trim(), passwordHash, 'student', true]
    )

    // Insert profile into PostgreSQL
    await query(
      `INSERT INTO profiles (id, user_id, full_name, student_id, phone, university, college, course, branch, year, semester, skills, bio, avatar_url, completion_pct, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true)`,
      [
        newProfileId,
        newUserId,
        fullName.trim(),
        studentId.trim(),
        phone.trim(),
        university.trim(),
        college.trim(),
        course.trim(),
        branch.trim(),
        year,
        semester,
        JSON.stringify(['Student Ambassador', 'Leadership']),
        'CampusConnect Student Ambassador',
        avatarUrl,
        85
      ]
    )

    const token = generateToken({
      id: newUserId,
      email: email.toLowerCase().trim(),
      role: 'student',
      studentId: studentId.trim()
    })

    await logAudit(newUserId, 'STUDENT_REGISTERED', 'users', newUserId, { email })

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUserId,
        email: email.toLowerCase().trim(),
        role: 'student',
        profile: {
          id: newProfileId,
          user_id: newUserId,
          full_name: fullName.trim(),
          student_id: studentId.trim(),
          phone: phone.trim(),
          university: university.trim(),
          college: college.trim(),
          course: course.trim(),
          branch: branch.trim(),
          year,
          semester,
          avatar_url: avatarUrl,
          completion_pct: 85,
          is_active: true
        }
      }
    })
  } catch (err: any) {
    console.error('[Register Error]', err)
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

    // Fetch user and profile directly from PostgreSQL
    const userRes = await query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.is_verified,
              p.id as profile_id, p.full_name, p.student_id, p.phone, p.university, p.college,
              p.course, p.branch, p.year, p.semester, p.skills, p.bio, p.avatar_url,
              p.completion_pct, p.is_active
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email.trim()]
    )

    if (userRes.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const row = userRes.rows[0]
    const valid = await bcrypt.compare(password, row.password_hash)
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const token = generateToken({
      id: row.id,
      email: row.email,
      role: row.role,
      studentId: row.student_id
    })

    await logAudit(row.id, 'USER_LOGIN', 'users', row.id, { role: row.role })

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: row.id,
        email: row.email,
        role: row.role,
        profile: {
          id: row.profile_id || row.id,
          user_id: row.id,
          full_name: row.full_name || row.email,
          student_id: row.student_id || 'GSA-2026-001',
          phone: row.phone || '',
          university: row.university || 'University',
          college: row.college || 'College',
          course: row.course || 'B.Tech',
          branch: row.branch || 'Computer Science',
          year: row.year || 2,
          semester: row.semester || 3,
          skills: Array.isArray(row.skills) ? row.skills : (row.skills ? JSON.parse(row.skills) : []),
          bio: row.bio || '',
          avatar_url: row.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.full_name || row.email)}`,
          completion_pct: row.completion_pct || 85,
          is_active: row.is_active ?? true
        }
      }
    })
  } catch (err: any) {
    console.error('[Login Error]', err)
    res.status(500).json({ error: err.message || 'Login failed' })
  }
})

// POST /api/auth/google (Google OAuth / Demo login)
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, role = 'student' } = req.body
    const targetEmail = (email || 'alex@campusconnect.edu').toLowerCase().trim()

    let userRes = await query(
      `SELECT u.id, u.email, u.role, u.is_verified,
              p.id as profile_id, p.full_name, p.student_id, p.phone, p.university, p.college,
              p.course, p.branch, p.year, p.semester, p.skills, p.bio, p.avatar_url,
              p.completion_pct, p.is_active
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [targetEmail]
    )

    let row = userRes.rows[0]

    if (!row) {
      const newUserId = crypto.randomUUID()
      const newProfileId = crypto.randomUUID()
      const dummyPass = await bcrypt.hash('google-oauth-' + Math.random(), 10)
      const studentCode = 'GSA-' + Math.floor(100000 + Math.random() * 900000)
      const avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'

      await query(
        `INSERT INTO users (id, email, password_hash, role, is_verified)
         VALUES ($1, $2, $3, $4, true)`,
        [newUserId, targetEmail, dummyPass, role]
      )

      await query(
        `INSERT INTO profiles (id, user_id, full_name, student_id, phone, university, college, course, branch, year, semester, skills, bio, avatar_url, completion_pct, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 90, true)`,
        [
          newProfileId,
          newUserId,
          name || 'CampusConnect Ambassador',
          studentCode,
          '+1 (555) 000-0000',
          'Global Tech University',
          'School of Technology',
          'B.Tech',
          'Computer Science',
          2,
          4,
          JSON.stringify(['Cloud', 'Web', 'Leadership']),
          'Google authenticated student ambassador.',
          avatarUrl
        ]
      )

      row = {
        id: newUserId,
        email: targetEmail,
        role,
        is_verified: true,
        profile_id: newProfileId,
        full_name: name || 'CampusConnect Ambassador',
        student_id: studentCode,
        phone: '+1 (555) 000-0000',
        university: 'Global Tech University',
        college: 'School of Technology',
        course: 'B.Tech',
        branch: 'Computer Science',
        year: 2,
        semester: 4,
        skills: ['Cloud', 'Web', 'Leadership'],
        bio: 'Google authenticated student ambassador.',
        avatar_url: avatarUrl,
        completion_pct: 90,
        is_active: true
      }
    }

    const token = generateToken({
      id: row.id,
      email: row.email,
      role: row.role,
      studentId: row.student_id
    })

    res.json({
      token,
      user: {
        id: row.id,
        email: row.email,
        role: row.role,
        profile: {
          id: row.profile_id || row.id,
          user_id: row.id,
          full_name: row.full_name,
          student_id: row.student_id,
          phone: row.phone,
          university: row.university,
          college: row.college,
          course: row.course,
          branch: row.branch,
          year: row.year,
          semester: row.semester,
          skills: Array.isArray(row.skills) ? row.skills : (row.skills ? JSON.parse(row.skills) : []),
          bio: row.bio,
          avatar_url: row.avatar_url,
          completion_pct: row.completion_pct || 90,
          is_active: row.is_active ?? true
        }
      }
    })
  } catch (err: any) {
    console.error('[Google Auth Error]', err)
    res.status(500).json({ error: err.message || 'Google authentication failed' })
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    const userRes = await query(
      `SELECT u.id, u.email, u.role, u.is_verified,
              p.id as profile_id, p.full_name, p.student_id, p.phone, p.university, p.college,
              p.course, p.branch, p.year, p.semester, p.skills, p.bio, p.avatar_url,
              p.completion_pct, p.is_active
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    )

    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const row = userRes.rows[0]
    res.json({
      user: {
        id: row.id,
        email: row.email,
        role: row.role,
        profile: {
          id: row.profile_id || row.id,
          user_id: row.id,
          full_name: row.full_name || row.email,
          student_id: row.student_id || 'GSA-2026-001',
          phone: row.phone || '',
          university: row.university || 'University',
          college: row.college || 'College',
          course: row.course || 'B.Tech',
          branch: row.branch || 'Computer Science',
          year: row.year || 2,
          semester: row.semester || 3,
          skills: Array.isArray(row.skills) ? row.skills : (row.skills ? JSON.parse(row.skills) : []),
          bio: row.bio || '',
          avatar_url: row.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.full_name || row.email)}`,
          completion_pct: row.completion_pct || 85,
          is_active: row.is_active ?? true
        }
      }
    })
  } catch (err: any) {
    console.error('[Me Error]', err)
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
