import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/Button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
  const icons = { light: <Sun className="w-4 h-4" />, dark: <Moon className="w-4 h-4" />, system: <Monitor className="w-4 h-4" /> }
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(next)} title={`Switch to ${next} mode`} aria-label={`Switch to ${next} mode`}>
      {icons[theme]}
    </Button>
  )
}
