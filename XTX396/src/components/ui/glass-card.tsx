import { cn } from '@/lib/utils'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: 'low' | 'medium' | 'high'
  children: React.ReactNode
}

export function GlassCard({ 
  intensity = 'medium', 
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
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
