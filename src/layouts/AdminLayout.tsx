import { Outlet, NavLink, Navigate } from 'react-router-dom'
import {
  Users, Calendar, Award, CalendarDays, CheckSquare, Bell,
  LayoutDashboard, GraduationCap, LogOut, BarChart3, BookOpen,
  ShieldAlert, Activity, ArrowLeft, ShieldCheck, Shield
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'

const AUTHORIZED_ADMIN_EMAIL = 'sharmadevesh040@gmail.com'

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
  const { currentUser, userProfile, logout } = useAuth()
  const email = (userProfile?.email || currentUser?.email)?.toLowerCase().trim()

  // Strict check: Only sharmadevesh040@gmail.com is allowed in the Admin Portal
  if (email !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
    return <Navigate to="/student/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-100 flex relative selection:bg-purple-500 selection:text-white">
      {/* ── Lookap Dark Blueprint Grid & Ambient Vignette ── */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.06),transparent_60%)] z-0" />

      {/* Admin Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-[#0c0d12] border-r border-white/[0.08] flex-col z-30 shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.35)]">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>CampusConnect</span>
                <span className="spec-dot-emerald" />
              </p>
              <p className="text-[10px] font-mono text-purple-300/80 uppercase tracking-wider">Admin Command</p>
            </div>
          </div>
        </div>

        {/* Sole Super Admin Verified Identity Pill */}
        <div className="mx-3 mt-3 p-3 bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-transparent rounded-2xl border border-purple-500/20 shadow-inner">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">DEVESH SHARMA</p>
              <p className="text-[10px] text-zinc-400 font-mono truncate">{email}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              SOLE SUPER ADMIN
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/20 via-purple-600/10 to-transparent text-purple-200 border-l-2 border-purple-400 font-semibold shadow-inner'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="pt-3 border-t border-white/[0.06] mt-3">
            <NavLink
              to="/student/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-purple-400" />
              <span>Switch to Student View</span>
            </NavLink>
          </div>
        </nav>

        {/* Footer Session */}
        <div className="p-3 border-t border-white/[0.08] bg-black/20">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <div className="flex-1 flex flex-col md:pl-64 relative z-10">
        <Header onMenuClick={() => {}} onSearchClick={() => {}} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
