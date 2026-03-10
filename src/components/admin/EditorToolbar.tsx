/**
 * EditorToolbar — Persistent bottom toolbar for save, undo/redo, and status.
 *
 * Shows:
 *  - Dirty indicator
 *  - Save button (Ctrl+S)
 *  - Undo/Redo buttons (Ctrl+Z / Ctrl+Shift+Z)
 *  - History timeline toggle
 *  - Preview toggle
 *  - Last saved timestamp
 *  - Validation errors
 */

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FloppyDisk, ArrowCounterClockwise, ArrowClockwise,
  ClockCounterClockwise, Eye, Warning, Check, CircleNotch, Keyboard
} from '@phosphor-icons/react'
import { formatShortcut } from '@/lib/keyboard-shortcuts'

interface EditorToolbarProps {
  isDirty: boolean
  isSaving?: boolean
  canUndo: boolean
  canRedo: boolean
  undoLabel?: string | null
  redoLabel?: string | null
  onSave: () => void
  onUndo: () => void
  onRedo: () => void
  onTogglePreview?: () => void
  onToggleHistory?: () => void
  onToggleShortcuts?: () => void
  isPreviewOpen?: boolean
  isHistoryOpen?: boolean
  lastSavedAt?: Date | null
  validationError?: string | null
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function EditorToolbar({
  isDirty,
  isSaving = false,
  canUndo,
  canRedo,
  undoLabel,
  redoLabel,
  onSave,
  onUndo,
  onRedo,
  onTogglePreview,
  onToggleHistory,
  onToggleShortcuts,
  isPreviewOpen = false,
  isHistoryOpen = false,
  lastSavedAt,
  validationError,
}: EditorToolbarProps) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur-xl">
      <div className="flex items-center justify-between h-11 px-4 lg:px-6 max-w-6xl">
        {/* Left: status */}
        <div className="flex items-center gap-3">
          {/* Dirty indicator */}
          {isDirty ? (
            <Badge variant="outline" className="text-[10px] gap-1 text-amber-500 border-amber-500/30">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Unsaved
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] gap-1 text-emerald-500 border-emerald-500/30">
              <Check className="h-3 w-3" weight="bold" />
              Saved
            </Badge>
          )}

          {validationError && (
            <span className="text-[10px] text-red-400 flex items-center gap-1 max-w-[200px] truncate">
              <Warning className="h-3 w-3 shrink-0" weight="fill" />
              {validationError}
            </span>
          )}

          {lastSavedAt && !isDirty && (
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              {formatTimeAgo(lastSavedAt)}
            </span>
          )}
        </div>

        {/* Center: undo/redo */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!canUndo}
            onClick={onUndo}
            title={undoLabel ? `Undo: ${undoLabel} (${formatShortcut({ key: 'z', ctrl: true })})` : `Undo (${formatShortcut({ key: 'z', ctrl: true })})`}
          >
            <ArrowCounterClockwise className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!canRedo}
            onClick={onRedo}
            title={redoLabel ? `Redo: ${redoLabel} (${formatShortcut({ key: 'z', ctrl: true, shift: true })})` : `Redo (${formatShortcut({ key: 'z', ctrl: true, shift: true })})`}
          >
            <ArrowClockwise className="h-3.5 w-3.5" />
          </Button>

          {onToggleHistory && (
            <>
              <div className="w-px h-4 bg-border mx-1" />
              <Button
                variant={isHistoryOpen ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={onToggleHistory}
                title="History Timeline (Ctrl+Shift+H)"
              >
                <ClockCounterClockwise className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {onToggleShortcuts && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onToggleShortcuts}
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="h-3.5 w-3.5" />
            </Button>
          )}

          {onTogglePreview && (
            <Button
              variant={isPreviewOpen ? 'secondary' : 'outline'}
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={onTogglePreview}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            className="h-7 text-xs gap-1.5"
            disabled={!isDirty || isSaving}
            onClick={onSave}
          >
            {isSaving ? (
              <CircleNotch className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FloppyDisk className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
            <kbd className="hidden md:inline-flex ml-1 h-4 items-center rounded border border-primary-foreground/20 px-1 font-mono text-[9px]">
              ⌃S
            </kbd>
          </Button>
        </div>
      </div>
    </div>
  )
}
