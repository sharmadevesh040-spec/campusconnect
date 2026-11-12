import bcrypt from 'bcryptjs'
import { query, fallbackStore } from './index'

export async function seedDatabase() {
  console.log('[Seed] Checking and seeding real database records...')

  const studentPass = await bcrypt.hash('student123', 10)
  const adminPass = await bcrypt.hash('admin123', 10)
  const superPass = await bcrypt.hash('superadmin123', 10)

  // Seed Users & Profiles
  const defaultUsers = [
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'alex@campusconnect.edu',
      password_hash: studentPass,
      role: 'student',
      is_verified: true,
      profile: {
        full_name: 'Alex Chen',
        student_id: 'GSA-2026-042',
        phone: '+1 (555) 234-5678',
        university: 'California Institute of Technology',
        college: 'Engineering & Applied Science',
        course: 'B.Tech / B.S.',
        branch: 'Computer Science',
        year: 3,
        semester: 6,
        skills: ['React', 'TypeScript', 'Node.js', 'Public Speaking', 'Community Building'],
        bio: 'Passionate student ambassador organizing tech meetups, workshops, and open-source hackathons.',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        completion_pct: 88,
        is_active: true
      }
    },
    {
      id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      email: 'admin@campusconnect.edu',
      password_hash: adminPass,
      role: 'admin',
      is_verified: true,
      profile: {
        full_name: 'Dr. Sarah Jenkins',
        student_id: 'ADM-001',
        phone: '+1 (555) 987-6543',
        university: 'CampusConnect University Network',
        college: 'Student Affairs',
        course: 'Administration',
        branch: 'Program Leadership',
        year: 0,
        semester: 0,
        skills: ['Mentorship', 'Program Management', 'Interview Coordination'],
        bio: 'Regional Student Ambassador Program Director.',
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
        completion_pct: 100,
        is_active: true
      }
    },
    {
      id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      email: 'superadmin@campusconnect.edu',
      password_hash: superPass,
      role: 'super_admin',
      is_verified: true,
      profile: {
        full_name: 'Prof. Michael Vance',
        student_id: 'SADM-001',
        phone: '+1 (555) 555-0199',
        university: 'CampusConnect Global',
        college: 'Executive Office',
        course: 'Executive',
        branch: 'Operations',
        year: 0,
        semester: 0,
        skills: ['Executive Oversight', 'System Security', 'Auditing'],
        bio: 'Super Administrator with system-wide privileges.',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
        completion_pct: 100,
        is_active: true
      }
    }
  ]

  const defaultInterviews = [
    {
      id: 'int-101',
      student_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Google Student Ambassador — Round 2 Technical & Leadership',
      organization: 'Google Student Ambassador Program',
      date: '2026-11-15',
      time: '10:30 AM',
      duration: 45,
      type: 'Online',
      location: 'Google Meet Virtual Room #4',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      interviewer: 'Sarah Jenkins (Program Coordinator) & David Miller (Tech Lead)',
      instructions: 'Please be in a quiet room, have your camera enabled, and be prepared to discuss your campus tech initiative using the STAR framework (Situation, Task, Action, Result).',
      status: 'Confirmed'
    },
    {
      id: 'int-102',
      student_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Campus Ambassador Lead Orientation Round',
      organization: 'University Innovation Network',
      date: '2026-11-22',
      time: '02:00 PM',
      duration: 30,
      type: 'Online',
      location: 'Zoom Room #12',
      meeting_link: 'https://zoom.us/j/1234567890',
      interviewer: 'Campus Program Director',
      instructions: 'Review orientation slides in the Resources tab before joining.',
      status: 'Scheduled'
    }
  ]

  const defaultCertificates = [
    {
      id: 'cert-101',
      certificate_id: 'GSA-2026-000123',
      student_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      certificate_name: 'Google Student Ambassador — Certificate of Participation',
      program: 'Google Student Ambassador Program 2026',
      issue_date: '2026-11-10',
      file_key: 'certificates/sample-gsa-cert.pdf',
      file_url: '/api/certificates/cert-101/download',
      qr_code: 'https://campusconnect.edu/verify/GSA-2026-000123',
      status: 'Valid'
    },
    {
      id: 'cert-102',
      certificate_id: 'UIN-2026-889104',
      student_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      certificate_name: 'Campus Tech Innovator Award',
      program: 'University Tech Innovation Cohort',
      issue_date: '2026-10-15',
      file_key: 'certificates/sample-uin-cert.pdf',
      file_url: '/api/certificates/cert-102/download',
      qr_code: 'https://campusconnect.edu/verify/UIN-2026-889104',
      status: 'Valid'
    }
  ]

  const defaultEvents: any[] = []

  const defaultTasks = [
    {
      id: 'tsk-101',
      student_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Complete Ambassador Orientation Modules',
      description: 'Review the 4 core guideline modules and pass the 10-question compliance checklist.',
      deadline: '2026-11-16',
      priority: 'High',
      status: 'In Progress'
    },
    {
      id: 'tsk-102',
      student_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Submit Campus Kickoff Event Proposal',
      description: 'Submit the proposed date, guest list, and room booking request for your campus seminar.',
      deadline: '2026-11-20',
      priority: 'Urgent',
      status: 'Pending'
    },
    {
      id: 'tsk-103',
      student_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Upload Profile Verification Documents',
      description: 'Verify your university enrollment letter and current semester ID card.',
      deadline: '2026-11-14',
      priority: 'Medium',
      status: 'Completed'
    }
  ]

  const defaultAnnouncements = [
    {
      id: 'ann-101',
      title: '📢 Phase 2 Interview Schedules Published',
      message: 'Interview slots for the Google Student Ambassador winter cohort are now confirmed. Check your Interview tab for direct Google Meet links and assigned panel interviewers.',
      category: 'Interview',
      priority: 'Urgent',
      is_important: true,
      publish_date: new Date().toISOString()
    },
    {
      id: 'ann-102',
      title: '🏆 Cohort 2026 Certificate Issuance Started',
      message: 'Official digitally signed certificates with verifiable QR codes have been issued to students who completed the Fall semester milestones. Find yours under the Certificates page.',
      category: 'Certificate',
      priority: 'Normal',
      is_important: false,
      publish_date: new Date(Date.now() - 86400000).toISOString()
    }
  ]

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

  // Populate Fallback Store
  fallbackStore.data.users = defaultUsers
  fallbackStore.data.profiles = defaultUsers.map(u => ({ ...u.profile, user_id: u.id }))
  fallbackStore.data.interviews = defaultInterviews
  fallbackStore.data.certificates = defaultCertificates
  fallbackStore.data.events = defaultEvents
  fallbackStore.data.tasks = defaultTasks
  fallbackStore.data.announcements = defaultAnnouncements
  fallbackStore.data.resources = defaultResources

  // If connected to PostgreSQL, insert records
  try {
    for (const u of defaultUsers) {
      await query(
        `INSERT INTO users (id, email, password_hash, role, is_verified)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role`,
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
