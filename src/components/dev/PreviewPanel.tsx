/**
 * PreviewPanel.tsx — Live preview iframe with viewport presets and section selection.
 *
 * Renders the app inside an iframe at #studio-preview (a clean, chrome-free mode).
 * Provides viewport presets (desktop/tablet/mobile), section highlighting from
 * the host side, and relays click/hover events from the preview bridge.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Desktop, DeviceMobile, DeviceTablet, ArrowClockwise,
  ArrowsOut, Crosshair,
} from '@phosphor-icons/react'
import {
  createHostBridge,
  BRIDGE_PROTOCOL_VERSION,
  type PreviewMessage,
  type SerializedRect,
} from '@/lib/preview-bridge'
import {
  setStudioSelection,
  setStudioHover,
} from '@/lib/use-studio-selection'

// ─── Types ──────────────────────────────────────────────────────────────────

type ViewportPreset = 'desktop' | 'tablet' | 'mobile' | 'responsive'

interface ViewportDimension {
  label: string
  width: number | '100%'
  icon: React.ElementType
}

export interface PreviewPanelProps {
  /** Called when user clicks a section in the preview */
  onSectionSelect?: (sectionId: string, sectionType: string) => void
  /** Called when user hovers a section */
  onSectionHover?: (sectionId: string | null) => void
}

// ─── Constants ──────────────────────────────────────────────────────────────

const VIEWPORTS: Record<ViewportPreset, ViewportDimension> = {
  desktop: { label: 'Desktop', width: '100%', icon: Desktop },
  tablet: { label: 'Tablet', width: 768, icon: DeviceTablet },
  mobile: { label: 'Mobile', width: 375, icon: DeviceMobile },
  responsive: { label: 'Responsive', width: '100%', icon: ArrowsOut },
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PreviewPanel({ onSectionSelect, onSectionHover }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const bridgeRef = useRef<ReturnType<typeof createHostBridge> | null>(null)
  const [viewport, setViewport] = useState<ViewportPreset>('responsive')
  const [previewReady, setPreviewReady] = useState(false)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)
  const [hoverRect, setHoverRect] = useState<SerializedRect | null>(null)

  // Build the iframe URL — same origin, studio-preview hash route
  const previewUrl = `${window.location.origin}${window.location.pathname}#studio-preview`

  // ── Bridge setup ──

  const handlePreviewMessage = useCallback((msg: PreviewMessage) => {
    switch (msg.type) {
      case 'preview:ready':
        if (msg.version !== BRIDGE_PROTOCOL_VERSION) {
          console.warn(`[PreviewPanel] Protocol version mismatch: host=${BRIDGE_PROTOCOL_VERSION}, preview=${msg.version}`)
        }
        setPreviewReady(true)
        break
      case 'preview:section-click':
        setSelectedSection(msg.sectionId)
        setStudioSelection(msg.sectionId, msg.sectionType, msg.kvKey, msg.rect)
        onSectionSelect?.(msg.sectionId, msg.sectionType)
        break
      case 'preview:section-hover':
        setHoveredSection(msg.sectionId)
        setHoverRect(msg.rect)
        setStudioHover(msg.sectionId, msg.rect)
        onSectionHover?.(msg.sectionId)
        break
    }
  }, [onSectionSelect, onSectionHover])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const onLoad = () => {
      bridgeRef.current?.destroy()
      bridgeRef.current = createHostBridge(iframe, handlePreviewMessage)
      // Ping to check if preview bridge is ready
      bridgeRef.current.ping()
    }

    iframe.addEventListener('load', onLoad)
    return () => {
      iframe.removeEventListener('load', onLoad)
      bridgeRef.current?.destroy()
      bridgeRef.current = null
    }
  }, [handlePreviewMessage])

  // ── Actions ──

  const refreshPreview = () => {
    setPreviewReady(false)
    if (bridgeRef.current) {
      bridgeRef.current.refresh()
    } else if (iframeRef.current) {
      iframeRef.current.src = previewUrl
    }
  }

  // ── Viewport dimensions ──

  const currentViewport = VIEWPORTS[viewport]
  const iframeWidth = currentViewport.width === '100%' ? '100%' : `${currentViewport.width}px`

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border/40 bg-card/30">
        {/* Viewport presets */}
        {(Object.entries(VIEWPORTS) as [ViewportPreset, ViewportDimension][]).map(([key, vp]) => {
          const Icon = vp.icon
          return (
            <button
              key={key}
              onClick={() => setViewport(key)}
              className={cn(
                'p-1.5 rounded-md text-xs transition-colors',
                viewport === key
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
              )}
              title={vp.label}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          )
        })}

        <div className="flex-1" />

        {/* Status indicator */}
        <div className={cn(
          'h-2 w-2 rounded-full mr-1',
          previewReady ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
        )} title={previewReady ? 'Preview connected' : 'Connecting…'} />

        {/* Selected section label */}
        {selectedSection && (
          <span className="text-[10px] text-emerald-400 font-mono mr-2 flex items-center gap-1">
            <Crosshair className="h-3 w-3" />
            {selectedSection}
          </span>
        )}

        {/* Refresh */}
        <button
          onClick={refreshPreview}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
          title="Refresh preview"
        >
          <ArrowClockwise className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Preview iframe container */}
      <div className="flex-1 bg-neutral-900/50 flex items-start justify-center overflow-auto p-2">
        <div
          className={cn(
            'bg-white rounded-lg overflow-hidden shadow-xl transition-all duration-200',
            viewport !== 'responsive' && viewport !== 'desktop' && 'border border-border/20'
          )}
          style={{
            width: iframeWidth,
            maxWidth: '100%',
            height: viewport === 'responsive' || viewport === 'desktop' ? '100%' : undefined,
            minHeight: viewport === 'responsive' || viewport === 'desktop' ? '100%' : '600px',
          }}
        >
          <iframe
            ref={iframeRef}
            src={previewUrl}
            title="Site Preview"
            className="w-full h-full border-0"
            style={{ minHeight: '500px' }}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </div>

      {/* Hovered section info bar */}
      {hoveredSection && (
        <div className="px-3 py-1.5 border-t border-border/40 bg-card/30 flex items-center gap-2">
          <span className="text-[10px] text-blue-400 font-mono">
            hover: {hoveredSection}
          </span>
          {hoverRect && (
            <span className="text-[10px] text-muted-foreground">
              {Math.round(hoverRect.width)}×{Math.round(hoverRect.height)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

