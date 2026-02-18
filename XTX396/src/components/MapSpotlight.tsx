import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { AssetMetadata, MapSpotlightSettings } from '@/lib/asset-types'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface MapSpotlightProps {
  asset: AssetMetadata
  settings: MapSpotlightSettings
  className?: string
}

export function MapSpotlight({ asset, settings, className }: MapSpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const reducedMotion = useReducedMotion()
  
  const shouldAnimate = settings.enabled && 
                        settings.animationType !== 'none' && 
                        (!settings.respectReducedMotion || !reducedMotion)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])
  
  const animationDuration = settings.animationSpeed || 3
  const intensity = settings.animationIntensity || 0.5
  
  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <svg 
        viewBox="0 0 1000 600" 
        className="w-full h-auto opacity-20"
        aria-label="USA Map"
      >
        <image 
          href={asset.filePath} 
          width="1000" 
          height="600"
          className={cn(
            shouldAnimate && settings.animationType === 'pulse' && isVisible && 'animate-pulse-slow',
          )}
        />
        
        {shouldAnimate && settings.animationType === 'outline' && isVisible && (
          <rect
            x="10"
            y="10"
            width="980"
            height="580"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary"
            strokeDasharray="3000"
            strokeDashoffset="3000"
            style={{
              animation: `drawOutline ${animationDuration}s ease-out forwards`,
              opacity: intensity,
            }}
          />
        )}
        
        {shouldAnimate && settings.animationType === 'gradient' && isVisible && (
          <defs>
            <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
              <stop offset="50%" stopColor="currentColor" stopOpacity={intensity} />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              <animate
                attributeName="x1"
                values="-100%;100%"
                dur={`${animationDuration}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="x2"
                values="0%;200%"
                dur={`${animationDuration}s`}
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>
        )}
      </svg>
      
      <style>{`
        @keyframes drawOutline {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: ${0.2 + intensity * 0.3};
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow ${animationDuration}s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
