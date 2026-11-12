import { Outlet, NavLink } from 'react-router-dom'
import {
  Users, Calendar, Award, CalendarDays, CheckSquare, Bell,
  LayoutDashboard, GraduationCap, LogOut, BarChart3, BookOpen,
  ShieldAlert, Activity, ArrowLeft
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'

const NAV = [
  { to: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
  { to: '/admin/analytics', icon: <BarChart3 className="w-4 h-4" />, label: 'Analytics' },
  { to: '/admin/students', icon: <Users className="w-4 h-4" />, label: 'Students' },
  { to: '/admin/interviews', icon: <Calendar className="w-4 h-4" />, label: 'Interviews' },
  { to: '/admin/certificates', icon: <Award className="w-4 h-4" />, label: 'Certificates' },
  { to: '/admin/events', icon: <CalendarDays className="w-4 h-4" />, label: 'Events' },
  { to: '/admin/tasks', icon: <CheckSquare className="w-4 h-4" />, label: 'Tasks' },
  { to: '/admin/announcements', icon: <Bell className="w-4 h-4" />, label: 'Announcements' },
  { to: '/admin/resources', icon: <BookOpen className="w-4 h-4" />, label: 'Resources' },
  { to: '/admin/admins', icon: <ShieldAlert className="w-4 h-4" />, label: 'Admins' },
  { to: '/admin/audit-logs', icon: <Activity className="w-4 h-4" />, label: 'Audit Logs' },
]

export default function AdminLayout() {
  const { logout } = useAuth()
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-900 dark:bg-slate-950 flex-col z-30">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">CampusConnect</p>
              <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}

          <div className="pt-4 border-t border-slate-800 mt-4">
            <NavLink
              to="/student/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-blue-400" />
              Switch to Student View
            </NavLink>
          </div>
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 w-full transition-colors">
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:pl-64">
        <Header onMenuClick={() => {}} onSearchClick={() => {}} />
        <main className="flex-1 p-4 md:p-6 overflow-auto"><Outlet /></main>
      </div>
    </div>
  )
}
