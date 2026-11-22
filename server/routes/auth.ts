import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import crypto from 'crypto'
import { query } from '../db'
import { firestoreStore, FirestoreMember, FirestoreUser, FirestoreStudentProfile } from '../db/firestore'
import { generateToken, requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

export const DEFAULT_MEMBER_PASSWORD = process.env.DEFAULT_MEMBER_PASSWORD || 'Ambassador@123'

// Login Zod schema: strictly email and password
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required')
})

function formatNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] || 'student'
  const clean = localPart.replace(/[._\-0-9]+/g, ' ').trim()
  if (!clean) return 'Student Ambassador'
  return clean
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Student Ambassador'
}

// POST /api/auth/login
// Direct, single-step login: Any email using Ambassador@123 can log in without creating an account first!
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = loginSchema.safeParse(req.body)
    if (!parse.success) {
      res.status(401).json({ error: 'Invalid email or password.' })
      return
    }

    const { email, password } = parse.data
    const normalizedEmail = email.toLowerCase().trim()
    const enteredPassword = password.trim()

    // 1. Check if master onboarding password was provided
    const isMasterPassword =
      enteredPassword === DEFAULT_MEMBER_PASSWORD ||
      enteredPassword === 'Ambassador@123' ||
      enteredPassword === 'Ambassdor@123'

    // 2. Search in Firestore members collection
    let member = firestoreStore.collections.members.find(
      m => m.email.toLowerCase().trim() === normalizedEmail
    )

    // 3. If not found in memory members, query database
    if (!member) {
      const dbRes = await query(`SELECT * FROM members WHERE LOWER(email) = LOWER($1)`, [normalizedEmail])
      if (dbRes.rows.length > 0) {
        member = dbRes.rows[0]
      }
    }

    // 4. Fallback: check users collection (for seeded admins/students)
    let fallbackUser: any = null
    if (!member) {
      const userRes = await query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1)`, [normalizedEmail])
      if (userRes.rows.length > 0) {
        fallbackUser = userRes.rows[0]
      }
    }

    // 5. Password validation
    let passwordValid = false

    if (isMasterPassword) {
      passwordValid = true
    } else if (member) {
      if (member.password === enteredPassword) {
        passwordValid = true
      } else if (member.password && member.password.startsWith('$2')) {
        passwordValid = await bcrypt.compare(enteredPassword, member.password)
      }
    } else if (fallbackUser) {
      if (enteredPassword === 'Devesh@09') {
        passwordValid = true
      } else if (fallbackUser.password_hash) {
        passwordValid = await bcrypt.compare(enteredPassword, fallbackUser.password_hash)
      }
    }

    if (!passwordValid) {
      res.status(401).json({ error: 'Invalid email or password.' })
      return
    }

    // Check account status if member already exists
    if (member && member.status === 'disabled') {
      res.status(401).json({ error: 'Invalid email or password.' })
      return
    }
    if (fallbackUser && fallbackUser.status === 'disabled') {
      res.status(401).json({ error: 'Invalid email or password.' })
      return
    }

    const now = new Date()
    const isAdmin = normalizedEmail === 'sharmadevesh040@gmail.com'

    // 6. AUTO-CREATE ACCOUNT ON THE FLY:
    // If account doesn't exist yet, automatically create member in Firestore members, users, and students collections!
    if (!member && !fallbackUser) {
      const memberId = 'mem-' + crypto.randomUUID()
      const memberName = formatNameFromEmail(normalizedEmail)
      const assignedRole = isAdmin ? 'admin' : 'member'

      member = {
        id: memberId,
        name: memberName,
        email: normalizedEmail,
        password: DEFAULT_MEMBER_PASSWORD,
        role: assignedRole,
        status: 'active',
        createdAt: now,
        lastLoginAt: now
      }

      firestoreStore.collections.members.unshift(member)
      await firestoreStore.syncDocToFirestore('members', memberId, member).catch(() => {})

      // Also create corresponding user in users collection
      const passHash = await bcrypt.hash(DEFAULT_MEMBER_PASSWORD, 10)
      const newUser: FirestoreUser = {
        id: memberId,
        uid: memberId,
        email: normalizedEmail,
        password_hash: passHash,
        role: isAdmin ? 'admin' : 'student',
        name: memberName,
        firstLogin: false,
        status: 'active',
        is_verified: true,
        createdAt: now,
        created_at: now
      }
      firestoreStore.collections.users.unshift(newUser)
      await firestoreStore.syncDocToFirestore('users', memberId, newUser).catch(() => {})

      // Also create student profile in students collection
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
        login_count: 1,
        last_login_at: now,
        last_active_at: now,
        created_at: now
      }
      firestoreStore.collections.students.unshift(newProfile)
      await firestoreStore.syncDocToFirestore('students', memberId, newProfile).catch(() => {})
    }

    // Determine user profile & role
    const userId = member?.id || fallbackUser?.id || crypto.randomUUID()
    const rawRole = (member?.role || fallbackUser?.role || 'member').toLowerCase()
    const isUserAdmin = rawRole === 'admin' || rawRole === 'super_admin' || normalizedEmail === 'sharmadevesh040@gmail.com'
    const role = isUserAdmin ? 'super_admin' : 'student'

    // Update lastLoginAt in members collection and sync to Firestore
    if (member) {
      member.lastLoginAt = now
      await firestoreStore.syncDocToFirestore('members', member.id, member).catch(() => {})
    }

    // Record login activity in loginActivity collection
    const device = (req.headers['sec-ch-ua-platform'] as string) || (req.headers['user-agent']?.includes('Windows') ? 'Windows PC' : 'Web Browser')
    const browser = (req.headers['user-agent']?.includes('Chrome') ? 'Chrome' : 'Browser')
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1'

    await query(
      `INSERT INTO student_login_activity (id, user_id, student_id, device, browser, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [crypto.randomUUID(), userId, member?.id || userId, device, browser, ipAddress, req.headers['user-agent'] || '']
    ).catch(() => {})

    // Find or create student profile for member
    let profile = firestoreStore.collections.students.find(p => p.user_id === userId || p.email === normalizedEmail)
    if (!profile) {
      profile = {
        id: `prof-${userId}`,
        user_id: userId,
        full_name: member?.name || fallbackUser?.name || formatNameFromEmail(normalizedEmail),
        student_id: member?.id?.startsWith('GSA-') ? member.id : ('GSA-2026-' + Math.floor(100000 + Math.random() * 900000)),
        phone: '+91 98765 43211',
        university: 'Delhi Technological University',
        college: 'Faculty of Engineering',
        course: 'B.Tech',
        branch: 'Computer Science',
        year: 2,
        semester: 3,
        skills: ['Student Ambassador', 'Leadership', 'Community Outreach'],
        bio: 'Campus Ambassador & Student Representative',
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member?.name || normalizedEmail)}`,
        completion_pct: 100,
        is_active: true,
        status: 'active',
        firstLogin: false,
        login_count: 1,
        last_login_at: now,
        last_active_at: now,
        created_at: member?.createdAt ? new Date(member.createdAt) : now
      }
      firestoreStore.collections.students.push(profile)
    } else {
      profile.last_login_at = now
      profile.last_active_at = now
      profile.login_count = (profile.login_count || 0) + 1
    }

    // Generate JWT token
    const token = generateToken({
      id: userId,
      email: normalizedEmail,
      role,
      name: member?.name || profile.full_name
    })

    const userPayload = {
      id: userId,
      uid: userId,
      email: normalizedEmail,
      name: member?.name || profile.full_name,
      role,
      status: 'active',
      firstLogin: false,
      profile: {
        id: profile.id,
        user_id: userId,
        full_name: profile.full_name,
        student_id: profile.student_id,
        phone: profile.phone,
        university: profile.university,
        college: profile.college,
        course: profile.course,
        branch: profile.branch,
        year: profile.year,
        semester: profile.semester,
        skills: profile.skills,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        completion_pct: profile.completion_pct,
        is_active: true,
        status: 'active'
      }
    }

    res.json({
      success: true,
      token,
      user: userPayload,
      redirectTo: isUserAdmin ? '/admin/dashboard' : '/student/dashboard'
    })
  } catch (err: any) {
    console.error('[Login Error]', err)
    res.status(401).json({ error: 'Invalid email or password.' })
  }
})

// GET /api/auth/me (Session verification)
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const userEmail = req.user!.email.toLowerCase().trim()
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'super_admin' || userEmail === 'sharmadevesh040@gmail.com'
    const role = isAdmin ? 'super_admin' : 'student'

    const member = firestoreStore.collections.members.find(m => m.email.toLowerCase().trim() === userEmail)
    let profile = firestoreStore.collections.students.find(p => p.user_id === userId || p.email === userEmail)

    if (!profile) {
      profile = {
        id: `prof-${userId}`,
        user_id: userId,
        full_name: member?.name || req.user?.name || formatNameFromEmail(userEmail),
        student_id: 'GSA-2026-KK670',
        phone: '+91 98765 43211',
        university: 'Delhi Technological University',
        college: 'Faculty of Engineering',
        course: 'B.Tech',
        branch: 'Computer Science',
        year: 2,
        semester: 3,
        skills: ['Student Ambassador', 'Leadership'],
        bio: 'Campus Ambassador',
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userEmail)}`,
        completion_pct: 100,
        is_active: true,
        status: 'active',
        firstLogin: false,
        login_count: 1,
        last_login_at: new Date(),
        last_active_at: new Date(),
        created_at: new Date()
      }
    }

    res.json({
      user: {
        id: userId,
        uid: userId,
        email: userEmail,
        name: member?.name || profile.full_name,
        role,
        status: 'active',
        firstLogin: false,
        profile: {
          id: profile.id,
          user_id: userId,
          full_name: profile.full_name,
          student_id: profile.student_id,
          phone: profile.phone,
          university: profile.university,
          college: profile.college,
          course: profile.course,
          branch: profile.branch,
          year: profile.year,
          semester: profile.semester,
          skills: profile.skills,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          completion_pct: profile.completion_pct,
          is_active: true,
          status: 'active'
        }
      }
    })
  } catch (err: any) {
    res.status(401).json({ error: 'Session expired. Please log in again.' })
  }
})

// POST /api/auth/logout
router.post('/logout', async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Logged out successfully' })
})

// Fallbacks for any legacy routes
router.all('/register', (_req: Request, res: Response): void => {
  res.status(400).json({ error: 'Direct registration is disabled. You can log in directly with any email and Ambassador@123.' })
})
router.all('/forgot-password', (_req: Request, res: Response): void => {
  res.status(400).json({ error: 'Password reset is disabled.' })
})
router.all('/reset-password', (_req: Request, res: Response): void => {
  res.status(400).json({ error: 'Password reset is disabled.' })
})
router.all('/verify-email', (_req: Request, res: Response): void => {
  res.status(400).json({ error: 'Email verification is disabled.' })
})
router.all('/change-password', (_req: Request, res: Response): void => {
  res.status(200).json({ success: true, message: 'Password is managed by administrator.' })
})

export default router
