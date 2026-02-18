/**
 * useTrackSection Hook
 *
 * Track section visibility for conversion funnel analytics.
 * Reports when a section enters the viewport.
 */

import { useRef, useEffect, useState } from 'react'
import { track, MARKETING_EVENTS } from '../event-tracker'

export interface UseTrackSectionOptions {
  /** Section name for tracking */
  sectionName: string
  /** Threshold for intersection (default: 0.5 = 50% visible) */
  threshold?: number
  /** Only track once per session */
  trackOnce?: boolean
  /** Additional properties to include in event */
  properties?: Record<string, unknown>
}

export interface UseTrackSectionResult {
  /** Ref to attach to the section element */
  sectionRef: React.RefObject<HTMLElement | null>
  /** Whether section has been viewed */
  hasBeenViewed: boolean
  /** Whether section is currently visible */
  isVisible: boolean
}

// Track which sections have been viewed this session
const viewedSections = new Set<string>()

export function useTrackSection(options: UseTrackSectionOptions): UseTrackSectionResult {
  const {
    sectionName,
    threshold = 0.5,
    trackOnce = true,
    properties = {},
  } = options
  
  const sectionRef = useRef<HTMLElement | null>(null)
  const [hasBeenViewed, setHasBeenViewed] = useState(viewedSections.has(sectionName))
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        const visible = entry.isIntersecting
        
        setIsVisible(visible)
        
        if (visible && (!trackOnce || !viewedSections.has(sectionName))) {
          viewedSections.add(sectionName)
          setHasBeenViewed(true)
          
          track(MARKETING_EVENTS.SECTION_VIEWED, {
            section: sectionName,
            ...properties,
          })
        }
      },
      { threshold }
    )
    
    observer.observe(section)
    
    return () => observer.disconnect()
  }, [sectionName, threshold, trackOnce, properties])
  
  return {
    sectionRef,
    hasBeenViewed,
    isVisible,
  }
}

/**
 * useTrackCTAHover Hook
 *
 * Track when user hovers over a CTA button.
 * Useful for understanding intent without clicks.
 */

export interface UseTrackCTAHoverOptions {
  /** CTA identifier */
  ctaId: string
  /** Additional properties */
  properties?: Record<string, unknown>
  /** Debounce time in ms (default: 500) */
  debounceMs?: number
}

export function useTrackCTAHover(options: UseTrackCTAHoverOptions) {
  const { ctaId, properties = {}, debounceMs = 500 } = options
  
  const buttonRef = useRef<HTMLElement | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trackedRef = useRef(false)
  
  useEffect(() => {
    const button = buttonRef.current
    if (!button) return
    
    const handleEnter = () => {
      if (trackedRef.current) return
      
      timeoutRef.current = setTimeout(() => {
        trackedRef.current = true
        track(MARKETING_EVENTS.CTA_HOVER, {
          ctaId,
          ...properties,
        })
      }, debounceMs)
    }
    
    const handleLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
    
    button.addEventListener('mouseenter', handleEnter)
    button.addEventListener('mouseleave', handleLeave)
    
    return () => {
      button.removeEventListener('mouseenter', handleEnter)
      button.removeEventListener('mouseleave', handleLeave)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [ctaId, properties, debounceMs])
  
  return buttonRef
}

/**
 * useScrollDepth Hook
 *
 * Track how far user scrolls down the page.
 * Reports at 25%, 50%, 75%, and 100% milestones.
 */

const scrollMilestones = new Set<number>()

export function useScrollDepth(pageName: string) {
  useEffect(() => {
    const checkScrollDepth = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      
      const milestones = [25, 50, 75, 100]
      
      milestones.forEach((milestone) => {
        const key = `${pageName}-${milestone}`
        if (scrollPercent >= milestone && !scrollMilestones.has(milestone)) {
          scrollMilestones.add(milestone)
          track('scroll_depth', {
            page: pageName,
            depth: milestone,
          })
        }
      })
    }
    
    window.addEventListener('scroll', checkScrollDepth, { passive: true })
    checkScrollDepth() // Initial check
    
    return () => {
      window.removeEventListener('scroll', checkScrollDepth)
    }
  }, [pageName])
}

/**
 * Clear all tracking state (useful for testing)
 */
export function clearTrackingState() {
  viewedSections.clear()
  scrollMilestones.clear()
}
