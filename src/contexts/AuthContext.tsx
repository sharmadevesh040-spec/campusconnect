import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Profile } from '@/types'
import { UserRole } from '@/types'
import { apiRequest, setToken, clearToken, getToken } from '@/services/api'

interface AuthContextType {
  currentUser: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null
  userProfile: Profile | null
  loading: boolean
  role: UserRole | null
  login: (email: string, password: string) => Promise<any>
  register: (email: string, password: string, name: string, studentData?: any) => Promise<any>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (data: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function mapProfile(u: any): Profile {
  const p = u.profile || {}
  return {
    id: p.id || u.id,
    userId: u.id,
    fullName: p.full_name || u.email,
    email: u.email,
    phone: p.phone || '',
    studentId: p.student_id || 'GSA-2026-001',
    university: p.university || 'University',
    college: p.college || 'College',
    course: p.course || 'B.Tech',
    branch: p.branch || 'Computer Science',
    year: p.year || 2,
    semester: p.semester || 3,
    skills: Array.isArray(p.skills) ? p.skills : (p.skills ? JSON.parse(p.skills) : []),
    bio: p.bio || '',
    photoURL: p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.full_name || u.email)}`,
    completionPercentage: p.completion_pct || 85,
    isApproved: p.is_active ?? true,
    role: (u.role as UserRole) || UserRole.STUDENT,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<UserRole | null>(null)

  // Initialize session on mount directly from PostgreSQL API
  useEffect(() => {
    async function initAuth() {
      const token = getToken()
      if (token) {
        try {
          const res = await apiRequest<{ user: any }>('/api/auth/me')
          if (res?.user) {
            const u = res.user
            const prof = mapProfile(u)
            setCurrentUser({
              uid: u.id,
              email: u.email,
              displayName: prof.fullName,
              photoURL: prof.photoURL
            })
            setUserProfile(prof)
            setRole(prof.role || UserRole.STUDENT)
            setLoading(false)
            return
          }
        } catch {
          // Token expired or invalid
          clearToken()
        }
      }

      // No active session
      setCurrentUser(null)
      setUserProfile(null)
      setRole(null)
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })

    if (res.token && res.user) {
      setToken(res.token)
      const u = res.user
      const prof = mapProfile(u)

      setCurrentUser({
        uid: u.id,
        email: u.email,
        displayName: prof.fullName,
        photoURL: prof.photoURL
      })
      setUserProfile(prof)
      setRole(prof.role || UserRole.STUDENT)
      return u
    } else {
      throw new Error('Authentication failed: Missing token or user profile')
    }
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

    const res = await apiRequest<{ token: string; user: any; verificationCode?: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    if (res.token && res.user) {
      setToken(res.token)
      const u = res.user
      const prof = mapProfile(u)

      setCurrentUser({
        uid: u.id,
        email: u.email,
        displayName: prof.fullName,
        photoURL: prof.photoURL
      })
      setUserProfile(prof)
      setRole(UserRole.STUDENT)
      return res
    } else {
      throw new Error('Registration failed')
    }
  }

  const logout = async () => {
    clearToken()
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
