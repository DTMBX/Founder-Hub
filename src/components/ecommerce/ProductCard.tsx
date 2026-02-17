/**
 * Product Card Component
 * 
 * E-commerce product display with Stripe checkout integration.
 * Features glassmorphism design, animations, and responsive layout.
 */

import React, { useState } from 'react'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { stripeConfig, productsConfig, type ProductCard as ProductCardType } from '@/config/site.config'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: ProductCardType
  className?: string
  style?: React.CSSProperties
  onAddToCart?: (product: ProductCardType) => void
  variant?: 'default' | 'compact' | 'featured'
}

/**
 * Format price for display
 */
function formatPrice(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100) // Stripe uses cents
}

/**
 * Redirect to Stripe Checkout
 */
async function redirectToCheckout(priceId: string): Promise<void> {
  if (!stripeConfig.enabled || !stripeConfig.publishableKey) {
    console.error('[ProductCard] Stripe not configured')
    return
  }
  
  // Dynamically import Stripe
  const { loadStripe } = await import('@stripe/stripe-js')
  const stripe = await loadStripe(stripeConfig.publishableKey)
  
  if (!stripe) {
    console.error('[ProductCard] Failed to load Stripe')
    return
  }
  
  // Redirect to Checkout using Stripe's sessions API
  // Note: For production, use server-side session creation
  const session = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId,
      successUrl: `${window.location.origin}${stripeConfig.successUrl}`,
      cancelUrl: `${window.location.origin}${stripeConfig.cancelUrl}`,
    })
  }).then(r => r.json()).catch(() => null)
  
  // Fallback: Open Stripe payment link if API not available
  if (!session?.url) {
    console.warn('[ProductCard] Server checkout unavailable, using fallback')
    window.open(`https://buy.stripe.com/${priceId}`, '_blank')
    return
  }
  
  window.location.href = session.url
}

export function ProductCard({
  product,
  className,
  style,
  onAddToCart,
  variant = 'default',
}: ProductCardProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const handleBuyNow = async () => {
    if (!product.stripePriceId) {
      console.error('[ProductCard] No Stripe Price ID configured')
      return
    }
    
    setIsLoading(true)
    try {
      await redirectToCheckout(product.stripePriceId)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleAddToCart = () => {
    onAddToCart?.(product)
  }
  
  const isCompact = variant === 'compact'
  const isFeatured = variant === 'featured'
  
  return (
    <GlassCard
      intensity={isFeatured ? 'high' : 'medium'}
      style={style}
      className={cn(
        'group relative overflow-hidden transition-all duration-500',
        'hover:scale-[1.02] hover:shadow-2xl',
        'border border-border/30 hover:border-primary/50',
        isFeatured && 'ring-2 ring-primary/30',
        className
      )}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      </div>
      
      {/* Product Image */}
      <div className={cn(
        'relative overflow-hidden bg-muted/30',
        isCompact ? 'aspect-square' : 'aspect-[4/3]'
      )}>
        {product.image ? (
          <>
            {/* Skeleton loader */}
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted to-muted/50" />
            )}
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={cn(
                'w-full h-full object-cover transition-all duration-700',
                'group-hover:scale-110',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <span className="text-4xl opacity-50">📦</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.featured && (
            <Badge variant="default" className="bg-primary/90 backdrop-blur-sm">
              Featured
            </Badge>
          )}
          {product.inStock === false && (
            <Badge variant="destructive" className="backdrop-blur-sm">
              Out of Stock
            </Badge>
          )}
          {product.category && (
            <Badge variant="secondary" className="backdrop-blur-sm bg-background/50">
              {product.category}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className={cn('p-4 space-y-3', isCompact && 'p-3 space-y-2')}>
        {/* Name */}
        <h3 className={cn(
          'font-semibold line-clamp-2 transition-colors',
          'group-hover:text-primary',
          isCompact ? 'text-sm' : 'text-lg'
        )}>
          {product.name}
        </h3>
        
        {/* Description */}
        {!isCompact && product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
        
        {/* Price & Actions */}
        <div className={cn(
          'flex items-center justify-between pt-2',
          isCompact && 'pt-1'
        )}>
          {productsConfig.showPrices && (
            <div className="flex items-baseline gap-1">
              <span className={cn(
                'font-bold text-foreground',
                isCompact ? 'text-base' : 'text-xl'
              )}>
                {formatPrice(product.price, product.currency)}
              </span>
            </div>
          )}
          
          <div className="flex gap-2">
            {onAddToCart && (
              <Button
                variant="ghost"
                size={isCompact ? 'sm' : 'default'}
                onClick={handleAddToCart}
                disabled={product.inStock === false}
                className="hover:bg-accent/20"
              >
                🛒
              </Button>
            )}
            
            {stripeConfig.enabled && product.stripePriceId && (
              <Button
                size={isCompact ? 'sm' : 'default'}
                onClick={handleBuyNow}
                disabled={isLoading || product.inStock === false}
                className={cn(
                  'relative overflow-hidden',
                  'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90',
                  'transition-all duration-300'
                )}
              >
                {isLoading ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  'Buy Now'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

/**
 * Product Grid Component
 */
export function ProductGrid({
  products,
  columns = productsConfig.gridColumns,
  className,
  onAddToCart,
}: {
  products: ProductCardType[]
  columns?: number
  className?: string
  onAddToCart?: (product: ProductCardType) => void
}): React.ReactElement {
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
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          variant={index === 0 && products.length > 3 ? 'featured' : 'default'}
          onAddToCart={onAddToCart}
          className="animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: `${index * 100}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

export default ProductCard
