/**
 * DiffViewer.tsx — Deterministic inline diff display.
 *
 * Renders a flat list of field-level changes between two values.
 * Used by:
 *  - HistoryTimeline (expand entry to see before/after)
 *  - AiDraftProposal (enhanced review context)
 *  - Snapshot restore preview
 *
 * Pure display — no mutation, no side effects.
 */

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowRight, Plus, Minus, PencilSimple } from '@phosphor-icons/react'
import { computeDiff, formatDiffValue } from '@/lib/content-diff'
import type { FieldChange, DiffResult } from '@/lib/content-diff'
import { cn } from '@/lib/utils'

// ─── Props ──────────────────────────────────────────────────────────────────

interface DiffViewerProps {
  before: unknown
  after: unknown
  /** Optional max height before scroll (default: 300px) */
  maxHeight?: number
  /** Optional: compact mode hides unchanged fields */
  compact?: boolean
}

// ─── Change Row ─────────────────────────────────────────────────────────────

const KIND_CONFIG = {
  added: { icon: Plus, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Added' },
  removed: { icon: Minus, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Removed' },
  changed: { icon: PencilSimple, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Changed' },
  unchanged: { icon: ArrowRight, color: 'text-muted-foreground', bg: '', border: 'border-border/30', label: 'Unchanged' },
} as const

function ChangeRow({ change }: { change: FieldChange }) {
  const config = KIND_CONFIG[change.kind]
  const Icon = config.icon

  return (
    <div className={cn(
      'flex items-start gap-2 px-3 py-2 rounded-md text-xs border',
      config.bg, config.border,
    )}>
      <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', config.color)} weight="bold" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium text-foreground truncate">{change.label}</span>
          <Badge variant="outline" className={cn('text-[8px] px-1 py-0', config.color)}>
            {config.label}
          </Badge>
        </div>
        {change.kind === 'changed' && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="line-through opacity-60 truncate max-w-[45%]">
              {formatDiffValue(change.before)}
            </span>
            <ArrowRight className="h-3 w-3 shrink-0" />
            <span className={cn('truncate max-w-[45%]', config.color)}>
              {formatDiffValue(change.after)}
            </span>
          </div>
        )}
        {change.kind === 'added' && (
          <span className={cn('truncate block', config.color)}>
            {formatDiffValue(change.after)}
          </span>
        )}
        {change.kind === 'removed' && (
          <span className="line-through opacity-60 truncate block">
            {formatDiffValue(change.before)}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Summary Badge ──────────────────────────────────────────────────────────

function DiffSummary({ diff }: { diff: DiffResult }) {
  const added = diff.changes.filter(c => c.kind === 'added').length
  const removed = diff.changes.filter(c => c.kind === 'removed').length
  const changed = diff.changes.filter(c => c.kind === 'changed').length

  if (!diff.hasChanges) {
    return <span className="text-xs text-muted-foreground">No changes</span>
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {changed > 0 && (
        <span className="text-amber-400">{changed} modified</span>
      )}
      {added > 0 && (
        <span className="text-green-400">+{added} added</span>
      )}
      {removed > 0 && (
        <span className="text-red-400">-{removed} removed</span>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function DiffViewer({
  before,
  after,
  maxHeight = 300,
  compact = true,
}: DiffViewerProps) {
  const diff = computeDiff(before, after)

  const visibleChanges = compact
    ? diff.changes.filter(c => c.kind !== 'unchanged')
    : diff.changes

  if (!diff.hasChanges) {
    return (
      <div className="text-xs text-muted-foreground py-2 text-center">
        No differences detected
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <DiffSummary diff={diff} />
      <ScrollArea style={{ maxHeight }}>
        <div className="space-y-1">
          {visibleChanges.map((change, idx) => (
            <ChangeRow key={`${change.path}-${idx}`} change={change} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export { DiffSummary }
