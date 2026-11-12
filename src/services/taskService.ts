import { apiRequest } from './api'
import type { Task } from '@/types'
import { TaskStatus, TaskPriority } from '@/types/task'

const CACHE_KEY = 'campusconnect_tasks_cache'

function mapTask(item: any): Task {
  return {
    id: item.id,
    studentId: item.student_id || item.studentId,
    title: item.title,
    description: item.description || '',
    deadline: new Date(item.deadline),
    priority: (item.priority as TaskPriority) || TaskPriority.MEDIUM,
    status: (item.status as TaskStatus) || TaskStatus.PENDING,
    attachmentURL: item.attachmentURL || item.attachment_url || '',
    createdAt: new Date(item.created_at || Date.now()),
    updatedAt: new Date(item.updated_at || Date.now())
  }
}

export async function getTasks(studentId?: string): Promise<Task[]> {
  try {
    const list = await apiRequest<any[]>('/api/student/tasks')
    const mapped = list.map(mapTask)
    localStorage.setItem(CACHE_KEY, JSON.stringify(mapped))
    return mapped
  } catch {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) return JSON.parse(cached)
    return []
  }
}

export async function getTasksByStudent(studentId: string): Promise<Task[]> {
  return getTasks(studentId)
}

export async function getAllTasks(): Promise<Task[]> {
  try {
    const list = await apiRequest<any[]>('/api/admin/tasks')
    return list.map(mapTask)
  } catch {
    return []
  }
}

export async function createTask(data: any): Promise<string> {
  const res = await apiRequest<any>('/api/admin/tasks', {
    method: 'POST',
    body: JSON.stringify({
      studentId: data.studentId,
      title: data.title,
      description: data.description,
      deadline: typeof data.deadline === 'string' ? data.deadline : data.deadline.toISOString().split('T')[0],
      priority: data.priority
    })
  })
  return res.id
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  await apiRequest(`/api/student/tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  })
}

export async function deleteTask(id: string): Promise<void> {
  await apiRequest(`/api/admin/tasks/${id}`, { method: 'DELETE' })
}
