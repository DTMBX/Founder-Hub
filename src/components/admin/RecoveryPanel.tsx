import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { HardDrive, Download, Upload, Trash, Plus, Clock, ShieldCheck } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  listCheckpoints,
  createCheckpoint,
  restoreCheckpoint,
  deleteCheckpoint,
  exportCheckpointToFile,
  importCheckpointFromFile,
  exportFullStateBackup,
  importFullStateBackup,
  type CheckpointMeta,
} from '@/lib/recovery-checkpoint'

export default function RecoveryPanel() {
  const [checkpoints, setCheckpoints] = useState<CheckpointMeta[]>([])
  const [label, setLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const fullImportRef = useRef<HTMLInputElement>(null)

  const refresh = () => setCheckpoints(listCheckpoints())
  useEffect(() => { refresh() }, [])

  const handleCreate = async () => {
    if (!label.trim()) {
      toast.error('Enter a label for this checkpoint')
      return
    }
    setCreating(true)
    try {
      await createCheckpoint(label.trim())
      toast.success('Checkpoint created')
      setLabel('')
      refresh()
    } catch {
      toast.error('Failed to create checkpoint')
    } finally {
      setCreating(false)
    }
  }

  const handleRestore = async (id: string) => {
    if (confirmRestore !== id) {
      setConfirmRestore(id)
      return
    }
    setRestoring(id)
    try {
      const { restored } = await restoreCheckpoint(id)
      toast.success(`Restored ${restored} keys — reloading...`)
      setTimeout(() => window.location.reload(), 1500)
    } catch {
      toast.error('Restore failed — checkpoint may be corrupted')
      setRestoring(null)
    }
    setConfirmRestore(null)
  }

  const handleDelete = (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id)
      return
    }
    deleteCheckpoint(id)
    toast.success('Checkpoint deleted')
    setConfirmDelete(null)
    refresh()
  }

  const handleExport = async (id: string) => {
    try {
      await exportCheckpointToFile(id)
      toast.success('Checkpoint exported')
    } catch {
      toast.error('Export failed')
    }
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const { meta, restored } = await importCheckpointFromFile(text)
      toast.success(`Imported "${meta.label}" — ${restored} keys restored. Reloading...`)
      setTimeout(() => window.location.reload(), 1500)
    } catch {
      toast.error('Import failed — invalid file format')
    }
    if (importRef.current) importRef.current.value = ''
  }

  const handleFullBackup = async () => {
    try {
      await exportFullStateBackup()
      toast.success('Full state backup exported')
    } catch {
      toast.error('Backup export failed')
    }
  }

  const handleFullRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const { restored } = await importFullStateBackup(text)
      toast.success(`Full backup restored (${restored} keys). Reloading...`)
      setTimeout(() => window.location.reload(), 1500)
    } catch {
      toast.error('Full restore failed — invalid backup file')
    }
    if (fullImportRef.current) fullImportRef.current.value = ''
  }

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Recovery & Backups
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Create encrypted snapshots of your application state. Checkpoints can be exported to files and restored later.
        </p>
      </div>

      {/* Create Checkpoint */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create Checkpoint</CardTitle>
          <CardDescription>Snapshot all application data (auth, content, vault keys)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Before major content update"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={creating || !label.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Checkpoint List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checkpoints ({checkpoints.length}/20)</CardTitle>
        </CardHeader>
        <CardContent>
          {checkpoints.length === 0 ? (
            <p className="text-sm text-muted-foreground">No checkpoints yet. Create one above.</p>
          ) : (
            <div className="space-y-3">
              {checkpoints.map(cp => (
                <div
                  key={cp.id}
                  className="flex items-center justify-between p-3 rounded-md border bg-card"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{cp.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {cp.keyCount} keys
                      </Badge>
                      {cp.vaultKeyCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          {cp.vaultKeyCount} vault
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(cp.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport(cp.id)}
                      title="Export to file"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(cp.id)}
                      disabled={restoring === cp.id}
                      title={confirmRestore === cp.id ? 'Click again to confirm' : 'Restore'}
                    >
                      {confirmRestore === cp.id ? (
                        <span className="text-xs text-amber-500 font-medium">Confirm?</span>
                      ) : restoring === cp.id ? (
                        <span className="text-xs">Restoring...</span>
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cp.id)}
                      title={confirmDelete === cp.id ? 'Click again to confirm' : 'Delete'}
                    >
                      {confirmDelete === cp.id ? (
                        <span className="text-xs text-destructive font-medium">Confirm?</span>
                      ) : (
                        <Trash className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full State Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Full State Backup</CardTitle>
          <CardDescription>Export or import the entire application state as an encrypted file</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" onClick={handleFullBackup}>
            <Download className="h-4 w-4 mr-1" />
            Export Full Backup
          </Button>
          <Button variant="outline" onClick={() => fullImportRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" />
            Import Full Backup
          </Button>
          <input
            ref={fullImportRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFullRestore}
          />
          <Button variant="outline" onClick={() => importRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" />
            Import Checkpoint File
          </Button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
        </CardContent>
      </Card>
    </div>
  )
}
