export enum TaskStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  OVERDUE = 'Overdue'
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export interface Task {
  id: string
  studentId: string
  title: string
  description: string
  deadline: Date
  status: TaskStatus
  priority: TaskPriority | 'low' | 'medium' | 'high' | 'urgent'
  attachmentURL?: string
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}
