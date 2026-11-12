import { useAuth } from '@/hooks/useAuth'
import { useInterviews } from '@/hooks/useInterviews'
import { useTasks } from '@/hooks/useTasks'
import { useEvents } from '@/hooks/useEvents'
import { useCertificates } from '@/hooks/useCertificates'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { CountdownTimer } from '@/components/common/CountdownTimer'
import { Link } from 'react-router-dom'
import {
  Calendar, Mic2, CheckSquare, Award, Bell, ArrowRight,
  MapPin, Video, CalendarDays, Clock, ChevronRight, Sparkles, UserCheck
} from 'lucide-react'
import { format, isToday, isTomorrow } from 'date-fns'
import { InterviewStatus } from '@/types/interview'
import { TaskStatus } from '@/types/task'
import { EventStatus } from '@/types/event'
import { UserRole } from '@/types/user'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getInterviewDate(date: Date) {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'dd MMM')
}

export default function DashboardPage() {
  const { userProfile, switchRole } = useAuth()
  const { interviews, loading: iLoading } = useInterviews()
  const { tasks, loading: tLoading } = useTasks()
  const { events, loading: eLoading } = useEvents()
  const { certificates, loading: cLoading } = useCertificates()
  const { announcements, loading: aLoading } = useAnnouncements()

  const firstName = userProfile?.fullName?.split(' ')[0] || 'Student'

  const upcomingInterviews = interviews.filter(i =>
    [InterviewStatus.SCHEDULED, InterviewStatus.CONFIRMED].includes(i.status) && i.date > new Date()
  ).sort((a, b) => a.date.getTime() - b.date.getTime())

  const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS)
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())

  const upcomingEvents = events.filter(e =>
    e.status === EventStatus.OPEN || e.status === EventStatus.ALMOST_FULL
  ).sort((a, b) => a.date.getTime() - b.date.getTime())

  const unreadAnnouncements = announcements.filter(a => !a.isRead)

  const nextInterview = upcomingInterviews[0]
  const nextEvent = upcomingEvents[0]

  const stats = [
    { label: 'Upcoming Interviews', value: upcomingInterviews.length, icon: Mic2, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400', link: '/interviews' },
    { label: 'Pending Tasks', value: pendingTasks.length, icon: CheckSquare, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', link: '/tasks' },
    { label: 'Upcoming Events', value: upcomingEvents.length, icon: CalendarDays, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400', link: '/events' },
    { label: 'Certificates Available', value: certificates.length, icon: Award, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', link: '/certificates' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Demo Role Switcher Quick Pill for Testing */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Active Profile:</span>
          <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
            {userProfile?.fullName} ({userProfile?.university || 'Campus Ambassador'})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Switch Persona:</span>
          <button
            onClick={() => switchRole(UserRole.STUDENT)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium transition-colors"
          >
            Student (Alex)
          </button>
          <button
            onClick={() => switchRole(UserRole.ADMIN)}
            className="px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
          >
            Admin (Dr. Sarah)
          </button>
        </div>
      </div>

      {/* Greeting */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/10">
        <p className="text-blue-100 text-sm font-medium mb-1">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">{getGreeting()}, {firstName} 👋</h1>
        <p className="text-blue-100 text-sm max-w-xl">
          {upcomingInterviews.length > 0
            ? `Your next interview starts in ${format(nextInterview.date, 'p')}. Make sure you're ready with meeting links & notes.`
            : pendingTasks.length > 0
            ? `You have ${pendingTasks.length} pending task${pendingTasks.length > 1 ? 's' : ''} to complete this week.`
            : 'Welcome back! All your student program resources and activities are up to date.'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(stat => (
          <Link key={stat.label} to={stat.link}>
            <Card hover className="p-4 h-full flex flex-col justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Next Interview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-blue-500" />
              Next Interview
            </h2>
            <Link to="/interviews" className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {iLoading ? <SkeletonCard /> : nextInterview ? (
            <Link to={`/interviews/${nextInterview.id}`}>
              <Card hover className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant={nextInterview.status === InterviewStatus.CONFIRMED ? 'success' : 'primary'}>
                    {nextInterview.status}
                  </Badge>
                  <span className="text-xs text-slate-400 font-medium">{getInterviewDate(nextInterview.date)}</span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">{nextInterview.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{nextInterview.organization}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{nextInterview.time}</span>
                  <span className="flex items-center gap-1">
                    {nextInterview.meetingLink ? <Video className="w-3 h-3 text-blue-500" /> : <MapPin className="w-3 h-3" />}
                    {nextInterview.interviewType}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <CountdownTimer targetDate={nextInterview.date} />
                </div>
              </Card>
            </Link>
          ) : (
            <Card className="p-5">
              <EmptyState emoji="🎓" title="No interviews scheduled" description="You currently don't have any upcoming interviews." />
            </Card>
          )}
        </div>

        {/* Pending Tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-amber-500" />
              Pending Tasks
            </h2>
            <Link to="/tasks" className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {tLoading ? <SkeletonCard /> : pendingTasks.length === 0 ? (
            <Card className="p-5"><EmptyState emoji="✅" title="All caught up!" description="No pending tasks right now." /></Card>
          ) : (
            <Card>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {pendingTasks.slice(0, 4).map(task => (
                  <div key={task.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Deadline: {format(task.deadline, 'dd MMM')}</p>
                    </div>
                    <Badge variant={task.status === TaskStatus.IN_PROGRESS ? 'info' : 'warning'} className="flex-shrink-0">
                      {task.status === TaskStatus.IN_PROGRESS ? 'In Progress' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Upcoming Events */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-purple-500" />
              Upcoming Events
            </h2>
            <Link to="/events" className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {eLoading ? <SkeletonCard /> : upcomingEvents.length === 0 ? (
            <Card className="p-5"><EmptyState emoji="🎉" title="No upcoming events" description="Check back soon for new events." /></Card>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 2).map(event => (
                <Link key={event.id} to={`/events/${event.id}`}>
                  <Card hover className="p-4">
                    <div className="flex gap-4">
                      <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2 flex-shrink-0">
                        <p className="text-xs font-medium text-blue-500">{format(event.date, 'MMM')}</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{format(event.date, 'dd')}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{event.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{event.time} · {event.venue || 'Online'}</p>
                        <Badge variant={event.status === EventStatus.ALMOST_FULL ? 'warning' : 'success'} className="mt-2">
                          {event.status === EventStatus.ALMOST_FULL ? 'Almost Full' : 'Open'}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Latest Announcements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-red-500" />
              Latest Announcements
            </h2>
            <Link to="/announcements" className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {aLoading ? <SkeletonCard /> : announcements.length === 0 ? (
            <Card className="p-5"><EmptyState emoji="📢" title="No announcements" description="Important announcements from your program will appear here." /></Card>
          ) : (
            <Card>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {announcements.slice(0, 3).map(a => (
                  <div key={a.id} className="px-5 py-3.5 flex items-start gap-3">
                    {!a.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                    <div className={`flex-1 min-w-0 ${a.isRead ? 'pl-4' : ''}`}>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{a.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{format(a.publishedAt, 'dd MMM yyyy')}</p>
                    </div>
                    <Badge variant={a.priority === 'urgent' ? 'danger' : a.priority === 'high' ? 'warning' : 'default'}>
                      {a.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* AI Assistant CTA */}
      <Link to="/assistant">
        <Card hover className="p-5 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-800/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100">AI Student Assistant & Interview Coach</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Practice STAR responses, review program requirements, and get interview tips</p>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-500 flex-shrink-0" />
          </div>
        </Card>
      </Link>
    </div>
  )
}
