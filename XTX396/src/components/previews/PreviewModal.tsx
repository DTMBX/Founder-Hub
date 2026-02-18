/**
 * Preview Modal
 *
 * Modal dialog for viewing offer previews with video player,
 * pricing tiers, feature highlights, and CTA to generate a demo site.
 * 
 * Layout optimized for all screen sizes with responsive grid.
 */

import { useState } from 'react'
import { X, Sparkles, Check, ExternalLink, Clock, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { PreviewVideoPlayer } from './PreviewVideoPlayer'
import type { ScenePlaylist, PlaylistEntry, PreviewMeta, PreviewMontage } from '@/previews'
import type { OfferTier } from '@/marketing/offers.config'

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
  /** Price information (legacy single price) */
  price?: {
    amount: number
    currency: string
    period?: string
  }
  /** Pricing tiers (preferred over single price) */
  tiers?: OfferTier[]
  /** CTA button text */
  ctaLabel?: string
  /** CTA callback */
  onCta?: () => void
  /** Whether CTA is loading */
  isCtaLoading?: boolean
  /** Tier selection callback */
  onSelectTier?: (tier: OfferTier) => void
}

// ─── Format Price Helper ─────────────────────────────────────

function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
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

// ─── Tier Card (Horizontal) ──────────────────────────────────

interface TierCardProps {
  tier: OfferTier
  onSelect?: () => void
  isLoading?: boolean
  compact?: boolean
}

function TierCard({ tier, onSelect, isLoading, compact = false }: TierCardProps) {
  return (
    <Card
      className={cn(
        'relative flex flex-col h-full transition-all',
        tier.highlighted && 'ring-2 ring-primary shadow-lg',
        compact ? 'p-3' : ''
      )}
    >
      {/* Badge */}
      {tier.badge && (
        <Badge
          className="absolute -top-2.5 left-4 text-xs"
          variant={tier.highlighted ? 'default' : 'secondary'}
        >
          {tier.badge}
        </Badge>
      )}
      
      <CardHeader className={cn('pb-2', compact && 'p-3 pt-4')}>
        <CardTitle className={cn(compact ? 'text-base' : 'text-lg')}>
          {tier.name}
        </CardTitle>
        {tier.description && (
          <CardDescription className="text-xs line-clamp-2">
            {tier.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className={cn('flex-1 space-y-3', compact && 'p-3 pt-0')}>
        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className={cn('font-bold', compact ? 'text-2xl' : 'text-3xl')}>
            {formatPrice(tier.price, tier.currency)}
          </span>
          {tier.period && (
            <span className="text-xs text-muted-foreground">/{tier.period}</span>
          )}
        </div>
        
        {/* Delivery & Deposit */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {tier.deliveryDays && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{tier.deliveryDays}h</span>
            </div>
          )}
          {tier.depositRequired && (
            <div>
              {formatPrice(tier.depositRequired, tier.currency)} deposit
            </div>
          )}
        </div>
        
        {/* Features (limited for compact view) */}
        <ul className="space-y-1.5">
          {tier.features.slice(0, compact ? 4 : 6).map((feature, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs">
              <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-1">{feature}</span>
            </li>
          ))}
          {tier.features.length > (compact ? 4 : 6) && (
            <li className="text-xs text-muted-foreground pl-4">
              +{tier.features.length - (compact ? 4 : 6)} more
            </li>
          )}
        </ul>
      </CardContent>
      
      <CardFooter className={cn('pt-3', compact && 'p-3')}>
        <Button
          className="w-full"
          size={compact ? 'sm' : 'default'}
          variant={tier.highlighted ? 'default' : 'outline'}
          onClick={onSelect}
          disabled={isLoading}
        >
          {tier.ctaLabel ?? 'Select'}
          <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
        </Button>
      </CardFooter>
    </Card>
  )
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
  tiers,
  ctaLabel = 'Generate Your Preview',
  onCta,
  isCtaLoading = false,
  onSelectTier,
}: PreviewModalProps) {
  const [currentScene, setCurrentScene] = useState<PlaylistEntry | null>(null)
  
  // Use provided features or defaults
  const displayFeatures = features ?? DEFAULT_FEATURES[montage.offerId] ?? []
  
  const handleSceneChange = (scene: PlaylistEntry, _index: number) => {
    setCurrentScene(scene)
  }
  
  const hasTiers = tiers && tiers.length > 0
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto',
          hasTiers ? 'max-w-6xl w-[95vw]' : 'max-w-4xl w-[90vw]'
        )}
      >
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg sm:text-xl font-semibold truncate">
                {montage.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm line-clamp-2">
                {montage.description}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full shrink-0">
                <X className="w-4 h-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        {/* Main Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Left: Video Player + Features (when no tiers) */}
          <div className={cn('flex-1', hasTiers ? 'lg:max-w-[55%]' : '')}>
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
                <div className="aspect-video flex items-center justify-center text-white/60">
                  <div className="text-center p-8">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Preview not available</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Features (shown below video when tiers are present) */}
            {hasTiers && (
              <div className="p-4 sm:p-6 border-t lg:border-t-0 lg:border-r bg-muted/30">
                {/* Scene info */}
                {currentScene && (
                  <div className="mb-4 pb-3 border-b">
                    <Badge variant="outline" className="mb-1.5">
                      {currentScene.label}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Preview of {currentScene.label.toLowerCase()} template
                    </p>
                  </div>
                )}
                
                <h4 className="text-sm font-medium mb-3">What's Included</h4>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {displayFeatures.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                      <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {meta && (
                  <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">
                    {meta.scenes.length} templates • {Math.round(meta.totalDurationSeconds)}s preview
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Right: Pricing Tiers or Simple Sidebar */}
          <div className={cn(
            'border-t lg:border-t-0 lg:border-l',
            hasTiers ? 'lg:flex-1 p-4 sm:p-6' : 'w-full lg:w-80 p-4 sm:p-6'
          )}>
            {hasTiers ? (
              /* Pricing Tiers Grid */
              <div className="space-y-4">
                <h3 className="text-base font-semibold">Choose Your Plan</h3>
                <div className={cn(
                  'grid gap-4',
                  tiers.length === 1 ? 'grid-cols-1 max-w-sm' :
                  tiers.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                )}>
                  {tiers.map((tier) => (
                    <TierCard
                      key={tier.id}
                      tier={tier}
                      onSelect={() => {
                        onSelectTier?.(tier)
                        onCta?.()
                      }}
                      isLoading={isCtaLoading}
                      compact={tiers.length >= 3}
                    />
                  ))}
                </div>
                
                {/* Alternative: Free Preview CTA */}
                <div className="pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground mb-3 text-center">
                    Not ready to commit? Try a free preview first.
                  </p>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={onCta}
                    disabled={isCtaLoading}
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
                </div>
              </div>
            ) : (
              /* Simple Sidebar (no tiers) */
              <div className="flex flex-col h-full">
                {/* Scene info */}
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
                
                {/* Features */}
                <div className="flex-1 mb-4">
                  <h4 className="text-sm font-medium mb-3">Includes</h4>
                  <ul className="space-y-2">
                    {displayFeatures.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Price */}
                {price && (
                  <div className="mb-4 pb-4 border-t pt-4">
                    <div className="text-2xl font-bold">
                      {formatPrice(price.amount, price.currency)}
                      {price.period && (
                        <span className="text-sm font-normal text-muted-foreground ml-1">
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
                
                {/* Meta */}
                {meta && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    {meta.scenes.length} templates • {Math.round(meta.totalDurationSeconds)}s preview
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PreviewModal
