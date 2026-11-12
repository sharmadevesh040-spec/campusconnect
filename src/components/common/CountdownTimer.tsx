import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

export function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft())

  function getTimeLeft() {
    const diff = targetDate.getTime() - Date.now()
    if (diff <= 0) return null
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    return { hours, minutes, seconds, days: Math.floor(hours / 24) }
  }

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  if (!timeLeft) return <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Interview started</span>

  const display = timeLeft.days > 0
    ? `${timeLeft.days}d ${timeLeft.hours % 24}h ${timeLeft.minutes}m`
    : timeLeft.hours > 0
    ? `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`
    : `${timeLeft.minutes}m ${timeLeft.seconds}s`

  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400">
      <Clock className="w-4 h-4" />
      Interview starts in {display}
    </div>
  )
}
