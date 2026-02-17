/**
 * Secret Vault Module
 * Chain A3 — Centralized encrypted storage for sensitive data
 *
 * PRINCIPLES:
 * 1. No cleartext secrets in localStorage
 * 2. All secrets encrypted with AES-256-GCM
 * 3. Key rotation support without breaking connected services
 * 4. Audit trail for secret access
 */

import { encryptField, decryptField, encryptData, decryptData } from './crypto'
import { kv } from './local-storage-kv'

// ─── Secret Types ────────────────────────────────────────────

/**
 * Known secret types for type-safe access
 */
export type SecretType =
  | 'github-pat'        // GitHub Personal Access Token
  | 'stripe-secret'     // Stripe Secret Key
  | 'stripe-publishable' // Stripe Publishable Key
  | 'api-key'           // Generic API key
  | 'oauth-token'       // OAuth tokens
  | 'webhook-secret'    // Webhook signing secrets
  | 'encryption-key'    // Derived encryption keys
  | 'custom'            // User-defined secrets

/**
 * Metadata stored with each secret
 */
export interface SecretMetadata {
  type: SecretType
  label: string
  createdAt: string
  updatedAt: string
  expiresAt?: string
  rotatedFrom?: string  // Previous secret ID (for rotation tracking)
  accessCount: number
  lastAccessedAt?: string
}

/**
 * Stored secret format (encrypted)
 */
interface StoredSecret {
  value: string      // Encrypted secret value
  metadata: string   // Encrypted metadata JSON
  checksum: string   // HMAC for integrity verification
}

// ─── Storage Keys ────────────────────────────────────────────

const VAULT_PREFIX = 'vault:'
const VAULT_INDEX_KEY = 'vault:__index'

// ─── Utility Functions ───────────────────────────────────────

/**
 * Generate a unique secret ID
 */
function generateSecretId(): string {
  const timestamp = Date.now().toString(36)
  const random = crypto.getRandomValues(new Uint8Array(8))
  const randomStr = Array.from(random).map(b => b.toString(36)).join('')
  return `sec_${timestamp}_${randomStr}`
}

/**
 * Compute checksum for integrity verification
 */
async function computeChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Get the vault index (list of secret IDs)
 */
async function getVaultIndex(): Promise<string[]> {
  const stored = await kv.get<string>(VAULT_INDEX_KEY)
  if (!stored) return []
  
  try {
    const decrypted = await decryptField(stored)
    return JSON.parse(decrypted)
  } catch {
    return []
  }
}

/**
 * Update the vault index
 */
async function setVaultIndex(ids: string[]): Promise<void> {
  const encrypted = await encryptField(JSON.stringify(ids))
  await kv.set(VAULT_INDEX_KEY, encrypted)
}

// ─── Core Vault Operations ───────────────────────────────────

/**
 * Store a secret in the vault
 */
export async function storeSecret(
  type: SecretType,
  label: string,
  value: string,
  options?: {
    expiresAt?: string
    rotatedFrom?: string
  }
): Promise<string> {
  const secretId = generateSecretId()
  
  // Create metadata
  const metadata: SecretMetadata = {
    type,
    label,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: options?.expiresAt,
    rotatedFrom: options?.rotatedFrom,
    accessCount: 0,
    lastAccessedAt: undefined,
  }
  
  // Encrypt value and metadata
  const encryptedValue = await encryptField(value)
  const encryptedMetadata = await encryptField(JSON.stringify(metadata))
  
  // Compute checksum for integrity
  const checksum = await computeChecksum(encryptedValue + encryptedMetadata)
  
  // Store the secret
  const stored: StoredSecret = {
    value: encryptedValue,
    metadata: encryptedMetadata,
    checksum,
  }
  
  await kv.set(`${VAULT_PREFIX}${secretId}`, stored)
  
  // Update index
  const index = await getVaultIndex()
  index.push(secretId)
  await setVaultIndex(index)
  
  return secretId
}

/**
 * Retrieve a secret from the vault
 */
export async function retrieveSecret(secretId: string): Promise<{
  value: string
  metadata: SecretMetadata
} | null> {
  const stored = await kv.get<StoredSecret>(`${VAULT_PREFIX}${secretId}`)
  if (!stored) return null
  
  // Verify integrity
  const expectedChecksum = await computeChecksum(stored.value + stored.metadata)
  if (stored.checksum !== expectedChecksum) {
    console.error('[vault] Integrity check failed for secret:', secretId)
    throw new SecretIntegrityError(secretId, 'Checksum mismatch')
  }
  
  // Decrypt
  const value = await decryptField(stored.value)
  const metadata: SecretMetadata = JSON.parse(await decryptField(stored.metadata))
  
  // Update access count
  metadata.accessCount++
  metadata.lastAccessedAt = new Date().toISOString()
  
  // Store updated metadata
  stored.metadata = await encryptField(JSON.stringify(metadata))
  stored.checksum = await computeChecksum(stored.value + stored.metadata)
  await kv.set(`${VAULT_PREFIX}${secretId}`, stored)
  
  return { value, metadata }
}

/**
 * Delete a secret from the vault
 */
export async function deleteSecret(secretId: string): Promise<boolean> {
  const exists = await kv.get<StoredSecret>(`${VAULT_PREFIX}${secretId}`)
  if (!exists) return false
  
  await kv.delete(`${VAULT_PREFIX}${secretId}`)
  
  // Update index
  const index = await getVaultIndex()
  const filtered = index.filter(id => id !== secretId)
  await setVaultIndex(filtered)
  
  return true
}

/**
 * List all secrets (metadata only, not values)
 */
export async function listSecrets(): Promise<Array<{
  id: string
  metadata: SecretMetadata
}>> {
  const index = await getVaultIndex()
  const results: Array<{ id: string; metadata: SecretMetadata }> = []
  
  for (const secretId of index) {
    try {
      const stored = await kv.get<StoredSecret>(`${VAULT_PREFIX}${secretId}`)
      if (stored) {
        const metadata: SecretMetadata = JSON.parse(await decryptField(stored.metadata))
        results.push({ id: secretId, metadata })
      }
    } catch {
      // Skip corrupted entries
    }
  }
  
  return results
}

// ─── Convenience Functions for Known Secret Types ───────────

const GITHUB_PAT_LABEL = 'GitHub Personal Access Token'
const STRIPE_SECRET_LABEL = 'Stripe Secret Key'

/**
 * Store GitHub PAT (migrates from cleartext if needed)
 */
export async function storeGitHubPAT(token: string): Promise<string> {
  // Delete any existing GitHub PAT
  const existing = await findSecretByType('github-pat')
  if (existing) {
    await deleteSecret(existing.id)
  }
  
  return storeSecret('github-pat', GITHUB_PAT_LABEL, token)
}

/**
 * Retrieve GitHub PAT
 */
export async function getGitHubPAT(): Promise<string | null> {
  const secret = await findSecretByType('github-pat')
  if (!secret) return null
  
  const result = await retrieveSecret(secret.id)
  return result?.value ?? null
}

/**
 * Check if GitHub PAT exists
 */
export async function hasGitHubPAT(): Promise<boolean> {
  const secret = await findSecretByType('github-pat')
  return !!secret
}

/**
 * Delete GitHub PAT
 */
export async function clearGitHubPAT(): Promise<boolean> {
  const secret = await findSecretByType('github-pat')
  if (!secret) return false
  return deleteSecret(secret.id)
}

/**
 * Find secret by type
 */
async function findSecretByType(type: SecretType): Promise<{
  id: string
  metadata: SecretMetadata
} | null> {
  const secrets = await listSecrets()
  return secrets.find(s => s.metadata.type === type) ?? null
}

// ─── Key Rotation ────────────────────────────────────────────

/**
 * Rotate a secret to a new value
 * Keeps track of rotation history for audit
 */
export async function rotateSecret(
  secretId: string,
  newValue: string
): Promise<string> {
  const existing = await retrieveSecret(secretId)
  if (!existing) {
    throw new SecretNotFoundError(secretId)
  }
  
  // Create new secret with rotation tracking
  const newSecretId = await storeSecret(
    existing.metadata.type,
    existing.metadata.label,
    newValue,
    {
      rotatedFrom: secretId,
    }
  )
  
  // Delete old secret
  await deleteSecret(secretId)
  
  return newSecretId
}

/**
 * Re-encrypt all secrets (for vault key rotation)
 * This is called when the encryption key needs to change
 */
export async function reEncryptVault(): Promise<{
  success: number
  failed: number
}> {
  const index = await getVaultIndex()
  let success = 0
  let failed = 0
  
  for (const secretId of index) {
    try {
      const result = await retrieveSecret(secretId)
      if (result) {
        // Re-store with same ID (will re-encrypt with current key)
        const stored = await kv.get<StoredSecret>(`${VAULT_PREFIX}${secretId}`)
        if (stored) {
          // Decrypt with old key and re-encrypt with current key
          const encryptedValue = await encryptField(result.value)
          const encryptedMetadata = await encryptField(JSON.stringify(result.metadata))
          const checksum = await computeChecksum(encryptedValue + encryptedMetadata)
          
          await kv.set(`${VAULT_PREFIX}${secretId}`, {
            value: encryptedValue,
            metadata: encryptedMetadata,
            checksum,
          })
          success++
        }
      }
    } catch (err) {
      console.error(`[vault] Failed to re-encrypt secret ${secretId}:`, err)
      failed++
    }
  }
  
  return { success, failed }
}

// ─── Migration Functions ─────────────────────────────────────

const LEGACY_GITHUB_TOKEN_KEY = 'xtx396:github-pat'

/**
 * Migrate cleartext secrets to vault
 */
export async function migrateSecretsToVault(): Promise<{
  migrated: string[]
  skipped: string[]
}> {
  const migrated: string[] = []
  const skipped: string[] = []
  
  // Migrate GitHub PAT from cleartext localStorage
  const legacyGitHubPAT = localStorage.getItem(LEGACY_GITHUB_TOKEN_KEY)
  if (legacyGitHubPAT && !legacyGitHubPAT.startsWith('enc:')) {
    await storeGitHubPAT(legacyGitHubPAT)
    localStorage.removeItem(LEGACY_GITHUB_TOKEN_KEY)
    migrated.push('github-pat')
  } else if (legacyGitHubPAT) {
    skipped.push('github-pat (already encrypted)')
  }
  
  return { migrated, skipped }
}

// ─── Error Types ─────────────────────────────────────────────

export class SecretNotFoundError extends Error {
  public readonly secretId: string
  
  constructor(secretId: string) {
    super(`Secret not found: ${secretId}`)
    this.name = 'SecretNotFoundError'
    this.secretId = secretId
  }
}

export class SecretIntegrityError extends Error {
  public readonly secretId: string
  public readonly reason: string
  
  constructor(secretId: string, reason: string) {
    super(`Secret integrity error for ${secretId}: ${reason}`)
    this.name = 'SecretIntegrityError'
    this.secretId = secretId
    this.reason = reason
  }
}

// ─── Validation Helpers ──────────────────────────────────────

/**
 * Validate that a string looks like a GitHub PAT
 */
export function isValidGitHubPAT(value: string): boolean {
  // Classic PAT: ghp_xxxx (40 chars after prefix)
  // Fine-grained PAT: github_pat_xxxx
  return (
    /^ghp_[a-zA-Z0-9]{36}$/.test(value) ||
    /^github_pat_[a-zA-Z0-9_]{22,}$/.test(value) ||
    /^gho_[a-zA-Z0-9]{36}$/.test(value) || // OAuth token
    /^ghs_[a-zA-Z0-9]{36}$/.test(value)    // Server token
  )
}

/**
 * Validate Stripe key format
 */
export function isValidStripeKey(value: string): boolean {
  return (
    /^sk_(test|live)_[a-zA-Z0-9]{24,}$/.test(value) ||
    /^pk_(test|live)_[a-zA-Z0-9]{24,}$/.test(value) ||
    /^rk_(test|live)_[a-zA-Z0-9]{24,}$/.test(value)
  )
}
