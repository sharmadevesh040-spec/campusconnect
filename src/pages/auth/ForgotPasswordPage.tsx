import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { resetPassword } = useAuth()
  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    try {
      await resetPassword(data.email)
      setSent(true)
    } catch {
      toast.error('Failed to send reset email. Check your email address and try again.')
    }
  }

  if (sent) return (
    <div className="text-center animate-fade-in">
      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-emerald-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Check your email</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-2">We sent a password reset link to:</p>
      <p className="font-medium text-slate-700 dark:text-slate-300 mb-6">{getValues('email')}</p>
      <Link to="/login">
        <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>Back to Login</Button>
      </Link>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back to login
      </Link>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Forgot your password?</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Enter your email and we'll send you a reset link.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Email address" type="email" placeholder="you@university.edu" leftIcon={<Mail className="w-4 h-4" />} error={errors.email?.message} autoComplete="email" {...register('email')} />
        <Button type="submit" className="w-full" loading={isSubmitting} size="lg">Send Reset Link</Button>
      </form>
    </div>
  )
}
