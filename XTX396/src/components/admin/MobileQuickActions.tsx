import { useState } from 'react'
import { 
  Plus, Eye, CloudArrowUp, PencilSimple, 
  X, House, Gear, ArrowsClockwise
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface QuickAction {
  id: string
  label: string
  icon: any
  onClick: () => void
  variant?: 'default' | 'primary'
}

interface MobileQuickActionsProps {
  onNavigate: (tabId: string) => void
  onPublish: () => void
  onPreview: () => void
  isPublishing?: boolean
  canPublish?: boolean
}

/**
 * Mobile Quick Actions Bar
 * 
 * Fixed bottom navigation for mobile founder mode.
 * Provides one-handed access to core actions within 2 taps.
 * 
 * Core Actions:
 * 1. Content - Navigate to content editor
 * 2. Preview - Open site preview
 * 3. Publish - Publish changes (with confirmation)
 * 4. Settings - Quick settings access
 */
export default function MobileQuickActions({ 
  onNavigate, 
  onPublish, 
  onPreview,
  isPublishing = false,
  canPublish = true
}: MobileQuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Primary quick actions (always visible)
  const primaryActions: QuickAction[] = [
    {
      id: 'content',
      label: 'Edit',
      icon: PencilSimple,
      onClick: () => onNavigate('content')
    },
    {
      id: 'preview',
      label: 'Preview',
      icon: Eye,
      onClick: onPreview
    },
    {
      id: 'publish',
      label: isPublishing ? 'Publishing...' : 'Publish',
      icon: isPublishing ? ArrowsClockwise : CloudArrowUp,
      onClick: () => {
        if (!canPublish) {
          toast.error('You do not have permission to publish')
          return
        }
        onPublish()
      },
      variant: 'primary'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Gear,
      onClick: () => onNavigate('settings')
    }
  ]
  
  // Secondary actions (shown when expanded)
  const secondaryActions: QuickAction[] = [
    {
      id: 'home',
      label: 'Home',
      icon: House,
      onClick: () => onNavigate('content')
    },
    {
      id: 'sites',
      label: 'Sites',
      icon: Plus,
      onClick: () => onNavigate('sites')
    }
  ]
  
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-50">
      {/* Expanded overlay */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      {/* Secondary actions (expanded) */}
      {isExpanded && (
        <div className="relative bg-card border-t border-border px-4 py-3">
          <div className="flex justify-around max-w-sm mx-auto">
            {secondaryActions.map(action => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    action.onClick()
                    setIsExpanded(false)
                  }}
                  className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon className="h-5 w-5" weight="regular" />
                  <span className="text-[10px] font-medium">{action.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Primary action bar */}
      <nav className="relative bg-card border-t border-border px-2 pb-safe">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {primaryActions.map(action => {
            const Icon = action.icon
            const isPrimary = action.variant === 'primary'
            
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.id === 'publish' && isPublishing}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-all min-w-[64px]',
                  isPrimary
                    ? 'text-primary-foreground bg-primary shadow-lg -mt-4 scale-110'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/10',
                  action.id === 'publish' && isPublishing && 'opacity-50'
                )}
              >
                <Icon 
                  className={cn('h-5 w-5', action.id === 'publish' && isPublishing && 'animate-spin')} 
                  weight={isPrimary ? 'fill' : 'regular'} 
                />
                <span className={cn(
                  'text-[10px] font-medium',
                  isPrimary && 'text-primary-foreground'
                )}>
                  {action.label}
                </span>
              </button>
            )
          })}
          
          {/* Expand toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-colors',
              isExpanded 
                ? 'text-foreground bg-accent' 
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
            )}
          >
            {isExpanded ? (
              <X className="h-5 w-5" weight="regular" />
            ) : (
              <Plus className="h-5 w-5" weight="regular" />
            )}
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
