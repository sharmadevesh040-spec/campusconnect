import { Link, useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle, Send, ShieldAlert } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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

  if (sent) return (
    <div className="text-center animate-fade-in space-y-4">
      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto shadow-md">
        <CheckCircle className="w-8 h-8 text-emerald-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Check Your Email</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
        We dispatched a 6-digit password reset code via SMTP to:
      </p>
      <p className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-2 rounded-xl border border-blue-200 dark:border-blue-900/40 inline-block px-4">
        {submittedEmail}
      </p>

      <div className="pt-4 flex flex-col gap-2">
        <Button
          onClick={() => navigate(`/reset-password?email=${encodeURIComponent(submittedEmail)}`)}
          size="lg"
        >
          Enter Reset Code &rarr;
        </Button>
        <Link to="/login">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Sign In
          </Button>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back to login
      </Link>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Forgot your password?</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Enter your registered student email and we'll dispatch a 6-digit reset code via SMTP.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@university.edu"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          autoComplete="email"
          {...register('email')}
        />
        <Button type="submit" className="w-full" loading={isSubmitting} size="lg" leftIcon={<Send className="w-4 h-4" />}>
          Send Reset Code via SMTP
        </Button>
      </form>
    </div>
  )
}
