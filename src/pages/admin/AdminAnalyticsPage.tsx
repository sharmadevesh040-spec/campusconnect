import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  TrendingUp, Users, Award, Sparkles, ShieldCheck,
  BarChart3, RefreshCw
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, LineChart, Line
} from 'recharts'
import { apiRequest } from '@/services/api'

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await apiRequest('/api/admin/dashboard')
      setData(res)
    } catch {
      // Fallback
      setData({
        metrics: {
          totalStudents: 0,
          certificatesIssued: 0,
          upcomingEvents: 0,
          activeBadges: 0
        },
        charts: {
          studentGrowth: [],
          certificateTypes: []
        }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Program Analytics & Growth Metrics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cross-cohort student growth, cryptographic certificate distribution, and campus event engagement.
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Refresh Metrics
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Students</span>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{data?.metrics?.totalStudents ?? 0}</p>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Certificates Issued</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{data?.metrics?.certificatesIssued ?? 0}</p>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upcoming Events</span>
          <p className="text-2xl font-black text-purple-600 mt-1">{data?.metrics?.upcomingEvents ?? 0}</p>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Digital Badges</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{data?.metrics?.totalStudents ?? 0}</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Student Cohort Growth (2026)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.charts?.studentGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Certificates & Event Engagement</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { category: 'Students', count: data?.metrics?.totalStudents ?? 0 },
                { category: 'Certificates', count: data?.metrics?.certificatesIssued ?? 0 },
                { category: 'Events', count: data?.metrics?.upcomingEvents ?? 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="category" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
