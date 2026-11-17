import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Profile } from '@/types'
import { UserRole } from '@/types'
import { apiRequest, setToken, clearToken, getToken } from '@/services/api'
import { safeParseSkills } from '@/lib/dateUtils'
import { sendStudentHeartbeat } from '@/services/studentService'

const USER_CACHE_KEY = 'campusconnect_user'
const PROFILE_CACHE_KEY = 'campusconnect_profile'

interface AuthContextType {
  currentUser: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null
  userProfile: Profile | null
  loading: boolean
  role: UserRole | null
  login: (email: string, password: string) => Promise<any>
  loginWithSession: (token: string, user: any) => void
  register: (email: string, password: string, name: string, studentData?: any) => Promise<any>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (data: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function parseJwtPayload(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

function isTokenValid(token: string | null): boolean {
  if (!token) return false
  const payload = parseJwtPayload(token)
  if (!payload) return false
  if (payload.exp && payload.exp * 1000 <= Date.now()) {
    return false
  }
  return true
}

function mapProfile(u: any): Profile {
  const p = u?.profile || {}
  const email = u?.email || p?.email || ''
  const isSuperAdmin = email?.toLowerCase().trim() === 'sharmadevesh040@gmail.com'
  const fallbackRole = isSuperAdmin ? UserRole.SUPER_ADMIN : UserRole.STUDENT

  return {
    id: p.id || u?.id || 'id-default',
    userId: u?.id || 'uid-default',
    fullName: p.full_name || (isSuperAdmin ? 'Devesh Sharma' : email) || 'Student Ambassador',
    email,
    phone: p.phone || '',
    studentId: p.student_id || 'GSA-2026-001',
    university: p.university || 'University',
    college: p.college || 'College',
    course: p.course || 'B.Tech',
    branch: p.branch || 'Computer Science',
    year: Number(p.year) || 2,
    semester: Number(p.semester) || 3,
    skills: safeParseSkills(p.skills),
    bio: p.bio || '',
    photoURL: p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.full_name || email || 'Ambassador')}`,
    completionPercentage: Number(p.completion_pct) || 85,
    isApproved: p.is_active ?? true,
    role: (u?.role as UserRole) || fallbackRole,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

function getInitialUser(): any {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
    const token = getToken()
    if (token && isTokenValid(token)) {
      const payload = parseJwtPayload(token)
      if (payload) {
        const isSuperAdmin = payload.email?.toLowerCase().trim() === 'sharmadevesh040@gmail.com'
        const name = isSuperAdmin ? 'Devesh Sharma' : (payload.email?.split('@')[0] || 'Ambassador')
        return {
          uid: payload.id || 'usr-cached',
          email: payload.email,
          displayName: name,
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
        }
      }
    }
  } catch {}
  return null
}

function getInitialProfile(): Profile | null {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY)
    if (cached) {
      const p = JSON.parse(cached)
      return {
        ...p,
        createdAt: new Date(p.createdAt || Date.now()),
        updatedAt: new Date(p.updatedAt || Date.now())
      }
    }
    const token = getToken()
    if (token && isTokenValid(token)) {
      const payload = parseJwtPayload(token)
      if (payload) {
        const isSuperAdmin = payload.email?.toLowerCase().trim() === 'sharmadevesh040@gmail.com'
        const role = isSuperAdmin ? UserRole.SUPER_ADMIN : ((payload.role as UserRole) || UserRole.STUDENT)
        const name = isSuperAdmin ? 'Devesh Sharma' : (payload.email?.split('@')[0] || 'Student Ambassador')
        return {
          id: payload.id || 'id-default',
          userId: payload.id || 'uid-default',
          fullName: name,
          email: payload.email || '',
          phone: '',
          studentId: payload.studentId || 'GSA-2026-001',
          university: 'University',
          college: 'College',
          course: 'B.Tech',
          branch: 'Computer Science',
          year: 2,
          semester: 3,
          skills: ['Ambassador'],
          bio: '',
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          completionPercentage: 85,
          isApproved: true,
          role,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    }
  } catch {}
  return null
}

function getInitialRole(): UserRole | null {
  const profile = getInitialProfile()
  if (profile?.role) return profile.role
  const token = getToken()
  if (token && isTokenValid(token)) {
    const payload = parseJwtPayload(token)
    if (payload?.email?.toLowerCase().trim() === 'sharmadevesh040@gmail.com') return UserRole.SUPER_ADMIN
    if (payload?.role) return payload.role as UserRole
  }
  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(() => getInitialUser())
  const [userProfile, setUserProfile] = useState<Profile | null>(() => getInitialProfile())
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<UserRole | null>(() => getInitialRole())

  // Background session sync with PostgreSQL / Vercel API
  const refreshSession = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setCurrentUser(null)
      setUserProfile(null)
      setRole(null)
      return
    }

    if (!isTokenValid(token)) {
      console.warn('[Auth] Token expired locally past exp timestamp')
      clearToken()
      try {
        localStorage.removeItem(USER_CACHE_KEY)
        localStorage.removeItem(PROFILE_CACHE_KEY)
      } catch {}
      setCurrentUser(null)
      setUserProfile(null)
      setRole(null)
      return
    }

    try {
      const res = await apiRequest<{ user: any; token?: string }>('/api/auth/me')
      if (res?.token) {
        setToken(res.token) // Sliding session auto-refresh
      }
      if (res?.user) {
        const u = res.user
        const prof = mapProfile(u)
        const userObj = {
          uid: u.id,
          email: u.email,
          displayName: prof.fullName,
          photoURL: prof.photoURL
        }
        setCurrentUser(userObj)
        setUserProfile(prof)
        setRole(prof.role || UserRole.STUDENT)
        try {
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userObj))
          localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(prof))
        } catch {}
      }
    } catch (err: any) {
      // CRITICAL PRESERVATION RULE:
      // Only clear token if server explicitly returned 401 Unauthorized (token invalid/forged).
      // NEVER clear token on network cold start, offline (status 0), timeout, or 500/502/504 errors!
      if (err?.status === 401) {
        console.warn('[Auth] Server explicitly rejected token with 401 Unauthorized:', err.message)
        clearToken()
        try {
          localStorage.removeItem(USER_CACHE_KEY)
          localStorage.removeItem(PROFILE_CACHE_KEY)
        } catch {}
        setCurrentUser(null)
        setUserProfile(null)
        setRole(null)
      } else {
        console.info('[Auth] Server unreachable or cold-start, preserving active session:', err?.message)
      }
    }
  }, [])

  // Initialize session on mount
  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  // Re-verify session when tab becomes visible after backgrounding, without intrusive UI flash
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSession()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshSession])

  // Send periodic student heartbeat to maintain active/online telemetry
  useEffect(() => {
    if (!currentUser || role !== UserRole.STUDENT) return

    // Initial heartbeat ping
    sendStudentHeartbeat()

    // Regular heartbeat every 2.5 minutes while tab is active
    const interval = setInterval(() => {
      if (!document.hidden) {
        sendStudentHeartbeat()
      }
    }, 2.5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [currentUser, role])

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })

    if (res.token && res.user) {
      setToken(res.token)
      const u = res.user
      const prof = mapProfile(u)
      const userObj = {
        uid: u.id,
        email: u.email,
        displayName: prof.fullName,
        photoURL: prof.photoURL
      }

      setCurrentUser(userObj)
      setUserProfile(prof)
      setRole(prof.role || UserRole.STUDENT)

      try {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userObj))
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(prof))
      } catch {}

      return u
    } else {
      throw new Error('Authentication failed: Missing token or user profile')
    }
  }

  const loginWithSession = (token: string, user: any) => {
    setToken(token)
    const prof = mapProfile(user)
    const userObj = {
      uid: user.id,
      email: user.email,
      displayName: prof.fullName,
      photoURL: prof.photoURL
    }

    setCurrentUser(userObj)
    setUserProfile(prof)
    setRole(prof.role || UserRole.STUDENT)

    try {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userObj))
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(prof))
    } catch {}
  }

  const register = async (email: string, password: string, name: string, studentData?: any) => {
    const payload = {
      fullName: name,
      email,
      phone: studentData?.phone || '+1 (555) 000-0000',
      studentId: studentData?.studentId || 'GSA-2026-' + Math.floor(100000 + Math.random() * 900000),
      university: studentData?.university || 'University',
      college: studentData?.college || 'College of Engineering',
      course: studentData?.course || 'B.Tech',
      branch: studentData?.branch || 'Computer Science',
      year: Number(studentData?.year) || 1,
      semester: (Number(studentData?.year) || 1) * 2 - 1,
      password,
      confirmPassword: password
    }

    const res = await apiRequest<{ message: string; email?: string; requiresVerification?: boolean }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    // Do NOT set token or current user here!
    // The student MUST verify the 6-digit OTP code before getting an authenticated session.
    return res
  }

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => {})
    } catch {}
    clearToken()
    try {
      localStorage.removeItem(USER_CACHE_KEY)
      localStorage.removeItem(PROFILE_CACHE_KEY)
    } catch {}
    setCurrentUser(null)
    setUserProfile(null)
    setRole(null)
  }

  const resetPassword = async (email: string) => {
    await apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  }

  const updateUserProfile = async (data: Partial<Profile>) => {
    if (!userProfile) return
    const updated = { ...userProfile, ...data, updatedAt: new Date() }
    setUserProfile(updated)
    try {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updated))
    } catch {}
    await apiRequest('/api/student/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        role,
        login,
        loginWithSession,
        register,
        logout,
        resetPassword,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
