import { useState, useEffect, useMemo } from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'
import usFlagOfficial from '@/assets/images/us-flag-official.svg'
import betsyRossSvg from '@/assets/images/betsy-ross-13-star.svg'
import gadsdenSvg from '@/assets/images/gadsden.svg'
import appealToHeavenPng from '@/assets/images/appeal-to-heaven.png'
import gonzalesSvg from '@/assets/images/gonzales-come-and-take-it.svg'
import powMiaPng from '@/assets/images/pow-mia.png'

interface FlagAsset {
  src: string
  alt: string
  priority: number
  type: 'svg' | 'png'
}

const FLAG_ASSETS: FlagAsset[] = [
  { src: usFlagOfficial, alt: 'United States Flag', priority: 1, type: 'svg' },
  { src: betsyRossSvg, alt: 'Betsy Ross Flag', priority: 2, type: 'svg' },
  { src: gadsdenSvg, alt: 'Gadsden Flag', priority: 2, type: 'svg' },
  { src: appealToHeavenPng, alt: 'Appeal to Heaven Flag', priority: 3, type: 'png' },
  { src: gonzalesSvg, alt: 'Gonzales Come and Take It Flag', priority: 3, type: 'svg' },
  { src: powMiaPng, alt: 'POW/MIA Flag', priority: 3, type: 'png' },
]

interface HonorFlagBarProps {
  enabled?: boolean
  rotationCadence?: number
  maxFlagsDesktop?: number
  maxFlagsMobile?: number
  animationEnabled?: boolean
  alignment?: 'left' | 'center' | 'right'
}

export default function HonorFlagBar({
  enabled = true,
  rotationCadence = 20000,
  maxFlagsDesktop = 7,
  maxFlagsMobile = 3,
  animationEnabled = true,
  alignment = 'center'
}: HonorFlagBarProps) {
  const prefersReducedMotion = useReducedMotion()
  const [currentSet, setCurrentSet] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [loadedFlags, setLoadedFlags] = useState<Set<string>>(new Set())

  const shouldAnimate = animationEnabled && !prefersReducedMotion

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const maxFlags = isMobile ? maxFlagsMobile : maxFlagsDesktop
  
  const flagSets = useMemo(() => {
    const sorted = [...FLAG_ASSETS].sort((a, b) => a.priority - b.priority)
    const sets: FlagAsset[][] = []
    
    for (let i = 0; i < sorted.length; i += maxFlags) {
      const set = sorted.slice(i, Math.min(i + maxFlags, sorted.length))
      if (set.length > 0) {
        sets.push(set)
      }
    }
    
    return sets.length > 0 ? sets : [[sorted[0]]]
  }, [maxFlags])

  useEffect(() => {
    if (!shouldAnimate || flagSets.length <= 1) return

    const interval = setInterval(() => {
      setCurrentSet((prev) => (prev + 1) % flagSets.length)
    }, rotationCadence)

    return () => clearInterval(interval)
  }, [shouldAnimate, flagSets.length, rotationCadence])

  const handleImageLoad = (src: string) => {
    setLoadedFlags((prev) => new Set([...prev, src]))
  }

  const handleImageError = (src: string) => {
    console.warn(`Failed to load flag image: ${src}`)
  }

  if (!enabled || flagSets.length === 0) {
    return <div className="h-[1px] bg-border/20" />
  }

  const currentFlags = flagSets[currentSet]
  const justifyClass = 
    alignment === 'left' ? 'justify-start' :
    alignment === 'right' ? 'justify-end' :
    'justify-center'

  const baseGap = isMobile ? 16 : 24
  const gapSize = currentFlags.length <= 1 ? 0 : baseGap

  const flagHeight = isMobile ? 16 : 20

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[60] bg-background/95 backdrop-blur-sm border-b border-border/20"
      role="presentation"
      aria-hidden="true"
    >
      <div className="w-full px-4 sm:px-6">
        <div 
          className={cn(
            "flex items-center mx-auto max-w-7xl transition-all duration-300",
            justifyClass
          )}
          style={{
            gap: `${gapSize}px`,
            height: `${flagHeight + 8}px`,
            minHeight: `${flagHeight + 8}px`
          }}
        >
          {currentFlags.map((flag, index) => (
            <div
              key={`${flag.src}-${currentSet}-${index}`}
              className={cn(
                "relative flex-shrink-0 opacity-0 transition-opacity duration-700",
                loadedFlags.has(flag.src) && "opacity-100"
              )}
              style={{
                height: `${flagHeight}px`,
                transitionDelay: shouldAnimate ? `${index * 80}ms` : '0ms'
              }}
            >
              <img
                src={flag.src}
                alt=""
                className={cn(
                  "h-full w-auto object-contain select-none",
                  shouldAnimate && "animate-subtle-wave"
                )}
                style={{
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35))',
                  imageRendering: flag.type === 'svg' ? 'crisp-edges' : '-webkit-optimize-contrast',
                  WebkitFontSmoothing: 'antialiased',
                  shapeRendering: flag.type === 'svg' ? 'geometricPrecision' : 'auto',
                  animationDelay: shouldAnimate ? `${index * 0.3}s` : '0s',
                  animationDuration: shouldAnimate ? '8s' : '0s',
                  maxWidth: '100%',
                  height: '100%'
                } as React.CSSProperties}
                onLoad={() => handleImageLoad(flag.src)}
                onError={() => handleImageError(flag.src)}
                loading="eager"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
