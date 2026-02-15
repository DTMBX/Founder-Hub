import { cn } from '@/lib/utils'
import type { AssetMetadata, ColorTreatment } from '@/lib/asset-types'

interface LogoMarkProps {
  asset: AssetMetadata
  size?: 'sm' | 'md' | 'lg' | 'xl'
  colorTreatment?: ColorTreatment
  className?: string
}

export function LogoMark({ asset, size = 'md', colorTreatment = 'original', className }: LogoMarkProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24',
  }
  
  const filterClasses = {
    'original': '',
    'monochrome-white': 'brightness-0 invert',
    'monochrome-muted': 'grayscale opacity-70',
    'accent-tinted': 'hue-rotate-15',
  }
  
  return (
    <img
      src={asset.filePath}
      alt={asset.tags.join(' ')}
      className={cn('object-contain', sizeClasses[size], filterClasses[colorTreatment], className)}
      loading="lazy"
    />
  )
}
