import { useOffline } from '@/hooks/useOffline'
import { WifiOff, Wifi } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export function OfflineIndicator() {
  const { isOffline } = useOffline()
  const prevOffline = useRef(false)

  useEffect(() => {
    if (isOffline && !prevOffline.current) {
      toast.warning("You're offline", { description: "Some features may be temporarily unavailable.", duration: Infinity, id: 'offline' })
    } else if (!isOffline && prevOffline.current) {
      toast.dismiss('offline')
      toast.success("Back online ✓", { description: "Syncing your data...", duration: 3000 })
    }
    prevOffline.current = isOffline
  }, [isOffline])

  if (!isOffline) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-xs font-medium py-1 px-4 flex items-center gap-2 justify-center">
      <WifiOff className="w-3 h-3" />
      You're offline — some features may be temporarily unavailable
    </div>
  )
}
