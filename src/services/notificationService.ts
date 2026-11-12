import { apiRequest } from './api'
import type { Notification } from '@/types'
import { NotificationType } from '@/types/notification'
import { SEED_NOTIFICATIONS } from '@/lib/mockData'

const CACHE_KEY = 'campusconnect_notifications_cache'

function mapNote(item: any): Notification {
  return {
    id: item.id,
    userId: item.user_id || item.userId,
    title: item.title,
    body: item.message || item.body,
    message: item.message || item.body,
    type: (item.type as NotificationType) || NotificationType.SYSTEM,
    link: item.link,
    read: Boolean(item.is_read ?? item.read),
    isRead: Boolean(item.is_read ?? item.read),
    relatedId: item.relatedId || '',
    relatedType: item.relatedType || '',
    createdAt: new Date(item.created_at || Date.now())
  }
}

export async function getNotifications(uid?: string): Promise<Notification[]> {
  try {
    const list = await apiRequest<any[]>('/api/student/notifications')
    const mapped = list.map(mapNote)
    localStorage.setItem(CACHE_KEY, JSON.stringify(mapped))
    return mapped
  } catch {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) return JSON.parse(cached)
    return SEED_NOTIFICATIONS
  }
}

export async function createNotification(data: any): Promise<string> {
  return 'note-' + Date.now()
}

export async function markAsRead(id: string): Promise<void> {
  await apiRequest(`/api/student/notifications/${id}/read`, { method: 'PATCH' })
}

export async function markAllAsRead(uid?: string): Promise<void> {
  await apiRequest('/api/student/notifications/read-all', { method: 'PATCH' })
}
