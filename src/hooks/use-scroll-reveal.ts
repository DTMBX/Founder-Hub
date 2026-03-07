import { useRef, useEffect, useState, type RefObject, type CSSProperties } from 'react'

/**
 * useScrollReveal — harmonized scroll animation hook
 * Shared timing: 600ms, spring easing, 0.15 threshold
 * Matches Evident scroll-reveal.js + Tillerstead animation-engine.js
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  delay = 0
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setVisible(true), delay)
          } else {
            setVisible(true)
          }
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return [ref, visible]
}

/** CSS style object for the reveal transition */
export function revealStyle(visible: boolean): CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(24px)',
    transition: 'opacity 600ms cubic-bezier(0.34,1.56,0.64,1), transform 600ms cubic-bezier(0.34,1.56,0.64,1)',
  }
}
