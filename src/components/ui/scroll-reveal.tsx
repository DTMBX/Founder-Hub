import { type ReactNode } from 'react'
import { useScrollReveal, revealStyle } from '@/hooks/use-scroll-reveal'

interface ScrollRevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function ScrollReveal({ children, delay = 0, className }: ScrollRevealProps) {
  const [ref, visible] = useScrollReveal<HTMLDivElement>(delay)

  return (
    <div ref={ref} style={revealStyle(visible)} className={className}>
      {children}
    </div>
  )
}
