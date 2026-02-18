/**
 * useHonorBarSettings — Centralized KV settings for HonorFlagBar
 *
 * Single source of truth for Honor Flag Bar configuration.
 * Used by App.tsx layout root to pass props to HonorFlagBar.
 */

import { useKV } from '@/lib/local-storage-kv'
import type { HonorFlagBarProps } from '@/components/HonorFlagBar'

export function useHonorBarSettings(): HonorFlagBarProps {
  const [barEnabled] = useKV<boolean>('honor-flag-bar-enabled', true)
  const [animationEnabled] = useKV<boolean>('honor-flag-bar-animation', true)
  const [parallaxEnabled] = useKV<boolean>('honor-flag-bar-parallax', true)
  const [rotationCadence] = useKV<number>('honor-flag-bar-rotation', 20)
  const [maxFlagsDesktop] = useKV<number>('honor-flag-bar-max-desktop', 7)
  const [maxFlagsMobile] = useKV<number>('honor-flag-bar-max-mobile', 3)
  const [alignment] = useKV<'left' | 'center' | 'right'>('honor-flag-bar-alignment', 'center')

  return {
    enabled: barEnabled ?? true,
    rotationCadence: (rotationCadence ?? 20) * 1000,
    maxFlagsDesktop: maxFlagsDesktop ?? 7,
    maxFlagsMobile: maxFlagsMobile ?? 3,
    animationEnabled: animationEnabled ?? true,
    alignment: alignment ?? 'center',
    parallaxEnabled: parallaxEnabled ?? true,
  }
}
