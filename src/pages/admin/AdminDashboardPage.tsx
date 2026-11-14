import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import {
  Users, Award, Sparkles,
  TrendingUp, ArrowUpRight, ShieldCheck, UserCheck, Plus,
  Activity, Server, Database, RefreshCw
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { getAllStudents } from '@/services/studentService'
import { getAllCertificates } from '@/services/certificateService'
import { getEvents } from '@/services/eventService'
import { apiRequest } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'

export default function AdminDashboardPage() {
  const { userProfile, currentUser } = useAuth()
  const [stats, setStats] = useState({
    students: 0,
    certificates: 0,
    events: 0
  })

  const [charts, setCharts] = useState<{
    studentGrowth: any[]
  }>({
    studentGrowth: []
  })
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      setRefreshing(true)
      const [stus, certs, evts, dashData] = await Promise.all([
        getAllStudents(),
        getAllCertificates(),
        getEvents(),
        apiRequest<{ metrics: any; charts: any }>('/api/admin/dashboard').catch(() => null)
      ])
      setStats({
        students: stus.length,
        certificates: certs.length,
        events: evts.length
      })
      if (dashData?.charts) {
        setCharts({
          studentGrowth: dashData.charts.studentGrowth || []
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
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
                University Ambassador Command Center
              </h1>
              <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                Live oversight for student ambassador profiles, campus event registrations, and cryptographic certificate issuance.
              </p>
            </div>
          </div>

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

      {/* ── Lookap 3-Metric Bento Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/admin/students" className="group">
          <div className="lookap-card p-5 h-full flex flex-col justify-between group-hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="spec-dot-emerald" />
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.students.toLocaleString()}</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">Total Enrolled Students</p>
              <span className="text-[11px] text-emerald-500 font-mono flex items-center gap-1 mt-2">
                <Database className="w-2.5 h-2.5" /> Active Ambassador Records
              </span>
            </div>
          </div>
        </Link>

        <Link to="/admin/certificates" className="group">
          <div className="lookap-card p-5 h-full flex flex-col justify-between group-hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Award className="w-5 h-5" />
              </div>
              <span className="spec-dot-emerald" />
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.certificates.toLocaleString()}</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">Verified Certificates</p>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 mt-2">
                <ShieldCheck className="w-2.5 h-2.5" /> 100% Cryptographically Signed
              </span>
            </div>
          </div>
        </Link>

        <Link to="/admin/events" className="group">
          <div className="lookap-card p-5 h-full flex flex-col justify-between group-hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="spec-dot-amber" />
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.events}</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">Campus Summits & Events</p>
              <span className="text-[11px] text-purple-400 font-mono flex items-center gap-1 mt-2">
                University Programs
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

        {/* Quick Command Actions Box */}
        <div className="lookap-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Admin Actions</h2>
              <span className="spec-tag text-[10px]">SHORTCUTS</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Direct shortcuts to critical workflows</p>

            <div className="space-y-3">
              <Link to="/admin/certificates" className="block">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">Issue Certificate</p>
                      <p className="text-[10px] text-slate-400">Generate verified PDF</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                </div>
              </Link>

              <Link to="/admin/students" className="block">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-blue-500/40 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">Student Roster</p>
                      <p className="text-[10px] text-slate-400">Manage ambassadors</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                </div>
              </Link>

              <Link to="/admin/events" className="block">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">Campus Events</p>
                      <p className="text-[10px] text-slate-400">Post event schedules</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                </div>
              </Link>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.08]">
            <Link to="/admin/analytics">
              <Button variant="outline" size="sm" className="w-full text-xs" leftIcon={<Activity className="w-3.5 h-3.5" />}>
                View Detailed Analytics
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
