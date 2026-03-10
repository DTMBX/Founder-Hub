import React, { useState, useEffect, useCallback } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'

export interface CommandPaletteItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; weight?: string }>
  category: string
}

interface CommandPaletteProps {
  items: CommandPaletteItem[]
  categories: string[]
  onSelect: (tabId: string) => void
}

export default function CommandPalette({ items, categories, onSelect }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = useCallback((tabId: string) => {
    setOpen(false)
    onSelect(tabId)
  }, [onSelect])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search modules..." />
      <CommandList>
        <CommandEmpty>No modules found.</CommandEmpty>
        {categories.map((category, idx) => {
          const categoryItems = items.filter(item => item.category === category)
          if (categoryItems.length === 0) return null
          return (
            <React.Fragment key={category}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={category}>
                {categoryItems.map(item => {
                  const Icon = item.icon
                  return (
                    <CommandItem
                      key={item.id}
                      value={`${item.label} ${item.category}`}
                      onSelect={() => handleSelect(item.id)}
                    >
                      <Icon className="mr-2 h-4 w-4 text-muted-foreground" weight="regular" />
                      <span>{item.label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </React.Fragment>
          )
        })}
      </CommandList>
    </CommandDialog>
  )
}
