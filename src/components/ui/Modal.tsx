import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, children, size = 'md', footer, className }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleEsc)
        document.body.style.overflow = prevOverflow
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className={cn(
          'relative w-full my-auto max-h-[90vh] flex flex-col bg-white dark:bg-[#0c0d12] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 dark:shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)] z-10 transition-all',
          sizes[size],
          className
        )}
      >
        {/* Header (Pinned) */}
        {title && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/10 flex-shrink-0">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate pr-2">
              {title}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] flex-shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Scrollable Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>

        {/* Optional Footer (Pinned) */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex-shrink-0 rounded-b-3xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

