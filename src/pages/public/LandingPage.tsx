import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap, Mic2, Award, Calendar, CheckSquare,
  ShieldCheck, ArrowRight, Smartphone, ExternalLink,
  Clock, MapPin, Video, ChevronRight
} from 'lucide-react'
import { LookapStage } from '@/components/dashboard/LookapStage'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { ThemeToggle } from '@/components/common/ThemeToggle'

export default function LandingPage() {
  const { canInstall, install } = usePWAInstall()
  const feedItems = [
    {
      id: 'cert-1',
      tag: 'CREDENTIAL · SHA-256',
      ratio: '1.414',
      title: 'Google Student Ambassador Certificate',
      by: 'Official University Ambassador Program',
      status: 'VERIFIED',
      statusColor: 'text-[#11d04a]',
      detail: 'GSA-2026-KK670 · Tamper-proof vector PDF issued',
      icon: Award
    },
    {
      id: 'cert-2',
      tag: 'STUDENT IDENTITY · ACTIVE',
      ratio: '1.586',
      title: 'Digital Campus Access Badge & Ambassador ID',
      by: 'Campus Security & Identity Registrar',
      status: 'AUTHENTICATED',
      statusColor: 'text-[#2170f5]',
      detail: 'Hardware simulation reader & cryptographic validation',
      icon: ShieldCheck
    }
  ]

  return (
    <div className="min-h-screen bg-[#090a0d] text-[#e4e4e7] flex flex-col font-sans selection:bg-[#27272a] selection:text-white">
      
      {/* ── Lookap Hairline Header ── */}
      <header className="sticky top-0 z-40 bg-[#090a0d]/90 backdrop-blur-md border-b border-white/[0.08] px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#18181b] border border-white/10 flex items-center justify-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
              <GraduationCap className="w-4 h-4 text-[#e4e4e7]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-[15px] tracking-[-0.01em] text-white">CampusConnect</span>
              <span className="font-mono text-[11px] text-[#71717a]">/ registry</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canInstall && (
              <button
                onClick={install}
                className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px] text-[#a1a1aa] hover:text-white transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>install pwa</span>
              </button>
            )}

            <Link
              to="/student/dashboard"
              className="sfx-button sfx-silver h-8 rounded-full px-4 text-[12px]"
            >
              Open dashboard
            </Link>
          </div>

        </div>
      </header>

      {/* ── Main Lookap Hero Grid ── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pt-10 pb-20 space-y-20">
        
        <section className="grid items-center gap-10 pt-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:pt-10">
          
          {/* Left Column: Understated Editorial Typography */}
          <div className="flex min-w-0 max-w-[54ch] flex-col gap-6">
            
            <h1 className="text-[38px] leading-[1.06] font-medium tracking-[-0.035em] text-[#ededed] sm:text-[50px]">
              The campus operating system for high-performing students.
            </h1>

            <p className="text-[15px] leading-[1.58] text-[#8e8e93]">
              CampusConnect is an institutional student ambassador registry and credential verification platform. It issues cryptographically verified student certificates, manages digital student identities, and delivers tamper-proof SHA-256 verification.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/student/dashboard"
                className="sfx-button sfx-silver h-10 rounded-full px-5 text-[14px]"
              >
                Launch student dashboard
              </Link>
              <Link
                to="/verify/GSA-2026-282742"
                className="sfx-button sfx-outline h-10 rounded-full px-5 text-[14px]"
              >
                Verify a certificate
              </Link>
            </div>

            {/* Lookap Strict Monospace Stats Telemetry */}
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 pt-2 font-mono text-[12px] text-[#71717a] sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-2">
              <div>
                <dt className="text-[#ededed] font-semibold">100%</dt>
                <dd>offline PWA</dd>
              </div>
              <div>
                <dt className="text-[#ededed] font-semibold">SHA-256</dt>
                <dd>tamper-proof certs</dd>
              </div>
              <div>
                <dt className="text-[#ededed] font-semibold">0 ms</dt>
                <dd>local IndexedDB sync</dd>
              </div>
              <div>
                <dt className="text-[#ededed] font-semibold">60 fps</dt>
                <dd>tactile motion</dd>
              </div>
            </dl>

          </div>

          {/* Right Column: Authentic Lookap Hardware ID Card Stage */}
          <div className="relative min-w-0 overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
            <LookapStage
              studentName="Devesh Sharma"
              studentId="CC-2026-8841"
              role="Campus Fellow"
              program="Google Student Ambassador"
            />
          </div>

        </section>

        {/* ── Lookap Specimen Feed Section ── */}
        <section className="space-y-6 pt-6 border-t border-white/[0.08]">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-medium tracking-[-0.02em] text-[#ededed]">
                Verified Credentials & Digital Identity
              </h2>
              <p className="text-[13px] text-[#71717a] mt-0.5">
                Cryptographically signed institutional certificates and student ID badges
              </p>
            </div>
          </div>

          {/* 2-Column High-Density Specimen Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {feedItems.map(item => (
              <div
                key={item.id}
                className="group relative rounded-xl bg-[#121216] border border-white/[0.08] p-5 hover:border-white/20 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#71717a] mb-2.5">
                    <span className="tracking-wider uppercase">{item.tag}</span>
                    <span className="font-semibold text-[#a1a1aa]">{item.ratio}</span>
                  </div>

                  <h3 className="text-[15px] font-medium text-[#ededed] group-hover:text-white transition-colors leading-snug mb-1">
                    {item.title}
                  </h3>
                  <p className="text-[12px] text-[#8e8e93] mb-4">
                    {item.by}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[#71717a] truncate max-w-[240px]">{item.detail}</span>
                  <span className={`font-semibold ${item.statusColor}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* ── Lookap Direct Navigation Footer ── */}
        <footer className="pt-10 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#71717a]">
          <div className="flex items-center gap-3">
            <span className="text-[#ededed] font-semibold">CampusConnect</span>
            <span>· Engineered with Lookap Design Intelligence</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/student/dashboard" className="hover:text-white transition-colors">
              Student Dashboard →
            </Link>
            <Link to="/login" className="hover:text-white transition-colors">
              Sign In →
            </Link>
          </div>
        </footer>

      </main>

    </div>
  )
}
