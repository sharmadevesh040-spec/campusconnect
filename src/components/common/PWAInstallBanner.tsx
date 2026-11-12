import { useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { Button } from '@/components/ui/Button'

export function PWAInstallBanner() {
  const { canInstall, install, isIOS } = usePWAInstall()
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('cc-pwa-dismissed') === 'true')
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  if (dismissed) return null
  if (!canInstall && !isIOS) return null

  const dismiss = () => { setDismissed(true); localStorage.setItem('cc-pwa-dismissed', 'true') }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 animate-slide-up">
      <button onClick={dismiss} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" aria-label="Dismiss">
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">📱 Install CampusConnect</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Get faster access to your student dashboard.</p>
          {!showIOSGuide ? (
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={isIOS ? () => setShowIOSGuide(true) : install} leftIcon={<Download className="w-3 h-3" />}>
                Install App
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>Not Now</Button>
            </div>
          ) : (
            <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
              <p className="font-medium mb-1">To install on iPhone/iPad:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-500">
                <li>Tap the Share button <span className="font-mono">⬆</span></li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
                <li>Tap <strong>Add</strong></li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
