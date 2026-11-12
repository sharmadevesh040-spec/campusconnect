import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, MapPin, Video, Users } from 'lucide-react'
import { format } from 'date-fns'
import { useEvents } from '@/hooks/useEvents'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { EventStatus } from '@/types/event'
import { toast } from 'sonner'
import { useState } from 'react'
import { createICSEvent } from '@/lib/utils'

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { events, loading, registerForEvent, registrations } = useEvents()
  const [registering, setRegistering] = useState(false)
  const event = events.find(e => e.id === id)

  if (loading) return <LoadingSpinner fullScreen />
  if (!event) return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <EmptyState emoji="🎉" title="Event not found" action={<Button onClick={() => navigate('/events')} leftIcon={<ArrowLeft className="w-4 h-4" />} variant="outline">Back to Events</Button>} />
    </div>
  )

  const isRegistered = registrations.includes(event.id)
  const canRegister = event.status === EventStatus.OPEN || event.status === EventStatus.ALMOST_FULL

  const handleRegister = async () => {
    setRegistering(true)
    try {
      await registerForEvent(event.id)
      toast.success(`Registered for ${event.title}! 🎉`)
    } catch {
      toast.error('Failed to register.')
    } finally {
      setRegistering(false)
    }
  }

  const addToCalendar = () => {
    const ics = createICSEvent({
      title: event.title,
      description: event.description,
      location: event.venue || event.meetingLink || 'Online',
      startDate: new Date(event.date),
      endDate: new Date(event.endDate || event.date)
    })
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Calendar event (.ics) downloaded!')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/events')} aria-label="Back"><ArrowLeft className="w-5 h-5" /></Button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex-1 truncate">{event.title}</h1>
      </div>

      <Card className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center"><Calendar className="w-4 h-4 text-blue-500" /></div>
            <div><p className="text-xs text-slate-400">Date</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{format(event.date, 'dd MMM yyyy')}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center"><Clock className="w-4 h-4 text-blue-500" /></div>
            <div><p className="text-xs text-slate-400">Time</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{event.time}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              {event.meetingLink ? <Video className="w-4 h-4 text-blue-500" /> : <MapPin className="w-4 h-4 text-blue-500" />}
            </div>
            <div><p className="text-xs text-slate-400">Venue</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{event.venue || 'Online'}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center"><Users className="w-4 h-4 text-blue-500" /></div>
            <div><p className="text-xs text-slate-400">Registration</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{event.registeredCount} / {event.maxParticipants}</p></div>
          </div>
        </div>

        {event.description && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">About this Event</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        {isRegistered ? (
          <>
            <Badge variant="success" className="px-4 py-2 text-sm">✓ You are registered for this event</Badge>
            {event.meetingLink && (
              <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full" leftIcon={<Video className="w-4 h-4" />}>Join Virtual Event</Button>
              </a>
            )}
          </>
        ) : canRegister ? (
          <Button className="flex-1" loading={registering} onClick={handleRegister}>Register for Event</Button>
        ) : (
          <Button disabled className="flex-1">{event.status === EventStatus.CLOSED ? 'Registration Closed' : 'Event Completed'}</Button>
        )}
        <Button variant="outline" onClick={addToCalendar} leftIcon={<Calendar className="w-4 h-4" />}>Add to Calendar</Button>
      </div>
    </div>
  )
}
