import { Link } from 'react-router-dom'
import {
  GraduationCap, Mic2, Award, Calendar, CheckSquare,
  ShieldCheck, ArrowRight, Smartphone, Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export default function LandingPage() {
  const { canInstall, install } = usePWAInstall()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight">CampusConnect</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block -mt-1 tracking-wider uppercase">Student Hub</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canInstall && (
              <Button variant="outline" size="sm" onClick={install} leftIcon={<Smartphone className="w-4 h-4 text-blue-500" />}>
                Install App
              </Button>
            )}
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 via-transparent to-transparent dark:from-blue-950/20 pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Production-Ready Progressive Web App for Student Leaders
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.15]">
            Everything students need, <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              in one place.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The all-in-one platform for student ambassadors to manage interview countdowns, track application milestones, download verified certificates, and organize campus events.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/student/dashboard">
              <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-blue-500/20" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Launch Student Dashboard
              </Button>
            </Link>
            <Link to="/verify/GSA-2026-000123">
              <Button variant="outline" size="lg" className="h-12 px-6 text-base" leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}>
                Verify a Certificate
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold">Built for Modern University Programs</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">High-performance architecture with offline service worker support and instant sync</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Mic2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Interview Management</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Real-time countdown timer, interviewer instructions, calendar (.ics) sync, and automated reminder notifications before your round.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Verified Certificates & QR</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Cryptographically trackable certificate IDs (e.g. GSA-2026-000123) with public verification pages, instant PDF downloads, and QR scanning.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Events & Workshop Hub</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Browse campus summits, register with 1-click, sync meeting links to your Google or Outlook calendar, and monitor live seat capacity.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Task Management</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Track ambassador deliverables, submit monthly event reports, manage deadlines with progress meters, and prevent overdue tasks.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">AI Student Assistant</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Interactive mock interview simulator, STAR behavioral answer coaching, customized study plans, and instant program FAQ guidance.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Installable PWA & Offline</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Native application feel on Android, iOS, Windows, and macOS with service worker cache, IndexedDB offline persistence, and safe-area support.
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-8 px-6 text-center text-xs text-slate-500 space-y-2">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          CampusConnect — Everything students need, in one place.
        </p>
        <p className="text-slate-400">
          Built by a Google Student Ambassador · Designed for university leaders, campus clubs, and global student ambassador cohorts.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">Student Dashboard</Link>
          <Link to="/admin/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">Admin Command</Link>
          <Link to="/verify/GSA-2026-000123" className="text-blue-600 dark:text-blue-400 hover:underline">Public Verification</Link>
        </div>
      </footer>
    </div>
  )
}
