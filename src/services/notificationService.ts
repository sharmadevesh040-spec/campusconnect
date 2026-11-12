import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import type { AppNotification } from '@/types'
import { SEED_NOTIFICATIONS } from '@/lib/mockData'

const COL = 'notifications'
const STORAGE_KEY = 'campusconnect_notifications'

function getLocalStore(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_NOTIFICATIONS))
      return SEED_NOTIFICATIONS
    }
    const parsed = JSON.parse(raw)
    return parsed.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt)
    }))
  } catch {
    return SEED_NOTIFICATIONS
  }
}

function saveLocalStore(items: AppNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Failed to save notifications', e)
  }
}

function fromFirestore(data: Record<string, unknown>): AppNotification {
  return {
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt as string),
  } as AppNotification
}

export async function getNotifications(uid: string): Promise<AppNotification[]> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, COL), where('userId', '==', uid), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }))
  }
  const all = getLocalStore()
  return all.filter(n => n.userId === uid || n.userId === 'student-1')
}

export async function markNotificationRead(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COL, id), { isRead: true })
    return
  }
  const all = getLocalStore()
  const n = all.find(item => item.id === id)
  if (n) {
    n.isRead = true
    saveLocalStore(all)
  }
}

export async function markAllNotificationsRead(uid: string): Promise<void> {
  const all = getLocalStore()
  all.forEach(n => {
    if (n.userId === uid || n.userId === 'student-1') {
      n.isRead = true
    }
  })
  saveLocalStore(all)
}

export async function createNotification(data: Omit<AppNotification, 'id' | 'createdAt'>): Promise<string> {
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, COL), {
      ...data,
      createdAt: serverTimestamp(),
    })
    return ref.id
  }
  const id = `notif-${Date.now()}`
  const newN: AppNotification = {
    ...data,
    id,
    createdAt: new Date()
  }
  const all = getLocalStore()
  saveLocalStore([newN, ...all])
  return id
}

export async function deleteNotification(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, COL, id))
    return
  }
  const all = getLocalStore()
  saveLocalStore(all.filter(n => n.id !== id))
}

export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  const perm = await Notification.requestPermission()
  return perm === 'granted'
}
