import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, UserCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiRequest } from '@/services/api'
import { UserRole } from '@/types/user'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false)
  const { login, googleSignIn } = useAuth()
  const navigate = useNavigate()

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const handleFillCredentials = (email: string, pass: string) => {
    setValue('email', email)
    setValue('password', pass)
    toast.info(`Filled credentials for ${email}`)
  }

  const onSubmit = async (data: FormData) => {
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
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Enter your credentials to access your dashboard</p>
      </div>

      {/* Quick Fill Database Credentials */}
      <div className="mb-6 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Database Accounts
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleFillCredentials('alex@campusconnect.edu', 'student123')}
            className="flex items-center gap-1.5 p-2 rounded-lg text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors text-xs"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <div className="truncate">
              <span className="font-semibold block text-slate-800 dark:text-slate-200">Student Account</span>
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
              <span className="font-semibold block text-slate-800 dark:text-slate-200">Admin Account</span>
              <span className="text-[10px] text-slate-400">admin@campusconnect.edu</span>
            </div>
          </button>
        </div>
      </div>

      <button
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200 mb-6 shadow-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
        <div className="relative flex justify-center"><span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400">or sign in with email</span></div>
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
        <Input
          label="Password"
          type={showPass ? 'text' : 'password'}
          placeholder="Enter your password"
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button type="button" onClick={() => setShowPass(!showPass)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.password?.message}
          autoComplete="current-password"
          {...register('password')}
        />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-blue-500 hover:text-blue-600 font-medium">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting} size="lg">Sign In</Button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-500 hover:text-blue-600 font-semibold">Create account</Link>
      </p>
    </div>
  )
}
