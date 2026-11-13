/**
 * Lookap Tactile Audio Engine
 * Precision Web Audio synthesizer simulating machined metal detents, rotary encoder clicks,
 * and haptic scrolling feedback without external audio files.
 */

class LookapAudioEngine {
  private ctx: AudioContext | null = null
  private enabled: boolean = true
  private lastClickTime: number = 0
  private lastScrollY: number = 0
  private accumulatedDelta: number = 0
  private readonly TICK_DISTANCE: number = 38 // Distance in px per mechanical detent click

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lookap_sound_fx')
      this.enabled = stored !== null ? stored === 'true' : true
      this.initInteractionUnlock()
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
  }

  private initInteractionUnlock() {
    const unlock = () => {
      this.initContext()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('wheel', unlock)
    }
    window.addEventListener('pointerdown', unlock, { once: true, passive: true })
    window.addEventListener('keydown', unlock, { once: true, passive: true })
    window.addEventListener('wheel', unlock, { once: true, passive: true })
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public setEnabled(val: boolean) {
    this.enabled = val
    if (typeof window !== 'undefined') {
      localStorage.setItem('lookap_sound_fx', String(val))
      window.dispatchEvent(new CustomEvent('lookap_sound_changed', { detail: { enabled: val } }))
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled)
    if (this.enabled) {
      this.playMechanicalClick('up', 1)
    }
    return this.enabled
  }

  /**
   * Synthesize a precision mechanical rotary tick
   * @param direction 'up' | 'down'
   * @param velocity 0 to 2
   */
  public playMechanicalClick(direction: 'up' | 'down' = 'down', velocity: number = 0.5) {
    if (!this.enabled) return
    this.initContext()
    if (!this.ctx || this.ctx.state !== 'running') return

    const now = this.ctx.currentTime

    // Rate-limit clicks to avoid audio muddiness during ultra-fast flings (minimum 25ms between clicks)
    if (now - this.lastClickTime < 0.025) return
    this.lastClickTime = now

    // Parameters for machined detent click
    const baseFreq = direction === 'up' ? 2750 : 2400
    // Dynamic pitch modulation according to velocity
    const freq = baseFreq + Math.min(velocity * 300, 600)
    const duration = 0.012 // 12ms impulse

    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const filter = this.ctx.createBiquadFilter()

      // Bandpass shaping to replicate tactile aluminum click
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(freq, now)
      filter.Q.setValueAtTime(3.5, now)

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + duration)

      // Kinetic volume scaling (subtle, non-fatiguing)
      const baseGain = Math.min(0.06 + velocity * 0.04, 0.12)
      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(baseGain, now + 0.0015)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + duration + 0.002)
    } catch {
      // Audio node cleanup on failure
    }
  }

  /**
   * Called on scroll events to track distance and trigger ratchet detents
   */
  public handleScroll(currentY: number, velocity: number = 0) {
    if (!this.enabled) return

    const delta = currentY - this.lastScrollY
    this.lastScrollY = currentY

    if (Math.abs(delta) < 1) return

    this.accumulatedDelta += delta

    if (Math.abs(this.accumulatedDelta) >= this.TICK_DISTANCE) {
      const direction = this.accumulatedDelta > 0 ? 'down' : 'up'
      const normalizedVelocity = Math.min(Math.abs(velocity) / 40, 2)
      this.playMechanicalClick(direction, normalizedVelocity)
      this.accumulatedDelta = 0
    }
  }
}

export const lookapAudio = new LookapAudioEngine()
