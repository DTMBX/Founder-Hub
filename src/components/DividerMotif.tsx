import { cn } from '@/lib/utils'
import type { AssetMetadata } from '@/lib/asset-types'

interface DividerMotifProps {
  asset: AssetMetadata
  orientation?: 'horizontal' | 'vertical'
  opacity?: number
  className?: string
}

export function DividerMotif({ asset, orientation = 'horizontal', opacity = 0.3, className }: DividerMotifProps) {
  return (
    <div className={cn('flex items-center gap-4', orientation === 'vertical' && 'flex-col', className)}>
      <div className="flex-1 h-px bg-border" />
      <div style={{ opacity }} aria-hidden="true">
        <img
          src={asset.filePath}
          alt=""
          className={cn(
            'object-contain',
            orientation === 'horizontal' ? 'h-8 w-auto' : 'w-8 h-auto'
          )}
        />
      </div>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}
