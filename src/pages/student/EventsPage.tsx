import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock, MapPin, Video, Users, Calendar, Download } from 'lucide-react'
import { format } from 'date-fns'
import { useEvents } from '@/hooks/useEvents'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { EventStatus } from '@/types/event'
import { createICSEvent } from '@/lib/utils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  open: 'success', almost_full: 'warning', closed: 'danger', completed: 'default', cancelled: 'danger'
}
const STATUS_LABELS: Record<string, string> = {
  open: 'Open', almost_full: 'Almost Full', closed: 'Closed', completed: 'Completed', cancelled: 'Cancelled'
}

export default function EventsPage() {
  const { events, loading, registerForEvent, registrations } = useEvents()
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [registering, setRegistering] = useState<string | null>(null)

  const now = new Date()
  const filtered = events.filter(e => {
    if (filter === 'upcoming') return e.date >= now
    if (filter === 'past') return e.date < now
    return true
  }).sort((a, b) => filter === 'past' ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime())

  const handleRegister = async (eventId: string, eventTitle: string) => {
    setRegistering(eventId)
    try {
      await registerForEvent(eventId)
      toast.success(`Registered for ${eventTitle}! 🎉`)
    } catch {
      toast.error('Failed to register. Please try again.')
    } finally {
      setRegistering(null)
    }
  }

  const addToCalendar = (event: typeof events[0]) => {
    const ics = createICSEvent({
      title: event.title,
      description: event.description,
      location: event.venue || event.meetingLink || 'Online',
      startDate: new Date(event.date),
      endDate: new Date(event.endDate)
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
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Events</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{events.filter(e => e.date >= now).length} upcoming events</p>
      </div>

      <div className="flex gap-2">
        {(['upcoming', 'past', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all',
              filter === f
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2].map(i => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState emoji="🎉" title={filter === 'past' ? 'No past events' : 'No upcoming events'} description="Events from your student ambassador program will appear here." />
      ) : (
        <div className="space-y-4">
          {filtered.map(event => {
            const isRegistered = registrations.includes(event.id)
            const canRegister = event.status === EventStatus.OPEN || event.status === EventStatus.ALMOST_FULL
            return (
              <Card key={event.id} className="overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2 flex-shrink-0">
                      <p className="text-xs font-medium text-blue-500">{format(event.date, 'MMM')}</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{format(event.date, 'dd')}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Link to={`/events/${event.id}`} className="hover:underline">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{event.title}</h3>
                        </Link>
                        <Badge variant={STATUS_COLORS[event.status] || 'default'}>{STATUS_LABELS[event.status] || event.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{event.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.time}</span>
                        <span className="flex items-center gap-1">
                          {event.meetingLink ? <Video className="w-3 h-3 text-blue-500" /> : <MapPin className="w-3 h-3" />}
                          {event.venue || 'Online'}
                        </span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.registeredCount}/{event.maxParticipants}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    {isRegistered ? (
                      <>
                        <Badge variant="success" className="px-3 py-1.5 text-xs font-medium">✓ Registered</Badge>
                        {event.meetingLink && (
                          <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                            <Button variant="outline" size="sm" className="w-full" leftIcon={<Video className="w-3 h-3" />}>Join Event</Button>
                          </a>
                        )}
                      </>
                    ) : canRegister ? (
                      <Button size="sm" className="flex-1" loading={registering === event.id} onClick={() => handleRegister(event.id, event.title)}>
                        Register Now
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400 py-1.5">{STATUS_LABELS[event.status]}</span>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => addToCalendar(event)} title="Add to calendar (.ics)" aria-label="Add to calendar">
                      <Calendar className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
