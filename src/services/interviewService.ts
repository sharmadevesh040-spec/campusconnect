import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import type { Interview } from '@/types'
import { SEED_INTERVIEWS } from '@/lib/mockData'

const COL = 'interviews'
const STORAGE_KEY = 'campusconnect_interviews'

function getLocalStore(): Interview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_INTERVIEWS))
      return SEED_INTERVIEWS
    }
    const parsed = JSON.parse(raw)
    return parsed.map((item: any) => ({
      ...item,
      date: new Date(item.date),
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }))
  } catch {
    return SEED_INTERVIEWS
  }
}

function saveLocalStore(items: Interview[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Failed to save interviews to localStorage', e)
  }
}

function fromFirestore(data: Record<string, unknown>): Interview {
  return {
    ...data,
    date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date as string),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt as string),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt as string),
  } as Interview
}

export async function getInterviewsByStudent(uid: string): Promise<Interview[]> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, COL), where('studentId', '==', uid), orderBy('date', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }))
  }
  const all = getLocalStore()
  // in dev mode return relevant or all if student has assignments
  return all.filter(i => i.studentId === uid || i.studentId === 'student-1')
}

export async function getAllInterviews(): Promise<Interview[]> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, COL), orderBy('date', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }))
  }
  return getLocalStore()
}

export async function createInterview(data: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    return ref.id
  }
  const id = `int-${Date.now()}`
  const newInt: Interview = {
    ...data,
    id,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const current = getLocalStore()
  saveLocalStore([newInt, ...current])
  return id
}

export async function updateInterview(id: string, data: Partial<Interview>): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() })
    return
  }
  const current = getLocalStore()
  const idx = current.findIndex(i => i.id === id)
  if (idx !== -1) {
    current[idx] = { ...current[idx], ...data, updatedAt: new Date() }
    saveLocalStore(current)
  }
}

export async function deleteInterview(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, COL, id))
    return
  }
  const current = getLocalStore()
  saveLocalStore(current.filter(i => i.id !== id))
}
