/**
 * StudioPreview.tsx — Chrome-free PublicSite render for the preview iframe.
 *
 * Loaded at #studio-preview. Injects the selection overlay so the host
 * studio can communicate with this frame via postMessage. No DevCustomizer,
 * no toolbars — just the public site with click-to-select behavior.
 */

import { useEffect, useRef } from 'react'
import PublicSite from '../PublicSite'
import { initSelectionOverlay } from '@/lib/selection-overlay'

export default function StudioPreview() {
  const overlayRef = useRef<ReturnType<typeof initSelectionOverlay> | null>(null)

  useEffect(() => {
    // Only init overlay if we're inside an iframe
    if (window.parent === window) return

    overlayRef.current = initSelectionOverlay()

    return () => {
      overlayRef.current?.destroy()
      overlayRef.current = null
    }
  }, [])

  // Dummy handlers — navigation from preview is ignored
  const noop = () => {}

  return (
    <PublicSite
      onNavigateToCase={noop}
    />
  )
}
