'use client'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-full"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      suppressHydrationWarning
    >
      <Sun className={`h-4 w-4 transition-all ${isDark ? 'scale-0 -rotate-90' : 'scale-100 rotate-0'}`} />
      <Moon className={`absolute h-4 w-4 transition-all ${isDark ? 'scale-100 rotate-0' : 'scale-0 rotate-90'}`} />
    </Button>
  )
}
