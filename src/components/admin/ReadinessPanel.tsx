/**
 * ReadinessPanel.tsx — Publish readiness signals for the content pipeline.
 *
 * Shows at-a-glance status for:
 *  - Schema validation (pass/fail per module)
 *  - Dirty editor state (unsaved changes)
 *  - Safety snapshot status (last backup time)
 *  - Content completeness (empty/missing modules)
 *
 * Designed for the governance dashboard — read-only status display.
 */

import { useState, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Rocket,
  CheckCircle,
  XCircle,
  Warning,
  CircleNotch,
  ArrowsClockwise,
  Clock,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useGlobalDirty } from '@/lib/editor-state'
import { useHistory } from '@/lib/history-store'
import { runValidationAudit, type AuditReport } from '@/lib/validation-audit'
import { getSafetySnapshots } from '@/lib/snapshot-guardrails'

// ─── Signal types ───────────────────────────────────────────────────────────

interface Signal {
  label: string
  status: 'ready' | 'warning' | 'blocking'
  detail: string
}

const STATUS_STYLES = {
  ready: { icon: CheckCircle, color: 'text-green-400', badge: 'bg-green-500/10 border-green-500/20 text-green-400' },
  warning: { icon: Warning, color: 'text-amber-400', badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  blocking: { icon: XCircle, color: 'text-red-400', badge: 'bg-red-500/10 border-red-500/20 text-red-400' },
} as const

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ReadinessPanel() {
  const { isDirty, dirtyKeys } = useGlobalDirty()
  const historyState = useHistory()
  const [audit, setAudit] = useState<AuditReport | null>(null)
  const [loading, setLoading] = useState(false)

  const refreshAudit = useCallback(async () => {
    setLoading(true)
    try {
      const report = await runValidationAudit()
      setAudit(report)
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-run audit on mount
  useEffect(() => { refreshAudit() }, [refreshAudit])

  // Build signals
  const signals: Signal[] = []

  // 1. Dirty state
  if (isDirty) {
    signals.push({
      label: 'Unsaved Changes',
      status: 'warning',
      detail: `${dirtyKeys.length} module${dirtyKeys.length !== 1 ? 's' : ''} with unsaved edits`,
    })
  } else {
    signals.push({ label: 'Editor State', status: 'ready', detail: 'All changes saved' })
  }

  // 2. Validation
  if (audit) {
    if (audit.failCount > 0) {
      signals.push({
        label: 'Schema Validation',
        status: 'blocking',
        detail: `${audit.failCount} module${audit.failCount !== 1 ? 's' : ''} failing validation`,
      })
    } else if (audit.emptyCount > 0 || audit.missingCount > 0) {
      const count = audit.emptyCount + audit.missingCount
      signals.push({
        label: 'Content Completeness',
        status: 'warning',
        detail: `${count} module${count !== 1 ? 's' : ''} empty or missing`,
      })
    } else {
      signals.push({ label: 'Schema Validation', status: 'ready', detail: 'All modules pass' })
    }
  }

  // 3. History
  if (historyState.entries.length > 0) {
    signals.push({
      label: 'Edit History',
      status: 'ready',
      detail: `${historyState.entries.length} changes this session`,
    })
  } else {
    signals.push({ label: 'Edit History', status: 'ready', detail: 'No changes this session' })
  }

  // 4. Safety snapshots
  const snapshots = getSafetySnapshots()
  if (snapshots.length > 0) {
    const latest = snapshots[snapshots.length - 1]
    const time = new Date(latest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    signals.push({
      label: 'Safety Backup',
      status: 'ready',
      detail: `Last backup at ${time} (${snapshots.length} total)`,
    })
  } else {
    signals.push({ label: 'Safety Backup', status: 'warning', detail: 'No safety snapshots this session' })
  }

  // Overall readiness
  const hasBlocking = signals.some(s => s.status === 'blocking')
  const hasWarning = signals.some(s => s.status === 'warning')
  const overallStatus = hasBlocking ? 'blocking' : hasWarning ? 'warning' : 'ready'

  return (
    <Card className="border-border/50 bg-card/50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary" weight="duotone" />
          <span className="text-sm font-semibold">Publish Readiness</span>
          <Badge
            variant="outline"
            className={cn('text-[10px] px-1.5 py-0', STATUS_STYLES[overallStatus].badge)}
          >
            {overallStatus === 'ready' ? 'Ready' : overallStatus === 'warning' ? 'Warnings' : 'Blocked'}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={refreshAudit}
          disabled={loading}
          title="Refresh"
        >
          {loading ? (
            <CircleNotch className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowsClockwise className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      <div className="p-3 space-y-1.5">
        {signals.map((signal) => {
          const style = STATUS_STYLES[signal.status]
          const Icon = style.icon
          return (
            <div
              key={signal.label}
              className={cn(
                'flex items-start gap-2 px-3 py-2 rounded-md text-xs border',
                signal.status === 'ready' && 'bg-green-500/5 border-green-500/15',
                signal.status === 'warning' && 'bg-amber-500/5 border-amber-500/15',
                signal.status === 'blocking' && 'bg-red-500/5 border-red-500/15',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', style.color)} weight="fill" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-foreground">{signal.label}</span>
                <p className="text-muted-foreground mt-0.5">{signal.detail}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Audit timestamp */}
      {audit && (
        <div className="px-4 py-2 border-t border-border/30 text-[10px] text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          Last audit: {new Date(audit.timestamp).toLocaleTimeString()}
        </div>
      )}
    </Card>
  )
}
