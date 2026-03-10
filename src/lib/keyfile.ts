/**
 * Hardware Keyfile Authentication
 * 
 * Generates encrypted keyfiles for USB-based admin access.
 * Admin login requires BOTH password AND valid keyfile.
 * 
 * Security model:
 * - Keyfile contains AES-256-GCM encrypted payload with device fingerprint
 * - Keyfile hash stored in user record for verification
 * - Can be stored on USB drive for portable secure access
 * - Lost keyfile = use backup codes or recovery phrase
 * 
 * Recovery options:
 * 1. USB Keyfile (primary) - stored on USB drive
 * 2. Encrypted Backup Code - stored encrypted with a separate passphrase
 * 3. Recovery Phrase - 12-word BIP39-style phrase for emergency access
 */

import { kv } from '@/lib/local-storage-kv'

const KEYFILE_VERSION = 'founder-hub-keyfile-v1'
const KEYFILE_LOCAL_KEY = 'founder-hub-admin-keyfile'
const BACKUP_CODES_KEY = 'founder-hub-admin-backup-codes'
const RECOVERY_PHRASE_HASH_KEY = 'founder-hub-recovery-phrase-hash'
const PBKDF2_ITERATIONS = 100_000
const BACKUP_CODES_COUNT = 8

export interface AdminKeyfile {
  version: string
  keyId: string
  encryptedPayload: string  // AES-256-GCM encrypted
  createdAt: number
  label: string             // e.g., "Home PC", "USB Backup"
}

interface KeyfilePayload {
  userId: string
  secret: string            // Random 256-bit secret
  deviceHint: string        // Browser/device hint for audit
  createdAt: number
}

export interface BackupCodeSet {
  codes: string[]           // 8 one-time backup codes
  usedCodes: string[]       // Codes that have been used
  encryptedAt: number
}

export interface RecoverySetup {
  keyfile: AdminKeyfile
  keyHash: string
  backupCodes: string[]
  recoveryPhrase: string
}

// ─── Key Generation ─────────────────────────────────────────

/**
 * Generate a new admin keyfile for a user
 */
export async function generateKeyfile(
  userId: string,
  password: string,
  label: string = 'Primary Key'
): Promise<{ keyfile: AdminKeyfile; keyHash: string }> {
  const keyId = `key_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  const secret = generateSecureRandom(32)
  
  const payload: KeyfilePayload = {
    userId,
    secret,
    deviceHint: getDeviceHint(),
    createdAt: Date.now()
  }
  
  // Encrypt payload with user's password
  const encryptedPayload = await encryptWithPassword(
    JSON.stringify(payload),
    password
  )
  
  const keyfile: AdminKeyfile = {
    version: KEYFILE_VERSION,
    keyId,
    encryptedPayload,
    createdAt: Date.now(),
    label
  }
  
  // Generate hash of the secret for storage in user record
  const keyHash = await hashSecret(secret)
  
  return { keyfile, keyHash }
}

/**
 * Verify a keyfile against stored hash
 */
export async function verifyKeyfile(
  keyfile: AdminKeyfile,
  password: string,
  storedKeyHash: string,
  userId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    if (keyfile.version !== KEYFILE_VERSION) {
      return { valid: false, error: 'Invalid keyfile version' }
    }
    
    // Decrypt payload
    const decrypted = await decryptWithPassword(keyfile.encryptedPayload, password)
    if (!decrypted) {
      return { valid: false, error: 'Wrong password or corrupted keyfile' }
    }
    
    const payload: KeyfilePayload = JSON.parse(decrypted)
    
    // Verify user ID matches
    if (payload.userId !== userId) {
      return { valid: false, error: 'Keyfile belongs to different user' }
    }
    
    // Verify secret hash matches
    const secretHash = await hashSecret(payload.secret)
    if (secretHash !== storedKeyHash) {
      return { valid: false, error: 'Keyfile has been revoked' }
    }
    
    return { valid: true }
  } catch (e) {
    console.error('[keyfile] Verification error:', e)
    return { valid: false, error: 'Invalid keyfile format' }
  }
}

// ─── Local Storage ─────────────────────────────────────────

/**
 * Store keyfile in browser (for home computer)
 */
export function storeKeyfileLocally(keyfile: AdminKeyfile): void {
  localStorage.setItem(KEYFILE_LOCAL_KEY, JSON.stringify(keyfile))
}

/**
 * Get stored local keyfile (if any)
 */
export function getLocalKeyfile(): AdminKeyfile | null {
  try {
    const stored = localStorage.getItem(KEYFILE_LOCAL_KEY)
    if (!stored) return null
    return JSON.parse(stored) as AdminKeyfile
  } catch {
    return null
  }
}

/**
 * Clear local keyfile
 */
export function clearLocalKeyfile(): void {
  localStorage.removeItem(KEYFILE_LOCAL_KEY)
}

/**
 * Check if keyfile is stored locally
 */
export function hasLocalKeyfile(): boolean {
  return localStorage.getItem(KEYFILE_LOCAL_KEY) !== null
}

// ─── File Export/Import ─────────────────────────────────────

/**
 * Export keyfile as downloadable JSON file
 */
export function exportKeyfileToFile(keyfile: AdminKeyfile): void {
  const blob = new Blob([JSON.stringify(keyfile, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `founder-hub-admin-key-${keyfile.label.toLowerCase().replace(/\s+/g, '-')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Parse keyfile from imported file content
 */
export function parseKeyfileFromContent(content: string): AdminKeyfile | null {
  try {
    const parsed = JSON.parse(content)
    if (parsed.version !== KEYFILE_VERSION || !parsed.keyId || !parsed.encryptedPayload) {
      return null
    }
    return parsed as AdminKeyfile
  } catch {
    return null
  }
}

// ─── Crypto Helpers ─────────────────────────────────────────

function generateSecureRandom(bytes: number): string {
  const array = crypto.getRandomValues(new Uint8Array(bytes))
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hashSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(secret + KEYFILE_VERSION)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function encryptWithPassword(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKeyFromPassword(password, salt)
  const encoder = new TextEncoder()
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  )
  
  // Format: salt(16) + iv(12) + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length)
  
  return btoa(String.fromCharCode(...combined))
}

async function decryptWithPassword(encrypted: string, password: string): Promise<string | null> {
  try {
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
    
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const ciphertext = combined.slice(28)
    
    const key = await deriveKeyFromPassword(password, salt)
    
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    )
    
    return new TextDecoder().decode(plaintext)
  } catch {
    return null
  }
}

function getDeviceHint(): string {
  const ua = navigator.userAgent
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  if (ua.includes('Android')) return 'Android'
  return 'Unknown'
}

// ─── Backup Codes ─────────────────────────────────────────

/**
 * Generate one-time backup codes for emergency access
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    // Format: XXXX-XXXX-XXXX (12 chars)
    const part1 = generateSecureRandom(2).toUpperCase()
    const part2 = generateSecureRandom(2).toUpperCase()
    const part3 = generateSecureRandom(2).toUpperCase()
    codes.push(`${part1}-${part2}-${part3}`)
  }
  return codes
}

/**
 * Hash backup codes for secure storage
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map(code => hashSecret(code.replace(/-/g, ''))))
}

/**
 * Verify a backup code against stored hashes
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[],
  usedHashes: string[]
): Promise<{ valid: boolean; usedHash?: string; error?: string }> {
  const normalizedCode = code.replace(/-/g, '').toUpperCase()
  const codeHash = await hashSecret(normalizedCode)
  
  if (usedHashes.includes(codeHash)) {
    return { valid: false, error: 'This backup code has already been used' }
  }
  
  if (hashedCodes.includes(codeHash)) {
    return { valid: true, usedHash: codeHash }
  }
  
  return { valid: false, error: 'Invalid backup code' }
}

/**
 * Store encrypted backup code hashes
 */
export async function storeBackupCodes(
  hashedCodes: string[],
  encryptionPassphrase: string
): Promise<void> {
  const data: BackupCodeSet = {
    codes: hashedCodes,
    usedCodes: [],
    encryptedAt: Date.now()
  }
  const encrypted = await encryptWithPassword(JSON.stringify(data), encryptionPassphrase)
  await kv.set(BACKUP_CODES_KEY, encrypted)
}

/**
 * Get and decrypt backup codes
 */
export async function getBackupCodes(encryptionPassphrase: string): Promise<BackupCodeSet | null> {
  const encrypted = await kv.get<string>(BACKUP_CODES_KEY)
  if (!encrypted) return null
  
  try {
    const decrypted = await decryptWithPassword(encrypted, encryptionPassphrase)
    if (!decrypted) return null
    return JSON.parse(decrypted) as BackupCodeSet
  } catch {
    return null
  }
}

/**
 * Mark a backup code as used
 */
export async function markBackupCodeUsed(
  usedHash: string,
  encryptionPassphrase: string
): Promise<void> {
  const backupSet = await getBackupCodes(encryptionPassphrase)
  if (!backupSet) return
  
  backupSet.usedCodes.push(usedHash)
  const encrypted = await encryptWithPassword(JSON.stringify(backupSet), encryptionPassphrase)
  await kv.set(BACKUP_CODES_KEY, encrypted)
}

// ─── Recovery Phrase ─────────────────────────────────────────

// BIP39-inspired word list (simplified subset)
const RECOVERY_WORDS = [
  'abandon', 'ability', 'absent', 'absorb', 'abstract', 'absurd', 'abuse', 'access',
  'accident', 'account', 'accuse', 'achieve', 'acquire', 'action', 'actor', 'actual',
  'adapt', 'address', 'adjust', 'admit', 'adult', 'advance', 'advice', 'affair',
  'afford', 'afraid', 'again', 'agent', 'agree', 'ahead', 'alarm', 'album',
  'alert', 'alien', 'allow', 'almost', 'alone', 'alpha', 'already', 'alter',
  'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'anchor', 'ancient',
  'anger', 'angle', 'animal', 'annual', 'another', 'answer', 'antenna', 'antique',
  'anxiety', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arctic',
  'arena', 'argue', 'armor', 'army', 'arrange', 'arrest', 'arrive', 'arrow',
  'artist', 'artwork', 'aspect', 'assault', 'asset', 'assist', 'assume', 'asthma',
  'athlete', 'atom', 'attack', 'attend', 'attract', 'auction', 'august', 'aunt',
  'author', 'autumn', 'average', 'avocado', 'avoid', 'awake', 'aware', 'awful',
  'balance', 'bamboo', 'banana', 'banner', 'bargain', 'barrel', 'basket', 'battle',
  'beach', 'beauty', 'become', 'believe', 'benefit', 'better', 'between', 'beyond',
  'blanket', 'border', 'bottle', 'bounce', 'bracket', 'branch', 'brave', 'bread',
  'bridge', 'bright', 'broken', 'bronze', 'brother', 'budget', 'buffalo', 'build'
]

/**
 * Generate a 12-word recovery phrase
 */
export function generateRecoveryPhrase(): string {
  const words: string[] = []
  const randomBytes = crypto.getRandomValues(new Uint8Array(12))
  for (let i = 0; i < 12; i++) {
    const index = randomBytes[i] % RECOVERY_WORDS.length
    words.push(RECOVERY_WORDS[index])
  }
  return words.join(' ')
}

/**
 * Hash recovery phrase for verification
 */
export async function hashRecoveryPhrase(phrase: string): Promise<string> {
  const normalized = phrase.toLowerCase().trim().split(/\s+/).join(' ')
  return hashSecret(normalized + 'recovery-v1')
}

/**
 * Store recovery phrase hash
 */
export async function storeRecoveryPhraseHash(phraseHash: string): Promise<void> {
  await kv.set(RECOVERY_PHRASE_HASH_KEY, phraseHash)
}

/**
 * Verify recovery phrase
 */
export async function verifyRecoveryPhrase(phrase: string): Promise<boolean> {
  const storedHash = await kv.get<string>(RECOVERY_PHRASE_HASH_KEY)
  if (!storedHash) return false
  
  const inputHash = await hashRecoveryPhrase(phrase)
  return inputHash === storedHash
}

// ─── Complete Setup Flow ─────────────────────────────────────────

/**
 * Complete keyfile + backup setup for admin
 * Returns everything the admin needs to store securely
 */
export async function setupAdminKeyfile(
  userId: string,
  password: string,
  backupPassphrase: string,
  keyfileLabel: string = 'USB Key'
): Promise<RecoverySetup> {
  // Generate primary keyfile
  const { keyfile, keyHash } = await generateKeyfile(userId, password, keyfileLabel)
  
  // Generate backup codes
  const backupCodes = generateBackupCodes()
  const hashedCodes = await hashBackupCodes(backupCodes)
  await storeBackupCodes(hashedCodes, backupPassphrase)
  
  // Generate recovery phrase
  const recoveryPhrase = generateRecoveryPhrase()
  const phraseHash = await hashRecoveryPhrase(recoveryPhrase)
  await storeRecoveryPhraseHash(phraseHash)
  
  return {
    keyfile,
    keyHash,
    backupCodes,
    recoveryPhrase
  }
}

/**
 * Export all recovery materials to a secure backup file
 */
export function exportRecoveryBackup(
  keyfile: AdminKeyfile,
  backupCodes: string[],
  recoveryPhrase: string
): void {
  const backup = {
    _warning: 'KEEP THIS FILE SECURE. Store offline in multiple locations.',
    _created: new Date().toISOString(),
    keyfile,
    backupCodes,
    recoveryPhrase,
    instructions: [
      '1. Primary: Use your USB keyfile for daily login',
      '2. Backup codes: Use if USB is unavailable (one-time use each)',
      '3. Recovery phrase: Last resort to regain access if all else fails',
      'Store this file encrypted or print and secure in a safe location.'
    ]
  }
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `founder-hub-admin-recovery-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
