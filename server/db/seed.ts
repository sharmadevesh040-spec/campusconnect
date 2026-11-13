import bcrypt from 'bcryptjs'
import { query, fallbackStore } from './index'

export async function seedDatabase() {
  console.log('[Seed] Checking and seeding real database records...')

  const studentPass = await bcrypt.hash('student123', 10)
  const adminPass = await bcrypt.hash('admin123', 10)
  const superPass = await bcrypt.hash('Devesh@09', 10)

  // Real Seed Users & Profiles (Strictly Super Administrator)
  const defaultUsers = [
    {
      id: 'a3a4c0bc-4df8-491d-be3c-4f1e92128e61',
      email: 'sharmadevesh040@gmail.com',
      password_hash: superPass,
      role: 'super_admin',
      is_verified: true,
      profile: {
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
        is_active: true
      }
    }
  ]

  const defaultInterviews: any[] = []
  const defaultCertificates: any[] = []
  const defaultEvents: any[] = []
  const defaultTasks: any[] = []
  const defaultAnnouncements: any[] = []

  const defaultResources = [
    {
      id: 'res-101',
      title: 'STAR Method Interview Guide & Framework',
      description: 'Master behavioral and leadership questions with structured Situation, Task, Action, Result frameworks.',
      category: 'Interview Preparation',
      type: 'PDF',
      url: 'https://example.com/star-guide.pdf'
    },
    {
      id: 'res-102',
      title: 'Campus Ambassador Official Brand & Media Kit',
      description: 'High-res logos, presentation templates, badges, and flyer kits for running campus events.',
      category: 'Program Guidelines',
      type: 'Website',
      url: 'https://example.com/ambassador-kit'
    }
  ]

  // Safely seed Fallback Store without wiping registered users
  for (const u of defaultUsers) {
    const idx = fallbackStore.data.users.findIndex(existing => existing.email === u.email)
    if (idx === -1) {
      fallbackStore.data.users.push(u)
      fallbackStore.data.profiles.push({ ...u.profile, user_id: u.id, id: 'prof-' + u.id })
    }
  }
  if (!fallbackStore.data.resources || fallbackStore.data.resources.length === 0) {
    fallbackStore.data.resources = defaultResources
  }

  // If connected to PostgreSQL, insert records
  try {
    for (const u of defaultUsers) {
      await query(
        `INSERT INTO users (id, email, password_hash, role, is_verified)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, password_hash = EXCLUDED.password_hash, is_verified = true`,
        [u.id, u.email, u.password_hash, u.role, u.is_verified]
      )
      await query(
        `INSERT INTO profiles (user_id, full_name, student_id, phone, university, college, course, branch, year, semester, skills, bio, avatar_url, completion_pct, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (student_id) DO UPDATE SET full_name = EXCLUDED.full_name`,
        [
          u.id, u.profile.full_name, u.profile.student_id, u.profile.phone,
          u.profile.university, u.profile.college, u.profile.course, u.profile.branch,
          u.profile.year, u.profile.semester, u.profile.skills, u.profile.bio,
          u.profile.avatar_url, u.profile.completion_pct, u.profile.is_active
        ]
      )
    }

    // Enforce sharmadevesh040@gmail.com as the exclusive Super Admin
    await query(`UPDATE users SET role = 'super_admin' WHERE LOWER(email) = 'sharmadevesh040@gmail.com'`)
    await query(`UPDATE users SET role = 'student' WHERE LOWER(email) != 'sharmadevesh040@gmail.com' AND role IN ('admin', 'super_admin')`)

    for (const item of defaultInterviews) {
      await query(
        `INSERT INTO interviews (id, student_id, title, organization, date, time, duration, type, location, meeting_link, interviewer, instructions, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING`,
        [item.id, item.student_id, item.title, item.organization, item.date, item.time, item.duration, item.type, item.location, item.meeting_link, item.interviewer, item.instructions, item.status]
      )
    }

    for (const c of defaultCertificates) {
      await query(
        `INSERT INTO certificates (id, certificate_id, student_id, certificate_name, program, issue_date, file_key, file_url, qr_code, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (certificate_id) DO NOTHING`,
        [c.id, c.certificate_id, c.student_id, c.certificate_name, c.program, c.issue_date, c.file_key, c.file_url, c.qr_code, c.status]
      )
    }

    for (const e of defaultEvents) {
      await query(
        `INSERT INTO events (id, title, description, date, time, venue, meeting_link, max_participants, banner_url, organizer, registration_deadline, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO NOTHING`,
        [e.id, e.title, e.description, e.date, e.time, e.venue, e.meeting_link, e.max_participants, e.banner_url, e.organizer, e.registration_deadline, e.status]
      )
    }

    for (const t of defaultTasks) {
      await query(
        `INSERT INTO tasks (id, student_id, title, description, deadline, priority, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [t.id, t.student_id, t.title, t.description, t.deadline, t.priority, t.status]
      )
    }

    for (const a of defaultAnnouncements) {
      await query(
        `INSERT INTO announcements (id, title, message, category, priority, is_important, publish_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [a.id, a.title, a.message, a.category, a.priority, a.is_important, a.publish_date]
      )
    }

    for (const r of defaultResources) {
      await query(
        `INSERT INTO resources (id, title, description, category, type, url)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [r.id, r.title, r.description, r.category, r.type, r.url]
      )
    }

    console.log('[Seed] Database successfully seeded with real PostgreSQL records.')
  } catch (err) {
    console.error('[Seed] PostgreSQL seeding error:', err)
  }
}
