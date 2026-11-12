import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Video } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth,
  isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek
} from 'date-fns'
import { useInterviews } from '@/hooks/useInterviews'
import { useTasks } from '@/hooks/useTasks'
import { useEvents } from '@/hooks/useEvents'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { InterviewStatus } from '@/types/interview'
import { TaskStatus } from '@/types/task'

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date())
  const [selected, setSelected] = useState<Date | null>(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')

  const { interviews } = useInterviews()
  const { tasks } = useTasks()
  const { events } = useEvents()

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const getDayItems = (day: Date) => ({
    interviews: interviews.filter(i => isSameDay(new Date(i.date), day) && i.status !== InterviewStatus.CANCELLED),
    events: events.filter(e => isSameDay(new Date(e.date), day)),
    tasks: tasks.filter(t => isSameDay(new Date(t.deadline), day) && t.status !== TaskStatus.COMPLETED)
  })

  const selectedItems = selected ? getDayItems(selected) : null

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Schedule & Calendar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track interviews, events, and task deadlines in one place</p>
        </div>

        {/* View toggle */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs font-medium">
          {(['month', 'week', 'day'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-3 py-1 rounded-lg capitalize transition-colors',
                view === v ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
          <Button variant="ghost" size="icon" onClick={() => setMonth(subMonths(month, 1))} aria-label="Previous month">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{format(month, 'MMMM yyyy')}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="p-2 text-center text-xs font-semibold text-slate-400">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-700/60 border-b border-slate-100 dark:border-slate-700">
          {days.map(day => {
            const { interviews: di, events: de, tasks: dt } = getDayItems(day)
            const hasItems = di.length > 0 || de.length > 0 || dt.length > 0
            const isSelected = selected && isSameDay(day, selected)
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelected(day)}
                className={cn(
                  'relative p-2 md:p-3 text-center transition-colors min-h-[4rem] flex flex-col items-center justify-start',
                  !isSameMonth(day, month) && 'opacity-30 bg-slate-50/30 dark:bg-slate-900/30',
                  isToday(day) && 'font-bold text-blue-600 dark:text-blue-400',
                  isSelected ? 'bg-blue-500/10 dark:bg-blue-500/20 ring-2 ring-blue-500 ring-inset' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40',
                )}
              >
                <span className={cn(
                  'text-xs md:text-sm font-semibold w-6 h-6 rounded-full flex items-center justify-center',
                  isToday(day) ? 'bg-blue-500 text-white' : 'text-slate-700 dark:text-slate-300'
                )}>
                  {format(day, 'd')}
                </span>
                {hasItems && (
                  <div className="flex gap-1 mt-1.5 flex-wrap justify-center max-w-[2.5rem]">
                    {di.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Interview" />}
                    {de.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Event" />}
                    {dt.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Task" />}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500 px-1">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />Interviews</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" />Events</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />Task Deadlines</span>
      </div>

      {/* Selected day details */}
      {selected && selectedItems && (
        <div className="space-y-3 animate-slide-up">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-500" />
            Schedule for {format(selected, 'EEEE, dd MMMM yyyy')}
          </h3>

          {selectedItems.interviews.length === 0 && selectedItems.events.length === 0 && selectedItems.tasks.length === 0 ? (
            <Card className="p-6 text-center text-slate-400 text-sm">
              No interviews, events, or deadlines on this day.
            </Card>
          ) : (
            <div className="space-y-2">
              {selectedItems.interviews.map(i => (
                <Link key={i.id} to={`/interviews/${i.id}`}>
                  <Card hover className="p-4 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{i.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{i.time} · {i.organization}</p>
                      </div>
                      <Badge variant="primary">{i.status}</Badge>
                    </div>
                  </Card>
                </Link>
              ))}

              {selectedItems.events.map(e => (
                <Link key={e.id} to={`/events/${e.id}`}>
                  <Card hover className="p-4 border-l-4 border-l-purple-500">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{e.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{e.time} · {e.venue || 'Online'}</p>
                      </div>
                      <Badge variant="info">Event</Badge>
                    </div>
                  </Card>
                </Link>
              ))}

              {selectedItems.tasks.map(t => (
                <Link key={t.id} to="/tasks">
                  <Card hover className="p-4 border-l-4 border-l-amber-500">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Priority: {t.priority}</p>
                      </div>
                      <Badge variant="warning">{t.status}</Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
