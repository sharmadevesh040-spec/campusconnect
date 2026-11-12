import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Bell, Plus, Calendar, Paperclip, Trash2, Send } from 'lucide-react'
import { format } from 'date-fns'
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '@/services/announcementService'
import { createNotification } from '@/services/notificationService'
import type { Announcement } from '@/types'
import { AnnouncementPriority } from '@/types/announcement'
import { NotificationType } from '@/types/notification'
import { toast } from 'sonner'

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    title: 'Selection Results Announced for Winter Ambassador Cohort',
    content: 'We are pleased to publish the final candidate selection list. Please review your email inbox for official onboarding credentials and calendar invites.',
    priority: AnnouncementPriority.HIGH,
    category: 'Cohort Updates',
    attachmentURL: '',
    targetRoles: ['student'],
    sendNotification: true
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getAnnouncements()
      setAnnouncements(data)
    } catch {
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const annId = await createAnnouncement({
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        category: formData.category,
        attachmentURL: formData.attachmentURL,
        targetRoles: formData.targetRoles,
        publishedAt: new Date()
      })

      if (formData.sendNotification) {
        await createNotification({
          userId: 'student-1',
          type: NotificationType.NEW_ANNOUNCEMENT,
          title: `📢 ${formData.title}`,
          message: formData.content.slice(0, 120) + '...',
          isRead: false,
          relatedId: annId,
          relatedType: 'announcement'
        })
      }

      toast.success('Announcement broadcasted to all students!')
      setIsModalOpen(false)
      loadData()
    } catch {
      toast.error('Failed to publish announcement')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    try {
      await deleteAnnouncement(id)
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      toast.success('Announcement deleted')
    } catch {
      toast.error('Failed to delete announcement')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-500" />
            Announcement Center & Broadcasts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Publish critical program notices, schedule broadcast updates, and trigger push notifications
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          New Announcement
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading broadcasts...</div>
      ) : announcements.length === 0 ? (
        <EmptyState emoji="📢" title="No announcements published" description="Click 'New Announcement' to broadcast an update." />
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <Card key={a.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{a.title}</h3>
                  <Badge variant={a.priority === 'urgent' ? 'danger' : a.priority === 'high' ? 'warning' : 'default'}>
                    {a.priority.toUpperCase()}
                  </Badge>
                  {a.category && (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {a.category}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">{a.content}</p>

                <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Published: {format(new Date(a.publishedAt || a.createdAt || Date.now()), 'dd MMM yyyy, p')}
                  </span>
                  {a.attachmentURL && (
                    <span className="flex items-center gap-1 text-blue-500">
                      <Paperclip className="w-3 h-3" />
                      Attachment attached
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => handleDelete(a.id)}
                  aria-label="Delete announcement"
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
        title="Broadcast Announcement"
        size="lg"
      >
        <form onSubmit={handlePublish} className="space-y-3 text-left">
          <Input
            label="Announcement Title"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Priority Level</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as AnnouncementPriority })}
                className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value={AnnouncementPriority.URGENT}>Urgent (Top of Dashboard)</option>
                <option value={AnnouncementPriority.HIGH}>High Priority</option>
                <option value={AnnouncementPriority.MEDIUM}>Normal Priority</option>
                <option value={AnnouncementPriority.LOW}>Low Priority</option>
              </select>
            </div>

            <Input
              label="Category / Tag"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g. Interviews, Events, General"
            />
          </div>

          <Textarea
            label="Announcement Content"
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
            rows={4}
            required
          />

          <Input
            label="Attachment URL (Optional Document / Slide Link)"
            value={formData.attachmentURL}
            onChange={e => setFormData({ ...formData, attachmentURL: e.target.value })}
            placeholder="https://..."
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="sendNotif"
              checked={formData.sendNotification}
              onChange={e => setFormData({ ...formData, sendNotification: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="sendNotif" className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Also push instant notification to student notification bells
            </label>
          </div>

          <div className="flex gap-2 pt-3">
            <Button type="submit" className="flex-1" leftIcon={<Send className="w-4 h-4" />}>
              Publish Announcement
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
