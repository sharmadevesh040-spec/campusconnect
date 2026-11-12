import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import crypto from 'crypto'
import { query } from '../db'
import { generateToken, requireAuth, AuthRequest, logAudit } from '../middleware/auth'
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendLoginOTPEmail
} from '../services/email'

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

// POST /api/auth/register (Registers student and sends SMTP verification email)
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = registerSchema.safeParse(req.body)
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message })
      return
    }

    const { fullName, email, phone, studentId, university, college, course, branch, year, semester, password } = parse.data
    const normalizedEmail = email.toLowerCase().trim()

    // Check if email already exists in PostgreSQL
    const existing = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [normalizedEmail])
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'A student account with this email already exists' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const newUserId = crypto.randomUUID()
    const newProfileId = crypto.randomUUID()
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`

    // Insert user into PostgreSQL (initially unverified pending email verification)
    await query(
      `INSERT INTO users (id, email, password_hash, role, is_verified)
       VALUES ($1, $2, $3, $4, false)`,
      [newUserId, normalizedEmail, passwordHash, 'student']
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
        ['Student Ambassador', 'Leadership'],
        'CampusConnect Student Ambassador',
        avatarUrl,
        85
      ]
    )

    // Generate 6-digit verification code & store in email_tokens
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    await query(
      `INSERT INTO email_tokens (email, token, type, expires_at)
       VALUES ($1, $2, 'verification', CURRENT_TIMESTAMP + INTERVAL '15 minutes')`,
      [normalizedEmail, verificationCode]
    )

    // Send verification email via SMTP
    await sendVerificationEmail(normalizedEmail, verificationCode, fullName.trim())

    const token = generateToken({
      id: newUserId,
      email: normalizedEmail,
      role: 'student',
      studentId: studentId.trim()
    })

    await logAudit(newUserId, 'STUDENT_REGISTERED', 'users', newUserId, { email: normalizedEmail })

    res.status(201).json({
      message: 'Registration successful! Verification code sent to your email via SMTP.',
      token,
      requiresVerification: true,
      user: {
        id: newUserId,
        email: normalizedEmail,
        role: 'student',
        is_verified: false,
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
    const normalizedEmail = email.toLowerCase().trim()

    // Fetch user and profile directly from PostgreSQL
    const userRes = await query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.is_verified,
              p.id as profile_id, p.full_name, p.student_id, p.phone, p.university, p.college,
              p.course, p.branch, p.year, p.semester, p.skills, p.bio, p.avatar_url,
              p.completion_pct, p.is_active
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [normalizedEmail]
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
        is_verified: row.is_verified,
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

// POST /api/auth/send-login-otp (SMTP One-Time Passcode Login)
router.post('/send-login-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ error: 'Email is required' })
      return
    }

    const normalizedEmail = email.toLowerCase().trim()
    const userRes = await query(
      `SELECT u.id, p.full_name FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE LOWER(u.email) = LOWER($1)`,
      [normalizedEmail]
    )

    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'No account registered with this email address.' })
      return
    }

    const user = userRes.rows[0]
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store in email_tokens
    await query(
      `INSERT INTO email_tokens (email, token, type, expires_at)
       VALUES ($1, $2, 'login_otp', CURRENT_TIMESTAMP + INTERVAL '10 minutes')`,
      [normalizedEmail, otp]
    )

    // Send via SMTP
    await sendLoginOTPEmail(normalizedEmail, otp, user.full_name || 'Student')

    res.json({
      message: `A 6-digit login passcode has been sent to ${normalizedEmail} via SMTP.`,
      email: normalizedEmail
    })
  } catch (err: any) {
    console.error('[Send Login OTP Error]', err)
    res.status(500).json({ error: err.message || 'Failed to dispatch login OTP' })
  }
})

// POST /api/auth/login-otp (Authenticate via SMTP OTP)
router.post('/login-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      res.status(400).json({ error: 'Email and OTP code are required' })
      return
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check valid token in email_tokens
    const tokenRes = await query(
      `SELECT id FROM email_tokens
       WHERE LOWER(email) = LOWER($1) AND token = $2 AND type = 'login_otp' AND used = false AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail, otp.trim()]
    )

    if (tokenRes.rows.length === 0) {
      res.status(400).json({ error: 'Invalid or expired passcode. Please request a new code.' })
      return
    }

    // Mark token as used
    await query(`UPDATE email_tokens SET used = true WHERE id = $1`, [tokenRes.rows[0].id])

    // Fetch user & profile
    const userRes = await query(
      `SELECT u.id, u.email, u.role, u.is_verified,
              p.id as profile_id, p.full_name, p.student_id, p.phone, p.university, p.college,
              p.course, p.branch, p.year, p.semester, p.skills, p.bio, p.avatar_url,
              p.completion_pct, p.is_active
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [normalizedEmail]
    )

    const row = userRes.rows[0]
    const token = generateToken({
      id: row.id,
      email: row.email,
      role: row.role,
      studentId: row.student_id
    })

    await logAudit(row.id, 'USER_LOGIN_OTP', 'users', row.id, { role: row.role })

    res.json({
      message: 'Passcode verified successfully. Logged in!',
      token,
      user: {
        id: row.id,
        email: row.email,
        role: row.role,
        is_verified: true,
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
    console.error('[Login OTP Error]', err)
    res.status(500).json({ error: err.message || 'OTP verification failed' })
  }
})

// POST /api/auth/verify-email (Verify email using SMTP code)
router.post('/verify-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body
    if (!email || !code) {
      res.status(400).json({ error: 'Email and verification code are required' })
      return
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Validate in email_tokens
    const tokenRes = await query(
      `SELECT id FROM email_tokens
       WHERE LOWER(email) = LOWER($1) AND token = $2 AND type = 'verification' AND used = false AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail, code.trim()]
    )

    if (tokenRes.rows.length === 0) {
      res.status(400).json({ error: 'Invalid or expired verification code. Please request a new one.' })
      return
    }

    // Mark token as used
    await query(`UPDATE email_tokens SET used = true WHERE id = $1`, [tokenRes.rows[0].id])

    // Update user is_verified in PostgreSQL
    await query(`UPDATE users SET is_verified = true WHERE LOWER(email) = LOWER($1)`, [normalizedEmail])

    res.json({ message: 'Email verified successfully! Your account is now active.' })
  } catch (err: any) {
    console.error('[Verify Email Error]', err)
    res.status(500).json({ error: err.message || 'Email verification failed' })
  }
})

// POST /api/auth/resend-verification (Resend SMTP verification email)
router.post('/resend-verification', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ error: 'Email is required' })
      return
    }

    const normalizedEmail = email.toLowerCase().trim()
    const userRes = await query(
      `SELECT u.id, p.full_name FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE LOWER(u.email) = LOWER($1)`,
      [normalizedEmail]
    )

    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()

    await query(
      `INSERT INTO email_tokens (email, token, type, expires_at)
       VALUES ($1, $2, 'verification', CURRENT_TIMESTAMP + INTERVAL '15 minutes')`,
      [normalizedEmail, code]
    )

    await sendVerificationEmail(normalizedEmail, code, userRes.rows[0].full_name || 'Student')

    res.json({ message: `Verification code resent to ${normalizedEmail} via SMTP.` })
  } catch (err: any) {
    console.error('[Resend Verification Error]', err)
    res.status(500).json({ error: err.message || 'Failed to resend verification email' })
  }
})

// POST /api/auth/forgot-password (Dispatch password reset code via SMTP)
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ error: 'Email is required' })
      return
    }

    const normalizedEmail = email.toLowerCase().trim()
    const userRes = await query(
      `SELECT u.id, p.full_name FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE LOWER(u.email) = LOWER($1)`,
      [normalizedEmail]
    )

    if (userRes.rows.length === 0) {
      // Return success even if email not found to prevent user enumeration
      res.json({ message: `If an account exists with ${normalizedEmail}, a password reset code has been sent via SMTP.` })
      return
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()

    await query(
      `INSERT INTO email_tokens (email, token, type, expires_at)
       VALUES ($1, $2, 'password_reset', CURRENT_TIMESTAMP + INTERVAL '15 minutes')`,
      [normalizedEmail, resetCode]
    )

    await sendPasswordResetEmail(normalizedEmail, resetCode, userRes.rows[0].full_name || 'User')

    res.json({
      message: `A password reset code has been dispatched to ${normalizedEmail} via SMTP.`,
      email: normalizedEmail
    })
  } catch (err: any) {
    console.error('[Forgot Password Error]', err)
    res.status(500).json({ error: err.message || 'Failed to process password reset request' })
  }
})

// POST /api/auth/reset-password (Reset password with code verified against PostgreSQL)
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body
    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'Email, reset code, and new password are required' })
      return
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' })
      return
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Validate in email_tokens
    const tokenRes = await query(
      `SELECT id FROM email_tokens
       WHERE LOWER(email) = LOWER($1) AND token = $2 AND type = 'password_reset' AND used = false AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail, code.trim()]
    )

    if (tokenRes.rows.length === 0) {
      res.status(400).json({ error: 'Invalid or expired password reset code. Please request a new code.' })
      return
    }

    // Hash new password and update in PostgreSQL
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await query(`UPDATE users SET password_hash = $1 WHERE LOWER(email) = LOWER($2)`, [passwordHash, normalizedEmail])

    // Mark token used
    await query(`UPDATE email_tokens SET used = true WHERE id = $1`, [tokenRes.rows[0].id])

    res.json({ message: 'Your password has been successfully updated. You can now sign in.' })
  } catch (err: any) {
    console.error('[Reset Password Error]', err)
    res.status(500).json({ error: err.message || 'Password reset failed' })
  }
})

// GET /api/auth/me (Current user session)
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
        is_verified: row.is_verified,
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

export default router
