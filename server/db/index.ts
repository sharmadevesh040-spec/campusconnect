import { Pool, QueryResult } from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { SCHEMA_SQL } from './schemaSql'

dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL

let pool: Pool | null = null

if (DATABASE_URL && !DATABASE_URL.includes('localhost') && process.env.VERCEL) {
  // Remote PostgreSQL / Neon on Vercel
  try {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    })
    console.log('[PostgreSQL] Initialized remote Pool for Vercel.')
  } catch (err) {
    console.warn('[PostgreSQL] Failed to initialize remote Pool:', err)
    pool = null
  }
} else if (DATABASE_URL && (!process.env.VERCEL || !DATABASE_URL.includes('localhost'))) {
  // Local or remote PostgreSQL in standard server
  try {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('neon.tech') || DATABASE_URL.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    })
    console.log('[PostgreSQL] Connected to database via Pool.')
  } catch (err) {
    console.warn('[PostgreSQL] Failed to initialize pg Pool:', err)
    pool = null
  }
} else {
  console.log('[PostgreSQL] No remote DATABASE_URL configured for Vercel. Running resilient serverless store.')
}

// Resilient In-Memory store for zero-config Vercel deployments
class FallbackStore {
  public data: Record<string, any[]> = {
    users: [
      {
        id: 'a3a4c0bc-4df8-491d-be3c-4f1e92128e61',
        email: 'sharmadevesh040@gmail.com',
        password_hash: '$2b$10$uzfyZvGuyYYALP20A53/jeS42Ltvmtvjsdard3JSTDDFVsNd8pXOO', // Devesh@09 hash
        role: 'super_admin',
        is_verified: true,
        created_at: new Date()
      },
      {
        id: 'u-khushi-kanu',
        email: 'khushi.kanu123@gmail.com',
        password_hash: '$2b$10$UQ0pxoOWSzjWi1FQBAblwunwTY/L7vFdZPYvXYkLigHVUVSyRzcrW', // PAPA@123 hash
        role: 'student',
        is_verified: true,
        created_at: new Date()
      }
    ],
    profiles: [
      {
        id: 'prof-super-admin',
        user_id: 'a3a4c0bc-4df8-491d-be3c-4f1e92128e61',
        full_name: 'DEVESH SHARMA',
        student_id: 'GSA-2026-999',
        phone: '+91 9876543210',
        university: 'Delhi Technological University',
        college: 'School of Engineering',
        course: 'B.Tech',
        branch: 'Computer Science',
        year: 4,
        semester: 7,
        skills: ['Student Ambassador', 'Leadership', 'Cloud Architecture'],
        bio: 'Campus Ambassador Lead & Executive Director',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=DEVESH+SHARMA',
        completion_pct: 100,
        is_active: true,
        last_login_at: new Date(),
        last_active_at: new Date(),
        login_count: 10,
        last_login_device: 'Windows PC',
        last_login_browser: 'Chrome',
        last_login_ip: '127.0.0.1'
      },
      {
        id: 'prof-khushi-kanu',
        user_id: 'u-khushi-kanu',
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
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Khushi+Kanu',
        completion_pct: 100,
        is_active: true,
        last_login_at: new Date(),
        last_active_at: new Date(),
        login_count: 5,
        last_login_device: 'Windows PC',
        last_login_browser: 'Chrome',
        last_login_ip: '127.0.0.1'
      }
    ],
    email_tokens: [],
    student_login_activity: [
      {
        id: 'act-khushi-001',
        user_id: 'u-khushi-kanu',
        student_id: 'GSA-2026-KK670',
        login_at: new Date(),
        logout_at: null,
        last_active_at: new Date(),
        device: 'Windows PC',
        browser: 'Chrome',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        created_at: new Date()
      }
    ],
    certificates: [
      {
        id: 'cert-khushi-001',
        certificate_id: 'CERT-2026-KK670',
        student_id: 'khushi.kanu123@gmail.com',
        title: 'Google Student Ambassador Certificate',
        certificate_name: 'Google Student Ambassador Certificate',
        type: 'Ambassador',
        program: 'Google Student Ambassador Program 2026',
        issue_date: '2026-11-14',
        description: 'Awarded for outstanding leadership, active campus engagement, and peer mentorship in the student ambassador community.',
        file_path: 'uploads/certificates/GSA-2026-915963/CERT-2026-KK670.pdf',
        file_key: 'certificates/GSA-2026-915963/CERT-2026-KK670.pdf',
        file_url: '/api/student/certificates/CERT-2026-KK670/download',
        status: 'Valid',
        created_at: new Date()
      }
    ],
    interviews: [],
    events: [
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
        created_at: new Date(),
        updated_at: new Date()
      }
    ],
    event_registrations: [],
    tasks: [],
    announcements: [],
    notifications: [],
    audit_logs: [],
    resources: [
      {
        id: 'res-interview-questions',
        title: 'Interview questions',
        description: 'Campus Ambassador discovery questions for syllabus, notes, and Google Gemini Study Notebooks.',
        category: 'Interview Preparation',
        type: 'Document',
        url: '#interview-questions',
        created_at: new Date()
      }
    ]
  }

  private storePath = path.join(os.tmpdir(), 'campusconnect_fallback_store.json')

  init() {
    try {
      if (fs.existsSync(this.storePath)) {
        const raw = fs.readFileSync(this.storePath, 'utf-8')
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          for (const key of Object.keys(parsed)) {
            if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
              if (key === 'users') {
                for (const u of parsed.users) {
                  if (!this.data.users.some(existing => existing.email?.toLowerCase().trim() === u.email?.toLowerCase().trim() || existing.id === u.id)) {
                    this.data.users.push(u)
                  }
                }
              } else if (key === 'profiles') {
                for (const p of parsed.profiles) {
                  if (!this.data.profiles.some(existing => existing.user_id === p.user_id || existing.id === p.id)) {
                    this.data.profiles.push(p)
                  }
                }
              } else {
                this.data[key] = parsed[key]
              }
            }
          }
        }
      }
    } catch {}
    // Retain all registered users & profiles without wiping on serverless reload
    this.data.events = (this.data.events || []).filter(e => !e.id?.startsWith('evt-10'))
    this.data.resources = (this.data.resources || []).filter(r => !r.id?.startsWith('res-10'))
    this.data.interviews = []
    this.data.tasks = []
    this.data.announcements = []
    this.save()
    console.log('[FallbackStore] Initialized resilient in-memory store.')
  }

  save() {
    try {
      fs.writeFileSync(this.storePath, JSON.stringify(this.data), 'utf-8')
    } catch {}
  }

  async query(text: string, params: any[] = []): Promise<QueryResult<any>> {
    const raw = text.trim()
    const lower = raw.toLowerCase()

    // 1. SELECT COUNT
    if (lower.startsWith('select count(*)')) {
      for (const table of Object.keys(this.data)) {
        if (lower.includes(`from ${table}`)) {
          return {
            rows: [{ count: this.data[table].length }],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: []
          }
        }
      }
      return { rows: [{ count: 0 }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] }
    }

    // 2. INSERT INTO users
    if (lower.startsWith('insert into users')) {
      const [id, email, password_hash, role] = params
      const normalizedEmail = email?.toLowerCase().trim()
      const existingIdx = this.data.users.findIndex(u => u.email?.toLowerCase().trim() === normalizedEmail)
      const newUser = {
        id: id || (existingIdx >= 0 ? this.data.users[existingIdx].id : 'u-' + Date.now()),
        email: normalizedEmail,
        password_hash,
        role: role || 'student',
        is_verified: false,
        created_at: new Date()
      }
      if (existingIdx >= 0) {
        this.data.users[existingIdx] = newUser
      } else {
        this.data.users.push(newUser)
      }
      this.save()
      return { rows: [newUser], command: 'INSERT', rowCount: 1, oid: 0, fields: [] }
    }

    // 3. INSERT INTO profiles
    if (lower.startsWith('insert into profiles')) {
      const [id, user_id, full_name, student_id, phone, university, college, course, branch, year, semester, skills, bio, avatar_url, completion_pct] = params
      const existingIdx = this.data.profiles.findIndex(p => p.user_id === user_id || (student_id && p.student_id === student_id))
      const newProf = {
        id: id || (existingIdx >= 0 ? this.data.profiles[existingIdx].id : 'p-' + Date.now()),
        user_id,
        full_name,
        student_id,
        phone,
        university,
        college,
        course,
        branch,
        year,
        semester,
        skills,
        bio,
        avatar_url,
        completion_pct: completion_pct || 85,
        is_active: true,
        created_at: new Date()
      }
      if (existingIdx >= 0) {
        this.data.profiles[existingIdx] = newProf
      } else {
        this.data.profiles.push(newProf)
      }
      this.save()
      return { rows: [newProf], command: 'INSERT', rowCount: 1, oid: 0, fields: [] }
    }

    // 4. INSERT INTO email_tokens
    if (lower.startsWith('insert into email_tokens')) {
      const [email, token, type] = params
      const newToken = {
        id: 'tok-' + Date.now(),
        email: email?.toLowerCase().trim(),
        token: String(token).trim(),
        type: type || 'verification',
        used: false,
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
        created_at: new Date()
      }
      this.data.email_tokens.push(newToken)
      this.save()
      return { rows: [newToken], command: 'INSERT', rowCount: 1, oid: 0, fields: [] }
    }

    // 5. SELECT FROM email_tokens
    if (lower.includes('from email_tokens')) {
      const emailParam = params[0]?.toLowerCase().trim()
      const tokenParam = params[1] ? String(params[1]).trim() : null
      const matches = this.data.email_tokens.filter(t => {
        const matchEmail = !emailParam || t.email === emailParam
        const matchToken = !tokenParam || t.token === tokenParam
        const notUsed = t.used === false
        const notExpired = new Date(t.expires_at) > new Date()
        return matchEmail && matchToken && notUsed && notExpired
      })
      return { rows: matches, command: 'SELECT', rowCount: matches.length, oid: 0, fields: [] }
    }

    // 6. UPDATE email_tokens
    if (lower.startsWith('update email_tokens')) {
      const idParam = params[0]
      for (const t of this.data.email_tokens) {
        if (t.id === idParam || t.token === idParam) {
          t.used = true
        }
      }
      this.save()
      return { rows: [], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] }
    }

    // 7. UPDATE users
    if (lower.startsWith('update users')) {
      if (lower.includes('is_verified')) {
        const emailParam = params[0]?.toLowerCase().trim()
        for (const u of this.data.users) {
          if (u.email?.toLowerCase().trim() === emailParam || u.id === emailParam) {
            u.is_verified = true
          }
        }
      }
      if (lower.includes('password_hash')) {
        const [newHash, idParam] = params
        for (const u of this.data.users) {
          if (u.id === idParam || u.email?.toLowerCase().trim() === idParam?.toLowerCase().trim()) {
            u.password_hash = newHash
          }
        }
      }
      this.save()
      return { rows: [], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] }
    }

    // 7b. INSERT INTO student_login_activity
    if (lower.startsWith('insert into student_login_activity')) {
      const [id, user_id, student_id, login_at, last_active_at, device, browser, ip_address, user_agent] = params
      const newAct = {
        id: id || 'act-' + Date.now(),
        user_id,
        student_id,
        login_at: login_at || new Date(),
        logout_at: null,
        last_active_at: last_active_at || new Date(),
        device: device || 'Windows PC',
        browser: browser || 'Chrome',
        ip_address: ip_address || '127.0.0.1',
        user_agent: user_agent || '',
        created_at: new Date()
      }
      this.data.student_login_activity = this.data.student_login_activity || []
      this.data.student_login_activity.unshift(newAct)
      this.save()
      return { rows: [newAct], command: 'INSERT', rowCount: 1, oid: 0, fields: [] }
    }

    // 7c. UPDATE student_login_activity
    if (lower.startsWith('update student_login_activity')) {
      this.data.student_login_activity = this.data.student_login_activity || []
      const [val, uid] = params
      for (const act of this.data.student_login_activity) {
        if (act.user_id === uid || act.id === uid) {
          if (lower.includes('logout_at')) act.logout_at = val || new Date()
          if (lower.includes('last_active_at')) act.last_active_at = val || new Date()
        }
      }
      this.save()
      return { rows: [], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] }
    }

    // 7d. SELECT FROM student_login_activity
    if (lower.includes('from student_login_activity')) {
      if (lower.startsWith('select count(') || lower.startsWith('select count*')) {
        const threshold = params[0] ? new Date(params[0]) : new Date(new Date().setHours(0, 0, 0, 0))
        const todayCount = (this.data.student_login_activity || []).filter(a => a.login_at && new Date(a.login_at) >= threshold).length
        return { rows: [{ count: todayCount }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] }
      }
      let acts = this.data.student_login_activity || []
      const param0 = params[0] ? String(params[0]).trim().toLowerCase() : null
      if (param0 && (lower.includes('where user_id') || lower.includes('where student_id'))) {
        acts = acts.filter(a => a.user_id?.toLowerCase() === param0 || a.student_id?.toLowerCase() === param0)
      }
      const mappedActs = acts.map(a => {
        const u = this.data.users.find(usr => usr.id === a.user_id || usr.email === a.student_id)
        const p = this.data.profiles.find(prf => prf.user_id === a.user_id || prf.student_id === a.student_id)
        return {
          ...a,
          studentName: p?.full_name || u?.email || 'Student',
          studentEmail: u?.email || a.student_id || 'student@campusconnect.edu'
        }
      })
      return { rows: mappedActs, command: 'SELECT', rowCount: mappedActs.length, oid: 0, fields: [] }
    }

    // 7e. SELECT FROM profiles
    if (lower.includes('from profiles')) {
      if (lower.startsWith('select count(') || lower.startsWith('select count*')) {
        const threshold = params[0] ? new Date(params[0]) : new Date(Date.now() - 5 * 60 * 1000)
        const onlineCount = this.data.profiles.filter(p => p.last_active_at && new Date(p.last_active_at) >= threshold).length
        return { rows: [{ count: onlineCount }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] }
      }
      if (lower.startsWith('select coalesce(sum(') || lower.startsWith('select sum(') || lower.includes('sum(login_count)')) {
        const total = this.data.profiles.reduce((sum, p) => sum + (p.login_count || 0), 0)
        return { rows: [{ total }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] }
      }
    }

    // 7f. UPDATE profiles
    if (lower.startsWith('update profiles')) {
      const uid = params[params.length - 1]
      const prof = this.data.profiles.find(p => p.user_id === uid || p.id === uid)
      if (prof) {
        if (lower.includes('login_count')) {
          prof.login_count = (prof.login_count || 0) + 1
          prof.last_login_at = new Date()
          prof.last_active_at = new Date()
          if (params[0]) prof.last_login_device = params[0]
          if (params[1]) prof.last_login_browser = params[1]
          if (params[2]) prof.last_login_ip = params[2]
        } else if (lower.includes('last_active_at')) {
          prof.last_active_at = new Date()
        }
      }
      this.save()
      return { rows: [], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] }
    }

    // 8. SELECT FROM users / profiles (Prioritized when FROM users is present, even with certificate subqueries)
    if (lower.includes('from users')) {
      if (lower.startsWith('select count(') || lower.startsWith('select count*')) {
        const studentCount = this.data.users.filter(u => u.role === 'student').length
        return { rows: [{ count: studentCount }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] }
      }

      // Monthly student enrollment time-series aggregation for Admin Dashboard
      if (lower.includes('to_char') || (lower.includes('group by') && lower.includes('month'))) {
        const monthCounts: Record<string, number> = {}
        const students = this.data.users.filter(u => u.role === 'student')
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

      const emailParam = params[0] ? String(params[0]).toLowerCase().trim() : null
      let matches = [...this.data.users]
      if (emailParam && !lower.includes("where u.role = 'student'") && !lower.includes("where u.role='student'") && !emailParam.startsWith('%')) {
        matches = matches.filter(u => {
          const prof = this.data.profiles.find(p => p.user_id === u.id)
          return u.email?.toLowerCase().trim() === emailParam ||
                 u.id?.toLowerCase() === emailParam ||
                 prof?.student_id?.toLowerCase() === emailParam
        })
      }
      if (lower.includes("role = 'student'") || lower.includes("u.role = 'student'")) {
        matches = matches.filter(u => u.role === 'student')
      }

      // Filter by search term if passed
      for (const p of params) {
        if (typeof p === 'string' && p.startsWith('%') && p.endsWith('%')) {
          const searchVal = p.slice(1, -1).toLowerCase().trim()
          if (searchVal) {
            matches = matches.filter(u => {
              const prof = this.data.profiles.find(pr => pr.user_id === u.id)
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
          const prof = this.data.profiles.find(pr => pr.user_id === u.id)
          return prof?.last_active_at && new Date(prof.last_active_at) >= fiveMinutesAgo
        })
      }

      // Sorting
      if (lower.includes('order by p.full_name asc')) {
        matches.sort((a, b) => {
          const pa = this.data.profiles.find(p => p.user_id === a.id)?.full_name || ''
          const pb = this.data.profiles.find(p => p.user_id === b.id)?.full_name || ''
          return pa.localeCompare(pb)
        })
      } else if (lower.includes('order by p.login_count desc')) {
        matches.sort((a, b) => {
          const ca = this.data.profiles.find(p => p.user_id === a.id)?.login_count || 0
          const cb = this.data.profiles.find(p => p.user_id === b.id)?.login_count || 0
          return cb - ca
        })
      } else if (lower.includes('order by p.last_login_at asc')) {
        matches.sort((a, b) => {
          const ta = new Date(this.data.profiles.find(p => p.user_id === a.id)?.last_login_at || 0).getTime()
          const tb = new Date(this.data.profiles.find(p => p.user_id === b.id)?.last_login_at || 0).getTime()
          return ta - tb
        })
      } else {
        matches.sort((a, b) => {
          const ta = new Date(this.data.profiles.find(p => p.user_id === a.id)?.last_login_at || 0).getTime()
          const tb = new Date(this.data.profiles.find(p => p.user_id === b.id)?.last_login_at || 0).getTime()
          return tb - ta
        })
      }

      const combined = matches.map(u => {
        const prof = this.data.profiles.find(p => p.user_id === u.id || p.user_id === u.email || p.id === u.id) || {}
        return {
          ...u,
          id: u.id,
          email: u.email,
          createdAt: u.created_at,
          profileId: prof.id || u.id,
          profile_id: prof.id || u.id,
          name: prof.full_name || u.email,
          full_name: prof.full_name || u.email,
          studentId: prof.student_id || 'GSA-2026-KK670',
          student_id: prof.student_id || 'GSA-2026-KK670',
          phone: prof.phone || '',
          university: prof.university || 'University',
          college: prof.college || 'College',
          course: prof.course || 'B.Tech',
          branch: prof.branch || 'Computer Science',
          year: prof.year || 2,
          semester: prof.semester || 3,
          skills: prof.skills || ['Ambassador'],
          bio: prof.bio || '',
          avatar_url: prof.avatar_url,
          avatarUrl: prof.avatar_url,
          completion_pct: prof.completion_pct || 85,
          completionPct: prof.completion_pct || 85,
          is_active: prof.is_active ?? true,
          isActive: prof.is_active ?? true,
          last_login_at: prof.last_login_at || null,
          lastLoginAt: prof.last_login_at || null,
          last_active_at: prof.last_active_at || null,
          lastActiveAt: prof.last_active_at || null,
          login_count: prof.login_count || 0,
          loginCount: prof.login_count || 0,
          last_login_device: prof.last_login_device || 'Windows PC',
          device: prof.last_login_device || 'Windows PC',
          last_login_browser: prof.last_login_browser || 'Chrome',
          browser: prof.last_login_browser || 'Chrome',
          last_login_ip: prof.last_login_ip || '127.0.0.1',
          ipAddress: prof.last_login_ip || '127.0.0.1',
          certificatesCount: this.data.certificates.filter(c => c.student_id === u.id || c.student_id === u.email || c.student_id === prof.student_id).length
        }
      })
      return { rows: combined, command: 'SELECT', rowCount: combined.length, oid: 0, fields: [] }
    }

    // 9. SELECT FROM certificates
    if (lower.includes('from certificates')) {
      if (lower.startsWith('select count(') || lower.startsWith('select count*')) {
        if (lower.includes('created_at >=')) {
          const threshold = params[0] ? new Date(params[0]) : new Date(new Date().setHours(0, 0, 0, 0))
          const todayCerts = this.data.certificates.filter(c => c.created_at && new Date(c.created_at) >= threshold).length
          return { rows: [{ count: todayCerts }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] }
        }
        const validCerts = this.data.certificates.filter(c => c.status === 'Valid').length
        return { rows: [{ count: validCerts }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] }
      }

      let certs = this.data.certificates
      const param0 = params[0] ? String(params[0]).trim().toLowerCase() : null

      // Filter by student ID if requested (ownership check)
      if (lower.includes('where c.student_id') || lower.includes('where student_id')) {
        certs = certs.filter(c => {
          const sid = String(c.student_id || '').toLowerCase()
          const stu = this.data.users.find(u => u.id === c.student_id || u.email.toLowerCase() === sid)
          const prof = this.data.profiles.find(p => p.user_id === c.student_id || p.student_id?.toLowerCase() === sid)

          return (
            sid === param0 ||
            (stu && (stu.id.toLowerCase() === param0 || stu.email.toLowerCase() === param0)) ||
            (prof && (prof.user_id.toLowerCase() === param0 || prof.student_id?.toLowerCase() === param0))
          )
        })
      }

      // Filter by certificate id or code
      if (lower.includes('where c.id') || lower.includes('where id =')) {
        certs = certs.filter(c => String(c.id).toLowerCase() === param0 || String(c.certificate_id).toLowerCase() === param0)
      }

      const combined = certs.map(c => {
        const stu = this.data.users.find(u => u.id === c.student_id || u.email.toLowerCase() === String(c.student_id).toLowerCase()) || {}
        const prof = this.data.profiles.find(p => p.user_id === c.student_id || p.student_id === c.student_id || p.user_id === stu.id) || {}
        return {
          ...c,
          title: c.title || c.certificate_name,
          certificate_name: c.certificate_name || c.title,
          type: c.type || c.certificate_type || 'Ambassador',
          certificate_type: c.certificate_type || c.type || 'Ambassador',
          file_key: c.file_key || c.storage_key,
          storage_key: c.storage_key || c.file_key,
          file_path: c.file_path || c.file_key || c.storage_key,
          studentName: prof.full_name || 'Student Recipient',
          studentEmail: stu.email || '',
          studentCode: prof.student_id || 'GSA-2026-001',
          studentUniversity: prof.university || 'CampusConnect Ambassador Network'
        }
      })
      return { rows: combined, command: 'SELECT', rowCount: combined.length, oid: 0, fields: [] }
    }

    // 10. INSERT INTO certificates
    if (lower.startsWith('insert into certificates')) {
      const [
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
        file_url,
        qr_code
      ] = params

      const resolvedTitle = title || certificate_name || 'Verified Certificate'
      const resolvedType = certificate_type || type || 'Ambassador'
      const resolvedKey = storage_key || file_key || `certificates/${certificate_id}.pdf`

      const newCert = {
        id,
        certificate_id,
        student_id,
        title: resolvedTitle,
        certificate_name: resolvedTitle,
        certificate_type: resolvedType,
        type: resolvedType,
        program: program || 'CampusConnect Ambassador Program',
        issue_date: issue_date || new Date().toISOString().split('T')[0],
        description: description || '',
        storage_key: resolvedKey,
        file_key: resolvedKey,
        file_path: resolvedKey,
        file_url: file_url || `/api/student/certificates/${certificate_id}/download`,
        qr_code,
        status: 'Valid',
        created_at: new Date(),
        updated_at: new Date()
      }
      this.data.certificates.push(newCert)
      this.save()
      return { rows: [newCert], command: 'INSERT', rowCount: 1, oid: 0, fields: [] }
    }

    // 11. DELETE FROM certificates
    if (lower.startsWith('delete from certificates')) {
      const idParam = params[0] ? String(params[0]).trim().toLowerCase() : null
      if (idParam) {
        this.data.certificates = this.data.certificates.filter(c =>
          String(c.id).toLowerCase() !== idParam &&
          String(c.certificate_id).toLowerCase() !== idParam
        )
      }
      this.save()
      return { rows: [], command: 'DELETE', rowCount: 1, oid: 0, fields: [] }
    }

    // 12. UPDATE certificates
    if (lower.startsWith('update certificates')) {
      const idParam = params[params.length - 1] ? String(params[params.length - 1]).trim().toLowerCase() : null
      for (const c of this.data.certificates) {
        if (String(c.id).toLowerCase() === idParam || String(c.certificate_id).toLowerCase() === idParam) {
          if (lower.includes("status = 'revoked'")) {
            c.status = 'Revoked'
          } else if (lower.includes('status =')) {
            const m = text.match(/status\s*=\s*'([^']+)'/i)
            if (m) c.status = m[1]
          }
          if (lower.includes('title =') && params[0]) c.title = params[0]
          c.updated_at = new Date()
        }
      }
      this.save()
      return { rows: [], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] }
    }

    // 13. INSERT INTO audit_logs
    if (lower.startsWith('insert into audit_logs')) {
      const [user_id, action, resource, resource_id, metadata, ip_address] = params
      const newLog = {
        id: 'log-' + Date.now(),
        user_id,
        action,
        resource,
        resource_id,
        metadata: typeof metadata === 'string' ? JSON.parse(metadata) : metadata,
        ip_address,
        created_at: new Date()
      }
      this.data.audit_logs.push(newLog)
      this.save()
      return { rows: [newLog], command: 'INSERT', rowCount: 1, oid: 0, fields: [] }
    }

    // 13b. SELECT FROM events
    if (lower.includes('from events')) {
      if (lower.startsWith('select count(') || lower.startsWith('select count*')) {
        return { rows: [{ count: (this.data.events || []).length }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] }
      }
      const studentId = params[0] ? String(params[0]).trim() : null
      const mappedEvents = (this.data.events || []).map(e => {
        const regs = (this.data.event_registrations || []).filter(r => r.event_id === e.id && r.status === 'Registered')
        const isRegistered = studentId ? (this.data.event_registrations || []).some(r => r.event_id === e.id && r.student_id === studentId && r.status === 'Registered') : false
        return {
          ...e,
          meeting_link: e.meeting_link || e.meetingLink,
          meetingLink: e.meeting_link || e.meetingLink,
          banner_url: e.banner_url || e.bannerURL,
          bannerURL: e.banner_url || e.bannerURL,
          max_participants: e.max_participants || 100,
          maxCapacity: e.max_participants || 100,
          attendeeCount: regs.length,
          registeredCount: regs.length,
          isRegistered
        }
      })
      return { rows: mappedEvents, command: 'SELECT', rowCount: mappedEvents.length, oid: 0, fields: [] }
    }

    // 13c. INSERT INTO event_registrations
    if (lower.startsWith('insert into event_registrations')) {
      const [event_id, student_id] = params
      this.data.event_registrations = this.data.event_registrations || []
      const existing = this.data.event_registrations.find(r => r.event_id === event_id && r.student_id === student_id)
      if (existing) {
        existing.status = 'Registered'
      } else {
        this.data.event_registrations.push({
          id: 'reg-' + Date.now(),
          event_id,
          student_id,
          status: 'Registered',
          registered_at: new Date()
        })
      }
      this.save()
      return { rows: [], command: 'INSERT', rowCount: 1, oid: 0, fields: [] }
    }

    // 14. Generic SELECT
    for (const table of Object.keys(this.data)) {
      if (lower.startsWith(`select * from ${table}`) || lower.includes(`from ${table}`)) {
        let rows = [...this.data[table]]
        if (params.length > 0 && (lower.includes('where student_id =') || lower.includes('where student_id='))) {
          const sid = String(params[0]).toLowerCase()
          rows = rows.filter(r => String(r.student_id || '').toLowerCase() === sid)
        }
        return { rows, command: 'SELECT', rowCount: rows.length, oid: 0, fields: [] }
      }
    }

    return { rows: [], command: 'UNKNOWN', rowCount: 0, oid: 0, fields: [] }
  }
}

export const fallbackStore = new FallbackStore()

export async function query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
  if (pool) {
    try {
      return await pool.query<T>(text, params)
    } catch (err: any) {
      console.warn('[PostgreSQL Pool Warning, using resilient store fallback]:', err?.message || err)
      return fallbackStore.query(text, params)
    }
  }
  return fallbackStore.query(text, params)
}

export async function runMigration() {
  if (!pool) {
    console.log('[Migration] Resilient store active.')
    fallbackStore.init()
    return
  }
  try {
    console.log('[Migration] Running PostgreSQL schema migrations...')
    await pool.query(SCHEMA_SQL)
    await pool.query(`
      ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_type VARCHAR(100) DEFAULT 'Ambassador';
      ALTER TABLE certificates ADD COLUMN IF NOT EXISTS storage_key VARCHAR(255);
      ALTER TABLE certificates ADD COLUMN IF NOT EXISTS file_path VARCHAR(255);
      ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_name VARCHAR(255);
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_count INT NOT NULL DEFAULT 0;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_device VARCHAR(100);
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_browser VARCHAR(100);
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(100);
    `).catch(() => {})
    console.log('[Migration] Schema migration completed successfully.')
  } catch (err: any) {
    console.warn('[Migration] Notice during schema migration:', err.message)
  }
}
