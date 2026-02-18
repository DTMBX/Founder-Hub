/**
 * Accessibility Configuration
 *
 * Centralized a11y utilities and ARIA labels for the marketing module.
 * WCAG 2.1 AA compliance baseline.
 */

// ─── Skip Link Configuration ─────────────────────────────────

export const SKIP_LINKS = [
  { id: 'main-content', label: 'Skip to main content' },
  { id: 'offers', label: 'Skip to offers' },
  { id: 'pricing', label: 'Skip to pricing' },
  { id: 'contact', label: 'Skip to contact' },
] as const

// ─── Section Labels ──────────────────────────────────────────

export const SECTION_LABELS = {
  hero: 'Introduction and main call to action',
  offers: 'Available service packages',
  howItWorks: 'Our three-step process',
  proof: 'Client testimonials and statistics',
  pricing: 'Package pricing details',
  faq: 'Frequently asked questions',
  finalCta: 'Get started',
} as const

// ─── Button Labels ───────────────────────────────────────────

export const BUTTON_LABELS = {
  generatePreview: 'Generate a personalized preview of your website',
  bookCall: 'Schedule a consultation call',
  selectTier: (tierName: string) => `Select the ${tierName} package`,
  viewFaq: 'View frequently asked questions',
  scrollToOffers: 'View available packages',
  expandFaq: (question: string) => `Expand answer for: ${question}`,
  collapseFaq: (question: string) => `Collapse answer for: ${question}`,
  playVideo: 'Play preview video',
  pauseVideo: 'Pause preview video',
  closeModal: 'Close preview modal',
  nextSlide: 'View next testimonial',
  prevSlide: 'View previous testimonial',
} as const

// ─── Focus Trap Utilities ────────────────────────────────────

/** Focusable element selectors */
const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
}

/**
 * Create a focus trap within a container.
 * Returns cleanup function.
 */
export function createFocusTrap(
  container: HTMLElement,
  options?: {
    initialFocus?: HTMLElement | null
    onEscape?: () => void
  }
): () => void {
  const focusableElements = getFocusableElements(container)
  const firstFocusable = focusableElements[0]
  const lastFocusable = focusableElements[focusableElements.length - 1]
  
  // Store previously focused element to restore later
  const previouslyFocused = document.activeElement as HTMLElement | null
  
  // Set initial focus
  if (options?.initialFocus) {
    options.initialFocus.focus()
  } else if (firstFocusable) {
    firstFocusable.focus()
  }
  
  const handleKeyDown = (e: KeyboardEvent) => {
    // Escape key
    if (e.key === 'Escape') {
      e.preventDefault()
      options?.onEscape?.()
      return
    }
    
    // Tab key - trap focus
    if (e.key === 'Tab') {
      if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault()
        firstFocusable?.focus()
      } else if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault()
        lastFocusable?.focus()
      }
    }
  }
  
  container.addEventListener('keydown', handleKeyDown)
  
  // Cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown)
    // Restore focus to previously focused element
    previouslyFocused?.focus()
  }
}

// ─── Announcer Utilities ─────────────────────────────────────

/**
 * Announce a message to screen readers via a live region.
 * Uses aria-live="polite" by default.
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // Find or create the announcer element
  let announcer = document.getElementById('sr-announcer')
  
  if (!announcer) {
    announcer = document.createElement('div')
    announcer.id = 'sr-announcer'
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.setAttribute('role', 'status')
    announcer.className = 'sr-only'
    document.body.appendChild(announcer)
  }
  
  // Update priority if different
  announcer.setAttribute('aria-live', priority)
  
  // Clear and set message (forces announcement)
  announcer.textContent = ''
  requestAnimationFrame(() => {
    announcer!.textContent = message
  })
}

// ─── Preload Helpers ─────────────────────────────────────────

export interface PreloadConfig {
  href: string
  as: 'image' | 'video' | 'font' | 'style' | 'script'
  type?: string
  crossOrigin?: 'anonymous' | 'use-credentials'
}

/**
 * Inject preload link tags for critical assets.
 * Call during initial render to hint browser.
 */
export function injectPreloadLinks(configs: PreloadConfig[]): void {
  const head = document.head
  const existingPreloads = new Set(
    Array.from(head.querySelectorAll('link[rel="preload"]')).map(
      (link) => link.getAttribute('href')
    )
  )
  
  configs.forEach(({ href, as, type, crossOrigin }) => {
    if (existingPreloads.has(href)) return
    
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    if (type) link.type = type
    if (crossOrigin) link.crossOrigin = crossOrigin
    
    head.appendChild(link)
  })
}

/**
 * Inject preconnect link for external origins.
 */
export function injectPreconnect(origins: string[]): void {
  const head = document.head
  const existingPreconnects = new Set(
    Array.from(head.querySelectorAll('link[rel="preconnect"]')).map(
      (link) => link.getAttribute('href')
    )
  )
  
  origins.forEach((origin) => {
    if (existingPreconnects.has(origin)) return
    
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = origin
    head.appendChild(link)
    
    // Also add dns-prefetch as fallback
    const dnsPrefetch = document.createElement('link')
    dnsPrefetch.rel = 'dns-prefetch'
    dnsPrefetch.href = origin
    head.appendChild(dnsPrefetch)
  })
}

// ─── Reduced Motion Utility ──────────────────────────────────

/**
 * Check if user prefers reduced motion.
 * Use this to disable animations.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get animation duration based on reduced motion preference.
 * Returns 0 if user prefers reduced motion.
 */
export function getAnimationDuration(defaultMs: number): number {
  return prefersReducedMotion() ? 0 : defaultMs
}

// ─── Keyboard Navigation ─────────────────────────────────────

/**
 * Handle keyboard navigation within a list of items.
 * Supports arrow keys, Home, End.
 */
export function handleListKeyboardNav(
  e: KeyboardEvent,
  currentIndex: number,
  itemCount: number
): number | null {
  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      e.preventDefault()
      return Math.min(currentIndex + 1, itemCount - 1)
    case 'ArrowUp':
    case 'ArrowLeft':
      e.preventDefault()
      return Math.max(currentIndex - 1, 0)
    case 'Home':
      e.preventDefault()
      return 0
    case 'End':
      e.preventDefault()
      return itemCount - 1
    default:
      return null
  }
}
