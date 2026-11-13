import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { KeyRound, ArrowLeft, CheckCircle2, Lock, Mail, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { apiRequest } from '@/services/api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !code.trim() || !newPassword.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          newPassword
        })
      })

      setSubmitted(true)
      toast.success(res.message || 'Password updated successfully!')
    } catch (err: any) {
      toast.error('Failed to reset password', {
        description: err.message || 'Invalid or expired code. Please request a new code.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[460px] mx-auto rounded-[30px] p-7 sm:p-9 bg-[#111114]/95 border border-white/[0.09] shadow-[0_25px_70px_rgba(0,0,0,0.85)] text-white">
      <Link to="/login" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Stage Sign In
      </Link>

      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 bg-amber-400/10 text-amber-300 rounded-2xl flex items-center justify-center mx-auto border border-amber-400/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Choose New Password</h1>
        <p className="text-xs text-zinc-400">
          Enter the 6-digit code received via SMTP and set your new stage credentials.
        </p>
      </div>

      {submitted ? (
        <div className="text-center space-y-4">
          <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Password updated in database. You can now log in.
          </div>
          <Link to="/login">
            <button className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm text-zinc-950 bg-gradient-to-b from-[#f5f5f7] via-[#d4d4d8] to-[#9999a1] shadow-md hover:brightness-105 transition-all">
              Sign In with New Password
            </button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">Registered Email</label>
            <div className="relative rounded-2xl bg-[#151518] border border-white/[0.08] focus-within:border-amber-300/80 transition-all">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                placeholder="you@university.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 rounded-2xl focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">6-Digit Verification Code</label>
            <div className="relative rounded-2xl bg-[#151518] border border-white/[0.08] focus-within:border-amber-300/80 transition-all">
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-transparent text-center font-mono tracking-[0.5em] text-lg py-2.5 text-white placeholder-zinc-600 rounded-2xl focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">New Password</label>
            <div className="relative rounded-2xl bg-[#151518] border border-white/[0.08] focus-within:border-amber-300/80 transition-all">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 rounded-2xl focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">Confirm Password</label>
            <div className="relative rounded-2xl bg-[#151518] border border-white/[0.08] focus-within:border-amber-300/80 transition-all">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 rounded-2xl focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm text-zinc-950 bg-gradient-to-b from-[#f5f5f7] via-[#d4d4d8] to-[#9999a1] shadow-md hover:brightness-105 active:translate-y-[1px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Saving New Password...' : 'Save & Update Password'}</span>
              <ArrowRight className="w-4 h-4 text-zinc-900" />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
