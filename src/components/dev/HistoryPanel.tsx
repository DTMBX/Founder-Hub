/**
 * HistoryPanel.tsx — Timeline view of all history entries.
 *
 * Shows labeled entries with timestamps, target scope, and source.
 * Supports jump-to-entry restore (applies that entry's `after` value
 * through kv.set). Does NOT break existing undo/redo.
 *
 * The history store already carries all needed metadata:
 *   - id, timestamp, label, target, before, after, source
 * No store enhancement was needed.
 */

import { useState } from 'react'
import { useHistory, history, type HistoryEntry } from '@/lib/history-store'
import { kv } from '@/lib/local-storage-kv'
import { cn } from '@/lib/utils'
import {
  ClockCounterClockwise, ArrowCounterClockwise, ArrowClockwise,
  Trash, Target, Tag, CaretDown, CaretRight,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return formatTime(ts)
}

const SOURCE_LABELS: Record<string, string> = {
  'visual-builder': 'Studio',
  'chat': 'Chat',
  'editor': 'Editor',
  'style': 'Style',
  'ai': 'AI',
  'manual': 'Manual',
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function HistoryPanel() {
  const state = useHistory()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const timeline = history.getTimeline()

  const handleUndo = () => {
    const entry = history.undo()
    if (entry) {
      kv.set(entry.target, entry.before)
      toast.info(`Undid: ${entry.label}`)
    }
  }

  const handleRedo = () => {
    const entry = history.redo()
    if (entry) {
      kv.set(entry.target, entry.after)
      toast.info(`Redid: ${entry.label}`)
    }
  }

  const handleClear = () => {
    history.clear()
    toast.info('History cleared')
  }

  const handleRestore = async (entry: HistoryEntry) => {
    try {
      await kv.set(entry.target, entry.after)
      toast.success(`Restored: ${entry.label}`)
    } catch {
      toast.error('Failed to restore entry')
    }
  }

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="rounded-lg bg-card/40 border border-border/30 p-2 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ClockCounterClockwise className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">History Timeline</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            {timeline.length} {timeline.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <div className="text-[10px] text-muted-foreground">
          Cursor: {state.cursor + 1} / {state.entries.length}
        </div>
      </div>

      {/* Undo / Redo / Clear */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleUndo}
          disabled={!state.canUndo}
          className={cn(
            'flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] rounded-lg transition-colors',
            state.canUndo
              ? 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
              : 'text-muted-foreground/30 cursor-not-allowed'
          )}
        >
          <ArrowCounterClockwise className="h-3 w-3" />
          Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={!state.canRedo}
          className={cn(
            'flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] rounded-lg transition-colors',
            state.canRedo
              ? 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
              : 'text-muted-foreground/30 cursor-not-allowed'
          )}
        >
          <ArrowClockwise className="h-3 w-3" />
          Redo
        </button>
        <button
          onClick={handleClear}
          disabled={timeline.length === 0}
          className={cn(
            'px-2 py-1.5 text-[10px] rounded-lg transition-colors',
            timeline.length > 0
              ? 'text-muted-foreground hover:text-red-400 hover:bg-red-500/10'
              : 'text-muted-foreground/30 cursor-not-allowed'
          )}
          title="Clear all history"
        >
          <Trash className="h-3 w-3" />
        </button>
      </div>

      {/* Timeline */}
      {timeline.length === 0 && (
        <p className="text-[10px] text-muted-foreground/50 italic py-4 text-center">
          No history yet. Changes will appear here after Apply.
        </p>
      )}

      <div className="space-y-0.5 max-h-[50vh] overflow-y-auto">
        {timeline.map((entry) => {
          const isExpanded = expandedId === entry.id
          const isCurrent = state.entries[state.cursor]?.id === entry.id
          return (
            <div
              key={entry.id}
              className={cn(
                'rounded-md border transition-colors',
                isCurrent
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-transparent hover:bg-accent/5'
              )}
            >
              {/* Entry row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="w-full flex items-start gap-2 px-2 py-1.5 text-left"
              >
                {isExpanded
                  ? <CaretDown className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                  : <CaretRight className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate">{entry.label}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-muted-foreground/50">
                      {formatRelative(entry.timestamp)}
                    </span>
                    {isCurrent && (
                      <span className="text-[8px] text-primary font-semibold uppercase">current</span>
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-2 pb-2 space-y-1.5 ml-5">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Target className="h-3 w-3 shrink-0" />
                    <span className="font-mono truncate">{entry.target}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Tag className="h-3 w-3 shrink-0" />
                    <span>{SOURCE_LABELS[entry.source] || entry.source}</span>
                    <span className="text-muted-foreground/40">•</span>
                    <span>{formatTime(entry.timestamp)}</span>
                  </div>
                  <button
                    onClick={() => handleRestore(entry)}
                    className="text-[10px] text-primary hover:text-primary/80 transition-colors"
                  >
                    Restore this state →
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
