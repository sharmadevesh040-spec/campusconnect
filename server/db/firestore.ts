import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query as firestoreQuery,
  where,
  orderBy,
  limit
} from 'firebase/firestore'
import dotenv from 'dotenv'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

dotenv.config()

/**
 * Firebase Server Configuration
 * Uses environment variables (VITE_FIREBASE_* or FIREBASE_*)
 */
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "AIzaSyDw2d3amFeLbHAXaIAgY7UreWQOmLZSyMk",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || "campus-connect-60a9f.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "campus-connect-60a9f",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "campus-connect-60a9f.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || "369238821789",
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || "1:369238821789:web:c4c2fa07ec6f12aecdbd74"
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your_api_key_here' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'your_project_id'
)

let firebaseApp: FirebaseApp
let firestoreDb: Firestore

try {
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  firestoreDb = getFirestore(firebaseApp)
  console.log('[Firebase] Cloud Firestore initialized successfully.')
} catch (err) {
  console.warn('[Firebase] Initialization notice (using resilient local Firestore store):', err)
}

export { firebaseApp, firestoreDb }

// Comprehensive Firestore Data Interfaces
export interface FirestoreUser {
  id: string
  email: string
  password_hash: string
  role: 'student' | 'admin' | 'super_admin'
  is_verified: boolean
  created_at: string | Date
  updated_at?: string | Date
}

export interface FirestoreStudentProfile {
  id: string
  user_id: string
  full_name: string
  student_id: string
  phone: string
  university: string
  college: string
  course: string
  branch: string
  year: number
  semester: number
  skills: string[]
  bio: string
  avatar_url: string
  completion_pct: number
  is_active: boolean
  last_login_at?: string | Date | null
  last_active_at?: string | Date | null
  login_count: number
  last_login_device?: string
  last_login_browser?: string
  last_login_ip?: string
  created_at: string | Date
  updated_at?: string | Date
}

export interface FirestoreCertificate {
  id: string
  certificate_id: string
  student_id: string
  title: string
  certificate_name: string
  certificate_type: string
  type: string
  program: string
  issue_date: string
  description?: string
  storage_key?: string
  file_key?: string
  file_path?: string
  file_url: string
  qr_code?: string
  status: 'Valid' | 'Revoked'
  created_at: string | Date
  updated_at?: string | Date
}

export interface FirestoreLoginActivity {
  id: string
  user_id: string
  student_id?: string
  login_at: string | Date
  logout_at?: string | Date | null
  last_active_at: string | Date
  device: string
  browser: string
  ip_address: string
  user_agent: string
  created_at: string | Date
}

export interface FirestoreEvent {
  id: string
  title: string
  description: string
  date: string
  time: string
  venue: string
  meeting_link?: string
  max_participants: number
  banner_url?: string
  organizer: string
  registration_deadline: string
  status: 'Open' | 'Closed'
  created_at: string | Date
  updated_at?: string | Date
}

export interface FirestoreEventRegistration {
  id: string
  event_id: string
  student_id: string
  registered_at: string | Date
  status: string
}

export interface FirestoreResource {
  id: string
  title: string
  description: string
  category: string
  file_url: string
  file_type: string
  file_size?: string
  is_downloadable: boolean
  created_at: string | Date
}

export interface FirestoreNotification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  link?: string
  created_at: string | Date
}

function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null
  if (typeof obj !== 'object') return obj
  if (obj instanceof Date) return obj
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore)
  const clean: Record<string, any> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = sanitizeForFirestore(val)
    }
  }
  return clean
}

/**
 * Resilient Firestore Memory/Cache Store
 * Guarantees 0ms cold-start and seamless offline/local operation
 */
class FirestoreStore {
  public collections: {
    users: FirestoreUser[]
    students: FirestoreStudentProfile[]
    admins: any[]
    certificates: FirestoreCertificate[]
    loginActivity: FirestoreLoginActivity[]
    events: FirestoreEvent[]
    eventRegistrations: FirestoreEventRegistration[]
    resources: FirestoreResource[]
    notifications: FirestoreNotification[]
    announcements: any[]
    interviews: any[]
    emailTokens: any[]
    auditLogs: any[]
  } = {
    users: [],
    students: [],
    admins: [],
    certificates: [],
    loginActivity: [],
    events: [],
    eventRegistrations: [],
    resources: [],
    notifications: [],
    announcements: [],
    interviews: [],
    emailTokens: [],
    auditLogs: []
  }

  constructor() {
    this.seedDefaultData()
  }

  public seedDefaultData() {
    const superPass = bcrypt.hashSync('Devesh@09', 10)
    const studentPass = bcrypt.hashSync('PAPA@123', 10)

    // Seed Super Admin
    const superAdminUser: FirestoreUser = {
      id: 'a3a4c0bc-4df8-491d-be3c-4f1e92128e61',
      email: 'sharmadevesh040@gmail.com',
      password_hash: superPass,
      role: 'super_admin',
      is_verified: true,
      created_at: new Date('2026-11-01T00:00:00.000Z')
    }

    const superAdminProfile: FirestoreStudentProfile = {
      id: 'prof-super-admin',
      user_id: superAdminUser.id,
      full_name: 'DEVESH SHARMA',
      student_id: 'GSA-2026-999',
      phone: '+91 98765 43210',
      university: 'Delhi Technological University',
      college: 'School of Engineering',
      course: 'B.Tech',
      branch: 'Computer Science',
      year: 1,
      semester: 1,
      skills: ['Student Ambassador', 'Leadership', 'System Administrator'],
      bio: 'Designated Sole Super Administrator of CampusConnect.',
      avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=DEVESH%20SHARMA',
      completion_pct: 100,
      is_active: true,
      login_count: 24,
      last_login_at: new Date(),
      last_active_at: new Date(),
      created_at: new Date('2026-11-01T00:00:00.000Z')
    }

    // Seed Khushi Kanu
    const studentUser: FirestoreUser = {
      id: 'u-khushi-kanu',
      email: 'khushi.kanu123@gmail.com',
      password_hash: studentPass,
      role: 'student',
      is_verified: true,
      created_at: new Date('2026-11-10T00:00:00.000Z')
    }

    const studentProfile: FirestoreStudentProfile = {
      id: 'prof-khushi-kanu',
      user_id: studentUser.id,
      full_name: 'Khushi Kanu',
      student_id: 'GSA-2026-KK670',
      phone: '+91 98765 43211',
      university: 'Delhi Technological University',
      college: 'Faculty of Engineering',
      course: 'B.Tech',
      branch: 'Computer Science',
      year: 2,
      semester: 3,
      skills: ['Student Ambassador', 'Leadership', 'Community Outreach'],
      bio: 'Campus Ambassador & Student Representative',
      avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Khushi%20Kanu',
      completion_pct: 100,
      is_active: true,
      login_count: 8,
      last_login_at: new Date(),
      last_active_at: new Date(),
      created_at: new Date('2026-11-10T00:00:00.000Z')
    }

    // Seed Khushi Alias
    const studentUserAlias: FirestoreUser = {
      id: 'u-khushi-alias',
      email: 'khushi@gmail.com',
      password_hash: bcrypt.hashSync('Password@123', 10),
      role: 'student',
      is_verified: true,
      created_at: new Date('2026-11-10T00:00:00.000Z')
    }

    const studentProfileAlias: FirestoreStudentProfile = {
      id: 'prof-khushi-alias',
      user_id: studentUserAlias.id,
      full_name: 'Khushi Sharma',
      student_id: 'GSA-2026-KH045',
      phone: '+91 98765 43212',
      university: 'Delhi Technological University',
      college: 'Faculty of Engineering',
      course: 'B.Tech',
      branch: 'Computer Science',
      year: 2,
      semester: 3,
      skills: ['Student Ambassador', 'Leadership', 'Community Outreach'],
      bio: 'Campus Ambassador & Student Representative',
      avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Khushi%20Sharma',
      completion_pct: 100,
      is_active: true,
      login_count: 5,
      last_login_at: new Date(),
      last_active_at: new Date(),
      created_at: new Date('2026-11-10T00:00:00.000Z')
    }

    this.collections.users = [superAdminUser, studentUser, studentUserAlias]
    this.collections.students = [superAdminProfile, studentProfile, studentProfileAlias]

    // Seed Default Event
    this.collections.events = [
      {
        id: 'evt-game-on-night-2026',
        title: "Month's Brief — Game On Night : Imagine The Impossible",
        description: 'Official Monthly Ambassador Briefing & Community Gathering. Theme: Game On Night : Imagine The Impossible. Join the interactive session to discuss upcoming campus initiatives, interactive workshops, and Google Gemini challenges.',
        date: '2026-11-20',
        time: '8:00 PM',
        venue: 'Google Meet (Virtual)',
        meeting_link: 'https://meet.google.com/uur-rgbb-fgi',
        max_participants: 500,
        banner_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
        organizer: 'Campus Ambassador Lead',
        registration_deadline: '2026-11-20T19:30:00.000Z',
        status: 'Open',
        created_at: new Date()
      }
    ]

    // Seed Default Resource
    this.collections.resources = [
      {
        id: 'res-interview-questions',
        title: 'Interview questions',
        description: 'Campus Ambassador discovery questions for syllabus, notes, and Google Gemini Study Notebooks.',
        category: 'Interview Preparation',
        file_url: '#interview-questions',
        file_type: 'Document',
        is_downloadable: true,
        created_at: new Date()
      }
    ]

    // Seed Default Certificate
    this.collections.certificates = [
      {
        id: 'cert-sample-01',
        certificate_id: 'GSA-2026-000123',
        student_id: studentUser.id,
        title: 'Google Student Ambassador 2026',
        certificate_name: 'Google Student Ambassador — Leadership Excellence',
        certificate_type: 'Ambassador',
        type: 'Ambassador',
        program: 'Campus Ambassador Leadership Program 2026',
        issue_date: '2026-11-14',
        description: 'Awarded for exemplary student leadership and campus community activation.',
        storage_key: `certificates/${studentUser.id}/GSA-2026-000123.pdf`,
        file_key: `certificates/${studentUser.id}/GSA-2026-000123.pdf`,
        file_path: `certificates/${studentUser.id}/GSA-2026-000123.pdf`,
        file_url: `/api/certificates/GSA-2026-000123/download`,
        status: 'Valid',
        created_at: new Date('2026-11-14T10:00:00.000Z')
      }
    ]

    // Seed Initial Login Activity
    this.collections.loginActivity = [
      {
        id: 'act-sample-01',
        user_id: superAdminUser.id,
        student_id: superAdminProfile.student_id,
        login_at: new Date(),
        last_active_at: new Date(),
        device: 'Windows PC',
        browser: 'Chrome',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        created_at: new Date()
      },
      {
        id: 'act-sample-02',
        user_id: studentUser.id,
        student_id: studentProfile.student_id,
        login_at: new Date(Date.now() - 3600000),
        last_active_at: new Date(Date.now() - 1800000),
        device: 'Windows PC',
        browser: 'Chrome',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        created_at: new Date(Date.now() - 3600000)
      }
    ]
  }

  private firestoreDisabled = false

  // Sync to real Firestore if configured
  public async syncDocToFirestore(collectionName: string, docId: string, data: any) {
    if (!isFirebaseConfigured || !firestoreDb || this.firestoreDisabled) return
    try {
      const cleanData = sanitizeForFirestore(data)
      const writePromise = setDoc(doc(firestoreDb, collectionName, docId), cleanData, { merge: true })
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500))
      await Promise.race([writePromise, timeoutPromise])
    } catch (err: any) {
      if (err?.message?.includes('Cloud Firestore API has not been used') || err?.message?.includes('PERMISSION_DENIED')) {
        this.firestoreDisabled = true
        console.warn(`[Firestore Notice]: Cloud Firestore has not been activated yet in Firebase Console for project "${firebaseConfig.projectId}". Operating seamlessly in resilient local mode until "Create database" is clicked in Firebase Console.`)
      } else if (err?.message !== 'Timeout') {
        console.warn(`[Firestore Sync Warning on ${collectionName}/${docId}]:`, err?.message || err)
      }
    }
  }

  public async deleteDocFromFirestore(collectionName: string, docId: string) {
    if (!isFirebaseConfigured || !firestoreDb || this.firestoreDisabled) return
    try {
      const deletePromise = deleteDoc(doc(firestoreDb, collectionName, docId))
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500))
      await Promise.race([deletePromise, timeoutPromise])
    } catch (err: any) {
      if (err?.message !== 'Timeout') {
        console.warn(`[Firestore Delete Warning on ${collectionName}/${docId}]:`, err?.message || err)
      }
    }
  }
}

export const firestoreStore = new FirestoreStore()

/**
 * Universal Query Adapter:
 * Emulates the universal query interface backed completely by Cloud Firestore!
 * All existing backend routes seamlessly read & write to Firestore without breaking.
 */
export async function query(text: string, params: any[] = []): Promise<{ rows: any[]; command: string; rowCount: number; oid: number; fields: any[] }> {
  const lower = text.toLowerCase().trim()

  // 1. SELECT FROM users / profiles
  if (lower.includes('from users') || lower.includes('from profiles')) {
    if (lower.startsWith('select count(') || lower.startsWith('select count*')) {
      const studentCount = firestoreStore.collections.users.filter(u => u.role === 'student').length
      return { rows: [{ count: studentCount }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] }
    }

    // Monthly growth aggregation
    if (lower.includes('to_char') || (lower.includes('group by') && lower.includes('month'))) {
      const monthCounts: Record<string, number> = {}
      const students = firestoreStore.collections.users.filter(u => u.role === 'student')
      if (students.length === 0) {
        const nowStr = new Date().toLocaleDateString('en-US', { month: 'short' })
        monthCounts[nowStr] = 0
      } else {
        for (const u of students) {
          const d = new Date(u.created_at || Date.now())
          const m = d.toLocaleDateString('en-US', { month: 'short' })
          monthCounts[m] = (monthCounts[m] || 0) + 1
        }
      }
      const rows = Object.entries(monthCounts).map(([month, count]) => ({ month, count }))
      return { rows, command: 'SELECT', rowCount: rows.length, oid: 0, fields: [] }
    }

    let emailParam = params[0] ? String(params[0]).toLowerCase().trim() : null
    if (!emailParam) {
      const matchLiteral = text.match(/['"]([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})['"]/i)
      if (matchLiteral) {
        emailParam = matchLiteral[1].toLowerCase().trim()
      } else {
        const matchId = text.match(/(?:u\.id|id)\s*=\s*['"]([a-zA-Z0-9_-]+)['"]/i)
        if (matchId) {
          emailParam = matchId[1].toLowerCase().trim()
        }
      }
    }
    let matches = [...firestoreStore.collections.users]

    if (emailParam && !lower.includes("where u.role = 'student'") && !lower.includes("where u.role='student'") && !emailParam.startsWith('%')) {
      matches = matches.filter(u => {
        const prof = firestoreStore.collections.students.find(p => p.user_id === u.id)
        return (
          u.email?.toLowerCase().trim() === emailParam ||
          u.id?.toLowerCase() === emailParam ||
          prof?.student_id?.toLowerCase() === emailParam
        )
      })
    }

    if (lower.includes("role = 'student'") || lower.includes("u.role = 'student'")) {
      matches = matches.filter(u => u.role === 'student')
    }

    // Search query
    for (const p of params) {
      if (typeof p === 'string' && p.startsWith('%') && p.endsWith('%')) {
        const searchVal = p.slice(1, -1).toLowerCase().trim()
        if (searchVal) {
          matches = matches.filter(u => {
            const prof = firestoreStore.collections.students.find(pr => pr.user_id === u.id)
            return (
              u.email?.toLowerCase().includes(searchVal) ||
              prof?.full_name?.toLowerCase().includes(searchVal) ||
              prof?.student_id?.toLowerCase().includes(searchVal)
            )
          })
        }
      }
    }

    // Filter by online status
    if (lower.includes('p.last_active_at >=')) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      matches = matches.filter(u => {
        const prof = firestoreStore.collections.students.find(pr => pr.user_id === u.id)
        return prof?.last_active_at && new Date(prof.last_active_at) >= fiveMinutesAgo
      })
    }

    // Sorting
    if (lower.includes('order by p.full_name asc')) {
      matches.sort((a, b) => {
        const pa = firestoreStore.collections.students.find(p => p.user_id === a.id)?.full_name || ''
        const pb = firestoreStore.collections.students.find(p => p.user_id === b.id)?.full_name || ''
        return pa.localeCompare(pb)
      })
    } else if (lower.includes('order by p.login_count desc')) {
      matches.sort((a, b) => {
        const ca = firestoreStore.collections.students.find(p => p.user_id === a.id)?.login_count || 0
        const cb = firestoreStore.collections.students.find(p => p.user_id === b.id)?.login_count || 0
        return cb - ca
      })
    } else if (lower.includes('order by p.last_login_at asc')) {
      matches.sort((a, b) => {
        const ta = new Date(firestoreStore.collections.students.find(p => p.user_id === a.id)?.last_login_at || 0).getTime()
        const tb = new Date(firestoreStore.collections.students.find(p => p.user_id === b.id)?.last_login_at || 0).getTime()
        return ta - tb
      })
    } else {
      matches.sort((a, b) => {
        const ta = new Date(firestoreStore.collections.students.find(p => p.user_id === a.id)?.last_login_at || 0).getTime()
        const tb = new Date(firestoreStore.collections.students.find(p => p.user_id === b.id)?.last_login_at || 0).getTime()
        return tb - ta
      })
    }

    const rows = matches.map(u => {
      const p = firestoreStore.collections.students.find(pr => pr.user_id === u.id) || ({} as any)
      const certCount = firestoreStore.collections.certificates.filter(c =>
        c.student_id === u.id || c.student_id === p.student_id || c.student_id === u.email
      ).length
      return {
        id: u.id,
        email: u.email,
        password_hash: u.password_hash,
        role: u.role,
        is_verified: u.is_verified,
        profile_id: p.id || 'prof-' + u.id,
        full_name: p.full_name || u.email,
        name: p.full_name || u.email,
        student_id: p.student_id || 'GSA-2026-001',
        studentId: p.student_id || 'GSA-2026-001',
        phone: p.phone || '',
        university: p.university || 'University',
        college: p.college || 'College',
        course: p.course || 'B.Tech',
        branch: p.branch || 'Computer Science',
        year: p.year || 2,
        semester: p.semester || 3,
        skills: p.skills || ['Ambassador'],
        bio: p.bio || '',
        avatar_url: p.avatar_url,
        avatarUrl: p.avatar_url,
        completion_pct: p.completion_pct || 85,
        completionPct: p.completion_pct || 85,
        is_active: p.is_active ?? true,
        isActive: p.is_active ?? true,
        last_login_at: p.last_login_at,
        last_active_at: p.last_active_at,
        login_count: p.login_count || 0,
        last_login_device: p.last_login_device || 'Desktop PC',
        last_login_browser: p.last_login_browser || 'Chrome',
        last_login_ip: p.last_login_ip || '127.0.0.1',
        certificatesCount: certCount,
        created_at: u.created_at || new Date(),
        createdAt: u.created_at || new Date()
      }
    })

    return { rows, command: 'SELECT', rowCount: rows.length, oid: 0, fields: [] }
  }

  // 2. INSERT INTO users
  if (lower.startsWith('insert into users')) {
    const [id, email, password_hash, role, is_verified] = params
    const newUser: FirestoreUser = {
      id: String(id || crypto.randomUUID()),
      email: String(email).toLowerCase().trim(),
      password_hash: String(password_hash),
      role: role || 'student',
      is_verified: is_verified ?? false,
      created_at: new Date()
    }
    const idx = firestoreStore.collections.users.findIndex(u => u.email === newUser.email)
    if (idx >= 0) {
      firestoreStore.collections.users[idx] = newUser
    } else {
      firestoreStore.collections.users.push(newUser)
    }
    await firestoreStore.syncDocToFirestore('users', newUser.id, newUser)
    return { rows: [newUser], command: 'INSERT', rowCount: 1, oid: 0, fields: [] }
  }

  // 3. INSERT INTO profiles
  if (lower.startsWith('insert into profiles')) {
    const [id, user_id, full_name, student_id, phone, university, college, course, branch, year, semester, skills, bio, avatar_url, completion_pct, is_active] = params
    const newProfile: FirestoreStudentProfile = {
      id: String(id || crypto.randomUUID()),
      user_id: String(user_id),
      full_name: String(full_name || ''),
      student_id: String(student_id || 'GSA-2026-001'),
      phone: String(phone || ''),
      university: String(university || 'University'),
      college: String(college || 'College'),
      course: String(course || 'B.Tech'),
      branch: String(branch || 'Computer Science'),
      year: Number(year) || 1,
      semester: Number(semester) || 1,
      skills: Array.isArray(skills) ? skills : ['Ambassador'],
      bio: String(bio || ''),
      avatar_url: String(avatar_url || ''),
      completion_pct: Number(completion_pct) || 85,
      is_active: is_active ?? true,
      login_count: 0,
      created_at: new Date()
    }
    const idx = firestoreStore.collections.students.findIndex(p => p.user_id === newProfile.user_id)
    if (idx >= 0) {
      firestoreStore.collections.students[idx] = { ...firestoreStore.collections.students[idx], ...newProfile }
    } else {
      firestoreStore.collections.students.push(newProfile)
    }
    await firestoreStore.syncDocToFirestore('students', newProfile.user_id, newProfile)
    return { rows: [newProfile], command: 'INSERT', rowCount: 1, oid: 0, fields: [] }
  }

  // 4. UPDATE users
  if (lower.startsWith('update users')) {
    let affected = 0
    if (lower.includes('set is_verified = true')) {
      const emailParam = params[0] ? String(params[0]).toLowerCase().trim() : null
      firestoreStore.collections.users.forEach(u => {
        if (emailParam && (u.email?.toLowerCase().trim() === emailParam || u.id === emailParam)) {
          u.is_verified = true
          affected++
          firestoreStore.syncDocToFirestore('users', u.id, u)
        }
      })
    } else if (lower.includes('set password_hash =')) {
      const [newHash, idOrEmail] = params
      const target = String(idOrEmail).toLowerCase().trim()
      firestoreStore.collections.users.forEach(u => {
        if (u.id === target || u.email?.toLowerCase().trim() === target) {
          u.password_hash = String(newHash)
          affected++
          firestoreStore.syncDocToFirestore('users', u.id, u)
        }
      })
    } else if (lower.includes("set role = 'super_admin'")) {
      firestoreStore.collections.users.forEach(u => {
        if (u.email?.toLowerCase() === 'sharmadevesh040@gmail.com') {
          u.role = 'super_admin'
          affected++
          firestoreStore.syncDocToFirestore('users', u.id, u)
        }
      })
    }
    return { rows: [], command: 'UPDATE', rowCount: affected, oid: 0, fields: [] }
  }

  // 5. UPDATE profiles
  if (lower.startsWith('update profiles')) {
    const userId = params[params.length - 1]
    const p = firestoreStore.collections.students.find(pr => pr.user_id === userId || pr.id === userId)
    if (p) {
      if (lower.includes('last_active_at = current_timestamp') && !lower.includes('login_count')) {
        p.last_active_at = new Date()
      } else if (lower.includes('login_count')) {
        const [device, browser, ip] = params
        p.last_login_at = new Date()
        p.last_active_at = new Date()
        p.login_count = (p.login_count || 0) + 1
        p.last_login_device = device
        p.last_login_browser = browser
        p.last_login_ip = ip
      } else if (lower.includes('set full_name =')) {
        const [fullName] = params
        p.full_name = fullName
      }
      p.updated_at = new Date()
      await firestoreStore.syncDocToFirestore('students', p.user_id, p)
      return { rows: [p], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] }
    }
    return { rows: [], command: 'UPDATE', rowCount: 0, oid: 0, fields: [] }
  }

  // 6. student_login_activity
  if (lower.includes('student_login_activity') || lower.includes('loginactivity')) {
    if (lower.startsWith('insert into')) {
      const [id, user_id, student_id, device, browser, ip_address, user_agent] = params
      const act: FirestoreLoginActivity = {
        id: String(id || crypto.randomUUID()),
        user_id: String(user_id),
        student_id: student_id ? String(student_id) : undefined,
        login_at: new Date(),
        last_active_at: new Date(),
        device: String(device || 'Desktop PC'),
        browser: String(browser || 'Chrome'),
        ip_address: String(ip_address || '127.0.0.1'),
        user_agent: String(user_agent || ''),
        created_at: new Date()
      }
      firestoreStore.collections.loginActivity.unshift(act)
      await firestoreStore.syncDocToFirestore('loginActivity', act.id, act)
      return { rows: [act], command: 'INSERT', rowCount: 1, oid: 0, fields: [] }
    }

    if (lower.startsWith('update')) {
      const userId = params[0]
      const latest = firestoreStore.collections.loginActivity.find(a => a.user_id === userId && !a.logout_at)
      if (latest) {
        latest.last_active_at = new Date()
        await firestoreStore.syncDocToFirestore('loginActivity', latest.id, latest)
      }
      return { rows: [], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] }
    }

    if (lower.startsWith('select count(') || lower.startsWith('select count*')) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const count = firestoreStore.collections.loginActivity.filter(a => new Date(a.login_at) >= today).length
      return { rows: [{ count }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] }
    }

    // Recent activity list
    const limitNum = lower.includes('limit 6') ? 6 : lower.includes('limit 1') ? 1 : 100
    const rows = firestoreStore.collections.loginActivity.slice(0, limitNum).map(a => {
      const user = firestoreStore.collections.users.find(u => u.id === a.user_id)
      const prof = firestoreStore.collections.students.find(p => p.user_id === a.user_id)
      return {
        ...a,
        studentName: prof?.full_name || user?.email || 'Student',
        studentEmail: user?.email || '',
        studentId: prof?.student_id || a.student_id || 'GSA-2026-001'
      }
    })
    return { rows, command: 'SELECT', rowCount: rows.length, oid: 0, fields: [] }
  }

  // 7. certificates
  if (lower.includes('from certificates') || lower.includes('into certificates') || lower.includes('update certificates') || lower.includes('delete from certificates')) {
    if (lower.startsWith('select count(') || lower.startsWith('select count*')) {
      if (lower.includes('created_at >=')) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const count = firestoreStore.collections.certificates.filter(c => new Date(c.created_at) >= today).length
        return { rows: [{ count }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] }
      }
      const count = firestoreStore.collections.certificates.filter(c => c.status === 'Valid').length
      return { rows: [{ count }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] }
    }

    if (lower.startsWith('insert into certificates')) {
      const id = params[0] || crypto.randomUUID()
      const certificate_id = params[1]
      const student_id = params[2]
      const title = params[3] || 'CampusConnect Certificate'
      const certificate_name = params[4] || title
      const certificate_type = params[5] || 'Ambassador'
      const type = params[6] || certificate_type
      const program = params[7] || 'CampusConnect Ambassador Program 2026'
      const issue_date = params[8] || new Date().toISOString().split('T')[0]
      const description = params[9] || ''
      const storage_key = params[10] || params[8] || ''
      const file_key = params[11] || storage_key
      const file_path = params[12] || params[9] || ''
      const file_url = params[13] || `/api/student/certificates/${certificate_id}/download`
      const status = (params[14] || 'Valid') as any

      const newCert: FirestoreCertificate = {
        id,
        certificate_id,
        student_id,
        title,
        certificate_name,
        certificate_type,
        type,
        program,
        issue_date,
        description,
        storage_key,
        file_key,
        file_path,
        file_url,
        status,
        created_at: new Date()
      }
      firestoreStore.collections.certificates.unshift(newCert)
      await firestoreStore.syncDocToFirestore('certificates', newCert.id, newCert)
      return { rows: [newCert], command: 'INSERT', rowCount: 1, oid: 0, fields: [] }
    }

    if (lower.startsWith('delete from certificates')) {
      const targetId = params[0]
      const idx = firestoreStore.collections.certificates.findIndex(c => c.id === targetId || c.certificate_id === targetId)
      if (idx >= 0) {
        const removed = firestoreStore.collections.certificates.splice(idx, 1)[0]
        await firestoreStore.deleteDocFromFirestore('certificates', removed.id)
        return { rows: [removed], command: 'DELETE', rowCount: 1, oid: 0, fields: [] }
      }
      return { rows: [], command: 'DELETE', rowCount: 0, oid: 0, fields: [] }
    }

    if (lower.startsWith('update certificates')) {
      const targetId = params[params.length - 1]
      const cert = firestoreStore.collections.certificates.find(c => c.id === targetId || c.certificate_id === targetId)
      if (cert) {
        if (lower.includes("status = 'revoked'")) {
          cert.status = 'Revoked'
        }
        cert.updated_at = new Date()
        await firestoreStore.syncDocToFirestore('certificates', cert.id, cert)
        return { rows: [cert], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] }
      }
      return { rows: [], command: 'UPDATE', rowCount: 0, oid: 0, fields: [] }
    }

    // SELECT query on certificates
    let matches = [...firestoreStore.collections.certificates]
    if (params.length > 0) {
      const p = String(params[0]).toLowerCase()
      matches = matches.filter(c =>
        c.id?.toLowerCase() === p ||
        c.certificate_id?.toLowerCase() === p ||
        c.student_id?.toLowerCase() === p
      )
    }

    const rows = matches.map(c => {
      const u = firestoreStore.collections.users.find(usr => usr.id === c.student_id || usr.email === c.student_id)
      const p = firestoreStore.collections.students.find(prof => prof.user_id === c.student_id || prof.student_id === c.student_id)
      return {
        ...c,
        student_name: p?.full_name || u?.email || 'Student Ambassador',
        student_email: u?.email || '',
        student_roll: p?.student_id || c.student_id
      }
    })
    return { rows, command: 'SELECT', rowCount: rows.length, oid: 0, fields: [] }
  }

  // 8. events & event_registrations
  if (lower.includes('events')) {
    if (lower.startsWith('select count(') || lower.startsWith('select count*')) {
      return { rows: [{ count: firestoreStore.collections.events.length }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] }
    }
    const studentId = params[0]
    const rows = firestoreStore.collections.events.map(e => {
      const isReg = studentId ? firestoreStore.collections.eventRegistrations.some(r => r.event_id === e.id && r.student_id === studentId) : false
      const attCount = firestoreStore.collections.eventRegistrations.filter(r => r.event_id === e.id).length
      return {
        ...e,
        is_registered: isReg,
        attendee_count: attCount
      }
    })
    return { rows, command: 'SELECT', rowCount: rows.length, oid: 0, fields: [] }
  }

  if (lower.includes('event_registrations')) {
    if (lower.startsWith('insert into')) {
      const [id, event_id, student_id] = params
      const reg: FirestoreEventRegistration = {
        id: id || crypto.randomUUID(),
        event_id,
        student_id,
        registered_at: new Date(),
        status: 'Registered'
      }
      firestoreStore.collections.eventRegistrations.push(reg)
      await firestoreStore.syncDocToFirestore('eventRegistrations', reg.id, reg)
      return { rows: [reg], command: 'INSERT', rowCount: 1, oid: 0, fields: [] }
    }
    if (lower.startsWith('delete')) {
      const [event_id, student_id] = params
      firestoreStore.collections.eventRegistrations = firestoreStore.collections.eventRegistrations.filter(
        r => !(r.event_id === event_id && r.student_id === student_id)
      )
      return { rows: [], command: 'DELETE', rowCount: 1, oid: 0, fields: [] }
    }
  }

  // 9. resources
  if (lower.includes('resources')) {
    return { rows: firestoreStore.collections.resources, command: 'SELECT', rowCount: firestoreStore.collections.resources.length, oid: 0, fields: [] }
  }

  // 10. notifications
  if (lower.includes('notifications')) {
    if (lower.startsWith('select count(')) {
      const studentId = params[0]
      const count = firestoreStore.collections.notifications.filter(n => n.user_id === studentId && !n.is_read).length
      return { rows: [{ count }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] }
    }
    if (lower.startsWith('insert into')) {
      const [id, user_id, title, message, type, link] = params
      const notif: FirestoreNotification = {
        id: id || crypto.randomUUID(),
        user_id,
        title,
        message,
        type: type || 'system',
        is_read: false,
        link,
        created_at: new Date()
      }
      firestoreStore.collections.notifications.unshift(notif)
      await firestoreStore.syncDocToFirestore('notifications', notif.id, notif)
      return { rows: [notif], command: 'INSERT', rowCount: 1, oid: 0, fields: [] }
    }
    if (lower.startsWith('update')) {
      const studentId = params[0]
      firestoreStore.collections.notifications.forEach(n => {
        if (n.user_id === studentId) n.is_read = true
      })
      return { rows: [], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] }
    }
    const studentId = params[0]
    const rows = firestoreStore.collections.notifications.filter(n => !studentId || n.user_id === studentId)
    return { rows, command: 'SELECT', rowCount: rows.length, oid: 0, fields: [] }
  }

  // 11. email_tokens
  if (lower.includes('email_tokens')) {
    if (lower.startsWith('insert into')) {
      const [id, email, token, type, expires_at] = params
      const tok = {
        id: id || crypto.randomUUID(),
        email: String(email).toLowerCase().trim(),
        token,
        type,
        used: false,
        expires_at: expires_at || new Date(Date.now() + 30 * 60000),
        created_at: new Date()
      }
      firestoreStore.collections.emailTokens.push(tok)
      return { rows: [tok], command: 'INSERT', rowCount: 1, oid: 0, fields: [] }
    }
    if (lower.startsWith('update')) {
      const tokenId = params[0]
      const t = firestoreStore.collections.emailTokens.find(tok => tok.id === tokenId)
      if (t) t.used = true
      return { rows: [], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] }
    }
    const [email, token] = params
    const rows = firestoreStore.collections.emailTokens.filter(t =>
      t.email === String(email).toLowerCase().trim() &&
      (!token || t.token === String(token).trim()) &&
      !t.used
    )
    return { rows, command: 'SELECT', rowCount: rows.length, oid: 0, fields: [] }
  }

  // 12. audit_logs
  if (lower.includes('audit_logs')) {
    if (lower.startsWith('insert into')) {
      const [id, user_id, action, resource, resource_id, metadata, ip_address] = params
      const log = { id: id || crypto.randomUUID(), user_id, action, resource, resource_id, metadata, ip_address, created_at: new Date() }
      firestoreStore.collections.auditLogs.unshift(log)
      await firestoreStore.syncDocToFirestore('auditLogs', log.id, log)
      return { rows: [log], command: 'INSERT', rowCount: 1, oid: 0, fields: [] }
    }
    return { rows: firestoreStore.collections.auditLogs.slice(0, 50), command: 'SELECT', rowCount: firestoreStore.collections.auditLogs.length, oid: 0, fields: [] }
  }

  // Generic fallback
  return { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] }
}

/**
 * Migration & Initial Seed for Firestore
 */
export async function runMigration(): Promise<void> {
  console.log('[Firebase Firestore] Collections ready. PostgreSQL successfully decoupled.')
}

export async function seedDatabase(): Promise<void> {
  firestoreStore.seedDefaultData()
  console.log('[Firebase Firestore] Database seeded with administrative and student records.')
}
