import { NavLink } from 'react-router-dom'
import { Home, Calendar, CheckSquare, Award, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/certificates', icon: Award, label: 'Certs' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 safe-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              'flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-150 min-w-[3rem]',
              isActive ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-5 h-5', isActive && 'text-blue-500')} />
                <span className={cn('text-[10px] font-medium', isActive ? 'text-blue-500' : 'text-slate-400')}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
