/**
 * Offering Card Component
 * 
 * Reusable card for displaying offerings with glassmorphism design.
 * Supports multiple pricing tiers, Stripe checkout, and various offering types.
 */

import React, { useState } from 'react'
import { Offering, OfferingPriceTier, OfferingCategory } from '@/lib/types'
import { GlassCard } from '@/components/ui/glass-card'
import { GlassButton } from '@/components/ui/glass-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { redirectToCheckout, hasPriceTierPayment } from '@/lib/stripe'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  Globe,
  FileText,
  Code,
  Headset,
  ShoppingCart,
  Heart,
  ArrowRight,
  Star,
  Clock,
  Package,
  CurrencyDollar,
  Envelope,
  CircleNotch,
  Handshake,
  Check,
  ListChecks,
  X,
} from '@phosphor-icons/react'

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_CONFIG: Record<OfferingCategory, { label: string; color: string; icon: React.ReactNode }> = {
  digital: {
    label: 'Digital Product',
    color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    icon: <Code className="h-5 w-5" weight="duotone" />,
  },
  service: {
    label: 'Professional Service',
    color: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    icon: <FileText className="h-5 w-5" weight="duotone" />,
  },
  whitelabel: {
    label: 'White-Label',
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: <Globe className="h-5 w-5" weight="duotone" />,
  },
  subscription: {
    label: 'Subscription',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: <Headset className="h-5 w-5" weight="duotone" />,
  },
  barter: {
    label: 'Barter / Trade',
    color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    icon: <Handshake className="h-5 w-5" weight="duotone" />,
  },
}

// ============================================================================
// UTILITIES
// ============================================================================

function formatPrice(cents: number, currency: string = 'USD'): string {
  if (cents === 0) return 'Free'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function getPriceDisplay(offering: Offering): { primary: string; secondary?: string } {
  if (offering.pricingType === 'free' || (offering.priceTiers.length === 1 && offering.priceTiers[0].price === 0)) {
    return { primary: 'Free', secondary: offering.gratuityEnabled ? '+ optional tip' : undefined }
  }

  if (offering.pricingType === 'donation') {
    return { primary: 'Free / Donate', secondary: 'Pay what you want' }
  }

  if (offering.pricingType === 'contact') {
    return { primary: 'Contact for Quote' }
  }

  if (offering.pricingType === 'trade') {
    return { primary: 'Trade / Barter' }
  }

  const prices = offering.priceTiers.map(t => t.price).filter(p => p > 0)
  if (prices.length === 0) return { primary: 'Free' }

  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  if (minPrice === maxPrice) {
    const tier = offering.priceTiers.find(t => t.price === minPrice)
    return {
      primary: formatPrice(minPrice, tier?.currency),
      secondary: tier?.isRecurring ? `/${tier.recurringInterval}` : undefined,
    }
  }

  return {
    primary: `From ${formatPrice(minPrice)}`,
    secondary: offering.priceTiers.some(t => t.isRecurring) ? '/month' : undefined,
  }
}

function getPurchaseTier(offering: Offering): OfferingPriceTier | null {
  if (offering.pricingType === 'contact' || offering.pricingType === 'donation' || offering.pricingType === 'trade') {
    return null
  }
  return offering.priceTiers.find(t => hasPriceTierPayment(t) && t.price > 0) || null
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface OfferingCardProps {
  offering: Offering
  variant?: 'default' | 'compact' | 'featured'
  className?: string
  style?: React.CSSProperties
  onViewDetails?: (offering: Offering) => void
  contactEmail?: string
}

// ============================================================================
// OFFERING CARD COMPONENT
// ============================================================================

export function OfferingCard({
  offering,
  variant = 'default',
  className,
  style,
  onViewDetails,
  contactEmail = 'contact@xtx396.online',
}: OfferingCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showTiersDialog, setShowTiersDialog] = useState(false)

  const priceDisplay = getPriceDisplay(offering)
  const catConfig = CATEGORY_CONFIG[offering.category] || CATEGORY_CONFIG.digital
  const isCompact = variant === 'compact'
  const isFeatured = variant === 'featured' || offering.featured

  const handleCheckout = async (tier: OfferingPriceTier) => {
    setIsLoading(true)
    try {
      const result = await redirectToCheckout(tier, offering.title)
      if (!result.success) {
        toast.error(result.error || 'Checkout failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrimaryAction = () => {
    // Contact for quote
    if (offering.pricingType === 'contact' || offering.pricingType === 'trade') {
      window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(offering.title)}`
      return
    }

    // Downloadable product
    if (offering.downloadUrl) {
      window.open(offering.downloadUrl, '_blank')
      return
    }

    // External URL
    if (offering.externalUrl) {
      window.open(offering.externalUrl, '_blank')
      return
    }

    // Multiple tiers - show dialog
    if (offering.priceTiers.length > 1) {
      setShowTiersDialog(true)
      return
    }

    // Single purchasable tier
    const purchaseTier = getPurchaseTier(offering)
    if (purchaseTier) {
      handleCheckout(purchaseTier)
    }
  }

  const getPrimaryButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <CircleNotch className="h-4 w-4 animate-spin" />
          Processing...
        </>
      )
    }

    if (offering.pricingType === 'contact') {
      return (
        <>
          <Envelope className="h-4 w-4" />
          {offering.contactCTA || 'Get Quote'}
        </>
      )
    }

    if (offering.pricingType === 'trade') {
      return (
        <>
          <Handshake className="h-4 w-4" />
          Propose Trade
        </>
      )
    }

    if (offering.downloadUrl) {
      return (
        <>
          <Package className="h-4 w-4" />
          Download
        </>
      )
    }

    if (offering.priceTiers.length > 1) {
      return (
        <>
          <ListChecks className="h-4 w-4" />
          Select Plan
        </>
      )
    }

    return (
      <>
        <ShoppingCart className="h-4 w-4" />
        {offering.priceTiers[0]?.price === 0 ? 'Get Started' : 'Buy Now'}
      </>
    )
  }

  return (
    <>
      <GlassCard
        intensity={isFeatured ? 'high' : 'medium'}
        style={style}
        className={cn(
          'group relative overflow-hidden transition-all duration-500 h-full',
          'hover:shadow-2xl hover:shadow-accent/15',
          'hover:-translate-y-1 hover:scale-[1.01]',
          'border border-border/30 hover:border-accent/40',
          isFeatured && 'ring-2 ring-accent/20',
          className
        )}
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5" />
        </div>

        {/* Cover Image (if available) */}
        {offering.coverImage && (
          <div className={cn(
            'relative overflow-hidden bg-muted/30',
            isCompact ? 'h-32' : 'h-40'
          )}>
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted to-muted/50" />
            )}
            <img
              src={offering.coverImage}
              alt={offering.title}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={cn(
                'w-full h-full object-cover transition-all duration-700',
                'group-hover:scale-110',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />
            {/* Featured badge overlay */}
            {isFeatured && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-amber-500/90 text-amber-950 backdrop-blur-sm border-0">
                  <Star className="h-3 w-3 mr-1" weight="fill" />
                  Featured
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className={cn('p-5 flex flex-col h-full', isCompact && 'p-4')}>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
                {catConfig.icon}
              </div>
              <Badge className={cn('text-xs border', catConfig.color)}>
                {catConfig.label}
              </Badge>
            </div>
            {!offering.coverImage && isFeatured && (
              <Star className="h-5 w-5 text-amber-400 shrink-0" weight="fill" />
            )}
          </div>

          {/* Title */}
          <h3 className={cn(
            'font-semibold mb-2 group-hover:text-accent transition-colors line-clamp-2',
            isCompact ? 'text-base' : 'text-lg'
          )}>
            {offering.title}
          </h3>

          {/* Summary */}
          <p className={cn(
            'text-muted-foreground leading-relaxed mb-4 flex-grow',
            isCompact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'
          )}>
            {offering.summary}
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className={cn(
              'font-bold text-accent',
              isCompact ? 'text-lg' : 'text-2xl'
            )}>
              {priceDisplay.primary}
            </span>
            {priceDisplay.secondary && (
              <span className="text-sm text-muted-foreground">
                {priceDisplay.secondary}
              </span>
            )}
            {offering.gratuityEnabled && priceDisplay.primary !== 'Free / Donate' && (
              <Heart className="h-4 w-4 text-rose-400 ml-1" weight="fill" />
            )}
          </div>

          {/* Meta Info */}
          {!isCompact && (
            <div className="flex flex-wrap gap-3 mb-3 text-xs text-muted-foreground">
              {offering.turnaround && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {offering.turnaround}
                </span>
              )}
              {offering.priceTiers.length > 1 && (
                <span className="flex items-center gap-1">
                  <CurrencyDollar className="h-3.5 w-3.5" />
                  {offering.priceTiers.length} tiers
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          {!isCompact && offering.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {offering.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0.5">
                  {tag}
                </Badge>
              ))}
              {offering.tags.length > 3 && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                  +{offering.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-auto pt-4 border-t border-border/30 flex flex-col gap-2">
            <GlassButton
              variant="glassAccent"
              className="w-full justify-center gap-2"
              onClick={handlePrimaryAction}
              disabled={isLoading}
            >
              {getPrimaryButtonContent()}
            </GlassButton>

            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => onViewDetails(offering)}
              >
                View Details
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Pricing Tiers Dialog */}
      <Dialog open={showTiersDialog} onOpenChange={setShowTiersDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{offering.title}</DialogTitle>
            <DialogDescription>
              {offering.summary}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="grid gap-4 py-4">
              {offering.priceTiers.map(tier => (
                <GlassCard key={tier.id} intensity="low" className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <h4 className="font-semibold text-lg">{tier.name}</h4>
                      {tier.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {tier.description}
                        </p>
                      )}
                      {tier.features && tier.features.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {tier.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" weight="bold" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-2xl font-bold text-accent">
                        {formatPrice(tier.price, tier.currency)}
                      </div>
                      {tier.isRecurring && (
                        <div className="text-sm text-muted-foreground">
                          /{tier.recurringInterval}
                        </div>
                      )}
                      <GlassButton
                        variant="glassAccent"
                        size="sm"
                        className="mt-3 gap-2"
                        onClick={() => {
                          setShowTiersDialog(false)
                          handleCheckout(tier)
                        }}
                        disabled={isLoading || !hasPriceTierPayment(tier)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {tier.price === 0 ? 'Get Started' : 'Select'}
                      </GlassButton>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ============================================================================
// OFFERING GRID COMPONENT
// ============================================================================

interface OfferingGridProps {
  offerings: Offering[]
  columns?: 2 | 3 | 4
  className?: string
  onViewDetails?: (offering: Offering) => void
  contactEmail?: string
}

export function OfferingGrid({
  offerings,
  columns = 3,
  className,
  onViewDetails,
  contactEmail,
}: OfferingGridProps) {
  return (
    <div
      className={cn(
        'grid gap-6',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {offerings.map((offering, index) => (
        <motion.div
          key={offering.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <OfferingCard
            offering={offering}
            variant={index === 0 && offerings.length > 3 && offering.featured ? 'featured' : 'default'}
            onViewDetails={onViewDetails}
            contactEmail={contactEmail}
          />
        </motion.div>
      ))}
    </div>
  )
}

export { CATEGORY_CONFIG }
export default OfferingCard
