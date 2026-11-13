import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, Sparkles, Shield, Send, CheckCircle2, Phone, Hash, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { apiRequest, setToken } from '@/services/api'
import { UserRole } from '@/types/user'
import { AUTHORIZED_ADMIN_EMAIL } from '@/App'

interface SpotlightAuthFormProps {
  initialMode?: 'login' | 'register'
}

type ActiveField = 'fullName' | 'email' | 'password' | 'confirmPassword' | 'phone' | 'studentId' | 'otp' | 'button' | null

export default function SpotlightAuthForm({ initialMode = 'login' }: SpotlightAuthFormProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password')
  const [activeField, setActiveField] = useState<ActiveField>('email')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Login form values
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // OTP login state
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpSending, setOtpSending] = useState(false)

  // Registration form values
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regStudentId, setRegStudentId] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')

  const { login, register: authRegister } = useAuth()
  const navigate = useNavigate()

  // Track card container size for responsive spotlight aim
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardHeight, setCardHeight] = useState(580)

  useEffect(() => {
    if (!cardRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setCardHeight(entry.contentRect.height)
      }
    })
    ro.observe(cardRef.current)
    return () => ro.disconnect()
  }, [mode, loginMethod, otpSent])

  // Field Y-coordinates relative to card height
  const fieldYMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    if (mode === 'login') {
      if (loginMethod === 'otp') {
        map.email = 180
        map.otp = 260
        map.button = 340
      } else {
        map.email = 195
        map.password = 285
        map.button = 375
      }
    } else {
      map.fullName = 175
      map.email = 245
      map.studentId = 315
      map.password = 385
      map.confirmPassword = 455
      map.button = 535
    }
    return map
  }, [mode, loginMethod])

  // Spotlight positions in px (card coordinate system, card width ~ 460px)
  const lampLeft = { x: 48, y: 36 }
  const lampRight = { x: 412, y: 36 }
  const targetX = 230 // Center of form inputs

  const currentTargetY = fieldYMap[activeField || 'email'] || 200

  // Calculate rotation angles for lamps
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

  // Quick fill for Designated Super Admin
  const handleSuperAdminFill = () => {
    setMode('login')
    setLoginMethod('password')
    setLoginEmail('sharmadevesh040@gmail.com')
    setLoginPassword('Devesh@09')
    setActiveField('password')
    toast.info('Super Admin credentials loaded', {
      description: 'sharmadevesh040@gmail.com (Sole Administrator)'
    })
  }

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail.trim() || !loginPassword.trim()) {
      toast.error('Please enter your email and password')
      return
    }

    setSubmitting(true)
    try {
      const loggedUser = await login(loginEmail.trim(), loginPassword)
      const role = loggedUser?.role
      const email = (loggedUser?.email || loginEmail).toLowerCase().trim()

      if (email === AUTHORIZED_ADMIN_EMAIL.toLowerCase() || role === 'admin' || role === 'super_admin' || role === UserRole.ADMIN) {
        toast.success('Welcome Administrator!', { description: 'Authenticated as Sole Super Administrator' })
        navigate('/admin/dashboard')
      } else {
        toast.success('Welcome back!', { description: 'Authenticated as Student Ambassador' })
        navigate('/student/dashboard')
      }
    } catch (err: any) {
      toast.error('Authentication failed', {
        description: err.message || 'Incorrect email or password.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle OTP Dispatch
  const handleSendOtp = async () => {
    if (!otpEmail.trim()) {
      toast.error('Please enter your registered email address')
      return
    }
    setOtpSending(true)
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/send-login-otp', {
        method: 'POST',
        body: JSON.stringify({ email: otpEmail.trim() })
      })
      setOtpSent(true)
      setActiveField('otp')
      toast.success(res.message || '6-digit login passcode dispatched via SMTP!')
    } catch (err: any) {
      toast.error('Failed to send passcode', { description: err.message })
    } finally {
      setOtpSending(false)
    }
  }

  // Handle OTP Verify
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpEmail.trim() || !otpCode.trim()) {
      toast.error('Email and 6-digit passcode are required')
      return
    }

    setSubmitting(true)
    try {
      const res = await apiRequest<{ token: string; user: any; message: string }>('/api/auth/login-otp', {
        method: 'POST',
        body: JSON.stringify({ email: otpEmail.trim(), otp: otpCode.trim() })
      })

      if (res.token) {
        setToken(res.token)
        toast.success(res.message || 'Authenticated successfully!')
        if (res.user?.role === 'admin' || res.user?.role === 'super_admin') {
          navigate('/admin/dashboard')
        } else {
          navigate('/student/dashboard')
        }
      }
    } catch (err: any) {
      toast.error('Passcode verification failed', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      toast.error('Please fill in all required fields')
      return
    }
    if (regPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (regPassword !== regConfirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      const studentData = {
        phone: regPhone.trim() || '+1 (555) 000-0000',
        studentId: regStudentId.trim() || 'GSA-2026-' + Math.floor(100000 + Math.random() * 900000)
      }
      const res: any = await authRegister(regEmail.trim(), regPassword, regName.trim(), studentData)
      const codeParam = res?.verificationCode ? `&code=${encodeURIComponent(res.verificationCode)}` : ''
      toast.success('Ambassador Account Created!', {
        description: res?.verificationCode
          ? `Your 6-digit verification code is: ${res.verificationCode}`
          : 'Verification code dispatched via SMTP.'
      })
      navigate(`/verify-email?email=${encodeURIComponent(regEmail.trim())}${codeParam}`)
    } catch (err: any) {
      toast.error('Registration failed', { description: err.message || 'Unable to complete registration.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-[92vh] w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none bg-[#09090b]">
      {/* 1. Theatrical Dark Blueprint Grid Canvas */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px'
        }}
      />

      {/* 2. Ambient Stage Smoke / Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,#09090b_85%)]" />

      {/* Floating Micro Dust Motes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-200/40 blur-[0.5px]"
            initial={{
              x: `${(i * 9 + 5) % 100}vw`,
              y: `${(i * 13 + 10) % 100}vh`,
              opacity: 0.1
            }}
            animate={{
              y: ['-5vh', '105vh'],
              opacity: [0.1, 0.6, 0.1]
            }}
            transition={{
              duration: 18 + (i % 7) * 3,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 1.5
            }}
          />
        ))}
      </div>

      {/* 3. Theatrical Stage Center Card */}
      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-[460px] rounded-[30px] p-7 sm:p-9 bg-[#111114]/95 border border-white/[0.09] shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl overflow-hidden transition-all duration-300"
      >
        {/* ========================================================= */}
        {/* Dynamic Volumetric Spotlights & Lamp Fixtures              */}
        {/* ========================================================= */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          <svg className="w-full h-full" viewBox={`0 0 460 ${cardHeight}`} preserveAspectRatio="none">
            <defs>
              {/* Volumetric Warm Golden Cone Gradient */}
              <linearGradient id="spotlight-beam-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff8e7" stopOpacity="0.8" />
                <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#d97706" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#b45309" stopOpacity="0.0" />
              </linearGradient>

              {/* Floor Spotlight Glow */}
              <radialGradient id="stage-hotspot-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.65" />
                <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>

              {/* Gaussian Blur Filter for Volumetric Softness */}
              <filter id="spotlight-blur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="14" />
              </filter>
            </defs>

            {/* Left Spotlight Volumetric Beam */}
            <motion.path
              d={leftBeamPath}
              fill="url(#spotlight-beam-grad)"
              filter="url(#spotlight-blur)"
              style={{ mixBlendMode: 'screen' }}
              initial={false}
              animate={{ d: leftBeamPath }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />

            {/* Right Spotlight Volumetric Beam */}
            <motion.path
              d={rightBeamPath}
              fill="url(#spotlight-beam-grad)"
              filter="url(#spotlight-blur)"
              style={{ mixBlendMode: 'screen' }}
              initial={false}
              animate={{ d: rightBeamPath }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />

            {/* Target Field Hotspot Glow Oval */}
            <motion.ellipse
              cx={targetX}
              cy={currentTargetY + 16}
              rx={150}
              ry={32}
              fill="url(#stage-hotspot-glow)"
              filter="url(#spotlight-blur)"
              style={{ mixBlendMode: 'screen' }}
              initial={false}
              animate={{ cy: currentTargetY + 16 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </svg>

          {/* Left Physical Theatrical Lamp Projector */}
          <div 
            className="absolute"
            style={{ left: `${lampLeft.x - 14}px`, top: `${lampLeft.y - 18}px` }}
          >
            {/* Ceiling Mounting Bracket */}
            <div className="w-7 h-2 bg-zinc-800 rounded-sm mx-auto shadow-sm border border-zinc-700" />
            <div className="w-1.5 h-3 bg-zinc-700 mx-auto" />

            {/* Rotatable Lamp Can */}
            <motion.div
              className="relative w-8 h-9"
              initial={false}
              animate={{ rotate: leftAngle }}
              transition={{ type: 'spring', stiffness: 110, damping: 18 }}
              style={{ transformOrigin: 'top center' }}
            >
              {/* Lamp Body Barrel */}
              <div className="w-7 h-8 mx-auto bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-900 rounded-b-md shadow-md border border-zinc-600/50 flex flex-col justify-between p-0.5">
                <div className="w-full h-1 bg-zinc-900 rounded-t" />
                <div className="w-full flex justify-between px-0.5 text-[6px] text-zinc-500 font-mono">
                  <span>◀</span><span>▶</span>
                </div>
                {/* Glowing Spotlight Lens Rim */}
                <div className="w-full h-2 rounded-b bg-amber-100 shadow-[0_0_12px_#fef08a,0_0_24px_rgba(245,158,11,0.8)] border-t border-amber-200" />
              </div>
            </motion.div>
          </div>

          {/* Right Physical Theatrical Lamp Projector */}
          <div 
            className="absolute"
            style={{ left: `${lampRight.x - 14}px`, top: `${lampRight.y - 18}px` }}
          >
            {/* Ceiling Mounting Bracket */}
            <div className="w-7 h-2 bg-zinc-800 rounded-sm mx-auto shadow-sm border border-zinc-700" />
            <div className="w-1.5 h-3 bg-zinc-700 mx-auto" />

            {/* Rotatable Lamp Can */}
            <motion.div
              className="relative w-8 h-9"
              initial={false}
              animate={{ rotate: rightAngle }}
              transition={{ type: 'spring', stiffness: 110, damping: 18 }}
              style={{ transformOrigin: 'top center' }}
            >
              {/* Lamp Body Barrel */}
              <div className="w-7 h-8 mx-auto bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-900 rounded-b-md shadow-md border border-zinc-600/50 flex flex-col justify-between p-0.5">
                <div className="w-full h-1 bg-zinc-900 rounded-t" />
                <div className="w-full flex justify-between px-0.5 text-[6px] text-zinc-500 font-mono">
                  <span>◀</span><span>▶</span>
                </div>
                {/* Glowing Spotlight Lens Rim */}
                <div className="w-full h-2 rounded-b bg-amber-100 shadow-[0_0_12px_#fef08a,0_0_24px_rgba(245,158,11,0.8)] border-t border-amber-200" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* Card Header & Segmented Pill Switcher                     */}
        {/* ========================================================= */}
        <div className="relative z-30 pt-2 mb-6 text-center">
          {/* Top Brand Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-mono tracking-wider text-amber-200/90 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            CAMPUSCONNECT STAGE
          </div>

          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-white/95">
            {mode === 'login' ? 'Sign in to your account' : "Let's create your account"}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            {mode === 'login' 
              ? 'Theatrical spotlights track active inputs on stage' 
              : 'Join the premier Student Ambassador Network'}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="mt-4 p-1 rounded-2xl bg-black/40 border border-white/[0.08] grid grid-cols-2 gap-1 max-w-[280px] mx-auto">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setActiveField('email')
              }}
              className={`py-1.5 text-xs font-medium rounded-xl transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-gradient-to-b from-white/20 to-white/5 text-white shadow-sm border border-white/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setActiveField('fullName')
              }}
              className={`py-1.5 text-xs font-medium rounded-xl transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-gradient-to-b from-white/20 to-white/5 text-white shadow-sm border border-white/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* Interactive Spotlight Form Area                           */}
        {/* ========================================================= */}
        <div className="relative z-30">
          {mode === 'login' ? (
            <div>
              {/* Method Switcher: Password vs OTP */}
              <div className="flex items-center justify-between text-xs mb-3 px-1">
                <span className="text-zinc-500 font-mono text-[11px]">AUTHENTICATION MODE</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('password')
                      setActiveField('email')
                    }}
                    className={`text-[11px] font-medium transition-colors ${
                      loginMethod === 'password' ? 'text-amber-300 underline underline-offset-4' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Password
                  </button>
                  <span className="text-zinc-600">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('otp')
                      setActiveField('email')
                    }}
                    className={`text-[11px] font-medium transition-colors ${
                      loginMethod === 'otp' ? 'text-amber-300 underline underline-offset-4' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Email OTP
                  </button>
                </div>
              </div>

              {loginMethod === 'password' ? (
                /* 1. PASSWORD LOGIN */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Email Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400 flex items-center justify-between">
                      <span>Work / Student Email</span>
                      {loginEmail.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase() && (
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
                        type="email"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        onFocus={() => setActiveField('email')}
                        placeholder="you@university.edu"
                        className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 rounded-2xl focus:outline-none"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">Password</label>
                      <Link to="/forgot-password" className="text-[11px] text-amber-300 hover:text-amber-200 transition-colors">
                        Forgot?
                      </Link>
                    </div>
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
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        onFocus={() => setActiveField('password')}
                        placeholder="••••••••••••"
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

                  {/* Convex Machined-Metal Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      onFocus={() => setActiveField('button')}
                      className="w-full relative py-3.5 px-6 rounded-2xl font-semibold text-sm tracking-wide text-zinc-950 transition-all duration-200 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.9),0_6px_20px_rgba(0,0,0,0.5)] active:translate-y-[1px] disabled:opacity-50 overflow-hidden bg-gradient-to-b from-[#f5f5f7] via-[#d4d4d8] to-[#9999a1] hover:brightness-105 active:brightness-95"
                    >
                      {submitting ? 'Authenticating on Stage...' : 'Sign In'}
                    </button>
                  </div>
                </form>
              ) : (
                /* 2. SMTP OTP LOGIN */
                <div className="space-y-4">
                  {!otpSent ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">Email Address</label>
                        <div 
                          className={`relative rounded-2xl transition-all duration-300 ${
                            activeField === 'email'
                              ? 'bg-gradient-to-b from-[#fffbe8]/20 via-[#d4af37]/15 to-black/60 border border-amber-300/80 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
                              : 'bg-[#151518] border border-white/[0.08]'
                          }`}
                        >
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            value={otpEmail}
                            onChange={e => setOtpEmail(e.target.value)}
                            onFocus={() => setActiveField('email')}
                            placeholder="you@university.edu"
                            className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 rounded-2xl focus:outline-none"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpSending}
                        className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm text-zinc-950 bg-gradient-to-b from-[#f5f5f7] via-[#d4d4d8] to-[#9999a1] shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2"
                      >
                        {otpSending ? 'Dispatching via SMTP...' : 'Send 6-Digit Passcode'}
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-3">
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Code sent via SMTP to:</p>
                          <p className="font-mono text-white/90">{otpEmail}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">Enter 6-Digit Code</label>
                        <div 
                          className={`relative rounded-2xl transition-all duration-300 ${
                            activeField === 'otp'
                              ? 'bg-gradient-to-b from-[#fffbe8]/20 via-[#d4af37]/15 to-black/60 border border-amber-300/80 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
                              : 'bg-[#151518] border border-white/[0.08]'
                          }`}
                        >
                          <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            onFocus={() => setActiveField('otp')}
                            placeholder="123456"
                            className="w-full bg-transparent text-center font-mono tracking-[0.5em] text-lg py-3 text-white placeholder-zinc-600 rounded-2xl focus:outline-none"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm text-zinc-950 bg-gradient-to-b from-[#f5f5f7] via-[#d4d4d8] to-[#9999a1] shadow-md hover:brightness-105 transition-all"
                      >
                        {submitting ? 'Verifying...' : 'Verify Passcode & Enter'}
                      </button>

                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4"
                        >
                          Change email address
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Super Admin Quick Launch Button */}
              <div className="mt-5 pt-4 border-t border-white/[0.06] text-center">
                <button
                  type="button"
                  onClick={handleSuperAdminFill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 text-xs font-mono transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>Admin Fill (sharmadevesh040@gmail.com)</span>
                </button>
              </div>
            </div>
          ) : (
            /* ======================================================= */
            /* REGISTRATION FORM (Spotlight Follows Each Step)          */
            /* ======================================================= */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* 1. Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">Full Name</label>
                <div 
                  className={`relative rounded-2xl transition-all duration-300 ${
                    activeField === 'fullName'
                      ? 'bg-gradient-to-b from-[#fffbe8]/20 via-[#d4af37]/15 to-black/60 border border-amber-300/80 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
                      : 'bg-[#151518] border border-white/[0.08]'
                  }`}
                >
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    onFocus={() => setActiveField('fullName')}
                    placeholder="Tushti Sachdeva"
                    className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 rounded-2xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* 2. Email Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">Email Address</label>
                <div 
                  className={`relative rounded-2xl transition-all duration-300 ${
                    activeField === 'email'
                      ? 'bg-gradient-to-b from-[#fffbe8]/20 via-[#d4af37]/15 to-black/60 border border-amber-300/80 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
                      : 'bg-[#151518] border border-white/[0.08]'
                  }`}
                >
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    onFocus={() => setActiveField('email')}
                    placeholder="contact@university.edu"
                    className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 rounded-2xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* 3. Student ID & Phone (Dual Grid) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">Student ID</label>
                  <div 
                    className={`relative rounded-2xl transition-all duration-300 ${
                      activeField === 'studentId'
                        ? 'bg-gradient-to-b from-[#fffbe8]/20 via-[#d4af37]/15 to-black/60 border border-amber-300/80 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
                        : 'bg-[#151518] border border-white/[0.08]'
                    }`}
                  >
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      <Hash className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={regStudentId}
                      onChange={e => setRegStudentId(e.target.value)}
                      onFocus={() => setActiveField('studentId')}
                      placeholder="GSA-2026-001"
                      className="w-full bg-transparent pl-8 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 rounded-2xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">Phone</label>
                  <div 
                    className={`relative rounded-2xl transition-all duration-300 ${
                      activeField === 'phone'
                        ? 'bg-gradient-to-b from-[#fffbe8]/20 via-[#d4af37]/15 to-black/60 border border-amber-300/80 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
                        : 'bg-[#151518] border border-white/[0.08]'
                    }`}
                  >
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      onFocus={() => setActiveField('phone')}
                      placeholder="+91 98765..."
                      className="w-full bg-transparent pl-8 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 rounded-2xl focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">Create Password</label>
                <div 
                  className={`relative rounded-2xl transition-all duration-300 ${
                    activeField === 'password'
                      ? 'bg-gradient-to-b from-[#fffbe8]/20 via-[#d4af37]/15 to-black/60 border border-amber-300/80 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
                      : 'bg-[#151518] border border-white/[0.08]'
                  }`}
                >
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    onFocus={() => setActiveField('password')}
                    placeholder="••••••••••••"
                    className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 rounded-2xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* 5. Confirm Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">Confirm Password</label>
                <div 
                  className={`relative rounded-2xl transition-all duration-300 ${
                    activeField === 'confirmPassword'
                      ? 'bg-gradient-to-b from-[#fffbe8]/20 via-[#d4af37]/15 to-black/60 border border-amber-300/80 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
                      : 'bg-[#151518] border border-white/[0.08]'
                  }`}
                >
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    onFocus={() => setActiveField('confirmPassword')}
                    placeholder="••••••••••••"
                    className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 rounded-2xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Machined Convex Sign Up Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  onFocus={() => setActiveField('button')}
                  className="w-full relative py-3.5 px-6 rounded-2xl font-semibold text-sm tracking-wide text-zinc-950 transition-all duration-200 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.9),0_6px_20px_rgba(0,0,0,0.5)] active:translate-y-[1px] disabled:opacity-50 overflow-hidden bg-gradient-to-b from-[#f5f5f7] via-[#d4d4d8] to-[#9999a1] hover:brightness-105 active:brightness-95 flex items-center justify-center gap-2"
                >
                  <span>{submitting ? 'Creating Ambassador Profile...' : 'Complete Stage Sign Up'}</span>
                  <ArrowRight className="w-4 h-4 text-zinc-900" />
                </button>
              </div>
            </form>
          )}

          {/* Footer Navigation */}
          <div className="mt-5 text-center text-xs text-zinc-500">
            {mode === 'login' ? (
              <p>
                Don't have an ambassador account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register')
                    setActiveField('fullName')
                  }}
                  className="text-amber-300 hover:text-amber-200 font-semibold underline underline-offset-4"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have an ambassador account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setActiveField('email')
                  }}
                  className="text-amber-300 hover:text-amber-200 font-semibold underline underline-offset-4"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
