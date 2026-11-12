export enum AnnouncementPriority {
  LOW = 'Low',
  NORMAL = 'Normal',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export enum AnnouncementCategory {
  IMPORTANT = 'Important',
  INTERVIEW = 'Interview',
  EVENT = 'Event',
  CERTIFICATE = 'Certificate',
  GENERAL = 'General',
  DEADLINE = 'Deadline'
}

export interface Announcement {
  id: string
  title: string
  content: string
  priority: AnnouncementPriority | 'low' | 'normal' | 'medium' | 'high' | 'urgent'
  category: AnnouncementCategory | string
  attachmentURL?: string
  isRead?: boolean
  isImportant?: boolean
  authorName?: string
  authorRole?: string
  readBy?: string[]
  publishedAt?: Date
  scheduledAt?: Date
  expiresAt?: Date
  targetRoles?: string[]
  createdAt: Date
  updatedAt: Date
}
