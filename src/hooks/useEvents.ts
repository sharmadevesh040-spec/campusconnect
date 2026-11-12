import { useState, useEffect, useCallback } from 'react'
import { getEvents, registerForEvent as registerEventService, getRegistrations } from '@/services/eventService'
import { useAuth } from './useAuth'
import type { Event } from '@/types'

export function useEvents() {
  const { currentUser } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [registrations, setRegistrations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getEvents()
      setEvents(data)
      if (currentUser?.uid) {
        const regs = await getRegistrations(currentUser.uid)
        setRegistrations(regs)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const registerForEvent = async (eventId: string) => {
    const uid = currentUser?.uid || 'student-1'
    await registerEventService(eventId, uid)
    setRegistrations(prev => [...prev, eventId])
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, registeredCount: (e.registeredCount || 0) + 1 } : e))
  }

  return { events, registrations, loading, error, registerForEvent, refetch: fetchEvents }
}
