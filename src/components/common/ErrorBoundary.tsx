import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, LogOut } from 'lucide-react'
import { clearToken } from '@/services/api'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CampusConnect React Crash Caught]:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleClearAndLogin = () => {
    try {
      localStorage.clear()
      clearToken()
    } catch {}
    window.location.href = '/login'
  }

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/student/dashboard'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090b] text-slate-100 flex items-center justify-center p-4 selection:bg-amber-400 selection:text-black">
          <div className="relative max-w-lg w-full rounded-3xl bg-[#0e0f14] border border-white/10 p-6 md:p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)] overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 mb-4 shadow-inner">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-mono tracking-wide text-red-300 mb-3">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                SYSTEM RECOVERY ACTIVATED
              </div>

              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-2">
                {this.props.fallbackTitle || 'Display Refresh Required'}
              </h2>

              <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-md mb-6">
                CampusConnect encountered a telemetry rendering mismatch. Cached data has been safely preserved. Click below to refresh your operational view.
              </p>

              {this.state.error && (
                <div className="w-full text-left p-3 mb-6 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] text-red-400/90 overflow-x-auto max-h-32">
                  <p className="font-bold text-red-300">Error: {this.state.error.message || String(this.state.error)}</p>
                  {this.state.error.stack && (
                    <pre className="text-[10px] text-slate-500 mt-1 whitespace-pre-wrap leading-tight">
                      {this.state.error.stack.split('\n').slice(0, 3).join('\n')}
                    </pre>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 border border-blue-400/30 transition-all active:scale-[0.98]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload Display</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleGoHome}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                  <span>Dashboard Home</span>
                </button>
              </div>

              <button
                type="button"
                onClick={this.handleClearAndLogin}
                className="mt-4 text-[11px] font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>Reset Cache & Sign In Again</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
