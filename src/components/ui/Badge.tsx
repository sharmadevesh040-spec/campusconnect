import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'blueprint' | 'pillGlow'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  outline: 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  blueprint: 'font-mono text-[10px] uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700 px-2 py-0.5 rounded-md font-semibold',
  pillGlow: 'bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 shadow-[0_2px_8px_rgba(0,0,0,0.06)] px-3 py-1 font-medium'
}

export function Badge({ variant = 'default', className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)} {...props} />
}
