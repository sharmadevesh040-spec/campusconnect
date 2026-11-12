import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { getTasksByStudent, updateTaskStatus } from '@/services/taskService'
import type { Task } from '@/types'
import { TaskStatus } from '@/types/task'

export function useTasks() {
  const { currentUser } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!currentUser) { setLoading(false); return }
    try {
      setLoading(true)
      const data = await getTasksByStudent(currentUser.uid)
      setTasks(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const updateStatus = async (taskId: string, status: TaskStatus) => {
    await updateTaskStatus(taskId, status)
    setTasks(prev => prev.map(t => t.id === taskId ? {
      ...t,
      status,
      completedAt: status === TaskStatus.COMPLETED ? new Date() : undefined
    } : t))
  }

  return { tasks, loading, error, updateStatus, refetch: fetchTasks }
}
