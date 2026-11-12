import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, orderBy, serverTimestamp, Timestamp, where
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import type { Event, EventRegistration } from '@/types'
import { EventStatus } from '@/types'
import { SEED_EVENTS } from '@/lib/mockData'

const COL = 'events'
const REG_COL = 'eventRegistrations'
const STORAGE_KEY = 'campusconnect_events'
const REG_STORAGE_KEY = 'campusconnect_event_registrations'

function getLocalStore(): Event[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_EVENTS))
      return SEED_EVENTS
    }
    const parsed = JSON.parse(raw)
    return parsed.map((item: any) => ({
      ...item,
      date: new Date(item.date),
      endDate: new Date(item.endDate),
      registrationDeadline: new Date(item.registrationDeadline),
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }))
  } catch {
    return SEED_EVENTS
  }
}

function saveLocalStore(items: Event[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Failed to save events to localStorage', e)
  }
}

function getLocalRegistrations(): string[] {
  try {
    const raw = localStorage.getItem(REG_STORAGE_KEY)
    return raw ? JSON.parse(raw) : ['ev-1'] // default enrolled in summit
  } catch {
    return ['ev-1']
  }
}

function saveLocalRegistrations(ids: string[]) {
  try {
    localStorage.setItem(REG_STORAGE_KEY, JSON.stringify(ids))
  } catch (e) {
    console.error('Failed to save registrations', e)
  }
}

function fromFirestore(data: Record<string, unknown>): Event {
  return {
    ...data,
    date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date as string),
    endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : new Date(data.endDate as string),
    registrationDeadline: data.registrationDeadline instanceof Timestamp ? data.registrationDeadline.toDate() : new Date(data.registrationDeadline as string),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt as string),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt as string),
  } as Event
}

export async function getEvents(): Promise<Event[]> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, COL), orderBy('date', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }))
  }
  return getLocalStore()
}

export async function getEvent(id: string): Promise<Event | null> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, COL, id))
    if (!snap.exists()) return null
    return fromFirestore({ id: snap.id, ...snap.data() })
  }
  return getLocalStore().find(e => e.id === id) || null
}

export async function createEvent(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'registeredCount'>): Promise<string> {
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, COL), {
      ...data,
      registeredCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
  const id = `ev-${Date.now()}`
  const newEv: Event = {
    ...data,
    id,
    registeredCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const all = getLocalStore()
  saveLocalStore([newEv, ...all])
  return id
}

export async function updateEvent(id: string, data: Partial<Event>): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() })
    return
  }
  const all = getLocalStore()
  const idx = all.findIndex(e => e.id === id)
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...data, updatedAt: new Date() }
    saveLocalStore(all)
  }
}

export async function deleteEvent(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    // Delete from firestore
    const { deleteDoc } = await import('firebase/firestore')
    await deleteDoc(doc(db, COL, id))
    return
  }
  const all = getLocalStore()
  saveLocalStore(all.filter(e => e.id !== id))
}

export async function registerForEvent(eventId: string, studentId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await addDoc(collection(db, REG_COL), {
      eventId,
      studentId,
      status: 'registered',
      registeredAt: serverTimestamp(),
    })
    const evRef = doc(db, COL, eventId)
    const evSnap = await getDoc(evRef)
    if (evSnap.exists()) {
      const current = evSnap.data().registeredCount || 0
      await updateDoc(evRef, { registeredCount: current + 1 })
    }
    return
  }
  const registered = getLocalRegistrations()
  if (!registered.includes(eventId)) {
    registered.push(eventId)
    saveLocalRegistrations(registered)

    const all = getLocalStore()
    const ev = all.find(e => e.id === eventId)
    if (ev) {
      ev.registeredCount = (ev.registeredCount || 0) + 1
      if (ev.registeredCount >= ev.maxParticipants) {
        ev.status = EventStatus.CLOSED
      } else if (ev.registeredCount >= ev.maxParticipants * 0.9) {
        ev.status = EventStatus.ALMOST_FULL
      }
      saveLocalStore(all)
    }
  }
}

export async function getRegistrations(studentId: string): Promise<string[]> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, REG_COL), where('studentId', '==', studentId))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data().eventId as string)
  }
  return getLocalRegistrations()
}
