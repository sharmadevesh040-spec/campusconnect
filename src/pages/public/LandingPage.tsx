import { Link } from 'react-router-dom'
import {
  GraduationCap, Mic2, Award, Calendar, CheckSquare,
  ShieldCheck, ArrowRight, Smartphone, Sparkles, CheckCircle2, ChevronRight,
  Clock, Video, MapPin, ExternalLink, Activity
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { TactileIdVault } from '@/components/dashboard/TactileIdVault'

export default function LandingPage() {
  const { canInstall, install } = usePWAInstall()

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white transition-colors">
      
      {/* ── Lookap Hairline Floating Navbar ── */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0c0d12]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.08] px-6 py-3.5 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_8px_rgba(37,99,235,0.4)]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">CampusConnect</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold block -mt-0.5 tracking-wider uppercase">OS v2.4</span>
            </div>
          </div>

          {/* Center Status Pill */}
          <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-xs font-mono">
            <span className="spec-dot-emerald" />
            <span className="text-slate-600 dark:text-slate-300">CAMPUS RADAR: ONLINE</span>
          </div>

          <div className="flex items-center gap-2.5">
            {canInstall && (
              <Button
                variant="outline"
                size="sm"
                onClick={install}
                leftIcon={<Smartphone className="w-3.5 h-3.5 text-blue-500" />}
                className="text-xs font-medium"
              >
                Install App
              </Button>
            )}
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs">Sign In</Button>
            </Link>
            <Link to="/student/dashboard">
              <Button variant="tactile" size="sm" className="text-xs font-semibold">
                Open Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Lookap Cosmic Hero Section ── */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-20 px-6">
        {/* Ambient Radial Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-blue-500/15 via-indigo-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-mono font-medium">
                <Sparkles className="w-3.5 h-3.5" /> LOOKAP DESIGN INTELLIGENCE
              </span>
              <span className="spec-tag">100% OFFLINE PWA</span>
              <span className="spec-tag">SHA-256 VAULT</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              The Campus OS for{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                High-Performing Students.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              Track live interview rounds with precise countdown timers, manage high-priority tasks, explore campus bulletins, and download tamper-proof cryptographic certificates.
            </p>

            {/* Lookap Tactile Action Controls */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/student/dashboard">
                <Button variant="tactile" size="lg" className="h-12 px-7 text-sm font-semibold" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Launch Student Dashboard
                </Button>
              </Link>
              <Link to="/verify/GSA-2026-282742">
                <Button variant="tactileSilver" size="lg" className="h-12 px-6 text-sm" leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}>
                  Verify Certificate
                </Button>
              </Link>
            </div>

            {/* Spec Footnotes */}
            <div className="pt-4 flex items-center gap-6 text-xs font-mono text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1.5"><span className="spec-dot-emerald" /> ZERO LATENCY SYNC</span>
              <span className="flex items-center gap-1.5"><span className="spec-dot-indigo" /> AMBASSADOR RADAR</span>
              <span className="flex items-center gap-1.5"><span className="spec-dot-amber" /> 60 FPS MOTION</span>
            </div>
          </div>

          {/* Right Column: Interactive Lookap Tactile ID Vault */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md">
              <TactileIdVault
                studentName="Devesh Sharma"
                studentId="CC-2026-8841"
                role="Campus Fellow & Lead"
                program="Google Student Ambassador"
              />
              <p className="text-center text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-3">
                Interactive hardware simulation · Hover or click to insert badge
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── Lookap Bento Feature Showcase ── */}
      <section className="max-w-6xl mx-auto px-6 py-14 space-y-10">
        
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="spec-tag">ARCHITECTURE & CAPABILITIES</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Built with Lookap Tactile Tokens
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            High-density interfaces designed for maximum clarity, low cognitive load, and instant access to campus operations.
          </p>
        </div>

        {/* 3-Column Bento Cards */}
        <div className="grid md:grid-cols-3 gap-5">
          
          {/* Card 1: Interview Command Center */}
          <div className="lookap-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-white/[0.06] border border-blue-200/50 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Mic2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Interview Command Center</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Precision countdown timers, direct video links, calendar (.ics) synchronization, and automated preparation checklists before your round.
              </p>
            </div>
            
            <div className="lookap-recess p-3 mt-4 text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-500">COUNTDOWN:</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">02h 45m 12s</span>
            </div>
          </div>

          {/* Card 2: Cryptographic Credentials */}
          <div className="lookap-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-white/[0.06] border border-emerald-200/50 dark:border-white/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Cryptographic Credentials</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Official certificates signed with SHA-256 tamper-proof verification. Instantly inspect full PDF previews or download with one click.
              </p>
            </div>

            <div className="lookap-recess p-3 mt-4 text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-500">HASH:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[140px]">7f8a...c921 ✓</span>
            </div>
          </div>

          {/* Card 3: Priority Task Pipeline */}
          <div className="lookap-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-white/[0.06] border border-amber-200/50 dark:border-white/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Milestone Task Engine</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Prioritized academic deadlines, event planning pipelines, and offline-first IndexedDB background sync for zero work loss.
              </p>
            </div>

            <div className="lookap-recess p-3 mt-4 text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-500">COMPLETION:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">92% ON TRACK</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── Lookap Action Banner ── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-3xl bg-[#0c0d12] border border-white/15 p-8 md:p-12 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2 max-w-xl text-left relative z-10">
            <span className="spec-tag">READY FOR PRODUCTION</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to experience the CampusConnect Dashboard?
            </h2>
            <p className="text-slate-300 text-sm">
              Sign in with your student credentials or explore the live dashboard preview immediately.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10 flex-shrink-0">
            <Link to="/student/dashboard">
              <Button variant="tactile" size="lg" className="h-12 px-8 font-semibold">
                Launch Dashboard
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="tactileDark" size="lg" className="h-12 px-6">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Minimal Technical Footer ── */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-white/[0.08] px-6 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">CampusConnect</span>
            <span>· Engineered with Lookap Design Intelligence</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <Link to="/verify/GSA-2026-282742" className="hover:text-blue-500 transition-colors">Verify Credential</Link>
            <Link to="/student/dashboard" className="hover:text-blue-500 transition-colors">Student Dashboard</Link>
            <Link to="/login" className="hover:text-blue-500 transition-colors">Portal Login</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
