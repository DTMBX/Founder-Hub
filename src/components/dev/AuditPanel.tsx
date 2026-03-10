/**
 * AuditPanel.tsx — Validation audit results display.
 *
 * Shows per-key pass/fail/missing status for all schema-backed KV keys.
 * Triggered by the "Run Validation Audit" command or the panel's Run button.
 *
 * Read-only — never mutates state.
 */

import { useState, useCallback } from 'react'
import { runValidationAudit, type AuditReport, type AuditKeyResult } from '@/lib/validation-audit'
import { useStudioPermissions } from '@/lib/studio-permissions'
import { cn } from '@/lib/utils'
import {
  ShieldCheck, ShieldWarning, Play, CheckCircle, XCircle, MinusCircle,
  Spinner, Database, Lock,
} from '@phosphor-icons/react'

// ─── Props ──────────────────────────────────────────────────────────────────

interface AuditPanelProps {
  /** If a report was already generated (e.g. from command palette), show it */
  initialReport?: AuditReport | null
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AuditPanel({ initialReport }: AuditPanelProps) {
  const [report, setReport] = useState<AuditReport | null>(initialReport ?? null)
  const [running, setRunning] = useState(false)
  const perms = useStudioPermissions()
  const canRunAudit = perms.can('studio:run-audit')

  const handleRun = useCallback(async () => {
    setRunning(true)
    try {
      const result = await runValidationAudit()
      setReport(result)
    } finally {
      setRunning(false)
    }
  }, [])

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="rounded-lg bg-card/40 border border-border/30 p-2 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">Validation Audit</span>
          </div>
          {report && (
            <StatusBadge report={report} />
          )}
        </div>
        {report && (
          <div className="text-[10px] text-muted-foreground">
            Last run: {new Date(report.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={running || !canRunAudit}
        className={cn(
          'w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors',
          !canRunAudit
            ? 'bg-card/30 text-muted-foreground/40 cursor-not-allowed'
            : running
              ? 'bg-card/30 text-muted-foreground/40 cursor-wait'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
        )}
        title={!canRunAudit ? perms.why('studio:run-audit') : undefined}
      >
        {!canRunAudit
          ? <><Lock className="h-3.5 w-3.5" /> Audit Locked</>
          : running
            ? <><Spinner className="h-3.5 w-3.5 animate-spin" /> Running…</>
            : <><Play className="h-3.5 w-3.5" /> Run Audit</>
        }
      </button>

      {/* Results */}
      {!report && !running && (
        <p className="text-[10px] text-muted-foreground/50 italic py-4 text-center">
          Click "Run Audit" to validate all KV-backed content against schemas.
        </p>
      )}

      {report && (
        <div className="space-y-2">
          {/* Summary bar */}
          <div className="flex gap-2 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle className="h-3 w-3" /> {report.passCount} pass
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <XCircle className="h-3 w-3" /> {report.failCount} fail
            </span>
            <span className="flex items-center gap-1 text-muted-foreground/60">
              <MinusCircle className="h-3 w-3" /> {report.missingCount} missing
            </span>
          </div>

          {/* Per-key results */}
          <div className="space-y-0.5 max-h-[45vh] overflow-y-auto">
            {report.results.map(result => (
              <KeyResultRow key={result.key} result={result} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ report }: { report: AuditReport }) {
  if (report.failCount === 0) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
        <ShieldCheck className="h-3 w-3" /> All Clear
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-[10px] text-red-400 font-medium">
      <ShieldWarning className="h-3 w-3" /> {report.failCount} Error{report.failCount !== 1 && 's'}
    </span>
  )
}

function KeyResultRow({ result }: { result: AuditKeyResult }) {
  const icon = result.status === 'pass'
    ? <CheckCircle className="h-3 w-3 text-emerald-400" />
    : result.status === 'fail'
      ? <XCircle className="h-3 w-3 text-red-400" />
      : <MinusCircle className="h-3 w-3 text-muted-foreground/40" />

  return (
    <div className={cn(
      'rounded-md px-2 py-1.5 border transition-colors',
      result.status === 'fail'
        ? 'border-red-500/20 bg-red-500/5'
        : 'border-transparent hover:bg-accent/5'
    )}>
      <div className="flex items-center gap-2">
        {icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Database className="h-2.5 w-2.5 text-muted-foreground/40" />
            <span className="text-xs font-mono truncate">{result.key}</span>
          </div>
        </div>
        {result.itemCount !== undefined && (
          <span className="text-[9px] text-muted-foreground/50 font-mono">
            {result.itemCount} items
          </span>
        )}
      </div>
      {result.error && result.status === 'fail' && (
        <p className="text-[10px] text-red-400/80 mt-1 ml-5 break-all">{result.error}</p>
      )}
    </div>
  )
}
