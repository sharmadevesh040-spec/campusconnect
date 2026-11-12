import { cn } from '@/lib/utils'

export function Progress({ value = 0, className, color = 'blue' }: { value?: number; className?: string; color?: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500'
  }
  return (
    <div className={cn('h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', colors[color] || 'bg-blue-500')}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
