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
import CertificatesPage from '@/pages/student/CertificatesPage'
import EventsPage from '@/pages/student/EventsPage'
import EventDetailPage from '@/pages/student/EventDetailPage'
import ResourcesPage from '@/pages/student/ResourcesPage'
import ProfilePage from '@/pages/student/ProfilePage'
import NotificationsPage from '@/pages/student/NotificationsPage'

import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage'
import AdminStudentsPage from '@/pages/admin/AdminStudentsPage'
import AdminCertificatesPage from '@/pages/admin/AdminCertificatesPage'
import AdminEventsPage from '@/pages/admin/AdminEventsPage'
import AdminResourcesPage from '@/pages/admin/AdminResourcesPage'
import AdminAdminsPage from '@/pages/admin/AdminAdminsPage'
import AdminAuditLogsPage from '@/pages/admin/AdminAuditLogsPage'

import VerifyCertificatePage from '@/pages/public/VerifyCertificatePage'
import LandingPage from '@/pages/public/LandingPage'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LookapScrollManager } from '@/components/common/LookapScrollManager'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import PWAPopup from '@/components/common/PWAPopup'
import { UserRole } from '@/types/user'

export const AUTHORIZED_ADMIN_EMAIL = 'sharmadevesh040@gmail.com'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: UserRole }) {
  const { currentUser, userProfile, loading } = useAuth()
  if (loading) return <LoadingSpinner fullScreen />
  if (!currentUser) return <Navigate to="/login" replace />

  // Strict check: Only AUTHORIZED_ADMIN_EMAIL can access admin portal routes
  if (role === UserRole.ADMIN) {
    const email = (userProfile?.email || currentUser?.email)?.toLowerCase().trim()
    const isAdminRole = userProfile?.role === UserRole.ADMIN || userProfile?.role === UserRole.SUPER_ADMIN
    if (email !== AUTHORIZED_ADMIN_EMAIL.toLowerCase() || !isAdminRole) {
      return <Navigate to="/student/dashboard" replace />
    }
  } else if (role && userProfile?.role !== role && userProfile?.role !== UserRole.SUPER_ADMIN) {
    return <Navigate to="/student/dashboard" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile, loading } = useAuth()
  if (loading) return <LoadingSpinner fullScreen />
  if (currentUser) {
    const email = (userProfile?.email || currentUser?.email)?.toLowerCase().trim()
    const isAdmin = email === AUTHORIZED_ADMIN_EMAIL.toLowerCase()
    return <Navigate to={isAdmin ? "/admin/dashboard" : "/student/dashboard"} replace />
  }
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
    <ErrorBoundary fallbackTitle="CampusConnect Display Recovery">
      <LookapScrollManager />
      <PWAPopup />
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

        <Route path="/student/certificates" element={<CertificatesPage />} />
        <Route path="/certificates" element={<Navigate to="/student/certificates" replace />} />

        <Route path="/student/events" element={<EventsPage />} />
        <Route path="/events" element={<Navigate to="/student/events" replace />} />

        <Route path="/student/events/:id" element={<EventDetailPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />

        <Route path="/student/resources" element={<ResourcesPage />} />
        <Route path="/resources" element={<Navigate to="/student/resources" replace />} />

        <Route path="/student/profile" element={<ProfilePage />} />
        <Route path="/profile" element={<Navigate to="/student/profile" replace />} />

        <Route path="/student/notifications" element={<NotificationsPage />} />
        <Route path="/notifications" element={<Navigate to="/student/notifications" replace />} />

        {/* Removed feature redirects to avoid dead links */}
        <Route path="/student/calendar" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/calendar" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/student/interviews" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/student/interviews/*" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/interviews" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/interviews/*" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/student/interview-prep" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/student/tasks" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/tasks" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/student/announcements" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/announcements" element={<Navigate to="/student/dashboard" replace />} />
      </Route>

      {/* Admin Panel Routes */}
      <Route element={<ProtectedRoute role={UserRole.ADMIN}><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/students" element={<AdminStudentsPage />} />
        <Route path="/admin/certificates" element={<AdminCertificatesPage />} />
        <Route path="/admin/events" element={<AdminEventsPage />} />
        <Route path="/admin/resources" element={<AdminResourcesPage />} />
        <Route path="/admin/admins" element={<AdminAdminsPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />

        {/* Removed admin feature redirects */}
        <Route path="/admin/interviews" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/tasks" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/announcements" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ErrorBoundary>
  )
}
