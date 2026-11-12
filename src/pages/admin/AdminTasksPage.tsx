import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { CheckSquare, Plus, Clock, User, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { format } from 'date-fns'
import { getAllTasks, createTask, deleteTask, updateTaskStatus } from '@/services/taskService'
import { getAllStudents } from '@/services/studentService'
import type { Task, Profile } from '@/types'
import { TaskStatus } from '@/types/task'
import { toast } from 'sonner'

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [students, setStudents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    title: 'Submit Monthly Community Metrics',
    description: 'Compile active student attendance and workshop feedback ratings into the monthly report template.',
    studentId: 'student-1',
    deadline: format(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    priority: 'high' as 'low' | 'medium' | 'high',
    status: TaskStatus.PENDING,
    attachmentURL: ''
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [tsks, stus] = await Promise.all([getAllTasks(), getAllStudents()])
      setTasks(tsks)
      setStudents(stus)
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTask({
        ...formData,
        deadline: new Date(formData.deadline),
      })
      toast.success('Task assigned to student!')
      setIsModalOpen(false)
      loadData()
    } catch {
      toast.error('Failed to assign task')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    try {
      await deleteTask(id)
      setTasks(prev => prev.filter(t => t.id !== id))
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      await updateTaskStatus(id, status)
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
      toast.success(`Task status updated`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-500" />
            Student Task & Deliverable Tracker
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Assign deliverables to ambassadors, set deadlines, and inspect completion status
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Assign New Task
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading task roster...</div>
      ) : tasks.length === 0 ? (
        <EmptyState emoji="📋" title="No tasks active" description="Assign a new task to your student ambassadors." />
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const student = students.find(s => s.userId === task.studentId || s.id === task.studentId)
            const isCompleted = task.status === TaskStatus.COMPLETED

            return (
              <Card key={task.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{task.title}</h3>
                    <Badge variant={isCompleted ? 'success' : task.status === TaskStatus.IN_PROGRESS ? 'info' : 'warning'}>
                      {task.status}
                    </Badge>
                    <Badge variant={task.priority === 'high' ? 'danger' : 'default'} className="text-[10px]">
                      {task.priority.toUpperCase()} PRIORITY
                    </Badge>
                  </div>

                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Assigned to: {student ? student.fullName : task.studentId}
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{task.description}</p>

                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due: {format(new Date(task.deadline), 'dd MMM yyyy')}
                    </span>
                    {task.completedAt && (
                      <span className="text-emerald-600 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed on {format(new Date(task.completedAt), 'dd MMM')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status selector & Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
                  <select
                    value={task.status}
                    onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <option value={TaskStatus.PENDING}>Pending</option>
                    <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                    <option value={TaskStatus.COMPLETED}>Completed</option>
                    <option value={TaskStatus.OVERDUE}>Overdue</option>
                  </select>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => handleDelete(task.id)}
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign Task to Student"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-3 text-left">
          <Input
            label="Task Title"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Textarea
            label="Deliverable Instructions / Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            required
          />

          <div className="grid grid-cols-2 gap-3">
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

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Priority Level</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <Input
            label="Deadline Date"
            type="date"
            value={formData.deadline}
            onChange={e => setFormData({ ...formData, deadline: e.target.value })}
            required
          />

          <div className="flex gap-2 pt-3">
            <Button type="submit" className="flex-1">
              Assign Deliverable
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
