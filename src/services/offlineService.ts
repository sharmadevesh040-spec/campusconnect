import { openDB, type IDBPDatabase } from 'idb'
import type { Interview, Task, Certificate, Announcement } from '@/types'

const DB_NAME = 'campusconnect-offline'
const DB_VERSION = 1

type StoreNames = 'interviews' | 'tasks' | 'certificates' | 'announcements'

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('interviews')) db.createObjectStore('interviews', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('tasks')) db.createObjectStore('tasks', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('certificates')) db.createObjectStore('certificates', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('announcements')) db.createObjectStore('announcements', { keyPath: 'id' })
    },
  })
}

async function saveToStore<T>(store: StoreNames, items: T[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(store, 'readwrite')
  for (const item of items) await tx.store.put(item)
  await tx.done
}

async function getFromStore<T>(store: StoreNames): Promise<T[]> {
  const db = await getDB()
  return db.getAll(store) as Promise<T[]>
}

export async function saveInterviewsOffline(items: Interview[]): Promise<void> {
  await saveToStore('interviews', items)
}
export async function getOfflineInterviews(): Promise<Interview[]> {
  return getFromStore<Interview>('interviews')
}

export async function saveTasksOffline(items: Task[]): Promise<void> {
  await saveToStore('tasks', items)
}
export async function getOfflineTasks(): Promise<Task[]> {
  return getFromStore<Task>('tasks')
}

export async function saveCertificatesOffline(items: Certificate[]): Promise<void> {
  await saveToStore('certificates', items)
}
export async function getOfflineCertificates(): Promise<Certificate[]> {
  return getFromStore<Certificate>('certificates')
}

export async function saveAnnouncementsOffline(items: Announcement[]): Promise<void> {
  await saveToStore('announcements', items)
}
export async function getOfflineAnnouncements(): Promise<Announcement[]> {
  return getFromStore<Announcement>('announcements')
}
