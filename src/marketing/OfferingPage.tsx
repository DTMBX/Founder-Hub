/**
 * Offering Page
 *
 * Revenue-optimized landing page with sections S1-S7:
 *  S1) Hero (above fold)
 *  S2) Offer Grid
 *  S3) How It Works
 *  S4) Proof (stats, testimonials, thumbnails)
 *  S5) Pricing
 *  S6) FAQ
 *  S7) Final CTA
 */

import { useState, useEffect, useCallback } from 'react'
import {
  MarketingHero,
  OfferGrid,
  HowItWorks,
  ProofStrip,
  PricingTable,
  FAQSection,
  FinalCTA,
} from './components'
import {
  MARKETING_OFFERS,
  getFeaturedOffer,
  type MarketingOffer,
  type OfferTier,
} from './offers.config'
import { getFAQsForOffer } from './faq.config'
import { trackPageView, track, MARKETING_EVENTS } from './event-tracker'
import type { PreviewMeta } from '@/previews'

// ─── Types ───────────────────────────────────────────────────

export interface OfferingPageProps {
  /** Base path for preview assets */
  basePath?: string
  /** Callback when user wants to generate a preview */
  onGeneratePreview?: (offerId: string) => void
  /** Callback when user wants to book a call */
  onBookCall?: () => void
  /** Callback when user selects a pricing tier */
  onSelectTier?: (tier: OfferTier, offer: MarketingOffer) => void
  /** Pre-loaded preview metadata (optional, will fetch if not provided) */
  previewMetas?: Record<string, PreviewMeta | null>
  /** Video URL for hero section */
  heroVideoUrl?: string
  /** Video poster URL for hero section */
  heroVideoPosterUrl?: string
  /** Custom hero headline */
  heroHeadline?: string
  /** Custom hero subheadline */
  heroSubheadline?: string
}

// ─── Component ───────────────────────────────────────────────

export function OfferingPage({
  basePath = '/previews',
  onGeneratePreview,
  onBookCall,
  onSelectTier,
  previewMetas: propMetas,
  heroVideoUrl,
  heroVideoPosterUrl,
  heroHeadline = 'Professional Website Launch in 72 Hours',
  heroSubheadline = 'Law firms, service businesses, and agencies trust us to deliver professional websites fast.',
}: OfferingPageProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [previewMetas, setPreviewMetas] = useState<Record<string, PreviewMeta | null>>(
    propMetas ?? {}
  )
  
  // Track page view on mount
  useEffect(() => {
    trackPageView('offering_page')
  }, [])
  
  // Load preview metas if not provided
  useEffect(() => {
    if (propMetas) return
    
    const loadMetas = async () => {
      const results: Record<string, PreviewMeta | null> = {}
      
      await Promise.all(
        MARKETING_OFFERS.map(async (offer) => {
          try {
            const res = await fetch(`${basePath}/${offer.offerId}/meta.json`)
            if (res.ok) {
              results[offer.offerId] = await res.json()
            } else {
              results[offer.offerId] = null
            }
          } catch {
            results[offer.offerId] = null
          }
        })
      )
      
      setPreviewMetas(results)
    }
    
    loadMetas()
  }, [basePath, propMetas])
  
  // Get featured offer for pricing section
  const featuredOffer = getFeaturedOffer() ?? MARKETING_OFFERS[0]
  
  // Get FAQs based on selected or featured offer
  const faqs = getFAQsForOffer(selectedOfferId ?? featuredOffer?.offerId ?? '')
  
  // Build thumbnail URLs from metas
  const previewThumbnails = Object.entries(previewMetas)
    .filter(([, meta]) => meta?.posterFilename)
    .map(([offerId, meta]) => `${basePath}/${offerId}/${meta!.posterFilename}`)
    .slice(0, 6)
  
  // Handlers
  const handleGeneratePreview = useCallback(
    async (offerId: string) => {
      setIsGenerating(true)
      setSelectedOfferId(offerId)
      
      track(MARKETING_EVENTS.GENERATE_PREVIEW_STARTED, { offerId })
      
      try {
        await onGeneratePreview?.(offerId)
        track(MARKETING_EVENTS.GENERATE_PREVIEW_COMPLETED, { offerId })
      } catch (error) {
        console.error('Preview generation failed:', error)
      } finally {
        setIsGenerating(false)
      }
    },
    [onGeneratePreview]
  )
  
  const handleBookCall = useCallback(() => {
    onBookCall?.()
  }, [onBookCall])
  
  const handleSelectTier = useCallback(
    (tier: OfferTier) => {
      if (featuredOffer) {
        onSelectTier?.(tier, featuredOffer)
      }
    },
    [featuredOffer, onSelectTier]
  )
  
  return (
    <div className="min-h-screen">
      {/* S1: Hero */}
      <MarketingHero
        headline={heroHeadline}
        subheadline={heroSubheadline}
        onPrimaryCta={() => {
          // Scroll to offer grid
          document.getElementById('offers')?.scrollIntoView({ behavior: 'smooth' })
        }}
        onSecondaryCta={handleBookCall}
        videoUrl={heroVideoUrl}
        videoPosterUrl={heroVideoPosterUrl}
        isPrimaryLoading={isGenerating}
      />
      
      {/* S2: Offer Grid */}
      <OfferGrid
        offers={MARKETING_OFFERS}
        previewMetas={previewMetas}
        basePath={basePath}
        onGeneratePreview={handleGeneratePreview}
        isGenerating={isGenerating}
      />
      
      {/* S3: How It Works */}
      <HowItWorks />
      
      {/* S4: Proof */}
      <ProofStrip previewThumbnails={previewThumbnails} />
      
      {/* S5: Pricing */}
      {featuredOffer && (
        <PricingTable
          title="Simple, Transparent Pricing"
          subtitle="No hidden fees. Deposit required to reserve your spot."
          offer={featuredOffer}
          onSelectTier={handleSelectTier}
          showMaintenanceOption
        />
      )}
      
      {/* S6: FAQ */}
      <FAQSection faqs={faqs} />
      
      {/* S7: Final CTA */}
      <FinalCTA
        onPrimaryCta={() => {
          // Scroll to offer grid
          document.getElementById('offers')?.scrollIntoView({ behavior: 'smooth' })
        }}
        onSecondaryCta={handleBookCall}
        isPrimaryLoading={isGenerating}
      />
    </div>
  )
}

export default OfferingPage
