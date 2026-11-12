import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mic2, Calendar, Clock, Video, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { useInterviews } from '@/hooks/useInterviews'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { CountdownTimer } from '@/components/common/CountdownTimer'
import { InterviewStatus, InterviewType } from '@/types/interview'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  scheduled: 'primary', confirmed: 'success', completed: 'default', rescheduled: 'warning',
  cancelled: 'danger', selected: 'success', rejected: 'danger', pending: 'info'
}

const FILTERS = ['all', 'upcoming', 'completed', 'cancelled']

export default function InterviewsPage() {
  const { interviews, loading } = useInterviews()
  const [filter, setFilter] = useState('all')

  const filtered = interviews.filter(i => {
    if (filter === 'upcoming') return [InterviewStatus.SCHEDULED, InterviewStatus.CONFIRMED, InterviewStatus.RESCHEDULED].includes(i.status) && i.date > new Date()
    if (filter === 'completed') return i.status === InterviewStatus.COMPLETED || i.status === InterviewStatus.SELECTED || i.status === InterviewStatus.REJECTED
    if (filter === 'cancelled') return i.status === InterviewStatus.CANCELLED
    return true
  }).sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Interviews</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{interviews.length} total interview{interviews.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all capitalize',
              filter === f ? 'bg-blue-500 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            )}
          >{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState emoji="🎓" title={filter === 'upcoming' ? 'No upcoming interviews' : 'No interviews found'} description={filter === 'upcoming' ? "You currently don't have any upcoming interviews." : "No interviews match this filter."} />
      ) : (
        <div className="space-y-3">
          {filtered.map(interview => {
            const isUpcoming = interview.date > new Date() && [InterviewStatus.SCHEDULED, InterviewStatus.CONFIRMED].includes(interview.status)
            return (
              <Link key={interview.id} to={`/interviews/${interview.id}`}>
                <Card hover className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2 flex-shrink-0 min-w-[3.5rem]">
                      <p className="text-xs font-medium text-blue-500">{format(interview.date, 'MMM')}</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{format(interview.date, 'dd')}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">{interview.title}</h3>
                        <Badge variant={STATUS_COLORS[interview.status] || 'default'}>{interview.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{interview.organization}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{interview.time}</span>
                        <span className="flex items-center gap-1">
                          {interview.interviewType === InterviewType.ONLINE ? <Video className="w-3 h-3 text-blue-500" /> : <MapPin className="w-3 h-3" />}
                          {interview.interviewType}
                        </span>
                        {interview.interviewer && <span>Interviewer: {interview.interviewer}</span>}
                      </div>
                      {isUpcoming && (
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          <CountdownTimer targetDate={interview.date} />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
