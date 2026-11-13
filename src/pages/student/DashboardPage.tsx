import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays, CheckSquare, Award, Bell, Clock, MapPin, Video,
  ChevronRight, Mic2, Eye, Download, ShieldCheck, Sparkles,
  ArrowUpRight, Target, Activity, Users, BookOpen
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
import { TactileIdVault } from '@/components/dashboard/TactileIdVault'
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

  const [activeTab, setActiveTab] = useState<'all' | 'schedule' | 'tasks' | 'credentials' | 'idcard'>('all')
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  const [previewCert, setPreviewCert] = useState<any | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const firstName = userProfile?.fullName?.split(' ')[0] || 'Student'
  const userRole = userProfile?.role || 'Campus Fellow'

  const upcomingInterviews = interviews.filter(i =>
    [InterviewStatus.SCHEDULED, InterviewStatus.CONFIRMED].includes(i.status) && i.date > new Date()
  ).sort((a, b) => a.date.getTime() - b.date.getTime())

  const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS)
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())

  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED)
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 100

  const upcomingEvents = events.filter(e =>
    e.status === EventStatus.OPEN || e.status === EventStatus.ALMOST_FULL
  ).sort((a, b) => a.date.getTime() - b.date.getTime())

  const nextInterview = upcomingInterviews[0]

  const stats = [
    {
      label: 'Upcoming Interviews',
      value: upcomingInterviews.length,
      icon: Mic2,
      subtext: nextInterview ? `Next: ${format(nextInterview.date, 'p')}` : 'All caught up',
      dot: 'spec-dot-indigo',
      link: '/interviews'
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks.length,
      icon: CheckSquare,
      subtext: `${taskCompletionRate}% completed`,
      dot: 'spec-dot-amber',
      link: '/tasks'
    },
    {
      label: 'Campus Events',
      value: upcomingEvents.length,
      icon: CalendarDays,
      subtext: 'Registration open',
      dot: 'spec-dot-emerald',
      link: '/events'
    },
    {
      label: 'Verified Credentials',
      value: certificates.length,
      icon: Award,
      subtext: 'SHA-256 tamper-proof',
      dot: 'spec-dot-emerald',
      link: '/certificates'
    },
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
    <div className="max-w-6xl mx-auto space-y-7 pb-16 animate-fade-in">
      {/* ── Lookap Obsidian Blueprint Hero ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0c0d12] border border-white/10 p-6 md:p-8 text-white shadow-[0_12px_40px_-10px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)]">
        {/* Subtle radial ambient lighting */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Live Status Pill & Spec Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/15 text-[11px] font-mono tracking-wide text-slate-200">
                <span className="spec-dot-emerald" /> LIVE CAMPUS RADAR
              </span>
              <span className="spec-tag">CADENCE: ACTIVE</span>
              <span className="spec-tag">{format(new Date(), 'dd MMM yyyy')}</span>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
                {getGreeting()}, {firstName}
                <span className="text-slate-400 font-normal text-lg hidden sm:inline">· {userRole}</span>
              </h1>
              <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                {upcomingInterviews.length > 0
                  ? `Your next interview starts at ${format(nextInterview.date, 'p')}. Make sure you're ready with meeting links & notes.`
                  : pendingTasks.length > 0
                  ? `You have ${pendingTasks.length} pending academic & program task${pendingTasks.length > 1 ? 's' : ''} to complete this week.`
                  : 'Welcome back! All your student program resources, interviews, and verified credentials are up to date.'}
              </p>
            </div>
          </div>

          {/* Quick Action Convex Buttons */}
          <div className="flex sm:flex-col lg:flex-row gap-2.5 flex-shrink-0">
            <Link to="/tasks">
              <Button variant="tactile" size="sm" className="w-full text-xs font-semibold" leftIcon={<CheckSquare className="w-3.5 h-3.5" />}>
                View Task Queue
              </Button>
            </Link>
            <Link to="/interviews">
              <Button variant="tactileDark" size="sm" className="w-full text-xs" leftIcon={<Mic2 className="w-3.5 h-3.5" />}>
                Mock Prep
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Lookap 4-Card KPI Bento Metric Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stats.map(stat => (
          <Link key={stat.label} to={stat.link} className="group">
            <div className="lookap-card p-4 h-full flex flex-col justify-between group-hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-800 dark:text-slate-200 shadow-sm">
                  <stat.icon className="w-4 h-4" />
                </div>
                <span className={stat.dot} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">{stat.label}</p>
                <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1 truncate">{stat.subtext}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Lookap Segmented Filter Controls ── */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl w-fit text-xs font-medium">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-lg transition-all ${
            activeTab === 'all'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-3.5 py-1.5 rounded-lg transition-all ${
            activeTab === 'schedule'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Schedule ({upcomingInterviews.length})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-3.5 py-1.5 rounded-lg transition-all ${
            activeTab === 'tasks'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Tasks ({pendingTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('credentials')}
          className={`px-3.5 py-1.5 rounded-lg transition-all ${
            activeTab === 'credentials'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Credentials ({certificates.length})
        </button>
        <button
          onClick={() => setActiveTab('idcard')}
          className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'idcard'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="spec-dot-emerald" /> Digital ID Badge
        </button>
      </div>

      {/* ── Primary Operational Grid ── */}
      {(activeTab === 'all' || activeTab === 'schedule' || activeTab === 'tasks') && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Next Interview / Meeting Widget */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Mic2 className="w-4 h-4 text-blue-500" />
                Live Interview Radar
              </h2>
              <Link to="/interviews" className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-0.5">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {iLoading ? (
              <SkeletonCard />
            ) : nextInterview ? (
              <Link to={`/interviews/${nextInterview.id}`}>
                <div className="lookap-card p-5 group hover:border-blue-400/40 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="spec-dot-indigo" />
                      <Badge variant={nextInterview.status === InterviewStatus.CONFIRMED ? 'success' : 'primary'}>
                        {nextInterview.status}
                      </Badge>
                    </div>
                    <span className="spec-tag">{getInterviewDate(nextInterview.date)}</span>
                  </div>

                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base mb-1 group-hover:text-blue-500 transition-colors">
                    {nextInterview.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">{nextInterview.organization}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4 font-mono">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-500" />{nextInterview.time}</span>
                    <span className="flex items-center gap-1.5">
                      {nextInterview.meetingLink ? <Video className="w-3.5 h-3.5 text-emerald-500" /> : <MapPin className="w-3.5 h-3.5 text-purple-500" />}
                      {nextInterview.interviewType}
                    </span>
                  </div>

                  {/* Lookap Blueprint Inset Recess for Countdown */}
                  <div className="lookap-recess p-3.5 flex items-center justify-between">
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      TIME TO START:
                    </div>
                    <CountdownTimer targetDate={nextInterview.date} />
                  </div>
                </div>
              </Link>
            ) : (
              <Card className="p-6">
                <EmptyState emoji="🎓" title="No interviews scheduled" description="You currently don't have any upcoming mock or program interviews." />
              </Card>
            )}
          </div>

          {/* Pending Tasks Pipeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-500" />
                Priority Task Pipeline
              </h2>
              <Link to="/tasks" className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-0.5">
                View all ({pendingTasks.length}) <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {tLoading ? (
              <SkeletonCard />
            ) : pendingTasks.length === 0 ? (
              <Card className="p-6"><EmptyState emoji="✅" title="All caught up!" description="No pending tasks right now." /></Card>
            ) : (
              <div className="lookap-card divide-y divide-slate-100 dark:divide-white/[0.06] overflow-hidden">
                {pendingTasks.slice(0, 4).map(task => (
                  <div key={task.id} className="p-4 flex items-center gap-3.5 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                    <span className={task.priority === 'high' ? 'spec-dot-amber' : 'inline-block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="spec-tag text-[9px] py-0 px-1.5">DUE: {format(task.deadline, 'dd MMM')}</span>
                        <span className="text-[11px] font-mono text-slate-400 uppercase">{task.priority} PRIORITY</span>
                      </div>
                    </div>
                    <Badge variant={task.status === TaskStatus.IN_PROGRESS ? 'info' : 'warning'} className="flex-shrink-0 text-[10px]">
                      {task.status === TaskStatus.IN_PROGRESS ? 'In Progress' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Lookap Verified Credentials & Certificates Showcase ── */}
      {(activeTab === 'all' || activeTab === 'credentials') && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              Cryptographic Credentials & Verified Certificates
            </h2>
            <Link to="/certificates" className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-0.5">
              View all ({certificates.length}) <ChevronRight className="w-3.5 h-3.5" />
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
                <div key={cert.id} className="lookap-card p-5 flex flex-col justify-between relative overflow-hidden">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-sm">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                            {cert.title || cert.programName}
                          </h3>
                          <p className="text-[11px] font-mono text-slate-400">
                            {cert.type || 'Official Program Credential'}
                          </p>
                        </div>
                      </div>
                      <span className="spec-tag text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        VERIFIED
                      </span>
                    </div>

                    <div className="lookap-recess p-2.5 flex justify-between items-center text-xs mt-3">
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        ISSUED: {format(new Date(cert.issueDate), 'dd MMM yyyy')}
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                        {cert.certificateId}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-4 mt-3 border-t border-slate-100 dark:border-white/[0.06]">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => handleView(cert)}
                    >
                      Quick Inspect
                    </Button>
                    <Button
                      variant="tactileSilver"
                      size="sm"
                      className="flex-1 text-xs"
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                      loading={downloading === cert.id}
                      onClick={() => handleDownload(cert.id, cert.studentName, cert.title || cert.programName)}
                    >
                      Download PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Lookap Digital Campus ID Vault ── */}
      {(activeTab === 'all' || activeTab === 'idcard') && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              Digital Campus Identity Vault & Tap-to-Verify
            </h2>
            <span className="spec-tag text-blue-600 dark:text-blue-400">HARDWARE SIMULATION</span>
          </div>

          <div className="lookap-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-lg">
              <div className="flex items-center gap-2">
                <span className="spec-dot-emerald" />
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold">
                  AUTHENTICATED ACCESS BADGE
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Interactive Campus ID Card Reader
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Modeled after Lookap's tactile hardware vault design. Hover, tap, or click to insert your student badge into the scanner. The integrated dot-matrix display performs live identity validation, access confirmation, and cryptographic verification.
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 pt-1">
                <span>NAME: {userProfile?.fullName || firstName}</span>
                <span>·</span>
                <span>STATUS: {userRole}</span>
              </div>
            </div>

            <div className="w-full max-w-xs flex-shrink-0">
              <TactileIdVault
                studentName={userProfile?.fullName || firstName}
                studentId={userProfile?.id ? `CC-${userProfile.id.slice(0, 8).toUpperCase()}` : 'CC-2026-8841'}
                role={userRole}
                program="CampusConnect Ambassador"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Events & Announcements Radar ── */}
      {(activeTab === 'all') && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-purple-500" />
                Campus Events Radar
              </h2>
              <Link to="/events" className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-0.5">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {eLoading ? (
              <SkeletonCard />
            ) : upcomingEvents.length === 0 ? (
              <Card className="p-6"><EmptyState emoji="🎉" title="No upcoming events" description="Check back soon for new events." /></Card>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 2).map(event => (
                  <Link key={event.id} to={`/events/${event.id}`}>
                    <div className="lookap-card p-4 hover:border-purple-400/30 transition-all flex gap-4">
                      <div className="text-center bg-purple-50 dark:bg-purple-950/40 border border-purple-500/20 rounded-xl px-3 py-2 flex-shrink-0 flex flex-col justify-center">
                        <p className="text-[10px] font-mono uppercase font-bold text-purple-600 dark:text-purple-400">{format(event.date, 'MMM')}</p>
                        <p className="text-xl font-bold text-purple-700 dark:text-purple-300 leading-none">{format(event.date, 'dd')}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{event.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">{event.time} · {event.venue || 'Campus Main / Online'}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="spec-tag text-[9px]">
                            {event.status === EventStatus.ALMOST_FULL ? 'LIMITED SEATS' : 'REGISTRATION OPEN'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Announcements Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-500" />
                Latest Bulletins
              </h2>
              <Link to="/announcements" className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-0.5">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {aLoading ? (
              <SkeletonCard />
            ) : announcements.length === 0 ? (
              <Card className="p-6"><EmptyState emoji="📢" title="No announcements" description="Important announcements will appear here." /></Card>
            ) : (
              <div className="lookap-card divide-y divide-slate-100 dark:divide-white/[0.06] overflow-hidden">
                {announcements.slice(0, 3).map(a => (
                  <div key={a.id} className="p-4 flex items-start gap-3 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                    {!a.isRead ? <span className="spec-dot-indigo mt-1.5 flex-shrink-0" /> : <div className="w-2" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{a.title}</p>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">{format(a.publishedAt || a.createdAt || Date.now(), 'dd MMM yyyy')}</p>
                    </div>
                    <Badge variant={a.priority === 'urgent' ? 'danger' : a.priority === 'high' ? 'warning' : 'default'} className="text-[10px]">
                      {a.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF View Modal */}
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
              <div className="text-xs text-slate-500 font-mono">
                CERTIFICATE ID: <span className="font-bold text-blue-600 dark:text-blue-400">{previewCert?.certificateId}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="tactile"
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
