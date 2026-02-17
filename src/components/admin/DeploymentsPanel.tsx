/**
 * Deployments Panel (CP1)
 *
 * Admin UI for viewing deployment history.
 * Features:
 * - List deployments with status badges
 * - Show environment, timestamps, commit info
 * - View deployment logs
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Rocket,
  Clock,
  User,
  GitBranch,
  CheckCircle,
  XCircle,
  Spinner,
  ArrowCounterClockwise,
  Eye,
  Warning,
} from '@phosphor-icons/react'
import type { Deployment, DeploymentStatus, DeploymentEnvironment } from '@/lib/types'
import { getDeploymentService } from '@/lib/deployment-service'

interface DeploymentsPanelProps {
  siteId: string
  /** Maximum deployments to show (default: 20) */
  limit?: number
  /** Callback when deployment list changes */
  onDeploymentChange?: () => void
}

// ─── Status Badge ────────────────────────────────────────────

const STATUS_CONFIG: Record<
  DeploymentStatus,
  { icon: typeof CheckCircle; color: string; label: string }
> = {
  pending: { icon: Clock, color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending' },
  building: { icon: Spinner, color: 'bg-blue-500/20 text-blue-400', label: 'Building' },
  deploying: { icon: Rocket, color: 'bg-blue-500/20 text-blue-400', label: 'Deploying' },
  success: { icon: CheckCircle, color: 'bg-green-500/20 text-green-400', label: 'Success' },
  failed: { icon: XCircle, color: 'bg-red-500/20 text-red-400', label: 'Failed' },
  'rolled-back': { icon: ArrowCounterClockwise, color: 'bg-amber-500/20 text-amber-400', label: 'Rolled Back' },
  cancelled: { icon: XCircle, color: 'bg-gray-500/20 text-gray-400', label: 'Cancelled' },
}

function StatusBadge({ status }: { status: DeploymentStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${config.color}`}>
      <Icon className={`h-3.5 w-3.5 ${status === 'building' || status === 'deploying' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  )
}

// ─── Environment Badge ───────────────────────────────────────

const ENV_CONFIG: Record<DeploymentEnvironment, { color: string; label: string }> = {
  preview: { color: 'bg-purple-500/20 text-purple-400', label: 'Preview' },
  staging: { color: 'bg-amber-500/20 text-amber-400', label: 'Staging' },
  production: { color: 'bg-green-500/20 text-green-400', label: 'Production' },
}

function EnvironmentBadge({ env }: { env: DeploymentEnvironment }) {
  const config = ENV_CONFIG[env] ?? ENV_CONFIG.preview
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${config.color}`}>
      {config.label}
    </span>
  )
}

// ─── Main Panel ──────────────────────────────────────────────

export function DeploymentsPanel({
  siteId,
  limit = 20,
  onDeploymentChange,
}: DeploymentsPanelProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null)

  const loadDeployments = useCallback(async () => {
    setLoading(true)
    try {
      const service = getDeploymentService()
      const list = await service.listDeployments(siteId, limit)
      setDeployments(list)
    } catch (err) {
      console.error('Failed to load deployments:', err)
      toast.error('Failed to load deployment history')
    } finally {
      setLoading(false)
    }
  }, [siteId, limit])

  useEffect(() => {
    loadDeployments()
  }, [loadDeployments])

  // Expose reload for parent components
  useEffect(() => {
    if (onDeploymentChange) {
      // Parent can trigger reload via key change or other mechanism
    }
  }, [onDeploymentChange])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'In progress...'
    const ms = new Date(end).getTime() - new Date(start).getTime()
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
  }

  const handleViewLogs = (deployment: Deployment) => {
    setSelectedDeployment(deployment)
    setShowLogsDialog(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Deployment History</h3>
          <p className="text-sm text-muted-foreground">
            {deployments.length} deployment{deployments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadDeployments}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading deployments...
        </div>
      ) : deployments.length === 0 ? (
        <GlassCard className="p-6 text-center">
          <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No deployments yet. Deploy a version to see history here.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {deployments.map((deployment) => (
            <GlassCard key={deployment.deploymentId} className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Rocket className="h-5 w-5 text-primary" weight="duotone" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <EnvironmentBadge env={deployment.environment} />
                    <StatusBadge status={deployment.status} />
                    {deployment.previewUrl && (
                      <a
                        href={deployment.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View →
                      </a>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(deployment.startedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {deployment.deployedBy}
                    </span>
                    {deployment.completedAt && (
                      <span className="text-xs">
                        Duration: {formatDuration(deployment.startedAt, deployment.completedAt)}
                      </span>
                    )}
                  </div>
                  {deployment.commitSha && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-mono">
                      <GitBranch className="h-3.5 w-3.5" />
                      {deployment.commitSha.slice(0, 7)}
                      {deployment.buildHash && (
                        <span className="ml-2 text-muted-foreground/70">
                          build: {deployment.buildHash.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  )}
                  {deployment.errorMessage && (
                    <div className="mt-2 text-sm text-red-400 flex items-start gap-1">
                      <Warning className="h-4 w-4 shrink-0 mt-0.5" />
                      {deployment.errorMessage}
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewLogs(deployment)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Logs
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Deployment Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Deployment Logs
              {selectedDeployment && (
                <>
                  <EnvironmentBadge env={selectedDeployment.environment} />
                  <StatusBadge status={selectedDeployment.status} />
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedDeployment && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Started: {formatDate(selectedDeployment.startedAt)}</p>
                {selectedDeployment.completedAt && (
                  <p>Completed: {formatDate(selectedDeployment.completedAt)}</p>
                )}
                <p>Version: {selectedDeployment.versionId.slice(0, 8)}</p>
              </div>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-xs max-h-96 overflow-y-auto">
                {selectedDeployment.logs.length === 0 ? (
                  <p className="text-muted-foreground">No log entries</p>
                ) : (
                  selectedDeployment.logs.map((log, i) => (
                    <div
                      key={i}
                      className={`py-0.5 ${
                        log.level === 'error'
                          ? 'text-red-400'
                          : log.level === 'warn'
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    >
                      <span className="text-muted-foreground">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>{' '}
                      <span className="uppercase text-xs">[{log.level}]</span>{' '}
                      {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DeploymentsPanel
