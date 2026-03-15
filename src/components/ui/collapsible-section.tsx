import { CaretDown } from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  /** Section element id for anchor links */
  id: string
  /** Section heading */
  title: string
  /** Optional subtitle shown next to heading */
  subtitle?: string
  /** Number of items — shown as a badge */
  count?: number
  /** Accent color for the expand indicator */
  accent?: 'emerald' | 'amber' | 'blue' | 'teal' | 'rose' | 'purple'
  /** Start expanded? Default true */
  defaultOpen?: boolean
  /** Extra className on the outer wrapper */
  className?: string
  /** data-* attrs forwarded to <section> */
  'data-content-section'?: string
  'data-kv-key'?: string
  'data-admin-tab'?: string
  children: React.ReactNode
}

const accentMap: Record<string, string> = {
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  blue: 'text-blue-400',
  teal: 'text-teal-400',
  rose: 'text-rose-400',
  purple: 'text-purple-400',
}

export function CollapsibleSection({
  id,
  title,
  subtitle,
  count,
  accent = 'emerald',
  defaultOpen = true,
  className,
  children,
  ...dataAttrs
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const prefersReducedMotion = useReducedMotion()
  const accentColor = accentMap[accent] || accentMap.emerald

  return (
    <section
      id={id}
      className={cn('relative px-4 sm:px-6 lg:px-8 overflow-hidden', className)}
      {...dataAttrs}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/10 to-background -z-10" />
      <div className="section-separator absolute top-0 left-0 right-0" />

      <div className="container mx-auto max-w-7xl py-12 sm:py-16">
        {/* Clickable header strip */}
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          aria-expanded={open}
          aria-controls={`${id}-content`}
          className="w-full flex items-center justify-between gap-4 group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg -mx-2 px-2 py-1"
        >
          <div className="flex items-baseline gap-3 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold truncate">{title}</h2>
            {subtitle && (
              <span className="text-sm text-muted-foreground hidden sm:inline">{subtitle}</span>
            )}
            {typeof count === 'number' && (
              <span className={cn('text-xs font-mono tabular-nums', accentColor)}>
                {count}
              </span>
            )}
          </div>
          <CaretDown
            className={cn(
              'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300',
              open && 'rotate-180',
              `group-hover:${accentColor}`
            )}
            weight="bold"
          />
        </button>

        {/* Collapsible body */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={`${id}-content`}
              role="region"
              aria-labelledby={id}
              initial={prefersReducedMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-6">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
