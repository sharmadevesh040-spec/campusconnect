import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Mic2, Plus, Calendar, Clock, Video, MapPin, Edit3, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import {
  getAllInterviews, createInterview, updateInterview, deleteInterview
} from '@/services/interviewService'
import { getAllStudents } from '@/services/studentService'
import type { Interview, Profile } from '@/types'
import { InterviewStatus, InterviewType } from '@/types/interview'
import { toast } from 'sonner'

export default function AdminInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [students, setStudents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: 'Google Student Ambassador Final Round',
    organization: 'Google University Programs',
    studentId: 'student-1',
    date: format(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    time: '11:00 AM',
    duration: 45,
    interviewType: InterviewType.ONLINE,
    location: 'Google Meet',
    meetingLink: 'https://meet.google.com/campus-ambassador-round',
    interviewer: 'Program Evaluation Board',
    instructions: 'Prepare STAR examples of community leadership and event organization.',
    status: InterviewStatus.SCHEDULED,
    notes: 'Prioritize leadership potential.'
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [ints, stus] = await Promise.all([getAllInterviews(), getAllStudents()])
      setInterviews(ints)
      setStudents(stus)
    } catch {
      toast.error('Failed to load interviews')
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
      if (editingId) {
        await updateInterview(editingId, {
          ...formData,
          date: new Date(formData.date)
        })
        toast.success('Interview updated successfully')
      } else {
        await createInterview({
          ...formData,
          date: new Date(formData.date)
        })
        toast.success('New interview scheduled!')
      }
      setIsModalOpen(false)
      setEditingId(null)
      loadData()
    } catch {
      toast.error('Failed to save interview')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this interview record?')) return
    try {
      await deleteInterview(id)
      setInterviews(prev => prev.filter(i => i.id !== id))
      toast.success('Interview deleted')
    } catch {
      toast.error('Failed to delete interview')
    }
  }

  const handleStatusChange = async (id: string, newStatus: InterviewStatus) => {
    try {
      await updateInterview(id, { status: newStatus })
      setInterviews(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i))
      toast.success(`Status updated to ${newStatus}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-blue-500" />
            Interview Coordination Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Schedule candidate rounds, assign interviewers, and record selection outcomes
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
          Schedule Interview
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading interviews...</div>
      ) : interviews.length === 0 ? (
        <EmptyState emoji="🎙️" title="No interviews scheduled" description="Click 'Schedule Interview' to add one." />
      ) : (
        <div className="space-y-3">
          {interviews.map(i => {
            const student = students.find(s => s.userId === i.studentId || s.id === i.studentId)
            return (
              <Card key={i.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{i.title}</h3>
                    <Badge variant={i.status === InterviewStatus.SELECTED ? 'success' : i.status === InterviewStatus.CANCELLED ? 'danger' : 'primary'}>
                      {i.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Student: {student ? student.fullName : i.studentId} · Org: {i.organization}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(i.date), 'dd MMM yyyy')}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{i.time} ({i.duration}m)</span>
                    <span className="flex items-center gap-1">
                      {i.interviewType === InterviewType.ONLINE ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      {i.interviewType}
                    </span>
                    {i.interviewer && <span>Interviewer: {i.interviewer}</span>}
                  </div>
                </div>

                {/* Status Switcher & Controls */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
                  <select
                    value={i.status}
                    onChange={e => handleStatusChange(i.id, e.target.value as InterviewStatus)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value={InterviewStatus.SCHEDULED}>Scheduled</option>
                    <option value={InterviewStatus.CONFIRMED}>Confirmed</option>
                    <option value={InterviewStatus.COMPLETED}>Completed</option>
                    <option value={InterviewStatus.SELECTED}>Selected 🎉</option>
                    <option value={InterviewStatus.REJECTED}>Rejected</option>
                    <option value={InterviewStatus.RESCHEDULED}>Rescheduled</option>
                    <option value={InterviewStatus.CANCELLED}>Cancelled</option>
                  </select>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingId(i.id)
                      setFormData({
                        title: i.title || i.programName || '',
                        organization: i.organization || i.programName || '',
                        studentId: i.studentId,
                        date: format(new Date(i.date), 'yyyy-MM-dd'),
                        time: i.time,
                        duration: i.duration || 45,
                        interviewType: (i.interviewType || i.type || InterviewType.ONLINE) as any,
                        location: i.location || '',
                        meetingLink: i.meetingLink || '',
                        interviewer: i.interviewer || i.interviewerName || '',
                        instructions: i.instructions || '',
                        status: i.status,
                        notes: i.notes || ''
                      })
                      setIsModalOpen(true)
                    }}
                    aria-label="Edit interview"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => handleDelete(i.id)}
                    aria-label="Delete interview"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Schedule/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Interview' : 'Schedule New Interview'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <Input
            label="Interview Title"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Organization / Program"
              value={formData.organization}
              onChange={e => setFormData({ ...formData, organization: e.target.value })}
              required
            />
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Assign Student</label>
              <select
                value={formData.studentId}
                onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {students.map(s => (
                  <option key={s.id} value={s.userId || s.id}>{s.fullName} ({s.email})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Input
              label="Time"
              value={formData.time}
              onChange={e => setFormData({ ...formData, time: e.target.value })}
              placeholder="10:30 AM"
              required
            />
            <Input
              label="Duration (min)"
              type="number"
              value={formData.duration}
              onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Meeting Link (e.g. Google Meet)"
              value={formData.meetingLink}
              onChange={e => setFormData({ ...formData, meetingLink: e.target.value })}
            />
            <Input
              label="Interviewer Name / Role"
              value={formData.interviewer}
              onChange={e => setFormData({ ...formData, interviewer: e.target.value })}
            />
          </div>

          <Textarea
            label="Candidate Instructions"
            value={formData.instructions}
            onChange={e => setFormData({ ...formData, instructions: e.target.value })}
            rows={2}
          />

          <div className="flex gap-2 pt-3">
            <Button type="submit" className="flex-1">
              {editingId ? 'Save Changes' : 'Schedule Interview'}
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
