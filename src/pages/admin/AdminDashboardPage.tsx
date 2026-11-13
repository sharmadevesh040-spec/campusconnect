import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import {
  Users, Mic2, Award, CalendarDays, CheckSquare, Bell,
  TrendingUp, ArrowUpRight, ShieldCheck, UserCheck, Plus,
  Activity, Server, Database, Sparkles, RefreshCw
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts'
import { getAllStudents } from '@/services/studentService'
import { getAllInterviews } from '@/services/interviewService'
import { getAllCertificates } from '@/services/certificateService'
import { getEvents } from '@/services/eventService'
import { getAllTasks } from '@/services/taskService'
import { getAnnouncements } from '@/services/announcementService'
import { apiRequest } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'

const STATUS_COLORS: Record<string, string> = {
  Scheduled: '#6366f1',
  Confirmed: '#3b82f6',
  Completed: '#10b981',
  Selected: '#059669',
  Rejected: '#ef4444',
  Rescheduled: '#f59e0b',
  Cancelled: '#94a3b8'
}

export default function AdminDashboardPage() {
  const { userProfile, currentUser } = useAuth()
  const [stats, setStats] = useState({
    students: 0,
    interviews: 0,
    certificates: 0,
    events: 0,
    tasks: 0,
    announcements: 0
  })

  const [charts, setCharts] = useState<{
    studentGrowth: any[]
    interviewStatus: any[]
  }>({
    studentGrowth: [],
    interviewStatus: []
  })
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      setRefreshing(true)
      const [stus, ints, certs, evts, tsks, anns, dashData] = await Promise.all([
        getAllStudents(),
        getAllInterviews(),
        getAllCertificates(),
        getEvents(),
        getAllTasks(),
        getAnnouncements(),
        apiRequest<{ metrics: any; charts: any }>('/api/admin/dashboard').catch(() => null)
      ])
      setStats({
        students: stus.length,
        interviews: ints.length,
        certificates: certs.length,
        events: evts.length,
        tasks: tsks.length,
        announcements: anns.length
      })
      if (dashData?.charts) {
        setCharts({
          studentGrowth: dashData.charts.studentGrowth || [],
          interviewStatus: (dashData.charts.interviewStatus || []).map((i: any) => ({
            ...i,
            color: STATUS_COLORS[i.name] || '#3b82f6'
          }))
        })
      }
    } catch (err) {
      console.error('Error fetching admin counts:', err)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in pb-16">
      {/* ── Lookap Obsidian Command Center Hero ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0c0d12] border border-white/10 p-6 md:p-8 text-white shadow-[0_12px_40px_-10px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)]">
        {/* Ambient radial glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Live Status Pill & Spec Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/15 text-[11px] font-mono tracking-wide text-slate-200">
                <span className="spec-dot-emerald" /> COMMAND TELEMETRY
              </span>
              <span className="spec-tag">ACCESS: SUPER ADMIN</span>
              <span className="spec-tag">NODE: POSTGRESQL LIVE</span>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
                University Ambassador Command Center
              </h1>
              <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                Live oversight for student ambassador selection, applicant evaluation pipelines, interview coordination, and cryptographic certificate issuance.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex sm:flex-col lg:flex-row gap-2.5 flex-shrink-0">
            <Button
              variant="tactileDark"
              size="sm"
              onClick={loadData}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh Feeds
            </Button>
            <Link to="/admin/certificates">
              <Button variant="tactile" size="sm" leftIcon={<Award className="w-3.5 h-3.5" />}>
                Issue Certificate
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Lookap 5-Metric Bento Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <Link to="/admin/students" className="group">
          <div className="lookap-card p-4.5 h-full flex flex-col justify-between group-hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                <Users className="w-4 h-4" />
              </div>
              <span className="spec-dot-emerald" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.students.toLocaleString()}</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">Total Students</p>
              <span className="text-[11px] text-emerald-500 font-mono flex items-center gap-1 mt-1.5">
                <Database className="w-2.5 h-2.5" /> Live Records
              </span>
            </div>
          </div>
        </Link>

        <Link to="/admin/interviews" className="group">
          <div className="lookap-card p-4.5 h-full flex flex-col justify-between group-hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                <Mic2 className="w-4 h-4" />
              </div>
              <span className="spec-dot-indigo" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.interviews}</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">Interview Pipeline</p>
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-1.5">
                Scheduled Slots
              </span>
            </div>
          </div>
        </Link>

        <Link to="/admin/certificates" className="group">
          <div className="lookap-card p-4.5 h-full flex flex-col justify-between group-hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Award className="w-4 h-4" />
              </div>
              <span className="spec-dot-emerald" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.certificates.toLocaleString()}</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">Certs Issued</p>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 mt-1.5">
                <ShieldCheck className="w-2.5 h-2.5" /> 100% Verified
              </span>
            </div>
          </div>
        </Link>

        <Link to="/admin/events" className="group">
          <div className="lookap-card p-4.5 h-full flex flex-col justify-between group-hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                <CalendarDays className="w-4 h-4" />
              </div>
              <span className="spec-dot-amber" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.events}</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">Summits & Events</p>
              <span className="text-[11px] text-purple-400 font-mono flex items-center gap-1 mt-1.5">
                Campus Programs
              </span>
            </div>
          </div>
        </Link>

        <Link to="/admin/tasks" className="group">
          <div className="lookap-card p-4.5 h-full flex flex-col justify-between group-hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <CheckSquare className="w-4 h-4" />
              </div>
              <span className="spec-dot-amber" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.tasks}</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">Deliverables</p>
              <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1 mt-1.5">
                Cohort Milestones
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* ── Lookap Telemetry Charts ── */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="lookap-card p-6 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Student Enrollment Trajectory</h2>
                <span className="spec-tag text-[10px]">TIME-SERIES</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Monthly ambassador registrations recorded in PostgreSQL</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
              <span className="spec-dot-emerald" /> LIVE
            </span>
          </div>
          <div className="h-64 w-full">
            {charts.studentGrowth.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                <Database className="w-6 h-6 text-slate-500 mb-2" />
                <span>No registration timeline data recorded yet.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.studentGrowth}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0c0d12',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
                    }}
                  />
                  <Bar dataKey="count" name="Enrolled Students" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pipeline Distribution */}
        <div className="lookap-card p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Interview Pipeline</h2>
              <span className="spec-tag text-[10px]">BREAKDOWN</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Active applicant evaluation stages</p>
          </div>
          <div className="h-48 w-full flex items-center justify-center">
            {charts.interviewStatus.length === 0 ? (
              <div className="text-center p-4 border border-dashed border-white/10 rounded-2xl bg-white/[0.02] w-full h-full flex flex-col items-center justify-center">
                <Mic2 className="w-6 h-6 text-slate-500 mb-2" />
                <p className="text-xs font-semibold text-slate-400">No interviews scheduled</p>
                <p className="text-[10px] text-slate-500 mt-1">Create interviews from the Interviews tab to visualize rounds.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.interviewStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {charts.interviewStatus.map((entry: any) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0c0d12',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {charts.interviewStatus.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-200 dark:border-white/10">
              {charts.interviewStatus.map((item: any) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-mono text-[11px] truncate">{item.name}: <strong className="text-slate-900 dark:text-white">{item.value}</strong></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Lookap Quick Command Actions ── */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/admin/interviews" className="group">
          <div className="lookap-card p-5 flex items-center justify-between group-hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center shadow-sm">
                <Mic2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">Schedule Interview</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Assign meeting slots to students</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>
        </Link>

        <Link to="/admin/certificates" className="group">
          <div className="lookap-card p-5 flex items-center justify-between group-hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shadow-sm">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-400 transition-colors">Issue Certificate</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Generate verified ID and PDF</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>
        </Link>

        <Link to="/admin/announcements" className="group">
          <div className="lookap-card p-5 flex items-center justify-between group-hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/25 text-purple-400 flex items-center justify-center shadow-sm">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-purple-400 transition-colors">Broadcast Alert</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Publish alerts to student feeds</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  )
}
