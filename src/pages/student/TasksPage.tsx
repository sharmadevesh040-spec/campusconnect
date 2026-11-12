import { useState } from 'react'
import { CheckSquare, Circle, Clock, AlertCircle } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { useTasks } from '@/hooks/useTasks'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Progress } from '@/components/ui/Progress'
import { TaskStatus } from '@/types/task'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_ICONS = {
  [TaskStatus.PENDING]: <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-blue-500 transition-colors" />,
  [TaskStatus.IN_PROGRESS]: <Clock className="w-5 h-5 text-blue-500" />,
  [TaskStatus.COMPLETED]: <CheckSquare className="w-5 h-5 text-emerald-500" />,
  [TaskStatus.OVERDUE]: <AlertCircle className="w-5 h-5 text-red-500" />
}

export default function TasksPage() {
  const { tasks, loading, updateStatus } = useTasks()
  const [filter, setFilter] = useState<'all' | TaskStatus>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const filtered = tasks.filter(t => filter === 'all' || t.status === filter)
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())

  const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length
  const total = tasks.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  const handleToggle = async (taskId: string, currentStatus: TaskStatus) => {
    const newStatus = currentStatus === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED
    setUpdating(taskId)
    try {
      await updateStatus(taskId, newStatus)
      toast.success(newStatus === TaskStatus.COMPLETED ? 'Task marked complete! 🎉' : 'Task marked as pending')
    } catch {
      toast.error('Failed to update task')
    } finally {
      setUpdating(null)
    }
  }

  const FILTERS: Array<{ key: 'all' | TaskStatus; label: string }> = [
    { key: 'all', label: 'All' },
    { key: TaskStatus.PENDING, label: 'Pending' },
    { key: TaskStatus.IN_PROGRESS, label: 'In Progress' },
    { key: TaskStatus.COMPLETED, label: 'Completed' },
    { key: TaskStatus.OVERDUE, label: 'Overdue' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Tasks</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{completed} of {total} tasks completed</p>
      </div>

      {/* Progress Card */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Completion Rate</span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
        </div>
        <Progress value={progress} color={progress === 100 ? 'green' : 'blue'} />
      </Card>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              filter === f.key
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState emoji="✅" title={filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`} description="Tasks assigned to you will appear here." />
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const isOverdue = isPast(task.deadline) && task.status !== TaskStatus.COMPLETED
            const isCompleted = task.status === TaskStatus.COMPLETED
            return (
              <Card key={task.id} className={cn('p-4 transition-all', isCompleted && 'opacity-60 bg-slate-50/50 dark:bg-slate-800/40')}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggle(task.id, task.status)}
                    disabled={updating === task.id}
                    className="mt-0.5 flex-shrink-0 transition-transform active:scale-90"
                    aria-label={isCompleted ? 'Mark as pending' : 'Mark as complete'}
                  >
                    {STATUS_ICONS[task.status]}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium text-slate-800 dark:text-slate-200', isCompleted && 'line-through text-slate-400 dark:text-slate-500')}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className={cn('flex items-center gap-1 text-xs', isOverdue && !isCompleted ? 'text-red-500 font-medium' : 'text-slate-400')}>
                        <Clock className="w-3 h-3" />
                        {isOverdue && !isCompleted ? 'Overdue · ' : 'Due '}{format(task.deadline, 'dd MMM yyyy')}
                      </span>
                      <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'default'}>
                        {task.priority}
                      </Badge>
                    </div>
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
