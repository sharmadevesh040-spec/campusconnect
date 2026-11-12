import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import type { Task } from '@/types'
import { TaskStatus } from '@/types'
import { SEED_TASKS } from '@/lib/mockData'

const COL = 'tasks'
const STORAGE_KEY = 'campusconnect_tasks'

function getLocalStore(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TASKS))
      return SEED_TASKS
    }
    const parsed = JSON.parse(raw)
    return parsed.map((item: any) => ({
      ...item,
      deadline: new Date(item.deadline),
      completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }))
  } catch {
    return SEED_TASKS
  }
}

function saveLocalStore(items: Task[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Failed to save tasks', e)
  }
}

function fromFirestore(data: Record<string, unknown>): Task {
  return {
    ...data,
    deadline: data.deadline instanceof Timestamp ? data.deadline.toDate() : new Date(data.deadline as string),
    completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt ? new Date(data.completedAt as string) : undefined,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt as string),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt as string),
  } as Task
}

export async function getTasksByStudent(uid: string): Promise<Task[]> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, COL), where('studentId', '==', uid), orderBy('deadline', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }))
  }
  const all = getLocalStore()
  return all.filter(t => t.studentId === uid || t.studentId === 'student-1')
}

export async function getAllTasks(): Promise<Task[]> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, COL), orderBy('deadline', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }))
  }
  return getLocalStore()
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  if (isFirebaseConfigured && db) {
    if (status === TaskStatus.COMPLETED) {
      await updateDoc(doc(db, COL, id), { status, updatedAt: serverTimestamp(), completedAt: serverTimestamp() })
    } else {
      await updateDoc(doc(db, COL, id), { status, updatedAt: serverTimestamp() })
    }
    return
  }
  const all = getLocalStore()
  const idx = all.findIndex(t => t.id === id)
  if (idx !== -1) {
    all[idx].status = status
    all[idx].updatedAt = new Date()
    if (status === TaskStatus.COMPLETED) {
      all[idx].completedAt = new Date()
    } else {
      all[idx].completedAt = undefined
    }
    saveLocalStore(all)
  }
}

export async function createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, COL), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
  const id = `task-${Date.now()}`
  const newTask: Task = {
    ...data,
    id,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const all = getLocalStore()
  saveLocalStore([newTask, ...all])
  return id
}

export async function deleteTask(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, COL, id))
    return
  }
  const all = getLocalStore()
  saveLocalStore(all.filter(t => t.id !== id))
}
