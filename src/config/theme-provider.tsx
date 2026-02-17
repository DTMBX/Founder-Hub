/**
 * Theme Provider
 * 
 * Applies site-specific theming based on configuration.
 * Handles glassmorphism, animations, color palettes.
 */

import React, { useEffect, useLayoutEffect } from 'react'
import { themeConfig, type ThemePreset } from '@/config/site.config'

// Preset theme definitions
const THEME_PRESETS: Record<ThemePreset, {
  colors: typeof themeConfig.colors
  effects: { glass: string; glow: string; shadow: string }
  animations: { duration: string; easing: string }
}> = {
  default: {
    colors: {
      primary: '#3182ce',
      secondary: '#4a5568',
      accent: '#38a169',
      background: '#0a0a0a',
      foreground: '#fafafa',
      muted: '#27272a',
      border: '#27272a',
    },
    effects: {
      glass: 'rgba(255, 255, 255, 0.05)',
      glow: '0 0 40px rgba(49, 130, 206, 0.3)',
      shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    animations: { duration: '0.3s', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  },
  'law-firm': {
    colors: {
      primary: '#1a365d',
      secondary: '#744210',
      accent: '#c05621',
      background: '#0c0c0c',
      foreground: '#f7f7f7',
      muted: '#1e1e1e',
      border: '#2d2d2d',
    },
    effects: {
      glass: 'rgba(26, 54, 93, 0.1)',
      glow: '0 0 60px rgba(196, 181, 143, 0.2)',
      shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
    },
    animations: { duration: '0.4s', easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' },
  },
  medical: {
    colors: {
      primary: '#2c5282',
      secondary: '#276749',
      accent: '#38b2ac',
      background: '#0a0f14',
      foreground: '#f0fdf4',
      muted: '#1a2332',
      border: '#234e70',
    },
    effects: {
      glass: 'rgba(44, 82, 130, 0.08)',
      glow: '0 0 50px rgba(56, 178, 172, 0.2)',
      shadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)',
    },
    animations: { duration: '0.35s', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  },
  contractor: {
    colors: {
      primary: '#2d3748',
      secondary: '#dd6b20',
      accent: '#38a169',
      background: '#0f0f0f',
      foreground: '#f5f5f5',
      muted: '#262626',
      border: '#404040',
    },
    effects: {
      glass: 'rgba(221, 107, 32, 0.08)',
      glow: '0 0 45px rgba(221, 107, 32, 0.25)',
      shadow: '0 30px 60px -15px rgba(0, 0, 0, 0.35)',
    },
    animations: { duration: '0.25s', easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
  },
  nonprofit: {
    colors: {
      primary: '#553c9a',
      secondary: '#38a169',
      accent: '#d69e2e',
      background: '#0d0b14',
      foreground: '#faf5ff',
      muted: '#1a1625',
      border: '#2d2640',
    },
    effects: {
      glass: 'rgba(85, 60, 154, 0.1)',
      glow: '0 0 55px rgba(214, 158, 46, 0.2)',
      shadow: '0 25px 50px -12px rgba(85, 60, 154, 0.2)',
    },
    animations: { duration: '0.4s', easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  },
  ecommerce: {
    colors: {
      primary: '#1a202c',
      secondary: '#e53e3e',
      accent: '#48bb78',
      background: '#000000',
      foreground: '#ffffff',
      muted: '#171717',
      border: '#262626',
    },
    effects: {
      glass: 'rgba(255, 255, 255, 0.03)',
      glow: '0 0 80px rgba(72, 187, 120, 0.15)',
      shadow: '0 35px 60px -15px rgba(0, 0, 0, 0.5)',
    },
    animations: { duration: '0.2s', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  },
}

/**
 * Apply theme CSS custom properties to document root
 */
export function applyTheme(preset?: ThemePreset): void {
  const activePreset = preset || themeConfig.preset
  const theme = THEME_PRESETS[activePreset] || THEME_PRESETS.default
  
  // Merge preset with any custom overrides from config
  const colors = { ...theme.colors, ...themeConfig.colors }
  const effects = themeConfig.effects
  
  const root = document.documentElement
  
  // Apply colors
  root.style.setProperty('--color-primary', colors.primary)
  root.style.setProperty('--color-secondary', colors.secondary)
  root.style.setProperty('--color-accent', colors.accent)
  root.style.setProperty('--color-background', colors.background)
  root.style.setProperty('--color-foreground', colors.foreground)
  root.style.setProperty('--color-muted', colors.muted)
  root.style.setProperty('--color-border', colors.border)
  
  // Apply effects
  root.style.setProperty('--effect-glass', theme.effects.glass)
  root.style.setProperty('--effect-glow', theme.effects.glow)
  root.style.setProperty('--effect-shadow', theme.effects.shadow)
  
  // Animation settings
  root.style.setProperty('--animation-duration', theme.animations.duration)
  root.style.setProperty('--animation-easing', theme.animations.easing)
  
  // Toggle effect classes
  root.classList.toggle('glass-enabled', effects.glassmorphism)
  root.classList.toggle('animations-enabled', effects.animations)
  root.classList.toggle('particles-enabled', effects.particles)
  root.classList.toggle('gradients-enabled', effects.gradients)
  root.classList.toggle('no-whitespace', themeConfig.layout.noWhitespace)
  
  // Layout properties
  root.style.setProperty('--layout-max-width', themeConfig.layout.maxWidth)
  root.style.setProperty('--layout-padding', themeConfig.layout.containerPadding)
  root.style.setProperty('--section-spacing', themeConfig.layout.sectionSpacing)
}

/**
 * React hook to apply theme on mount
 */
export function useTheme(): void {
  useLayoutEffect(() => {
    applyTheme()
  }, [])
}

/**
 * Theme Provider Component
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme()
  }, [])
  
  return <>{children}</>
}

export { THEME_PRESETS }
export default ThemeProvider
