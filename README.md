# 🎓 CampusConnect — Student Management PWA

> **A modern, production-ready Progressive Web App (PWA) for university and student ambassador programs.**

CampusConnect provides complete isolation and synchronization between an **Admin Panel** and a **Student PWA**. Administrators manage schedules, verified certificates, events, tasks, announcements, and resources, while students access only their authorized data after authenticating.

---

## 🏛️ System Architecture

```text
                           CAMPUSCONNECT
                                 |
              +------------------+------------------+
              |                                     |
         STUDENT PWA                           ADMIN PANEL
      (/student/dashboard)                  (/admin/dashboard)
              |                                     |
              +------------------+------------------+
                                 |
                         Secure REST API
                             (/api)
                                 |
                  +--------------+--------------+
                  |                             |
           Neon PostgreSQL                 File Storage
          (Relational Data)             (PDFs & Documents)
                  |                             |
          • Users & Profiles            • Certificate PDFs
          • Interviews                  • Student Avatars
          • Events & Registrations      • Event Banners
          • Certificates Metadata       • Learning Resources
          • Tasks & Deadlines
          • Announcements & Notes
          • Security Audit Logs
```

---

## 🚀 Tech Stack

### Frontend & PWA
- **React 19 & TypeScript**: Strict type safety.
- **Vite 6**: Fast ESM development and optimized production bundling.
- **Tailwind CSS**: Clean, responsive layout with Dark Mode support.
- **Lucide Icons**: Modern iconography.
- **vite-plugin-pwa & Workbox**: Service worker caching, offline capability, web manifest, and install prompts.
- **Recharts**: Growth trends, funnel analytics, and velocity metrics.
- **PapaParse**: High-performance client and server-side CSV parsing.
- **QRCode**: Real-time QR generation for public credential validation.

### Backend & Database
- **Express.js API Layer**: REST endpoints with JWT authorization (`requireAuth`, `requireRole`).
- **PostgreSQL / Neon PostgreSQL**: Fully relational schema with indexes, foreign keys, and audit logging.
- **Dual-Mode Persistence**: Seamlessly runs with real Neon PostgreSQL when `DATABASE_URL` is set, and falls back to an in-memory seed store for instant local testing.
- **Secure File Storage**: Certificate PDFs stored on disk or object store with signed download URLs.
- **Server-Side AI Assistant**: Gemini API proxy protecting secrets from client exposure.

---

## ⚡ Quick Start

### 1. Installation

```bash
git clone <repo-url>
cd campusconnct
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure:
- `DATABASE_URL`: Your Neon PostgreSQL connection string (optional in local dev).
- `AUTH_SECRET`: Secret key used to sign JWT tokens.
- `GEMINI_API_KEY`: Google AI Studio key for the STAR Interview Coach (optional).

### 3. Run Migrations & Seed Data

```bash
# Run PostgreSQL DDL migrations
npm run db:migrate

# Seed default administrator & student accounts
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

This concurrently boots:
- **API Server** on `http://localhost:3001`
- **Vite PWA Client** on `http://localhost:5173` (with `/api` proxy)

---

## 🔑 Preconfigured Demo Accounts

| Role | Email | Password | Dashboard URL |
| :--- | :--- | :--- | :--- |
| **Student (Alex Chen)** | `alex@campusconnect.edu` | `student123` | `http://localhost:5173/student/dashboard` |
| **Admin (Dr. Sarah Jenkins)** | `admin@campusconnect.edu` | `admin123` | `http://localhost:5173/admin/dashboard` |
| **Super Admin (Prof. Vance)** | `superadmin@campusconnect.edu` | `superadmin123` | `http://localhost:5173/admin/admins` |

---

## 📋 Core Workflows

### 1. Certificate Issuance & QR Verification
1. Admin opens `/admin/certificates` and selects **Issue Certificate**.
2. Selects a student, assigns a title, and uploads or auto-generates a PDF.
3. System assigns a cryptographic ID (e.g. `GSA-2026-000123`) and generates a verification QR code.
4. Student logs in, views the certificate in `/student/certificates`, and downloads the signed PDF.
5. Scanning the QR code or visiting `/verify/GSA-2026-000123` publicly validates the certificate without requiring authentication.

### 2. Bulk Student Onboarding (CSV)
1. Admin navigates to `/admin/students` and clicks **Bulk CSV Import**.
2. Uploads or pastes CSV data with format:
   ```csv
   name,email,student_id,course,branch,year
   Rahul Sharma,rahul@email.com,GSA-2026-901,BTech,CSE,2
   Aman Gupta,aman@email.com,GSA-2026-902,BTech,IT,1
   ```
3. Validation previews valid rows and syntax errors.
4. Clicking **Import Valid Students** provisions accounts and student profiles.

### 3. Interview Scheduling & Countdown
1. Admin creates an interview round via `/admin/interviews` with date, time, and meeting link.
2. System pushes an instant notification to the assigned student.
3. Student sees an active real-time countdown timer, interviewer instructions, and a one-click **Add to Calendar (.ics)** button.

### 4. AI Interview Prep & STAR Coach
- Located at `/student/interview-prep`.
- Offers mock behavioral interview simulations.
- Provides coaching on the **Situation, Task, Action, Result (STAR)** framework.

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub / GitLab.
2. In the Vercel Dashboard, import the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
3. Add Environment Variables:
   - `DATABASE_URL`: Neon PostgreSQL pooled connection string.
   - `AUTH_SECRET`: Strong secret string.
   - `GEMINI_API_KEY`: Server-side Gemini API key.
4. Deploy! `vercel.json` automatically routes `/api/(.*)` to the serverless handler and all other routes to the PWA frontend.

---

## 🛡️ Security & Role-Based Access Control (RBAC)

- **Student Isolation**: Endpoints enforce `WHERE student_id = req.user.id`. Students cannot read or mutate other students' private records.
- **Admin Verification**: All `/api/admin/*` endpoints strictly require `admin` or `super_admin` role.
- **Audit Logging**: Every administrative action (student creation, interview scheduling, certificate issuance, revocation) is recorded in `audit_logs` with timestamps and IP addresses.
