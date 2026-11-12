import { useState, useEffect, useRef } from 'react'
import { Search, X, Calendar, Award, Mic, FileText, Bell, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

const QUICK_LINKS = [
  { icon: <Calendar className="w-4 h-4" />, label: 'My Calendar', path: '/calendar', category: 'Pages' },
  { icon: <Award className="w-4 h-4" />, label: 'My Certificates', path: '/certificates', category: 'Pages' },
  { icon: <Mic className="w-4 h-4" />, label: 'My Interviews', path: '/interviews', category: 'Pages' },
  { icon: <FileText className="w-4 h-4" />, label: 'My Tasks', path: '/tasks', category: 'Pages' },
  { icon: <Bell className="w-4 h-4" />, label: 'Announcements', path: '/announcements', category: 'Pages' },
  { icon: <BookOpen className="w-4 h-4" />, label: 'Resources', path: '/resources', category: 'Pages' },
]

interface SearchPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchPalette({ isOpen, onClose }: SearchPaletteProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) { setTimeout(() => inputRef.current?.focus(), 100); setQuery('') }
  }, [isOpen])

  const filtered = QUICK_LINKS.filter(l => l.label.toLowerCase().includes(query.toLowerCase()))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4" role="dialog" aria-modal="true" aria-label="Search">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-700">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, interviews, certificates..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-slate-200 dark:border-slate-600 px-1.5 text-[10px] text-slate-400">ESC</kbd>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-2 max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No results for "{query}"</p>
          ) : (
            filtered.map(item => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); onClose() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
              >
                <span className="text-slate-400 group-hover:text-blue-500 transition-colors">{item.icon}</span>
                <span className="text-sm text-slate-700 dark:text-slate-200">{item.label}</span>
                <span className="ml-auto text-xs text-slate-400">{item.category}</span>
              </button>
            ))
          )}
        </div>
        <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-2 flex items-center gap-4 text-xs text-slate-400">
          <span>↵ to navigate</span>
          <span>ESC to close</span>
          <span className="ml-auto">Ctrl+K to search</span>
        </div>
      </div>
    </div>
  )
}
