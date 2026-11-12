import { Bell, Trash2, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNotifications } from '@/hooks/useNotifications'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { NotificationType } from '@/types/notification'
import { cn } from '@/lib/utils'

const TYPE_ICONS: Record<string, string> = {
  [NotificationType.INTERVIEW_REMINDER]: '🎙️',
  [NotificationType.EVENT_REMINDER]: '🎉',
  [NotificationType.NEW_CERTIFICATE]: '🏆',
  [NotificationType.NEW_ANNOUNCEMENT]: '📢',
  [NotificationType.TASK_DEADLINE]: '⏰',
  [NotificationType.SCHEDULE_CHANGE]: '📅',
  [NotificationType.SELECTION_UPDATE]: '🎯',
  [NotificationType.SYSTEM]: '🔔',
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllRead, clearNotification } = useNotifications()

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" leftIcon={<CheckCheck className="w-4 h-4" />} onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          emoji="🔔"
          title="No notifications"
          description="You're all caught up! Notifications for interviews, certificate issuance, deadlines, and schedule changes will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <Card
              key={n.id}
              className={cn(
                'p-4 cursor-pointer transition-all',
                !n.isRead
                  ? 'border-blue-300 dark:border-blue-700 bg-blue-50/20 dark:bg-blue-900/10'
                  : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
              )}
              onClick={() => !n.isRead && markAsRead(n.id)}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 select-none">{TYPE_ICONS[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm leading-tight', !n.isRead ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-700 dark:text-slate-300')}>
                      {n.title}
                    </p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-[11px] text-slate-400 mt-1.5">{formatDistanceToNow(n.createdAt, { addSuffix: true })}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); clearNotification(n.id) }}
                  className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  aria-label="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
