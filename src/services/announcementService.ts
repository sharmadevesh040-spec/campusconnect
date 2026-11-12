import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import type { Announcement } from '@/types'
import { SEED_ANNOUNCEMENTS } from '@/lib/mockData'

const COL = 'announcements'
const STORAGE_KEY = 'campusconnect_announcements'

function getLocalStore(): Announcement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ANNOUNCEMENTS))
      return SEED_ANNOUNCEMENTS
    }
    const parsed = JSON.parse(raw)
    return parsed.map((item: any) => ({
      ...item,
      publishedAt: new Date(item.publishedAt),
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }))
  } catch {
    return SEED_ANNOUNCEMENTS
  }
}

function saveLocalStore(items: Announcement[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Failed to save announcements', e)
  }
}

function fromFirestore(data: Record<string, unknown>): Announcement {
  return {
    ...data,
    publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate() : new Date(data.publishedAt as string),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt as string),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt as string),
  } as Announcement
}

export async function getAnnouncements(): Promise<Announcement[]> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, COL), orderBy('publishedAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }))
  }
  return getLocalStore()
}

export async function markAnnouncementRead(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COL, id), { isRead: true, updatedAt: serverTimestamp() })
    return
  }
  const all = getLocalStore()
  const a = all.find(item => item.id === id)
  if (a) {
    a.isRead = true
    saveLocalStore(all)
  }
}

export async function markAllAnnouncementsRead(): Promise<void> {
  const all = getLocalStore()
  all.forEach(a => { a.isRead = true })
  saveLocalStore(all)
}

export async function createAnnouncement(data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'isRead'>): Promise<string> {
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, COL), {
      ...data,
      isRead: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
  const id = `ann-${Date.now()}`
  const newAnn: Announcement = {
    ...data,
    id,
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const all = getLocalStore()
  saveLocalStore([newAnn, ...all])
  return id
}

export async function deleteAnnouncement(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, COL, id))
    return
  }
  const all = getLocalStore()
  saveLocalStore(all.filter(a => a.id !== id))
}
