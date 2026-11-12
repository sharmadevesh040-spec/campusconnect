import { NavLink, useNavigate } from 'react-router-dom'
import { X, GraduationCap, LayoutDashboard, Calendar, Mic2, CalendarDays, CheckSquare, Award, BookOpen, Bell, User, Bot, LogOut, Settings, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { UserRole } from '@/types/user'
import { cn } from '@/lib/utils'

const STUDENT_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/interviews', icon: Mic2, label: 'Interviews' },
  { to: '/events', icon: CalendarDays, label: 'Events' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/certificates', icon: Award, label: 'Certificates' },
  { to: '/resources', icon: BookOpen, label: 'Resources' },
  { to: '/announcements', icon: Bell, label: 'Announcements' },
  { to: '/assistant', icon: Bot, label: 'AI Assistant' },
]

interface SidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export function Sidebar({ mobile, onClose }: SidebarProps) {
  const { logout, userProfile } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()

  const isAdmin = userProfile?.role === UserRole.ADMIN || userProfile?.role === UserRole.SUPER_ADMIN

  return (
    <aside className={cn(
      'flex flex-col bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 h-full',
      mobile ? 'w-72' : 'hidden md:flex fixed left-0 top-0 bottom-0 w-64 z-30'
    )}>
      {/* Logo */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm shadow-blue-200 dark:shadow-none">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">CampusConnect</p>
            <p className="text-xs text-slate-400">Student Hub</p>
          </div>
        </div>
        {mobile && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        {STUDENT_NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={mobile ? onClose : undefined}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
              isActive
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-5 h-5 flex-shrink-0 transition-colors', isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300')} />
                {item.label}
                {item.label === 'Announcements' && unreadCount > 0 && (
                  <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">{unreadCount}</span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</p>
            </div>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <Shield className="w-5 h-5 text-slate-400" />
              Admin Panel
            </NavLink>
          </>
        )}
      </nav>

      {/* Profile */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-700 space-y-0.5">
        <NavLink
          to="/profile"
          onClick={mobile ? onClose : undefined}
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
            isActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          )}
        >
          {userProfile?.photoURL ? (
            <img src={userProfile.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-slate-400" />
          )}
          <span className="truncate">{userProfile?.fullName || 'Profile'}</span>
        </NavLink>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200 transition-all duration-150"
        >
          <LogOut className="w-5 h-5 text-slate-400" />
          Log Out
        </button>
      </div>
    </aside>
  )
}
