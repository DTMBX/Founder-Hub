/**
 * E2E Encryption Module — AES-256-GCM
 * 
 * Encrypts sensitive data at rest in KV storage.
 * Key derived via PBKDF2 (100k iterations) from app entropy + random salt.
 * 
 * Coverage:
 *   - Passwords: PBKDF2 + per-user random salt (replaces plain SHA-256)
 *   - 2FA secrets & backup codes: AES-256-GCM field-level encryption
 *   - Audit logs: AES-256-GCM record-level encryption
 *   - Sessions: AES-256-GCM encrypted at rest
 */

import { kv } from '@/lib/local-storage-kv'

// Static app-level entropy — combined with random salt for key derivation
const APP_ENTROPY = 'Founder Hub-founder-hub-e2e-v1-2026'
const SALT_KV_KEY = 'founder-hub-e2e-salt'
const PBKDF2_ITERATIONS = 100_000

let _cachedKey: CryptoKey | null = null

// ─── Key Management ─────────────────────────────────────────

async function getOrCreateSalt(): Promise<Uint8Array> {
  const stored = await kv.get<string>(SALT_KV_KEY)
  if (stored) {
    return Uint8Array.from(atob(stored), c => c.charCodeAt(0))
  }
  const salt = crypto.getRandomValues(new Uint8Array(32))
  await kv.set(SALT_KV_KEY, btoa(String.fromCharCode(...salt)))
  return salt
}

async function deriveKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey

  const salt = await getOrCreateSalt()
  const encoder = new TextEncoder()

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(APP_ENTROPY),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  _cachedKey = await crypto.subtle.deriveKey(
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

  return _cachedKey
}

// ─── AES-256-GCM Encrypt / Decrypt ────────────────────────

/**
 * Encrypt a plaintext string with AES-256-GCM.
 * Returns `enc:` prefixed base64 string containing IV(12) + ciphertext + tag(16).
 */
export async function encryptField(plaintext: string): Promise<string> {
  const key = await deriveKey()
  const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV per GCM spec
  const encoder = new TextEncoder()

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  )

  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.length)

  return 'enc:' + btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt an AES-256-GCM encrypted string.
 * If the value is NOT encrypted (no `enc:` prefix), returns it as-is for migration.
 */
export async function decryptField(encrypted: string): Promise<string> {
  if (!encrypted.startsWith('enc:')) {
    return encrypted // unencrypted legacy value — pass through
  }

  const key = await deriveKey()
  const combined = Uint8Array.from(atob(encrypted.slice(4)), c => c.charCodeAt(0))

  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )

  return new TextDecoder().decode(plaintext)
}

/**
 * Encrypt a JSON-serializable value → `enc:` base64 blob.
 */
export async function encryptData<T>(data: T): Promise<string> {
  return encryptField(JSON.stringify(data))
}

/**
 * Decrypt an `enc:` base64 blob → parsed JSON value.
 * Falls back to direct JSON parse for unencrypted legacy data.
 */
export async function decryptData<T>(encrypted: string): Promise<T> {
  const json = await decryptField(encrypted)
  return JSON.parse(json) as T
}

/**
 * Returns true if the value is AES-256-GCM encrypted.
 */
export function isEncrypted(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith('enc:')
}

// ─── PBKDF2 Password Hashing ─────────────────────────────

/**
 * Hash a password with PBKDF2 (100k iterations, SHA-256, 256-bit output).
 * Each user gets a unique random salt.
 */
export async function hashPasswordPBKDF2(
  password: string,
  existingSalt?: string
): Promise<{ hash: string; salt: string }> {
  const salt = existingSalt || btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
  )
  const encoder = new TextEncoder()

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const hashBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  )

  const hashArray = Array.from(new Uint8Array(hashBits))
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return { hash, salt }
}

/**
 * Legacy SHA-256 hash (for migration detection only — DO NOT use for new passwords).
 */
export async function hashPasswordLegacy(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Initialize the encryption subsystem (call early in app lifecycle).
 */
export async function initEncryption(): Promise<void> {
  await deriveKey()
}
