export enum NotificationType {
  INTERVIEW_REMINDER = 'interview_reminder',
  EVENT_REMINDER = 'event_reminder',
  NEW_CERTIFICATE = 'new_certificate',
  NEW_ANNOUNCEMENT = 'new_announcement',
  TASK_DEADLINE = 'task_deadline',
  SCHEDULE_CHANGE = 'schedule_change',
  SELECTION_UPDATE = 'selection_update',
  SYSTEM = 'system'
}

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  relatedId: string
  relatedType: string
  createdAt: Date
}
