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
        id: 'u-rahul-cc20260045',
        email: 'rahul@campusconnect.edu',
        password_hash: '$2b$10$rZpW106cwM6ULC/CDHtXKOsdN/9ZXI8xQRAXbYBya/oQdbG23876C', // student123
        role: 'student',
        is_verified: true,
        created_at: new Date()
      },
      {
        id: 'u-amit-cc20260046',
        email: 'amit@campusconnect.edu',
        password_hash: '$2b$10$rZpW106cwM6ULC/CDHtXKOsdN/9ZXI8xQRAXbYBya/oQdbG23876C', // student123
        role: 'student',
        is_verified: true,
        created_at: new Date()
      },
      {
        id: 'u-khushi-kanu',
        email: 'khushi.kanu123@gmail.com',
        password_hash: '$2b$10$ehrwGz.OaKhziGBL1Zih0Or303KmJZEF2yydL6GRrexwcxOtUwUb.', // PAPA@123
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
        is_active: true
      },
      {
        id: 'prof-rahul',
        user_id: 'u-rahul-cc20260045',
        full_name: 'Rahul Sharma',
        student_id: 'CC20260045',
        phone: '+91 9876543211',
        university: 'Delhi Technological University',
        college: 'School of Engineering',
        course: 'B.Tech',
        branch: 'Computer Science',
        year: 3,
        semester: 5,
        skills: ['Python', 'Cloud Computing', 'Web Development'],
        bio: 'Google Student Ambassador Candidate & Tech Fellow',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Rahul+Sharma',
        completion_pct: 90,
        is_active: true
      },
      {
        id: 'prof-amit',
        user_id: 'u-amit-cc20260046',
        full_name: 'Amit Kumar',
        student_id: 'CC20260046',
        phone: '+91 9876543212',
        university: 'Delhi Technological University',
        college: 'School of Engineering',
        course: 'B.Tech',
        branch: 'Information Technology',
        year: 3,
        semester: 5,
        skills: ['Fullstack', 'Cybersecurity', 'DevOps'],
        bio: 'Campus Ambassador & IT Scholar',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Amit+Kumar',
        completion_pct: 90,
        is_active: true
      },
      {
        id: 'prof-khushi',
        user_id: 'u-khushi-kanu',
        full_name: 'Khushi Kanu',
        student_id: 'GSA-2026-915963',
        phone: '+91 9876543210',
        university: 'Galgotias University',
        college: 'School of Computing Science and Engineering',
        course: 'B.Tech',
        branch: 'Computer Science',
        year: 2,
        semester: 4,
        skills: ['Student Ambassador', 'Python', 'Web Development', 'Community Leadership'],
        bio: 'Campus Ambassador & Tech Enthusiast',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Khushi%20Kanu',
        completion_pct: 90,
        is_active: true
      }
    ],
    email_tokens: [],
    certificates: [
      {
        id: 'cert-khushi-001',
        certificate_id: 'CERT-2026-KK670',
        student_id: 'u-khushi-kanu',
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
    events: [],
    event_registrations: [],
    tasks: [],
    announcements: [],
    notifications: [],
    audit_logs: [],
    resources: []
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
              this.data[key] = parsed[key]
            }
          }
        }
      }
    } catch {}
    // Ensure mock / placeholder data for events and resources are clean empty arrays unless explicitly created
    this.data.events = (this.data.events || []).filter(e => !e.id?.startsWith('evt-10'))
    this.data.resources = (this.data.resources || []).filter(r => !r.id?.startsWith('res-10'))
    this.data.interviews = []
    this.data.tasks = []
    this.data.announcements = []
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
      const newUser = {
        id: id || 'u-' + Date.now(),
        email: email?.toLowerCase().trim(),
        password_hash,
        role: role || 'student',
        is_verified: false,
        created_at: new Date()
      }
      this.data.users.push(newUser)
      this.save()
      return { rows: [newUser], command: 'INSERT', rowCount: 1, oid: 0, fields: [] }
    }

    // 3. INSERT INTO profiles
    if (lower.startsWith('insert into profiles')) {
      const [id, user_id, full_name, student_id, phone, university, college, course, branch, year, semester, skills, bio, avatar_url, completion_pct] = params
      const newProf = {
        id: id || 'p-' + Date.now(),
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
      this.data.profiles.push(newProf)
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

    // 7. UPDATE users SET is_verified
    if (lower.startsWith('update users') && lower.includes('is_verified')) {
      const emailParam = params[0]?.toLowerCase().trim()
      for (const u of this.data.users) {
        if (u.email === emailParam || u.id === emailParam) {
          u.is_verified = true
        }
      }
      this.save()
      return { rows: [], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] }
    }

    // 8. SELECT FROM certificates (Prioritized before users to prevent JOIN collisions)
    if (lower.includes('from certificates')) {
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

    // 9. SELECT FROM users / profiles
    if (lower.includes('from users')) {
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

      const emailParam = params[0]?.toLowerCase().trim()
      let matches = this.data.users
      if (emailParam) {
        matches = matches.filter(u => u.email === emailParam || u.id === emailParam)
      }
      const combined = matches.map(u => {
        const prof = this.data.profiles.find(p => p.user_id === u.id) || {}
        return {
          ...u,
          profile_id: prof.id,
          full_name: prof.full_name || u.email,
          student_id: prof.student_id || 'GSA-2026-001',
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
          completion_pct: prof.completion_pct || 85,
          is_active: prof.is_active ?? true
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
    `).catch(() => {})
    console.log('[Migration] Schema migration completed successfully.')
  } catch (err: any) {
    console.warn('[Migration] Notice during schema migration:', err.message)
  }
}
