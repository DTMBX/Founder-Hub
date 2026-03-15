/**
 * SearchModal — Cmd+K / Ctrl+K command palette.
 *
 * Uses cmdk for the command palette UI with built-in fuzzy search.
 * Groups results by category, keyboard-navigable, ARIA combobox pattern.
 */

import { useCallback, useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { SEARCH_INDEX, CATEGORY_LABELS, type SearchItem } from '@/lib/search-index'
import {
  MagnifyingGlass,
  FileText,
  Folder,
  Article,
  Lightning,
  ArrowElbowDownLeft,
} from '@phosphor-icons/react'

const CATEGORY_ICONS: Record<SearchItem['category'], typeof FileText> = {
  page: FileText,
  project: Folder,
  blog: Article,
  action: Lightning,
}

export function SearchModal() {
  const [open, setOpen] = useState(false)

  // Global keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleSelect = useCallback((href: string) => {
    setOpen(false)
    if (href.startsWith('#')) {
      window.location.hash = href.slice(1)
    } else {
      window.location.hash = ''
    }
  }, [])

  // Group items by category
  const grouped = SEARCH_INDEX.reduce<Record<string, SearchItem[]>>((acc, item) => {
    const key = item.category
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Search">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command palette */}
      <div className="relative mx-auto mt-[15vh] w-full max-w-xl px-4">
        <Command
          className="rounded-2xl border border-border/50 bg-background shadow-2xl overflow-hidden"
          label="Search"
        >
          {/* Input */}
          <div className="flex items-center gap-3 border-b border-border/30 px-4">
            <MagnifyingGlass size={18} className="text-muted-foreground shrink-0" />
            <Command.Input
              placeholder="Search pages, projects, blog posts..."
              className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground/50"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border/40 bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {Object.entries(grouped).map(([category, items]) => {
              const label = CATEGORY_LABELS[category as SearchItem['category']]
              return (
                <Command.Group key={category} heading={label} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/60">
                  {items.map(item => {
                    const Icon = CATEGORY_ICONS[item.category]
                    return (
                      <Command.Item
                        key={item.id}
                        value={[item.label, item.description, ...(item.keywords || [])].join(' ')}
                        onSelect={() => handleSelect(item.href)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground transition-colors"
                      >
                        <Icon size={16} weight="duotone" className="text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                        </div>
                        <ArrowElbowDownLeft size={12} className="text-muted-foreground/40 shrink-0 opacity-0 group-data-[selected=true]:opacity-100" />
                      </Command.Item>
                    )
                  })}
                </Command.Group>
              )
            })}
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/30 px-4 py-2 text-[10px] text-muted-foreground/50">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border/30 bg-muted/30 px-1 py-0.5 font-mono">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border/30 bg-muted/30 px-1 py-0.5 font-mono">↵</kbd>
                Open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border/30 bg-muted/30 px-1 py-0.5 font-mono">esc</kbd>
                Close
              </span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  )
}
