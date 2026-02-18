/**
 * SiteTypeToggle - Segmented Control for Website Generation Type
 * 
 * Filters offering content by site type (Law Firm / SMB / Agency).
 * Does NOT affect hero pathway buttons - those are separate.
 */

import { cn } from '@/lib/utils'
import { SiteGenerationType, SITE_GENERATION_TYPES } from '../offers.config'
import { Scales, Storefront, Buildings } from '@phosphor-icons/react'

export interface SiteTypeToggleProps {
  /** Currently selected site type */
  value: SiteGenerationType
  /** Called when selection changes */
  onChange: (type: SiteGenerationType) => void
  /** Additional class names */
  className?: string
}

const typeIcons: Record<SiteGenerationType, React.ReactNode> = {
  'law-firm': <Scales className="h-4 w-4" weight="duotone" />,
  'small-business': <Storefront className="h-4 w-4" weight="duotone" />,
  'agency': <Buildings className="h-4 w-4" weight="duotone" />,
}

export function SiteTypeToggle({ value, onChange, className }: SiteTypeToggleProps) {
  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-xl bg-muted/50 backdrop-blur-sm border border-border/30',
        className
      )}
      role="tablist"
      aria-label="Select website type"
    >
      {SITE_GENERATION_TYPES.map(type => {
        const isSelected = value === type.id
        return (
          <button
            key={type.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(type.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              isSelected
                ? 'bg-background text-foreground shadow-sm border border-border/50'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            {typeIcons[type.id]}
            <span className="hidden sm:inline">{type.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default SiteTypeToggle
