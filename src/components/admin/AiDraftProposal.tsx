/**
 * AiDraftProposal.tsx — Inline proposal review panel for AI suggestions.
 *
 * Shows current vs proposed values with Accept / Dismiss actions.
 * Renders below the field that triggered the suggestion.
 *
 * Rules:
 *  - AI may propose, never auto-commit
 *  - All proposals show current vs suggested side-by-side
 *  - Accept goes through editor.setField → history (source: 'ai')
 *  - Stubs are clearly marked as "AI Offline"
 */

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Check,
  X,
  Robot,
  CircleNotch,
  Lightning,
  Warning,
  ArrowRight,
} from '@phosphor-icons/react'
import type { AiProposal, AiProposalStatus } from '@/lib/ai-transform'
import DiffViewer from '@/components/admin/DiffViewer'

// ─── Props ──────────────────────────────────────────────────────────────────

interface AiDraftProposalProps {
  status: AiProposalStatus
  proposal: AiProposal | null
  error: string | null
  onAccept: (index: number) => void
  onDismiss: () => void
}

// ─── Loading state ──────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <Card className="p-4 border-blue-500/30 bg-blue-500/5 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3 text-blue-400">
        <CircleNotch className="h-5 w-5 animate-spin" />
        <div>
          <p className="text-sm font-medium">Generating suggestion...</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Asking local AI model for ideas
          </p>
        </div>
      </div>
    </Card>
  )
}

// ─── Error state ────────────────────────────────────────────────────────────

function ErrorState({ error, onDismiss }: { error: string; onDismiss: () => void }) {
  return (
    <Card className="p-4 border-amber-500/30 bg-amber-500/5 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 text-amber-400">
          <Warning className="h-4 w-4 mt-0.5 shrink-0" weight="fill" />
          <div>
            <p className="text-sm font-medium">Suggestion failed</p>
            <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}

// ─── Value display ──────────────────────────────────────────────────────────

function ValueDisplay({ value, label }: { value: unknown; label: string }) {
  if (Array.isArray(value)) {
    return (
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <div className="flex flex-wrap gap-1">
          {value.map((item, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {String(item)}
            </Badge>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <p className="text-sm whitespace-pre-wrap leading-relaxed">
        {String(value || '(empty)')}
      </p>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function AiDraftProposal({
  status,
  proposal,
  error,
  onAccept,
  onDismiss,
}: AiDraftProposalProps) {
  if (status === 'idle') return null
  if (status === 'loading') return <LoadingState />
  if (status === 'error' && error) return <ErrorState error={error} onDismiss={onDismiss} />
  if (status !== 'ready' || !proposal) return null

  return (
    <Card className="border-purple-500/30 bg-purple-500/5 overflow-hidden animate-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-purple-500/20 bg-purple-500/10">
        <div className="flex items-center gap-2">
          <Robot className="h-4 w-4 text-purple-400" weight="duotone" />
          <span className="text-sm font-medium text-purple-300">
            AI {proposal.type === 'rewrite' ? 'Rewrite' : 'Variants'} — {proposal.fieldLabel}
          </span>
          {proposal.isStub && (
            <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/40">
              Offline
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="max-h-[400px]">
        <div className="p-4 space-y-4">
          {/* Current value */}
          <div className="rounded-md border border-border/50 bg-muted/20 p-3">
            <ValueDisplay value={proposal.currentValue} label="Current" />
          </div>

          {/* Suggestions */}
          {proposal.suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="rounded-md border border-purple-500/20 bg-card/50 p-3 space-y-3"
            >
              <div className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <ValueDisplay value={suggestion.value} label={suggestion.label} />
                </div>
              </div>

              {/* Inline diff: current vs proposed */}
              <div className="border-t border-border/30 pt-2">
                <DiffViewer
                  before={proposal.currentValue}
                  after={suggestion.value}
                  maxHeight={200}
                  compact
                />
              </div>

              {!proposal.isStub && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-500/40 text-purple-300 hover:bg-purple-500/20"
                    onClick={() => onAccept(index)}
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" weight="bold" />
                    Accept
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Reasoning */}
          {proposal.reasoning && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2 border-t border-border/30">
              <Lightning className="h-3.5 w-3.5 mt-0.5 shrink-0 text-purple-400" />
              <p>{proposal.reasoning}</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
