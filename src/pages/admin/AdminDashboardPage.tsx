import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import {
  Users, Award, Sparkles,
  TrendingUp, ArrowUpRight, ShieldCheck, UserCheck, Plus,
  Activity, Server, Database, RefreshCw, LogIn, Calendar,
  Monitor, Smartphone, Globe, Radio, CheckCircle2, ChevronRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { apiRequest } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'

interface DashboardMetrics {
  totalStudents: number
  activeStudents: number
  todayLogins: number
  totalLogins: number
  totalCertificates: number
  todayCertificates: number
}

interface RecentActivityItem {
  id: string
  student_id?: string
  user_id: string
  studentName?: string
  studentEmail?: string
  login_at: string
  device?: string
  browser?: string
  ip_address?: string
}

export default function AdminDashboardPage() {
  const { userProfile, currentUser } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalStudents: 0,
    activeStudents: 0,
    todayLogins: 0,
    totalLogins: 0,
    totalCertificates: 0,
    todayCertificates: 0
  })

  const [charts, setCharts] = useState<{
    studentGrowth: any[]
  }>({
    studentGrowth: []
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<string>('')

  const loadData = async (silent = false) => {
    try {
      if (!silent) setRefreshing(true)
      const dashData = await apiRequest<{
        metrics: DashboardMetrics
        charts: { studentGrowth: any[] }
        recentActivity: RecentActivityItem[]
      }>('/api/admin/dashboard')

      if (dashData?.metrics) {
        setMetrics(dashData.metrics)
      }
      if (dashData?.charts) {
        setCharts({
          studentGrowth: dashData.charts.studentGrowth || []
        })
      }
      if (dashData?.recentActivity) {
        setRecentActivity(dashData.recentActivity)
      }
      setLastRefreshed(new Date().toLocaleTimeString())
    } catch (err) {
      console.error('Error fetching admin dashboard:', err)
    } finally {
      if (!silent) setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    // Poll telemetry every 25 seconds for real-time overview updates
    const interval = setInterval(() => {
      loadData(true)
    }, 25000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in pb-16">
      {/* ── Lookap Obsidian Command Center Hero ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0c0d12] border border-white/10 p-6 md:p-8 text-white shadow-[0_12px_40px_-10px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)]">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/15 text-[11px] font-mono tracking-wide text-slate-200">
                <span className="spec-dot-emerald" /> COMMAND TELEMETRY
              </span>
              <span className="spec-tag">ACCESS: SUPER ADMIN</span>
              <span className="spec-tag">NODE: POSTGRESQL LIVE</span>
              {lastRefreshed && (
                <span className="text-[10px] text-slate-400 font-mono">
                  Sync: {lastRefreshed}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
                University Ambassador Command Center
              </h1>
              <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                Live oversight for student ambassador profiles, real-time login activity audit, and cryptographic certificate issuance.
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col lg:flex-row gap-2.5 flex-shrink-0">
            <Button
              variant="tactileDark"
              size="sm"
              onClick={() => loadData(false)}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh Feeds
            </Button>
            <Link to="/admin/students">
              <Button variant="tactile" size="sm" leftIcon={<Radio className="w-3.5 h-3.5" />}>
                Live Student Radar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Requirement 17: 6 Real-Time Live Statistics Cards ── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
              Live Ambassador Telemetry
            </h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE SYNC
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">PostgreSQL Verified</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. Total Students */}
          <Link to="/admin/students" className="group">
            <div className="lookap-card p-4 h-full flex flex-col justify-between group-hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
                <span className="spec-dot-emerald" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {metrics.totalStudents.toLocaleString()}
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Total Students</p>
                <span className="text-[10px] text-blue-400 font-mono mt-1.5 block">Enrolled roster</span>
              </div>
            </div>
          </Link>

          {/* 2. Active Students (Online) */}
          <Link to="/admin/students?filter=online" className="group">
            <div className="lookap-card p-4 h-full flex flex-col justify-between group-hover:-translate-y-1 transition-all duration-200 border-emerald-500/30">
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20 animate-pulse" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-emerald-400">
                  {metrics.activeStudents.toLocaleString()}
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Active Students</p>
                <span className="text-[10px] text-emerald-400 font-mono mt-1.5 block">Online past 5m</span>
              </div>
            </div>
          </Link>

          {/* 3. Today's Logins */}
          <Link to="/admin/students?filter=today" className="group">
            <div className="lookap-card p-4 h-full flex flex-col justify-between group-hover:-translate-y-1 transition-all duration-200">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-2">
                <LogIn className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {metrics.todayLogins.toLocaleString()}
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Today's Logins</p>
                <span className="text-[10px] text-amber-400 font-mono mt-1.5 block">Sessions today</span>
              </div>
            </div>
          </Link>

          {/* 4. Total Logins */}
          <div className="lookap-card p-4 h-full flex flex-col justify-between">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 mb-2">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {metrics.totalLogins.toLocaleString()}
              </p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Total Logins</p>
              <span className="text-[10px] text-purple-400 font-mono mt-1.5 block">All-time count</span>
            </div>
          </div>

          {/* 5. Total Certificates */}
          <Link to="/admin/certificates" className="group">
            <div className="lookap-card p-4 h-full flex flex-col justify-between group-hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                  <Award className="w-4 h-4" />
                </div>
                <span className="spec-dot-emerald" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {metrics.totalCertificates.toLocaleString()}
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Total Certificates</p>
                <span className="text-[10px] text-cyan-400 font-mono mt-1.5 block">Issued & valid</span>
              </div>
            </div>
          </Link>

          {/* 6. Certificates Uploaded Today */}
          <Link to="/admin/certificates" className="group">
            <div className="lookap-card p-4 h-full flex flex-col justify-between group-hover:-translate-y-1 transition-all duration-200">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-2">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {metrics.todayCertificates.toLocaleString()}
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Certs Today</p>
                <span className="text-[10px] text-indigo-400 font-mono mt-1.5 block">Added past 24h</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Lookap Telemetry Charts & Recent Activity Feed ── */}
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

        {/* Live Student Login Activity Stream */}
        <div className="lookap-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Logins</h2>
                <span className="spec-tag text-[10px]">AUDIT FEED</span>
              </div>
              <Link to="/admin/students" className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Real-time student authentication log</p>

            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-xl">
                No recent logins recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentActivity.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-white truncate max-w-[140px]">
                        {act.studentName || 'Student'}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {act.login_at ? new Date(act.login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mb-1.5">{act.studentEmail}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span className="inline-flex items-center gap-1">
                        {act.device?.includes('Phone') || act.device?.includes('Android') || act.device?.includes('iOS') ? (
                          <Smartphone className="w-2.5 h-2.5 text-slate-400" />
                        ) : (
                          <Monitor className="w-2.5 h-2.5 text-slate-400" />
                        )}
                        {act.device || 'PC'}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5 text-slate-400" />
                        {act.browser || 'Web'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.08]">
            <Link to="/admin/students">
              <Button variant="outline" size="sm" className="w-full text-xs" leftIcon={<Users className="w-3.5 h-3.5" />}>
                Open Student Radar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/certificates" className="block group">
          <div className="lookap-card p-4 hover:border-emerald-500/40 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-400 transition-colors">Issue Certificates</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Generate or upload student PDFs</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </div>
        </Link>

        <Link to="/admin/students" className="block group">
          <div className="lookap-card p-4 hover:border-blue-500/40 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-400 transition-colors">Student Roster & Activity</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Track online status and audit history</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </div>
        </Link>

        <Link to="/admin/analytics" className="block group">
          <div className="lookap-card p-4 hover:border-purple-500/40 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-purple-400 transition-colors">Deep Analytics</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">System throughput & engagement</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </div>
        </Link>
      </div>
    </div>
  )
}

