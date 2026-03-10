/**
 * ValidationAuditPanel.tsx — Content validation audit display.
 *
 * Runs all KV-backed content through Zod schemas and shows
 * pass/fail/empty/missing status per module with error details.
 *
 * Triggered via the "Run Validation Audit" command or on-demand.
 */

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ShieldCheck,
  CircleNotch,
  CheckCircle,
  XCircle,
  MinusCircle,
  ArrowsClockwise,
  Info,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { runValidationAudit, type AuditReport, type AuditKeyResult } from '@/lib/validation-audit'

// ─── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pass: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Pass' },
  fail: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Fail' },
  empty: { icon: MinusCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Empty' },
  missing: { icon: Info, color: 'text-muted-foreground', bg: 'bg-muted/10', border: 'border-border/30', label: 'Missing' },
} as const

// ─── Result Row ─────────────────────────────────────────────────────────────

function AuditRow({ result }: { result: AuditKeyResult }) {
  const config = STATUS_CONFIG[result.status]
  const Icon = config.icon

  return (
    <div className={cn(
      'flex items-start gap-2 px-3 py-2 rounded-md text-xs border',
      config.bg, config.border,
    )}>
      <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', config.color)} weight="fill" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{result.label}</span>
          <Badge variant="outline" className={cn('text-[8px] px-1 py-0', config.color)}>
            {config.label}
          </Badge>
          {result.itemCount !== undefined && (
            <span className="text-muted-foreground">{result.itemCount} items</span>
          )}
        </div>
        {result.error && (
          <p className="text-muted-foreground mt-1 break-words">{result.error}</p>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ValidationAuditPanel() {
  const [report, setReport] = useState<AuditReport | null>(null)
  const [loading, setLoading] = useState(false)

  const runAudit = useCallback(async () => {
    setLoading(true)
    try {
      const result = await runValidationAudit()
      setReport(result)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <Card className="border-border/50 bg-card/50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" weight="duotone" />
          <span className="text-sm font-semibold">Validation Audit</span>
          {report && (
            <Badge variant={report.failCount > 0 ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
              {report.failCount > 0 ? `${report.failCount} issues` : 'All clear'}
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={runAudit}
          disabled={loading}
        >
          {loading ? (
            <CircleNotch className="h-3 w-3 animate-spin" />
          ) : (
            <ArrowsClockwise className="h-3 w-3" />
          )}
          {report ? 'Re-run' : 'Run Audit'}
        </Button>
      </div>

      {!report && !loading && (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-xs">
          <ShieldCheck className="h-8 w-8 mb-2 opacity-30" />
          Click "Run Audit" to validate all content
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-xs gap-2">
          <CircleNotch className="h-4 w-4 animate-spin" />
          Validating content...
        </div>
      )}

      {report && !loading && (
        <div className="p-3 space-y-3">
          {/* Summary */}
          <div className="flex items-center gap-3 text-xs px-1">
            <span className="text-green-400">{report.passCount} pass</span>
            {report.failCount > 0 && <span className="text-red-400">{report.failCount} fail</span>}
            {report.emptyCount > 0 && <span className="text-amber-400">{report.emptyCount} empty</span>}
            {report.missingCount > 0 && <span className="text-muted-foreground">{report.missingCount} missing</span>}
            <span className="ml-auto text-muted-foreground">
              {new Date(report.timestamp).toLocaleTimeString()}
            </span>
          </div>

          {/* Results */}
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-1">
              {report.results
                .sort((a, b) => {
                  // Failures first, then empty, then missing, then pass
                  const order = { fail: 0, empty: 1, missing: 2, pass: 3 }
                  return order[a.status] - order[b.status]
                })
                .map(result => (
                  <AuditRow key={result.key} result={result} />
                ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </Card>
  )
}
