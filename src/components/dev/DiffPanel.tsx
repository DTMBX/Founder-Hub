/**
 * DiffPanel.tsx — Snapshot comparison panel for the DevCustomizer.
 *
 * Provides two grounded comparison modes:
 *   1. Snapshot vs Current: Upload a snapshot file and compare against live KV state
 *   2. History entry diff: View changes for any history entry (also accessible from HistoryPanel)
 *
 * All diffs are deterministic, scoped by KV key, and produced by diff-engine.
 * No git integration. No file-based diffs. No speculative revision metadata.
 */

import { useState, useCallback } from 'react'
import { kv } from '@/lib/local-storage-kv'
import { KV_SCHEMAS } from '@/lib/content-schema'
import { readSnapshotFile, validateSnapshot, type Snapshot } from '@/lib/snapshot-system'
import { useHistory, type HistoryEntry } from '@/lib/history-store'
import { diff, diffScoped, type ScopedDiff } from '@/lib/diff-engine'
import { ScopedDiffViewer, DiffViewer, InlineHistoryDiff } from './DiffViewer'
import { cn } from '@/lib/utils'
import {
  FileArrowUp, GitDiff, ClockCounterClockwise,
  Spinner, Warning, ShieldCheck,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

// ─── KV Key Labels ──────────────────────────────────────────────────────────

const KV_LABELS: Record<string, string> = {
  'founder-hub-sections': 'Sections',
  'founder-hub-projects': 'Projects',
  'founder-hub-settings': 'Settings',
  'founder-hub-proof-links': 'Proof Links',
  'founder-hub-contact-links': 'Contact Links',
  'founder-hub-about': 'About',
  'founder-hub-profile': 'Profile',
  'founder-hub-offerings': 'Offerings',
  'founder-hub-investor': 'Investor',
  'founder-hub-court-cases': 'Court Cases',
}

function kvLabel(key: string): string {
  return KV_LABELS[key] || key.replace('founder-hub-', '').replace(/-/g, ' ')
}

// ─── Tab Types ──────────────────────────────────────────────────────────────

type DiffTab = 'snapshot' | 'history'

// ─── Component ──────────────────────────────────────────────────────────────

export default function DiffPanel() {
  const [tab, setTab] = useState<DiffTab>('snapshot')

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="rounded-lg bg-card/40 border border-border/30 p-2">
        <div className="flex items-center gap-1.5">
          <GitDiff className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">Change Inspector</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        <TabButton active={tab === 'snapshot'} onClick={() => setTab('snapshot')}>
          <FileArrowUp className="h-3 w-3" /> Snapshot vs Current
        </TabButton>
        <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
          <ClockCounterClockwise className="h-3 w-3" /> History Entries
        </TabButton>
      </div>

      {/* Tab content */}
      {tab === 'snapshot' && <SnapshotCompareTab />}
      {tab === 'history' && <HistoryDiffTab />}
    </div>
  )
}

// ─── Tab Button ─────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium rounded-lg transition-colors',
        active
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/10 border border-transparent',
      )}
    >
      {children}
    </button>
  )
}

// ─── Snapshot Compare Tab ───────────────────────────────────────────────────

function SnapshotCompareTab() {
  const [scopedDiffs, setScopedDiffs] = useState<ScopedDiff[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snapshotInfo, setSnapshotInfo] = useState<string | null>(null)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setScopedDiffs(null)

    try {
      const parsed = await readSnapshotFile(file)

      // Validate structure
      const validation = validateSnapshot(parsed)
      if (!validation.valid) {
        setError(`Invalid snapshot: ${validation.keys.find(k => !k.valid)?.error || 'Unknown error'}`)
        setLoading(false)
        return
      }

      const snapshot = parsed as Snapshot
      setSnapshotInfo(`Exported: ${snapshot.exportedAt}`)

      // Read current state for all schema-backed keys
      const currentState: Record<string, unknown> = {}
      for (const key of Object.keys(KV_SCHEMAS)) {
        const val = await kv.get(key)
        if (val !== null) currentState[key] = val
      }

      // Diff snapshot data vs current
      const results = diffScoped(snapshot.data, currentState, kvLabel)
      setScopedDiffs(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read snapshot')
    } finally {
      setLoading(false)
    }

    // Reset file input so same file can be re-selected
    e.target.value = ''
  }, [])

  return (
    <div className="space-y-3">
      {/* File upload */}
      <label
        className={cn(
          'flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors',
          loading
            ? 'border-muted-foreground/20 text-muted-foreground/30 cursor-wait'
            : 'border-border/40 text-muted-foreground hover:border-primary/30 hover:text-primary/70',
        )}
      >
        {loading ? (
          <><Spinner className="h-4 w-4 animate-spin" /> Comparing…</>
        ) : (
          <><FileArrowUp className="h-4 w-4" /> <span className="text-xs">Select snapshot JSON to compare</span></>
        )}
        <input
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          disabled={loading}
          className="hidden"
        />
      </label>

      {/* Snapshot info */}
      {snapshotInfo && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3 shrink-0" />
          <span>{snapshotInfo}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <Warning className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {scopedDiffs && (
        <ScopedDiffViewer
          scoped={scopedDiffs}
          title="Snapshot → Current State"
          maxHeight="50vh"
        />
      )}

      {!scopedDiffs && !loading && !error && (
        <p className="text-[10px] text-muted-foreground/50 italic text-center py-4">
          Upload a previously exported snapshot to compare against the current live state.
        </p>
      )}
    </div>
  )
}

// ─── History Diff Tab ───────────────────────────────────────────────────────

function HistoryDiffTab() {
  const state = useHistory()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const timeline = state.entries.slice().reverse()

  const selectedEntry = selectedId ? timeline.find(e => e.id === selectedId) : null

  if (timeline.length === 0) {
    return (
      <p className="text-[10px] text-muted-foreground/50 italic text-center py-4">
        No history entries yet. Changes will appear here after edits are applied.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {/* Entry selector */}
      <div className="max-h-[150px] overflow-y-auto space-y-0.5">
        {timeline.map(entry => (
          <button
            key={entry.id}
            onClick={() => setSelectedId(selectedId === entry.id ? null : entry.id)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors',
              selectedId === entry.id
                ? 'bg-primary/10 border border-primary/30'
                : 'hover:bg-accent/5 border border-transparent',
            )}
          >
            <GitDiff className={cn(
              'h-3 w-3 shrink-0',
              selectedId === entry.id ? 'text-primary' : 'text-muted-foreground/40',
            )} />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] truncate">{entry.label}</div>
              <div className="text-[9px] text-muted-foreground/50 truncate">
                {entry.target} • {new Date(entry.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected entry diff */}
      {selectedEntry && selectedEntry.before != null && selectedEntry.after != null && (
        <div className="pt-2 border-t border-border/20">
          <InlineHistoryDiff before={selectedEntry.before} after={selectedEntry.after} />
        </div>
      )}

      {selectedEntry && (selectedEntry.before == null || selectedEntry.after == null) && (
        <div className="text-[10px] text-muted-foreground/50 italic text-center py-3">
          This entry does not have before/after data for diffing.
        </div>
      )}
    </div>
  )
}
