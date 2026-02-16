/**
 * Feature Grid
 *
 * Flexible grid of feature cards with icons/images.
 * Used for showcasing benefits, features, or steps.
 */

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

// ─── Types ───────────────────────────────────────────────────

export interface FeatureItem {
  /** Unique identifier */
  id: string
  /** Feature title */
  title: string
  /** Feature description */
  description: string
  /** Optional icon component */
  icon?: ReactNode
  /** Optional image URL */
  imageUrl?: string
  /** Optional badge text */
  badge?: string
  /** Optional link URL */
  href?: string
}

export interface FeatureGridProps {
  /** Feature items to display */
  features: FeatureItem[]
  /** Number of columns (responsive) */
  columns?: 2 | 3 | 4
  /** Card style variant */
  variant?: 'default' | 'bordered' | 'elevated' | 'minimal'
  /** Icon position */
  iconPosition?: 'top' | 'left' | 'inline'
  /** Custom className */
  className?: string
  /** Custom card className */
  cardClassName?: string
}

// ─── Grid Column Classes ─────────────────────────────────────

const COLUMN_CLASSES: Record<NonNullable<FeatureGridProps['columns']>, string> = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

// ─── Card Variant Classes ────────────────────────────────────

const CARD_CLASSES: Record<NonNullable<FeatureGridProps['variant']>, string> = {
  default: 'bg-card p-6 rounded-lg',
  bordered: 'bg-card p-6 rounded-lg border border-border',
  elevated: 'bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow',
  minimal: 'p-4',
}

// ─── Feature Card ────────────────────────────────────────────

interface FeatureCardProps {
  feature: FeatureItem
  variant: NonNullable<FeatureGridProps['variant']>
  iconPosition: NonNullable<FeatureGridProps['iconPosition']>
  className?: string
}

function FeatureCard({ feature, variant, iconPosition, className }: FeatureCardProps) {
  const { id, title, description, icon, imageUrl, badge, href } = feature
  
  const cardContent = (
    <>
      {/* Badge */}
      {badge && (
        <Badge variant="secondary" className="mb-3 text-xs">
          {badge}
        </Badge>
      )}
      
      {/* Image (if provided, replaces icon) */}
      {imageUrl && (
        <div className="mb-4 aspect-video rounded-md overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      
      {/* Icon + Title + Description layout */}
      {iconPosition === 'top' && !imageUrl && (
        <>
          {icon && (
            <div className="mb-4 w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </>
      )}
      
      {iconPosition === 'left' && !imageUrl && (
        <div className="flex gap-4">
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
          </div>
        </div>
      )}
      
      {iconPosition === 'inline' && !imageUrl && (
        <>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            {icon && <span className="text-primary">{icon}</span>}
            {title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </>
      )}
      
      {/* If has image but still needs title/desc */}
      {imageUrl && (
        <>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </>
      )}
    </>
  )
  
  const cardClassName = cn(CARD_CLASSES[variant], className)
  
  if (href) {
    return (
      <a
        key={id}
        href={href}
        className={cn(cardClassName, 'block hover:bg-accent/5 transition-colors')}
      >
        {cardContent}
      </a>
    )
  }
  
  return (
    <div key={id} className={cardClassName}>
      {cardContent}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────

export function FeatureGrid({
  features,
  columns = 3,
  variant = 'bordered',
  iconPosition = 'top',
  className,
  cardClassName,
}: FeatureGridProps) {
  return (
    <div
      className={cn(
        'grid gap-6',
        COLUMN_CLASSES[columns],
        className
      )}
      role="list"
      aria-label="Features"
    >
      {features.map((feature) => (
        <FeatureCard
          key={feature.id}
          feature={feature}
          variant={variant}
          iconPosition={iconPosition}
          className={cardClassName}
        />
      ))}
    </div>
  )
}

export default FeatureGrid
