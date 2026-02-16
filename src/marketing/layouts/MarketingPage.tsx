/**
 * Marketing Page Layout
 *
 * Reusable layout wrapper for marketing pages with:
 * - Consistent header/footer structure
 * - Skip links and a11y features
 * - Event debug panel (dev mode)
 * - Scroll depth tracking
 * - Preload asset injection
 */

import { ReactNode, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { SkipLinks, EventDebugPanel } from '../components'
import { useScrollDepth, usePreloadAssets, type PreloadConfig } from '../hooks'
import { trackPageView } from '../event-tracker'

// ─── Types ───────────────────────────────────────────────────

export interface MarketingPageProps {
  /** Page identifier for analytics */
  pageId: string
  /** Page title (used in document.title) */
  title?: string
  /** Child content (sections) */
  children: ReactNode
  /** Custom className for main wrapper */
  className?: string
  /** Assets to preload */
  preloads?: PreloadConfig[]
  /** External origins to preconnect */
  preconnects?: string[]
  /** Show debug panel in dev mode */
  showDebugPanel?: boolean
  /** Header component (optional) */
  header?: ReactNode
  /** Footer component (optional) */
  footer?: ReactNode
}

// ─── Component ───────────────────────────────────────────────

export function MarketingPage({
  pageId,
  title,
  children,
  className,
  preloads = [],
  preconnects = [],
  showDebugPanel = true,
  header,
  footer,
}: MarketingPageProps) {
  // Track page view on mount
  useEffect(() => {
    trackPageView(pageId)
  }, [pageId])
  
  // Update document title if provided
  useEffect(() => {
    if (title) {
      document.title = title
    }
  }, [title])
  
  // Track scroll depth milestones
  useScrollDepth(pageId)
  
  // Preload critical assets
  usePreloadAssets({
    preloads,
    preconnects,
  })
  
  return (
    <div className={cn('min-h-screen flex flex-col', className)}>
      {/* Skip Links for keyboard navigation */}
      <SkipLinks />
      
      {/* Optional Header */}
      {header}
      
      {/* Main Content */}
      <main id="main-content" className="flex-1">
        {children}
      </main>
      
      {/* Optional Footer */}
      {footer}
      
      {/* Debug Panel (visible with ?debug=1) */}
      {showDebugPanel && <EventDebugPanel />}
    </div>
  )
}

export default MarketingPage

// ─── Section Wrapper ─────────────────────────────────────────

export interface MarketingSectionProps {
  /** Section ID (for skip links and anchors) */
  id: string
  /** Section aria-label or aria-labelledby */
  label?: string
  /** Section children */
  children: ReactNode
  /** Custom className */
  className?: string
  /** Background variant */
  variant?: 'default' | 'muted' | 'accent' | 'dark'
  /** Padding size */
  padding?: 'sm' | 'md' | 'lg' | 'xl'
}

const VARIANT_CLASSES: Record<NonNullable<MarketingSectionProps['variant']>, string> = {
  default: 'bg-background',
  muted: 'bg-muted/30',
  accent: 'bg-primary/5',
  dark: 'bg-zinc-900 text-white',
}

const PADDING_CLASSES: Record<NonNullable<MarketingSectionProps['padding']>, string> = {
  sm: 'py-8 lg:py-12',
  md: 'py-12 lg:py-16',
  lg: 'py-16 lg:py-24',
  xl: 'py-20 lg:py-32',
}

export function MarketingSection({
  id,
  label,
  children,
  className,
  variant = 'default',
  padding = 'lg',
}: MarketingSectionProps) {
  return (
    <section
      id={id}
      aria-label={label}
      className={cn(
        VARIANT_CLASSES[variant],
        PADDING_CLASSES[padding],
        className
      )}
    >
      <div className="container mx-auto px-4">
        {children}
      </div>
    </section>
  )
}

// ─── Section Header ──────────────────────────────────────────

export interface SectionHeaderProps {
  /** Heading ID (for aria-labelledby) */
  id?: string
  /** Section title */
  title: string
  /** Optional subtitle */
  subtitle?: string
  /** Optional badge/eyebrow text */
  badge?: string
  /** Optional icon */
  icon?: ReactNode
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
  /** Custom className */
  className?: string
}

export function SectionHeader({
  id,
  title,
  subtitle,
  badge,
  icon,
  align = 'center',
  className,
}: SectionHeaderProps) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto',
  }[align]
  
  return (
    <div className={cn('max-w-2xl mb-12', alignClass, className)}>
      {badge && (
        <span className="inline-block text-sm font-medium text-primary mb-2">
          {badge}
        </span>
      )}
      
      <div className={cn(
        'flex items-center gap-3 mb-4',
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end'
      )}>
        {icon && <span aria-hidden="true">{icon}</span>}
        <h2 id={id} className="text-3xl md:text-4xl font-bold tracking-tight">
          {title}
        </h2>
      </div>
      
      {subtitle && (
        <p className="text-lg text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}
