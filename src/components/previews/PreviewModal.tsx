/**
 * Preview Modal
 *
 * Modal dialog for viewing offer previews with video player,
 * feature highlights, and CTA to generate a demo site.
 */

import { useState } from 'react'
import { X, Sparkles, Check, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PreviewVideoPlayer } from './PreviewVideoPlayer'
import type { ScenePlaylist, PlaylistEntry, PreviewMeta, PreviewMontage } from '@/previews'

// ─── Types ───────────────────────────────────────────────────

export interface PreviewModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void
  /** Montage definition */
  montage: PreviewMontage
  /** Preview metadata (loaded from meta.json) */
  meta?: PreviewMeta
  /** Playlist for the video player */
  playlist?: ScenePlaylist
  /** Base path for preview assets */
  basePath: string
  /** Features to highlight */
  features?: string[]
  /** Price information */
  price?: {
    amount: number
    currency: string
    period?: string
  }
  /** CTA button text */
  ctaLabel?: string
  /** CTA callback */
  onCta?: () => void
  /** Whether CTA is loading */
  isCtaLoading?: boolean
}

// ─── Default Features by Offer Type ──────────────────────────

const DEFAULT_FEATURES: Record<string, string[]> = {
  'law-firm-72-hour-launch': [
    'Professional law firm website',
    'Practice area pages',
    'Attorney bios',
    'Case results showcase',
    'Client intake forms',
    'Mobile responsive design',
  ],
  'small-business-starter': [
    'Custom business website',
    'Service showcase pages',
    'Team member profiles',
    'Testimonials section',
    'Contact forms',
    'SEO optimized',
  ],
  'digital-agency-pro': [
    'Portfolio showcase',
    'Project case studies',
    'Team directory',
    'Client testimonials',
    'Contact integration',
    'Modern animations',
  ],
  'premium-full-service': [
    'Premium design',
    'All features included',
    'Priority support',
    'Custom integrations',
    'Analytics dashboard',
    'Unlimited revisions',
  ],
}

// ─── Component ───────────────────────────────────────────────

export function PreviewModal({
  open,
  onOpenChange,
  montage,
  meta,
  playlist,
  basePath,
  features,
  price,
  ctaLabel = 'Generate Your Preview',
  onCta,
  isCtaLoading = false,
}: PreviewModalProps) {
  const [currentScene, setCurrentScene] = useState<PlaylistEntry | null>(null)
  
  // Use provided features or defaults
  const displayFeatures = features ?? DEFAULT_FEATURES[montage.offerId] ?? []
  
  const handleSceneChange = (scene: PlaylistEntry, _index: number) => {
    setCurrentScene(scene)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {montage.title}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {montage.description}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        {/* Content */}
        <div className="grid md:grid-cols-[1fr,300px]">
          {/* Video Player */}
          <div className="bg-black">
            {playlist ? (
              <PreviewVideoPlayer
                playlist={playlist}
                basePath={basePath}
                posterPath={meta?.posterFilename}
                autoPlay
                loop
                showControls
                showThumbnails
                onSceneChange={handleSceneChange}
              />
            ) : (
              /* Fallback when no playlist */
              <div className="aspect-video flex items-center justify-center text-white/60">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Preview not available</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="p-6 flex flex-col border-l">
            {/* Current Scene Info */}
            {currentScene && (
              <div className="mb-4 pb-4 border-b">
                <Badge variant="outline" className="mb-2">
                  {currentScene.label}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Preview of {currentScene.label.toLowerCase()} template
                </p>
              </div>
            )}
            
            {/* Features List */}
            <div className="flex-1 mb-6">
              <h4 className="text-sm font-medium mb-3">Includes</h4>
              <ul className="space-y-2">
                {displayFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Price */}
            {price && (
              <div className="mb-4 pb-4 border-t pt-4">
                <div className="text-2xl font-bold">
                  {price.currency === 'USD' ? '$' : price.currency}
                  {price.amount.toLocaleString()}
                  {price.period && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /{price.period}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* CTA */}
            <Button
              onClick={onCta}
              disabled={isCtaLoading}
              size="lg"
              className="w-full"
            >
              {isCtaLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {ctaLabel}
                </>
              )}
            </Button>
            
            {/* Meta info */}
            {meta && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                {meta.scenes.length} templates • {Math.round(meta.totalDurationSeconds)}s preview
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PreviewModal
