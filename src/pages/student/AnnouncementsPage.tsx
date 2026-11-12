import { useState } from 'react'
import { Bell, Paperclip, ChevronDown, ChevronUp, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { AnnouncementPriority } from '@/types/announcement'
import { cn } from '@/lib/utils'

const PRIORITY_COLORS: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  urgent: 'danger', high: 'warning', medium: 'info', low: 'default'
}

export default function AnnouncementsPage() {
  const { announcements, loading, markRead, markAllRead } = useAnnouncements()
  const [expanded, setExpanded] = useState<string | null>(null)

  const unread = announcements.filter(a => !a.isRead).length

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Announcements</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{unread} unread announcement{unread !== 1 ? 's' : ''}</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" leftIcon={<CheckCheck className="w-4 h-4" />} onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      ) : announcements.length === 0 ? (
        <EmptyState emoji="📢" title="No announcements" description="Important announcements from your student ambassador program will appear here." />
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <Card
              key={a.id}
              className={cn('overflow-hidden transition-all', !a.isRead && 'border-blue-300 dark:border-blue-700 shadow-sm')}
            >
              <button
                className="w-full text-left p-5 focus:outline-none"
                onClick={() => { setExpanded(expanded === a.id ? null : a.id); if (!a.isRead) markRead(a.id) }}
              >
                <div className="flex items-start gap-3">
                  {!a.isRead && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                  <div className={cn('flex-1 min-w-0', a.isRead && 'pl-2')}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={cn('text-sm font-semibold leading-tight', a.isRead ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-900 dark:text-slate-100 font-bold')}>
                        {a.title}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={PRIORITY_COLORS[a.priority] || 'default'}>{a.priority}</Badge>
                        {expanded === a.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{format(a.publishedAt, 'dd MMM yyyy')}</span>
                      {a.category && <><span>·</span><span>{a.category}</span></>}
                      {a.attachmentURL && <><span>·</span><Paperclip className="w-3 h-3" /></>}
                    </div>
                  </div>
                </div>
              </button>
              {expanded === a.id && (
                <div className="px-5 pb-5 animate-slide-up">
                  <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                    {a.attachmentURL && (
                      <a href={a.attachmentURL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 font-medium">
                        <Paperclip className="w-4 h-4" />View Attachment
                      </a>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
