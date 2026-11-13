import { useState } from 'react'
import { ShieldCheck, CheckCircle2, QrCode, Sparkles } from 'lucide-react'

interface TactileIdVaultProps {
  studentName?: string
  studentId?: string
  role?: string
  program?: string
}

export function TactileIdVault({
  studentName = 'Devesh Sharma',
  studentId = 'CC-2026-8841',
  role = 'Campus Fellow',
  program = 'Google Student Ambassador'
}: TactileIdVaultProps) {
  const [isInserted, setIsInserted] = useState(false)

  return (
    <div
      className="relative w-full max-w-[380px] mx-auto select-none cursor-pointer group"
      onMouseEnter={() => setIsInserted(true)}
      onMouseLeave={() => setIsInserted(false)}
      onClick={() => setIsInserted(!isInserted)}
    >
      {/* Outer Glow Halo */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition duration-500" />

      {/* Main Hardware Chassis */}
      <div className="relative rounded-3xl bg-[#0e0f14] border border-white/15 p-5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.2)] overflow-hidden">
        
        {/* Chassis Top Rim & Status */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className={isInserted ? 'spec-dot-emerald' : 'spec-dot-indigo'} />
            <span className="font-mono text-[10px] tracking-wider uppercase text-slate-300 font-semibold">
              {isInserted ? 'READER: ENGAGED' : 'VAULT: STANDBY'}
            </span>
          </div>
          <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">
            TOUCH / HOVER TO SCAN
          </span>
        </div>

        {/* Card Insertion Bay */}
        <div className="relative h-[150px] overflow-hidden rounded-2xl bg-[#07080b] border border-white/[0.06] p-2 flex justify-center items-start shadow-inner">
          
          {/* Physical Slot Lip Indicator */}
          <div className="absolute top-0 inset-x-8 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent z-20" />

          {/* Sliding Identity Card (Modeled after Lookap id-card-reader-hover) */}
          <div
            className={`w-[92%] h-[130px] rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-700 p-3.5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-out z-10 flex flex-col justify-between ${
              isInserted ? 'translate-y-[55px]' : 'translate-y-0 group-hover:translate-y-1'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xs ring-1 ring-white/30">
                  {studentName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-xs tracking-tight leading-tight">{studentName}</h4>
                  <p className="text-[10px] text-blue-100 font-medium">{role}</p>
                </div>
              </div>
              <ShieldCheck className="w-4 h-4 text-blue-200" />
            </div>

            <div className="flex items-end justify-between pt-2 border-t border-white/20 text-[10px] font-mono">
              <div>
                <span className="text-blue-200 text-[9px] block">PROGRAM</span>
                <span className="font-semibold text-white truncate max-w-[170px] block">{program}</span>
              </div>
              <div className="text-right">
                <span className="text-blue-200 text-[9px] block">ID NO.</span>
                <span className="font-bold text-white tracking-wider">{studentId}</span>
              </div>
            </div>
          </div>

          {/* Slot Entrance Mask */}
          <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#0e0f14] via-[#0e0f14]/90 to-transparent z-15 pointer-events-none" />
        </div>

        {/* Tactile Dot-Matrix LCD Display */}
        <div className="mt-3.5 rounded-xl bg-[#060709] border border-white/10 p-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]">
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
              <span className="text-slate-400">IDENTITY</span>
              <span className={`font-bold flex items-center gap-1 ${isInserted ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isInserted ? 'VALID ✓' : 'READY'}
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
              <span className="text-slate-400">ACCESS</span>
              <span className={`font-bold flex items-center gap-1 ${isInserted ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isInserted ? 'GRANTED ✓' : 'STANDBY'}
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
              <span className="text-slate-400">STATUS</span>
              <span className={`font-bold flex items-center gap-1 ${isInserted ? 'text-blue-400' : 'text-slate-500'}`}>
                {isInserted ? 'ACTIVE' : 'IDLE'}
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
              <span className="text-slate-400">SECURITY</span>
              <span className={`font-bold flex items-center gap-1 ${isInserted ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isInserted ? 'SHA-256' : 'ENCRYPTED'}
              </span>
            </div>

          </div>
        </div>

        {/* Bottom Tactile Grip Ridges (Lookap hardware signature) */}
        <div className="flex items-center justify-center gap-1.5 mt-3 pt-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className="w-7 h-1 rounded-full bg-white/[0.08] shadow-[inset_0_1px_1px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.08)]"
            />
          ))}
        </div>

      </div>
    </div>
  )
}
