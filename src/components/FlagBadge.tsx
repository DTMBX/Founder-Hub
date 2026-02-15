import { cn } from '@/lib/utils'
import type { AssetMetadata, ColorTreatment } from '@/lib/asset-types'

interface FlagBadgeProps {
  asset: AssetMetadata
  size?: 'sm' | 'md' | 'lg'
  colorTreatment?: ColorTreatment
  className?: string
}

export function FlagBadge({ asset, size = 'md', colorTreatment = 'original', className }: FlagBadgeProps) {
  const sizeClasses = {
    sm: 'w-8 h-6',
    md: 'w-12 h-9',
    lg: 'w-16 h-12',
  }
  
  const filterClasses = {
    'original': '',
    'monochrome-white': 'brightness-0 invert',
    'monochrome-muted': 'grayscale opacity-60',
    'accent-tinted': 'hue-rotate-15 saturate-150',
  }
  
  return (
    <div className={cn('relative inline-block overflow-hidden rounded', sizeClasses[size], className)}>
      <img
        src={asset.filePath}
        alt={asset.tags.join(', ')}
        className={cn('w-full h-full object-cover', filterClasses[colorTreatment])}
        loading="lazy"
      />
    </div>
  )
}
