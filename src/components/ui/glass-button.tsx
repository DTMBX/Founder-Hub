import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const glassButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        glass: 'bg-background/10 backdrop-blur-md border border-border/40 hover:bg-background/20 hover:border-border/60 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md',
        glassPrimary: 'bg-primary/20 backdrop-blur-md border border-primary/40 text-foreground hover:bg-primary/30 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0',
        glassAccent: 'bg-accent/20 backdrop-blur-md border border-accent/40 text-foreground hover:bg-accent/30 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-0.5 active:translate-y-0',
        glassGhost: 'backdrop-blur-sm hover:bg-background/10 hover:backdrop-blur-md',
        glassShimmer: 'bg-background/10 backdrop-blur-md border border-border/40 hover:bg-background/20 hover:border-border/60 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 animate-shimmer',
        solid: 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        icon: 'h-10 w-10',
      },
      intensity: {
        low: '',
        medium: '',
        high: 'backdrop-blur-xl',
      },
    },
    defaultVariants: {
      variant: 'glass',
      size: 'default',
      intensity: 'medium',
    },
  }
)

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  asChild?: boolean
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, intensity, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(glassButtonVariants({ variant, size, intensity, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
GlassButton.displayName = 'GlassButton'

export { GlassButton, glassButtonVariants }
