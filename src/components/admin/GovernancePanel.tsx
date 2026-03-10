/**
 * GovernancePanel.tsx — Content Ops Governance dashboard.
 *
 * Composes:
 *  - Publish Readiness signals
 *  - Validation Audit panel
 *  - Bulk Transforms executor
 *  - Safety Snapshot viewer
 *
 * This is the single governance view for the admin dashboard.
 */

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Shield, Lightning, Trash, Download, CircleNotch,
  ArrowsClockwise, Clock,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useStudioPermissions } from '@/lib/studio-permissions'

import ValidationAuditPanel from './ValidationAuditPanel'
import ReadinessPanel from './ReadinessPanel'
import { getSafetySnapshots, clearSafetySnapshots, type SafetySnapshot } from '@/lib/snapshot-guardrails'
import { downloadSnapshot } from '@/lib/snapshot-system'
import {
  bulkEnableAllSections,
  bulkDisableNonEssential,
  bulkSortSectionsAlpha,
  bulkNormalizeProjectTitles,
  type BulkTransformResult,
} from '@/lib/content-bulk-transforms'

// ─── Bulk transforms config ────────────────────────────────────────────────

const BULK_TRANSFORMS = [
  { id: 'enable-all', label: 'Enable All Sections', fn: bulkEnableAllSections },
  { id: 'disable-non-essential', label: 'Disable Non-Essential', fn: bulkDisableNonEssential },
  { id: 'sort-alpha', label: 'Sort Sections A-Z', fn: bulkSortSectionsAlpha },
  { id: 'normalize-titles', label: 'Normalize Project Titles', fn: bulkNormalizeProjectTitles },
] as const

// ─── Bulk Transforms Card ──────────────────────────────────────────────────

function BulkTransformsCard() {
  const [running, setRunning] = useState<string | null>(null)
  const perms = useStudioPermissions()
  const canBulk = perms.can('studio:bulk-ops')

  const execute = useCallback(async (transform: typeof BULK_TRANSFORMS[number]) => {
    setRunning(transform.id)
    try {
      const result: BulkTransformResult = await transform.fn()
      if (result.success) {
        toast.success(`${result.label}: ${result.affected} item${result.affected !== 1 ? 's' : ''} affected`)
      } else {
        toast.error(`${result.label}: ${result.error}`)
      }
    } catch (err) {
      toast.error(`Transform failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setRunning(null)
    }
  }, [])

  return (
    <Card className="border-border/50 bg-card/50">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <Lightning className="h-4 w-4 text-primary" weight="duotone" />
        <span className="text-sm font-semibold">Bulk Transforms</span>
      </div>
      <div className="p-3 space-y-1.5">
        {BULK_TRANSFORMS.map(t => (
          <Button
            key={t.id}
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-8 gap-2"
            disabled={running !== null || !canBulk}
            title={!canBulk ? perms.why('studio:bulk-ops') : undefined}
            onClick={() => execute(t)}
          >
            {running === t.id ? (
              <CircleNotch className="h-3 w-3 animate-spin" />
            ) : (
              <Lightning className="h-3 w-3" />
            )}
            {t.label}
          </Button>
        ))}
      </div>
    </Card>
  )
}

// ─── Safety Snapshots Card ─────────────────────────────────────────────────

function SafetySnapshotsCard() {
  const [snapshots, setSnapshots] = useState<SafetySnapshot[]>(() => getSafetySnapshots())
  const perms = useStudioPermissions()
  const canExport = perms.can('studio:export-snapshot')
  const canManage = perms.can('studio:manage-snapshots')

  const refresh = useCallback(() => setSnapshots(getSafetySnapshots()), [])

  return (
    <Card className="border-border/50 bg-card/50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" weight="duotone" />
          <span className="text-sm font-semibold">Safety Snapshots</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {snapshots.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={refresh} title="Refresh"
          >
            <ArrowsClockwise className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            disabled={!canExport}
            onClick={async () => { await downloadSnapshot(); toast.success('Snapshot downloaded') }}
            title={canExport ? 'Download current snapshot' : perms.why('studio:export-snapshot')}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          {snapshots.length > 0 && (
            <Button
              variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-400"
              disabled={!canManage}
              onClick={() => { clearSafetySnapshots(); refresh() }}
              title={canManage ? 'Clear all safety snapshots' : perms.why('studio:manage-snapshots')}
            >
              <Trash className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {snapshots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-xs">
          <Shield className="h-8 w-8 mb-2 opacity-30" />
          No safety snapshots this session
        </div>
      ) : (
        <ScrollArea className="max-h-[200px]">
          <div className="p-2 space-y-1">
            {[...snapshots].reverse().map(s => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs bg-muted/20 border border-border/20">
                <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="font-medium truncate flex-1">{s.label}</span>
                <Badge variant="outline" className="text-[8px] px-1 py-0">
                  {s.reason}
                </Badge>
                <span className="text-muted-foreground shrink-0">
                  {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  )
}

// ─── Main Governance Panel ─────────────────────────────────────────────────

export default function GovernancePanel() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Content Governance</h2>
        <p className="text-sm text-muted-foreground">
          Validation, readiness checks, safety snapshots, and bulk operations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ReadinessPanel />
        <ValidationAuditPanel />
        <BulkTransformsCard />
        <SafetySnapshotsCard />
      </div>
    </div>
  )
}
