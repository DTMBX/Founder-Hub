/**
 * Proof Strip Section
 *
 * Social proof with stats, testimonials, and preview thumbnails.
 */

import { useState, useEffect, useRef } from 'react'
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  PROOF_STATS,
  TESTIMONIALS,
  type StatItem,
  type Testimonial,
} from '../proof.config'
import { track, MARKETING_EVENTS } from '../event-tracker'

// ─── Types ───────────────────────────────────────────────────

export interface ProofStripProps {
  /** Stats to display */
  stats?: StatItem[]
  /** Testimonials to display */
  testimonials?: Testimonial[]
  /** Preview thumbnail URLs (from meta.json) */
  previewThumbnails?: string[]
  /** Show stats section */
  showStats?: boolean
  /** Show testimonials section */
  showTestimonials?: boolean
  /** Show preview thumbnails */
  showPreviews?: boolean
  /** Custom className */
  className?: string
}

// ─── Stats Row ───────────────────────────────────────────────

function StatsRow({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-border">
      {stats.map((stat) => (
        <div key={stat.id} className="text-center">
          <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
            {stat.value}
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Testimonials Carousel ───────────────────────────────────

function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [testimonials.length])
  
  const goTo = (index: number) => {
    setCurrentIndex(index)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }
  
  const goPrev = () => {
    goTo((currentIndex - 1 + testimonials.length) % testimonials.length)
  }
  
  const goNext = () => {
    goTo((currentIndex + 1) % testimonials.length)
  }
  
  const current = testimonials[currentIndex]
  
  return (
    <div className="py-12">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-8 md:p-12">
            <Quote className="w-10 h-10 text-primary/30 mb-6" />
            
            <blockquote className="text-xl md:text-2xl font-medium mb-8">
              "{current.quote}"
            </blockquote>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar placeholder */}
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-lg font-semibold text-muted-foreground">
                    {current.author.charAt(0)}
                  </span>
                </div>
                
                <div>
                  <div className="font-semibold">{current.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {current.role}
                    {current.company && `, ${current.company}`}
                  </div>
                </div>
              </div>
              
              {/* Rating */}
              {current.rating && (
                <div className="flex gap-1">
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button variant="ghost" size="icon" onClick={goPrev} aria-label="Previous testimonial">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  i === currentIndex ? 'bg-primary' : 'bg-muted'
                )}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
          
          <Button variant="ghost" size="icon" onClick={goNext} aria-label="Next testimonial">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Preview Thumbnails ──────────────────────────────────────

function PreviewThumbnails({ thumbnails }: { thumbnails: string[] }) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [errorImages, setErrorImages] = useState<Set<number>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Lazy load images when they enter viewport
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.index)
            if (!isNaN(index)) {
              setLoadedImages((prev) => new Set([...prev, index]))
            }
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '100px', threshold: 0.1 }
    )
    
    const images = container.querySelectorAll('[data-lazy-image]')
    images.forEach((img) => observer.observe(img))
    
    return () => observer.disconnect()
  }, [thumbnails.length])
  
  return (
    <div className="py-12">
      <h3 className="text-center text-lg font-medium mb-8 text-muted-foreground">
        Recent Site Previews
      </h3>
      
      <div 
        ref={containerRef}
        className="flex gap-4 overflow-x-auto pb-4 px-4 -mx-4 scrollbar-thin scrollbar-thumb-muted"
      >
        {thumbnails.map((url, i) => (
          <div
            key={i}
            data-lazy-image
            data-index={i}
            className={cn(
              'flex-shrink-0 w-48 aspect-video rounded-lg overflow-hidden',
              'bg-muted shadow-sm ring-1 ring-border',
              'transition-transform hover:scale-105'
            )}
          >
            {loadedImages.has(i) ? (
              errorImages.has(i) ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  Preview unavailable
                </div>
              ) : (
                <img
                  src={url}
                  alt={`Preview ${i + 1}`}
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    track(MARKETING_EVENTS.SECTION_VIEWED, { section: 'proof_thumbnails', thumbnailIndex: i })
                  }}
                  onError={() => {
                    setErrorImages((prev) => new Set([...prev, i]))
                  }}
                />
              )
            ) : (
              <div className="w-full h-full animate-pulse bg-muted" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────

export function ProofStrip({
  stats = PROOF_STATS,
  testimonials = TESTIMONIALS,
  previewThumbnails = [],
  showStats = true,
  showTestimonials = true,
  showPreviews = true,
  className,
}: ProofStripProps) {
  return (
    <section className={cn('bg-muted/30', className)}>
      <div className="container mx-auto px-4">
        {/* Stats */}
        {showStats && stats.length > 0 && <StatsRow stats={stats} />}
        
        {/* Testimonials */}
        {showTestimonials && testimonials.length > 0 && (
          <TestimonialsCarousel testimonials={testimonials} />
        )}
        
        {/* Preview Thumbnails */}
        {showPreviews && previewThumbnails.length > 0 && (
          <PreviewThumbnails thumbnails={previewThumbnails} />
        )}
      </div>
    </section>
  )
}

export default ProofStrip
