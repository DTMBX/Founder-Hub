/**
 * Provenance Panel (Chain B4)
 *
 * Admin UI component for displaying build provenance attestation.
 * Shows verification status, build details, and artifact integrity.
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  ShieldWarning,
  GitBranch,
  Clock,
  Package,
  Hash,
  ArrowSquareOut,
  CircleNotch,
  DownloadSimple,
  ArrowClockwise,
} from '@phosphor-icons/react'
import {
  getCurrentSiteProvenance,
  createProvenanceSummary,
  exportProvenanceRecord,
  type ProvenanceVerification,
  type ProvenanceSummary,
} from '@/lib/provenance'

// ─── Verification Status Badge ───────────────────────────────

const STATUS_CONFIG = {
  verified: {
    icon: ShieldCheck,
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    label: 'Verified',
  },
  unverified: {
    icon: ShieldWarning,
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    label: 'Unverified',
  },
  unavailable: {
    icon: ShieldWarning,
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    label: 'Unavailable',
  },
  mismatch: {
    icon: ShieldWarning,
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    label: 'Mismatch',
  },
} as const

function VerificationBadge({ status }: { status: ProvenanceVerification['status'] }) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  return (
    <Badge variant="outline" className={`${config.color} gap-1`}>
      <Icon className="h-3.5 w-3.5" weight="fill" />
      {config.label}
    </Badge>
  )
}

// ─── Detail Row ──────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
  mono = false,
  link,
}: {
  icon: typeof GitBranch
  label: string
  value: string
  mono?: boolean
  link?: string
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm text-primary hover:underline flex items-center gap-1 ${
              mono ? 'font-mono' : ''
            }`}
          >
            {value}
            <ArrowSquareOut className="h-3 w-3" />
          </a>
        ) : (
          <div className={`text-sm truncate ${mono ? 'font-mono' : ''}`}>{value}</div>
        )}
      </div>
    </div>
  )
}

// ─── Main Panel ──────────────────────────────────────────────

export function ProvenancePanel() {
  const [verification, setVerification] = useState<ProvenanceVerification | null>(null)
  const [summary, setSummary] = useState<ProvenanceSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProvenance = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getCurrentSiteProvenance()
      setVerification(result)
      
      if (result.available && result.provenance) {
        setSummary(createProvenanceSummary(result.provenance))
      } else {
        setSummary(null)
      }
    } catch (error) {
      console.error('Failed to load provenance:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProvenance()
  }, [loadProvenance])

  const handleExport = () => {
    if (verification?.provenance) {
      exportProvenanceRecord(verification.provenance)
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-8">
          <CircleNotch className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading provenance...</span>
        </div>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Build Provenance
            {verification && <VerificationBadge status={verification.status} />}
          </h3>
          <p className="text-sm text-muted-foreground">
            Verifiable attestation of build origin and integrity
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadProvenance}>
            <ArrowClockwise className="h-4 w-4" />
          </Button>
          {verification?.provenance && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <DownloadSimple className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Status Card */}
      <GlassCard className="p-4">
        {!verification?.available ? (
          <div className="text-center py-6">
            <ShieldWarning className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              {verification?.reason ?? 'Provenance information not available'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Provenance is generated during CI/CD builds.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Verification Status */}
            <div className="flex items-center gap-2 mb-4">
              {verification.verified ? (
                <ShieldCheck className="h-5 w-5 text-green-400" weight="fill" />
              ) : (
                <ShieldWarning className="h-5 w-5 text-yellow-400" weight="fill" />
              )}
              <span className="text-sm">
                {verification.reason}
              </span>
            </div>

            {summary && (
              <>
                {/* Commit Info */}
                <DetailRow
                  icon={GitBranch}
                  label="Commit"
                  value={summary.commitSha}
                  mono
                  link={`https://github.com/${summary.repository}/commit/${summary.commitSha}`}
                />

                {/* Workflow Run */}
                <DetailRow
                  icon={Clock}
                  label="Built"
                  value={`${formatDate(summary.builtAt)} (Run #${summary.runId})`}
                  link={summary.runUrl}
                />

                {/* Ref */}
                <DetailRow
                  icon={GitBranch}
                  label="Ref"
                  value={summary.ref}
                />

                {/* Artifact Stats */}
                <DetailRow
                  icon={Package}
                  label="Artifacts"
                  value={`${summary.artifacts.fileCount} files (${summary.artifacts.sizeFormatted})`}
                />

                {/* Hashes */}
                <div className="pt-2 border-t border-border/50 mt-2">
                  <DetailRow
                    icon={Hash}
                    label="Manifest Hash"
                    value={summary.manifestHash}
                    mono
                  />
                  <DetailRow
                    icon={Hash}
                    label="Provenance Hash"
                    value={summary.provenanceHash || 'N/A'}
                    mono
                  />
                </div>

                {/* Signature Status */}
                <div className="pt-2 border-t border-border/50 mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    {summary.signature.verified ? (
                      <>
                        <ShieldCheck className="h-4 w-4 text-green-400" />
                        <span>Commit signature verified</span>
                      </>
                    ) : (
                      <>
                        <ShieldWarning className="h-4 w-4 text-yellow-400" />
                        <span className="text-muted-foreground">
                          Signature: {summary.signature.reason}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </GlassCard>

      {/* Info Note */}
      <p className="text-xs text-muted-foreground">
        Provenance records are generated during GitHub Actions builds and attested to
        the deployed artifacts. This ensures traceability from source code to production.
      </p>
    </div>
  )
}

export default ProvenancePanel
