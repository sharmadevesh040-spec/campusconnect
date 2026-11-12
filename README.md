# CampusConnect — Student Hub PWA

> **Everything students need, in one place.**  
> *Built for university and student ambassador programs.*

CampusConnect is a production-ready **Progressive Web App (PWA)** engineered for students and student leaders in university ambassador networks. It centralizes interview schedules, application statuses, digital verified certificates, campus events, assigned tasks, announcements, resources, and AI-powered interview coaching into one unified experience.

---

## 🌟 Key Features

### 1. Student Dashboard
- **Dynamic Personalized Greeting**: Time-aware greeting (`Good morning`, `Good afternoon`, `Good evening`).
- **Quick Metric Cards**: Upcoming interviews, pending tasks, upcoming events, and available certificates.
- **Today's Schedule**: Prioritized view of the next interview countdown, pending deadlines, and broadcasts.
- **AI Coach Card**: Direct shortcut to mock interview preparation.

### 2. Interview Management & Reminders
- Complete interview details: Organization, interviewer, date, time, online meeting link, and candidate instructions.
- **Live Countdown Timer**: Real-time ticker counting down to the exact start of your round.
- **Calendar Integration**: Export `.ics` calendar invites for Google Calendar, Apple Calendar, and Outlook.
- **Status Lifecycle**: `Scheduled`, `Confirmed`, `Completed`, `Selected`, `Rejected`, `Rescheduled`, `Cancelled`.

### 3. Certificate Management & Public Verification
- **Verified Digital Credentials**: Every certificate carries a unique tracking identifier (e.g. `GSA-2026-000123`).
- **Public Verification Ledger**: Accessible at `/verify/:certificateId` without login.
- **Embedded QR Code**: Scannable QR code linking to the live verification record.
- **Instant Vector Download**: High-resolution certificate download.
- **Revocation Check**: Immediate warning badge if a credential has been revoked by administration.

### 4. Events & Workshops Hub
- Browse upcoming global summits, hands-on coding workshops, and career reviews.
- One-click registration with live capacity meters (`Open`, `Almost Full`, `Closed`).
- Virtual meeting room links and `.ics` event downloads.

### 5. Task & Deliverable Tracker
- Track orientation modules, monthly report deadlines, and ID verification tasks.
- Interactive checkboxes with instant progress calculation (`%` meter).
- Priority badges: `High`, `Medium`, `Low`, and automated overdue detection.

### 6. Announcement & Notification Center
- Broadcast priority tagging: `Urgent`, `High`, `Normal`, `Low`.
- Notification bell with unread count badge, category filtering, and "Mark All as Read".
- Browser notification permission prompt explaining benefits before requesting permissions.

### 7. AI Student Assistant & Interview Coach
- **General Q&A**: Guidance on program rubrics, stipend questions, and student leadership.
- **Mock Interview Simulator**: Practice with timed behavioral and technical questions.
- **STAR Framework Coach**: Step-by-step assistant for formatting responses into Situation, Task, Action, and Result.
- **Study Plan Generator**: Customized preparation roadmaps.
- *Security*: Backend-safe proxy architecture that never exposes raw Gemini API keys to the client.

### 8. Admin Control Panel
- **Student Directory**: Search students, approve registrations, edit profiles, or revoke access.
- **Interview Coordination**: Create, assign, reschedule, cancel, or mark candidates as `Selected`.
- **Certificate Authority**: Issue new certificates, assign unique IDs, and revoke compromised credentials.
- **Event Management**: Create summits, set participant limits, and monitor registration counts.
- **Task Delegation**: Assign tasks to students with custom deadlines.
- **Broadcast Studio**: Publish announcements and trigger push alerts.
- **Analytics & Recharts**: Real-time graphs for student registration trends and interview pipeline stages.

### 9. Progressive Web App (PWA) & Offline Capabilities
- **Installable Application**: Custom install banner with iOS "Add to Home Screen" instructions and Android/Desktop `beforeinstallprompt` support.
- **Offline Reliability**: Powered by `vite-plugin-pwa` and Service Worker (`workbox`).
- **IndexedDB / Local Cache**: Access schedules, certificates, and cached resources even without internet.
- **Network Status Banner**: "You're offline" indicator with automatic "Back online ✓" sync toast.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Tooling**: Vite 6
- **Styling**: Tailwind CSS + Custom CSS Variables
- **Icons**: Lucide React
- **Routing**: React Router DOM v7
- **PWA**: `vite-plugin-pwa` + `workbox-window`
- **Charts**: Recharts
- **Offline Storage**: IndexedDB (`idb`) + LocalStorage
- **Backend / Database**: Firebase (Auth, Firestore, Storage) with zero-config development fallback
- **Date Utilities**: `date-fns`
- **Toasts**: Sonner

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Node.js 20+ recommended)
- npm or pnpm

### 1. Installation
```bash
git clone https://github.com/your-username/campusconnect.git
cd campusconnect
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Firebase credentials (optional for development; if left empty, the application runs in interactive mock/seed mode):
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 3. Development Server
Start the local development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Production Build & Preview
To compile the TypeScript project and generate the optimized production PWA bundle:
```bash
npm run build
npm run preview
```

---

## 👥 Demo Personas (Instant Testing)

In development/demo mode, you can switch between roles directly using the top banner pill on the dashboard or sign in with these credentials:

| Persona | Name | Role | Access |
|---|---|---|---|
| **Student** | Alex Morgan | Student Ambassador | Student Dashboard, Interviews, Events, Tasks, Certs, AI Coach |
| **Admin** | Dr. Sarah Jenkins | Faculty Director | Admin Panel, Student Approvals, Interview Scheduling, Cert Issuance |
| **Student 2** | Devon Vance | Robotics Lead | Student Ambassador features |

---

## 📱 PWA Installation Testing

1. **Google Chrome / Edge (Desktop)**:
   - Click the install icon in the address bar or click the **📱 Install CampusConnect** banner at the bottom right.
2. **Android Chrome**:
   - Tap the **Install App** button on the landing page or banner to install the standalone web APK.
3. **iOS Safari**:
   - Tap **Share** (`⬆`) → **Add to Home Screen** → **Add**.
4. **Offline Mode**:
   - Open Chrome DevTools → **Application** tab → **Service Workers** → check **Offline**.
   - Navigate between Dashboard, Calendar, and Certificates to see cached data and the offline banner.

---

## 🔒 Security & Firestore Rules

When deploying with Firebase Firestore, use these recommended security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'admin';
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Profiles: users read own, admins read all
    match /profiles/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) || isAdmin();
    }

    // Certificates: public can read for verification; only admins write
    match /certificates/{certId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Interviews: students read their own; admins read/write all
    match /interviews/{interviewId} {
      allow read: if isAuthenticated() && (resource.data.studentId == request.auth.uid || isAdmin());
      allow write: if isAdmin();
    }

    // Events & Announcements: public authenticated read; admin write
    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    match /announcements/{announcementId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Tasks: students can update status of own tasks; admins have full access
    match /tasks/{taskId} {
      allow read: if isAuthenticated() && (resource.data.studentId == request.auth.uid || isAdmin());
      allow create, delete: if isAdmin();
      allow update: if isAuthenticated() && (resource.data.studentId == request.auth.uid || isAdmin());
    }
  }
}
```

---

## ☁️ Deployment Instructions

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Set public directory to "dist"
# Configure as a single-page app: Yes
npm run build
firebase deploy
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
Create a `netlify.toml` file with:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 📄 License & Attribution
- Project: **CampusConnect — Student Hub**
- Tagline: *Everything students need, in one place.*
- Note: Built by a Google Student Ambassador. This platform is an independent student initiative and not an official Google product.
