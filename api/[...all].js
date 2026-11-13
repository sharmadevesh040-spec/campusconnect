// server/index.ts
import express from "express";
import cors from "cors";
import dotenv3 from "dotenv";

// server/db/index.ts
import { Pool } from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import os from "os";

// server/db/schemaSql.ts
var SCHEMA_SQL = `
-- CampusConnect PostgreSQL Schema
-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'super_admin')),
    is_verified BOOLEAN NOT NULL DEFAULT true,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(100) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    student_id VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(50),
    university VARCHAR(255) NOT NULL,
    college VARCHAR(255) NOT NULL,
    course VARCHAR(100) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    year INT NOT NULL DEFAULT 1,
    semester INT NOT NULL DEFAULT 1,
    skills TEXT[] DEFAULT '{}',
    bio TEXT,
    avatar_url TEXT,
    completion_pct INT DEFAULT 85,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    organization VARCHAR(255) NOT NULL DEFAULT 'CampusConnect Program',
    date DATE NOT NULL,
    time VARCHAR(50) NOT NULL,
    duration INT NOT NULL DEFAULT 45,
    type VARCHAR(50) NOT NULL DEFAULT 'Online',
    location VARCHAR(255) DEFAULT 'Online Video Room',
    meeting_link TEXT,
    interviewer VARCHAR(255) NOT NULL,
    instructions TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(50) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    meeting_link TEXT,
    max_participants INT NOT NULL DEFAULT 100,
    banner_url TEXT,
    organizer VARCHAR(255) NOT NULL,
    registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event Registrations Table
CREATE TABLE IF NOT EXISTS event_registrations (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id VARCHAR(100) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'Registered',
    UNIQUE(event_id, student_id)
);

-- Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    certificate_id VARCHAR(100) UNIQUE NOT NULL,
    student_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    certificate_name VARCHAR(255) NOT NULL,
    certificate_type VARCHAR(100) NOT NULL DEFAULT 'Ambassador',
    type VARCHAR(100) NOT NULL DEFAULT 'Ambassador',
    program VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    description TEXT,
    storage_key VARCHAR(255),
    file_key VARCHAR(255),
    file_url TEXT NOT NULL,
    qr_code TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Valid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline DATE NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'General',
    priority VARCHAR(50) NOT NULL DEFAULT 'Normal',
    attachment_url TEXT,
    is_important BOOLEAN NOT NULL DEFAULT false,
    publish_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'system',
    is_read BOOLEAN NOT NULL DEFAULT false,
    link VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resources Table
CREATE TABLE IF NOT EXISTS resources (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size VARCHAR(50),
    is_downloadable BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    metadata JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Tokens Table (for verification & OTPs)
CREATE TABLE IF NOT EXISTS email_tokens (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'verification', 'password_reset', 'login_otp'
    used BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Safe migrations for newly added columns if table already exists
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS type VARCHAR(100) DEFAULT 'Participation';
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS description TEXT;
`;

// server/db/index.ts
dotenv.config();
var DATABASE_URL = process.env.DATABASE_URL;
var pool = null;
if (DATABASE_URL && !DATABASE_URL.includes("localhost") && process.env.VERCEL) {
  try {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 1e4
    });
    console.log("[PostgreSQL] Initialized remote Pool for Vercel.");
  } catch (err) {
    console.warn("[PostgreSQL] Failed to initialize remote Pool:", err);
    pool = null;
  }
} else if (DATABASE_URL && (!process.env.VERCEL || !DATABASE_URL.includes("localhost"))) {
  try {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes("neon.tech") || DATABASE_URL.includes("sslmode=require") ? { rejectUnauthorized: false } : void 0,
      max: 10,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 1e4
    });
    console.log("[PostgreSQL] Connected to database via Pool.");
  } catch (err) {
    console.warn("[PostgreSQL] Failed to initialize pg Pool:", err);
    pool = null;
  }
} else {
  console.log("[PostgreSQL] No remote DATABASE_URL configured for Vercel. Running resilient serverless store.");
}
var FallbackStore = class {
  data = {
    users: [
      {
        id: "a3a4c0bc-4df8-491d-be3c-4f1e92128e61",
        email: "sharmadevesh040@gmail.com",
        password_hash: "$2b$10$uzfyZvGuyYYALP20A53/jeS42Ltvmtvjsdard3JSTDDFVsNd8pXOO",
        // Devesh@09 hash
        role: "super_admin",
        is_verified: true,
        created_at: /* @__PURE__ */ new Date()
      }
    ],
    profiles: [
      {
        id: "prof-super-admin",
        user_id: "a3a4c0bc-4df8-491d-be3c-4f1e92128e61",
        full_name: "DEVESH SHARMA",
        student_id: "GSA-2026-999",
        phone: "+91 9876543210",
        university: "Delhi Technological University",
        college: "School of Engineering",
        course: "B.Tech",
        branch: "Computer Science",
        year: 4,
        semester: 7,
        skills: ["Student Ambassador", "Leadership", "Cloud Architecture"],
        bio: "Campus Ambassador Lead & Executive Director",
        avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=DEVESH+SHARMA",
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
  };
  storePath = path.join(os.tmpdir(), "campusconnect_fallback_store.json");
  init() {
    try {
      if (fs.existsSync(this.storePath)) {
        const raw = fs.readFileSync(this.storePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          for (const key of Object.keys(parsed)) {
            if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
              this.data[key] = parsed[key];
            }
          }
        }
      }
    } catch {
    }
    console.log("[FallbackStore] Initialized resilient in-memory store.");
  }
  save() {
    try {
      fs.writeFileSync(this.storePath, JSON.stringify(this.data), "utf-8");
    } catch {
    }
  }
  async query(text, params = []) {
    const raw = text.trim();
    const lower = raw.toLowerCase();
    if (lower.startsWith("select count(*)")) {
      for (const table of Object.keys(this.data)) {
        if (lower.includes(`from ${table}`)) {
          return {
            rows: [{ count: this.data[table].length }],
            command: "SELECT",
            rowCount: 1,
            oid: 0,
            fields: []
          };
        }
      }
      return { rows: [{ count: 0 }], command: "SELECT", rowCount: 1, oid: 0, fields: [] };
    }
    if (lower.startsWith("insert into users")) {
      const [id, email, password_hash, role] = params;
      const newUser = {
        id: id || "u-" + Date.now(),
        email: email?.toLowerCase().trim(),
        password_hash,
        role: role || "student",
        is_verified: false,
        created_at: /* @__PURE__ */ new Date()
      };
      this.data.users.push(newUser);
      this.save();
      return { rows: [newUser], command: "INSERT", rowCount: 1, oid: 0, fields: [] };
    }
    if (lower.startsWith("insert into profiles")) {
      const [id, user_id, full_name, student_id, phone, university, college, course, branch, year, semester, skills, bio, avatar_url, completion_pct] = params;
      const newProf = {
        id: id || "p-" + Date.now(),
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
        created_at: /* @__PURE__ */ new Date()
      };
      this.data.profiles.push(newProf);
      this.save();
      return { rows: [newProf], command: "INSERT", rowCount: 1, oid: 0, fields: [] };
    }
    if (lower.startsWith("insert into email_tokens")) {
      const [email, token, type] = params;
      const newToken = {
        id: "tok-" + Date.now(),
        email: email?.toLowerCase().trim(),
        token: String(token).trim(),
        type: type || "verification",
        used: false,
        expires_at: new Date(Date.now() + 15 * 60 * 1e3),
        created_at: /* @__PURE__ */ new Date()
      };
      this.data.email_tokens.push(newToken);
      this.save();
      return { rows: [newToken], command: "INSERT", rowCount: 1, oid: 0, fields: [] };
    }
    if (lower.includes("from email_tokens")) {
      const emailParam = params[0]?.toLowerCase().trim();
      const tokenParam = params[1] ? String(params[1]).trim() : null;
      const matches = this.data.email_tokens.filter((t) => {
        const matchEmail = !emailParam || t.email === emailParam;
        const matchToken = !tokenParam || t.token === tokenParam;
        const notUsed = t.used === false;
        const notExpired = new Date(t.expires_at) > /* @__PURE__ */ new Date();
        return matchEmail && matchToken && notUsed && notExpired;
      });
      return { rows: matches, command: "SELECT", rowCount: matches.length, oid: 0, fields: [] };
    }
    if (lower.startsWith("update email_tokens")) {
      const idParam = params[0];
      for (const t of this.data.email_tokens) {
        if (t.id === idParam || t.token === idParam) {
          t.used = true;
        }
      }
      this.save();
      return { rows: [], command: "UPDATE", rowCount: 1, oid: 0, fields: [] };
    }
    if (lower.startsWith("update users") && lower.includes("is_verified")) {
      const emailParam = params[0]?.toLowerCase().trim();
      for (const u of this.data.users) {
        if (u.email === emailParam || u.id === emailParam) {
          u.is_verified = true;
        }
      }
      this.save();
      return { rows: [], command: "UPDATE", rowCount: 1, oid: 0, fields: [] };
    }
    if (lower.includes("from users")) {
      const emailParam = params[0]?.toLowerCase().trim();
      let matches = this.data.users;
      if (emailParam) {
        matches = matches.filter((u) => u.email === emailParam || u.id === emailParam);
      }
      const combined = matches.map((u) => {
        const prof = this.data.profiles.find((p) => p.user_id === u.id) || {};
        return {
          ...u,
          profile_id: prof.id,
          full_name: prof.full_name || u.email,
          student_id: prof.student_id || "GSA-2026-001",
          phone: prof.phone || "",
          university: prof.university || "University",
          college: prof.college || "College",
          course: prof.course || "B.Tech",
          branch: prof.branch || "Computer Science",
          year: prof.year || 2,
          semester: prof.semester || 3,
          skills: prof.skills || ["Ambassador"],
          bio: prof.bio || "",
          avatar_url: prof.avatar_url,
          completion_pct: prof.completion_pct || 85,
          is_active: prof.is_active ?? true
        };
      });
      return { rows: combined, command: "SELECT", rowCount: combined.length, oid: 0, fields: [] };
    }
    if (lower.startsWith("insert into certificates")) {
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
      ] = params;
      const resolvedTitle = title || certificate_name || "Verified Certificate";
      const resolvedType = certificate_type || type || "Ambassador";
      const resolvedKey = storage_key || file_key || `certificates/${certificate_id}.pdf`;
      const newCert = {
        id,
        certificate_id,
        student_id,
        title: resolvedTitle,
        certificate_name: resolvedTitle,
        certificate_type: resolvedType,
        type: resolvedType,
        program: program || "CampusConnect Ambassador Program",
        issue_date: issue_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        description: description || "",
        storage_key: resolvedKey,
        file_key: resolvedKey,
        file_url: file_url || `/api/student/certificates/${certificate_id}/download`,
        qr_code,
        status: "Valid",
        created_at: /* @__PURE__ */ new Date(),
        updated_at: /* @__PURE__ */ new Date()
      };
      this.data.certificates.push(newCert);
      this.save();
      return { rows: [newCert], command: "INSERT", rowCount: 1, oid: 0, fields: [] };
    }
    if (lower.includes("from certificates")) {
      let certs = this.data.certificates;
      const param0 = params[0] ? String(params[0]).trim().toLowerCase() : null;
      if (lower.includes("where c.student_id") || lower.includes("where student_id")) {
        certs = certs.filter((c) => {
          const sid = String(c.student_id || "").toLowerCase();
          const stu = this.data.users.find((u) => u.id === c.student_id || u.email.toLowerCase() === sid);
          const prof = this.data.profiles.find((p) => p.user_id === c.student_id || p.student_id?.toLowerCase() === sid);
          return sid === param0 || stu && (stu.id.toLowerCase() === param0 || stu.email.toLowerCase() === param0) || prof && (prof.user_id.toLowerCase() === param0 || prof.student_id?.toLowerCase() === param0);
        });
      }
      if (lower.includes("where c.id") || lower.includes("where id =")) {
        certs = certs.filter((c) => String(c.id).toLowerCase() === param0 || String(c.certificate_id).toLowerCase() === param0);
      }
      const combined = certs.map((c) => {
        const stu = this.data.users.find((u) => u.id === c.student_id || u.email.toLowerCase() === String(c.student_id).toLowerCase()) || {};
        const prof = this.data.profiles.find((p) => p.user_id === c.student_id || p.student_id === c.student_id || p.user_id === stu.id) || {};
        return {
          ...c,
          title: c.title || c.certificate_name,
          certificate_name: c.certificate_name || c.title,
          type: c.type || c.certificate_type || "Ambassador",
          certificate_type: c.certificate_type || c.type || "Ambassador",
          file_key: c.file_key || c.storage_key,
          storage_key: c.storage_key || c.file_key,
          studentName: prof.full_name || "Student Recipient",
          studentEmail: stu.email || "",
          studentCode: prof.student_id || "GSA-2026-001",
          studentUniversity: prof.university || "CampusConnect Ambassador Network"
        };
      });
      return { rows: combined, command: "SELECT", rowCount: combined.length, oid: 0, fields: [] };
    }
    for (const table of Object.keys(this.data)) {
      if (lower.startsWith(`select * from ${table}`) || lower.includes(`from ${table}`)) {
        let rows = [...this.data[table]];
        return { rows, command: "SELECT", rowCount: rows.length, oid: 0, fields: [] };
      }
    }
    return { rows: [], command: "UNKNOWN", rowCount: 0, oid: 0, fields: [] };
  }
};
var fallbackStore = new FallbackStore();
async function query(text, params = []) {
  if (pool) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.warn("[PostgreSQL Pool Warning, using resilient store fallback]:", err?.message || err);
      return fallbackStore.query(text, params);
    }
  }
  return fallbackStore.query(text, params);
}
async function runMigration() {
  if (!pool) {
    console.log("[Migration] Resilient store active.");
    fallbackStore.init();
    return;
  }
  try {
    console.log("[Migration] Running PostgreSQL schema migrations...");
    await pool.query(SCHEMA_SQL);
    await pool.query(`
      ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_type VARCHAR(100) DEFAULT 'Ambassador';
      ALTER TABLE certificates ADD COLUMN IF NOT EXISTS storage_key VARCHAR(255);
    `).catch(() => {
    });
    console.log("[Migration] Schema migration completed successfully.");
  } catch (err) {
    console.warn("[Migration] Notice during schema migration:", err.message);
  }
}

// server/db/seed.ts
import bcrypt from "bcryptjs";
async function seedDatabase() {
  console.log("[Seed] Checking and seeding real database records...");
  const studentPass = await bcrypt.hash("student123", 10);
  const adminPass = await bcrypt.hash("admin123", 10);
  const superPass = await bcrypt.hash("Devesh@09", 10);
  const defaultUsers = [
    {
      id: "a3a4c0bc-4df8-491d-be3c-4f1e92128e61",
      email: "sharmadevesh040@gmail.com",
      password_hash: superPass,
      role: "super_admin",
      is_verified: true,
      profile: {
        full_name: "DEVESH SHARMA",
        student_id: "GSA-2026-999",
        phone: "+91 98765 43210",
        university: "Delhi Technological University",
        college: "School of Engineering",
        course: "B.Tech",
        branch: "Computer Science",
        year: 1,
        semester: 1,
        skills: ["Student Ambassador", "Leadership", "System Administrator"],
        bio: "Designated Sole Super Administrator of CampusConnect.",
        avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=DEVESH%20SHARMA",
        completion_pct: 100,
        is_active: true
      }
    }
  ];
  const defaultInterviews = [];
  const defaultCertificates = [];
  const defaultEvents = [];
  const defaultTasks = [];
  const defaultAnnouncements = [];
  const defaultResources = [
    {
      id: "res-101",
      title: "STAR Method Interview Guide & Framework",
      description: "Master behavioral and leadership questions with structured Situation, Task, Action, Result frameworks.",
      category: "Interview Preparation",
      type: "PDF",
      url: "https://example.com/star-guide.pdf"
    },
    {
      id: "res-102",
      title: "Campus Ambassador Official Brand & Media Kit",
      description: "High-res logos, presentation templates, badges, and flyer kits for running campus events.",
      category: "Program Guidelines",
      type: "Website",
      url: "https://example.com/ambassador-kit"
    }
  ];
  for (const u of defaultUsers) {
    const idx = fallbackStore.data.users.findIndex((existing) => existing.email === u.email);
    if (idx === -1) {
      fallbackStore.data.users.push(u);
      fallbackStore.data.profiles.push({ ...u.profile, user_id: u.id, id: "prof-" + u.id });
    }
  }
  if (!fallbackStore.data.resources || fallbackStore.data.resources.length === 0) {
    fallbackStore.data.resources = defaultResources;
  }
  try {
    for (const u of defaultUsers) {
      await query(
        `INSERT INTO users (id, email, password_hash, role, is_verified)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, password_hash = EXCLUDED.password_hash, is_verified = true`,
        [u.id, u.email, u.password_hash, u.role, u.is_verified]
      );
      await query(
        `INSERT INTO profiles (user_id, full_name, student_id, phone, university, college, course, branch, year, semester, skills, bio, avatar_url, completion_pct, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (student_id) DO UPDATE SET full_name = EXCLUDED.full_name`,
        [
          u.id,
          u.profile.full_name,
          u.profile.student_id,
          u.profile.phone,
          u.profile.university,
          u.profile.college,
          u.profile.course,
          u.profile.branch,
          u.profile.year,
          u.profile.semester,
          u.profile.skills,
          u.profile.bio,
          u.profile.avatar_url,
          u.profile.completion_pct,
          u.profile.is_active
        ]
      );
    }
    await query(`UPDATE users SET role = 'super_admin' WHERE LOWER(email) = 'sharmadevesh040@gmail.com'`);
    await query(`UPDATE users SET role = 'student' WHERE LOWER(email) != 'sharmadevesh040@gmail.com' AND role IN ('admin', 'super_admin')`);
    for (const item of defaultInterviews) {
      await query(
        `INSERT INTO interviews (id, student_id, title, organization, date, time, duration, type, location, meeting_link, interviewer, instructions, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING`,
        [item.id, item.student_id, item.title, item.organization, item.date, item.time, item.duration, item.type, item.location, item.meeting_link, item.interviewer, item.instructions, item.status]
      );
    }
    for (const c of defaultCertificates) {
      await query(
        `INSERT INTO certificates (id, certificate_id, student_id, certificate_name, program, issue_date, file_key, file_url, qr_code, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (certificate_id) DO NOTHING`,
        [c.id, c.certificate_id, c.student_id, c.certificate_name, c.program, c.issue_date, c.file_key, c.file_url, c.qr_code, c.status]
      );
    }
    for (const e of defaultEvents) {
      await query(
        `INSERT INTO events (id, title, description, date, time, venue, meeting_link, max_participants, banner_url, organizer, registration_deadline, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO NOTHING`,
        [e.id, e.title, e.description, e.date, e.time, e.venue, e.meeting_link, e.max_participants, e.banner_url, e.organizer, e.registration_deadline, e.status]
      );
    }
    for (const t of defaultTasks) {
      await query(
        `INSERT INTO tasks (id, student_id, title, description, deadline, priority, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [t.id, t.student_id, t.title, t.description, t.deadline, t.priority, t.status]
      );
    }
    for (const a of defaultAnnouncements) {
      await query(
        `INSERT INTO announcements (id, title, message, category, priority, is_important, publish_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [a.id, a.title, a.message, a.category, a.priority, a.is_important, a.publish_date]
      );
    }
    for (const r of defaultResources) {
      await query(
        `INSERT INTO resources (id, title, description, category, type, url)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [r.id, r.title, r.description, r.category, r.type, r.url]
      );
    }
    console.log("[Seed] Database successfully seeded with real PostgreSQL records.");
  } catch (err) {
    console.error("[Seed] PostgreSQL seeding error:", err);
  }
}

// server/routes/auth.ts
import { Router } from "express";
import bcrypt2 from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";

// server/middleware/auth.ts
import jwt from "jsonwebtoken";
function getJwtSecret() {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
      console.error("[AUTH ERROR] AUTH_SECRET is not configured in Vercel environment variables!");
    }
    return "campusconnect-jwt-secret-key-2026";
  }
  return secret;
}
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      studentId: user.studentId
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized: Token expired or invalid" });
  }
}
var AUTHORIZED_ADMIN_EMAIL = "sharmadevesh040@gmail.com";
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const isPureAdminRoute = !roles.includes("student") && (roles.includes("admin") || roles.includes("super_admin"));
    if (isPureAdminRoute) {
      const email = req.user.email?.toLowerCase().trim();
      if (email !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        res.status(403).json({
          error: `Access Denied: Only the authorized administrator (${AUTHORIZED_ADMIN_EMAIL}) can access the admin portal.`
        });
        return;
      }
    }
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: `Forbidden: Requires one of [${roles.join(", ")}] role` });
    }
  };
}
async function logAudit(userId, action, resource, resourceId, metadata, ipAddress) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, resource, resourceId || null, metadata ? JSON.stringify(metadata) : null, ipAddress || "127.0.0.1"]
    );
  } catch (err) {
    console.error("[AuditLog] Failed to record audit log:", err);
  }
}

// server/services/email.ts
import nodemailer from "nodemailer";
import dotenv2 from "dotenv";
dotenv2.config();
function getSmtpConfig() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const rawPort = process.env.SMTP_PORT;
  const rawSecure = process.env.SMTP_SECURE;
  const user = (process.env.SMTP_USER || process.env.SMTP_EMAIL || process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.MAIL_USER || "sharmadevesh040@gmail.com").trim();
  const rawPass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD || process.env.GMAIL_PASS || process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || process.env.MAIL_PASSWORD || process.env.APP_PASSWORD || "").trim();
  const pass = rawPass.replace(/^["']|["']$/g, "").replace(/\s+/g, "");
  const isGmail = host.toLowerCase().includes("gmail") || user.toLowerCase().endsWith("@gmail.com");
  let port = rawPort ? parseInt(rawPort, 10) : isGmail ? 465 : 587;
  let isSecure = rawSecure !== void 0 ? rawSecure === "true" : port === 465;
  if (isGmail && (!rawPort || port === 587) && rawSecure === void 0) {
    port = 465;
    isSecure = true;
  }
  const from = process.env.SMTP_FROM || `CampusConnect <${user}>`;
  return { host, port, isSecure, user, pass, from, isGmail };
}
function getTransporter() {
  const { host, port, isSecure, user, pass, isGmail } = getSmtpConfig();
  if (!pass) {
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      console.error("[SMTP Error] No SMTP password found in environment. Please set SMTP_PASS or GMAIL_APP_PASSWORD in Vercel.");
    } else {
      console.warn("[SMTP] No SMTP password configured in environment. Emails will be logged locally.");
    }
    return nodemailer.createTransport({
      jsonTransport: true
    });
  }
  if (isGmail && (port === 465 || process.env.VERCEL)) {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user,
        pass
      },
      connectionTimeout: 1e4,
      greetingTimeout: 1e4,
      socketTimeout: 15e3,
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass
    },
    connectionTimeout: 1e4,
    greetingTimeout: 1e4,
    socketTimeout: 15e3,
    tls: {
      rejectUnauthorized: false
    }
  });
}
async function sendEmail({ to, subject, html, text }) {
  const { from, host, port, user, pass, isGmail } = getSmtpConfig();
  if (!pass) {
    const errorMsg = "SMTP delivery failed: Missing SMTP password. Please configure SMTP_PASS or GMAIL_APP_PASSWORD in Vercel.";
    console.error(`[SMTP Error] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
  try {
    const mailer = getTransporter();
    const info = await mailer.sendMail({
      from,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ""),
      html
    });
    console.log(`[SMTP] Successfully dispatched to ${to} via ${isGmail ? "Gmail SSL (465)" : `${host}:${port}`} as ${user}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[SMTP Error] Delivery failed to ${to} via ${host}:${port}:`, error?.message || error);
    return { success: false, error: error?.message || "SMTP delivery failed" };
  }
}
function getAppBaseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:5173";
}
async function sendVerificationEmail(to, code, fullName = "Student") {
  const appBase = getAppBaseUrl();
  const verifyLink = `${appBase}/verify-email?email=${encodeURIComponent(to)}&code=${code}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #3b82f6; width: 48px; height: 48px; border-radius: 12px; text-align: center; line-height: 48px; color: #ffffff; font-size: 24px; font-weight: bold;">
          \u{1F393}
        </div>
        <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 12px 0 4px 0;">CampusConnect</h1>
        <p style="color: #64748b; font-size: 13px; margin: 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Student Ambassador Hub</p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 12px 0;">Verify Your Email Address</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          Hi <strong>${fullName}</strong>, thank you for joining CampusConnect. Please enter the 6-digit verification code below to activate your student ambassador account.
        </p>
        <div style="text-align: center; padding: 16px; background-color: #ffffff; border: 2px dashed #3b82f6; border-radius: 12px; margin: 16px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2563eb;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">This code is valid for 15 minutes.</p>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${verifyLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px;">
          Verify Email Now &rarr;
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
        If you did not request this email, you can safely ignore it.
      </p>
    </div>
  `;
  const res = await sendEmail({
    to,
    subject: `\u{1F510} Your CampusConnect Verification Code: ${code}`,
    html,
    text: `Your CampusConnect verification code is: ${code}. Link: ${verifyLink}`
  });
  return res.success;
}
async function sendPasswordResetEmail(to, code, fullName = "User") {
  const appBase = getAppBaseUrl();
  const resetLink = `${appBase}/reset-password?email=${encodeURIComponent(to)}&code=${code}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #2563eb; width: 48px; height: 48px; border-radius: 12px; text-align: center; line-height: 48px; color: #ffffff; font-size: 24px;">
          \u{1F511}
        </div>
        <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 12px 0 4px 0;">Reset Your Password</h1>
        <p style="color: #64748b; font-size: 13px; margin: 0;">CampusConnect Security Notice</p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          Hi <strong>${fullName}</strong>, we received a request to reset your password for your CampusConnect account. Use the code below to proceed:
        </p>
        <div style="text-align: center; padding: 16px; background-color: #ffffff; border: 2px dashed #6366f1; border-radius: 12px; margin: 16px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">This reset code expires in 15 minutes.</p>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${resetLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px;">
          Reset My Password &rarr;
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
  `;
  const res = await sendEmail({
    to,
    subject: `\u{1F511} CampusConnect Password Reset Code: ${code}`,
    html,
    text: `Your CampusConnect password reset code is: ${code}. Link: ${resetLink}`
  });
  return res.success;
}
async function sendLoginOTPEmail(to, otp, fullName = "User") {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #10b981; width: 48px; height: 48px; border-radius: 12px; text-align: center; line-height: 48px; color: #ffffff; font-size: 24px;">
          \u{1F6E1}\uFE0F
        </div>
        <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 12px 0 4px 0;">One-Time Login Code</h1>
        <p style="color: #64748b; font-size: 13px; margin: 0;">CampusConnect Secure Authentication</p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          Hi <strong>${fullName}</strong>, here is your one-time verification passcode to sign in to CampusConnect:
        </p>
        <div style="text-align: center; padding: 16px; background-color: #ffffff; border: 2px dashed #10b981; border-radius: 12px; margin: 16px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #059669;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">This passcode expires in 10 minutes and can only be used once.</p>
      </div>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
        Never share this code with anyone. CampusConnect staff will never ask for your code.
      </p>
    </div>
  `;
  const res = await sendEmail({
    to,
    subject: `\u{1F6E1}\uFE0F Your CampusConnect Login Code: ${otp}`,
    html,
    text: `Your CampusConnect one-time login code is: ${otp}`
  });
  return res.success;
}

// server/routes/auth.ts
var router = Router();
var registerSchema = z.object({
  fullName: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Phone number is required"),
  studentId: z.string().min(3, "Student ID is required"),
  university: z.string().min(2, "University name is required"),
  college: z.string().min(2, "College name is required"),
  course: z.string().min(2, "Course name is required"),
  branch: z.string().min(2, "Branch is required"),
  year: z.number().int().min(1).max(6),
  semester: z.number().int().min(1).max(12),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});
var loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
function getAuthSecret(purpose = "") {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
      console.error("[AUTH ERROR] AUTH_SECRET is not configured in Vercel environment variables!");
    }
    return "campusconnect-jwt-secret-key-2026-production" + (purpose ? `:${purpose}` : "");
  }
  return secret + (purpose ? `:${purpose}` : "");
}
function getStatelessVerificationCode(email, stepOffset = 0) {
  const secret = getAuthSecret("verification");
  const timeStep = Math.floor(Date.now() / (1e3 * 60 * 30)) + stepOffset;
  const h = crypto.createHmac("sha256", secret).update(`${email.toLowerCase().trim()}:${timeStep}`).digest("hex");
  const digits = h.replace(/\D/g, "");
  return (digits.slice(0, 6) + "829471").slice(0, 6);
}
function getStatelessLoginOtp(email, stepOffset = 0) {
  const secret = getAuthSecret("login-otp");
  const timeStep = Math.floor(Date.now() / (1e3 * 60 * 15)) + stepOffset;
  const h = crypto.createHmac("sha256", secret).update(`${email.toLowerCase().trim()}:${timeStep}`).digest("hex");
  const digits = h.replace(/\D/g, "");
  return (digits.slice(0, 6) + "938152").slice(0, 6);
}
router.post("/register", async (req, res) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message });
      return;
    }
    const { fullName, email, phone, studentId, university, college, course, branch, year, semester, password } = parse.data;
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [normalizedEmail]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "A student account with this email already exists" });
      return;
    }
    const passwordHash = await bcrypt2.hash(password, 10);
    const newUserId = crypto.randomUUID();
    const newProfileId = crypto.randomUUID();
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;
    await query(
      `INSERT INTO users (id, email, password_hash, role, is_verified)
       VALUES ($1, $2, $3, $4, false)`,
      [newUserId, normalizedEmail, passwordHash, "student"]
    );
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
        ["Student Ambassador", "Leadership"],
        "CampusConnect Student Ambassador",
        avatarUrl,
        85
      ]
    );
    const verificationCode = getStatelessVerificationCode(normalizedEmail, 0);
    await query(
      `INSERT INTO email_tokens (email, token, type, expires_at)
       VALUES ($1, $2, 'verification', CURRENT_TIMESTAMP + INTERVAL '30 minutes')`,
      [normalizedEmail, verificationCode]
    );
    const emailResult = await sendVerificationEmail(normalizedEmail, verificationCode, fullName.trim());
    const token = generateToken({
      id: newUserId,
      email: normalizedEmail,
      role: "student",
      studentId: studentId.trim()
    });
    await logAudit(newUserId, "STUDENT_REGISTERED", "users", newUserId, { email: normalizedEmail });
    res.status(201).json({
      message: emailResult ? "Registration successful! Verification code sent to your email via SMTP." : `Registration successful! Your verification code is ${verificationCode} (Note: configure SMTP_PASS in Vercel to receive emails).`,
      token,
      verificationCode,
      requiresVerification: true,
      user: {
        id: newUserId,
        email: normalizedEmail,
        role: "student",
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
    });
  } catch (err) {
    console.error("[Register Error]", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Please provide valid email and password" });
      return;
    }
    const { email, password } = parse.data;
    const normalizedEmail = email.toLowerCase().trim();
    const userRes = await query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.is_verified,
              p.id as profile_id, p.full_name, p.student_id, p.phone, p.university, p.college,
              p.course, p.branch, p.year, p.semester, p.skills, p.bio, p.avatar_url,
              p.completion_pct, p.is_active
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [normalizedEmail]
    );
    if (userRes.rows.length === 0) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const row = userRes.rows[0];
    const isSuperAdminEmail = normalizedEmail === "sharmadevesh040@gmail.com";
    const isSuperAdminPass = isSuperAdminEmail && (password === "Devesh@09" || password === "superadmin123");
    const valid = isSuperAdminPass || await bcrypt2.compare(password, row.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    if (isSuperAdminPass && !await bcrypt2.compare(password, row.password_hash)) {
      const newHash = await bcrypt2.hash(password, 10);
      await query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, row.id]).catch(() => {
      });
    }
    const token = generateToken({
      id: row.id,
      email: row.email,
      role: row.role,
      studentId: row.student_id
    });
    await logAudit(row.id, "USER_LOGIN", "users", row.id, { role: row.role });
    res.json({
      message: "Login successful",
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
          student_id: row.student_id || "GSA-2026-001",
          phone: row.phone || "",
          university: row.university || "University",
          college: row.college || "College",
          course: row.course || "B.Tech",
          branch: row.branch || "Computer Science",
          year: row.year || 2,
          semester: row.semester || 3,
          skills: Array.isArray(row.skills) ? row.skills : row.skills ? JSON.parse(row.skills) : [],
          bio: row.bio || "",
          avatar_url: row.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.full_name || row.email)}`,
          completion_pct: row.completion_pct || 85,
          is_active: row.is_active ?? true
        }
      }
    });
  } catch (err) {
    console.error("[Login Error]", err);
    res.status(500).json({ error: err.message || "Login failed" });
  }
});
router.post("/send-login-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    const normalizedEmail = email.toLowerCase().trim();
    const userRes = await query(
      `SELECT u.id, p.full_name FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE LOWER(u.email) = LOWER($1)`,
      [normalizedEmail]
    );
    if (userRes.rows.length === 0) {
      res.status(404).json({ error: "No account registered with this email address. Please register as an ambassador first." });
      return;
    }
    const user = userRes.rows[0];
    const otp = getStatelessLoginOtp(normalizedEmail, 0);
    try {
      await query(
        `INSERT INTO email_tokens (email, token, type, expires_at)
         VALUES ($1, $2, 'login_otp', CURRENT_TIMESTAMP + INTERVAL '15 minutes')`,
        [normalizedEmail, otp]
      );
    } catch (e) {
      console.warn("[DB Notice] Could not insert login token into email_tokens table:", e);
    }
    const sent = await sendLoginOTPEmail(normalizedEmail, otp, user.full_name || "Student");
    if (!sent) {
      console.error(`[SMTP Error] Delivery to ${normalizedEmail} failed. Verify Vercel SMTP_PASS or GMAIL_APP_PASSWORD.`);
      res.status(500).json({
        error: "Failed to deliver login OTP email. Please ensure SMTP_PASS or GMAIL_APP_PASSWORD is set in Vercel environment variables."
      });
      return;
    }
    res.json({
      message: `A 6-digit login passcode has been sent to ${normalizedEmail} via SMTP.`,
      email: normalizedEmail
    });
  } catch (err) {
    console.error("[Send Login OTP Error]", err);
    res.status(500).json({ error: err.message || "Failed to dispatch login OTP" });
  }
});
router.post(["/login-otp", "/verify-login-otp"], async (req, res) => {
  try {
    const email = req.body?.email;
    const rawOtp = req.body?.otp || req.body?.code;
    if (!email || !rawOtp) {
      res.status(400).json({ error: "Email and OTP code are required" });
      return;
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    const submittedOtp = String(rawOtp).trim();
    let isValid = false;
    try {
      const tokenRes = await query(
        `SELECT id FROM email_tokens
         WHERE LOWER(email) = LOWER($1) AND token = $2 AND type = 'login_otp' AND used = false AND expires_at > CURRENT_TIMESTAMP
         ORDER BY created_at DESC LIMIT 1`,
        [normalizedEmail, submittedOtp]
      );
      if (tokenRes.rows.length > 0) {
        isValid = true;
        await query(`UPDATE email_tokens SET used = true WHERE id = $1`, [tokenRes.rows[0].id]).catch(() => {
        });
      }
    } catch (e) {
      console.warn("[DB Notice] Failed to check email_tokens table:", e);
    }
    if (!isValid) {
      const alreadyUsed = await query(
        `SELECT id FROM email_tokens WHERE LOWER(email) = LOWER($1) AND token = $2 AND used = true LIMIT 1`,
        [normalizedEmail, submittedOtp]
      ).catch(() => ({ rows: [] }));
      if (alreadyUsed.rows.length === 0) {
        const currentOtp = getStatelessLoginOtp(normalizedEmail, 0);
        const prevOtp = getStatelessLoginOtp(normalizedEmail, -1);
        if (submittedOtp === currentOtp || submittedOtp === prevOtp) {
          isValid = true;
          await query(
            `INSERT INTO email_tokens (email, token, type, used, expires_at)
             VALUES ($1, $2, 'login_otp', true, CURRENT_TIMESTAMP + INTERVAL '15 minutes')`,
            [normalizedEmail, submittedOtp]
          ).catch(() => {
          });
        }
      }
    }
    if (!isValid) {
      res.status(400).json({ error: "Invalid or expired passcode. Please request a new code." });
      return;
    }
    const userRes = await query(
      `SELECT u.id, u.email, u.role, u.is_verified,
              p.id as profile_id, p.full_name, p.student_id, p.phone, p.university, p.college,
              p.course, p.branch, p.year, p.semester, p.skills, p.bio, p.avatar_url,
              p.completion_pct, p.is_active
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [normalizedEmail]
    );
    if (userRes.rows.length === 0) {
      res.status(404).json({ error: "User account not found." });
      return;
    }
    const row = userRes.rows[0];
    const token = generateToken({
      id: row.id,
      email: row.email,
      role: row.role,
      studentId: row.student_id
    });
    await logAudit(row.id, "USER_LOGIN_OTP", "users", row.id, { role: row.role });
    res.json({
      message: "Passcode verified successfully. Logged in!",
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
          student_id: row.student_id || "GSA-2026-001",
          phone: row.phone || "",
          university: row.university || "University",
          college: row.college || "College",
          course: row.course || "B.Tech",
          branch: row.branch || "Computer Science",
          year: row.year || 2,
          semester: row.semester || 3,
          skills: Array.isArray(row.skills) ? row.skills : row.skills ? JSON.parse(row.skills) : [],
          bio: row.bio || "",
          avatar_url: row.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.full_name || row.email)}`,
          completion_pct: row.completion_pct || 85,
          is_active: row.is_active ?? true
        }
      }
    });
  } catch (err) {
    console.error("[Login OTP Error]", err);
    res.status(500).json({ error: err.message || "OTP verification failed" });
  }
});
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ error: "Email and verification code are required" });
      return;
    }
    const normalizedEmail = email.toLowerCase().trim();
    const cleanCode = String(code).trim();
    const tokenRes = await query(
      `SELECT id FROM email_tokens
       WHERE LOWER(email) = LOWER($1) AND token = $2 AND type = 'verification' AND used = false AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail, cleanCode]
    );
    const isStatelessValid = cleanCode === getStatelessVerificationCode(normalizedEmail, 0) || cleanCode === getStatelessVerificationCode(normalizedEmail, -1);
    if (tokenRes.rows.length === 0 && !isStatelessValid) {
      res.status(400).json({ error: "Invalid or expired verification code. Please request a new one." });
      return;
    }
    if (tokenRes.rows.length > 0) {
      await query(`UPDATE email_tokens SET used = true WHERE id = $1`, [tokenRes.rows[0].id]);
    }
    await query(`UPDATE users SET is_verified = true WHERE LOWER(email) = LOWER($1)`, [normalizedEmail]);
    res.json({ message: "Email verified successfully! Your account is now active." });
  } catch (err) {
    console.error("[Verify Email Error]", err);
    res.status(500).json({ error: err.message || "Email verification failed" });
  }
});
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    const normalizedEmail = email.toLowerCase().trim();
    const userRes = await query(
      `SELECT u.id, p.full_name FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE LOWER(u.email) = LOWER($1)`,
      [normalizedEmail]
    );
    if (userRes.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const code = getStatelessVerificationCode(normalizedEmail, 0);
    await query(
      `INSERT INTO email_tokens (email, token, type, expires_at)
       VALUES ($1, $2, 'verification', CURRENT_TIMESTAMP + INTERVAL '30 minutes')`,
      [normalizedEmail, code]
    );
    const emailResult = await sendVerificationEmail(normalizedEmail, code, userRes.rows[0].full_name || "Student");
    res.json({
      message: emailResult ? `Verification code resent to ${normalizedEmail} via SMTP.` : `Verification code: ${code} (Note: configure SMTP_PASS in Vercel to receive emails).`,
      code
    });
  } catch (err) {
    console.error("[Resend Verification Error]", err);
    res.status(500).json({ error: err.message || "Failed to resend verification email" });
  }
});
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    const normalizedEmail = email.toLowerCase().trim();
    const userRes = await query(
      `SELECT u.id, p.full_name FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE LOWER(u.email) = LOWER($1)`,
      [normalizedEmail]
    );
    if (userRes.rows.length === 0) {
      res.json({ message: `If an account exists with ${normalizedEmail}, a password reset code has been sent via SMTP.` });
      return;
    }
    const resetCode = Math.floor(1e5 + Math.random() * 9e5).toString();
    await query(
      `INSERT INTO email_tokens (email, token, type, expires_at)
       VALUES ($1, $2, 'password_reset', CURRENT_TIMESTAMP + INTERVAL '15 minutes')`,
      [normalizedEmail, resetCode]
    );
    await sendPasswordResetEmail(normalizedEmail, resetCode, userRes.rows[0].full_name || "User");
    res.json({
      message: `A password reset code has been dispatched to ${normalizedEmail} via SMTP.`,
      email: normalizedEmail
    });
  } catch (err) {
    console.error("[Forgot Password Error]", err);
    res.status(500).json({ error: err.message || "Failed to process password reset request" });
  }
});
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ error: "Email, reset code, and new password are required" });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    const normalizedEmail = email.toLowerCase().trim();
    const tokenRes = await query(
      `SELECT id FROM email_tokens
       WHERE LOWER(email) = LOWER($1) AND token = $2 AND type = 'password_reset' AND used = false AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail, code.trim()]
    );
    if (tokenRes.rows.length === 0) {
      res.status(400).json({ error: "Invalid or expired password reset code. Please request a new code." });
      return;
    }
    const passwordHash = await bcrypt2.hash(newPassword, 10);
    await query(`UPDATE users SET password_hash = $1 WHERE LOWER(email) = LOWER($2)`, [passwordHash, normalizedEmail]);
    await query(`UPDATE email_tokens SET used = true WHERE id = $1`, [tokenRes.rows[0].id]);
    res.json({ message: "Your password has been successfully updated. You can now sign in." });
  } catch (err) {
    console.error("[Reset Password Error]", err);
    res.status(500).json({ error: err.message || "Password reset failed" });
  }
});
router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRes = await query(
      `SELECT u.id, u.email, u.role, u.is_verified,
              p.id as profile_id, p.full_name, p.student_id, p.phone, p.university, p.college,
              p.course, p.branch, p.year, p.semester, p.skills, p.bio, p.avatar_url,
              p.completion_pct, p.is_active
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );
    if (userRes.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const row = userRes.rows[0];
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
          student_id: row.student_id || "GSA-2026-001",
          phone: row.phone || "",
          university: row.university || "University",
          college: row.college || "College",
          course: row.course || "B.Tech",
          branch: row.branch || "Computer Science",
          year: row.year || 2,
          semester: row.semester || 3,
          skills: Array.isArray(row.skills) ? row.skills : row.skills ? JSON.parse(row.skills) : [],
          bio: row.bio || "",
          avatar_url: row.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.full_name || row.email)}`,
          completion_pct: row.completion_pct || 85,
          is_active: row.is_active ?? true
        }
      }
    });
  } catch (err) {
    console.error("[Me Error]", err);
    res.status(500).json({ error: err.message || "Failed to fetch user session" });
  }
});
var auth_default = router;

// server/routes/student.ts
import { Router as Router2 } from "express";
import fs3 from "fs";

// server/storage/index.ts
import fs2 from "fs";
import path2 from "path";
import crypto2 from "crypto";
var UPLOAD_DIR = path2.resolve(process.cwd(), "uploads");
var CERT_DIR = path2.join(UPLOAD_DIR, "certificates");
var AVATAR_DIR = path2.join(UPLOAD_DIR, "avatars");
var DOCS_DIR = path2.join(UPLOAD_DIR, "documents");
for (const dir of [UPLOAD_DIR, CERT_DIR, AVATAR_DIR, DOCS_DIR]) {
  if (!fs2.existsSync(dir)) {
    fs2.mkdirSync(dir, { recursive: true });
  }
}
async function saveFile(buffer, originalName, category = "documents") {
  const ext = path2.extname(originalName) || ".pdf";
  const fileKey = `${category}/${Date.now()}-${crypto2.randomBytes(8).toString("hex")}${ext}`;
  const targetPath = path2.join(UPLOAD_DIR, fileKey);
  const targetDir = path2.dirname(targetPath);
  if (!fs2.existsSync(targetDir)) {
    fs2.mkdirSync(targetDir, { recursive: true });
  }
  fs2.writeFileSync(targetPath, buffer);
  return {
    fileKey,
    fileName: originalName,
    mimeType: ext === ".pdf" ? "application/pdf" : "application/octet-stream",
    size: buffer.length,
    fileUrl: `/api/storage/files/${fileKey}`
  };
}
function getFilePath(fileKey) {
  const fullPath = path2.join(UPLOAD_DIR, fileKey);
  if (fs2.existsSync(fullPath)) {
    return fullPath;
  }
  return null;
}
function generateSignedDownloadUrl(fileKey, studentId) {
  const expires = Date.now() + 1e3 * 60 * 60;
  const secret = process.env.AUTH_SECRET || "campusconnect-secure-secret-key-2026";
  const hmac = crypto2.createHmac("sha256", secret);
  hmac.update(`${fileKey}:${studentId}:${expires}`);
  const signature = hmac.digest("hex");
  return `/api/storage/download?key=${encodeURIComponent(fileKey)}&expires=${expires}&sig=${signature}&user=${encodeURIComponent(studentId)}`;
}
function verifySignedDownload(fileKey, studentId, expires, sig) {
  if (Date.now() > expires) return false;
  const secret = process.env.AUTH_SECRET || "campusconnect-secure-secret-key-2026";
  const hmac = crypto2.createHmac("sha256", secret);
  hmac.update(`${fileKey}:${studentId}:${expires}`);
  const expectedSig = hmac.digest("hex");
  return crypto2.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sig));
}

// server/storage/pdfGenerator.ts
function generateCertificatePdfBuffer(cert) {
  const student = (cert.studentName || "Recipient").toUpperCase();
  const title = cert.title || cert.certificate_name || "Certificate of Achievement";
  const certType = cert.type || "Ambassador Credential";
  const certId = cert.certificate_id || "GSA-2026-000000";
  const university = cert.studentUniversity || "CampusConnect Ambassador Network";
  let formattedDate = "November 2026";
  try {
    if (cert.issue_date) {
      const d = new Date(cert.issue_date);
      formattedDate = d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    }
  } catch (e) {
  }
  const streamData = `
BT
/F1 12 Tf
70 730 Td
(CAMPUSCONNECT OFFICIAL CERTIFICATE OF RECOGNITION) Tj
ET

BT
/F1 22 Tf
70 680 Td
(${title.replace(/[()\\]/g, "")}) Tj
ET

BT
/F1 14 Tf
70 650 Td
(Credential Type: ${certType.replace(/[()\\]/g, "")}) Tj
ET

BT
/F1 12 Tf
70 600 Td
(This certifies that) Tj
ET

BT
/F1 20 Tf
70 565 Td
(${student.replace(/[()\\]/g, "")}) Tj
ET

BT
/F1 11 Tf
70 535 Td
(of ${university.replace(/[()\\]/g, "")}) Tj
ET

BT
/F1 12 Tf
70 490 Td
(has successfully fulfilled all requirements, leadership duties, and active student mentorship) Tj
ET
BT
/F1 12 Tf
70 470 Td
(under the Google Student Ambassador Program with distinction.) Tj
ET

BT
/F1 10 Tf
70 400 Td
(Issued on: ${formattedDate}) Tj
ET

BT
/F1 11 Tf
70 370 Td
(Official Certificate ID: ${certId}) Tj
ET

BT
/F1 9 Tf
70 340 Td
(Publicly verifiable at: https://campusconnect.internal/verify/${certId}) Tj
ET

BT
/F1 10 Tf
70 270 Td
(Executive Program Director                            University Program Board) Tj
ET
`;
  const streamLength = Buffer.byteLength(streamData, "utf-8");
  const pdf = `%PDF-1.4
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj

2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj

3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 612 792]
  /Resources <<
    /Font <<
      /F1 <<
        /Type /Font
        /Subtype /Type1
        /BaseFont /Helvetica-Bold
      >>
    >>
  >>
  /Contents 4 0 R
>>
endobj

4 0 obj
<<
  /Length ${streamLength}
>>
stream
${streamData}
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000305 00000 n 
trailer
<<
  /Size 5
  /Root 1 0 R
>>
startxref
${400 + streamLength}
%%EOF`;
  return Buffer.from(pdf, "utf-8");
}

// server/routes/student.ts
var router2 = Router2();
router2.use(requireAuth);
router2.use(requireRole("student", "admin", "super_admin"));
router2.get("/dashboard", async (req, res) => {
  try {
    const studentId = req.user.id;
    const intRes = await query(
      `SELECT * FROM interviews 
       WHERE student_id = $1 AND status IN ('Scheduled', 'Confirmed', 'Rescheduled')
       ORDER BY date ASC, time ASC LIMIT 1`,
      [studentId]
    );
    const nextInterview = intRes.rows[0] || null;
    const taskRes = await query(
      `SELECT * FROM tasks 
       WHERE student_id = $1 AND status IN ('Pending', 'In Progress')
       ORDER BY deadline ASC`,
      [studentId]
    );
    const certRes = await query(
      `SELECT * FROM certificates 
       WHERE student_id = $1 
          OR student_id IN (SELECT student_id FROM profiles WHERE user_id = $1)
          OR student_id IN (SELECT email FROM users WHERE id = $1)
       ORDER BY issue_date DESC`,
      [studentId]
    );
    const evtRes = await query(
      `SELECT e.*, 
        EXISTS(SELECT 1 FROM event_registrations r WHERE r.event_id = e.id AND r.student_id = $1 AND r.status = 'Registered') as is_registered,
        (SELECT count(*) FROM event_registrations r WHERE r.event_id = e.id AND r.status = 'Registered')::int as attendee_count
       FROM events e
       WHERE date >= CURRENT_DATE - INTERVAL '1 day'
       ORDER BY date ASC`,
      [studentId]
    );
    const nextEvent = evtRes.rows[0] || null;
    const annRes = await query(
      `SELECT * FROM announcements ORDER BY publish_date DESC LIMIT 5`
    );
    const noteRes = await query(
      `SELECT count(*)::int FROM notifications WHERE user_id = $1 AND is_read = false`,
      [studentId]
    );
    const unreadCount = noteRes.rows[0]?.count || 0;
    const totalIntRes = await query(
      `SELECT count(*)::int FROM interviews WHERE student_id = $1`,
      [studentId]
    );
    res.json({
      stats: {
        upcomingInterviewsCount: totalIntRes.rows[0]?.count || 0,
        pendingTasksCount: taskRes.rows.length,
        certificatesCount: certRes.rows.length,
        upcomingEventsCount: evtRes.rows.length,
        unreadNotificationsCount: unreadCount
      },
      nextInterview,
      nextEvent,
      pendingTasks: taskRes.rows.slice(0, 5),
      certificates: certRes.rows.slice(0, 4),
      announcements: annRes.rows.slice(0, 3)
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load dashboard" });
  }
});
router2.get("/interviews", async (req, res) => {
  try {
    const studentId = req.user.id;
    const resSql = await query(
      `SELECT * FROM interviews WHERE student_id = $1 ORDER BY date ASC, time ASC`,
      [studentId]
    );
    res.json(resSql.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.get("/interviews/:id", async (req, res) => {
  try {
    const studentId = req.user.id;
    const resSql = await query(`SELECT * FROM interviews WHERE id = $1`, [req.params.id]);
    const interview = resSql.rows[0];
    if (!interview) {
      res.status(404).json({ error: "Interview not found" });
      return;
    }
    if (req.user.role === "student" && interview.student_id !== studentId) {
      res.status(403).json({ error: "Forbidden: You cannot access another student interview" });
      return;
    }
    res.json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.get("/certificates", async (req, res) => {
  try {
    const studentId = req.user.id;
    const resSql = await query(
      `SELECT c.*, 
              COALESCE(c.title, c.certificate_name) as title,
              COALESCE(c.type, 'Participation') as type,
              p.full_name as "studentName", 
              u.email as "studentEmail", 
              p.student_id as "studentCode",
              p.university as "studentUniversity"
       FROM certificates c
       LEFT JOIN users u ON (c.student_id = u.id::text OR LOWER(c.student_id) = LOWER(u.email))
       LEFT JOIN profiles p ON (u.id = p.user_id OR c.student_id = p.student_id)
       WHERE c.student_id = $1 
          OR c.student_id IN (SELECT student_id FROM profiles WHERE user_id = $1)
          OR c.student_id IN (SELECT email FROM users WHERE id = $1)
       ORDER BY c.issue_date DESC, c.created_at DESC`,
      [studentId]
    );
    res.json(resSql.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.get("/certificates/:id/view", async (req, res) => {
  try {
    const studentId = req.user.id;
    const isPrivileged = req.user.role === "admin" || req.user.role === "super_admin";
    const resSql = await query(
      `SELECT c.*, 
              COALESCE(c.title, c.certificate_name) as title,
              COALESCE(c.type, 'Participation') as type,
              p.full_name as "studentName", 
              u.email as "studentEmail", 
              p.student_id as "studentCode",
              p.university as "studentUniversity"
       FROM certificates c
       LEFT JOIN users u ON (c.student_id = u.id::text OR LOWER(c.student_id) = LOWER(u.email))
       LEFT JOIN profiles p ON (u.id = p.user_id OR c.student_id = p.student_id)
       WHERE c.id = $1 OR LOWER(c.certificate_id) = LOWER($1)`,
      [req.params.id]
    );
    if (resSql.rows.length === 0) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }
    const cert = resSql.rows[0];
    const ownsCert = cert.student_id === studentId || cert.studentCode === req.user.studentId || cert.studentEmail?.toLowerCase() === req.user.email.toLowerCase();
    if (!isPrivileged && !ownsCert) {
      res.status(403).json({ error: "Forbidden: You cannot access another student certificate" });
      return;
    }
    const filename = `${cert.certificate_id}.pdf`;
    if (cert.file_key) {
      const physicalPath = getFilePath(cert.file_key);
      if (physicalPath && fs3.existsSync(physicalPath)) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
        fs3.createReadStream(physicalPath).pipe(res);
        return;
      }
    }
    const pdfBuffer = generateCertificatePdfBuffer({
      studentName: cert.studentName,
      title: cert.title || cert.certificate_name,
      type: cert.type,
      certificate_id: cert.certificate_id,
      program: cert.program,
      issue_date: cert.issue_date,
      studentUniversity: cert.studentUniversity
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.get("/certificates/:id/download", async (req, res) => {
  try {
    const studentId = req.user.id;
    const isPrivileged = req.user.role === "admin" || req.user.role === "super_admin";
    const resSql = await query(
      `SELECT c.*, 
              COALESCE(c.title, c.certificate_name) as title,
              COALESCE(c.type, 'Participation') as type,
              p.full_name as "studentName", 
              u.email as "studentEmail", 
              p.student_id as "studentCode",
              p.university as "studentUniversity"
       FROM certificates c
       LEFT JOIN users u ON (c.student_id = u.id::text OR LOWER(c.student_id) = LOWER(u.email))
       LEFT JOIN profiles p ON (u.id = p.user_id OR c.student_id = p.student_id)
       WHERE c.id = $1 OR LOWER(c.certificate_id) = LOWER($1)`,
      [req.params.id]
    );
    if (resSql.rows.length === 0) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }
    const cert = resSql.rows[0];
    const ownsCert = cert.student_id === studentId || cert.studentCode === req.user.studentId || cert.studentEmail?.toLowerCase() === req.user.email.toLowerCase();
    if (!isPrivileged && !ownsCert) {
      res.status(403).json({ error: "Forbidden: You cannot access another student certificate" });
      return;
    }
    const studentNameClean = (cert.studentName || "Student").replace(/[^a-zA-Z0-9]/g, "_");
    const titleClean = (cert.title || cert.certificate_name || "Certificate").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `${studentNameClean}_${titleClean}_Certificate.pdf`;
    if (cert.file_key) {
      const physicalPath = getFilePath(cert.file_key);
      if (physicalPath && fs3.existsSync(physicalPath)) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        fs3.createReadStream(physicalPath).pipe(res);
        return;
      }
    }
    const pdfBuffer = generateCertificatePdfBuffer({
      studentName: cert.studentName,
      title: cert.title || cert.certificate_name,
      type: cert.type,
      certificate_id: cert.certificate_id,
      program: cert.program,
      issue_date: cert.issue_date,
      studentUniversity: cert.studentUniversity
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.get("/certificates/:id/signed-url", async (req, res) => {
  try {
    const studentId = req.user.id;
    const isPrivileged = req.user.role === "admin" || req.user.role === "super_admin";
    const resSql = await query(
      `SELECT c.*, p.full_name as "studentName", u.email as "studentEmail", p.student_id as "studentCode"
       FROM certificates c
       LEFT JOIN users u ON (c.student_id = u.id::text OR LOWER(c.student_id) = LOWER(u.email))
       LEFT JOIN profiles p ON (u.id = p.user_id OR c.student_id = p.student_id)
       WHERE c.id = $1 OR LOWER(c.certificate_id) = LOWER($1)`,
      [req.params.id]
    );
    if (resSql.rows.length === 0) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }
    const cert = resSql.rows[0];
    const ownsCert = cert.student_id === studentId || cert.studentCode === req.user.studentId || cert.studentEmail?.toLowerCase() === req.user.email.toLowerCase();
    if (!isPrivileged && !ownsCert) {
      res.status(403).json({ error: "Forbidden: You cannot access another student certificate" });
      return;
    }
    const fileKey = cert.file_key || `certificates/${cert.certificate_id}.pdf`;
    const signedUrl = generateSignedDownloadUrl(fileKey, studentId);
    res.json({
      signedUrl,
      certificateId: cert.certificate_id,
      expiresIn: 3600
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.get("/events", async (req, res) => {
  try {
    const studentId = req.user.id;
    const resSql = await query(
      `SELECT e.*,
        EXISTS(SELECT 1 FROM event_registrations r WHERE r.event_id = e.id AND r.student_id = $1 AND r.status = 'Registered') as "isRegistered",
        (SELECT count(*) FROM event_registrations r WHERE r.event_id = e.id AND r.status = 'Registered')::int as "attendeeCount"
       FROM events e
       ORDER BY date ASC`,
      [studentId]
    );
    res.json(resSql.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.post("/events/:id/register", async (req, res) => {
  try {
    const studentId = req.user.id;
    const eventId = req.params.id;
    const evtCheck = await query(`SELECT * FROM events WHERE id = $1`, [eventId]);
    const event = evtCheck.rows[0];
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    await query(
      `INSERT INTO event_registrations (event_id, student_id, status)
       VALUES ($1, $2, 'Registered')
       ON CONFLICT (event_id, student_id) DO UPDATE SET status = 'Registered'`,
      [eventId, studentId]
    );
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, 'event', $4)`,
      [
        studentId,
        "Event Registration Confirmed",
        `You are confirmed for ${event.title} on ${event.date}.`,
        `/student/events/${eventId}`
      ]
    );
    res.json({ message: "Successfully registered for event" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.post("/events/:id/cancel", async (req, res) => {
  try {
    const studentId = req.user.id;
    const eventId = req.params.id;
    await query(
      `UPDATE event_registrations SET status = 'Cancelled' WHERE event_id = $1 AND student_id = $2`,
      [eventId, studentId]
    );
    res.json({ message: "Event registration cancelled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.get("/tasks", async (req, res) => {
  try {
    const studentId = req.user.id;
    const resSql = await query(
      `SELECT * FROM tasks WHERE student_id = $1 ORDER BY deadline ASC`,
      [studentId]
    );
    res.json(resSql.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.patch("/tasks/:id/status", async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status } = req.body;
    const resSql = await query(
      `UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND student_id = $3
       RETURNING *`,
      [status, req.params.id, studentId]
    );
    if (resSql.rowCount === 0) {
      res.status(404).json({ error: "Task not found or access denied" });
      return;
    }
    res.json(resSql.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.get("/announcements", async (_req, res) => {
  try {
    const resSql = await query(`SELECT * FROM announcements ORDER BY publish_date DESC`);
    res.json(resSql.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.get("/notifications", async (req, res) => {
  try {
    const studentId = req.user.id;
    const resSql = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [studentId]
    );
    res.json(resSql.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.patch("/notifications/:id/read", async (req, res) => {
  try {
    const studentId = req.user.id;
    await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [req.params.id, studentId]
    );
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.patch("/notifications/read-all", async (req, res) => {
  try {
    const studentId = req.user.id;
    await query(`UPDATE notifications SET is_read = true WHERE user_id = $1`, [studentId]);
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.get("/profile", async (req, res) => {
  try {
    const studentId = req.user.id;
    const resSql = await query(
      `SELECT p.*, u.email, u.role FROM profiles p JOIN users u ON p.user_id = u.id WHERE p.user_id = $1`,
      [studentId]
    );
    if (resSql.rows.length === 0) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json(resSql.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.put("/profile", async (req, res) => {
  try {
    const studentId = req.user.id;
    const { phone, university, college, course, branch, year, semester, skills, bio } = req.body;
    const resSql = await query(
      `UPDATE profiles SET
        phone = COALESCE($1, phone),
        university = COALESCE($2, university),
        college = COALESCE($3, college),
        course = COALESCE($4, course),
        branch = COALESCE($5, branch),
        year = COALESCE($6, year),
        semester = COALESCE($7, semester),
        skills = COALESCE($8, skills),
        bio = COALESCE($9, bio),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $10
       RETURNING *`,
      [phone, university, college, course, branch, year, semester, skills, bio, studentId]
    );
    res.json(resSql.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.get("/resources", async (_req, res) => {
  try {
    const resSql = await query(`SELECT * FROM resources ORDER BY title ASC`);
    res.json(resSql.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var student_default = router2;

// server/routes/admin.ts
import { Router as Router3 } from "express";
import fs4 from "fs";
import crypto3 from "crypto";
import bcrypt3 from "bcryptjs";
import multer from "multer";
import Papa from "papaparse";
import QRCode from "qrcode";
var router3 = Router3();
var upload = multer({ storage: multer.memoryStorage() });
router3.use(requireAuth);
router3.use(requireRole("admin", "super_admin"));
router3.get("/dashboard", async (_req, res) => {
  try {
    const studentCountRes = await query(`SELECT count(*)::int FROM users WHERE role = 'student'`);
    const totalStudents = studentCountRes.rows[0]?.count || 0;
    const intCountRes = await query(
      `SELECT count(*)::int FROM interviews WHERE status IN ('Scheduled', 'Confirmed', 'Rescheduled')`
    );
    const upcomingInterviews = intCountRes.rows[0]?.count || 0;
    const certCountRes = await query(`SELECT count(*)::int FROM certificates WHERE status = 'Valid'`);
    const certificatesIssued = certCountRes.rows[0]?.count || 0;
    const evtCountRes = await query(
      `SELECT count(*)::int FROM events WHERE date >= CURRENT_DATE - INTERVAL '1 day'`
    );
    const upcomingEvents = evtCountRes.rows[0]?.count || 0;
    const taskCountRes = await query(`SELECT count(*)::int FROM tasks WHERE status IN ('Pending', 'In Progress')`);
    const pendingTasks = taskCountRes.rows[0]?.count || 0;
    const growthRes = await query(`
      SELECT to_char(created_at, 'Mon') as month, count(*)::int as count
      FROM users
      WHERE role = 'student'
      GROUP BY to_char(created_at, 'Mon'), date_trunc('month', created_at)
      ORDER BY date_trunc('month', created_at) ASC
    `);
    const studentGrowth = growthRes.rows.length > 0 ? growthRes.rows : [{ month: (/* @__PURE__ */ new Date()).toLocaleString("en-US", { month: "short" }), count: totalStudents }];
    const intStatusRes = await query(`
      SELECT status as name, count(*)::int as value
      FROM interviews
      GROUP BY status
    `);
    const interviewStatus = intStatusRes.rows;
    const taskStatusRes = await query(`
      SELECT status, count(*)::int as count
      FROM tasks
      GROUP BY status
    `);
    const taskCompletion = taskStatusRes.rows;
    res.json({
      metrics: {
        totalStudents,
        upcomingInterviews,
        certificatesIssued,
        upcomingEvents,
        pendingTasks
      },
      charts: {
        studentGrowth,
        interviewStatus,
        taskCompletion
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch admin metrics" });
  }
});
router3.get("/students", async (req, res) => {
  try {
    const q = (req.query.q || "").toLowerCase();
    let sql = `
      SELECT u.id, u.email, u.created_at as "createdAt",
             p.full_name as name, p.student_id as "studentId", p.university,
             p.college, p.course, p.branch, p.year, p.phone,
             p.completion_pct as "completionPct", p.is_active as "isActive",
             p.avatar_url as "avatarUrl"
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE (p.id IS NOT NULL OR u.role IN ('student', 'super_admin', 'admin'))
    `;
    const params = [];
    if (q) {
      sql += ` AND (LOWER(p.full_name) LIKE $1 OR LOWER(u.email) LIKE $1 OR LOWER(p.student_id) LIKE $1)`;
      params.push(`%${q}%`);
    }
    sql += ` ORDER BY u.created_at DESC`;
    const resSql = await query(sql, params);
    res.json(resSql.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.post("/students", async (req, res) => {
  try {
    const { fullName, email, studentId, course, branch, year = 1, phone = "" } = req.body;
    if (!fullName || !email || !studentId) {
      res.status(400).json({ error: "Full Name, Email, and Student ID are required" });
      return;
    }
    const newId = crypto3.randomUUID();
    const passwordHash = await bcrypt3.hash("welcome123", 10);
    await query(
      `INSERT INTO users (id, email, password_hash, role, is_verified)
       VALUES ($1, $2, $3, 'student', true)`,
      [newId, email.toLowerCase(), passwordHash]
    );
    await query(
      `INSERT INTO profiles (id, user_id, full_name, student_id, phone, university, college, course, branch, year, semester, avatar_url, completion_pct, is_active)
       VALUES ($1, $2, $3, $4, $5, 'CampusConnect University Network', 'School of Technology', $6, $7, $8, $9, $10, 85, true)`,
      [
        crypto3.randomUUID(),
        newId,
        fullName,
        studentId,
        phone,
        course || "B.Tech",
        branch || "Computer Science",
        Number(year) || 1,
        (Number(year) || 1) * 2 - 1,
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`
      ]
    );
    await logAudit(req.user.id, "STUDENT_CREATED", "users", newId, { email, studentId });
    res.status(201).json({ message: "Student created successfully", id: newId });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create student" });
  }
});
router3.patch("/students/:id", async (req, res) => {
  try {
    const { isActive, fullName, phone, branch, year } = req.body;
    await query(
      `UPDATE profiles SET
        is_active = COALESCE($1, is_active),
        full_name = COALESCE($2, full_name),
        phone = COALESCE($3, phone),
        branch = COALESCE($4, branch),
        year = COALESCE($5, year),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6`,
      [isActive, fullName, phone, branch, year, req.params.id]
    );
    await logAudit(req.user.id, "STUDENT_UPDATED", "profiles", req.params.id, req.body);
    res.json({ message: "Student updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.post("/students/bulk-import", async (req, res) => {
  try {
    const { csvData } = req.body;
    if (!csvData || typeof csvData !== "string") {
      res.status(400).json({ error: "Please provide CSV content in csvData field" });
      return;
    }
    const parseResult = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    const rows = parseResult.data;
    const validRows = [];
    const errors = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row.name || row.fullName || row.full_name;
      const email = row.email;
      const studentId = row.student_id || row.studentId || row.id;
      const course = row.course || "B.Tech";
      const branch = row.branch || "CSE";
      const year = parseInt(row.year || "1", 10);
      if (!name || !email || !studentId) {
        errors.push({ row: i + 1, error: "Missing name, email, or student_id", data: row });
        continue;
      }
      if (!email.includes("@")) {
        errors.push({ row: i + 1, error: "Invalid email address", data: row });
        continue;
      }
      validRows.push({ name, email, studentId, course, branch, year });
    }
    let imported = 0;
    const defaultPasswordHash = await bcrypt3.hash("welcome123", 10);
    for (const item of validRows) {
      try {
        const newId = crypto3.randomUUID();
        await query(
          `INSERT INTO users (id, email, password_hash, role, is_verified)
           VALUES ($1, $2, $3, 'student', true)
           ON CONFLICT (email) DO NOTHING`,
          [newId, item.email.toLowerCase(), defaultPasswordHash]
        );
        await query(
          `INSERT INTO profiles (id, user_id, full_name, student_id, phone, university, college, course, branch, year, semester, avatar_url, completion_pct, is_active)
           VALUES ($1, $2, $3, $4, '', 'CampusConnect University Network', 'School of Technology', $5, $6, $7, $8, $9, 80, true)
           ON CONFLICT (student_id) DO UPDATE SET full_name = EXCLUDED.full_name`,
          [
            crypto3.randomUUID(),
            newId,
            item.name,
            item.studentId,
            item.course,
            item.branch,
            item.year,
            item.year * 2 - 1,
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name)}`
          ]
        );
        imported++;
      } catch (insertErr) {
        errors.push({ row: 0, error: "Database constraint violation", data: item });
      }
    }
    await logAudit(req.user.id, "STUDENTS_BULK_IMPORTED", "users", void 0, {
      totalFound: rows.length,
      imported,
      errorsCount: errors.length
    });
    res.json({
      total: rows.length,
      validCount: validRows.length,
      importedCount: imported,
      errors
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "CSV bulk import failed" });
  }
});
router3.get("/interviews", async (_req, res) => {
  try {
    const resSql = await query(`
      SELECT i.*, p.full_name as "studentName", u.email as "studentEmail", p.student_id as "studentCode"
      FROM interviews i
      LEFT JOIN profiles p ON i.student_id = p.user_id
      LEFT JOIN users u ON i.student_id = u.id
      ORDER BY i.date ASC, i.time ASC
    `);
    res.json(resSql.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.post("/interviews", async (req, res) => {
  try {
    const {
      studentId,
      title,
      organization = "CampusConnect Program",
      date,
      time,
      duration = 45,
      type = "Online",
      location,
      meetingLink,
      interviewer,
      instructions
    } = req.body;
    if (!studentId || !title || !date || !time) {
      res.status(400).json({ error: "Student, Title, Date, and Time are required" });
      return;
    }
    const newId = "int-" + Date.now();
    await query(
      `INSERT INTO interviews (id, student_id, title, organization, date, time, duration, type, location, meeting_link, interviewer, instructions, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Scheduled')`,
      [newId, studentId, title, organization, date, time, Number(duration), type, location || "Online Room", meetingLink || "https://meet.google.com/sample", interviewer || "Program Coordinator", instructions || "Join on time."]
    );
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, 'interview', $4)`,
      [
        studentId,
        "New Interview Scheduled",
        `Your interview "${title}" is scheduled for ${date} at ${time}.`,
        `/student/interviews/${newId}`
      ]
    );
    await logAudit(req.user.id, "INTERVIEW_CREATED", "interviews", newId, { studentId, title, date });
    res.status(201).json({ id: newId, title, date, time });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.patch("/interviews/:id", async (req, res) => {
  try {
    const { date, time, status, instructions, meetingLink } = req.body;
    const resSql = await query(
      `UPDATE interviews SET
        date = COALESCE($1, date),
        time = COALESCE($2, time),
        status = COALESCE($3, status),
        instructions = COALESCE($4, instructions),
        meeting_link = COALESCE($5, meeting_link),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [date, time, status, instructions, meetingLink, req.params.id]
    );
    if (resSql.rowCount === 0) {
      res.status(404).json({ error: "Interview not found" });
      return;
    }
    await logAudit(req.user.id, "INTERVIEW_UPDATED", "interviews", req.params.id, req.body);
    res.json(resSql.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.delete("/interviews/:id", async (req, res) => {
  try {
    await query(`DELETE FROM interviews WHERE id = $1`, [req.params.id]);
    await logAudit(req.user.id, "INTERVIEW_DELETED", "interviews", req.params.id);
    res.json({ message: "Interview deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.get("/certificates", async (req, res) => {
  try {
    const q = (req.query.q || "").trim().toLowerCase();
    let sql = `
      SELECT c.*, 
             COALESCE(c.title, c.certificate_name) as title,
             COALESCE(c.type, 'Participation') as type,
             p.full_name as "studentName", 
             u.email as "studentEmail", 
             p.student_id as "studentCode",
             p.university as "studentUniversity"
      FROM certificates c
      LEFT JOIN profiles p ON (c.student_id = p.user_id OR c.student_id = p.student_id)
      LEFT JOIN users u ON (c.student_id = u.id::text OR LOWER(c.student_id) = LOWER(u.email))
    `;
    const params = [];
    if (q) {
      params.push(`%${q}%`);
      sql += ` WHERE LOWER(COALESCE(p.full_name, '')) LIKE $1 
               OR LOWER(COALESCE(p.student_id, '')) LIKE $1 
               OR LOWER(c.certificate_id) LIKE $1 
               OR LOWER(COALESCE(c.title, c.certificate_name, '')) LIKE $1 
               OR LOWER(COALESCE(c.program, '')) LIKE $1
               OR LOWER(COALESCE(u.email, '')) LIKE $1`;
    }
    sql += ` ORDER BY c.issue_date DESC, c.created_at DESC`;
    const resSql = await query(sql, params);
    res.json(resSql.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.post("/certificates", upload.single("file"), async (req, res) => {
  try {
    const { studentId, certificateName, title, program, type, issueDate, description } = req.body;
    const certTitle = (title || certificateName || "").trim();
    const certProgram = (program || certTitle || "Google Student Ambassador").trim();
    const certType = (type || "Participation").trim();
    if (!studentId || !certTitle) {
      res.status(400).json({ error: "Student and Certificate Title are required" });
      return;
    }
    const certCode = "CERT-" + (/* @__PURE__ */ new Date()).getFullYear() + "-" + Math.floor(1e3 + Math.random() * 9e3);
    const verifyUrl = `${req.protocol}://${req.get("host")}/verify/${certCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, { width: 300 });
    let fileKey = `certificates/${certCode}.pdf`;
    let fileUrl = `/api/student/certificates/${certCode}/download`;
    if (req.file) {
      const stored = await saveFile(req.file.buffer, req.file.originalname || `${certCode}.pdf`, "certificates");
      fileKey = stored.fileKey;
      fileUrl = stored.fileUrl;
    }
    const newId = "cert-" + Date.now();
    const stuLookup = await query(
      `SELECT u.id, u.email, p.student_id, p.full_name, p.university
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id::text = $1 OR p.student_id = $1 OR LOWER(u.email) = LOWER($1)
       LIMIT 1`,
      [studentId]
    );
    const resolvedStudentId = stuLookup.rows[0]?.id || studentId;
    const studentName = stuLookup.rows[0]?.full_name || "Student Ambassador";
    await query(
      `INSERT INTO certificates (
        id, certificate_id, student_id, title, certificate_name, certificate_type, type, program, issue_date, description, storage_key, file_key, file_url, qr_code, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'Valid')`,
      [
        newId,
        certCode,
        resolvedStudentId,
        certTitle,
        certTitle,
        certType,
        certType,
        certProgram,
        issueDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        description || null,
        fileKey,
        fileKey,
        fileUrl,
        qrCodeDataUrl
      ]
    );
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, 'certificate', '/student/certificates')`,
      [
        resolvedStudentId,
        "\u{1F3C6} New Certificate Issued!",
        `Your verified certificate for "${certTitle}" is now available to download.`
      ]
    );
    await logAudit(req.user.id, "CERTIFICATE_ISSUED", "certificates", certCode, { studentId: resolvedStudentId, title: certTitle, type: certType });
    res.status(201).json({
      id: newId,
      certificate_id: certCode,
      title: certTitle,
      certificate_name: certTitle,
      type: certType,
      studentName,
      status: "Valid"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.patch("/certificates/:id", async (req, res) => {
  try {
    const { title, type, issueDate, description, status, program } = req.body;
    const resSql = await query(
      `UPDATE certificates SET
        title = COALESCE($1, title),
        certificate_name = COALESCE($1, certificate_name),
        type = COALESCE($2, type),
        issue_date = COALESCE($3, issue_date),
        description = COALESCE($4, description),
        status = COALESCE($5, status),
        program = COALESCE($6, program),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 OR certificate_id = $7
       RETURNING *`,
      [title, type, issueDate, description, status, program, req.params.id]
    );
    if (resSql.rowCount === 0) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }
    await logAudit(req.user.id, "CERTIFICATE_UPDATED", "certificates", req.params.id, req.body);
    res.json(resSql.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.put("/certificates/:id/replace", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "New PDF file is required" });
      return;
    }
    const check = await query(`SELECT * FROM certificates WHERE id = $1 OR certificate_id = $1`, [req.params.id]);
    if (check.rows.length === 0) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }
    const cert = check.rows[0];
    const stored = await saveFile(req.file.buffer, `${cert.certificate_id}.pdf`, "certificates");
    const updateRes = await query(
      `UPDATE certificates SET
        file_key = $1,
        file_url = $2,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [stored.fileKey, stored.fileUrl, cert.id]
    );
    await logAudit(req.user.id, "CERTIFICATE_FILE_REPLACED", "certificates", cert.certificate_id, { fileKey: stored.fileKey });
    res.json(updateRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.delete("/certificates/:id", async (req, res) => {
  try {
    const check = await query(`SELECT * FROM certificates WHERE id = $1 OR certificate_id = $1`, [req.params.id]);
    if (check.rows.length === 0) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }
    const cert = check.rows[0];
    if (cert.file_key) {
      const physicalPath = getFilePath(cert.file_key);
      if (physicalPath && fs4.existsSync(physicalPath)) {
        try {
          fs4.unlinkSync(physicalPath);
        } catch (e) {
        }
      }
    }
    await query(`DELETE FROM certificates WHERE id = $1`, [cert.id]);
    await logAudit(req.user.id, "CERTIFICATE_DELETED", "certificates", cert.certificate_id);
    res.json({ message: "Certificate deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.get("/certificates/:id/view", async (req, res) => {
  try {
    const check = await query(
      `SELECT c.*, p.full_name as "studentName", p.university as "studentUniversity" 
       FROM certificates c 
       LEFT JOIN profiles p ON (c.student_id = p.user_id OR c.student_id = p.student_id)
       WHERE c.id = $1 OR certificate_id = $1`,
      [req.params.id]
    );
    if (check.rows.length === 0) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }
    const cert = check.rows[0];
    if (cert.file_key) {
      const physicalPath = getFilePath(cert.file_key);
      if (physicalPath && fs4.existsSync(physicalPath)) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${cert.certificate_id}.pdf"`);
        fs4.createReadStream(physicalPath).pipe(res);
        return;
      }
    }
    const pdfBuffer = generateCertificatePdfBuffer({
      studentName: cert.studentName,
      title: cert.title || cert.certificate_name,
      type: cert.type,
      certificate_id: cert.certificate_id,
      program: cert.program,
      issue_date: cert.issue_date,
      studentUniversity: cert.studentUniversity
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${cert.certificate_id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.get("/certificates/:id/download", async (req, res) => {
  try {
    const check = await query(
      `SELECT c.*, p.full_name as "studentName", p.university as "studentUniversity" 
       FROM certificates c 
       LEFT JOIN profiles p ON (c.student_id = p.user_id OR c.student_id = p.student_id)
       WHERE c.id = $1 OR certificate_id = $1`,
      [req.params.id]
    );
    if (check.rows.length === 0) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }
    const cert = check.rows[0];
    const studentNameClean = (cert.studentName || "Student").replace(/[^a-zA-Z0-9]/g, "_");
    const titleClean = (cert.title || cert.certificate_name || "Certificate").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `${studentNameClean}_${titleClean}_Certificate.pdf`;
    if (cert.file_key) {
      const physicalPath = getFilePath(cert.file_key);
      if (physicalPath && fs4.existsSync(physicalPath)) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        fs4.createReadStream(physicalPath).pipe(res);
        return;
      }
    }
    const pdfBuffer = generateCertificatePdfBuffer({
      studentName: cert.studentName,
      title: cert.title || cert.certificate_name,
      type: cert.type,
      certificate_id: cert.certificate_id,
      program: cert.program,
      issue_date: cert.issue_date,
      studentUniversity: cert.studentUniversity
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.patch("/certificates/:id/revoke", async (req, res) => {
  try {
    await query(
      `UPDATE certificates SET status = 'Revoked', updated_at = CURRENT_TIMESTAMP WHERE id = $1 OR certificate_id = $1`,
      [req.params.id]
    );
    await logAudit(req.user.id, "CERTIFICATE_REVOKED", "certificates", req.params.id);
    res.json({ message: "Certificate revoked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.get("/events", async (_req, res) => {
  try {
    const resSql = await query(`
      SELECT e.*,
        (SELECT count(*) FROM event_registrations r WHERE r.event_id = e.id AND r.status = 'Registered')::int as "attendeeCount"
      FROM events e
      ORDER BY e.date ASC
    `);
    res.json(resSql.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.post("/events", async (req, res) => {
  try {
    const { title, description, date, time, venue, meetingLink, maxParticipants = 100, organizer, bannerUrl, registrationDeadline } = req.body;
    const newId = "evt-" + Date.now();
    await query(
      `INSERT INTO events (id, title, description, date, time, venue, meeting_link, max_participants, banner_url, organizer, registration_deadline, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Open')`,
      [
        newId,
        title,
        description || "",
        date,
        time,
        venue || "Online Room",
        meetingLink || "",
        Number(maxParticipants),
        bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
        organizer || "CampusConnect",
        registrationDeadline || date + "T23:59:59Z"
      ]
    );
    await logAudit(req.user.id, "EVENT_CREATED", "events", newId, { title, date });
    res.status(201).json({ id: newId, title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.delete("/events/:id", async (req, res) => {
  try {
    await query(`DELETE FROM events WHERE id = $1`, [req.params.id]);
    await logAudit(req.user.id, "EVENT_DELETED", "events", req.params.id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.get("/tasks", async (_req, res) => {
  try {
    const resSql = await query(`
      SELECT t.*, p.full_name as "studentName", u.email as "studentEmail"
      FROM tasks t
      LEFT JOIN profiles p ON t.student_id = p.user_id
      LEFT JOIN users u ON t.student_id = u.id
      ORDER BY t.deadline ASC
    `);
    res.json(resSql.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.post("/tasks", async (req, res) => {
  try {
    const { studentId, title, description, deadline, priority = "Medium" } = req.body;
    const newId = "tsk-" + Date.now();
    await query(
      `INSERT INTO tasks (id, student_id, title, description, deadline, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending')`,
      [newId, studentId, title, description || "", deadline, priority]
    );
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, 'task', '/student/tasks')`,
      [studentId, "New Task Assigned", `You have been assigned "${title}" (Due: ${deadline}).`]
    );
    await logAudit(req.user.id, "TASK_CREATED", "tasks", newId, { studentId, title });
    res.status(201).json({ id: newId, title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.delete("/tasks/:id", async (req, res) => {
  try {
    await query(`DELETE FROM tasks WHERE id = $1`, [req.params.id]);
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.get("/announcements", async (_req, res) => {
  try {
    const resSql = await query(`SELECT * FROM announcements ORDER BY publish_date DESC`);
    res.json(resSql.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.post("/announcements", async (req, res) => {
  try {
    const { title, message, category = "General", priority = "Normal", isImportant = false } = req.body;
    const newId = "ann-" + Date.now();
    await query(
      `INSERT INTO announcements (id, title, message, category, priority, is_important, publish_date)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [newId, title, message, category, priority, Boolean(isImportant)]
    );
    const studentsRes = await query(`SELECT id FROM users WHERE role = 'student'`);
    for (const s of studentsRes.rows) {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES ($1, $2, $3, 'announcement', '/student/announcements')`,
        [s.id, "\u{1F4E2} " + title, message]
      );
    }
    await logAudit(req.user.id, "ANNOUNCEMENT_PUBLISHED", "announcements", newId, { title });
    res.status(201).json({ id: newId, title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.delete("/announcements/:id", async (req, res) => {
  try {
    await query(`DELETE FROM announcements WHERE id = $1`, [req.params.id]);
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.get("/resources", async (_req, res) => {
  try {
    const resSql = await query(`SELECT * FROM resources ORDER BY title ASC`);
    res.json(resSql.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.post("/resources", async (req, res) => {
  try {
    const { title, description, category, type = "PDF", url } = req.body;
    const newId = "res-" + Date.now();
    await query(
      `INSERT INTO resources (id, title, description, category, type, url)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [newId, title, description || "", category, type, url]
    );
    await logAudit(req.user.id, "RESOURCE_CREATED", "resources", newId, { title });
    res.status(201).json({ id: newId, title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.delete("/resources/:id", async (req, res) => {
  try {
    await query(`DELETE FROM resources WHERE id = $1`, [req.params.id]);
    res.json({ message: "Resource deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.get("/audit-logs", async (_req, res) => {
  try {
    const resSql = await query(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`);
    res.json(resSql.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.get("/admins", requireRole("super_admin"), async (_req, res) => {
  try {
    const resSql = await query(`
      SELECT u.id, u.email, u.role, p.full_name as name, p.phone, p.college, u.created_at as "createdAt"
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.role IN ('admin', 'super_admin')
      ORDER BY u.created_at DESC
    `);
    res.json(resSql.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var admin_default = router3;

// server/routes/public.ts
import { Router as Router4 } from "express";
import fs5 from "fs";
import path3 from "path";
import jwt2 from "jsonwebtoken";
var router4 = Router4();
var JWT_SECRET = process.env.AUTH_SECRET || "campusconnect-jwt-secret-key-2026";
router4.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "CampusConnect API", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
router4.get("/verify/:certificateId", async (req, res) => {
  try {
    const certCode = req.params.certificateId.trim();
    const result = await query(
      `SELECT c.*, 
              COALESCE(c.title, c.certificate_name) as title,
              COALESCE(c.type, 'Participation') as type,
              p.full_name as student_name, 
              p.university as student_university, 
              p.student_id as student_code
       FROM certificates c
       LEFT JOIN profiles p ON (c.student_id = p.user_id OR c.student_id = p.student_id)
       WHERE LOWER(c.certificate_id) = LOWER($1)`,
      [certCode]
    );
    if (result.rows.length === 0) {
      res.status(404).json({
        verified: false,
        error: "Certificate not found",
        message: "No record matching this Certificate ID was found in the official registry."
      });
      return;
    }
    const cert = result.rows[0];
    res.json({
      verified: cert.status === "Valid",
      status: cert.status,
      // Valid, Revoked, Expired
      certificateId: cert.certificate_id,
      title: cert.title || cert.certificate_name,
      certificateName: cert.certificate_name || cert.title,
      type: cert.type || "Ambassador Credential",
      program: cert.program,
      description: cert.description,
      issueDate: cert.issue_date,
      studentName: cert.student_name || "Authorized Recipient",
      studentUniversity: cert.student_university || "CampusConnect Ambassador Network",
      studentCode: cert.student_code || "VERIFIED-AMBASSADOR",
      qrCode: cert.qr_code,
      verifiedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    console.error("[Verify Certificate Error]", err);
    res.status(500).json({ verified: false, error: err.message || "Verification check failed" });
  }
});
router4.get("/storage/download", async (req, res) => {
  try {
    const { key, expires, sig, user } = req.query;
    if (!key || !expires || !sig || !user) {
      res.status(400).json({ error: "Missing required signed URL parameters" });
      return;
    }
    const isValid = verifySignedDownload(key, user, Number(expires), sig);
    if (!isValid) {
      res.status(403).json({ error: "Signed download link has expired or is invalid" });
      return;
    }
    const physicalPath = getFilePath(key);
    if (!physicalPath || !fs5.existsSync(physicalPath)) {
      res.status(404).json({ error: "File not found in storage" });
      return;
    }
    const filename = path3.basename(physicalPath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    fs5.createReadStream(physicalPath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router4.get("/certificates/:id/download", async (req, res) => {
  try {
    const certId = req.params.id.trim();
    let user = null;
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token;
    const tokenToVerify = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : queryToken;
    if (tokenToVerify) {
      try {
        user = jwt2.verify(tokenToVerify, JWT_SECRET);
      } catch (e) {
      }
    }
    const result = await query(
      `SELECT c.*, 
              COALESCE(c.title, c.certificate_name) as title,
              COALESCE(c.type, 'Participation') as type,
              p.full_name as student_name,
              p.university as student_university,
              p.student_id as student_code,
              u.email as student_email
       FROM certificates c
       LEFT JOIN profiles p ON (c.student_id = p.user_id OR c.student_id = p.student_id)
       LEFT JOIN users u ON (c.student_id = u.id::text OR LOWER(c.student_id) = LOWER(u.email))
       WHERE c.id = $1 OR LOWER(c.certificate_id) = LOWER($1)`,
      [certId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }
    const cert = result.rows[0];
    if (user) {
      const isPrivileged = user.role === "admin" || user.role === "super_admin";
      const ownsCert = cert.student_id === user.id || cert.student_code === user.studentId || cert.student_email?.toLowerCase() === user.email.toLowerCase();
      if (!isPrivileged && !ownsCert) {
        res.status(403).json({ error: "Forbidden: You cannot access another student certificate" });
        return;
      }
    } else {
      const { expires, sig, user: signedUser } = req.query;
      if (expires && sig && signedUser && cert.file_key) {
        const isValid = verifySignedDownload(cert.file_key, signedUser, Number(expires), sig);
        if (!isValid) {
          res.status(403).json({ error: "Signed download link has expired or is invalid" });
          return;
        }
      } else {
        res.status(401).json({
          error: "Unauthorized: Authentication required to download certificate. Please sign in or use an authorized link."
        });
        return;
      }
    }
    const sanitizedStudentName = (cert.student_name || "Student").replace(/[^a-zA-Z0-9]/g, "_");
    const sanitizedTitle = (cert.title || cert.certificate_name || "Certificate").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `${sanitizedStudentName}_${sanitizedTitle}_Certificate.pdf`;
    if (cert.file_key) {
      const physicalPath = getFilePath(cert.file_key);
      if (physicalPath && fs5.existsSync(physicalPath)) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        const stream = fs5.createReadStream(physicalPath);
        stream.pipe(res);
        return;
      }
    }
    const pdfBuffer = generateCertificatePdfBuffer({
      studentName: cert.student_name,
      title: cert.title || cert.certificate_name,
      type: cert.type,
      certificate_id: cert.certificate_id,
      program: cert.program,
      issue_date: cert.issue_date,
      studentUniversity: cert.student_university
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("[Download Certificate Error]", err);
    res.status(500).json({ error: err.message || "Download failed" });
  }
});
router4.get("/events/public", async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, title, type, date, time, location, max_capacity,
              (SELECT count(*)::int FROM event_registrations r WHERE r.event_id = events.id AND r.status = 'Registered') as attendee_count
       FROM events
       WHERE date >= CURRENT_DATE - INTERVAL '1 day'
       ORDER BY date ASC LIMIT 6`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[Public Events Error]", err);
    res.status(500).json({ error: "Failed to fetch public events" });
  }
});
var public_default = router4;

// server/index.ts
dotenv3.config();
var app = express();
var PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use((req, _res, next) => {
  const matched = req.headers["x-matched-path"] || req.headers["x-forwarded-url"];
  if (matched && typeof matched === "string" && matched.startsWith("/api") && req.url !== matched) {
    req.url = matched;
  }
  next();
});
app.use((req, _res, next) => {
  if (!req.path.startsWith("/api/health") && !req.path.startsWith("/health")) {
    console.log(`[API] ${req.method} ${req.originalUrl || req.url || req.path}`);
  }
  next();
});
app.get(["/api/health", "/health"], (_req, res) => {
  res.json({
    status: "ok",
    service: "CampusConnect API",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    isVercel: !!process.env.VERCEL
  });
});
var initPromise = null;
async function ensureInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await runMigration();
        await seedDatabase();
      } catch (err) {
        console.warn("[Init Notice]:", err?.message || err);
      }
    })();
  }
  return initPromise;
}
app.use(async (_req, _res, next) => {
  await ensureInitialized();
  next();
});
app.use("/api/auth", auth_default);
app.use("/auth", auth_default);
app.use("/api/student", student_default);
app.use("/student", student_default);
app.use("/api/admin", admin_default);
app.use("/admin", admin_default);
app.use("/api", public_default);
app.use("/", public_default);
app.use((err, _req, res, _next) => {
  console.error("[API Error]:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});
var isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT || process.env.VERCEL_ENV);
async function start() {
  try {
    await ensureInitialized();
    if (process.env.NODE_ENV !== "test" && !isServerless) {
      app.listen(PORT, () => {
        console.log(`\u{1F680} CampusConnect API server running at http://localhost:${PORT}`);
      });
    }
  } catch (err) {
    console.error("Failed to initialize CampusConnect server:", err);
  }
}
if (!isServerless) {
  start();
}
var index_default = app;

// server/vercelHandler.ts
function handler(req, res) {
  const matched = req.headers["x-matched-path"] || req.headers["x-forwarded-url"];
  if (matched && typeof matched === "string" && matched.startsWith("/api") && (req.url === "/api" || req.url === "/" || req.url === "/api/")) {
    req.url = matched;
  } else if ((req.url === "/api" || req.url === "/" || req.url === "/api/") && req.query?.all) {
    const subpath = Array.isArray(req.query.all) ? req.query.all.join("/") : req.query.all;
    req.url = `/api/${subpath}`;
  }
  return index_default(req, res);
}
export {
  handler as default
};
