/**
 * CommandPalette.tsx — Ctrl+K command palette for the Site Studio.
 *
 * Renders a modal overlay with fuzzy-filtered command list.
 * All commands route through typed handlers that proxy to existing
 * canonical hooks (structure, inspector, collection, snapshot, audit, bulk).
 *
 * No freeform text execution. No eval. No stringly-typed dispatch.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { filterCommands, type CommandDefinition } from '@/lib/command-registry'
import { useSectionStructure } from '@/lib/use-section-structure'
import { useStudioSelection, clearStudioSelection } from '@/lib/use-studio-selection'
import { useStudioPermissions, getCommandRequiredAction, getStudioDenialReason } from '@/lib/studio-permissions'
import { downloadSnapshot, readSnapshotFile, importSnapshot } from '@/lib/snapshot-system'
import { runValidationAudit, type AuditReport } from '@/lib/validation-audit'
import {
  bulkEnableAllSections,
  bulkDisableNonEssential,
  bulkSortSectionsAlpha,
  bulkNormalizeProjectTitles,
} from '@/lib/bulk-operations'
import { isAIAvailable } from '@/lib/ai-transform'
import { cn } from '@/lib/utils'
import {
  MagnifyingGlass, Command as CommandIcon, ArrowUp, ArrowDown, KeyReturn,
  Warning, Lock,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  onAuditReport?: (report: AuditReport) => void
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CommandPalette({ open, onClose, onAuditReport }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selection = useStudioSelection()
  const structure = useSectionStructure()
  const perms = useStudioPermissions()

  const filtered = filterCommands(query)

  // Filter out commands that require context we don't have
  const available = filtered.filter(cmd => {
    if (cmd.requiresSelection && !selection.sectionId) return false
    if (cmd.category === 'ai' && !isAIAvailable()) return false
    return true
  })

  // Separate allowed vs denied commands
  const allowed = available.filter(cmd => perms.canExecuteCommand(cmd.id))
  const denied = available.filter(cmd => !perms.canExecuteCommand(cmd.id))

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Clamp selectedIndex when list changes
  useEffect(() => {
    if (selectedIndex >= allowed.length) {
      setSelectedIndex(Math.max(0, allowed.length - 1))
    }
  }, [allowed.length, selectedIndex])

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const item = list.children[selectedIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // ── Command Execution ───────────────────────────────────────────────────

  const executeCommand = useCallback(async (cmd: CommandDefinition) => {
    onClose()

    switch (cmd.id) {
      // ── Sections ──
      case 'section-add': {
        const types = structure.addableTypes
        if (types.length === 0) {
          toast.info('No section types available to add')
          return
        }
        // Add the first available type (palette shows this as a quick action)
        const err = structure.addSection(types[0].type)
        if (err) toast.error(err.message)
        else toast.success(`Added "${types[0].label}" section`)
        return
      }

      case 'section-remove': {
        if (!selection.sectionId) return
        const err = structure.removeSection(selection.sectionId)
        if (err) toast.error(err.message)
        else toast.success('Section removed')
        return
      }

      case 'section-duplicate': {
        if (!selection.sectionId) return
        const err = structure.duplicateSection(selection.sectionId)
        if (err) toast.error(err.message)
        else toast.success('Section duplicated')
        return
      }

      case 'section-move-top': {
        if (!selection.sectionId) return
        const sections = structure.orderedSections
        const idx = sections.findIndex(s => s.id === selection.sectionId)
        if (idx <= 0) return
        // Position 1 = first after hero (hero is always at 0)
        const targetIdx = sections[0]?.type === 'hero' ? 1 : 0
        if (idx === targetIdx) return
        const err = structure.moveSection(idx, targetIdx)
        if (err) toast.error(err.message)
        else toast.success('Moved section to top')
        return
      }

      case 'section-move-bottom': {
        if (!selection.sectionId) return
        const sections = structure.orderedSections
        const idx = sections.findIndex(s => s.id === selection.sectionId)
        if (idx < 0 || idx === sections.length - 1) return
        const err = structure.moveSection(idx, sections.length - 1)
        if (err) toast.error(err.message)
        else toast.success('Moved section to bottom')
        return
      }

      // ── Collections ──
      case 'collection-add-item': {
        // Collection add item is handled inline by CollectionPanel
        toast.info('Use the Items panel to add collection items')
        return
      }

      // ── Snapshot ──
      case 'snapshot-export': {
        try {
          await downloadSnapshot()
          toast.success('Snapshot exported')
        } catch (e) {
          toast.error(`Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
        }
        return
      }

      case 'snapshot-import': {
        fileInputRef.current?.click()
        return
      }

      // ── Audit ──
      case 'audit-run': {
        try {
          const report = await runValidationAudit()
          onAuditReport?.(report)
          if (report.failCount === 0) {
            toast.success(`Audit passed: ${report.passCount}/${report.totalKeys} keys valid`)
          } else {
            toast.error(`Audit found ${report.failCount} error(s)`)
          }
        } catch (e) {
          toast.error(`Audit failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
        }
        return
      }

      // ── Navigation ──
      case 'nav-clear-selection': {
        clearStudioSelection()
        toast.info('Selection cleared')
        return
      }

      // ── Bulk Operations ──
      case 'bulk-enable-all-sections': {
        const result = await bulkEnableAllSections()
        if (result.success) toast.success(result.message)
        else toast.error(result.message)
        return
      }

      case 'bulk-disable-non-essential': {
        const result = await bulkDisableNonEssential()
        if (result.success) toast.success(result.message)
        else toast.error(result.message)
        return
      }

      case 'bulk-sort-sections-alpha': {
        const result = await bulkSortSectionsAlpha()
        if (result.success) toast.success(result.message)
        else toast.error(result.message)
        return
      }

      case 'bulk-normalize-project-titles': {
        const result = await bulkNormalizeProjectTitles()
        if (result.success) toast.success(result.message)
        else toast.error(result.message)
        return
      }

      // ── AI (stubs) ──
      case 'ai-improve-description':
      case 'ai-suggest-tags': {
        toast.info('AI backend not connected. Proposals will be available when AI infrastructure is configured.')
        return
      }

      default:
        toast.info(`Command "${cmd.id}" not yet implemented`)
    }
  }, [onClose, structure, selection, onAuditReport])

  // ── File Import Handler ─────────────────────────────────────────────────

  const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so same file can be re-selected
    e.target.value = ''

    try {
      const parsed = await readSnapshotFile(file)
      const result = await importSnapshot(parsed)
      if (result.valid) {
        toast.success('Snapshot restored successfully')
      } else {
        const errors = result.keys.filter(k => !k.valid)
        toast.error(`Import failed: ${errors.map(k => `${k.key}: ${k.error}`).join('; ')}`)
      }
    } catch (err) {
      toast.error(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  // ── Keyboard Navigation ─────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, allowed.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (allowed[selectedIndex]) {
          executeCommand(allowed[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [allowed, selectedIndex, executeCommand, onClose])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[10010] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[10011] w-full max-w-md">
        <div className="rounded-xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
            <MagnifyingGlass className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
              onKeyDown={handleKeyDown}
              placeholder="Type a command…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="text-[10px] text-muted-foreground/50 bg-muted/30 px-1.5 py-0.5 rounded border border-border/30">
              Esc
            </kbd>
          </div>

          {/* Command list */}
          <div ref={listRef} className="max-h-[320px] overflow-y-auto py-1">
            {allowed.length === 0 && denied.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-6 text-xs text-muted-foreground justify-center">
                <Warning className="h-3.5 w-3.5" />
                No matching commands
              </div>
            )}

            {allowed.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => executeCommand(cmd)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  i === selectedIndex
                    ? 'bg-primary/10 text-foreground'
                    : 'text-muted-foreground hover:bg-accent/5 hover:text-foreground'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{cmd.label}</div>
                  <div className="text-[10px] text-muted-foreground/60 truncate">{cmd.description}</div>
                </div>
                <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider shrink-0">
                  {cmd.category}
                </span>
                {cmd.shortcut && (
                  <kbd className="text-[9px] text-muted-foreground/40 bg-muted/20 px-1 py-0.5 rounded shrink-0">
                    {cmd.shortcut}
                  </kbd>
                )}
              </button>
            ))}

            {/* Denied commands shown grayed with lock */}
            {denied.length > 0 && (
              <>
                <div className="px-4 py-1 mt-1 border-t border-border/30">
                  <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">Requires higher role</span>
                </div>
                {denied.map(cmd => (
                  <div
                    key={cmd.id}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left opacity-40 cursor-not-allowed"
                    title={getStudioDenialReason(getCommandRequiredAction(cmd.id))}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{cmd.label}</div>
                      <div className="text-[10px] text-muted-foreground/60 truncate">{cmd.description}</div>
                    </div>
                    <Lock className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center gap-3 px-4 py-2 border-t border-border/30 text-[10px] text-muted-foreground/40">
            <span className="flex items-center gap-1">
              <ArrowUp className="h-2.5 w-2.5" />
              <ArrowDown className="h-2.5 w-2.5" />
              navigate
            </span>
            <span className="flex items-center gap-1">
              <KeyReturn className="h-2.5 w-2.5" />
              execute
            </span>
            <span className="flex items-center gap-1">
              <CommandIcon className="h-2.5 w-2.5" />K open
            </span>
          </div>
        </div>
      </div>

      {/* Hidden file input for snapshot import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileImport}
      />
    </>
  )
}
