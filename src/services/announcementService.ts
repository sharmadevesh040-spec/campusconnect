import { apiRequest } from './api'
import type { Announcement } from '@/types'
import { AnnouncementCategory, AnnouncementPriority } from '@/types/announcement'

const CACHE_KEY = 'campusconnect_announcements_cache'

function mapAnn(item: any): Announcement {
  return {
    id: item.id,
    title: item.title,
    content: item.message || item.content,
    category: (item.category as AnnouncementCategory) || AnnouncementCategory.GENERAL,
    priority: (item.priority as AnnouncementPriority) || AnnouncementPriority.NORMAL,
    isImportant: Boolean(item.is_important ?? item.isImportant),
    authorName: 'Program Operations',
    authorRole: 'Administrator',
    readBy: [],
    createdAt: new Date(item.publish_date || item.created_at || Date.now()),
    updatedAt: new Date(item.publish_date || item.created_at || Date.now())
  }
}

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const list = await apiRequest<any[]>('/api/student/announcements')
    const mapped = list.map(mapAnn)
    localStorage.setItem(CACHE_KEY, JSON.stringify(mapped))
    return mapped
  } catch {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) return JSON.parse(cached)
    return []
  }
}

export async function createAnnouncement(data: any): Promise<string> {
  const res = await apiRequest<any>('/api/admin/announcements', {
    method: 'POST',
    body: JSON.stringify({
      title: data.title,
      message: data.content,
      category: data.category,
      priority: data.priority,
      isImportant: data.isImportant
    })
  })
  return res.id
}

export async function markRead(id: string, uid?: string): Promise<void> {
  // Handled client-side / cache
}

export async function markAnnouncementRead(id: string, uid?: string): Promise<void> {
  await markRead(id, uid)
}

export async function markAllAnnouncementsRead(uid?: string): Promise<void> {
  // Handled client-side / cache
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await apiRequest(`/api/admin/announcements/${id}`, { method: 'DELETE' })
}
