import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export interface SidebarNavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; weight?: string }>
  category: string
}

interface SidebarNavProps {
  items: SidebarNavItem[]
  categories: string[]
  activeTab: string
  collapsed?: boolean
  onSelect: (tabId: string) => void
}

export default function SidebarNav({ items, categories, activeTab, collapsed = false, onSelect }: SidebarNavProps) {
  return (
    <ScrollArea className="flex-1 py-2">
      <div className="px-2 space-y-4">
        {categories.map(category => {
          const categoryItems = items.filter(item => item.category === category)
          if (categoryItems.length === 0) return null
          return (
            <div key={category}>
              {!collapsed && (
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-3 mb-1">
                  {category}
                </p>
              )}
              <div className="space-y-0.5">
                {categoryItems.map(item => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelect(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-lg transition-all duration-150 text-sm',
                        collapsed ? 'justify-center p-2.5' : 'px-3 py-2',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" weight={isActive ? 'fill' : 'regular'} />
                      {!collapsed && <span className="truncate font-medium">{item.label}</span>}
                    </button>
                  )
                })}
              </div>
              {!collapsed && category !== categories[categories.length - 1] && (
                <Separator className="mt-3 opacity-50" />
              )}
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
