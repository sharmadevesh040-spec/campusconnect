import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, UserCheck, KeyRound, Send, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiRequest, setToken } from '@/services/api'
import { UserRole } from '@/types/user'

const passwordSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})
type PasswordFormData = z.infer<typeof passwordSchema>

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password')
  const [showPass, setShowPass] = useState(false)
  const { login, googleSignIn } = useAuth()
  const navigate = useNavigate()

  // Password form state
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: '', password: '' }
  })

  // OTP form state
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)

  const handleFillCredentials = (email: string, pass: string) => {
    setValue('email', email)
    setValue('password', pass)
    setOtpEmail(email)
    toast.info(`Filled credentials for ${email}`)
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await login(data.email, data.password)
      const res = await apiRequest<{ user: any }>('/api/auth/me')
      if (res.user?.role === 'admin' || res.user?.role === 'super_admin' || res.user?.role === UserRole.ADMIN) {
        navigate('/admin/dashboard')
      } else {
        navigate('/student/dashboard')
      }
      toast.success('Signed in successfully!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      toast.error('Login failed', {
        description: msg.includes('wrong-password') || msg.includes('invalid')
          ? 'Incorrect email or password.'
          : msg
      })
    }
  }

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
      toast.success(res.message || '6-digit login code dispatched via SMTP!')
    } catch (err: any) {
      toast.error('Failed to send code', { description: err.message })
    } finally {
      setOtpSending(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otpEmail.trim() || !otpCode.trim()) {
      toast.error('Please enter both email and the 6-digit login code')
      return
    }

    setOtpVerifying(true)
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
      setOtpVerifying(false)
    }
  }

  const handleGoogle = async () => {
    try {
      await googleSignIn()
      navigate('/student/dashboard')
      toast.success('Signed in with Google!')
    } catch {
      toast.error('Google sign-in failed. Please try again.')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sign in to CampusConnect</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Access your student ambassador pipeline and verified credentials
        </p>
      </div>

      {/* Database Credentials Quick Fill */}
      <div className="mb-6 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          PostgreSQL Database Accounts
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleFillCredentials('alex@campusconnect.edu', 'student123')}
            className="flex items-center gap-1.5 p-2 rounded-lg text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors text-xs"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <div className="truncate">
              <span className="font-semibold block text-slate-800 dark:text-slate-200">Student</span>
              <span className="text-[10px] text-slate-400">alex@campusconnect.edu</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleFillCredentials('admin@campusconnect.edu', 'admin123')}
            className="flex items-center gap-1.5 p-2 rounded-lg text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 transition-colors text-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
            <div className="truncate">
              <span className="font-semibold block text-slate-800 dark:text-slate-200">Admin</span>
              <span className="text-[10px] text-slate-400">admin@campusconnect.edu</span>
            </div>
          </button>
        </div>
      </div>

      {/* Auth Method Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setAuthMode('password')}
          className={`py-2 rounded-lg transition-all ${
            authMode === 'password'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Password Login
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('otp')}
          className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            authMode === 'otp'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Email OTP (SMTP)
        </button>
      </div>

      {authMode === 'password' ? (
        <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@university.edu"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            autoComplete="email"
            {...register('email')}
          />
          <Input
            label="Password"
            type={showPass ? 'text' : 'password'}
            placeholder="Enter your password"
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            error={errors.password?.message}
            autoComplete="current-password"
            {...register('password')}
          />
          <div className="flex items-center justify-between text-xs">
            <Link to="/verify-email" className="text-slate-500 hover:underline">
              Verify Email?
            </Link>
            <Link to="/forgot-password" className="text-blue-500 hover:text-blue-600 font-medium">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" loading={isSubmitting} size="lg">
            Sign In with Password
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Registered Email
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="you@university.edu"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleSendOtp}
                loading={otpSending}
                variant="outline"
                size="md"
              >
                {otpSent ? 'Resend' : 'Send Code'}
              </Button>
            </div>
          </div>

          {otpSent && (
            <div className="space-y-4 pt-1 animate-fade-in">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  6-Digit One-Time Passcode (dispatched via SMTP)
                </label>
                <Input
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="font-mono tracking-widest text-center text-lg font-bold"
                />
              </div>

              <Button
                type="button"
                onClick={handleVerifyOtp}
                loading={otpVerifying}
                className="w-full"
                size="lg"
              >
                Verify Passcode & Log In
              </Button>
            </div>
          )}
        </div>
      )}

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-500 hover:text-blue-600 font-semibold">
          Create student account
        </Link>
      </p>
    </div>
  )
}
