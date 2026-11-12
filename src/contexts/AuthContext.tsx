import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Profile } from '@/types'
import { UserRole } from '@/types'
import { SEED_PROFILES } from '@/lib/mockData'
import { apiRequest, setToken, clearToken, getToken } from '@/services/api'

interface AuthContextType {
  currentUser: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null
  userProfile: Profile | null
  loading: boolean
  role: UserRole | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, studentData?: any) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  googleSignIn: () => Promise<void>
  updateUserProfile: (data: Partial<Profile>) => Promise<void>
  switchRole: (role: UserRole) => void
  setDemoUser: (index: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const LOCAL_STORAGE_PROFILE_KEY = 'campusconnect_active_profile'
const LOCAL_STORAGE_PROFILES_KEY = 'campusconnect_profiles_db'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<UserRole | null>(null)

  // Initialize session on mount
  useEffect(() => {
    async function initAuth() {
      const token = getToken()
      if (token) {
        try {
          const res = await apiRequest<{ user: any }>('/api/auth/me')
          const u = res.user
          const prof: Profile = {
            id: u.id,
            userId: u.id,
            fullName: u.profile?.full_name || u.email,
            email: u.email,
            phone: u.profile?.phone || '',
            studentId: u.profile?.student_id || 'GSA-2026-001',
            university: u.profile?.university || 'University',
            college: u.profile?.college || 'College',
            course: u.profile?.course || 'B.Tech',
            branch: u.profile?.branch || 'Computer Science',
            year: u.profile?.year || 2,
            semester: u.profile?.semester || 3,
            skills: u.profile?.skills || [],
            bio: u.profile?.bio || '',
            photoURL: u.profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.profile?.full_name || u.email)}`,
            completionPercentage: u.profile?.completion_pct || 85,
            isApproved: u.profile?.is_active ?? true,
            role: (u.role as UserRole) || UserRole.STUDENT,
            createdAt: new Date(),
            updatedAt: new Date()
          }
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
        } catch {
          // Token expired or server offline, fall back to offline cache
        }
      }

      // Offline or default demo profile
      try {
        const savedId = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY)
        const storedProfiles: Profile[] = JSON.parse(
          localStorage.getItem(LOCAL_STORAGE_PROFILES_KEY) || JSON.stringify(SEED_PROFILES)
        )
        const matched = storedProfiles.find(p => p.id === savedId) || storedProfiles[0]

        setCurrentUser({
          uid: matched.id,
          email: matched.email,
          displayName: matched.fullName,
          photoURL: matched.photoURL
        })
        setUserProfile(matched)
        setRole(matched.role || UserRole.STUDENT)
      } catch {
        const fallback = SEED_PROFILES[0]
        setCurrentUser({
          uid: fallback.id,
          email: fallback.email,
          displayName: fallback.fullName,
          photoURL: fallback.photoURL
        })
        setUserProfile(fallback)
        setRole(UserRole.STUDENT)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await apiRequest<{ token: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })

      if (res.token) {
        setToken(res.token)
        const u = res.user
        const prof: Profile = {
          id: u.id,
          userId: u.id,
          fullName: u.profile?.full_name || u.email,
          email: u.email,
          phone: u.profile?.phone || '',
          studentId: u.profile?.student_id || 'GSA-2026-001',
          university: u.profile?.university || 'University',
          college: u.profile?.college || 'College',
          course: u.profile?.course || 'B.Tech',
          branch: u.profile?.branch || 'Computer Science',
          year: u.profile?.year || 2,
          semester: u.profile?.semester || 3,
          skills: u.profile?.skills || [],
          bio: u.profile?.bio || '',
          photoURL: u.profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.profile?.full_name || u.email)}`,
          completionPercentage: u.profile?.completion_pct || 85,
          isApproved: u.profile?.is_active ?? true,
          role: (u.role as UserRole) || UserRole.STUDENT,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        setCurrentUser({
          uid: u.id,
          email: u.email,
          displayName: prof.fullName,
          photoURL: prof.photoURL
        })
        setUserProfile(prof)
        setRole(prof.role || UserRole.STUDENT)
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, prof.id)
      }
    } catch (err: any) {
      // Offline fallback: check local demo profiles
      const matched = SEED_PROFILES.find(p => p.email.toLowerCase() === email.toLowerCase())
      if (matched) {
        setCurrentUser({ uid: matched.id, email: matched.email, displayName: matched.fullName, photoURL: matched.photoURL })
        setUserProfile(matched)
        setRole(matched.role || UserRole.STUDENT)
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, matched.id)
        return
      }
      throw err
    }
  }

  const register = async (email: string, password: string, name: string, studentData?: any) => {
    const payload = {
      fullName: name,
      email,
      phone: studentData?.phone || '+1 (555) 000-0000',
      studentId: studentData?.studentId || 'GSA-2026-' + Math.floor(100000 + Math.random() * 900000),
      university: studentData?.university || 'Global Institute of Technology',
      college: studentData?.college || 'Engineering College',
      course: studentData?.course || 'B.Tech',
      branch: studentData?.branch || 'Computer Science',
      year: Number(studentData?.year) || 1,
      semester: (Number(studentData?.year) || 1) * 2 - 1,
      password,
      confirmPassword: password
    }

    const res = await apiRequest<{ token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    if (res.token) {
      setToken(res.token)
      const u = res.user
      const prof: Profile = {
        id: u.id,
        userId: u.id,
        fullName: u.profile.full_name,
        email: u.email,
        phone: u.profile.phone,
        studentId: u.profile.student_id,
        university: u.profile.university,
        college: u.profile.college,
        course: u.profile.course,
        branch: u.profile.branch,
        year: u.profile.year,
        semester: u.profile.semester,
        skills: [],
        bio: '',
        photoURL: u.profile.avatar_url,
        completionPercentage: 85,
        isApproved: true,
        role: UserRole.STUDENT,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setCurrentUser({ uid: u.id, email: u.email, displayName: prof.fullName, photoURL: prof.photoURL })
      setUserProfile(prof)
      setRole(UserRole.STUDENT)
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, prof.id)
    }
  }

  const googleSignIn = async () => {
    try {
      const res = await apiRequest<{ token: string; user: any }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ email: 'alex@campusconnect.edu', name: 'Alex Chen' })
      })
      if (res.token) {
        setToken(res.token)
        const u = res.user
        const prof: Profile = {
          ...SEED_PROFILES[0],
          id: u.id,
          userId: u.id,
          fullName: u.profile?.full_name || 'Alex Chen',
          email: u.email
        }
        setCurrentUser({ uid: u.id, email: u.email, displayName: prof.fullName, photoURL: prof.photoURL })
        setUserProfile(prof)
        setRole(UserRole.STUDENT)
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, prof.id)
      }
    } catch {
      // Offline demo fallback
      setDemoUser(0)
    }
  }

  const logout = async () => {
    clearToken()
    setCurrentUser(null)
    setUserProfile(null)
    setRole(null)
    localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY)
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
      await apiRequest('/api/student/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    } catch (e) {
      console.warn('Profile updated locally (offline)', e)
    }
  }

  const switchRole = (newRole: UserRole) => {
    if (newRole === UserRole.ADMIN || newRole === UserRole.SUPER_ADMIN) {
      setDemoUser(1)
    } else {
      setDemoUser(0)
    }
  }

  const setDemoUser = (index: number) => {
    const prof = SEED_PROFILES[index % SEED_PROFILES.length]
    setCurrentUser({
      uid: prof.id,
      email: prof.email,
      displayName: prof.fullName,
      photoURL: prof.photoURL
    })
    setUserProfile(prof)
    setRole(prof.role || (index === 1 ? UserRole.ADMIN : index === 2 ? UserRole.SUPER_ADMIN : UserRole.STUDENT))
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, prof.id)
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
        googleSignIn,
        updateUserProfile,
        switchRole,
        setDemoUser
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
