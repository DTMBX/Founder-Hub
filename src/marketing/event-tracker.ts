/**
 * Event Tracker
 *
 * Lightweight conversion tracking for demo and production modes.
 * In demo mode, events are buffered to localStorage.
 * In production, events can be forwarded to analytics providers.
 */

// ─── Types ───────────────────────────────────────────────────

export interface TrackingEvent {
  eventName: string
  properties: Record<string, unknown>
  timestamp: string
  sessionId: string
}

export interface EventTrackerConfig {
  /** Enable console logging in development */
  debug?: boolean
  /** Storage key for event buffer */
  storageKey?: string
  /** Maximum events to keep in buffer */
  maxBufferSize?: number
  /** Custom event handler (for production analytics) */
  onEvent?: (event: TrackingEvent) => void
}

// ─── Event Names (Type-Safe) ─────────────────────────────────

export const MARKETING_EVENTS = {
  // Page views
  PAGE_VIEW: 'page_view',
  OFFER_PAGE_VIEW: 'offer_page_view',
  
  // Offer interactions
  OFFER_VIEW_DETAILS: 'offer_view_details',
  OFFER_MODAL_CLOSE: 'offer_modal_close',
  PRICING_TIER_SELECTED: 'pricing_tier_selected',
  
  // Video interactions
  VIDEO_PLAY: 'video_play',
  VIDEO_PAUSE: 'video_pause',
  VIDEO_COMPLETE: 'video_complete',
  
  // CTAs
  GENERATE_PREVIEW_CLICKED: 'generate_preview_clicked',
  GENERATE_PREVIEW_STARTED: 'generate_preview_started',
  GENERATE_PREVIEW_COMPLETED: 'generate_preview_completed',
  BOOKING_CLICKED: 'booking_clicked',
  DEPLOY_CLICKED: 'deploy_clicked',
  
  // Lead capture
  LEAD_FORM_STARTED: 'lead_form_started',
  LEAD_FORM_SUBMITTED: 'lead_form_submitted',
  LEAD_FORM_ABANDONED: 'lead_form_abandoned',
  
  // Navigation
  FAQ_EXPANDED: 'faq_expanded',
  SECTION_VIEWED: 'section_viewed',
  CTA_HOVER: 'cta_hover',
} as const

export type MarketingEventName = typeof MARKETING_EVENTS[keyof typeof MARKETING_EVENTS]

// ─── Session ID ──────────────────────────────────────────────

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

function getSessionId(): string {
  const key = 'xtx_session_id'
  let sessionId = sessionStorage.getItem(key)
  
  if (!sessionId) {
    sessionId = generateSessionId()
    sessionStorage.setItem(key, sessionId)
  }
  
  return sessionId
}

// ─── Event Tracker Class ─────────────────────────────────────

class EventTracker {
  private config: Required<EventTrackerConfig>
  private buffer: TrackingEvent[] = []
  
  constructor(config: EventTrackerConfig = {}) {
    this.config = {
      debug: config.debug ?? (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')),
      storageKey: config.storageKey ?? 'xtx_event_buffer',
      maxBufferSize: config.maxBufferSize ?? 100,
      onEvent: config.onEvent ?? (() => {}),
    }
    
    this.loadBuffer()
  }
  
  /**
   * Track a marketing event
   */
  track(
    eventName: MarketingEventName | string,
    properties: Record<string, unknown> = {}
  ): void {
    const event: TrackingEvent = {
      eventName,
      properties: {
        ...properties,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      },
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
    }
    
    // Debug logging
    if (this.config.debug) {
      console.log('[EventTracker]', eventName, properties)
    }
    
    // Buffer event
    this.buffer.push(event)
    if (this.buffer.length > this.config.maxBufferSize) {
      this.buffer = this.buffer.slice(-this.config.maxBufferSize)
    }
    this.saveBuffer()
    
    // Custom handler (for production analytics)
    this.config.onEvent(event)
  }
  
  /**
   * Track page view
   */
  pageView(pageName: string, properties: Record<string, unknown> = {}): void {
    this.track(MARKETING_EVENTS.PAGE_VIEW, { pageName, ...properties })
  }
  
  /**
   * Track CTA click with offer context
   */
  trackCta(ctaType: 'generate' | 'booking' | 'deploy', offerId?: string): void {
    const eventMap = {
      generate: MARKETING_EVENTS.GENERATE_PREVIEW_CLICKED,
      booking: MARKETING_EVENTS.BOOKING_CLICKED,
      deploy: MARKETING_EVENTS.DEPLOY_CLICKED,
    }
    this.track(eventMap[ctaType], { offerId })
  }
  
  /**
   * Get all buffered events
   */
  getEvents(): TrackingEvent[] {
    return [...this.buffer]
  }
  
  /**
   * Get events for current session
   */
  getSessionEvents(): TrackingEvent[] {
    const sessionId = getSessionId()
    return this.buffer.filter(e => e.sessionId === sessionId)
  }
  
  /**
   * Clear event buffer
   */
  clearBuffer(): void {
    this.buffer = []
    this.saveBuffer()
  }
  
  /**
   * Export events as JSON
   */
  exportEvents(): string {
    return JSON.stringify(this.buffer, null, 2)
  }
  
  private loadBuffer(): void {
    if (typeof localStorage === 'undefined') return
    
    try {
      const stored = localStorage.getItem(this.config.storageKey)
      if (stored) {
        this.buffer = JSON.parse(stored)
      }
    } catch {
      this.buffer = []
    }
  }
  
  private saveBuffer(): void {
    if (typeof localStorage === 'undefined') return
    
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(this.buffer))
    } catch {
      // Storage full or unavailable
    }
  }
}

// ─── Singleton Instance ──────────────────────────────────────

let trackerInstance: EventTracker | null = null

export function getEventTracker(config?: EventTrackerConfig): EventTracker {
  if (!trackerInstance) {
    trackerInstance = new EventTracker(config)
  }
  return trackerInstance
}

// ─── Convenience Exports ─────────────────────────────────────

export function track(
  eventName: MarketingEventName | string,
  properties?: Record<string, unknown>
): void {
  getEventTracker().track(eventName, properties)
}

export function trackPageView(pageName: string, properties?: Record<string, unknown>): void {
  getEventTracker().pageView(pageName, properties)
}

export function trackCta(ctaType: 'generate' | 'booking' | 'deploy', offerId?: string): void {
  getEventTracker().trackCta(ctaType, offerId)
}

// ─── Debug Panel Data ────────────────────────────────────────

export function getDebugData(): { events: TrackingEvent[]; sessionId: string } {
  return {
    events: getEventTracker().getSessionEvents(),
    sessionId: getSessionId(),
  }
}
