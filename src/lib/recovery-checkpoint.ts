/**
 * Recovery Checkpoint System — Phase 3: Recovery Plane
 *
 * Creates immutable snapshots of all localStorage state, encrypted at rest.
 * Supports export to file (USB recovery), import from file, and in-browser
 * restore to any previous checkpoint.
 *
 * Storage keys enumerated from the content-validator registry, auth module,
 * audit ledger, and vault prefix scan.
 */

import { encryptData, decryptData } from './crypto'

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const CHECKPOINT_INDEX_KEY = 'founder-hub-recovery-index'
const CHECKPOINT_PREFIX = 'founder-hub-ckpt:'
const MAX_CHECKPOINTS = 20

/** All known application storage keys (non-vault). */
const APP_STORAGE_KEYS = [
  // Auth
  'founder-hub-session',
  'founder-hub-users',
  'founder-hub-login-attempts',
  'founder-hub-audit-log',
  'founder-hub-pending-2fa',
  'founder-hub-cred-fp',
  // Crypto
  'founder-hub-e2e-salt',
  // Audit
  'founder-hub_audit_ledger',
  'founder-hub_audit_checkpoints',
  // Content
  'founder-hub-settings',
  'founder-hub-sections',
  'founder-hub-projects',
  'founder-hub-court-cases',
  'founder-hub-proof-links',
  'founder-hub-contact-links',
  'founder-hub-profile',
  'founder-hub-about',
  'founder-hub-offerings',
  'founder-hub-investor',
  // Misc
  'founder-hub-archive',
  'founder-hub:deployments',
  'founder-hub:github-token',
  // Keyfile / recovery
  'founder-hub-admin-keyfile',
  'founder-hub-recovery-phrase-hash',
  'founder-hub-backup-codes',
] as const

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface CheckpointMeta {
  id: string
  label: string
  createdAt: string
  keyCount: number
  vaultKeyCount: number
  /** SHA-256 of the encrypted blob for tamper detection */
  integrityHash: string
}

export interface CheckpointPayload {
  _version: 1
  meta: Omit<CheckpointMeta, 'integrityHash'>
  appKeys: Record<string, string | null>
  vaultKeys: Record<string, string | null>
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function generateId(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(data: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(data),
  )
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('')
}

function scanVaultKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith('vault:')) keys.push(k)
  }
  return keys
}

/* ------------------------------------------------------------------ */
/*  Index management                                                  */
/* ------------------------------------------------------------------ */

function loadIndex(): CheckpointMeta[] {
  try {
    const raw = localStorage.getItem(CHECKPOINT_INDEX_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CheckpointMeta[]
  } catch {
    return []
  }
}

function saveIndex(index: CheckpointMeta[]): void {
  localStorage.setItem(CHECKPOINT_INDEX_KEY, JSON.stringify(index))
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/** List all stored checkpoints (newest first). */
export function listCheckpoints(): CheckpointMeta[] {
  return loadIndex()
}

/** Create a new checkpoint of all application + vault state. */
export async function createCheckpoint(label: string): Promise<CheckpointMeta> {
  const id = generateId()
  const now = new Date().toISOString()

  // Snapshot app keys
  const appKeys: Record<string, string | null> = {}
  for (const key of APP_STORAGE_KEYS) {
    appKeys[key] = localStorage.getItem(key)
  }

  // Snapshot vault keys (prefix scan)
  const vaultKeyNames = scanVaultKeys()
  const vaultKeys: Record<string, string | null> = {}
  for (const key of vaultKeyNames) {
    vaultKeys[key] = localStorage.getItem(key)
  }

  const meta: Omit<CheckpointMeta, 'integrityHash'> = {
    id,
    label,
    createdAt: now,
    keyCount: Object.keys(appKeys).length,
    vaultKeyCount: Object.keys(vaultKeys).length,
  }

  const payload: CheckpointPayload = { _version: 1, meta, appKeys, vaultKeys }
  const encrypted = await encryptData(payload)
  const integrityHash = await sha256Hex(encrypted)

  // Store encrypted checkpoint
  localStorage.setItem(CHECKPOINT_PREFIX + id, encrypted)

  // Update index
  const fullMeta: CheckpointMeta = { ...meta, integrityHash }
  const index = loadIndex()
  index.unshift(fullMeta)

  // Prune old checkpoints beyond max
  while (index.length > MAX_CHECKPOINTS) {
    const old = index.pop()
    if (old) localStorage.removeItem(CHECKPOINT_PREFIX + old.id)
  }

  saveIndex(index)
  return fullMeta
}

/** Restore application state from a stored checkpoint. */
export async function restoreCheckpoint(id: string): Promise<{ restored: number }> {
  const index = loadIndex()
  const meta = index.find(c => c.id === id)
  if (!meta) throw new Error(`Checkpoint ${id} not found`)

  const encrypted = localStorage.getItem(CHECKPOINT_PREFIX + id)
  if (!encrypted) throw new Error(`Checkpoint data missing for ${id}`)

  // Verify integrity
  const hash = await sha256Hex(encrypted)
  if (hash !== meta.integrityHash) {
    throw new Error('Checkpoint integrity check failed — data may be tampered')
  }

  const payload = await decryptData<CheckpointPayload>(encrypted)
  if (payload._version !== 1) throw new Error(`Unsupported checkpoint version: ${payload._version}`)

  let restored = 0

  // Restore app keys
  for (const [key, value] of Object.entries(payload.appKeys)) {
    if (value === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
    restored++
  }

  // Restore vault keys
  for (const [key, value] of Object.entries(payload.vaultKeys)) {
    if (value === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
    restored++
  }

  return { restored }
}

/** Delete a checkpoint by id. */
export function deleteCheckpoint(id: string): void {
  localStorage.removeItem(CHECKPOINT_PREFIX + id)
  const index = loadIndex().filter(c => c.id !== id)
  saveIndex(index)
}

/* ------------------------------------------------------------------ */
/*  File export / import (USB recovery package)                       */
/* ------------------------------------------------------------------ */

/** Export a checkpoint to an encrypted JSON file for offline storage. */
export async function exportCheckpointToFile(id: string): Promise<void> {
  const encrypted = localStorage.getItem(CHECKPOINT_PREFIX + id)
  if (!encrypted) throw new Error(`Checkpoint ${id} not found`)

  const index = loadIndex()
  const meta = index.find(c => c.id === id)

  const pkg = JSON.stringify({
    _type: 'founder-hub-recovery-package',
    _version: 1,
    _exported: new Date().toISOString(),
    checkpointId: id,
    meta: meta ?? null,
    data: encrypted,
  }, null, 2)

  const blob = new Blob([pkg], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `founder-hub-recovery-${id}-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Import a recovery package from file content and restore it. */
export async function importCheckpointFromFile(
  fileContent: string,
): Promise<{ meta: CheckpointMeta; restored: number }> {
  const pkg = JSON.parse(fileContent)
  if (pkg._type !== 'founder-hub-recovery-package' || pkg._version !== 1) {
    throw new Error('Invalid recovery package format')
  }

  const encrypted: string = pkg.data
  const meta: CheckpointMeta | null = pkg.meta

  // Decrypt to validate before restoring
  const payload = await decryptData<CheckpointPayload>(encrypted)
  if (payload._version !== 1) throw new Error(`Unsupported checkpoint version`)

  // Store it locally so we have a record
  const id = payload.meta.id
  localStorage.setItem(CHECKPOINT_PREFIX + id, encrypted)

  const integrityHash = await sha256Hex(encrypted)
  const fullMeta: CheckpointMeta = meta
    ? { ...meta, integrityHash }
    : { ...payload.meta, integrityHash }

  const index = loadIndex()
  if (!index.find(c => c.id === id)) {
    index.unshift(fullMeta)
    saveIndex(index)
  }

  // Now restore
  const result = await restoreCheckpoint(id)
  return { meta: fullMeta, restored: result.restored }
}

/** Export ALL localStorage data as a full-state encrypted backup. */
export async function exportFullStateBackup(): Promise<void> {
  const allKeys: Record<string, string | null> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) allKeys[key] = localStorage.getItem(key)
  }

  const payload = {
    _type: 'founder-hub-full-backup',
    _version: 1,
    _created: new Date().toISOString(),
    keyCount: Object.keys(allKeys).length,
    keys: allKeys,
  }

  const encrypted = await encryptData(payload)
  const pkg = JSON.stringify({
    _type: 'founder-hub-full-backup-package',
    _version: 1,
    _exported: new Date().toISOString(),
    data: encrypted,
  }, null, 2)

  const blob = new Blob([pkg], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `founder-hub-full-backup-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Import and restore a full-state backup from file content. */
export async function importFullStateBackup(fileContent: string): Promise<{ restored: number }> {
  const pkg = JSON.parse(fileContent)
  if (pkg._type !== 'founder-hub-full-backup-package' || pkg._version !== 1) {
    throw new Error('Invalid full backup package format')
  }

  const payload = await decryptData<{
    _type: string
    _version: number
    keys: Record<string, string | null>
  }>(pkg.data)

  if (payload._type !== 'founder-hub-full-backup' || payload._version !== 1) {
    throw new Error('Corrupted backup payload')
  }

  let restored = 0
  for (const [key, value] of Object.entries(payload.keys)) {
    if (value === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
    restored++
  }

  return { restored }
}
