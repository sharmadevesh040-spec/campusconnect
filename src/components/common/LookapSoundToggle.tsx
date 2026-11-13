import { useState, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { lookapAudio } from '@/lib/audioFeedback'
import { Button } from '@/components/ui/Button'

export function LookapSoundToggle() {
  const [enabled, setEnabled] = useState(lookapAudio.isEnabled())

  useEffect(() => {
    const handleChanged = (e: any) => {
      if (e.detail?.enabled !== undefined) {
        setEnabled(e.detail.enabled)
      }
    }
    window.addEventListener('lookap_sound_changed', handleChanged)
    return () => window.removeEventListener('lookap_sound_changed', handleChanged)
  }, [])

  const handleToggle = () => {
    const nextState = lookapAudio.toggle()
    setEnabled(nextState)
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all duration-200 active:scale-95 ${
        enabled
          ? 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/25 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
          : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-zinc-400'
      }`}
      title={enabled ? 'Mechanical Scroll Sound: ON (Click to mute)' : 'Mechanical Scroll Sound: MUTED (Click to enable)'}
      aria-label="Toggle Lookap scrolling sound"
    >
      {enabled ? (
        <>
          <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="hidden sm:inline text-[11px] font-medium tracking-tight">AUDIO ON</span>
        </>
      ) : (
        <>
          <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
          <span className="hidden sm:inline text-[11px] font-medium tracking-tight text-zinc-500">MUTED</span>
        </>
      )}
    </button>
  )
}
