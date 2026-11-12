import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { KeyRound, ArrowLeft, CheckCircle2, Lock, Mail } from 'lucide-react'
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
    <Card className="p-8 shadow-xl border-slate-200 dark:border-slate-800 animate-fade-in">
      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reset Your Password</h1>
        <p className="text-xs text-slate-500">
          Enter the 6-digit code received via SMTP and choose your new password.
        </p>
      </div>

      {submitted ? (
        <div className="text-center space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-900/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Password updated in PostgreSQL. You can now log in.
          </div>
          <Link to="/login">
            <Button className="w-full" size="lg">Sign In with New Password</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Registered Email
            </label>
            <Input
              type="email"
              required
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              6-Digit Reset Code (from SMTP)
            </label>
            <Input
              type="text"
              required
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="font-mono tracking-widest font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              New Password
            </label>
            <Input
              type="password"
              required
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Confirm New Password
            </label>
            <Input
              type="password"
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
            />
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Save New Password
          </Button>

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </Card>
  )
}
