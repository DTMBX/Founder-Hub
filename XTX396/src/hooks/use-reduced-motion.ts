import { useEffect, useState } from 'react'

export type MotionLevel = 'full' | 'reduced' | 'off'

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [])

  return prefersReducedMotion
}

export function useMotionPreference(): MotionLevel {
  const systemReducedMotion = useReducedMotion()
  const [userPreference, setUserPreference] = useState<MotionLevel | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('motion-preference') as MotionLevel | null
    if (stored) {
      setUserPreference(stored)
    }
  }, [])

  if (userPreference !== null) {
    return userPreference
  }

  return systemReducedMotion ? 'reduced' : 'full'
}
