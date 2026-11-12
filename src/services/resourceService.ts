import {
  collection, getDocs, addDoc,
  query, where, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import type { Resource } from '@/types'
import { SEED_RESOURCES } from '@/lib/mockData'

const COL = 'resources'
const STORAGE_KEY = 'campusconnect_resources'

function getLocalStore(): Resource[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_RESOURCES))
      return SEED_RESOURCES
    }
    const parsed = JSON.parse(raw)
    return parsed.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }))
  } catch {
    return SEED_RESOURCES
  }
}

export async function getResources(category?: string): Promise<Resource[]> {
  if (isFirebaseConfigured && db) {
    let q = query(collection(db, COL), orderBy('createdAt', 'desc'))
    if (category) {
      q = query(collection(db, COL), where('category', '==', category), orderBy('createdAt', 'desc'))
    }
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Resource))
  }
  const all = getLocalStore()
  if (!category || category === 'All') return all
  return all.filter(r => r.category.toLowerCase() === category.toLowerCase())
}

export async function createResource(data: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, COL), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
  const id = `res-${Date.now()}`
  const newR: Resource = {
    ...data,
    id,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const all = getLocalStore()
  all.unshift(newR)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return id
}
