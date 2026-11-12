import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { CalendarDays, Plus, Calendar, Clock, MapPin, Video, Users, Edit3, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import {
  getEvents, createEvent, updateEvent, deleteEvent
} from '@/services/eventService'
import type { Event } from '@/types'
import { EventStatus } from '@/types/event'
import { toast } from 'sonner'

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: 'University Tech Innovation Showcase',
    description: 'Annual campus expo demonstrating student ambassador community software and hardware projects.',
    date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    time: '02:00 PM - 05:00 PM',
    venue: 'Auditorium Hall B & Online Stream',
    meetingLink: 'https://campusconnect.live/expo-2026',
    organizer: 'CampusConnect Committee',
    maxParticipants: 300,
    status: EventStatus.OPEN,
    imageURL: '',
    tags: ['Tech', 'Showcase', 'Exhibition']
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getEvents()
      setEvents(data)
    } catch {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const eventDate = new Date(formData.date)
      const eventEnd = new Date(eventDate.getTime() + 3 * 60 * 60 * 1000)
      const deadline = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000)

      if (editingId) {
        await updateEvent(editingId, {
          ...formData,
          date: eventDate,
          endDate: eventEnd,
          registrationDeadline: deadline,
        })
        toast.success('Event updated')
      } else {
        await createEvent({
          ...formData,
          date: eventDate,
          endDate: eventEnd,
          registrationDeadline: deadline,
        })
        toast.success('New event published!')
      }
      setIsModalOpen(false)
      setEditingId(null)
      loadData()
    } catch {
      toast.error('Failed to save event')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    try {
      await deleteEvent(id)
      setEvents(prev => prev.filter(e => e.id !== id))
      toast.success('Event deleted')
    } catch {
      toast.error('Failed to delete event')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-purple-500" />
            Events & Summit Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Organize student workshops, summits, hackathons, and monitor registration capacity
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setEditingId(null)
            setIsModalOpen(true)
          }}
        >
          Create Event
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading events...</div>
      ) : events.length === 0 ? (
        <EmptyState emoji="🎉" title="No events found" description="Click 'Create Event' to organize a new activity." />
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <Card key={event.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{event.title}</h3>
                  <Badge variant={event.status === EventStatus.OPEN ? 'success' : event.status === EventStatus.ALMOST_FULL ? 'warning' : 'danger'}>
                    {event.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{event.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(event.date), 'dd MMM yyyy')}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.time}</span>
                  <span className="flex items-center gap-1">
                    {event.meetingLink ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    {event.venue || 'Online'}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400">
                    <Users className="w-3 h-3" />
                    {event.registeredCount || 0} / {event.maxParticipants} Registered
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setEditingId(event.id)
                    setFormData({
                      title: event.title,
                      description: event.description,
                      date: format(new Date(event.date), 'yyyy-MM-dd'),
                      time: event.time,
                      venue: event.venue,
                      meetingLink: event.meetingLink,
                      organizer: event.organizer,
                      maxParticipants: event.maxParticipants,
                      status: event.status,
                      imageURL: event.imageURL || '',
                      tags: event.tags || []
                    })
                    setIsModalOpen(true)
                  }}
                >
                  Edit
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => handleDelete(event.id)}
                  aria-label="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Event' : 'Create New Event'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <Input
            label="Event Title"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Textarea
            label="Event Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Input
              label="Time Range"
              value={formData.time}
              onChange={e => setFormData({ ...formData, time: e.target.value })}
              placeholder="02:00 PM - 05:00 PM"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Venue (Physical Room or Online)"
              value={formData.venue}
              onChange={e => setFormData({ ...formData, venue: e.target.value })}
              required
            />
            <Input
              label="Virtual Meeting Link"
              value={formData.meetingLink}
              onChange={e => setFormData({ ...formData, meetingLink: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Maximum Capacity"
              type="number"
              value={formData.maxParticipants}
              onChange={e => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
              required
            />
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as EventStatus })}
                className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value={EventStatus.OPEN}>Open</option>
                <option value={EventStatus.ALMOST_FULL}>Almost Full</option>
                <option value={EventStatus.CLOSED}>Closed</option>
                <option value={EventStatus.COMPLETED}>Completed</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <Button type="submit" className="flex-1">
              {editingId ? 'Save Changes' : 'Publish Event'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
