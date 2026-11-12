import { Outlet, NavLink } from 'react-router-dom'
import { Users, Calendar, Award, CalendarDays, CheckSquare, Bell, LayoutDashboard, GraduationCap, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'

const NAV = [
  { to: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
  { to: '/admin/students', icon: <Users className="w-5 h-5" />, label: 'Students' },
  { to: '/admin/interviews', icon: <Calendar className="w-5 h-5" />, label: 'Interviews' },
  { to: '/admin/certificates', icon: <Award className="w-5 h-5" />, label: 'Certificates' },
  { to: '/admin/events', icon: <CalendarDays className="w-5 h-5" />, label: 'Events' },
  { to: '/admin/tasks', icon: <CheckSquare className="w-5 h-5" />, label: 'Tasks' },
  { to: '/admin/announcements', icon: <Bell className="w-5 h-5" />, label: 'Announcements' },
]

export default function AdminLayout() {
  const { logout } = useAuth()
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-900 dark:bg-slate-950 flex-col z-30">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">CampusConnect</p>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 w-full transition-colors">
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col md:pl-64">
        <Header onMenuClick={() => {}} onSearchClick={() => {}} />
        <main className="flex-1 p-6 overflow-auto"><Outlet /></main>
      </div>
    </div>
  )
}
