import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from './LoadingSpinner'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'tactile' | 'tactileSilver' | 'tactileDark'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variants = {
  primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-none',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200',
  outline: 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200',
  ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-200 dark:shadow-none',
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm',
  tactile: 'bg-blue-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_4px_rgba(37,99,235,0.3),0_6px_14px_rgba(37,99,235,0.25)] hover:bg-blue-500 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_8px_rgba(37,99,235,0.35),0_10px_20px_rgba(37,99,235,0.3)] active:translate-y-[1px] border border-blue-400/30',
  tactileSilver: 'bg-gradient-to-b from-[#fbfbfb] via-[#e5e5e5] to-[#c0c0c0] text-slate-900 font-semibold shadow-[inset_0_1px_0_#ffffff,inset_0_-1px_0_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.1),0_8px_20px_rgba(0,0,0,0.08)] hover:from-[#ffffff] hover:via-[#ececec] hover:to-[#c8c8c8] active:translate-y-[1px] border border-white/70',
  tactileDark: 'bg-gradient-to-b from-[#242429] via-[#16161a] to-[#0d0d10] text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.4),0_8px_20px_rgba(0,0,0,0.3)] hover:from-[#2c2c33] hover:via-[#1c1c22] hover:to-[#121216] active:translate-y-[1px] border border-white/10'
}
const sizes = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2',
  icon: 'h-10 w-10 rounded-xl'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {loading ? <LoadingSpinner size="sm" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
)
Button.displayName = 'Button'
