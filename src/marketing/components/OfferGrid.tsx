/**
 * Offer Grid Section
 *
 * Grid of offer cards with "Best Value" highlighting and modal integration.
 * Includes prefetch on hover for modal assets.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { OfferCard } from '@/components/previews/OfferCard'
import { PreviewModal } from '@/components/previews/PreviewModal'
import { cn } from '@/lib/utils'
import {
  PREVIEW_MONTAGES,
  createScenePlaylist,
  type PreviewMontage,
  type PreviewMeta,
  type ScenePlaylist,
} from '@/previews'
import { MARKETING_OFFERS, type MarketingOffer } from '../offers.config'
import { track, MARKETING_EVENTS } from '../event-tracker'

// ─── Types ───────────────────────────────────────────────────

export interface OfferGridProps {
  /** Offers to display (uses MARKETING_OFFERS if not provided) */
  offers?: MarketingOffer[]
  /** Pre-loaded preview metadata */
  previewMetas?: Record<string, PreviewMeta | null>
  /** Base path for preview assets */
  basePath?: string
  /** Callback when generate preview is clicked */
  onGeneratePreview?: (offerId: string) => void
  /** Loading state for generate CTA */
  isGenerating?: boolean
  /** Section title */
  title?: string
  /** Section subtitle */
  subtitle?: string
  /** Custom className */
  className?: string
}

// ─── Prefetch Helper ─────────────────────────────────────────

const prefetchedOffers = new Set<string>()

function prefetchOfferAssets(offerId: string, basePath: string, meta: PreviewMeta | null) {
  if (prefetchedOffers.has(offerId)) return
  prefetchedOffers.add(offerId)
  
  // Prefetch poster
  if (meta?.posterFilename) {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = `${basePath}/${offerId}/${meta.posterFilename}`
    document.head.appendChild(link)
  }
  
  // Prefetch first few scene thumbnails
  meta?.scenes.slice(0, 3).forEach((scene) => {
    if (scene.thumbnailFilename) {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = `${basePath}/${offerId}/${scene.thumbnailFilename}`
      document.head.appendChild(link)
    }
  })
}

// ─── Component ───────────────────────────────────────────────

export interface OfferGridProps {
  /** Offers to display (uses MARKETING_OFFERS if not provided) */
  offers?: MarketingOffer[]
  /** Pre-loaded preview metadata */
  previewMetas?: Record<string, PreviewMeta | null>
  /** Base path for preview assets */
  basePath?: string
  /** Callback when generate preview is clicked */
  onGeneratePreview?: (offerId: string) => void
  /** Loading state for generate CTA */
  isGenerating?: boolean
  /** Section title */
  title?: string
  /** Section subtitle */
  subtitle?: string
  /** Custom className */
  className?: string
}

// ─── Component ───────────────────────────────────────────────

export function OfferGrid({
  offers = MARKETING_OFFERS,
  previewMetas = {},
  basePath = '/previews',
  onGeneratePreview,
  isGenerating = false,
  title = 'Choose Your Package',
  subtitle = 'Select a package to see a live preview tailored to your industry',
  className,
}: OfferGridProps) {
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  
  // Map montages by offerId
  const montageMap = new Map<string, PreviewMontage>(
    PREVIEW_MONTAGES.map((m) => [m.offerId, m])
  )
  
  // Get selected data
  const selectedOffer = selectedOfferId
    ? offers.find((o) => o.offerId === selectedOfferId)
    : null
  const selectedMontage = selectedOfferId ? montageMap.get(selectedOfferId) : null
  const selectedMeta = selectedOfferId ? previewMetas[selectedOfferId] : null
  
  // Create playlist from meta
  const selectedPlaylist: ScenePlaylist | undefined =
    selectedMontage && selectedMeta
      ? createScenePlaylist(selectedMontage, selectedMeta.scenes)
      : undefined
  
  const handleOpenPreview = useCallback((offerId: string) => {
    track(MARKETING_EVENTS.OFFER_VIEW_DETAILS, { offerId })
    setSelectedOfferId(offerId)
  }, [])
  
  const handleClosePreview = useCallback(() => {
    track(MARKETING_EVENTS.OFFER_MODAL_CLOSE, { offerId: selectedOfferId })
    setSelectedOfferId(null)
  }, [selectedOfferId])
  
  const handleCta = useCallback(() => {
    if (selectedOfferId && onGeneratePreview) {
      track(MARKETING_EVENTS.GENERATE_PREVIEW_CLICKED, {
        offerId: selectedOfferId,
        location: 'modal',
      })
      onGeneratePreview(selectedOfferId)
    }
  }, [selectedOfferId, onGeneratePreview])
  
  // Get popular tier for price display
  const getOfferPrice = (offer: MarketingOffer) => {
    const popularTier = offer.tiers.find((t) => t.highlighted) ?? offer.tiers[0]
    if (!popularTier) return undefined
    return {
      amount: popularTier.price,
      currency: popularTier.currency,
      period: popularTier.period,
    }
  }
  
  return (
    <section className={cn('py-16 lg:py-24', className)} id="offers">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          <p className="text-lg text-muted-foreground">{subtitle}</p>
        </div>
        
        {/* Offer Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {offers.map((offer) => {
            const montage = montageMap.get(offer.offerId)
            if (!montage) return null
            
            return (
              <div
                key={offer.offerId}
                onMouseEnter={() => {
                  prefetchOfferAssets(
                    offer.offerId,
                    basePath,
                    previewMetas[offer.offerId] ?? null
                  )
                }}
              >
                <OfferCard
                  montage={montage}
                  meta={previewMetas[offer.offerId] ?? undefined}
                  basePath={basePath}
                  featured={offer.featured}
                  badge={offer.badge}
                  price={getOfferPrice(offer)}
                  quickFeatures={offer.quickFeatures}
                  onClick={() => handleOpenPreview(offer.offerId)}
                />
              </div>
            )
          })}
        </div>
        
        {/* Preview Modal */}
        {selectedMontage && (
          <PreviewModal
            open={!!selectedOfferId}
            onOpenChange={(open) => !open && handleClosePreview()}
            montage={selectedMontage}
            meta={selectedMeta ?? undefined}
            playlist={selectedPlaylist}
            basePath={`${basePath}/${selectedOfferId}`}
            price={selectedOffer ? getOfferPrice(selectedOffer) : undefined}
            tiers={selectedOffer?.tiers}
            features={selectedOffer?.quickFeatures}
            onCta={handleCta}
            isCtaLoading={isGenerating}
          />
        )}
      </div>
    </section>
  )
}

export default OfferGrid
