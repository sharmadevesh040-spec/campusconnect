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
}

export function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div className={cn('relative w-full bg-white dark:bg-[#0c0d12] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 dark:shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)]', sizes[size])}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-white/[0.08]"><X className="w-4 h-4" /></Button>
          </div>
        )}
        <div className="p-6">{children}</div>
        {footer && <div className="p-6 pt-0">{footer}</div>}
      </div>
    </div>
  )
}
