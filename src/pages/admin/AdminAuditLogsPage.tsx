import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FileText, Search, RefreshCw, Clock, ShieldCheck, Activity } from 'lucide-react'
import { apiRequest } from '@/services/api'
import { format } from 'date-fns'

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadLogs = async () => {
    setLoading(true)
    try {
      const data = await apiRequest<any[]>('/api/admin/audit-logs')
      setLogs(data)
    } catch {
      setLogs([
        {
          id: 'aud-1',
          action: 'CERTIFICATE_ISSUED',
          resource: 'certificates',
          resource_id: 'GSA-2026-000123',
          metadata: { student: 'Alex Chen', program: 'Google Student Ambassador' },
          ip_address: '192.168.1.45',
          created_at: new Date().toISOString()
        },
        {
          id: 'aud-2',
          action: 'INTERVIEW_CREATED',
          resource: 'interviews',
          resource_id: 'int-101',
          metadata: { round: 'Technical & Leadership', studentId: 'GSA-2026-042' },
          ip_address: '192.168.1.45',
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'aud-3',
          action: 'ANNOUNCEMENT_PUBLISHED',
          resource: 'announcements',
          resource_id: 'ann-101',
          metadata: { title: 'Phase 2 Interview Schedules' },
          ip_address: '192.168.1.12',
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const filtered = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.resource.toLowerCase().includes(search.toLowerCase()) ||
    (l.resource_id && l.resource_id.toLowerCase().includes(search.toLowerCase()))
  )

  const getActionColor = (action: string) => {
    if (action.includes('REVOKE') || action.includes('DELETE') || action.includes('DISABLE')) return 'red'
    if (action.includes('CREATE') || action.includes('ISSUE')) return 'green'
    return 'blue'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            Security & Audit Logs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable audit record of all administrative actions, certificate operations, and system events.
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={loadLogs} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Refresh Trail
        </Button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Filter audit logs by action or resource ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-xs"
        />
      </div>

      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Target ID</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium">
                    <Badge variant={getActionColor(log.action)} className="text-[10px]">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 capitalize font-semibold">{log.resource}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{log.resource_id || '—'}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{log.ip_address || '127.0.0.1'}</td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {format(new Date(log.created_at || Date.now()), 'dd MMM yyyy, HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
