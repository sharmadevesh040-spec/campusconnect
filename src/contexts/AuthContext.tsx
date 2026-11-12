import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '@/lib/firebase'
import type { Profile } from '@/types'
import { UserRole } from '@/types'
import { SEED_PROFILES } from '@/lib/mockData'

interface AuthContextType {
  currentUser: FirebaseUser | { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null
  userProfile: Profile | null
  loading: boolean
  role: UserRole | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
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

  // Initialize stored profiles in localStorage if not set
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PROFILES_KEY)
      if (!stored) {
        localStorage.setItem(LOCAL_STORAGE_PROFILES_KEY, JSON.stringify(SEED_PROFILES))
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user)
        if (user) {
          try {
            const docRef = doc(db, 'profiles', user.uid)
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
              const data = docSnap.data() as Profile
              setUserProfile(data)
              setRole(data.role as UserRole || UserRole.STUDENT)
            } else {
              // fallback initial
              const defaultP: Profile = {
                ...SEED_PROFILES[0],
                id: user.uid,
                userId: user.uid,
                fullName: user.displayName || 'Ambassador Student',
                email: user.email || 'student@university.edu',
                role: UserRole.STUDENT
              }
              setUserProfile(defaultP)
              setRole(UserRole.STUDENT)
            }
          } catch (e) {
            console.error('Failed to load user profile from firestore', e)
          }
        } else {
          setUserProfile(null)
          setRole(null)
        }
        setLoading(false)
      })
      return () => unsubscribe()
    } else {
      // Mock / Development Demo Mode
      try {
        const savedId = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY)
        const storedProfiles: Profile[] = JSON.parse(
          localStorage.getItem(LOCAL_STORAGE_PROFILES_KEY) || JSON.stringify(SEED_PROFILES)
        )
        const matched = storedProfiles.find(p => p.id === savedId) || storedProfiles[0]

        setUserProfile(matched)
        setRole(matched.userId.includes('admin') ? UserRole.ADMIN : UserRole.STUDENT)
        setCurrentUser({
          uid: matched.userId,
          email: matched.email,
          displayName: matched.fullName,
          photoURL: matched.photoURL
        })
      } catch (err) {
        console.error('Error loading mock user:', err)
        setUserProfile(SEED_PROFILES[0])
        setRole(UserRole.STUDENT)
        setCurrentUser({
          uid: SEED_PROFILES[0].userId,
          email: SEED_PROFILES[0].email,
          displayName: SEED_PROFILES[0].fullName,
          photoURL: SEED_PROFILES[0].photoURL
        })
      }
      setLoading(false)
    }
  }, [])

  async function login(email: string, password: string) {
    if (isFirebaseConfigured && auth) {
      await signInWithEmailAndPassword(auth, email, password)
    } else {
      // Mock login
      const storedProfiles: Profile[] = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_PROFILES_KEY) || JSON.stringify(SEED_PROFILES)
      )
      const existing = storedProfiles.find(p => p.email.toLowerCase() === email.toLowerCase()) || storedProfiles[0]
      setUserProfile(existing)
      setRole(existing.userId.includes('admin') ? UserRole.ADMIN : UserRole.STUDENT)
      setCurrentUser({
        uid: existing.userId,
        email: existing.email,
        displayName: existing.fullName,
        photoURL: existing.photoURL
      })
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, existing.id)
    }
  }

  async function register(email: string, password: string, name: string) {
    if (isFirebaseConfigured && auth) {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await updateFirebaseProfile(user, { displayName: name })
      const newP: Profile = {
        id: user.uid,
        userId: user.uid,
        fullName: name,
        email,
        phone: '',
        university: '',
        college: '',
        course: '',
        branch: '',
        year: 1,
        semester: 1,
        studentId: `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        photoURL: user.photoURL || '',
        skills: [],
        bio: '',
        isApproved: false,
        completionPercentage: 20,
        role: UserRole.STUDENT,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await setDoc(doc(db, 'profiles', user.uid), {
        ...newP,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      setUserProfile(newP)
      setRole(UserRole.STUDENT)
    } else {
      const newId = `student-${Date.now()}`
      const newP: Profile = {
        id: newId,
        userId: newId,
        fullName: name,
        email,
        phone: '',
        university: 'University Member',
        college: '',
        course: '',
        branch: '',
        year: 1,
        semester: 1,
        studentId: `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        photoURL: '',
        skills: ['Student Leader'],
        bio: 'New student ambassador member.',
        isApproved: true,
        completionPercentage: 35,
        role: UserRole.STUDENT,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const storedProfiles: Profile[] = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_PROFILES_KEY) || JSON.stringify(SEED_PROFILES)
      )
      storedProfiles.push(newP)
      localStorage.setItem(LOCAL_STORAGE_PROFILES_KEY, JSON.stringify(storedProfiles))
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, newId)
      setUserProfile(newP)
      setRole(UserRole.STUDENT)
      setCurrentUser({
        uid: newId,
        email,
        displayName: name,
        photoURL: null
      })
    }
  }

  async function logout() {
    if (isFirebaseConfigured && auth) {
      await signOut(auth)
    }
    setCurrentUser(null)
    setUserProfile(null)
    setRole(null)
    localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY)
  }

  async function resetPassword(email: string) {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email)
    }
  }

  async function googleSignIn() {
    if (isFirebaseConfigured && auth) {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } else {
      // Mock Google sign-in
      await login(SEED_PROFILES[0].email, 'password123')
    }
  }

  async function updateUserProfile(data: Partial<Profile>) {
    if (!userProfile) return
    const updated: Profile = {
      ...userProfile,
      ...data,
      updatedAt: new Date()
    }
    setUserProfile(updated)

    if (isFirebaseConfigured && db && auth?.currentUser) {
      await setDoc(doc(db, 'profiles', auth.currentUser.uid), updated, { merge: true })
    } else {
      const storedProfiles: Profile[] = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_PROFILES_KEY) || JSON.stringify(SEED_PROFILES)
      )
      const idx = storedProfiles.findIndex(p => p.id === updated.id)
      if (idx !== -1) {
        storedProfiles[idx] = updated
      } else {
        storedProfiles.push(updated)
      }
      localStorage.setItem(LOCAL_STORAGE_PROFILES_KEY, JSON.stringify(storedProfiles))
    }
  }

  function switchRole(newRole: UserRole) {
    setRole(newRole)
    if (newRole === UserRole.ADMIN || newRole === UserRole.SUPER_ADMIN) {
      const adminProfile = SEED_PROFILES.find(p => p.userId.includes('admin')) || SEED_PROFILES[1]
      setUserProfile(adminProfile)
      setCurrentUser({
        uid: adminProfile.userId,
        email: adminProfile.email,
        displayName: adminProfile.fullName,
        photoURL: adminProfile.photoURL
      })
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, adminProfile.id)
    } else {
      const studentProfile = SEED_PROFILES[0]
      setUserProfile(studentProfile)
      setCurrentUser({
        uid: studentProfile.userId,
        email: studentProfile.email,
        displayName: studentProfile.fullName,
        photoURL: studentProfile.photoURL
      })
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, studentProfile.id)
    }
  }

  function setDemoUser(index: number) {
    const p = SEED_PROFILES[index] || SEED_PROFILES[0]
    setUserProfile(p)
    setRole(p.userId.includes('admin') ? UserRole.ADMIN : UserRole.STUDENT)
    setCurrentUser({
      uid: p.userId,
      email: p.email,
      displayName: p.fullName,
      photoURL: p.photoURL
    })
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, p.id)
  }

  const value: AuthContextType = {
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
