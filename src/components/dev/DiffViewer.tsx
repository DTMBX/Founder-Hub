/**
 * DiffViewer.tsx — Deterministic change visualization for the Site Studio.
 *
 * Renders the output of diff-engine in a structured, readable format:
 *   - Summary bar: counts of added/removed/changed
 *   - Change rows: path, before → after, color-coded status
 *   - Filter controls: show/hide by change type
 *   - Scoped view: grouped by KV key for multi-key diffs (snapshots)
 *
 * Used by:
 *   - HistoryPanel: inline diff for expanded history entries
 *   - Snapshot comparison (future DiffPanel mode)
 *
 * No animations, no syntax highlighting, no fuzzy heuristics.
 * Pure deterministic rows derived from diff-engine output.
 */

import { useState, useMemo } from 'react'
import {
  diff,
  type DiffResult,
  type DiffEntry,
  type DiffStatus,
  type ScopedDiff,
  changesOnly,
  formatDiffValue,
  aggregateSummary,
} from '@/lib/diff-engine'
import { cn } from '@/lib/utils'
import {
  Plus, Minus, ArrowRight, Funnel, CaretDown, CaretRight,
} from '@phosphor-icons/react'

// ─── Status Colors ──────────────────────────────────────────────────────────

const STATUS_COLORS: Record<DiffStatus, string> = {
  added: 'text-emerald-400',
  removed: 'text-red-400',
  changed: 'text-amber-400',
  unchanged: 'text-muted-foreground/30',
}

const STATUS_BG: Record<DiffStatus, string> = {
  added: 'bg-emerald-500/5 border-emerald-500/20',
  removed: 'bg-red-500/5 border-red-500/20',
  changed: 'bg-amber-500/5 border-amber-500/20',
  unchanged: 'bg-transparent border-transparent',
}

const STATUS_ICONS: Record<DiffStatus, React.ReactNode> = {
  added: <Plus className="h-2.5 w-2.5" />,
  removed: <Minus className="h-2.5 w-2.5" />,
  changed: <ArrowRight className="h-2.5 w-2.5" />,
  unchanged: null,
}

const STATUS_LABELS: Record<DiffStatus, string> = {
  added: 'Added',
  removed: 'Removed',
  changed: 'Changed',
  unchanged: 'Unchanged',
}

// ─── Summary Bar ────────────────────────────────────────────────────────────

function DiffSummaryBar({ summary }: { summary: DiffResult['summary'] }) {
  const parts: { label: string; count: number; color: string }[] = [
    { label: 'added', count: summary.added, color: 'text-emerald-400' },
    { label: 'removed', count: summary.removed, color: 'text-red-400' },
    { label: 'changed', count: summary.changed, color: 'text-amber-400' },
  ]

  const nonZero = parts.filter(p => p.count > 0)

  if (nonZero.length === 0) {
    return (
      <div className="text-[10px] text-muted-foreground/50 italic">
        No changes detected
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 text-[10px]">
      {nonZero.map(p => (
        <span key={p.label} className={cn('flex items-center gap-1', p.color)}>
          {STATUS_ICONS[p.label as DiffStatus]}
          {p.count} {p.label}
        </span>
      ))}
    </div>
  )
}

// ─── Single Diff Entry Row ──────────────────────────────────────────────────

function DiffEntryRow({ entry }: { entry: DiffEntry }) {
  const [expanded, setExpanded] = useState(false)
  const hasComplexValue = isComplex(entry.before) || isComplex(entry.after)

  return (
    <div className={cn('rounded-md border px-2 py-1.5 text-[10px]', STATUS_BG[entry.status])}>
      <div className="flex items-start gap-2">
        <span className={cn('shrink-0 mt-0.5', STATUS_COLORS[entry.status])}>
          {STATUS_ICONS[entry.status]}
        </span>

        <div className="flex-1 min-w-0">
          {/* Path */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-muted-foreground truncate">{entry.path}</span>
            <span className={cn('text-[8px] uppercase font-semibold shrink-0', STATUS_COLORS[entry.status])}>
              {STATUS_LABELS[entry.status]}
            </span>
          </div>

          {/* Inline values for simple changes */}
          {!hasComplexValue && entry.status === 'changed' && (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-red-400/70 line-through">{formatDiffValue(entry.before)}</span>
              <ArrowRight className="h-2 w-2 text-muted-foreground/40 shrink-0" />
              <span className="text-emerald-400/70">{formatDiffValue(entry.after)}</span>
            </div>
          )}
          {!hasComplexValue && entry.status === 'added' && (
            <div className="mt-1 text-emerald-400/70">{formatDiffValue(entry.after)}</div>
          )}
          {!hasComplexValue && entry.status === 'removed' && (
            <div className="mt-1 text-red-400/70 line-through">{formatDiffValue(entry.before)}</div>
          )}

          {/* Expandable for complex values */}
          {hasComplexValue && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-primary/70 hover:text-primary transition-colors flex items-center gap-1"
            >
              {expanded ? <CaretDown className="h-2.5 w-2.5" /> : <CaretRight className="h-2.5 w-2.5" />}
              {expanded ? 'Collapse' : 'Expand'} value
            </button>
          )}
        </div>
      </div>

      {/* Expanded complex value */}
      {hasComplexValue && expanded && (
        <div className="mt-2 ml-4 space-y-1.5">
          {entry.before !== undefined && (
            <div>
              <div className="text-[9px] font-semibold text-red-400/50 uppercase">Before</div>
              <pre className="text-[9px] text-muted-foreground/70 whitespace-pre-wrap break-all bg-black/20 rounded px-1.5 py-1 mt-0.5 max-h-[120px] overflow-y-auto">
                {safeStringify(entry.before)}
              </pre>
            </div>
          )}
          {entry.after !== undefined && (
            <div>
              <div className="text-[9px] font-semibold text-emerald-400/50 uppercase">After</div>
              <pre className="text-[9px] text-muted-foreground/70 whitespace-pre-wrap break-all bg-black/20 rounded px-1.5 py-1 mt-0.5 max-h-[120px] overflow-y-auto">
                {safeStringify(entry.after)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Flat Diff Viewer ───────────────────────────────────────────────────────

export interface DiffViewerProps {
  /** The diff result to display */
  result: DiffResult
  /** Optional title */
  title?: string
  /** Max height for scrollable area */
  maxHeight?: string
  /** Whether to show the filter bar (default: true if > 5 entries) */
  showFilter?: boolean
  /** If true, hides unchanged entries by default */
  hideUnchanged?: boolean
}

export function DiffViewer({
  result,
  title,
  maxHeight = '300px',
  showFilter,
  hideUnchanged = true,
}: DiffViewerProps) {
  const [statusFilter, setStatusFilter] = useState<Set<DiffStatus>>(
    new Set(hideUnchanged ? ['added', 'removed', 'changed'] : ['added', 'removed', 'changed', 'unchanged']),
  )

  const filtered = useMemo(
    () => result.entries.filter(e => statusFilter.has(e.status)),
    [result.entries, statusFilter],
  )

  const shouldShowFilter = showFilter ?? result.entries.length > 5

  const toggleFilter = (status: DiffStatus) => {
    setStatusFilter(prev => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  return (
    <div className="space-y-2">
      {/* Title + summary */}
      <div className="space-y-1">
        {title && <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</div>}
        <DiffSummaryBar summary={result.summary} />
      </div>

      {/* Filter bar */}
      {shouldShowFilter && (
        <div className="flex items-center gap-1">
          <Funnel className="h-3 w-3 text-muted-foreground/40 shrink-0" />
          {(['added', 'removed', 'changed', 'unchanged'] as DiffStatus[]).map(status => (
            <button
              key={status}
              onClick={() => toggleFilter(status)}
              className={cn(
                'px-1.5 py-0.5 text-[9px] rounded transition-colors',
                statusFilter.has(status)
                  ? `${STATUS_COLORS[status]} bg-white/5`
                  : 'text-muted-foreground/20',
              )}
            >
              {STATUS_LABELS[status]} ({result.summary[status]})
            </button>
          ))}
        </div>
      )}

      {/* Change list */}
      {!result.hasChanges && (
        <div className="text-[10px] text-muted-foreground/50 italic text-center py-3">
          No differences found
        </div>
      )}

      {result.hasChanges && filtered.length === 0 && (
        <div className="text-[10px] text-muted-foreground/50 italic text-center py-3">
          No entries match current filter
        </div>
      )}

      <div className="space-y-0.5 overflow-y-auto" style={{ maxHeight }}>
        {filtered.map((entry, i) => (
          <DiffEntryRow key={`${entry.path}-${i}`} entry={entry} />
        ))}
      </div>
    </div>
  )
}

// ─── Scoped Diff Viewer ─────────────────────────────────────────────────────

export interface ScopedDiffViewerProps {
  /** Array of per-scope diffs */
  scoped: ScopedDiff[]
  /** Optional title */
  title?: string
  /** Max height for the entire viewer */
  maxHeight?: string
}

export function ScopedDiffViewer({ scoped, title, maxHeight = '60vh' }: ScopedDiffViewerProps) {
  const [expandedScope, setExpandedScope] = useState<string | null>(null)
  const agg = aggregateSummary(scoped)

  const withChanges = scoped.filter(s => s.diff.hasChanges)
  const withoutChanges = scoped.filter(s => !s.diff.hasChanges)

  return (
    <div className="space-y-2">
      {title && <div className="text-xs font-semibold">{title}</div>}

      {/* Aggregate summary */}
      <div className="flex items-center gap-3 text-[10px]">
        <span className="text-muted-foreground">{agg.scopesChanged} / {scoped.length} scopes changed</span>
        {agg.added > 0 && <span className="text-emerald-400">+{agg.added}</span>}
        {agg.removed > 0 && <span className="text-red-400">−{agg.removed}</span>}
        {agg.changed > 0 && <span className="text-amber-400">~{agg.changed}</span>}
      </div>

      <div className="space-y-0.5 overflow-y-auto" style={{ maxHeight }}>
        {/* Scopes with changes first */}
        {withChanges.map(s => {
          const isExpanded = expandedScope === s.scope
          return (
            <div key={s.scope} className="rounded-md border border-border/30 bg-card/20">
              <button
                onClick={() => setExpandedScope(isExpanded ? null : s.scope)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-left"
              >
                {isExpanded
                  ? <CaretDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  : <CaretRight className="h-3 w-3 text-muted-foreground shrink-0" />
                }
                <span className="text-xs font-mono flex-1 truncate">{s.label}</span>
                <DiffSummaryBar summary={s.diff.summary} />
              </button>
              {isExpanded && (
                <div className="px-2 pb-2">
                  <DiffViewer
                    result={{ ...s.diff, entries: changesOnly(s.diff) }}
                    maxHeight="200px"
                    hideUnchanged
                  />
                </div>
              )}
            </div>
          )
        })}

        {/* Unchanged scopes collapsed */}
        {withoutChanges.length > 0 && (
          <div className="text-[10px] text-muted-foreground/40 px-2 py-1">
            {withoutChanges.length} scope{withoutChanges.length !== 1 ? 's' : ''} unchanged:
            {' '}{withoutChanges.map(s => s.label).join(', ')}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Inline History Diff ────────────────────────────────────────────────────

export interface InlineHistoryDiffProps {
  /** The before value from the history entry */
  before: unknown
  /** The after value from the history entry */
  after: unknown
}

/**
 * Compact inline diff for use within a HistoryPanel expanded entry.
 * Shows summary + first N changes with "show more" if needed.
 */
export function InlineHistoryDiff({ before, after }: InlineHistoryDiffProps) {
  const result = useMemo(() => diff(before, after), [before, after])
  const changes = useMemo(() => changesOnly(result), [result])
  const [showAll, setShowAll] = useState(false)

  const PREVIEW_COUNT = 5
  const visible = showAll ? changes : changes.slice(0, PREVIEW_COUNT)
  const hasMore = changes.length > PREVIEW_COUNT

  if (!result.hasChanges) {
    return <div className="text-[9px] text-muted-foreground/40 italic">No data changes</div>
  }

  return (
    <div className="space-y-1.5">
      <DiffSummaryBar summary={result.summary} />
      <div className="space-y-0.5">
        {visible.map((entry, i) => (
          <DiffEntryRow key={`${entry.path}-${i}`} entry={entry} />
        ))}
      </div>
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-[9px] text-primary/70 hover:text-primary transition-colors"
        >
          Show {changes.length - PREVIEW_COUNT} more change{changes.length - PREVIEW_COUNT !== 1 ? 's' : ''}…
        </button>
      )}
    </div>
  )
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function isComplex(value: unknown): boolean {
  if (value == null) return false
  if (typeof value !== 'object') return false
  if (Array.isArray(value)) return value.length > 0
  return Object.keys(value).length > 0
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
