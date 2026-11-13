import { Link, useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle, Send, KeyRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { toast } from 'sonner'
import { apiRequest } from '@/services/api'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await apiRequest<{ message: string; email: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: data.email.trim() })
      })

      setSubmittedEmail(data.email.trim())
      setSent(true)
      toast.success(res.message || 'Password reset code dispatched via SMTP!')
    } catch (err: any) {
      toast.error('Failed to dispatch reset email', {
        description: err.message || 'Please check your email address and try again.'
      })
    }
  }

  return (
    <div className="w-full max-w-[460px] mx-auto rounded-[30px] p-7 sm:p-9 bg-[#111114]/95 border border-white/[0.09] shadow-[0_25px_70px_rgba(0,0,0,0.85)] text-white">
      <Link to="/login" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Stage Sign In
      </Link>

      {sent ? (
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-lg">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Check Your Email</h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            We dispatched a 6-digit password reset code via SMTP to:
          </p>
          <p className="font-mono text-xs font-semibold text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 inline-block px-4">
            {submittedEmail}
          </p>

          <div className="pt-4 flex flex-col gap-2.5">
            <button
              onClick={() => navigate(`/reset-password?email=${encodeURIComponent(submittedEmail)}`)}
              className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm text-zinc-950 bg-gradient-to-b from-[#f5f5f7] via-[#d4d4d8] to-[#9999a1] shadow-md hover:brightness-105 transition-all"
            >
              Enter 6-Digit Reset Code &rarr;
            </button>
            <Link to="/login">
              <button
                type="button"
                className="w-full py-2.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Back to Sign In
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Reset Password</h2>
            <p className="text-zinc-400 mt-1 text-xs leading-relaxed">
              Enter your registered student email address. We'll dispatch a 6-digit verification code directly to your inbox via SMTP.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">Email Address</label>
              <div className="relative rounded-2xl bg-[#151518] border border-white/[0.08] focus-within:border-amber-300/80 focus-within:shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="you@university.edu"
                  className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 rounded-2xl focus:outline-none"
                  autoComplete="email"
                  {...register('email')}
                />
              </div>
              {errors.email?.message && (
                <p className="text-[11px] text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm text-zinc-950 bg-gradient-to-b from-[#f5f5f7] via-[#d4d4d8] to-[#9999a1] shadow-md hover:brightness-105 active:translate-y-[1px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Dispatching via SMTP...' : 'Send Reset Code'}</span>
                <Send className="w-4 h-4 text-zinc-900" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
