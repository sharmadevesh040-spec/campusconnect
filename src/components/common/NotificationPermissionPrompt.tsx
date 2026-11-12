import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

export function NotificationPermissionPrompt() {
  const [show, setShow] = useState(() => {
    if (typeof Notification === 'undefined') return false
    if (Notification.permission !== 'default') return false
    return localStorage.getItem('cc-notif-prompted') !== 'true'
  })

  if (!show) return null

  const enable = async () => {
    localStorage.setItem('cc-notif-prompted', 'true')
    setShow(false)
    const perm = await Notification.requestPermission()
    if (perm === 'granted') toast.success('Notifications enabled! You will receive interview and event reminders.')
  }
  const dismiss = () => { localStorage.setItem('cc-notif-prompted', 'true'); setShow(false) }

  return (
    <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-6 md:right-auto md:w-80 z-30 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 animate-slide-up">
      <button onClick={dismiss} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-4 h-4" /></button>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Stay updated</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Get reminders for interviews, events and deadlines.</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={enable}>Enable Notifications</Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>Later</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
