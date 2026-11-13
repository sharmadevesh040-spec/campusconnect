import { NavLink, useNavigate } from 'react-router-dom'
import {
  X, GraduationCap, LayoutDashboard, Calendar, Mic2, CalendarDays,
  CheckSquare, Award, BookOpen, Bell, User, LogOut, Settings, Shield, Sparkles
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { UserRole } from '@/types/user'
import { cn } from '@/lib/utils'

const STUDENT_NAV = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/student/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/student/interviews', icon: Mic2, label: 'Interviews' },
  { to: '/student/interview-prep', icon: Sparkles, label: 'Interview Guide' },
  { to: '/student/events', icon: CalendarDays, label: 'Events' },
  { to: '/student/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/student/certificates', icon: Award, label: 'Certificates' },
  { to: '/student/resources', icon: BookOpen, label: 'Resources' },
  { to: '/student/announcements', icon: Bell, label: 'Announcements' },
]

interface SidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export function Sidebar({ mobile, onClose }: SidebarProps) {
  const { logout, currentUser, userProfile } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()

  const isDesignatedAdmin = (userProfile?.email || currentUser?.email)?.toLowerCase().trim() === 'sharmadevesh040@gmail.com' &&
    (userProfile?.role === UserRole.ADMIN || userProfile?.role === UserRole.SUPER_ADMIN)

  return (
    <aside className={cn(
      'flex flex-col bg-[#0c0d12] border-r border-white/[0.08] text-slate-300 h-full select-none shadow-2xl',
      mobile ? 'w-72' : 'hidden md:flex fixed left-0 top-0 bottom-0 w-64 z-30'
    )}>
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.35)]">
            <GraduationCap className="w-5 h-5 text-black" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>CampusConnect</span>
              <span className="spec-dot-emerald" />
            </p>
            <p className="text-[10px] font-mono text-amber-200/70 uppercase tracking-wider">Ambassador OS</p>
          </div>
        </div>
        {mobile && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-1">
        {STUDENT_NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={mobile ? onClose : undefined}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 group relative',
              isActive
                ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent text-amber-200 border-l-2 border-amber-400 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-4 h-4 flex-shrink-0 transition-colors', isActive ? 'text-amber-300' : 'text-slate-500 group-hover:text-slate-300')} />
                <span className="truncate">{item.label}</span>
                {item.label === 'Announcements' && unreadCount > 0 && (
                  <span className="ml-auto bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[1.25rem] text-center font-mono">
                    {unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {isDesignatedAdmin && (
          <div className="pt-3">
            <div className="px-3 pb-1.5">
              <span className="text-[10px] font-mono text-purple-400/80 uppercase tracking-widest flex items-center gap-1">
                <Shield className="w-3 h-3" /> Command
              </span>
            </div>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200',
                isActive
                  ? 'bg-purple-950/40 text-purple-300 border-l-2 border-purple-400 font-semibold shadow-inner'
                  : 'text-purple-300/80 hover:bg-purple-950/30 hover:text-purple-200'
              )}
            >
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Admin Portal</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Profile & Session Footer */}
      <div className="p-3 border-t border-white/[0.08] bg-black/20 space-y-1">
        <NavLink
          to="/profile"
          onClick={mobile ? onClose : undefined}
          className={({ isActive }) => cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150',
            isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
          )}
        >
          {userProfile?.photoURL ? (
            <img src={userProfile.photoURL} alt="" className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-slate-300" />
            </div>
          )}
          <div className="flex-1 truncate">
            <p className="truncate text-white font-medium">{userProfile?.fullName || 'My Account'}</p>
            <p className="text-[10px] font-mono text-zinc-500 truncate">{userProfile?.studentId || 'GSA-2026'}</p>
          </div>
        </NavLink>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
