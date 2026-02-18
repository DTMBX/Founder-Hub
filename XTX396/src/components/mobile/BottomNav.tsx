/**
 * BottomNav — Mobile Navigation Component
 *
 * Thumb-first navigation for mobile founder mode:
 * - Fixed to bottom of screen
 * - Safe area insets for iOS
 * - Badge support for notifications
 * - Active state indicators
 */

import React, { useState, useCallback, type ReactNode } from 'react'
import {
  Home,
  Users,
  FolderOpen,
  CreditCard,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────

export interface NavItem {
  id: string
  label: string
  icon: ReactNode
  href?: string
  badge?: number | string
  onClick?: () => void
}

export interface BottomNavProps {
  activeId?: string
  onNavigate?: (id: string) => void
  items?: NavItem[]
  className?: string
  showLabels?: boolean
}

// ─── Default Nav Items ─────────────────────────────────────

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: <Home className="h-5 w-5" /> },
  { id: 'leads', label: 'Leads', icon: <Users className="h-5 w-5" /> },
  { id: 'projects', label: 'Projects', icon: <FolderOpen className="h-5 w-5" /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard className="h-5 w-5" /> },
]

// ─── Component ─────────────────────────────────────────────

export function BottomNav({
  activeId = 'home',
  onNavigate,
  items = DEFAULT_NAV_ITEMS,
  className,
  showLabels = true,
}: BottomNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleNavClick = useCallback(
    (item: NavItem) => {
      item.onClick?.()
      onNavigate?.(item.id)

      if (item.href) {
        // Handle navigation - could be React Router or native
        window.history.pushState({}, '', item.href)
      }
    },
    [onNavigate]
  )

  return (
    <>
      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      {/* Bottom Navigation Bar */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800',
          'pb-[env(safe-area-inset-bottom)]',
          'md:hidden', // Hide on desktop
          className
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around px-2 h-16">
          {items.slice(0, 4).map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activeId === item.id}
              showLabel={showLabels}
              onClick={() => handleNavClick(item)}
            />
          ))}

          {/* More menu if more than 4 items */}
          {items.length > 4 && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 rounded-xl',
                'transition-all duration-200',
                menuOpen
                  ? 'text-amber-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
              aria-expanded={menuOpen}
              aria-label="More options"
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              {showLabels && (
                <span className="text-[10px] font-medium">More</span>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* Overflow Menu */}
      {menuOpen && items.length > 4 && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute bottom-20 left-4 right-4 bg-zinc-800 rounded-xl p-2 pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            {items.slice(4).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  handleNavClick(item)
                  setMenuOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg',
                  'text-left transition-colors',
                  activeId === item.id
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'text-zinc-300 hover:bg-zinc-700'
                )}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Nav Button ────────────────────────────────────────────

interface NavButtonProps {
  item: NavItem
  isActive: boolean
  showLabel: boolean
  onClick: () => void
}

function NavButton({ item, isActive, showLabel, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl min-w-[60px]',
        'transition-all duration-200 active:scale-95',
        isActive
          ? 'text-amber-500'
          : 'text-zinc-400 hover:text-zinc-200'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Badge */}
      {item.badge !== undefined && (
        <span
          className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center
                     bg-red-500 text-white text-[10px] font-bold rounded-full px-1"
        >
          {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
        </span>
      )}

      {/* Icon */}
      <span
        className={cn(
          'transition-transform duration-200',
          isActive && 'scale-110'
        )}
      >
        {item.icon}
      </span>

      {/* Label */}
      {showLabel && (
        <span
          className={cn(
            'text-[10px] font-medium transition-opacity',
            isActive ? 'opacity-100' : 'opacity-80'
          )}
        >
          {item.label}
        </span>
      )}

      {/* Active indicator */}
      {isActive && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full" />
      )}
    </button>
  )
}

export default BottomNav
