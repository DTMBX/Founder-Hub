/**
 * HistoryTimeline — Visible undo/redo history panel.
 *
 * Shows a chronological list of all changes made this session,
 * with the ability to jump to any point in history.
 * Each entry is expandable to show an inline diff of before/after.
 */

import { useState } from 'react'
import { useHistory, history } from '@/lib/history-store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  ClockCounterClockwise, ArrowCounterClockwise, ArrowClockwise,
  Trash, X, CaretDown, CaretRight
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import DiffViewer from '@/components/admin/DiffViewer'

interface HistoryTimelineProps {
  onClose: () => void
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const SOURCE_LABELS: Record<string, string> = {
  'visual-builder': 'Visual',
  'chat': 'Chat',
  'editor': 'Editor',
  'style': 'Style',
  'ai': 'AI',
  'manual': 'Manual',
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'border-amber-500/40 text-amber-500',
  admin: 'border-blue-500/40 text-blue-500',
  editor: 'border-green-500/40 text-green-500',
  support: 'border-muted-foreground/40 text-muted-foreground',
}

export default function HistoryTimeline({ onClose }: HistoryTimelineProps) {
  const state = useHistory()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const timeline = state.entries.slice().reverse()
  // cursor in reverse order: current entry is at (entries.length - 1 - cursor)
  const currentReversedIndex = state.entries.length - 1 - state.cursor

  return (
    <div className="w-72 border-l border-border bg-card/50 backdrop-blur-sm flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between h-12 px-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <ClockCounterClockwise className="h-4 w-4 text-primary" weight="duotone" />
          <span className="text-sm font-semibold">History</span>
          <Badge variant="secondary" className="text-[10px] px-1.5">
            {state.entries.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!state.canUndo}
            onClick={() => history.undo()}
            title="Undo"
          >
            <ArrowCounterClockwise className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!state.canRedo}
            onClick={() => history.redo()}
            title="Redo"
          >
            <ArrowClockwise className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Close">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <ScrollArea className="flex-1">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-xs">
            <ClockCounterClockwise className="h-8 w-8 mb-2 opacity-30" />
            No changes yet this session
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {timeline.map((entry, idx) => {
              const isCurrent = idx === currentReversedIndex
              const isFuture = idx < currentReversedIndex // already undone
              const isExpanded = expandedId === entry.id
              const hasDiff = entry.before !== undefined && entry.after !== undefined
              
              return (
                <div
                  key={entry.id}
                  className={cn(
                    'rounded-lg text-xs transition-colors',
                    isCurrent && 'bg-primary/10 border border-primary/20',
                    isFuture && 'opacity-40',
                    !isCurrent && !isFuture && 'hover:bg-muted/50'
                  )}
                >
                  <div
                    className="flex items-start gap-2 p-2 cursor-pointer"
                    onClick={() => hasDiff && setExpandedId(isExpanded ? null : entry.id)}
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center pt-1 shrink-0">
                      <div className={cn(
                        'h-2 w-2 rounded-full',
                        isCurrent ? 'bg-primary' : isFuture ? 'bg-muted-foreground/30' : 'bg-muted-foreground/50'
                      )} />
                      {idx < timeline.length - 1 && (
                        <div className="w-px h-6 bg-border/50 mt-1" />
                      )}
                    </div>

                    {/* Entry details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        {hasDiff && (
                          isExpanded
                            ? <CaretDown className="h-3 w-3 text-muted-foreground shrink-0" />
                            : <CaretRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                        <p className={cn(
                          'font-medium truncate',
                          isCurrent && 'text-primary'
                        )}>
                          {entry.label}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                        <span>{formatTimestamp(entry.timestamp)}</span>
                        <Badge variant="outline" className="text-[8px] px-1 py-0">
                          {SOURCE_LABELS[entry.source] || entry.source}
                        </Badge>
                        {entry.role && (
                          <Badge variant="outline" className={cn('text-[8px] px-1 py-0', ROLE_COLORS[entry.role])}>
                            {entry.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable diff */}
                  {isExpanded && hasDiff && (
                    <div className="px-3 pb-2 pt-0">
                      <DiffViewer before={entry.before} after={entry.after} maxHeight={200} compact />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {timeline.length > 0 && (
        <div className="p-2 border-t border-border shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground gap-1.5"
            onClick={() => history.clear()}
          >
            <Trash className="h-3 w-3" />
            Clear History
          </Button>
        </div>
      )}
    </div>
  )
}
