import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth, logAudit } from '@/lib/auth'
import { kv } from '@/lib/local-storage-kv'
import { hashPasswordPBKDF2 } from '@/lib/crypto'
import type { User, UserRole } from '@/lib/types'
import { Trash, PencilSimple, Plus, ShieldCheck } from '@phosphor-icons/react'
import { useReauthGate } from './ReauthDialog'

const USERS_KEY = 'founder-hub-users'
const ROLES: UserRole[] = ['owner', 'admin', 'editor', 'support']
const ROLE_COLORS: Record<UserRole, string> = {
  owner: 'bg-red-500/20 text-red-400',
  admin: 'bg-amber-500/20 text-amber-400',
  editor: 'bg-blue-500/20 text-blue-400',
  support: 'bg-slate-500/20 text-slate-400',
}

export default function UserManagement() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add-user form state
  const [showAdd, setShowAdd] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('editor')
  const [saving, setSaving] = useState(false)

  // Edit-role state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<UserRole>('editor')

  const isOwner = currentUser?.role === 'owner'
  const [gate, ReauthGate] = useReauthGate()

  async function loadUsers() {
    try {
      const data = await kv.get<User[]>(USERS_KEY)
      setUsers(data || [])
    } catch {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  async function handleAdd() {
    if (!currentUser || !isOwner) return
    if (!newEmail.trim() || !newPassword) {
      setError('Email and password are required')
      return
    }
    if (newPassword.length < 12) {
      setError('Password must be at least 12 characters')
      return
    }
    if (users.some(u => u.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      setError('A user with that email already exists')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const { hash, salt } = await hashPasswordPBKDF2(newPassword)
      const newUser: User = {
        id: crypto.randomUUID(),
        email: newEmail.trim().toLowerCase(),
        passwordHash: hash,
        passwordSalt: salt,
        role: newRole,
        lastLogin: 0,
        createdAt: Date.now(),
      }
      const updated = [...users, newUser]
      await kv.set(USERS_KEY, updated)
      setUsers(updated)
      setShowAdd(false)
      setNewEmail('')
      setNewPassword('')
      setNewRole('editor')
      await logAudit(currentUser.id, currentUser.email, 'user_created', `Created user ${newUser.email} (${newUser.role})`, 'auth', newUser.id)
    } catch {
      setError('Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  async function handleRoleChange(userId: string) {
    if (!currentUser || !isOwner) return
    const target = users.find(u => u.id === userId)
    if (!target) return

    const updated = users.map(u => u.id === userId ? { ...u, role: editRole } : u)
    await kv.set(USERS_KEY, updated)
    setUsers(updated)
    setEditingId(null)
    await logAudit(currentUser.id, currentUser.email, 'role_changed', `Changed ${target.email} role to ${editRole}`, 'auth', userId)
  }

  async function handleDelete(userId: string) {
    if (!currentUser || !isOwner) return
    if (userId === currentUser.id) return
    const target = users.find(u => u.id === userId)
    if (!target) return

    const updated = users.filter(u => u.id !== userId)
    await kv.set(USERS_KEY, updated)
    setUsers(updated)
    await logAudit(currentUser.id, currentUser.email, 'user_deleted', `Deleted user ${target.email}`, 'auth', userId)
  }

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <ShieldCheck className="mr-2 h-5 w-5" />
        Owner role required to manage users.
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading users…</div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">User Management</h2>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-4 w-4 mr-1" /> Add User
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {showAdd && (
        <div className="border rounded-lg p-4 space-y-3 bg-card">
          <input
            type="email"
            placeholder="Email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm"
          />
          <input
            type="password"
            placeholder="Password (min 12 chars)"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm"
            autoComplete="new-password"
          />
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value as UserRole)}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm"
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={saving}>
              {saving ? 'Creating…' : 'Create User'}
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-lg divide-y">
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3 gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{u.email}</p>
              <p className="text-xs text-muted-foreground">
                Last login: {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                {u.twoFactorEnabled && ' · 2FA ✓'}
                {u.keyfileEnabled && ' · Keyfile ✓'}
              </p>
            </div>

            {editingId === u.id ? (
              <div className="flex items-center gap-2">
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as UserRole)}
                  className="px-2 py-1 rounded border bg-background text-xs"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <Button size="sm" variant="outline" onClick={() => gate(() => handleRoleChange(u.id))}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge className={ROLE_COLORS[u.role]}>{u.role}</Badge>
                <Button size="sm" variant="ghost" onClick={() => { setEditingId(u.id); setEditRole(u.role) }} title="Change role">
                  <PencilSimple className="h-4 w-4" />
                </Button>
                {u.id !== currentUser?.id && (
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => gate(() => handleDelete(u.id))} title="Delete user">
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
        {users.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">No users found.</p>
        )}
      </div>

      <ReauthGate />
    </div>
  )
}
