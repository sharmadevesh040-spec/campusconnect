import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays, CheckSquare, Award, Bell, Clock, MapPin, Video,
  ChevronRight, Mic2, Eye, Download, ShieldCheck
} from 'lucide-react'
import { format, isToday, isTomorrow } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { useInterviews } from '@/hooks/useInterviews'
import { useTasks } from '@/hooks/useTasks'
import { useEvents } from '@/hooks/useEvents'
import { useCertificates } from '@/hooks/useCertificates'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { CountdownTimer } from '@/components/common/CountdownTimer'
import { InterviewStatus } from '@/types/interview'
import { TaskStatus } from '@/types/task'
import { EventStatus } from '@/types/event'
import { getCertificateViewBlobUrl } from '@/services/certificateService'
import { toast } from 'sonner'

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
  const { userProfile } = useAuth()
  const { interviews, loading: iLoading } = useInterviews()
  const { tasks, loading: tLoading } = useTasks()
  const { events, loading: eLoading } = useEvents()
  const { certificates, loading: cLoading, downloadCertificate } = useCertificates()
  const { announcements, loading: aLoading } = useAnnouncements()

  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  const [previewCert, setPreviewCert] = useState<any | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const firstName = userProfile?.fullName?.split(' ')[0] || 'Student'

  const upcomingInterviews = interviews.filter(i =>
    [InterviewStatus.SCHEDULED, InterviewStatus.CONFIRMED].includes(i.status) && i.date > new Date()
  ).sort((a, b) => a.date.getTime() - b.date.getTime())

  const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS)
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())

  const upcomingEvents = events.filter(e =>
    e.status === EventStatus.OPEN || e.status === EventStatus.ALMOST_FULL
  ).sort((a, b) => a.date.getTime() - b.date.getTime())

  const nextInterview = upcomingInterviews[0]

  const stats = [
    { label: 'Upcoming Interviews', value: upcomingInterviews.length, icon: Mic2, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400', link: '/interviews' },
    { label: 'Pending Tasks', value: pendingTasks.length, icon: CheckSquare, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', link: '/tasks' },
    { label: 'Upcoming Events', value: upcomingEvents.length, icon: CalendarDays, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400', link: '/events' },
    { label: 'Certificates Available', value: certificates.length, icon: Award, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', link: '/certificates' },
  ]

  const handleDownload = async (certId: string, name: string, title: string) => {
    setDownloading(certId)
    try {
      toast.loading('Preparing certificate PDF...', { id: 'download' })
      await downloadCertificate(certId, name, title)
      toast.success('Certificate ready ✓', {
        id: 'download',
        description: 'Your verified PDF certificate was downloaded successfully.'
      })
    } catch {
      toast.error('Download failed. Please try again.', { id: 'download' })
    } finally {
      setDownloading(null)
    }
  }

  const handleView = async (cert: any) => {
    try {
      toast.loading('Loading verified certificate...', { id: 'preview' })
      const url = await getCertificateViewBlobUrl(cert.id)
      toast.dismiss('preview')
      setPreviewBlobUrl(url)
      setPreviewCert(cert)
    } catch {
      toast.error('Unable to view certificate. Please try again.', { id: 'preview' })
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
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

      {/* Primary Grid */}
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
      </div>

      {/* Dedicated My Certificates Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-500" />
            My Certificates
          </h2>
          <Link to="/certificates" className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1">
            View all ({certificates.length}) <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {cLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : certificates.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              emoji="🏆"
              title="No certificates yet"
              description="Your verified certificates will appear here once issued by your program administrator."
            />
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {certificates.slice(0, 2).map(cert => (
              <Card key={cert.id} className="p-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                          {cert.title || cert.programName}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {cert.type || 'Ambassador Credential'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="green" className="text-[10px]">
                      {cert.status}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Issued: {format(new Date(cert.issueDate), 'dd MMM yyyy')}</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{cert.certificateId}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => handleView(cert)}
                  >
                    View Certificate
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    loading={downloading === cert.id}
                    onClick={() => handleDownload(cert.id, cert.studentName, cert.title || cert.programName)}
                  >
                    Download PDF
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Events & Announcements Grid */}
      <div className="grid md:grid-cols-2 gap-6">
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
                      <p className="text-xs text-slate-400 mt-0.5">{format(a.publishedAt || a.createdAt || Date.now(), 'dd MMM yyyy')}</p>
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

      {/* PDF View Modal on Dashboard */}
      {previewBlobUrl && (
        <Modal
          isOpen={Boolean(previewBlobUrl)}
          onClose={() => {
            URL.revokeObjectURL(previewBlobUrl)
            setPreviewBlobUrl(null)
          }}
          title={previewCert?.title || previewCert?.programName || 'Certificate Preview'}
          size="lg"
        >
          <div className="space-y-4">
            <div className="w-full h-[520px] border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-100">
              <iframe src={previewBlobUrl} className="w-full h-full" title="Certificate PDF Viewer" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500">
                Certificate ID: <span className="font-mono font-bold text-blue-600">{previewCert?.certificateId}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => {
                    if (previewCert) {
                      handleDownload(previewCert.id, previewCert.studentName, previewCert.title || previewCert.programName)
                    }
                  }}
                >
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    URL.revokeObjectURL(previewBlobUrl)
                    setPreviewBlobUrl(null)
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
