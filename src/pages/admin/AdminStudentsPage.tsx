import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Users, Search, CheckCircle, XCircle, Edit3, Shield, Mail,
  Phone, GraduationCap, Plus, RefreshCw, UserCheck, FileUp, Download,
  AlertTriangle, Check, Monitor, Smartphone, Globe, Calendar, Clock,
  ArrowUpDown, ExternalLink, Award, Eye, History, ShieldCheck, Activity
} from 'lucide-react'
import Papa from 'papaparse'
import {
  getStudentActivity,
  getStudentDetails,
  updateProfile,
  approveStudent,
  disableStudent,
  bulkImportStudents,
  type StudentActivityItem,
  type StudentDetailsResponse
} from '@/services/studentService'
import { toast } from 'sonner'

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'online' | 'active' | 'today' | 'week'>('all')
  const [sort, setSort] = useState<'latest' | 'oldest' | 'name' | 'logins'>('latest')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  // Student Details Modal State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [studentDetails, setStudentDetails] = useState<StudentDetailsResponse | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsTab, setDetailsTab] = useState<'activity' | 'certificates' | 'profile'>('activity')

  // Bulk CSV Import State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [csvContent, setCsvContent] = useState('')
  const [parsedData, setParsedData] = useState<{
    total: number
    valid: any[]
    errors: { row: number; error: string; data: any }[]
  } | null>(null)
  const [importing, setImporting] = useState(false)

  // Load students with activity telemetry
  const loadStudents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await getStudentActivity({ q: search, filter, sort })
      setStudents(data)
      setLastRefreshed(new Date())
    } catch {
      if (!silent) toast.error('Failed to load student activity feeds')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [search, filter, sort])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  // Real-time polling every 20 seconds
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadStudents(true)
      }
    }, 20000)
    return () => clearInterval(interval)
  }, [autoRefresh, loadStudents])

  // Open Student Details Modal & load drilldown telemetry
  const handleOpenStudentDetails = async (studentId: string) => {
    setSelectedStudentId(studentId)
    setLoadingDetails(true)
    setDetailsTab('activity')
    try {
      const details = await getStudentDetails(studentId)
      setStudentDetails(details)
    } catch {
      toast.error('Failed to load student details')
    } finally {
      setLoadingDetails(false)
    }
  }

  // Calculate telemetry counts
  const telemetry = useMemo(() => {
    const total = students.length
    const online = students.filter(s => s.status === 'Online').length
    const startOfToday = new Date().setHours(0, 0, 0, 0)
    const todayLogins = students.filter(s => s.lastLoginAt && new Date(s.lastLoginAt).getTime() >= startOfToday).length
    const totalLogins = students.reduce((sum, s) => sum + (s.loginCount || 0), 0)
    return { total, online, todayLogins, totalLogins }
  }, [students])

  // Helper formatters
  const formatTimeAgo = (dateStr?: string | null) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatExactDateTime = (dateStr?: string | null) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  // CSV Import handlers
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvContent(text)
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  const parseCSV = (text: string) => {
    const result = Papa.parse(text, { header: true, skipEmptyLines: true })
    const rows = result.data as Record<string, string>[]

    const valid: any[] = []
    const errors: { row: number; error: string; data: any }[] = []

    rows.forEach((row, idx) => {
      const name = row.name || row.fullName || row.full_name
      const email = row.email
      const studentId = row.student_id || row.studentId || row.id

      if (!name || !email || !studentId) {
        errors.push({ row: idx + 1, error: 'Missing name, email, or student_id', data: row })
      } else if (!email.includes('@')) {
        errors.push({ row: idx + 1, error: 'Invalid email syntax', data: row })
      } else {
        valid.push({
          name,
          email,
          studentId,
          course: row.course || 'B.Tech',
          branch: row.branch || 'CSE',
          year: parseInt(row.year || '1', 10)
        })
      }
    })

    setParsedData({ total: rows.length, valid, errors })
  }

  const handleBulkSubmit = async () => {
    if (!parsedData || parsedData.valid.length === 0) return
    setImporting(true)
    try {
      const res = await bulkImportStudents(csvContent)
      toast.success(`Successfully imported ${res.importedCount} student accounts!`)
      setIsBulkModalOpen(false)
      setCsvContent('')
      setParsedData(null)
      loadStudents()
    } catch (err: any) {
      toast.error(err.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* ── Lookap Theatrical Command Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0c0d12] border border-white/10 p-6 md:p-8 text-white shadow-[0_12px_40px_-10px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)]">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/15 text-[11px] font-mono tracking-wide text-emerald-300">
                <span className="spec-dot-emerald animate-pulse" /> REALTIME ACTIVE RADAR
              </span>
              <span className="spec-tag">ACCESS: PRIVILEGED ADMIN</span>
              <span className="spec-tag">HEARTBEAT: 5M CADENCE</span>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <span>Student Ambassador Activity & Roster</span>
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </h1>
              <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                Live monitoring of student logins, active device telemetry, browser footprints, and cryptographic certificate allocations.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <Button
              variant="tactileDark"
              size="sm"
              onClick={() => loadStudents()}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Sync Feeds
            </Button>
            <Button
              variant="tactile"
              size="sm"
              onClick={() => setIsBulkModalOpen(true)}
              leftIcon={<FileUp className="w-4 h-4" />}
            >
              Bulk Import CSV
            </Button>
          </div>
        </div>

        {/* Real-time Telemetry Counters Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">TOTAL ENROLLED</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white font-mono mt-1">{telemetry.total}</p>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">ONLINE NOW</span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">{telemetry.online}</p>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">LOGINS TODAY</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-300 font-mono mt-1">{telemetry.todayLogins}</p>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">TOTAL LOGINS</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-300 font-mono mt-1">{telemetry.totalLogins}</p>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Control Bar ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name, email, or student ID..."
            className="pl-10 h-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'online', 'active', 'today', 'week'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                filter === f
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {f === 'all' && 'All Students'}
              {f === 'online' && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              )}
              {f === 'active' && 'Active (24h)'}
              {f === 'today' && 'Today'}
              {f === 'week' && 'This Week'}
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="h-10 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="latest">Latest Login</option>
            <option value="oldest">Oldest Login</option>
            <option value="logins">Highest Logins</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* ── Student Activity Table ── */}
      <Card className="overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Student Ambassador</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Last Login</th>
                <th className="py-3.5 px-4 font-semibold">Last Active</th>
                <th className="py-3.5 px-4 font-semibold">Logins</th>
                <th className="py-3.5 px-4 font-semibold">Device / Browser</th>
                <th className="py-3.5 px-4 font-semibold">Credentials</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading && students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                    Connecting to live telemetry radar...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <EmptyState
                      emoji="🔍"
                      title="No students matched your search/filter"
                      description="Try adjusting your search terms or filters above."
                    />
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const isOnline = student.status === 'Online'
                  const deviceStr = student.device || 'Windows PC'
                  const isMobile = deviceStr.includes('Android') || deviceStr.includes('iPhone') || deviceStr.includes('iPad')

                  return (
                    <tr
                      key={student.id}
                      onClick={() => handleOpenStudentDetails(student.id)}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Student info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name || student.email || 'Student')}`}
                            alt={student.name || student.email || 'Student'}
                            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 object-cover"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                              {student.name || student.email}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                              <span>{student.email}</span>
                              <span>·</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{student.studentId}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Online Status */}
                      <td className="py-3.5 px-4">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Offline
                          </span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {formatTimeAgo(student.lastLoginAt)}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {student.lastLoginAt ? formatExactDateTime(student.lastLoginAt) : 'Never logged in'}
                          </p>
                        </div>
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          <p className="font-medium text-slate-700 dark:text-slate-300">
                            {formatTimeAgo(student.lastActiveAt)}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {student.lastActiveAt ? new Date(student.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </p>
                        </div>
                      </td>

                      {/* Login Count */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {student.loginCount || 0} logins
                        </span>
                      </td>

                      {/* Device & Browser */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                          {isMobile ? (
                            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <Monitor className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span className="font-medium">{student.device || 'Windows PC'}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500 dark:text-slate-400">{student.browser || 'Chrome'}</span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{student.ipAddress || '127.0.0.1'}</p>
                      </td>

                      {/* Credentials */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                          <Award className="w-3 h-3 text-amber-500" />
                          {student.certificatesCount || 0}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenStudentDetails(student.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Student Details Drawer/Modal (Requirement #5 & #19) ── */}
      <Modal
        isOpen={!!selectedStudentId}
        onClose={() => {
          setSelectedStudentId(null)
          setStudentDetails(null)
        }}
        title="Student Ambassador Telemetry Profile"
        size="lg"
      >
        {loadingDetails || !studentDetails ? (
          <div className="py-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
            Loading student details and verified login history...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Identity Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={studentDetails.student.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(studentDetails.student.name)}`}
                  alt={studentDetails.student.name}
                  className="w-14 h-14 rounded-2xl border border-slate-200 dark:border-slate-700 object-cover bg-white"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {studentDetails.student.name}
                    {studentDetails.student.status === 'Online' ? (
                      <Badge variant="success">Online</Badge>
                    ) : (
                      <Badge variant="outline">Offline</Badge>
                    )}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {studentDetails.student.email}</span>
                    <span>·</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">ID: {studentDetails.student.studentId}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {studentDetails.student.course} · {studentDetails.student.branch} (Year {studentDetails.student.year})
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right flex-shrink-0">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">TOTAL LOGINS</p>
                <p className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">{studentDetails.student.loginCount || 0}</p>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-mono text-slate-400 uppercase">REGISTERED</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {studentDetails.student.createdAt ? new Date(studentDetails.student.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-mono text-slate-400 uppercase">LAST LOGIN</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {formatExactDateTime(studentDetails.student.lastLoginAt)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-mono text-slate-400 uppercase">LAST ACTIVE</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {formatTimeAgo(studentDetails.student.lastActiveAt)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-mono text-slate-400 uppercase">CERTIFICATES</p>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                  {studentDetails.certificates.length} Issued
                </p>
              </div>
            </div>

            {/* Navigation Tabs inside modal */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setDetailsTab('activity')}
                className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  detailsTab === 'activity'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Login History ({studentDetails.loginHistory.length})
              </button>
              <button
                onClick={() => setDetailsTab('certificates')}
                className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  detailsTab === 'certificates'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Certificates ({studentDetails.certificates.length})
              </button>
              <button
                onClick={() => setDetailsTab('profile')}
                className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  detailsTab === 'profile'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Academic Profile
              </button>
            </div>

            {/* TAB 1: Login History Table (Requirement #19) */}
            {detailsTab === 'activity' && (
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-semibold uppercase text-slate-500 tracking-wider">
                  Authentication & Session Audit Trail
                </h4>
                {studentDetails.loginHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No recorded login activity sessions yet.</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-500 uppercase sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Date & Time</th>
                          <th className="py-2.5 px-3">Device</th>
                          <th className="py-2.5 px-3">Browser</th>
                          <th className="py-2.5 px-3">IP Address</th>
                          <th className="py-2.5 px-3">Session</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {studentDetails.loginHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                              {formatExactDateTime(item.loginAt)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{item.device}</td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{item.browser}</td>
                            <td className="py-2.5 px-3 text-slate-400">{item.ipAddress}</td>
                            <td className="py-2.5 px-3">
                              {item.logoutAt ? (
                                <span className="text-[10px] text-slate-400">Ended</span>
                              ) : (
                                <span className="text-[10px] text-emerald-500 font-bold">Active</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Certificates List */}
            {detailsTab === 'certificates' && (
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-semibold uppercase text-slate-500 tracking-wider">
                  Cryptographic Credentials Issued
                </h4>
                {studentDetails.certificates.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No certificates issued to this student yet.</p>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto">
                    {studentDetails.certificates.map((cert) => (
                      <div
                        key={cert.id}
                        className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <Award className="w-8 h-8 text-amber-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{cert.title || cert.certificateName}</p>
                            <p className="text-[11px] font-mono text-slate-500">ID: {cert.certificateId} · Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <a
                          href={cert.fileUrl || `/api/student/certificates/${cert.certificateId}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download PDF
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Academic Profile Info */}
            {detailsTab === 'profile' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <span className="text-slate-400 font-mono text-[10px] uppercase">UNIVERSITY</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{studentDetails.student.university}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-mono text-[10px] uppercase">COLLEGE / FACULTY</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{studentDetails.student.college}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-mono text-[10px] uppercase">DEGREE & BRANCH</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{studentDetails.student.course} ({studentDetails.student.branch})</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-mono text-[10px] uppercase">PHONE NUMBER</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{studentDetails.student.phone || 'Not provided'}</p>
                  </div>
                </div>

                {studentDetails.student.bio && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-mono text-[10px] uppercase">BIO / STATEMENT</span>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{studentDetails.student.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Bulk Import CSV Modal ── */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => {
          setIsBulkModalOpen(false)
          setCsvContent('')
          setParsedData(null)
        }}
        title="Bulk Import Student Ambassadors"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Upload a standard CSV file with headers: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">name, email, student_id, course, branch, year</code>.
          </p>

          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {parsedData && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Total records found:</span>
                <span className="font-bold">{parsedData.total}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Valid rows:</span>
                <span className="font-bold">{parsedData.valid.length}</span>
              </div>
              {parsedData.errors.length > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Errors found:</span>
                  <span className="font-bold">{parsedData.errors.length}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsBulkModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="tactile"
              size="sm"
              disabled={!parsedData || parsedData.valid.length === 0 || importing}
              onClick={handleBulkSubmit}
            >
              {importing ? 'Importing Accounts...' : `Import ${parsedData?.valid.length || 0} Students`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
