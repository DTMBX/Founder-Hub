/**
 * How It Works Section
 *
 * 3-step process visualization with timeline badges.
 */

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { PROCESS_STEPS, type ProcessStep } from '../proof.config'

// ─── Types ───────────────────────────────────────────────────

export interface HowItWorksProps {
  /** Section title */
  title?: string
  /** Section subtitle */
  subtitle?: string
  /** Process steps to display */
  steps?: ProcessStep[]
  /** Custom className */
  className?: string
}

// ─── Component ───────────────────────────────────────────────

export function HowItWorks({
  title = 'How It Works',
  subtitle = 'From idea to live website in three simple steps',
  steps = PROCESS_STEPS,
  className,
}: HowItWorksProps) {
  return (
    <section className={cn('py-16 lg:py-24', className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          <p className="text-lg text-muted-foreground">{subtitle}</p>
        </div>
        
        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connector line (hidden on mobile, shown between cards on desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-0.5 bg-border" />
              )}
              
              {/* Step card */}
              <div className="relative flex flex-col items-center text-center">
                {/* Number circle */}
                <div
                  className={cn(
                    'w-16 h-16 rounded-full flex items-center justify-center mb-6',
                    'bg-primary text-primary-foreground text-2xl font-bold',
                    'shadow-lg'
                  )}
                >
                  {step.number}
                </div>
                
                {/* Duration badge */}
                <Badge variant="secondary" className="mb-4">
                  {step.duration}
                </Badge>
                
                {/* Title */}
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                
                {/* Description */}
                <p className="text-muted-foreground max-w-xs">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
