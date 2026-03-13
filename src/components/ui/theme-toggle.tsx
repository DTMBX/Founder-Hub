import { useEffect, useState } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import { Button } from './button'
import { Sun, Moon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

type Theme = 'dark' | 'light'

function useThemeState() {
  const [theme, setTheme] = useKV<Theme>('founder-hub-theme', 'dark')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.setAttribute('data-appearance', 'dark')
    } else {
      root.classList.remove('dark')
      root.setAttribute('data-appearance', 'light')
    }
  }, [theme])

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')
  return { theme: theme ?? 'dark', toggle, setTheme }
}

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, toggle } = useThemeState()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={cn('gap-2 text-xs', collapsed ? 'px-0 justify-center w-full' : 'justify-start w-full')}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
      {!collapsed && (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
    </Button>
  )
}
