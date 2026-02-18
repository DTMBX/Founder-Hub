/**
 * useLazyVideo Hook
 *
 * Intersection observer-based lazy loading for video elements.
 * Videos only start loading when they enter the viewport.
 */

import { useRef, useState, useEffect, useCallback } from 'react'

export interface UseLazyVideoOptions {
  /** Threshold for intersection (0-1) */
  threshold?: number
  /** Root margin for early loading */
  rootMargin?: string
  /** Whether to autoplay when visible */
  autoplayOnVisible?: boolean
  /** Whether to pause when not visible */
  pauseOnHidden?: boolean
}

export interface UseLazyVideoResult {
  /** Ref to attach to video element */
  videoRef: React.RefObject<HTMLVideoElement | null>
  /** Whether the video should be loaded */
  shouldLoad: boolean
  /** Whether the video is currently visible */
  isVisible: boolean
  /** Manually trigger load */
  triggerLoad: () => void
}

export function useLazyVideo(options: UseLazyVideoOptions = {}): UseLazyVideoResult {
  const {
    threshold = 0.1,
    rootMargin = '200px',
    autoplayOnVisible = false,
    pauseOnHidden = true,
  } = options
  
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        const visible = entry.isIntersecting
        
        setIsVisible(visible)
        
        if (visible && !shouldLoad) {
          setShouldLoad(true)
        }
        
        // Handle autoplay/pause
        if (video && shouldLoad) {
          if (visible && autoplayOnVisible) {
            video.play().catch(() => {
              // Autoplay blocked, ignore
            })
          } else if (!visible && pauseOnHidden) {
            video.pause()
          }
        }
      },
      { threshold, rootMargin }
    )
    
    observer.observe(video)
    
    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, autoplayOnVisible, pauseOnHidden, shouldLoad])
  
  const triggerLoad = useCallback(() => {
    setShouldLoad(true)
  }, [])
  
  return {
    videoRef,
    shouldLoad,
    isVisible,
    triggerLoad,
  }
}

/**
 * usePrefetchOnHover Hook
 *
 * Prefetch assets when user hovers over an element.
 */

export interface UsePrefetchOnHoverResult {
  /** Ref to attach to the hoverable element */
  hoverRef: React.RefObject<HTMLElement | null>
  /** Whether assets have been prefetched */
  isPrefetched: boolean
}

export function usePrefetchOnHover(urls: string[]): UsePrefetchOnHoverResult {
  const hoverRef = useRef<HTMLElement | null>(null)
  const [isPrefetched, setIsPrefetched] = useState(false)
  
  useEffect(() => {
    const element = hoverRef.current
    if (!element || urls.length === 0) return
    
    const handleMouseEnter = () => {
      if (isPrefetched) return
      
      // Prefetch all URLs
      urls.forEach((url) => {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = url
        document.head.appendChild(link)
      })
      
      setIsPrefetched(true)
    }
    
    element.addEventListener('mouseenter', handleMouseEnter)
    
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [urls, isPrefetched])
  
  return {
    hoverRef,
    isPrefetched,
  }
}

/**
 * usePreviewMetas Hook
 *
 * Fetch preview metadata for multiple offers.
 */

import type { PreviewMeta } from '@/previews'

export interface UsePreviewMetasResult {
  /** Map of offerId to PreviewMeta */
  metas: Record<string, PreviewMeta | null>
  /** Whether loading is in progress */
  isLoading: boolean
  /** Error if any */
  error: string | null
  /** Refetch all metas */
  refetch: () => void
}

export function usePreviewMetas(
  offerIds: string[],
  basePath: string = '/previews'
): UsePreviewMetasResult {
  const [metas, setMetas] = useState<Record<string, PreviewMeta | null>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchMetas = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    const results: Record<string, PreviewMeta | null> = {}
    
    try {
      await Promise.all(
        offerIds.map(async (offerId) => {
          try {
            const res = await fetch(`${basePath}/${offerId}/meta.json`)
            if (res.ok) {
              results[offerId] = await res.json()
            } else {
              results[offerId] = null
            }
          } catch {
            results[offerId] = null
          }
        })
      )
      
      setMetas(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load previews')
    } finally {
      setIsLoading(false)
    }
  }, [offerIds, basePath])
  
  useEffect(() => {
    if (offerIds.length > 0) {
      fetchMetas()
    }
  }, [fetchMetas, offerIds.length])
  
  return {
    metas,
    isLoading,
    error,
    refetch: fetchMetas,
  }
}

/**
 * Helper: Get thumbnail URLs from metas
 */
export function getThumbnailUrls(
  metas: Record<string, PreviewMeta | null>,
  basePath: string = '/previews'
): string[] {
  return Object.entries(metas)
    .filter(([, meta]) => meta?.posterFilename)
    .map(([offerId, meta]) => `${basePath}/${offerId}/${meta!.posterFilename}`)
}

/**
 * Helper: Get scene thumbnail URLs from a single meta
 */
export function getSceneThumbnails(
  meta: PreviewMeta,
  offerId: string,
  basePath: string = '/previews'
): string[] {
  return meta.scenes
    .filter((scene) => scene.thumbnailFilename)
    .map((scene) => `${basePath}/${offerId}/${scene.thumbnailFilename}`)
}
