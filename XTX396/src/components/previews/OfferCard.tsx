/**
 * Offer Card
 *
 * Card component displaying a marketing offer with preview thumbnail,
 * hover effects, and click to open preview modal.
 */

import { useState } from 'react'
import { Play, Sparkles, Check, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PreviewMontage, PreviewMeta } from '@/previews'

// ─── Types ───────────────────────────────────────────────────

export interface OfferCardProps {
  /** Montage definition */
  montage: PreviewMontage
  /** Preview metadata (if available) */
  meta?: PreviewMeta
  /** Base path for preview assets */
  basePath: string
  /** Click handler to open preview modal */
  onClick?: () => void
  /** Whether this offer is featured */
  featured?: boolean
  /** Price information */
  price?: {
    amount: number
    currency: string
    period?: string
  }
  /** Quick features list (max 3-4) */
  quickFeatures?: string[]
  /** Badge text (e.g., "Popular", "New") */
  badge?: string
  /** Custom className */
  className?: string
}

// ─── Component ───────────────────────────────────────────────

export function OfferCard({
  montage,
  meta,
  basePath,
  onClick,
  featured = false,
  price,
  quickFeatures,
  badge,
  className,
}: OfferCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const posterUrl = meta?.posterFilename
    ? `${basePath}/${montage.offerId}/${meta.posterFilename}`
    : null
  
  const sceneCount = meta?.scenes.length ?? montage.scenes.length
  const duration = meta?.totalDurationSeconds ?? montage.scenes.length * 2
  
  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 cursor-pointer',
        featured && 'ring-2 ring-primary',
        isHovered && 'shadow-lg scale-[1.02]',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Badge */}
      {badge && (
        <Badge
          className="absolute top-3 right-3 z-10"
          variant={featured ? 'default' : 'secondary'}
        >
          {badge}
        </Badge>
      )}
      
      {/* Preview Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {posterUrl && !imageError ? (
          <img
            src={posterUrl}
            alt={montage.title}
            onError={() => setImageError(true)}
            className={cn(
              'w-full h-full object-cover transition-transform duration-500',
              isHovered && 'scale-105'
            )}
          />
        ) : (
          /* Placeholder when no poster */
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
            <Sparkles className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Play Overlay */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <Play className="w-6 h-6 text-black ml-1" />
          </div>
        </div>
        
        {/* Scene Count Badge */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-xs">
          {sceneCount} templates • {Math.round(duration)}s
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{montage.title}</CardTitle>
        {montage.description && (
          <CardDescription className="line-clamp-2">
            {montage.description}
          </CardDescription>
        )}
      </CardHeader>
      
      {/* Quick Features */}
      {quickFeatures && quickFeatures.length > 0 && (
        <CardContent className="pt-0 pb-2">
          <ul className="grid grid-cols-2 gap-1">
            {quickFeatures.slice(0, 4).map((feature, i) => (
              <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span className="truncate">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
      
      <CardFooter className="pt-2">
        <div className="flex items-center justify-between w-full">
          {/* Price */}
          {price && (
            <div className="font-semibold">
              {price.currency === 'USD' ? '$' : price.currency}
              {price.amount.toLocaleString()}
              {price.period && (
                <span className="text-xs font-normal text-muted-foreground">
                  /{price.period}
                </span>
              )}
            </div>
          )}
          
          {/* View Button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'ml-auto transition-all duration-300',
              isHovered ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
            )}
          >
            View Preview
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default OfferCard
