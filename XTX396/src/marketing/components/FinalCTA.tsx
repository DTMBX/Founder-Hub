/**
 * Final CTA Section
 *
 * Closing call-to-action section with primary and secondary CTAs.
 */

import { ArrowRight, Calendar, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { track, MARKETING_EVENTS } from '../event-tracker'

// ─── Types ───────────────────────────────────────────────────

export interface FinalCTAProps {
  /** Main headline */
  headline?: string
  /** Subheadline text */
  subheadline?: string
  /** Primary CTA label */
  primaryCtaLabel?: string
  /** Primary CTA callback */
  onPrimaryCta?: () => void
  /** Secondary CTA label */
  secondaryCtaLabel?: string
  /** Secondary CTA callback */
  onSecondaryCta?: () => void
  /** Loading state */
  isPrimaryLoading?: boolean
  /** Custom className */
  className?: string
}

// ─── Component ───────────────────────────────────────────────

export function FinalCTA({
  headline = 'Ready to Launch Your Website?',
  subheadline = 'Get started today and see your personalized preview in minutes.',
  primaryCtaLabel = 'Generate My Preview',
  onPrimaryCta,
  secondaryCtaLabel = 'Book a Call Instead',
  onSecondaryCta,
  isPrimaryLoading = false,
  className,
}: FinalCTAProps) {
  const handlePrimaryCta = () => {
    track(MARKETING_EVENTS.GENERATE_PREVIEW_CLICKED, { location: 'final_cta' })
    onPrimaryCta?.()
  }
  
  const handleSecondaryCta = () => {
    track(MARKETING_EVENTS.BOOKING_CLICKED, { location: 'final_cta' })
    onSecondaryCta?.()
  }
  
  return (
    <section
      className={cn(
        'relative py-20 lg:py-32 overflow-hidden',
        'bg-gradient-to-br from-primary/10 via-background to-secondary/10',
        className
      )}
      id="final-cta"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {headline}
          </h2>
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            {subheadline}
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={handlePrimaryCta}
              disabled={isPrimaryLoading}
              className="text-lg px-10 py-7 shadow-lg"
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
              variant="ghost"
              onClick={handleSecondaryCta}
              className="text-lg"
            >
              <Calendar className="mr-2 w-5 h-5" />
              {secondaryCtaLabel}
            </Button>
          </div>
          
          {/* Trust note */}
          <p className="mt-8 text-sm text-muted-foreground">
            No credit card required • Preview in under 5 minutes • Professional results
          </p>
        </div>
      </div>
    </section>
  )
}

export default FinalCTA
