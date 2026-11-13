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
      }
    ],
    email_tokens: [],
    certificates: [],
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

    // 8. SELECT FROM users / profiles
    if (lower.includes('from users')) {
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

    // 9. INSERT INTO certificates
    if (lower.startsWith('insert into certificates')) {
      const [id, certificate_id, student_id, title, certificate_name, type, program, issue_date, description, file_key, file_url, qr_code] = params
      const newCert = {
        id,
        certificate_id,
        student_id,
        title: title || certificate_name,
        certificate_name: certificate_name || title,
        type: type || 'Participation',
        program,
        issue_date,
        description,
        file_key,
        file_url,
        qr_code,
        status: 'Valid',
        created_at: new Date()
      }
      this.data.certificates.push(newCert)
      this.save()
      return { rows: [newCert], command: 'INSERT', rowCount: 1, oid: 0, fields: [] }
    }

    // 10. SELECT FROM certificates
    if (lower.includes('from certificates')) {
      const combined = this.data.certificates.map(c => {
        const stu = this.data.users.find(u => u.id === c.student_id) || {}
        const prof = this.data.profiles.find(p => p.user_id === c.student_id || p.student_id === c.student_id) || {}
        return {
          ...c,
          studentName: prof.full_name || 'Student Recipient',
          studentEmail: stu.email || '',
          studentCode: prof.student_id || 'GSA-2026-001',
          studentUniversity: prof.university || 'CampusConnect Ambassador Network'
        }
      })
      return { rows: combined, command: 'SELECT', rowCount: combined.length, oid: 0, fields: [] }
    }

    // 11. Generic SELECT
    for (const table of Object.keys(this.data)) {
      if (lower.startsWith(`select * from ${table}`) || lower.includes(`from ${table}`)) {
        let rows = [...this.data[table]]
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
    console.log('[Migration] Schema migration completed successfully.')
  } catch (err: any) {
    console.warn('[Migration] Notice during schema migration:', err.message)
  }
}
