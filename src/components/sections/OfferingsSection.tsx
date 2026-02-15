import { useState } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import { Offering, OfferingCategory, OfferingPriceTier } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { GlassButton } from '@/components/ui/glass-button'
import { GlassCard } from '@/components/ui/glass-card'
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
  Funnel,
  X,
  CircleNotch,
  Handshake,
  Swap
} from '@phosphor-icons/react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { cn } from '@/lib/utils'
import { redirectToCheckout, hasPriceTierPayment } from '@/lib/stripe'
import { toast } from 'sonner'

interface OfferingsSectionProps {
  investorMode?: boolean
  tradeMode?: boolean
}

const categoryLabels: Record<string, { label: string; color: string }> = {
  digital: { label: 'Digital Product', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  service: { label: 'Professional Service', color: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  whitelabel: { label: 'White-Label', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  subscription: { label: 'Subscription', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  barter: { label: 'Barter / Trade', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
}

const categoryIcons: Record<string, React.ReactNode> = {
  digital: <Code className="h-5 w-5" weight="duotone" />,
  service: <FileText className="h-5 w-5" weight="duotone" />,
  whitelabel: <Globe className="h-5 w-5" weight="duotone" />,
  subscription: <Headset className="h-5 w-5" weight="duotone" />,
  barter: <Handshake className="h-5 w-5" weight="duotone" />,
}

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
  
  const prices = offering.priceTiers.map(t => t.price).filter(p => p > 0)
  if (prices.length === 0) return { primary: 'Free' }
  
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  
  if (minPrice === maxPrice) {
    const tier = offering.priceTiers.find(t => t.price === minPrice)
    return { 
      primary: formatPrice(minPrice, tier?.currency),
      secondary: tier?.isRecurring ? `/${tier.recurringInterval}` : undefined
    }
  }
  
  return { 
    primary: `From ${formatPrice(minPrice)}`,
    secondary: offering.priceTiers.some(t => t.isRecurring) ? '/month' : undefined
  }
}

export default function OfferingsSection({ investorMode, tradeMode }: OfferingsSectionProps) {
  const [offerings] = useKV<Offering[]>('founder-hub-offerings', [])
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1, freezeOnceVisible: true })
  const prefersReducedMotion = useReducedMotion()
  const [selectedCategory, setSelectedCategory] = useState<OfferingCategory | 'all'>('all')
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  // Handle Stripe checkout
  const handleCheckout = async (offering: Offering, tier: OfferingPriceTier) => {
    setCheckoutLoading(`${offering.id}-${tier.id}`)
    
    const result = await redirectToCheckout(tier, offering.title)
    
    if (!result.success) {
      toast.error(result.error || 'Checkout failed')
      setCheckoutLoading(null)
    }
    // If success, the page will redirect
  }

  // Get first purchasable tier for an offering
  const getPurchaseTier = (offering: Offering): OfferingPriceTier | null => {
    if (offering.pricingType === 'contact' || offering.pricingType === 'donation') {
      return null
    }
    return offering.priceTiers.find(t => hasPriceTierPayment(t) && t.price > 0) || null
  }

  // Get all public offerings sorted
  const allPublicOfferings = (offerings || [])
    .filter(o => o.visibility === 'public')
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      return a.order - b.order
    })

  // Get unique categories from available offerings
  const availableCategories = Array.from(
    new Set(allPublicOfferings.map(o => o.category))
  ) as OfferingCategory[]

  // Filter by selected category
  const enabledOfferings = selectedCategory === 'all' 
    ? allPublicOfferings 
    : allPublicOfferings.filter(o => o.category === selectedCategory)

  const containerVariants = prefersReducedMotion
    ? undefined
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { staggerChildren: 0.1 }
      }

  const itemVariants = prefersReducedMotion
    ? undefined
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
      }

  return (
    <section id="offerings" className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/10 to-background -z-10" />
      <div className="section-separator absolute top-0 left-0 right-0" />
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            {tradeMode ? 'Trade & Barter' : 'Offerings & Services'}
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl leading-relaxed">
            {tradeMode 
              ? 'Open to trades, barter arrangements, and creative exchanges. Cash-free solutions for mutual benefit.'
              : 'Professional services, digital products, and solutions available for individuals, businesses, and agencies.'
            }
            {investorMode && ' All services can be white-labeled for your brand.'}
          </p>

          {/* Category Filter */}
          {availableCategories.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 mb-10 lg:mb-14">
              <Funnel className="h-4 w-4 text-muted-foreground mr-1" />
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                  'border backdrop-blur-md',
                  selectedCategory === 'all'
                    ? 'bg-accent/20 border-accent/50 text-accent shadow-lg shadow-accent/10'
                    : 'bg-background/10 border-border/40 text-muted-foreground hover:bg-background/20 hover:border-border/60'
                )}
              >
                All
              </button>
              {availableCategories.map(cat => {
                const catStyle = categoryLabels[cat]
                const isActive = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                      'border backdrop-blur-md flex items-center gap-2',
                      isActive
                        ? `${catStyle.color} shadow-lg`
                        : 'bg-background/10 border-border/40 text-muted-foreground hover:bg-background/20 hover:border-border/60'
                    )}
                  >
                    {categoryIcons[cat]}
                    {catStyle.label}
                  </button>
                )
              })}
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="ml-2 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/20 transition-colors"
                  aria-label="Clear filter"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </motion.div>

        {enabledOfferings.length === 0 ? (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <GlassCard intensity="medium" className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {selectedCategory !== 'all' 
                  ? `No ${categoryLabels[selectedCategory]?.label.toLowerCase() || 'offerings'} available yet.`
                  : 'No offerings available yet. Check back soon!'}
              </p>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            layout
            variants={containerVariants}
            initial="initial"
            animate={isVisible ? "animate" : "initial"}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            <AnimatePresence mode="popLayout">
            {enabledOfferings.map((offering) => {
              const priceDisplay = getPriceDisplay(offering)
              const catStyle = categoryLabels[offering.category] || categoryLabels.digital
              const catIcon = categoryIcons[offering.category] || <Package className="h-5 w-5" />
              
              return (
                <motion.div 
                  key={offering.id} 
                  variants={itemVariants}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard 
                    intensity="medium" 
                    className="group hover:shadow-2xl hover:shadow-accent/10 hover:-translate-y-1 hover:border-accent/30 transition-all duration-300 h-full"
                  >
                    <div className="p-6 flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-accent/10 text-accent">
                            {catIcon}
                          </div>
                          <div>
                            <Badge className={`text-xs ${catStyle.color} border`}>
                              {catStyle.label}
                            </Badge>
                          </div>
                        </div>
                        {offering.featured && (
                          <Star className="h-5 w-5 text-amber-400" weight="fill" />
                        )}
                      </div>

                      {/* Title & Summary */}
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
                        {offering.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-grow">
                        {offering.summary}
                      </p>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-bold text-accent">
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
                      <div className="flex flex-wrap gap-2 mb-4 text-xs text-muted-foreground">
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

                      {/* Tags */}
                      {(offering.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {(offering.tags || []).slice(0, 3).map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="secondary" 
                              className="text-[10px] px-2 py-0.5"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* CTA */}
                      <div className="mt-auto pt-4 border-t border-border/30">
                        {(() => {
                          const purchaseTier = getPurchaseTier(offering)
                          const isLoading = purchaseTier && checkoutLoading === `${offering.id}-${purchaseTier.id}`
                          
                          // Contact for quote
                          if (offering.pricingType === 'contact') {
                            return (
                              <GlassButton 
                                variant="glassAccent" 
                                className="w-full justify-center gap-2"
                                onClick={() => window.location.href = `mailto:contact@xtx396.com?subject=${encodeURIComponent(offering.title)}`}
                              >
                                <Envelope className="h-4 w-4" />
                                {offering.contactCTA || 'Get in Touch'}
                              </GlassButton>
                            )
                          }
                          
                          // Downloadable product
                          if (offering.downloadUrl) {
                            return (
                              <GlassButton 
                                variant="glassAccent" 
                                className="w-full justify-center gap-2"
                                onClick={() => window.open(offering.downloadUrl, '_blank')}
                              >
                                <Package className="h-4 w-4" />
                                Download
                              </GlassButton>
                            )
                          }
                          
                          // Purchasable with Stripe
                          if (purchaseTier) {
                            return (
                              <GlassButton 
                                variant="glassAccent" 
                                className="w-full justify-center gap-2"
                                onClick={() => handleCheckout(offering, purchaseTier)}
                                disabled={!!checkoutLoading}
                              >
                                {isLoading ? (
                                  <>
                                    <CircleNotch className="h-4 w-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="h-4 w-4" />
                                    {offering.priceTiers.length > 1 ? 'Select Plan' : 'Buy Now'}
                                  </>
                                )}
                              </GlassButton>
                            )
                          }
                          
                          // External link
                          if (offering.externalUrl) {
                            return (
                              <GlassButton 
                                variant="glassAccent" 
                                className="w-full justify-center gap-2"
                                onClick={() => window.open(offering.externalUrl, '_blank')}
                              >
                                <ShoppingCart className="h-4 w-4" />
                                Get Started
                              </GlassButton>
                            )
                          }
                          
                          // Default - Learn More
                          return (
                            <GlassButton 
                              variant="glassAccent" 
                              className="w-full justify-center gap-2"
                            >
                              Learn More
                              <ArrowRight className="h-4 w-4" />
                            </GlassButton>
                          )
                        })()}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Contact CTA */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 lg:mt-16 text-center"
        >
          <GlassCard intensity="low" className="inline-block px-8 py-6">
            <p className="text-muted-foreground mb-3">
              Need something custom? Let's discuss your requirements.
            </p>
            <GlassButton 
              variant="glass"
              onClick={() => window.location.href = 'mailto:contact@xtx396.com?subject=Custom Request'}
            >
              <Envelope className="h-4 w-4 mr-2" />
              Contact for Custom Work
            </GlassButton>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  )
}
