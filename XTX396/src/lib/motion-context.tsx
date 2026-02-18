import React, { createContext, useContext, useEffect, useState } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import { SiteSettings } from './types'

interface MotionContextType {
  motionLevel: 'full' | 'reduced' | 'off'
  glassIntensity: 'low' | 'medium' | 'high'
  gradientUsage: 'off' | 'accent' | 'enhanced'
  contrastMode: 'standard' | 'extra'
}

const MotionContext = createContext<MotionContextType>({
  motionLevel: 'full',
  glassIntensity: 'medium',
  gradientUsage: 'accent',
  contrastMode: 'standard',
})

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [settings] = useKV<SiteSettings>('founder-hub-settings', {
    siteName: 'Devon Tyler Barber',
    tagline: 'Founder & Innovator',
    description: 'Building transformative solutions at the intersection of technology and justice.',
    primaryDomain: 'xTx396.online',
    domainRedirects: [],
    analyticsEnabled: true,
    indexingEnabled: true,
    investorModeAvailable: true,
    motionLevel: 'full',
    glassIntensity: 'medium',
    gradientUsage: 'accent',
    contrastMode: 'standard',
  })

  const [motionLevel, setMotionLevel] = useState<'full' | 'reduced' | 'off'>('full')

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (settings?.motionLevel) {
      setMotionLevel(settings.motionLevel)
    } else if (prefersReducedMotion) {
      setMotionLevel('reduced')
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const listener = () => {
      if (!settings?.motionLevel && mediaQuery.matches) {
        setMotionLevel('reduced')
      }
    }
    
    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [settings?.motionLevel])

  useEffect(() => {
    if (settings?.contrastMode === 'extra') {
      document.documentElement.classList.add('extra-contrast')
    } else {
      document.documentElement.classList.remove('extra-contrast')
    }
  }, [settings?.contrastMode])

  const value: MotionContextType = {
    motionLevel,
    glassIntensity: settings?.glassIntensity || 'medium',
    gradientUsage: settings?.gradientUsage || 'accent',
    contrastMode: settings?.contrastMode || 'standard',
  }

  return (
    <MotionContext.Provider value={value}>
      {children}
    </MotionContext.Provider>
  )
}

export function useMotionContext() {
  return useContext(MotionContext)
}
