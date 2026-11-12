import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] })

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false)
  const { register: registerAuth } = useAuth()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    try {
      const res: any = await registerAuth(data.email, data.password, data.fullName)
      const codeParam = res?.verificationCode ? `&code=${encodeURIComponent(res.verificationCode)}` : ''
      toast.success('Account created!', {
        description: res?.verificationCode
          ? `Your 6-digit verification code is: ${res.verificationCode}`
          : 'A 6-digit confirmation code was dispatched via SMTP.'
      })
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}${codeParam}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      toast.error('Registration failed', { description: msg.includes('email-already-in-use') || msg.includes('already exists') ? 'An account with this email already exists.' : msg })
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create your account</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Join the CampusConnect Student Ambassador Network</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="John Doe"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.fullName?.message}
          autoComplete="name"
          {...register('fullName')}
        />
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
          placeholder="At least 6 characters"
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
          autoComplete="new-password"
          {...register('password')}
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="Repeat your password"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
        <Button type="submit" className="w-full" loading={isSubmitting} size="lg">
          Create Account
        </Button>
      </form>

      <p className="text-center text-xs text-slate-400 mt-4">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-500 hover:text-blue-600 font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  )
}
