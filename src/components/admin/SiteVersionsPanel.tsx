/**
 * Site Versions Panel (CP1)
 *
 * Admin UI for viewing and managing site version history.
 * Features:
 * - List versions with timestamps and labels
 * - Create new version snapshots
 * - Restore previous versions
 * - Compare versions (future)
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  FloppyDisk,
  ClockCounterClockwise,
  Tag,
  Hash,
  User,
  Clock,
  ArrowCounterClockwise,
} from '@phosphor-icons/react'
import type { SiteVersion } from '@/lib/types'
import { getSiteVersioningService } from '@/lib/site-versioning'

interface SiteVersionsPanelProps {
  siteId: string
  /** User ID for version attribution */
  userId?: string
  /** Currently active version ID */
  currentVersionId?: string
  /** Live/deployed version ID */
  liveVersionId?: string
  /** Callback when a version is created or restored */
  onVersionChange?: () => void
}

export function SiteVersionsPanel({
  siteId,
  userId,
  currentVersionId,
  liveVersionId,
  onVersionChange,
}: SiteVersionsPanelProps) {
  const [versions, setVersions] = useState<SiteVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState<SiteVersion | null>(null)
  const [newVersionLabel, setNewVersionLabel] = useState('')
  const [newVersionNotes, setNewVersionNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const loadVersions = useCallback(async () => {
    setLoading(true)
    try {
      const service = getSiteVersioningService()
      const list = await service.listVersions(siteId)
      setVersions(list)
    } catch (err) {
      console.error('Failed to load versions:', err)
      toast.error('Failed to load version history')
    } finally {
      setLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  const handleCreateVersion = async () => {
    setSaving(true)
    try {
      const service = getSiteVersioningService()
      const version = await service.createVersion(
        siteId,
        userId ?? 'admin',
        newVersionLabel || undefined,
        newVersionNotes || undefined,
      )
      toast.success(`Version created: ${version.label || version.versionId.slice(0, 8)}`)
      setShowCreateDialog(false)
      setNewVersionLabel('')
      setNewVersionNotes('')
      await loadVersions()
      onVersionChange?.()
    } catch (err) {
      console.error('Failed to create version:', err)
      toast.error('Failed to create version')
    } finally {
      setSaving(false)
    }
  }

  const handleRestoreVersion = async () => {
    if (!restoreTarget) return
    setSaving(true)
    try {
      const service = getSiteVersioningService()
      await service.restoreVersion(siteId, restoreTarget.versionId, 'admin')
      toast.success(`Restored to: ${restoreTarget.label || restoreTarget.versionId.slice(0, 8)}`)
      setShowRestoreDialog(false)
      setRestoreTarget(null)
      await loadVersions()
      onVersionChange?.()
    } catch (err) {
      console.error('Failed to restore version:', err)
      toast.error('Failed to restore version')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Version History</h3>
          <p className="text-sm text-muted-foreground">
            {versions.length} version{versions.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <FloppyDisk className="h-4 w-4 mr-2" />
          Save Snapshot
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading versions...
        </div>
      ) : versions.length === 0 ? (
        <GlassCard className="p-6 text-center">
          <ClockCounterClockwise className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No versions yet. Save a snapshot to track changes.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {versions.map((version, index) => (
            <GlassCard key={version.versionId} className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Tag className="h-5 w-5 text-primary" weight="duotone" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">
                      {version.label || `Snapshot ${versions.length - index}`}
                    </span>
                    {version.versionId === currentVersionId && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                        Current
                      </span>
                    )}
                    {version.versionId === liveVersionId && (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                        Live
                      </span>
                    )}
                    {index === 0 && version.versionId !== currentVersionId && (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                        Latest
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(version.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {version.createdBy}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-xs">
                      <Hash className="h-3.5 w-3.5" />
                      {version.dataHash.slice(0, 8)}
                    </span>
                  </div>
                  {version.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      {version.notes}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  {version.versionId !== currentVersionId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRestoreTarget(version)
                        setShowRestoreDialog(true)
                      }}
                    >
                      <ArrowCounterClockwise className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create Version Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Version Snapshot</DialogTitle>
            <DialogDescription>
              Create an immutable snapshot of the current site state.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="version-label">Label (optional)</Label>
              <Input
                id="version-label"
                placeholder="e.g., v1.2.0, Pre-launch"
                value={newVersionLabel}
                onChange={(e) => setNewVersionLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version-notes">Notes (optional)</Label>
              <Input
                id="version-notes"
                placeholder="What changed in this version?"
                value={newVersionNotes}
                onChange={(e) => setNewVersionNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateVersion} disabled={saving}>
              {saving ? 'Saving...' : 'Save Snapshot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Version</DialogTitle>
            <DialogDescription>
              This will revert the site content to the selected snapshot.
              A new version will be created to record this restore action.
            </DialogDescription>
          </DialogHeader>
          {restoreTarget && (
            <div className="py-4">
              <GlassCard className="p-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <span className="font-semibold">
                    {restoreTarget.label || `Snapshot ${restoreTarget.versionId.slice(0, 8)}`}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Created: {formatDate(restoreTarget.createdAt)}
                </p>
                <p className="text-sm text-muted-foreground font-mono">
                  Hash: {restoreTarget.dataHash.slice(0, 16)}...
                </p>
              </GlassCard>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRestoreDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRestoreVersion}
              disabled={saving}
            >
              {saving ? 'Restoring...' : 'Restore Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SiteVersionsPanel
