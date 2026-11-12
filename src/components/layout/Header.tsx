import { Menu, Search, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuClick: () => void
  onSearchClick: () => void
}

export function Header({ onMenuClick, onSearchClick }: HeaderProps) {
  const { userProfile } = useAuth()
  const { unreadCount } = useNotifications()

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60 px-4 md:px-6 py-3 flex items-center gap-3">
      {/* Mobile menu */}
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden" aria-label="Open menu">
        <Menu className="w-5 h-5" />
      </Button>

      {/* Search bar */}
      <button
        onClick={onSearchClick}
        className="flex-1 md:flex-none md:w-64 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
        aria-label="Search (Ctrl+K)"
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span className="hidden sm:block">Search...</span>
        <kbd className="hidden md:inline-flex ml-auto h-5 items-center rounded border border-slate-300 dark:border-slate-500 px-1.5 text-[10px] text-slate-400">⌘K</kbd>
      </button>

      <div className="flex items-center gap-1 ml-auto">
        <ThemeToggle />

        {/* Notifications */}
        <Link to="/notifications">
          <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}>
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        {/* Avatar */}
        <Link to="/profile" className="ml-1">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden ring-2 ring-blue-100 dark:ring-blue-900/30 hover:ring-blue-300 transition-all">
            {userProfile?.photoURL
              ? <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
              : <span className="text-xs font-semibold text-white">{(userProfile?.fullName || 'U')[0].toUpperCase()}</span>
            }
          </div>
        </Link>
      </div>
    </header>
  )
}
