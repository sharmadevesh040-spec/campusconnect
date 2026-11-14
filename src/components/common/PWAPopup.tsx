import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, X, Smartphone, Sparkles, ShieldCheck, Zap, 
  Share, PlusSquare, CheckCircle2, ChevronRight, Award
} from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export default function PWAPopup() {
  const { hasNativePrompt, isInstalled, isIOS, install } = usePWAInstall()
  const [isOpen, setIsOpen] = useState(false)
  const [showIOSSteps, setShowIOSSteps] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // If running in standalone PWA window, never show
    if (isInstalled) return

    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('cc_pwa_popup_dismissed')
    if (dismissed === 'true') return

    // Show popup 1.2 seconds after link is opened
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 1200)

    return () => clearTimeout(timer)
  }, [isInstalled])

  const handleDismiss = () => {
    setIsOpen(false)
    sessionStorage.setItem('cc_pwa_popup_dismissed', 'true')
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSSteps(true)
      return
    }

    if (hasNativePrompt) {
      setInstalling(true)
      try {
        const accepted = await install()
        if (accepted) {
          setIsOpen(false)
        }
      } finally {
        setInstalling(false)
      }
    } else {
      // For desktop or browsers without deferred prompt, show step guide
      setShowIOSSteps(true)
    }
  }

  if (isInstalled || !isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-end sm:items-center justify-center p-3 sm:p-4">
          {/* Subtle backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
          />

          {/* Lookap Obsidian PWA Card */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            className="relative w-full max-w-md pointer-events-auto overflow-hidden rounded-3xl bg-[#111115]/95 border border-white/15 p-5 sm:p-6 text-white shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl"
          >
            {/* Top decorative gradient glow */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Header / Identity */}
            <div className="flex items-start gap-3.5 mb-4 pr-6">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-[1.5px] shadow-[0_0_20px_rgba(245,158,11,0.35)]">
                  <div className="w-full h-full rounded-[14px] bg-[#141418] flex items-center justify-center">
                    <Award className="w-6 h-6 text-amber-300" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#111115] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold tracking-tight text-white">
                    Install CampusConnect
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-semibold">
                    APP
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Official Student Ambassador Registry
                </p>
              </div>
            </div>

            {!showIOSSteps ? (
              <>
                {/* Feature highlights */}
                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-zinc-300">
                    <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span><strong>0ms Fast Launch</strong> — Instant home screen access</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-zinc-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span><strong>Offline Certificates</strong> — View & download without internet</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-zinc-300">
                    <Smartphone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span><strong>Digital Student ID</strong> — Interactive verified badge reader</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    onClick={handleInstallClick}
                    disabled={installing}
                    className="flex-1 py-3 px-4 rounded-2xl font-semibold text-xs text-zinc-950 bg-gradient-to-b from-[#f5f5f7] via-[#d4d4d8] to-[#9999a1] hover:brightness-105 active:scale-[0.98] transition-all shadow-[inset_0_1.5px_0_rgba(255,255,255,0.9),0_6px_20px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{installing ? 'Launching Install...' : (isIOS ? 'How to Install on iPhone' : 'Install CampusConnect App')}</span>
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="py-3 px-4 rounded-2xl text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                  >
                    Maybe Later
                  </button>
                </div>
              </>
            ) : (
              /* iOS / Desktop Manual Add Guide */
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                  <p className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {isIOS ? 'Install on iPhone & iPad:' : 'Install on Desktop / Other Browser:'}
                  </p>
                  {isIOS ? (
                    <ol className="space-y-2 mt-2 text-zinc-300 text-[11px]">
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">1</span>
                        <span>Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> at bottom of Safari</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">2</span>
                        <span>Scroll down & tap <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" /></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">3</span>
                        <span>Tap <strong>Add</strong> in the top-right corner</span>
                      </li>
                    </ol>
                  ) : (
                    <div className="space-y-1.5 mt-2 text-zinc-300 text-[11px]">
                      <p>1. Look for the <strong>Install App</strong> icon (💻 or ➕) on the right side of your browser address bar.</p>
                      <p>2. Click <strong>Install</strong> to add CampusConnect directly to your desktop or taskbar.</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowIOSSteps(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-zinc-950 bg-gradient-to-b from-[#f5f5f7] via-[#d4d4d8] to-[#9999a1] hover:brightness-105 transition-all"
                  >
                    Got It
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
