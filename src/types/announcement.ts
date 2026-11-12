export enum AnnouncementPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Announcement {
  id: string
  title: string
  content: string
  priority: AnnouncementPriority
  category: string
  attachmentURL: string
  isRead: boolean
  publishedAt: Date
  scheduledAt?: Date
  expiresAt?: Date
  targetRoles: string[]
  createdAt: Date
  updatedAt: Date
}
