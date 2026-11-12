import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MailCheck, ArrowRight } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <Card className="p-8 shadow-xl border-slate-200 dark:border-slate-800 text-center space-y-4">
      <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
        <MailCheck className="w-7 h-7" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Email Verified!</h1>
      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
        Your student ambassador email address has been confirmed. You now have full access to interviews, certificates, and campus event registries.
      </p>

      <div className="pt-2">
        <Link to="/student/dashboard">
          <Button className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Go to Student Dashboard
          </Button>
        </Link>
      </div>
    </Card>
  )
}
