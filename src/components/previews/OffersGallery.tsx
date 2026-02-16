/**
 * Offers Gallery
 *
 * Gallery page displaying all marketing offers with preview cards.
 * Handles loading preview metadata and managing the preview modal.
 */

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OfferCard } from './OfferCard'
import { PreviewModal } from './PreviewModal'
import {
  PREVIEW_MONTAGES,
  createScenePlaylist,
  type PreviewMontage,
  type PreviewMeta,
  type ScenePlaylist,
} from '@/previews'

// ─── Types ───────────────────────────────────────────────────

export interface OfferConfig {
  offerId: string
  featured?: boolean
  badge?: string
  price?: {
    amount: number
    currency: string
    period?: string
  }
  quickFeatures?: string[]
}

export interface OffersGalleryProps {
  /** Custom offer configurations (overrides defaults) */
  offers?: OfferConfig[]
  /** Base path for preview assets */
  basePath?: string
  /** Callback when CTA is clicked */
  onGeneratePreview?: (offerId: string) => void
  /** Whether generation is in progress */
  isGenerating?: boolean
  /** Custom className */
  className?: string
}

// ─── Default Offer Configs ───────────────────────────────────

const DEFAULT_OFFER_CONFIGS: OfferConfig[] = [
  {
    offerId: 'law-firm-72-hour-launch',
    featured: false,
    badge: 'Popular',
    price: { amount: 2999, currency: 'USD' },
    quickFeatures: ['Professional design', 'Practice areas', 'Intake forms'],
  },
  {
    offerId: 'small-business-starter',
    featured: false,
    price: { amount: 1499, currency: 'USD' },
    quickFeatures: ['Modern design', 'Service pages', 'Contact forms'],
  },
  {
    offerId: 'digital-agency-pro',
    featured: false,
    badge: 'New',
    price: { amount: 3999, currency: 'USD' },
    quickFeatures: ['Portfolio', 'Case studies', 'Team directory'],
  },
  {
    offerId: 'premium-full-service',
    featured: true,
    badge: 'Best Value',
    price: { amount: 4999, currency: 'USD' },
    quickFeatures: ['All features', 'Priority support', 'Unlimited revisions'],
  },
]

// ─── Hooks ───────────────────────────────────────────────────

/**
 * Hook to load preview metadata for an offer.
 */
function usePreviewMeta(offerId: string | null, basePath: string) {
  const [meta, setMeta] = useState<PreviewMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!offerId) {
      setMeta(null)
      return
    }
    
    setLoading(true)
    setError(null)
    
    fetch(`${basePath}/${offerId}/meta.json`)
      .then(res => {
        if (!res.ok) throw new Error('Meta not found')
        return res.json()
      })
      .then(data => {
        setMeta(data as PreviewMeta)
        setLoading(false)
      })
      .catch(err => {
        console.warn(`Preview meta not found for ${offerId}:`, err)
        setMeta(null)
        setLoading(false)
        setError(err.message)
      })
  }, [offerId, basePath])
  
  return { meta, loading, error }
}

// ─── Component ───────────────────────────────────────────────

export function OffersGallery({
  offers = DEFAULT_OFFER_CONFIGS,
  basePath = '/previews',
  onGeneratePreview,
  isGenerating = false,
  className,
}: OffersGalleryProps) {
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [metas, setMetas] = useState<Record<string, PreviewMeta | null>>({})
  const [loadingMetas, setLoadingMetas] = useState(true)
  
  // Get montage definitions
  const montageMap = new Map(PREVIEW_MONTAGES.map(m => [m.offerId, m]))
  
  // Load all metas on mount
  useEffect(() => {
    const loadMetas = async () => {
      const results: Record<string, PreviewMeta | null> = {}
      
      await Promise.all(
        offers.map(async (offer) => {
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
      
      setMetas(results)
      setLoadingMetas(false)
    }
    
    loadMetas()
  }, [offers, basePath])
  
  // Get selected montage and config
  const selectedMontage = selectedOfferId ? montageMap.get(selectedOfferId) : null
  const selectedConfig = selectedOfferId ? offers.find(o => o.offerId === selectedOfferId) : null
  const selectedMeta = selectedOfferId ? metas[selectedOfferId] : null
  
  // Create playlist from meta
  const selectedPlaylist: ScenePlaylist | undefined = selectedMontage && selectedMeta
    ? createScenePlaylist(selectedMontage, selectedMeta.scenes)
    : undefined
  
  const handleOpenPreview = useCallback((offerId: string) => {
    setSelectedOfferId(offerId)
  }, [])
  
  const handleClosePreview = useCallback(() => {
    setSelectedOfferId(null)
  }, [])
  
  const handleCta = useCallback(() => {
    if (selectedOfferId && onGeneratePreview) {
      onGeneratePreview(selectedOfferId)
    }
  }, [selectedOfferId, onGeneratePreview])
  
  return (
    <div className={cn('space-y-8', className)}>
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-3">Choose Your Package</h2>
        <p className="text-muted-foreground">
          Select a package to see a live preview of what your site could look like.
          Each preview showcases different styles tailored to your industry.
        </p>
      </div>
      
      {/* Loading State */}
      {loadingMetas && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {/* Offers Grid */}
      {!loadingMetas && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {offers.map((config) => {
            const montage = montageMap.get(config.offerId)
            if (!montage) return null
            
            return (
              <OfferCard
                key={config.offerId}
                montage={montage}
                meta={metas[config.offerId] ?? undefined}
                basePath={basePath}
                featured={config.featured}
                badge={config.badge}
                price={config.price}
                quickFeatures={config.quickFeatures}
                onClick={() => handleOpenPreview(config.offerId)}
              />
            )
          })}
        </div>
      )}
      
      {/* Preview Modal */}
      {selectedMontage && (
        <PreviewModal
          open={!!selectedOfferId}
          onOpenChange={(open) => !open && handleClosePreview()}
          montage={selectedMontage}
          meta={selectedMeta ?? undefined}
          playlist={selectedPlaylist}
          basePath={`${basePath}/${selectedOfferId}`}
          price={selectedConfig?.price}
          onCta={handleCta}
          isCtaLoading={isGenerating}
        />
      )}
    </div>
  )
}

export default OffersGallery
