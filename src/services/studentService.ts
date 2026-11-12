import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import type { Profile } from '@/types'
import { SEED_PROFILES } from '@/lib/mockData'

const COL = 'profiles'
const STORAGE_KEY = 'campusconnect_profiles_db'

function getLocalStore(): Profile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PROFILES))
      return SEED_PROFILES
    }
    const parsed = JSON.parse(raw)
    return parsed.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }))
  } catch {
    return SEED_PROFILES
  }
}

function saveLocalStore(items: Profile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Failed to save profiles to localStorage', e)
  }
}

export async function getProfile(uid: string): Promise<Profile | null> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, COL, uid))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as Profile
  }
  const all = getLocalStore()
  return all.find(p => p.userId === uid || p.id === uid) || all[0] || null
}

export async function updateProfile(uid: string, data: Partial<Profile>): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COL, uid), {
      ...data,
      updatedAt: serverTimestamp(),
    })
    return
  }
  const all = getLocalStore()
  const idx = all.findIndex(p => p.userId === uid || p.id === uid)
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...data, updatedAt: new Date() }
    saveLocalStore(all)
  }
}

export async function getAllStudents(): Promise<Profile[]> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Profile))
  }
  return getLocalStore()
}

export async function approveStudent(uid: string): Promise<void> {
  await updateProfile(uid, { isApproved: true })
}

export async function disableStudent(uid: string): Promise<void> {
  await updateProfile(uid, { isApproved: false })
}
