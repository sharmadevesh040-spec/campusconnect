export function LoadingSpinner({ fullScreen = false, size = 'md' }: { fullScreen?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  const spinner = (
    <div className={`${sizes[size]} border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin`} />
  )
  if (fullScreen) return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-slate-900 z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin" style={{ borderWidth: '3px' }} />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading CampusConnect...</p>
      </div>
    </div>
  )
  return spinner
}
