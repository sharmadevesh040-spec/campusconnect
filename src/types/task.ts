export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue'
}

export interface Task {
  id: string
  studentId: string
  title: string
  description: string
  deadline: Date
  status: TaskStatus
  priority: 'low' | 'medium' | 'high'
  attachmentURL: string
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}
