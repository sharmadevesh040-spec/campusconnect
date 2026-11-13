import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { lookapAudio } from '@/lib/audioFeedback'

export function LookapScrollManager() {
  const location = useLocation()
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const lenis = new Lenis({
      duration: prefersReducedMotion ? 0.01 : 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: !prefersReducedMotion,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.35,
      autoRaf: false
    })

    lenisRef.current = lenis

    // Bind scroll events to Lookap Audio Synthesizer
    const onScroll = (e: any) => {
      lookapAudio.handleScroll(e.scroll ?? window.scrollY, e.velocity ?? 0)
    }

    lenis.on('scroll', onScroll)

    let rafId: number
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    // Fallback wheel listener to ensure audio clicks trigger even on non-window scrollable cards
    let lastWheelTime = 0
    const onWheel = (e: WheelEvent) => {
      const now = performance.now()
      if (now - lastWheelTime > 30) {
        lastWheelTime = now
        const dir = e.deltaY > 0 ? 'down' : 'up'
        const vel = Math.min(Math.abs(e.deltaY) / 100, 2)
        lookapAudio.playMechanicalClick(dir, vel)
      }
    }
    window.addEventListener('wheel', onWheel, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('wheel', onWheel)
      lenis.off('scroll', onScroll)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // Reset scroll to top on page navigation
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [location.pathname])

  return null
}
