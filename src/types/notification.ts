export enum NotificationType {
  INTERVIEW_REMINDER = 'interview_reminder',
  EVENT_REMINDER = 'event_reminder',
  NEW_CERTIFICATE = 'new_certificate',
  NEW_ANNOUNCEMENT = 'new_announcement',
  TASK_DEADLINE = 'task_deadline',
  SCHEDULE_CHANGE = 'schedule_change',
  SELECTION_UPDATE = 'selection_update',
  INTERVIEW = 'interview',
  EVENT = 'event',
  CERTIFICATE = 'certificate',
  ANNOUNCEMENT = 'announcement',
  TASK = 'task',
  SYSTEM = 'system'
}

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType | string
  title: string
  message?: string
  body?: string
  link?: string
  isRead?: boolean
  read?: boolean
  relatedId?: string
  relatedType?: string
  createdAt: Date
}

export type Notification = AppNotification
