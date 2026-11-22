import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { AUTHORIZED_ADMIN_EMAIL } from '@/App'

type ActiveField = 'email' | 'password' | 'button' | null

export default function SpotlightAuthForm() {
  const [activeField, setActiveField] = useState<ActiveField>('email')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Two required login fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  // Track card container size for responsive spotlight aim
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardHeight, setCardHeight] = useState(520)

  useEffect(() => {
    if (!cardRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setCardHeight(entry.contentRect.height)
      }
    })
    ro.observe(cardRef.current)
    return () => ro.disconnect()
  }, [])

  // Precise Y-coordinates for the spotlight beam targeting
  const fieldYMap = useMemo<Record<string, number>>(() => ({
    email: 185,
    password: 275,
    button: 365
  }), [])

  // Spotlight positions in px (card coordinate system, card width ~ 460px)
  const lampLeft = { x: 48, y: 36 }
  const lampRight = { x: 412, y: 36 }
  const targetX = 230 // Center of form inputs

  const currentTargetY = fieldYMap[activeField || 'email'] || 185

  // Calculate rotation angles for physical lamps
  const leftAngle = useMemo(() => {
    const dx = targetX - lampLeft.x
    const dy = currentTargetY - lampLeft.y
    return (Math.atan2(dy, dx) * 180) / Math.PI - 90
  }, [currentTargetY])

  const rightAngle = useMemo(() => {
    const dx = targetX - lampRight.x
    const dy = currentTargetY - lampRight.y
    return (Math.atan2(dy, dx) * 180) / Math.PI - 90
  }, [currentTargetY])

  // Beam polygon coordinates
  const beamWidth = 140
  const leftBeamPath = `M ${lampLeft.x} ${lampLeft.y} L ${targetX - beamWidth} ${currentTargetY + 20} L ${targetX + beamWidth} ${currentTargetY + 20} Z`
  const rightBeamPath = `M ${lampRight.x} ${lampRight.y} L ${targetX - beamWidth} ${currentTargetY + 20} L ${targetX + beamWidth} ${currentTargetY + 20} Z`

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const normalizedEmail = email.trim()
    const enteredPassword = password.trim()

    if (!normalizedEmail || !enteredPassword) {
      setErrorMessage('Invalid email or password.')
      toast.error('Invalid email or password.')
      return
    }

    setSubmitting(true)
    try {
      const loggedUser = await login(normalizedEmail, enteredPassword)
      const role = loggedUser?.role
      const userEmail = (loggedUser?.email || normalizedEmail).toLowerCase().trim()

      toast.success('Welcome back!', { description: 'Authenticated successfully.' })

      if (userEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase() || role === 'admin' || role === 'super_admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/student/dashboard', { replace: true })
      }
    } catch (err: any) {
      // Security requirement: exact error message without revealing whether email or password was wrong
      setErrorMessage('Invalid email or password.')
      toast.error('Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Outer Card with ambient specular backlight and metallic rim */}
      <div 
        ref={cardRef}
        className="relative rounded-3xl bg-[#09090b]/95 border border-white/[0.12] p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8),0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.15)] overflow-hidden backdrop-blur-xl"
      >
        {/* ========================================================= */}
        {/* Physical Theatrical Spotlight Rig & Volumetric Cones      */}
        {/* ========================================================= */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          <svg className="w-full h-full" style={{ width: '100%', height: `${cardHeight}px` }}>
            <defs>
              <linearGradient id="warmSpotlightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.45" />
                <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.22" />
                <stop offset="75%" stopColor="#d97706" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
              </linearGradient>

              <radialGradient id="stageGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.30" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
              </radialGradient>
            </defs>

            {/* Volumetric Light Beams */}
            <motion.path
              d={leftBeamPath}
              fill="url(#warmSpotlightGrad)"
              initial={false}
              animate={{ d: leftBeamPath }}
              transition={{ type: 'spring', stiffness: 90, damping: 20 }}
            />
            <motion.path
              d={rightBeamPath}
              fill="url(#warmSpotlightGrad)"
              initial={false}
              animate={{ d: rightBeamPath }}
              transition={{ type: 'spring', stiffness: 90, damping: 20 }}
            />

            {/* Target Elliptical Floor Stage Pool */}
            <motion.ellipse
              cx={targetX}
              cy={currentTargetY + 22}
              rx={150}
              ry={35}
              fill="url(#stageGlow)"
              initial={false}
              animate={{ cy: currentTargetY + 22 }}
              transition={{ type: 'spring', stiffness: 90, damping: 20 }}
            />
          </svg>

          {/* Left Physical Theatrical Lamp Projector */}
          <div 
            className="absolute"
            style={{ left: `${lampLeft.x - 14}px`, top: `${lampLeft.y - 18}px` }}
          >
            <div className="w-7 h-2 bg-zinc-800 rounded-sm mx-auto shadow-sm border border-zinc-700" />
            <div className="w-1.5 h-3 bg-zinc-700 mx-auto" />

            <motion.div
              className="relative w-8 h-9"
              initial={false}
              animate={{ rotate: leftAngle }}
              transition={{ type: 'spring', stiffness: 110, damping: 18 }}
              style={{ transformOrigin: 'top center' }}
            >
              <div className="w-7 h-8 mx-auto bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-900 rounded-b-md shadow-md border border-zinc-600/50 flex flex-col justify-between p-0.5">
                <div className="w-full h-1 bg-zinc-900 rounded-t" />
                <div className="w-full flex justify-between px-0.5 text-[6px] text-zinc-500 font-mono">
                  <span>◀</span><span>▶</span>
                </div>
                <div className="w-full h-2 rounded-b bg-amber-100 shadow-[0_0_12px_#fef08a,0_0_24px_rgba(245,158,11,0.8)] border-t border-amber-200" />
              </div>
            </motion.div>
          </div>

          {/* Right Physical Theatrical Lamp Projector */}
          <div 
            className="absolute"
            style={{ left: `${lampRight.x - 14}px`, top: `${lampRight.y - 18}px` }}
          >
            <div className="w-7 h-2 bg-zinc-800 rounded-sm mx-auto shadow-sm border border-zinc-700" />
            <div className="w-1.5 h-3 bg-zinc-700 mx-auto" />

            <motion.div
              className="relative w-8 h-9"
              initial={false}
              animate={{ rotate: rightAngle }}
              transition={{ type: 'spring', stiffness: 110, damping: 18 }}
              style={{ transformOrigin: 'top center' }}
            >
              <div className="w-7 h-8 mx-auto bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-900 rounded-b-md shadow-md border border-zinc-600/50 flex flex-col justify-between p-0.5">
                <div className="w-full h-1 bg-zinc-900 rounded-t" />
                <div className="w-full flex justify-between px-0.5 text-[6px] text-zinc-500 font-mono">
                  <span>◀</span><span>▶</span>
                </div>
                <div className="w-full h-2 rounded-b bg-amber-100 shadow-[0_0_12px_#fef08a,0_0_24px_rgba(245,158,11,0.8)] border-t border-amber-200" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* Card Header                                               */}
        {/* ========================================================= */}
        <div className="relative z-30 pt-2 mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-mono tracking-wider text-amber-200/90 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            CAMPUSCONNECT PORTAL
          </div>

          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-white/95">
            Sign In
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            Log in directly with your email and password
          </p>
        </div>

        {/* ========================================================= */}
        {/* Exactly Two Input Fields: Username/Email and Password     */}
        {/* ========================================================= */}
        <div className="relative z-30">
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Field 1: Username / Email */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400 flex items-center justify-between">
                <span>Username / Email</span>
                {email.toLowerCase().trim() === AUTHORIZED_ADMIN_EMAIL.toLowerCase() && (
                  <span className="text-purple-400 text-[10px] font-mono flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Designated Admin
                  </span>
                )}
              </label>
              <div 
                className={`relative rounded-2xl transition-all duration-300 ${
                  activeField === 'email'
                    ? 'bg-gradient-to-b from-[#fffbe8]/20 via-[#d4af37]/15 to-black/60 border border-amber-300/80 shadow-[0_0_35px_rgba(245,158,11,0.35),inset_0_1px_2px_rgba(255,255,255,0.4)]'
                    : 'bg-[#151518] border border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                  <Mail className={`w-4 h-4 transition-colors ${activeField === 'email' ? 'text-amber-300' : ''}`} />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    if (errorMessage) setErrorMessage(null)
                  }}
                  onFocus={() => setActiveField('email')}
                  placeholder="you@gmail.com or university email"
                  className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 rounded-2xl focus:outline-none"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">
                Password
              </label>
              <div 
                className={`relative rounded-2xl transition-all duration-300 ${
                  activeField === 'password'
                    ? 'bg-gradient-to-b from-[#fffbe8]/20 via-[#d4af37]/15 to-black/60 border border-amber-300/80 shadow-[0_0_35px_rgba(245,158,11,0.35),inset_0_1px_2px_rgba(255,255,255,0.4)]'
                    : 'bg-[#151518] border border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                  <Lock className={`w-4 h-4 transition-colors ${activeField === 'password' ? 'text-amber-300' : ''}`} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    if (errorMessage) setErrorMessage(null)
                  }}
                  onFocus={() => setActiveField('password')}
                  placeholder="Ambassador@123"
                  className="w-full bg-transparent pl-10 pr-10 py-3 text-sm text-white placeholder-zinc-500 rounded-2xl focus:outline-none"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Convex Machined-Metal Submit Button: Exactly Login */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                onFocus={() => setActiveField('button')}
                className="w-full relative py-3.5 px-6 rounded-2xl font-semibold text-sm tracking-wide text-zinc-950 transition-all duration-200 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.9),0_6px_20px_rgba(0,0,0,0.5)] active:translate-y-[1px] disabled:opacity-50 overflow-hidden bg-gradient-to-b from-[#f5f5f7] via-[#d4d4d8] to-[#9999a1] hover:brightness-105 active:brightness-95"
              >
                {submitting ? 'Signing in...' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
