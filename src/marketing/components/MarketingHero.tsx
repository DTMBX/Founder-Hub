/**
 * Marketing Hero Section
 *
 * Above-the-fold hero with headline, CTAs, video preview, and trust badges.
 */

import { useState, useRef, useEffect } from 'react'
import { Play, Calendar, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TRUST_BADGES, type TrustBadge } from '../proof.config'
import { track, MARKETING_EVENTS } from '../event-tracker'

// ─── Types ───────────────────────────────────────────────────

export interface MarketingHeroProps {
  /** Main headline */
  headline: string
  /** Subheadline text */
  subheadline: string
  /** Primary CTA label */
  primaryCtaLabel?: string
  /** Primary CTA callback */
  onPrimaryCta?: () => void
  /** Secondary CTA label */
  secondaryCtaLabel?: string
  /** Secondary CTA callback */
  onSecondaryCta?: () => void
  /** Video poster URL */
  videoPosterUrl?: string
  /** Video source URL (mp4) */
  videoUrl?: string
  /** Trust badges to display */
  trustBadges?: TrustBadge[]
  /** Loading state for primary CTA */
  isPrimaryLoading?: boolean
  /** Custom className */
  className?: string
}

// ─── Component ───────────────────────────────────────────────

export function MarketingHero({
  headline,
  subheadline,
  primaryCtaLabel = 'Generate My Preview',
  onPrimaryCta,
  secondaryCtaLabel = 'Book a 15-min Call',
  onSecondaryCta,
  videoPosterUrl,
  videoUrl,
  trustBadges = TRUST_BADGES.slice(0, 4),
  isPrimaryLoading = false,
  className,
}: MarketingHeroProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // Auto-play muted video on mount (if available)
  useEffect(() => {
    if (videoRef.current && videoUrl && !videoError) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked, show play button
        setVideoError(true)
      })
    }
  }, [videoUrl, videoError])
  
  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setIsVideoPlaying(true)
      track(MARKETING_EVENTS.VIDEO_PLAY, { location: 'hero' })
    }
  }
  
  const handlePrimaryCta = () => {
    track(MARKETING_EVENTS.GENERATE_PREVIEW_CLICKED, { location: 'hero' })
    onPrimaryCta?.()
  }
  
  const handleSecondaryCta = () => {
    track(MARKETING_EVENTS.BOOKING_CLICKED, { location: 'hero' })
    onSecondaryCta?.()
  }
  
  return (
    <section
      className={cn(
        'relative min-h-[80vh] flex items-center py-16 lg:py-24',
        'bg-gradient-to-b from-background to-muted/30',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            {/* Badge */}
            <Badge variant="secondary" className="text-sm">
              Professional Website Launch
            </Badge>
            
            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              {headline}
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
              {subheadline}
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={handlePrimaryCta}
                disabled={isPrimaryLoading}
                className="text-lg px-8 py-6"
              >
                {isPrimaryLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <>
                    {primaryCtaLabel}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={handleSecondaryCta}
                className="text-lg px-8 py-6"
              >
                <Calendar className="mr-2 w-5 h-5" />
                {secondaryCtaLabel}
              </Button>
            </div>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 pt-4">
              {trustBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right: Video Preview */}
          <div className="relative">
            <div
              className={cn(
                'relative aspect-video rounded-xl overflow-hidden',
                'bg-muted shadow-2xl',
                'ring-1 ring-border'
              )}
            >
              {videoUrl && !videoError ? (
                <>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    poster={videoPosterUrl}
                    muted
                    loop
                    playsInline
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    onError={() => setVideoError(true)}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Play overlay (shown when paused/autoplay blocked) */}
                  {!isVideoPlaying && (
                    <button
                      onClick={handlePlayClick}
                      className={cn(
                        'absolute inset-0 flex items-center justify-center',
                        'bg-black/40 transition-opacity duration-300',
                        'hover:bg-black/50'
                      )}
                      aria-label="Play demo video"
                    >
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                        <Play className="w-8 h-8 text-black ml-1" />
                      </div>
                    </button>
                  )}
                </>
              ) : videoPosterUrl ? (
                /* Poster fallback */
                <div className="relative w-full h-full">
                  <img
                    src={videoPosterUrl}
                    alt="Website preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Badge variant="secondary">Preview Demo</Badge>
                  </div>
                </div>
              ) : (
                /* Placeholder */
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <div className="text-center">
                    <Play className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Demo preview</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default MarketingHero
