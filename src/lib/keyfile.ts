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
 * - Lost keyfile = need to regenerate (revokes old keyfiles)
 */

import { kv } from '@/lib/local-storage-kv'

const KEYFILE_VERSION = 'xtx396-keyfile-v1'
const KEYFILE_LOCAL_KEY = 'xtx396-admin-keyfile'
const PBKDF2_ITERATIONS = 100_000

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
  a.download = `xtx396-admin-key-${keyfile.label.toLowerCase().replace(/\s+/g, '-')}.json`
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
