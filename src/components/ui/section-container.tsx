import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '5xl' | '6xl' | '7xl' | 'full'

const maxWidthClasses: Record<MaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
}

interface SectionContainerProps extends ComponentProps<'section'> {
  /** Max width of inner container */
  maxWidth?: MaxWidth
  /** Whether to include vertical padding */
  padded?: boolean
  /** Background gradient style */
  gradient?: boolean
  /** Top separator line */
  separator?: boolean
}

export function SectionContainer({
  maxWidth = '5xl',
  padded = true,
  gradient = true,
  separator = true,
  className,
  children,
  ...props
}: SectionContainerProps) {
  return (
    <section
      className={cn(
        'relative px-4 sm:px-6 lg:px-8 overflow-hidden',
        padded && 'py-16 sm:py-20 lg:py-28',
        className
      )}
      {...props}
    >
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/10 to-background -z-10" />
      )}
      {separator && <div className="section-separator mb-16" />}
      <div className={cn('container mx-auto', maxWidthClasses[maxWidth])}>
        {children}
      </div>
    </section>
  )
}
