import { cn } from '@/lib/utils'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: 'low' | 'medium' | 'high'
  glow?: boolean
  children: React.ReactNode
}

export function GlassCard({ 
  intensity = 'medium', 
  glow = false,
  className, 
  children, 
  ...props 
}: GlassCardProps) {
  const intensityClasses = {
    low: 'bg-card/30 backdrop-blur-sm',
    medium: 'bg-card/40 backdrop-blur-md',
    high: 'bg-card/50 backdrop-blur-xl',
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border/40 shadow-lg transition-all duration-300',
        intensityClasses[intensity],
        glow && 'glass-glow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
