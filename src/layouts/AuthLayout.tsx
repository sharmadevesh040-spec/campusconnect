import { Outlet, Link } from 'react-router-dom'
import { GraduationCap, ArrowLeft, Shield } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      {/* Sleek Minimalist Theatrical Top Bar */}
      <header className="relative z-30 w-full px-6 py-4 flex items-center justify-between border-b border-white/[0.05] bg-black/30 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            <GraduationCap className="w-5 h-5 text-black" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors">
              CampusConnect
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Ambassador Network
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Campus Hub</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LOOKAP SPOTLIGHT ACTIVE
          </div>
        </div>
      </header>

      {/* Main Theatrical Stage Body */}
      <main className="flex-1 flex items-center justify-center">
        <Outlet />
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-30 py-4 px-6 text-center text-[11px] font-mono text-zinc-600 border-t border-white/[0.04]">
        <span>CampusConnect &copy; 2026 &bull; Theatrical Spotlight Form Powered by Lookap Studio</span>
      </footer>
    </div>
  )
}
