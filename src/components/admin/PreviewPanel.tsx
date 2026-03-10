/**
 * PreviewPanel — Side-by-side live preview with viewport presets.
 *
 * Renders the public site in an iframe alongside the editor.
 * Supports desktop, tablet, and mobile viewport presets.
 * Shows a dirty indicator when changes haven't been applied to the preview.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Desktop, DeviceMobile, DeviceTablet, ArrowsOut, ArrowsIn,
  ArrowClockwise, Warning, X, Eye
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ViewportPreset {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; weight?: string }>
  width: number | '100%'
  height: string
}

const VIEWPORTS: ViewportPreset[] = [
  { id: 'desktop', label: 'Desktop', icon: Desktop, width: '100%', height: '100%' },
  { id: 'tablet', label: 'Tablet', icon: DeviceTablet, width: 768, height: '100%' },
  { id: 'mobile', label: 'Mobile', icon: DeviceMobile, width: 375, height: '100%' },
]

interface PreviewPanelProps {
  /** Whether the editor has unsaved/unapplied changes */
  isDirty?: boolean
  /** Callback to close the preview panel */
  onClose: () => void
  /** Optional site URL override */
  siteUrl?: string
}

export default function PreviewPanel({ isDirty = false, onClose, siteUrl }: PreviewPanelProps) {
  const [viewport, setViewport] = useState('desktop')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const currentViewport = VIEWPORTS.find(v => v.id === viewport) || VIEWPORTS[0]
  const previewUrl = siteUrl || `${window.location.origin}${window.location.pathname}`

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  // Keyboard escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className={cn(
      'flex flex-col border-l border-border bg-muted/30',
      isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'w-1/2 min-w-[400px]'
    )}>
      {/* Preview toolbar */}
      <div className="flex items-center justify-between h-12 px-3 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" weight="duotone" />
          <span className="text-sm font-semibold">Preview</span>
          {isDirty && (
            <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 gap-1">
              <Warning className="h-3 w-3" weight="fill" />
              Unsaved
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Viewport presets */}
          {VIEWPORTS.map(vp => {
            const Icon = vp.icon
            const isActive = viewport === vp.id
            return (
              <Button
                key={vp.id}
                variant={isActive ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewport(vp.id)}
                title={vp.label}
              >
                <Icon className="h-3.5 w-3.5" weight={isActive ? 'fill' : 'regular'} />
              </Button>
            )
          })}

          <div className="w-px h-4 bg-border mx-1" />

          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefresh} title="Refresh">
            <ArrowClockwise className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <ArrowsIn className="h-3.5 w-3.5" /> : <ArrowsOut className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Close Preview">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Viewport label */}
      <div className="flex items-center justify-center h-7 text-[10px] text-muted-foreground bg-muted/50 border-b border-border/50 shrink-0">
        {currentViewport.label}
        {typeof currentViewport.width === 'number' && ` · ${currentViewport.width}px`}
      </div>

      {/* Preview iframe */}
      <div className="flex-1 flex items-start justify-center overflow-auto p-4 bg-muted/20">
        <div
          className={cn(
            'bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 h-full',
            typeof currentViewport.width === 'number' ? 'border border-border' : 'w-full'
          )}
          style={{
            width: typeof currentViewport.width === 'number' ? currentViewport.width : '100%',
            maxWidth: '100%',
          }}
        >
          <iframe
            ref={iframeRef}
            key={refreshKey}
            src={previewUrl}
            title="Site Preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      </div>
    </div>
  )
}
