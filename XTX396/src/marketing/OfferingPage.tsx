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

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  MarketingHero,
  OfferGrid,
  HowItWorks,
  ProofStrip,
  PricingTable,
  FAQSection,
  FinalCTA,
  SiteTypeToggle,
} from './components'
import { MarketingPage } from './layouts'
import {
  MARKETING_OFFERS,
  getFeaturedOffer,
  getOffersBySiteType,
  type MarketingOffer,
  type OfferTier,
  type SiteGenerationType,
} from './offers.config'
import { getFAQsForOffer } from './faq.config'
import { track, MARKETING_EVENTS } from './event-tracker'
import { LeadCaptureModal } from '@/leads'
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
  
  // Lead capture modal state
  const [showLeadCapture, setShowLeadCapture] = useState(false)
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null)
  
  // Site type filter - persisted in localStorage
  const [siteType, setSiteType] = useState<SiteGenerationType>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('xtx-site-generation-type')
      if (stored === 'law-firm' || stored === 'small-business' || stored === 'agency') {
        return stored
      }
    }
    // Default to law-firm (most revenue-focused)
    return 'law-firm'
  })
  
  // Persist site type selection
  useEffect(() => {
    localStorage.setItem('xtx-site-generation-type', siteType)
  }, [siteType])
  
  // Filter offers by site type
  const filteredOffers = useMemo(() => getOffersBySiteType(siteType), [siteType])
  
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
  
  // Get featured offer for pricing section (prefer filtered, fallback to any)
  const featuredOffer = filteredOffers.find(o => o.featured) 
    ?? getFeaturedOffer() 
    ?? filteredOffers[0] 
    ?? MARKETING_OFFERS[0]
  
  // Get FAQs based on selected or featured offer
  const faqs = getFAQsForOffer(selectedOfferId ?? featuredOffer?.offerId ?? '')
  
  // Build thumbnail URLs from metas
  const previewThumbnails = Object.entries(previewMetas)
    .filter(([, meta]) => meta?.posterFilename)
    .map(([offerId, meta]) => `${basePath}/${offerId}/${meta!.posterFilename}`)
    .slice(0, 6)
  
  // Handlers
  
  // Step 1: User clicks "Generate Preview" - show lead capture modal
  const handleRequestPreview = useCallback((offerId: string) => {
    track(MARKETING_EVENTS.GENERATE_PREVIEW_STARTED, { offerId })
    setPendingOfferId(offerId)
    setShowLeadCapture(true)
  }, [])
  
  // Step 2: Lead captured - proceed with preview generation
  const handleLeadCaptured = useCallback(
    async (leadId: string) => {
      if (!pendingOfferId) return
      
      setIsGenerating(true)
      setSelectedOfferId(pendingOfferId)
      setShowLeadCapture(false)
      
      track(MARKETING_EVENTS.GENERATE_PREVIEW_COMPLETED, {
        offerId: pendingOfferId,
        leadId,
      })
      
      try {
        await onGeneratePreview?.(pendingOfferId)
      } catch (error) {
        console.error('Preview generation failed:', error)
      } finally {
        setIsGenerating(false)
        setPendingOfferId(null)
      }
    },
    [pendingOfferId, onGeneratePreview]
  )
  
  // Legacy handler (for backward compatibility if used elsewhere)
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
  
  // Preload config for hero poster
  const preloads = heroVideoPosterUrl
    ? [{ href: heroVideoPosterUrl, as: 'image' as const }]
    : []
  
  return (
    <MarketingPage
      pageId="offering_page"
      title="Website Services | Professional Launch in 72 Hours"
      preloads={preloads}
    >
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
      
      {/* S2: Site Type Toggle + Offer Grid */}
      <section id="offers" className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Site Type Toggle */}
          <div className="flex justify-center mb-8">
            <SiteTypeToggle
              value={siteType}
              onChange={setSiteType}
            />
          </div>
        </div>
        
        <OfferGrid
          offers={filteredOffers}
          previewMetas={previewMetas}
          basePath={basePath}
          onGeneratePreview={handleRequestPreview}
          isGenerating={isGenerating}
        />
      </section>
      
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
      
      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={showLeadCapture}
        onClose={() => {
          setShowLeadCapture(false)
          setPendingOfferId(null)
        }}
        onSuccess={handleLeadCaptured}
        source="preview_generator"
        title="Get Your Free Preview"
        description="Enter your details to generate a personalized website preview."
        submitLabel="Generate My Preview"
        vertical={pendingOfferId ?? undefined}
      />
    </MarketingPage>
  )
}

export default OfferingPage
