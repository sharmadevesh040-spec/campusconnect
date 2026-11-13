import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { MailCheck, ArrowRight, RotateCw, CheckCircle2, ShieldCheck, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { apiRequest } from '@/services/api'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [verified, setVerified] = useState(false)

  // Auto-verify if both email and code exist in URL query params
  useEffect(() => {
    const urlEmail = searchParams.get('email')
    const urlCode = searchParams.get('code')
    if (urlEmail && urlCode && !verified) {
      handleVerify(urlEmail, urlCode)
    }
  }, [searchParams])

  const handleVerify = async (verifyEmail = email, verifyCode = code) => {
    if (!verifyEmail.trim() || !verifyCode.trim()) {
      toast.error('Please enter both your email address and 6-digit verification code')
      return
    }

    setLoading(true)
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({
          email: verifyEmail.trim(),
          code: verifyCode.trim()
        })
      })

      setVerified(true)
      toast.success(res.message || 'Email verified successfully!')
    } catch (err: any) {
      toast.error('Verification failed', {
        description: err.message || 'Invalid or expired verification code. Please request a new one.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address to resend verification code')
      return
    }

    setResending(true)
    try {
      const res = await apiRequest<{ message: string; code?: string }>('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() })
      })
      if (res.code) {
        setCode(res.code)
      }
      toast.success(res.message || 'Verification code resent via SMTP!')
    } catch (err: any) {
      toast.error('Failed to resend code', { description: err.message })
    } finally {
      setResending(false)
    }
  }

  if (verified) {
    return (
      <div className="w-full max-w-[460px] mx-auto rounded-[30px] p-8 sm:p-10 bg-[#111114]/95 border border-white/[0.09] shadow-[0_25px_70px_rgba(0,0,0,0.85)] text-center space-y-4 text-white">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Email Verified on Stage!</h1>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
          Your student ambassador email address has been confirmed and activated in PostgreSQL.
        </p>

        <div className="pt-4">
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm text-zinc-950 bg-gradient-to-b from-[#f5f5f7] via-[#d4d4d8] to-[#9999a1] shadow-md hover:brightness-105 active:translate-y-[1px] transition-all flex items-center justify-center gap-2"
          >
            <span>Sign In to Ambassador Dashboard</span>
            <ArrowRight className="w-4 h-4 text-zinc-900" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[460px] mx-auto rounded-[30px] p-7 sm:p-9 bg-[#111114]/95 border border-white/[0.09] shadow-[0_25px_70px_rgba(0,0,0,0.85)] text-white">
      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 bg-amber-400/10 text-amber-300 rounded-2xl flex items-center justify-center mx-auto border border-amber-400/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <MailCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Verify Your Email</h1>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
          Enter the 6-digit confirmation code dispatched via SMTP to activate your account.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">Registered Email</label>
          <div className="relative rounded-2xl bg-[#151518] border border-white/[0.08] focus-within:border-amber-300/80 transition-all">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 rounded-2xl focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">6-Digit Code</label>
            {code && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                AUTO-LOADED
              </span>
            )}
          </div>
          <div className="relative rounded-2xl bg-[#151518] border border-white/[0.08] focus-within:border-amber-300/80 transition-all">
            <input
              type="text"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-transparent text-center font-mono tracking-[0.5em] text-lg py-3 text-white placeholder-zinc-600 rounded-2xl focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => handleVerify()}
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm text-zinc-950 bg-gradient-to-b from-[#f5f5f7] via-[#d4d4d8] to-[#9999a1] shadow-md hover:brightness-105 active:translate-y-[1px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Activating Credentials...' : 'Confirm & Activate Account'}</span>
            <ShieldCheck className="w-4 h-4 text-zinc-900" />
          </button>

          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full py-2.5 text-xs text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            <span>{resending ? 'Resending via SMTP...' : "Didn't receive email? Resend code"}</span>
          </button>
        </div>

        <div className="pt-3 border-t border-white/[0.06] text-center">
          <Link to="/login" className="text-xs text-zinc-400 hover:text-white underline underline-offset-4">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
