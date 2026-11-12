import { useState, useEffect, useCallback } from 'react'
import { getAnnouncements, markAnnouncementRead, markAllAnnouncementsRead } from '@/services/announcementService'
import type { Announcement } from '@/types'

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAnnouncements()
      setAnnouncements(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const markRead = async (id: string) => {
    await markAnnouncementRead(id)
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a))
  }

  const markAllRead = async () => {
    await markAllAnnouncementsRead()
    setAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })))
  }

  return { announcements, loading, error, markRead, markAllRead, refetch: fetchAnnouncements }
}
