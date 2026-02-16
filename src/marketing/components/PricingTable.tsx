/**
 * Pricing Table Section
 *
 * Display pricing tiers with features, CTAs, and deposit info.
 */

import { Check, Clock, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { type OfferTier, type MarketingOffer, formatPrice } from '../offers.config'
import { track, MARKETING_EVENTS } from '../event-tracker'

// ─── Types ───────────────────────────────────────────────────

export interface PricingTableProps {
  /** Section title */
  title?: string
  /** Section subtitle */
  subtitle?: string
  /** Offer to display tiers for */
  offer?: MarketingOffer
  /** Or provide tiers directly */
  tiers?: OfferTier[]
  /** CTA callback with tier */
  onSelectTier?: (tier: OfferTier) => void
  /** Show maintenance subscription option */
  showMaintenanceOption?: boolean
  /** Loading state */
  isLoading?: boolean
  /** Custom className */
  className?: string
}

// ─── Tier Card ───────────────────────────────────────────────

interface TierCardProps {
  tier: OfferTier
  onSelect?: () => void
  isLoading?: boolean
}

function TierCard({ tier, onSelect, isLoading }: TierCardProps) {
  const handleSelect = () => {
    track(MARKETING_EVENTS.PRICING_TIER_SELECTED, {
      tierId: tier.id,
      tierName: tier.name,
      price: tier.price,
    })
    onSelect?.()
  }
  
  return (
    <Card
      className={cn(
        'relative flex flex-col h-full min-w-[280px]',
        tier.highlighted && 'ring-2 ring-primary shadow-lg scale-[1.02]'
      )}
    >
      {/* Badge */}
      {tier.badge && (
        <Badge
          className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap"
          variant={tier.highlighted ? 'default' : 'secondary'}
        >
          {tier.badge}
        </Badge>
      )}
      
      <CardHeader className="text-center pb-3 pt-6">
        <CardTitle className="text-xl sm:text-2xl">{tier.name}</CardTitle>
        <CardDescription className="text-sm">{tier.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 px-4 sm:px-6">
        {/* Price */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="text-3xl sm:text-4xl font-bold tracking-tight">
            {formatPrice(tier.price, tier.currency)}
          </div>
          {tier.period && (
            <div className="text-sm text-muted-foreground mt-1">/{tier.period}</div>
          )}
        </div>
        
        {/* Delivery & Deposit */}
        <div className="flex justify-center gap-4 mb-4 sm:mb-6 text-xs sm:text-sm flex-wrap">
          {tier.deliveryDays && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{tier.deliveryDays}h delivery</span>
            </div>
          )}
        </div>
        
        {/* Features */}
        <ul className="space-y-2 sm:space-y-3">
          {tier.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
              <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className="flex-col gap-3 pt-4 px-4 sm:px-6 pb-6">
        <Button
          className="w-full"
          size="lg"
          variant={tier.highlighted ? 'default' : 'outline'}
          onClick={handleSelect}
          disabled={isLoading}
        >
          {tier.ctaLabel ?? 'Get Started'}
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
        
        {tier.depositRequired && (
          <p className="text-xs text-muted-foreground text-center">
            {formatPrice(tier.depositRequired, tier.currency)} deposit to reserve your spot
          </p>
        )}
      </CardFooter>
    </Card>
  )
}

// ─── Maintenance Option ──────────────────────────────────────

function MaintenanceOption() {
  return (
    <Card className="bg-muted/50 mt-8">
      <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
        <div>
          <h4 className="font-semibold mb-1">Ongoing Maintenance</h4>
          <p className="text-sm text-muted-foreground">
            Keep your site updated, secure, and optimized with monthly support.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-semibold">$99/mo</div>
            <div className="text-xs text-muted-foreground">Cancel anytime</div>
          </div>
          <Button variant="outline" size="sm">
            Add to Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ──────────────────────────────────────────

export function PricingTable({
  title = 'Pricing',
  subtitle = 'Transparent pricing with no hidden fees',
  offer,
  tiers: tiersProp,
  onSelectTier,
  showMaintenanceOption = true,
  isLoading = false,
  className,
}: PricingTableProps) {
  const tiers = tiersProp ?? offer?.tiers ?? []
  
  if (tiers.length === 0) {
    return null
  }
  
  // Determine grid columns based on tier count - optimized for wider cards
  const gridCols = tiers.length === 1
    ? 'grid-cols-1 max-w-md mx-auto'
    : tiers.length === 2
      ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  
  return (
    <section className={cn('py-12 sm:py-16 lg:py-24', className)} id="pricing">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">{title}</h2>
          <p className="text-base sm:text-lg text-muted-foreground">{subtitle}</p>
        </div>
        
        {/* Tiers Grid */}
        <div className={cn('grid gap-6 sm:gap-8', gridCols)}>
          {tiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              onSelect={() => onSelectTier?.(tier)}
              isLoading={isLoading}
            />
          ))}
        </div>
        
        {/* Maintenance Option */}
        {showMaintenanceOption && <MaintenanceOption />}
      </div>
    </section>
  )
}

export default PricingTable
