import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useEffect } from 'react'

import AppLayout from '@/layouts/AppLayout'
import AdminLayout from '@/layouts/AdminLayout'
import AuthLayout from '@/layouts/AuthLayout'

import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'

import DashboardPage from '@/pages/student/DashboardPage'
import InterviewsPage from '@/pages/student/InterviewsPage'
import InterviewDetailPage from '@/pages/student/InterviewDetailPage'
import InterviewPrepPage from '@/pages/student/InterviewPrepPage'
import CertificatesPage from '@/pages/student/CertificatesPage'
import EventsPage from '@/pages/student/EventsPage'
import EventDetailPage from '@/pages/student/EventDetailPage'
import TasksPage from '@/pages/student/TasksPage'
import AnnouncementsPage from '@/pages/student/AnnouncementsPage'
import ResourcesPage from '@/pages/student/ResourcesPage'
import CalendarPage from '@/pages/student/CalendarPage'
import ProfilePage from '@/pages/student/ProfilePage'
import NotificationsPage from '@/pages/student/NotificationsPage'

import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage'
import AdminStudentsPage from '@/pages/admin/AdminStudentsPage'
import AdminInterviewsPage from '@/pages/admin/AdminInterviewsPage'
import AdminCertificatesPage from '@/pages/admin/AdminCertificatesPage'
import AdminEventsPage from '@/pages/admin/AdminEventsPage'
import AdminTasksPage from '@/pages/admin/AdminTasksPage'
import AdminAnnouncementsPage from '@/pages/admin/AdminAnnouncementsPage'
import AdminResourcesPage from '@/pages/admin/AdminResourcesPage'
import AdminAdminsPage from '@/pages/admin/AdminAdminsPage'
import AdminAuditLogsPage from '@/pages/admin/AdminAuditLogsPage'

import VerifyCertificatePage from '@/pages/public/VerifyCertificatePage'
import LandingPage from '@/pages/public/LandingPage'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { UserRole } from '@/types/user'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: UserRole }) {
  const { currentUser, userProfile, loading } = useAuth()
  if (loading) return <LoadingSpinner fullScreen />
  if (!currentUser) return <Navigate to="/login" replace />
  if (role && userProfile?.role !== role && userProfile?.role !== UserRole.SUPER_ADMIN) {
    return <Navigate to="/student/dashboard" replace />
  }
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth()
  if (loading) return <LoadingSpinner fullScreen />
  if (currentUser) return <Navigate to="/student/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const { theme } = useTheme()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else if (theme === 'light') root.classList.remove('dark')
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) root.classList.add('dark')
      else root.classList.remove('dark')
    }
  }, [theme])

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/verify/:certificateId" element={<VerifyCertificatePage />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Route>

      {/* Student App Routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/student/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />

        <Route path="/student/interviews" element={<InterviewsPage />} />
        <Route path="/interviews" element={<Navigate to="/student/interviews" replace />} />

        <Route path="/student/interviews/:id" element={<InterviewDetailPage />} />
        <Route path="/interviews/:id" element={<InterviewDetailPage />} />

        <Route path="/student/interview-prep" element={<InterviewPrepPage />} />

        <Route path="/student/certificates" element={<CertificatesPage />} />
        <Route path="/certificates" element={<Navigate to="/student/certificates" replace />} />

        <Route path="/student/events" element={<EventsPage />} />
        <Route path="/events" element={<Navigate to="/student/events" replace />} />

        <Route path="/student/events/:id" element={<EventDetailPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />

        <Route path="/student/tasks" element={<TasksPage />} />
        <Route path="/tasks" element={<Navigate to="/student/tasks" replace />} />

        <Route path="/student/announcements" element={<AnnouncementsPage />} />
        <Route path="/announcements" element={<Navigate to="/student/announcements" replace />} />

        <Route path="/student/resources" element={<ResourcesPage />} />
        <Route path="/resources" element={<Navigate to="/student/resources" replace />} />

        <Route path="/student/calendar" element={<CalendarPage />} />
        <Route path="/calendar" element={<Navigate to="/student/calendar" replace />} />

        <Route path="/student/profile" element={<ProfilePage />} />
        <Route path="/profile" element={<Navigate to="/student/profile" replace />} />

        <Route path="/student/notifications" element={<NotificationsPage />} />
        <Route path="/notifications" element={<Navigate to="/student/notifications" replace />} />
      </Route>

      {/* Admin Panel Routes */}
      <Route element={<ProtectedRoute role={UserRole.ADMIN}><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/students" element={<AdminStudentsPage />} />
        <Route path="/admin/interviews" element={<AdminInterviewsPage />} />
        <Route path="/admin/certificates" element={<AdminCertificatesPage />} />
        <Route path="/admin/events" element={<AdminEventsPage />} />
        <Route path="/admin/tasks" element={<AdminTasksPage />} />
        <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
        <Route path="/admin/resources" element={<AdminResourcesPage />} />
        <Route path="/admin/admins" element={<AdminAdminsPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
