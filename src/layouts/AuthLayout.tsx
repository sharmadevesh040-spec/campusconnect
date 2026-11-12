import { Outlet } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex">
      {/* Left branding panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CampusConnect</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">Everything students need,<br/>in one place.</h1>
          <p className="text-blue-100 text-lg">Manage your interviews, certificates, events, tasks and more from one beautiful dashboard.</p>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { label: 'QR Verification', value: 'Verified' },
            { label: 'Countdown & Reminders', value: 'Interviews' },
            { label: 'Milestones & Deadlines', value: 'Tasks' },
            { label: 'Installable & Offline', value: 'PWA Ready' }
          ].map(feature => (
            <div key={feature.value} className="bg-white/10 rounded-2xl p-4">
              <p className="text-xl font-bold text-white">{feature.value}</p>
              <p className="text-blue-200 text-xs mt-0.5">{feature.label}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">CampusConnect</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
