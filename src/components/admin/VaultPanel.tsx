import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth, logAudit } from '@/lib/auth'
import {
  listSecrets,
  storeSecret,
  deleteSecret,
  rotateSecret,
  retrieveSecret,
} from '@/lib/secret-vault'
import type { SecretType, SecretMetadata } from '@/lib/secret-vault'
import { ShieldCheck, Trash, ArrowsClockwise, Plus, Eye, EyeSlash } from '@phosphor-icons/react'

const SECRET_TYPES: SecretType[] = ['github-pat', 'stripe-secret', 'stripe-publishable', 'api-key', 'oauth-token', 'webhook-secret', 'encryption-key', 'custom']
const TYPE_LABELS: Record<SecretType, string> = {
  'github-pat': 'GitHub PAT',
  'stripe-secret': 'Stripe Secret',
  'stripe-publishable': 'Stripe Publishable',
  'api-key': 'API Key',
  'oauth-token': 'OAuth Token',
  'webhook-secret': 'Webhook Secret',
  'encryption-key': 'Encryption Key',
  custom: 'Custom',
}

interface SecretRow {
  id: string
  metadata: SecretMetadata
}

export default function VaultPanel() {
  const { currentUser } = useAuth()
  const [secrets, setSecrets] = useState<SecretRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add form
  const [showAdd, setShowAdd] = useState(false)
  const [newType, setNewType] = useState<SecretType>('api-key')
  const [newLabel, setNewLabel] = useState('')
  const [newValue, setNewValue] = useState('')
  const [saving, setSaving] = useState(false)

  // Rotate form
  const [rotatingId, setRotatingId] = useState<string | null>(null)
  const [rotateValue, setRotateValue] = useState('')

  // Reveal
  const [revealedId, setRevealedId] = useState<string | null>(null)
  const [revealedValue, setRevealedValue] = useState<string | null>(null)

  const isOwner = currentUser?.role === 'owner'

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await listSecrets()
      setSecrets(data)
    } catch {
      setError('Failed to load vault. Encryption key may not be initialized.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    if (!currentUser || !isOwner) return
    if (!newLabel.trim() || !newValue) {
      setError('Label and value are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await storeSecret(newType, newLabel.trim(), newValue)
      setShowAdd(false)
      setNewLabel('')
      setNewValue('')
      setNewType('api-key')
      await logAudit(currentUser.id, currentUser.email, 'secret_stored', `Stored secret: ${newLabel.trim()} (${newType})`, 'vault', currentUser.id)
      await load()
    } catch {
      setError('Failed to store secret')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!currentUser || !isOwner) return
    const target = secrets.find(s => s.id === id)
    if (!target) return
    try {
      await deleteSecret(id)
      await logAudit(currentUser.id, currentUser.email, 'secret_deleted', `Deleted secret: ${target.metadata.label}`, 'vault', currentUser.id)
      await load()
    } catch {
      setError('Failed to delete secret')
    }
  }

  async function handleRotate(id: string) {
    if (!currentUser || !isOwner || !rotateValue) return
    const target = secrets.find(s => s.id === id)
    if (!target) return
    try {
      await rotateSecret(id, rotateValue)
      setRotatingId(null)
      setRotateValue('')
      await logAudit(currentUser.id, currentUser.email, 'secret_rotated', `Rotated secret: ${target.metadata.label}`, 'vault', currentUser.id)
      await load()
    } catch {
      setError('Failed to rotate secret')
    }
  }

  async function handleReveal(id: string) {
    if (revealedId === id) {
      setRevealedId(null)
      setRevealedValue(null)
      return
    }
    try {
      const result = await retrieveSecret(id)
      if (result) {
        setRevealedId(id)
        setRevealedValue(result.value)
        if (currentUser) {
          await logAudit(currentUser.id, currentUser.email, 'secret_accessed', `Revealed secret: ${result.metadata.label}`, 'vault', currentUser.id)
        }
      }
    } catch {
      setError('Failed to decrypt secret')
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function isExpired(meta: SecretMetadata) {
    return meta.expiresAt ? new Date(meta.expiresAt) < new Date() : false
  }

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <ShieldCheck className="mr-2 h-5 w-5" />
        Owner role required to manage the secret vault.
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading vault…</div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Secret Vault</h2>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-4 w-4 mr-1" /> Add Secret
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {showAdd && (
        <div className="border rounded-lg p-4 space-y-3 bg-card">
          <select
            value={newType}
            onChange={e => setNewType(e.target.value as SecretType)}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm"
          >
            {SECRET_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <input
            type="text"
            placeholder="Label"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm"
          />
          <input
            type="password"
            placeholder="Secret value"
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm"
            autoComplete="off"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={saving}>
              {saving ? 'Storing…' : 'Store Secret'}
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-lg divide-y">
        {secrets.map(s => (
          <div key={s.id} className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{s.metadata.label}</p>
                <p className="text-xs text-muted-foreground">
                  {TYPE_LABELS[s.metadata.type]} · Created {formatDate(s.metadata.createdAt)}
                  {s.metadata.accessCount > 0 && ` · ${s.metadata.accessCount} access${s.metadata.accessCount !== 1 ? 'es' : ''}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {isExpired(s.metadata) && <Badge variant="destructive" className="text-xs">Expired</Badge>}
                <Button size="sm" variant="ghost" onClick={() => handleReveal(s.id)} title={revealedId === s.id ? 'Hide' : 'Reveal'}>
                  {revealedId === s.id ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setRotatingId(rotatingId === s.id ? null : s.id); setRotateValue('') }} title="Rotate">
                  <ArrowsClockwise className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(s.id)} title="Delete">
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {revealedId === s.id && revealedValue && (
              <pre className="text-xs bg-muted/50 rounded px-3 py-2 overflow-x-auto font-mono break-all">{revealedValue}</pre>
            )}

            {rotatingId === s.id && (
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="New secret value"
                  value={rotateValue}
                  onChange={e => setRotateValue(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-md border bg-background text-sm"
                  autoComplete="off"
                />
                <Button size="sm" onClick={() => handleRotate(s.id)} disabled={!rotateValue}>Rotate</Button>
                <Button size="sm" variant="ghost" onClick={() => setRotatingId(null)}>Cancel</Button>
              </div>
            )}
          </div>
        ))}
        {secrets.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">Vault is empty.</p>
        )}
      </div>
    </div>
  )
}
