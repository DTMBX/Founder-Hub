/**
 * QuickActionsFAB — Floating Action Button with Quick Actions
 *
 * Thumb-friendly quick actions for mobile founder mode:
 * - Expandable FAB with multiple actions
 * - Haptic feedback
 * - Backdrop blur on expand
 * - Keyboard accessible
 */

import React, { useState, useCallback, type ReactNode } from 'react'
import {
  Plus,
  X,
  UserPlus,
  FolderPlus,
  FileText,
  Mic,
  Phone,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────

export interface QuickAction {
  id: string
  label: string
  icon: ReactNode
  color?: string
  onClick: () => void
}

export interface QuickActionsFABProps {
  actions?: QuickAction[]
  onNewLead?: () => void
  onNewProject?: () => void
  onNewNote?: () => void
  onVoiceNote?: () => void
  onQuickCall?: () => void
  className?: string
  position?: 'bottom-right' | 'bottom-center'
}

// ─── Default Actions ───────────────────────────────────────

const createDefaultActions = (props: QuickActionsFABProps): QuickAction[] => [
  {
    id: 'new-lead',
    label: 'New Lead',
    icon: <UserPlus className="h-5 w-5" />,
    color: 'bg-emerald-500 hover:bg-emerald-600',
    onClick: props.onNewLead ?? (() => {}),
  },
  {
    id: 'new-project',
    label: 'New Project',
    icon: <FolderPlus className="h-5 w-5" />,
    color: 'bg-blue-500 hover:bg-blue-600',
    onClick: props.onNewProject ?? (() => {}),
  },
  {
    id: 'new-note',
    label: 'Quick Note',
    icon: <FileText className="h-5 w-5" />,
    color: 'bg-purple-500 hover:bg-purple-600',
    onClick: props.onNewNote ?? (() => {}),
  },
  {
    id: 'voice-note',
    label: 'Voice Note',
    icon: <Mic className="h-5 w-5" />,
    color: 'bg-amber-500 hover:bg-amber-600',
    onClick: props.onVoiceNote ?? (() => {}),
  },
  {
    id: 'quick-call',
    label: 'Quick Call',
    icon: <Phone className="h-5 w-5" />,
    color: 'bg-green-500 hover:bg-green-600',
    onClick: props.onQuickCall ?? (() => {}),
  },
]

// ─── Component ─────────────────────────────────────────────

export function QuickActionsFAB(props: QuickActionsFABProps) {
  const {
    actions: customActions,
    className,
    position = 'bottom-right',
  } = props

  const [isOpen, setIsOpen] = useState(false)
  const actions = customActions ?? createDefaultActions(props)

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)

    // Haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [])

  const handleAction = useCallback(
    (action: QuickAction) => {
      action.onClick()
      setIsOpen(false)

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10])
      }
    },
    []
  )

  const positionClasses =
    position === 'bottom-center'
      ? 'bottom-20 left-1/2 -translate-x-1/2'
      : 'bottom-20 right-4'

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* FAB Container */}
      <div
        className={cn(
          'fixed z-50 md:hidden',
          positionClasses,
          'pb-[env(safe-area-inset-bottom)]',
          className
        )}
      >
        {/* Action Items */}
        <div
          className={cn(
            'flex flex-col-reverse items-center gap-3 mb-3',
            'transition-all duration-300 origin-bottom',
            isOpen
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-75 translate-y-4 pointer-events-none'
          )}
        >
          {actions.map((action, index) => (
            <div
              key={action.id}
              className="flex items-center gap-3"
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              }}
            >
              {/* Label */}
              <span
                className={cn(
                  'px-3 py-1.5 bg-zinc-800 text-white text-sm font-medium rounded-lg',
                  'shadow-lg whitespace-nowrap',
                  'transition-all duration-200',
                  isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                )}
                style={{
                  transitionDelay: isOpen ? `${index * 50 + 100}ms` : '0ms',
                }}
              >
                {action.label}
              </span>

              {/* Action Button */}
              <button
                onClick={() => handleAction(action)}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center',
                  'text-white shadow-lg',
                  'transition-all duration-200 active:scale-95',
                  action.color ?? 'bg-zinc-700 hover:bg-zinc-600'
                )}
                aria-label={action.label}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>

        {/* Main FAB Button */}
        <button
          onClick={toggle}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center',
            'bg-amber-500 hover:bg-amber-600 text-black',
            'shadow-xl shadow-amber-500/30',
            'transition-all duration-300 active:scale-95',
            isOpen && 'rotate-45 bg-zinc-700 hover:bg-zinc-600 text-white shadow-zinc-900/30'
          )}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </button>
      </div>
    </>
  )
}

export default QuickActionsFAB
