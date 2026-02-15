import { cn } from '@/lib/utils'
import type { AssetMetadata } from '@/lib/asset-types'

interface WatermarkBackgroundProps {
  asset: AssetMetadata
  opacity?: number
  position?: 'center' | 'top-right' | 'bottom-left' | 'bottom-right'
  scale?: number
  className?: string
  children?: React.ReactNode
}

export function WatermarkBackground({ 
  asset, 
  opacity = 0.05, 
  position = 'center',
  scale = 1,
  className,
  children 
}: WatermarkBackgroundProps) {
  const positionClasses = {
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'top-right': 'top-8 right-8',
    'bottom-left': 'bottom-8 left-8',
    'bottom-right': 'bottom-8 right-8',
  }
  
  return (
    <div className={cn('relative', className)}>
      <div 
        className={cn(
          'absolute pointer-events-none select-none',
          positionClasses[position]
        )}
        style={{ 
          opacity,
          transform: `scale(${scale})`,
        }}
        aria-hidden="true"
      >
        <img
          src={asset.filePath}
          alt=""
          className="w-auto h-auto max-w-[800px] max-h-[800px] object-contain grayscale"
        />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
