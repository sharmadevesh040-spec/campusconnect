import { apiRequest } from './api'
import type { Event, EventRegistration } from '@/types'
import { EventStatus } from '@/types/event'
import { SEED_EVENTS } from '@/lib/mockData'

const CACHE_KEY = 'campusconnect_events_cache'

function mapEvent(item: any): Event {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    date: new Date(item.date),
    time: item.time,
    venue: item.venue,
    meetingLink: item.meeting_link || item.meetingLink,
    organizer: item.organizer,
    registrationDeadline: new Date(item.registration_deadline || item.registrationDeadline || item.date),
    registeredCount: item.attendeeCount || item.registeredCount || 0,
    maxCapacity: item.max_participants || item.maxCapacity || 100,
    maxParticipants: item.max_participants || item.maxCapacity || 100,
    isRegistered: Boolean(item.isRegistered),
    status: (item.status as EventStatus) || EventStatus.OPEN,
    bannerURL: item.banner_url || item.bannerURL,
    imageURL: item.banner_url || item.bannerURL,
    createdAt: new Date(item.created_at || Date.now()),
    updatedAt: new Date(item.updated_at || Date.now())
  }
}

export async function getEvents(): Promise<Event[]> {
  try {
    const list = await apiRequest<any[]>('/api/student/events')
    const mapped = list.map(mapEvent)
    localStorage.setItem(CACHE_KEY, JSON.stringify(mapped))
    return mapped
  } catch {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) return JSON.parse(cached)
    return SEED_EVENTS
  }
}

export async function getAllEvents(): Promise<Event[]> {
  try {
    const list = await apiRequest<any[]>('/api/admin/events')
    return list.map(mapEvent)
  } catch {
    return SEED_EVENTS
  }
}

export async function getEvent(id: string): Promise<Event | null> {
  const all = await getEvents()
  return all.find(e => e.id === id) || null
}

export async function getRegistrations(studentId: string): Promise<EventRegistration[]> {
  const events = await getEvents()
  return events.filter(e => e.isRegistered).map(e => ({
    id: 'reg-' + e.id,
    eventId: e.id,
    studentId,
    registeredAt: new Date(),
    status: 'Registered'
  }))
}

export async function registerForEvent(eventId: string, studentId: string): Promise<void> {
  await apiRequest(`/api/student/events/${eventId}/register`, { method: 'POST' })
}

export async function cancelRegistration(eventId: string, studentId: string): Promise<void> {
  await apiRequest(`/api/student/events/${eventId}/cancel`, { method: 'POST' })
}

export async function createEvent(data: any): Promise<string> {
  const res = await apiRequest<any>('/api/admin/events', {
    method: 'POST',
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      date: typeof data.date === 'string' ? data.date : data.date.toISOString().split('T')[0],
      time: data.time,
      venue: data.venue,
      meetingLink: data.meetingLink,
      maxParticipants: data.maxCapacity || data.maxParticipants,
      organizer: data.organizer,
      bannerUrl: data.bannerURL || data.imageURL,
      registrationDeadline: data.registrationDeadline ? (typeof data.registrationDeadline === 'string' ? data.registrationDeadline : data.registrationDeadline.toISOString()) : undefined
    })
  })
  return res.id
}

export async function updateEvent(id: string, data: any): Promise<void> {
  await apiRequest(`/api/admin/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteEvent(id: string): Promise<void> {
  await apiRequest(`/api/admin/events/${id}`, { method: 'DELETE' })
}

export function generateEventICS(event: Event): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const d = new Date(event.date)
  const dt = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T160000Z`
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusConnect//Events//EN',
    'BEGIN:VEVENT',
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    `LOCATION:${event.venue}`,
    `DTSTART:${dt}`,
    `DTEND:${dt}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
}
