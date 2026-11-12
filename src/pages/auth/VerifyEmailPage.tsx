import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
      <Card className="p-8 shadow-xl border-slate-200 dark:border-slate-800 text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Email Verified via SMTP!</h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Your student ambassador email address has been confirmed and activated in the database.
        </p>

        <div className="pt-3">
          <Button
            className="w-full"
            onClick={() => navigate('/login')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In to Dashboard
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8 shadow-xl border-slate-200 dark:border-slate-800 space-y-5 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <MailCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Verify Your Email</h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          We sent a 6-digit confirmation code via SMTP. Enter it below to activate your account.
        </p>
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2 border border-blue-100 dark:border-blue-900/40">
        <ShieldCheck className="w-4 h-4 flex-shrink-0 text-blue-500" />
        <span>Verification codes are dispatched via secure SMTP protocol.</span>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Email Address
          </label>
          <Input
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            6-Digit Verification Code
          </label>
          <Input
            type="text"
            placeholder="123456"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="text-center font-mono tracking-widest text-lg font-bold"
            required
          />
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Confirm & Verify Email
        </Button>

        <div className="flex items-center justify-between pt-2 text-xs">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium disabled:opacity-50"
          >
            <RotateCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
            Resend SMTP Code
          </button>
          <Link to="/login" className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            Back to Sign In
          </Link>
        </div>
      </form>
    </Card>
  )
}
