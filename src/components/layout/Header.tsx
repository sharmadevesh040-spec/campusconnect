import { Menu, Search, Bell, Shield, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { UserRole } from '@/types/user'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuClick: () => void
  onSearchClick: () => void
}

export function Header({ onMenuClick, onSearchClick }: HeaderProps) {
  const { currentUser, userProfile } = useAuth()
  const { unreadCount } = useNotifications()

  const isDesignatedAdmin = (userProfile?.email || currentUser?.email)?.toLowerCase().trim() === 'sharmadevesh040@gmail.com' &&
    (userProfile?.role === UserRole.ADMIN || userProfile?.role === UserRole.SUPER_ADMIN)

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-[#0c0d12]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.08] px-4 md:px-6 py-3 flex items-center gap-3 transition-colors shadow-sm">
      {/* Mobile menu */}
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden" aria-label="Open menu">
        <Menu className="w-5 h-5" />
      </Button>

      {/* Search bar */}
      <button
        onClick={onSearchClick}
        className="flex-1 md:flex-none md:w-64 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-400 hover:bg-slate-200/80 dark:hover:bg-white/[0.08] transition-colors text-xs font-mono"
        aria-label="Search (Ctrl+K)"
      >
        <Search className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
        <span className="hidden sm:block text-slate-500 dark:text-slate-400">Search telemetry...</span>
        <kbd className="hidden md:inline-flex ml-auto h-4 items-center rounded border border-slate-300 dark:border-white/20 px-1 text-[9px] text-slate-400">⌘K</kbd>
      </button>

      {/* Center Spec Tag for desktop */}
      <div className="hidden lg:flex items-center gap-2 ml-2">
        <span className="spec-tag text-[10px]">
          <span className="spec-dot-emerald" /> CAMPUS OS v2.4
        </span>
      </div>

      <div className="flex items-center gap-2.5 ml-auto">
        {/* Admin Shortcut for Designated Admin */}
        {isDesignatedAdmin && (
          <Link to="/admin/dashboard">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-b from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-medium text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(147,51,234,0.3)] border border-purple-400/30 transition-all active:translate-y-[1px]"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          </Link>
        )}

        <ThemeToggle />

        {/* Notifications */}
        <Link to="/notifications">
          <Button variant="ghost" size="icon" className="relative w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06]" aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}>
            <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute 1.5 top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0c0d12]" />
            )}
          </Button>
        </Link>

        {/* Avatar */}
        <Link to="/profile" className="ml-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center overflow-hidden ring-2 ring-blue-500/20 shadow-sm hover:ring-blue-500/50 transition-all">
            {userProfile?.photoURL
              ? <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
              : <span className="text-xs font-bold text-white">{(userProfile?.fullName || 'U')[0].toUpperCase()}</span>
            }
          </div>
        </Link>
      </div>
    </header>
  )
}
