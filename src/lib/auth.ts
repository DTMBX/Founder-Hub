import { useKV, kv } from '@/lib/local-storage-kv'
import { User, Session, AuditEvent, AuditAction } from './types'
import { useState, useEffect } from 'react'
import { generateSecret, verifyTOTP, generateQRCodeDataURL } from './totp'
import {
  hashPasswordPBKDF2,
  hashPasswordLegacy,
  encryptField,
  decryptField,
  encryptData,
  decryptData,
  isEncrypted,
  initEncryption,
  signSession,
  verifySessionSig
} from './crypto'
import { 
  AdminKeyfile, 
  verifyKeyfile,
  verifyBackupCode,
  getBackupCodes,
  markBackupCodeUsed,
  verifyRecoveryPhrase,
  setupAdminKeyfile,
  exportRecoveryBackup,
  RecoverySetup
} from './keyfile'
import { createSecurityIncident, createAccessAnomalyIncident } from './incident-log'
import { identifyCurrentDevice } from './device-trust'

const SESSION_KEY = 'founder-hub-session'
const USERS_KEY = 'founder-hub-users'
const LOGIN_ATTEMPTS_KEY = 'founder-hub-login-attempts'
const AUDIT_LOG_KEY = 'founder-hub-audit-log'
const PENDING_2FA_KEY = 'founder-hub-pending-2fa'
// Fingerprint of the env-configured credentials baked in at build time.
// When this changes (password rotated via GitHub Secret), stale localStorage
// credentials are automatically wiped and re-bootstrapped on next page load.
const CRED_FINGERPRINT_KEY = 'founder-hub-cred-fp'

/** 
 * Credential change-detection token — uses HMAC-style hash.
 * NOT reversible (unlike the old btoa approach).
 */
function getCredFingerprint(email: string, password: string): string {
  // Fast sync hash — only for detecting if env creds changed between deploys.
  // Not a security boundary; passwords are verified via PBKDF2 at login.
  const data = email + ':' + password
  let h = 0x811c9dc5 // FNV-1a offset basis
  for (let i = 0; i < data.length; i++) {
    h ^= data.charCodeAt(i)
    h = Math.imul(h, 0x01000193) // FNV prime
  }
  return 'fp:' + (h >>> 0).toString(36) + ':' + data.length.toString(36)
}
const LOCKOUT_DURATION = 30 * 60 * 1000   // 30 min lockout
const MAX_ATTEMPTS = 3                     // 3 attempts before lockout
const SESSION_DURATION = 4 * 60 * 60 * 1000 // 4 hour sessions
const SESSION_REFRESH_THRESHOLD = 30 * 60 * 1000 // Refresh session if less than 30 min remaining

// Local environment detection — true for vite dev OR any localhost/127.0.0.1 serve
const IS_DEV = import.meta.env.DEV
const IS_LOCAL = IS_DEV || typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.')
)
// Auto-login only in vite dev mode, and only if not explicitly disabled
const AUTO_LOGIN = IS_DEV && import.meta.env.VITE_AUTO_LOGIN !== 'false'
const log = IS_DEV ? console.log.bind(console) : () => {}

interface LoginAttempt {
  count: number
  lockedUntil?: number
  lastAttempt: number
}

interface Pending2FA {
  userId: string
  expiresAt: number
}

// Extended login options for backup/recovery
export interface LoginOptions {
  email: string
  password: string
  totpCode?: string
  keyfile?: AdminKeyfile
  backupCode?: string           // One-time backup code
  backupPassphrase?: string     // Passphrase to decrypt backup codes
  recoveryPhrase?: string       // 12-word recovery phrase
}

export interface LoginResult {
  success: boolean
  error?: string
  requires2FA?: boolean
  requiresKeyfile?: boolean
  hasBackupCodes?: boolean      // Indicates backup codes are available
  hasRecoveryPhrase?: boolean   // Indicates recovery phrase is set up
}

// ─── Password Hashing (PBKDF2 with legacy SHA-256 fallback) ──────

/**
 * Hash password with PBKDF2 + random salt.
 * If salt is provided, re-derive using that salt (for verification).
 */
async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  return hashPasswordPBKDF2(password, salt)
}

/** SHA-256 hash a 2FA backup code for storage (codes never stored in plaintext). */
async function hash2FACode(code: string): Promise<string> {
  const encoder = new TextEncoder()
  const buf = await crypto.subtle.digest('SHA-256', encoder.encode('2fa-backup:' + code.toUpperCase().trim()))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Generate a cryptographically random backup code (XXXX-XXXX format). */
function generateBackupCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(5))
  const chars = Array.from(bytes).map(b => (b % 36).toString(36).toUpperCase()).join('')
  return chars.slice(0, 4) + '-' + chars.slice(4, 8)
}

// ─── Encrypted Login Attempts ────────────────────────────────

/** Read and decrypt login attempt data (auto-migrates plaintext). */
async function getLoginAttempts(): Promise<Record<string, LoginAttempt>> {
  const raw = await kv.get<string | Record<string, LoginAttempt>>(LOGIN_ATTEMPTS_KEY)
  if (!raw) return {}
  if (typeof raw === 'string' && raw.startsWith('enc:')) {
    try { return await decryptData<Record<string, LoginAttempt>>(raw) } catch { return {} }
  }
  if (typeof raw === 'object') return raw
  return {}
}

/** Encrypt and store login attempt data. */
async function setLoginAttempts(data: Record<string, LoginAttempt>): Promise<void> {
  await kv.set(LOGIN_ATTEMPTS_KEY, await encryptData(data))
}

/**
 * Verify a password against a stored hash.
 * Detects legacy (unsalted SHA-256) vs modern (PBKDF2 + salt) automatically.
 * Returns { valid, needsMigration } — caller should re-hash if migration needed.
 */
async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt?: string
): Promise<{ valid: boolean; needsMigration: boolean }> {
  if (storedSalt) {
    // Modern PBKDF2 path
    const { hash } = await hashPasswordPBKDF2(password, storedSalt)
    return { valid: hash === storedHash, needsMigration: false }
  }
  // Legacy SHA-256 path (no salt)
  const legacyHash = await hashPasswordLegacy(password)
  return { valid: legacyHash === storedHash, needsMigration: true }
}

/**
 * Generate a cryptographically secure random password for initial admin setup.
 * The admin MUST change this password immediately after first login.
 */
function generateSecureInitialPassword(): string {
  const array = new Uint8Array(24)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
}

/**
 * Get initial admin credentials.
 *
 * - DEV mode: reads VITE_ADMIN_EMAIL / VITE_ADMIN_PASSWORD for convenience.
 * - Production: NEVER reads VITE_ADMIN_PASSWORD (would bake credentials into
 *   the JS bundle — C1 critical finding). Returns null to signal first-run
 *   setup is required.
 */
function getInitialAdminConfig(): { email: string; password: string; requiresChange: boolean } | null {
  if (!IS_DEV) {
    // Production: no build-time passwords — require interactive first-run setup
    return null
  }

  const envEmail = import.meta.env.VITE_ADMIN_EMAIL
  const envPassword = import.meta.env.VITE_ADMIN_PASSWORD
  
  // If password is set via env var, don't force change (operator configured it)
  if (envEmail && envPassword) {
    return {
      email: envEmail,
      password: envPassword,
      requiresChange: false
    }
  }
  
  // Generate random password if not configured
  const randomPassword = generateSecureInitialPassword()
  return {
    email: envEmail || 'admin@localhost',
    password: randomPassword,
    requiresChange: true
  }
}

async function initializeDefaultAdmin(): Promise<void> {
  log('[auth] initializeDefaultAdmin starting...')
  try {
    await initEncryption()
    const users = await kv.get<User[]>(USERS_KEY)
    log('[auth] existing users:', users?.length || 0)
  
    if (!users || users.length === 0) {
      // Get admin config (null in production — first-run setup needed)
      const adminConfig = getInitialAdminConfig()
      if (!adminConfig) {
        // Production with no users: signal first-run setup required.
        // useAuth will expose needsFirstRunSetup = true.
        log('[auth] No users and no env config — first-run setup required')
        return
      }

      const { hash, salt } = await hashPassword(adminConfig.password)
    
      const defaultAdmin: User = {
        id: `user_${Date.now()}`,
        email: adminConfig.email,
        passwordHash: hash,
        passwordSalt: salt,
        role: 'owner',
        createdAt: Date.now(),
        lastLogin: 0,
        requiresPasswordChange: adminConfig.requiresChange
      }
    
      await kv.set(USERS_KEY, [defaultAdmin])
      // Save credential fingerprint so future password rotations auto-detect
      if (!adminConfig.requiresChange) {
        localStorage.setItem(CRED_FINGERPRINT_KEY, getCredFingerprint(adminConfig.email, adminConfig.password))
      }
      // Log initial password in development mode or when randomly generated
      if (IS_DEV || adminConfig.requiresChange) {
        console.warn(`[AUTH] Admin: ${adminConfig.email}`)
        if (adminConfig.requiresChange) {
          console.warn('[AUTH] Initial password (change immediately):', adminConfig.password)
        }
      }
      log('Default admin account created (PBKDF2 + AES-256-GCM)')
    } else {
      // ── Auto-reset if env-configured credentials changed (DEV only) ──
      // In production the env vars aren't available so this block is a no-op.
      if (IS_DEV) {
        const envEmail = import.meta.env.VITE_ADMIN_EMAIL
        const envPassword = import.meta.env.VITE_ADMIN_PASSWORD
        if (envEmail && envPassword) {
          const currentFingerprint = getCredFingerprint(envEmail, envPassword)
          const storedFingerprint = localStorage.getItem(CRED_FINGERPRINT_KEY)
          const adminUser = users.find(u => u.role === 'owner' || u.role === 'admin')
          const credsMismatch = adminUser && (
            adminUser.email !== envEmail ||
            storedFingerprint !== currentFingerprint
          )
          if (credsMismatch) {
            log('[auth] Credential mismatch detected — resetting to env credentials')
            await kv.set(USERS_KEY, [])
            await kv.set(SESSION_KEY, null)
            const adminConfig = getInitialAdminConfig()!
            const { hash, salt } = await hashPassword(adminConfig.password)
            const freshAdmin: User = {
              id: `user_${Date.now()}`,
              email: adminConfig.email,
              passwordHash: hash,
              passwordSalt: salt,
              role: 'owner',
              createdAt: Date.now(),
              lastLogin: 0,
              requiresPasswordChange: false
            }
            await kv.set(USERS_KEY, [freshAdmin])
            localStorage.setItem(CRED_FINGERPRINT_KEY, currentFingerprint)
            log('[auth] Admin credentials reset to env-configured values')
            return
          }
          if (!storedFingerprint && adminUser && adminUser.email === envEmail) {
            localStorage.setItem(CRED_FINGERPRINT_KEY, currentFingerprint)
          }
        }
      }

      // Migrate existing admin email if needed
      let changed = false
      const migrated = users.map(u => {
        if (u.email === 'admin@founder-hub.online') {
          changed = true
          return { ...u, email: 'dTb33@pm.me' }
        }
        return u
      })
      if (changed) {
        await kv.set(USERS_KEY, migrated)
        log('Admin email migrated to dTb33@pm.me')
      }
    }
  } catch (error) {
    console.error('[auth] initializeDefaultAdmin failed:', error)
  }
}

export function useAuth() {
  const [session, setSession] = useKV<Session | null>(SESSION_KEY, null)
  const [users, setUsers] = useKV<User[]>(USERS_KEY, [])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  log('[useAuth] Hook called, session:', session, 'users:', users?.length, 'isLoading:', isLoading)

  useEffect(() => {
    log('[useAuth] Initializing default admin...')
    initializeDefaultAdmin().then(async () => {
      // After init, load the users into state
      const latestUsers = await kv.get<User[]>(USERS_KEY) || []
      log('[useAuth] Post-init users:', latestUsers.length)
      if (latestUsers.length > 0 && (!users || users.length === 0)) {
        setUsers(latestUsers)
      }

      // Auto-login: ONLY in vite dev server (not preview/LAN/production)
      if (AUTO_LOGIN && !await kv.get<Session>(SESSION_KEY)) {
        const owner = latestUsers.find(u => u.role === 'owner') || latestUsers[0]
        if (owner) {
          const sig = await signSession(owner.id + ':' + owner.role + ':' + (Date.now() + SESSION_DURATION))
          const devSession: Session = {
            userId: owner.id,
            role: owner.role,
            expiresAt: Date.now() + SESSION_DURATION,
            _sig: sig
          }
          await kv.set(SESSION_KEY, devSession)
          setSession(devSession)
          log('[useAuth] Dev auto-login: session created for', owner.email)
        }
      }

      // Migrate plaintext GitHub PAT from legacy localStorage to encrypted vault
      const legacyPat = localStorage.getItem('founder-hub:github-token')
      if (legacyPat && legacyPat.length > 10 && !legacyPat.startsWith('enc:')) {
        try {
          const { storeSecret } = await import('./secret-vault')
          await storeSecret('github-pat', 'GitHub PAT (migrated)', legacyPat)
          localStorage.removeItem('founder-hub:github-token')
          log('[useAuth] Migrated plaintext PAT to encrypted vault')
        } catch { /* vault unavailable, will retry next load */ }
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    log('[useAuth] Session effect triggered - session:', session, 'users:', users?.length)
    if (session && session.expiresAt > Date.now()) {
      log('[useAuth] Valid session found, looking for user:', session.userId)
      
      // Verify session integrity (HMAC) — prevents role escalation via DevTools
      if (session._sig) {
        const payload = session.userId + ':' + session.role + ':' + session.expiresAt
        verifySessionSig(payload, session._sig).then(valid => {
          if (!valid) {
            log('[useAuth] Session integrity check FAILED — possible tampering, clearing')
            setSession(null)
            setCurrentUser(null)
            setIsLoading(false)
          }
        }).catch(() => { /* verification unavailable, allow session */ })
      }
      
      // Auto-refresh session if approaching expiration
      const timeRemaining = session.expiresAt - Date.now()
      if (timeRemaining < SESSION_REFRESH_THRESHOLD && timeRemaining > 0) {
        const user = users?.find(u => u.id === session.userId)
        const newExpiry = Date.now() + SESSION_DURATION
        signSession((user?.id ?? session.userId) + ':' + (user?.role ?? session.role) + ':' + newExpiry).then(sig => {
          const refreshedSession: Session = {
            ...session,
            role: user?.role ?? session.role ?? ('owner' as const),
            expiresAt: newExpiry,
            _sig: sig
          }
          setSession(refreshedSession)
          log('[useAuth] Session refreshed with new signature')
        }).catch(() => {
          // Fallback: refresh without re-signing
          const refreshedSession: Session = {
            ...session,
            role: user?.role ?? session.role ?? ('owner' as const),
            expiresAt: Date.now() + SESSION_DURATION
          }
          setSession(refreshedSession)
          log('[useAuth] Session refreshed (unsigned fallback)')
        })
      }
      
      const user = users?.find(u => u.id === session.userId)
      if (user) {
        log('[useAuth] User found:', user.email)
        setCurrentUser(user)
        setIsLoading(false)
      } else if (users && users.length > 0) {
        // Only clear session if we have users loaded but can't find this user
        log('[useAuth] User not found in users array, clearing session')
        setSession(null)
        setCurrentUser(null)
        setIsLoading(false)
      } else {
        // Users not loaded yet, keep waiting
        log('[useAuth] Users not loaded yet, waiting...')
      }
    } else if (session) {
      log('[useAuth] Session expired, clearing')
      setSession(null)
      setCurrentUser(null)
      setIsLoading(false)
    } else {
      log('[useAuth] No session')
      setCurrentUser(null)
      setIsLoading(false)
    }
  }, [session, users, setSession])

  // Periodic session expiration check (every 60s)
  useEffect(() => {
    if (!session) return
    const interval = setInterval(() => {
      if (session.expiresAt <= Date.now()) {
        log('[useAuth] Session expired (periodic check), clearing')
        setSession(null)
        setCurrentUser(null)
      }
    }, 60_000)
    return () => clearInterval(interval)
  }, [session, setSession])

  const login = async (
    emailOrOptions: string | LoginOptions,
    passwordArg?: string,
    totpCodeArg?: string,
    keyfileArg?: AdminKeyfile
  ): Promise<LoginResult> => {
    // Support both old signature and new options object
    const options: LoginOptions = typeof emailOrOptions === 'string'
      ? { email: emailOrOptions, password: passwordArg || '', totpCode: totpCodeArg, keyfile: keyfileArg }
      : emailOrOptions
    
    const { email, password, totpCode, keyfile, backupCode, backupPassphrase, recoveryPhrase } = options
    
    log('[auth.login] Starting login for:', email)
    try {
      const attemptsData = await getLoginAttempts()
      const attempt = attemptsData[email]
      const now = Date.now()

      if (attempt?.lockedUntil && attempt.lockedUntil > now) {
        const remainingMinutes = Math.ceil((attempt.lockedUntil - now) / 60000)
        return { 
          success: false, 
          error: `Account temporarily locked. Try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.` 
        }
      }

      if (attempt?.lockedUntil && attempt.lockedUntil <= now) {
        delete attemptsData[email]
        await setLoginAttempts(attemptsData)
      }

      const allUsers = await kv.get<User[]>(USERS_KEY) || []
      log('[auth.login] Found users:', allUsers.length)
      const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
      log('[auth.login] User lookup result:', user ? 'found' : 'NOT FOUND')
      
      if (!user) {
        const currentAttempt = attempt || { count: 0, lastAttempt: 0 }
        currentAttempt.count++
        currentAttempt.lastAttempt = now

        if (currentAttempt.count >= MAX_ATTEMPTS) {
          currentAttempt.lockedUntil = now + LOCKOUT_DURATION
          // Fire-and-forget — incident logging must never block auth
          createAccessAnomalyIncident(
            'Account Lockout',
            `Account locked after ${MAX_ATTEMPTS} failed attempts for ${email}`,
            'high',
            { id: 'system', name: 'auth' }
          ).catch(() => {})
        }

        attemptsData[email] = currentAttempt
        await setLoginAttempts(attemptsData)
        
        await logAudit('system', 'system', 'login_failed', `Failed login attempt for ${email}`, 'auth', email)
        return { success: false, error: 'Invalid email or password' }
      }

      // PBKDF2 verification with automatic legacy SHA-256 migration
      log('[auth.login] Verifying password')
      const { valid, needsMigration } = await verifyPassword(
        password,
        user.passwordHash,
        user.passwordSalt
      )
      log('[auth.login] Password verification result - valid:', valid)
      
      if (!valid) {
        const currentAttempt = attempt || { count: 0, lastAttempt: 0 }
        currentAttempt.count++
        currentAttempt.lastAttempt = now

        if (currentAttempt.count >= MAX_ATTEMPTS) {
          currentAttempt.lockedUntil = now + LOCKOUT_DURATION
          createSecurityIncident(
            'Brute Force Lockout',
            `Account ${user.email} locked after ${MAX_ATTEMPTS} failed password attempts`,
            'high',
            ['authentication'],
            { id: user.id, name: user.email }
          ).catch(() => {})
        }

        attemptsData[email] = currentAttempt
        await setLoginAttempts(attemptsData)
        
        await logAudit(user.id, user.email, 'login_failed', 'Invalid password attempt', 'auth', user.id)
        return { success: false, error: 'Invalid email or password' }
      }

      // Auto-migrate legacy SHA-256 passwords to PBKDF2
      if (needsMigration) {
        const { hash: newHash, salt: newSalt } = await hashPassword(password)
        const migratedUsers = allUsers.map(u =>
          u.id === user.id ? { ...u, passwordHash: newHash, passwordSalt: newSalt } : u
        )
        await kv.set(USERS_KEY, migratedUsers)
        setUsers(migratedUsers)
        user.passwordHash = newHash
        user.passwordSalt = newSalt
        await logAudit(user.id, user.email, 'password_migrated', 'Password hash upgraded from SHA-256 to PBKDF2', 'auth', user.id)
      }

      // Hardware keyfile verification (if enabled for this user)
      if (user.keyfileEnabled && user.keyfileHash) {
        let keyfileVerified = false
        
        // Option 1: USB Keyfile (primary)
        if (keyfile) {
          const keyResult = await verifyKeyfile(keyfile, password, user.keyfileHash, user.id)
          if (keyResult.valid) {
            keyfileVerified = true
            log('[auth.login] Hardware keyfile verified successfully')
          } else {
            await logAudit(user.id, user.email, 'login_keyfile_failed', keyResult.error || 'Invalid keyfile', 'auth', user.id)
          }
        }
        
        // Option 2: Backup code (one-time use)
        if (!keyfileVerified && backupCode && backupPassphrase) {
          const backupSet = await getBackupCodes(backupPassphrase)
          if (backupSet) {
            const backupResult = await verifyBackupCode(backupCode, backupSet.codes, backupSet.usedCodes)
            if (backupResult.valid && backupResult.usedHash) {
              await markBackupCodeUsed(backupResult.usedHash, backupPassphrase)
              keyfileVerified = true
              log('[auth.login] Backup code verified successfully')
              await logAudit(user.id, user.email, 'backup_code_used', 'Authenticated via backup code', 'auth', user.id)
            } else {
              await logAudit(user.id, user.email, 'backup_code_failed', backupResult.error || 'Invalid backup code', 'auth', user.id)
            }
          }
        }
        
        // Option 3: Recovery phrase (emergency fallback)
        if (!keyfileVerified && recoveryPhrase) {
          const phraseValid = await verifyRecoveryPhrase(recoveryPhrase)
          if (phraseValid) {
            keyfileVerified = true
            log('[auth.login] Recovery phrase verified successfully')
            await logAudit(user.id, user.email, 'recovery_phrase_used', 'Authenticated via recovery phrase - recommend setting up new keyfile', 'auth', user.id)
          } else {
            await logAudit(user.id, user.email, 'recovery_phrase_failed', 'Invalid recovery phrase', 'auth', user.id)
          }
        }
        
        // If no keyfile method succeeded, request keyfile
        if (!keyfileVerified) {
          const currentAttempt = attempt || { count: 0, lastAttempt: 0 }
          if (!keyfile && !backupCode && !recoveryPhrase) {
            // First request - don't count as failed attempt
            await logAudit(user.id, user.email, 'login_keyfile_required', 'Password verified, awaiting hardware key', 'auth', user.id)
            return { 
              success: false, 
              requiresKeyfile: true,
              hasBackupCodes: true,
              hasRecoveryPhrase: true
            }
          }
          
          // Failed attempt with wrong key/code
          currentAttempt.count++
          currentAttempt.lastAttempt = now
          if (currentAttempt.count >= MAX_ATTEMPTS) {
            currentAttempt.lockedUntil = now + LOCKOUT_DURATION
          }
          attemptsData[email] = currentAttempt
          await setLoginAttempts(attemptsData)
          
          return { 
            success: false, 
            error: 'Invalid authentication method',
            requiresKeyfile: true,
            hasBackupCodes: true,
            hasRecoveryPhrase: true
          }
        }
      }

      if (user.twoFactorEnabled && user.twoFactorSecret) {
        if (!totpCode) {
          const pending: Pending2FA = {
            userId: user.id,
            expiresAt: now + 5 * 60 * 1000
          }
          // Encrypt pending 2FA data at rest
          await kv.set(PENDING_2FA_KEY, await encryptData(pending))
          await logAudit(user.id, user.email, 'login_2fa_required', 'Password verified, awaiting 2FA', 'auth', user.id)
          return { success: false, requires2FA: true }
        }

        // Decrypt 2FA secret for verification
        const decryptedSecret = isEncrypted(user.twoFactorSecret)
          ? await decryptField(user.twoFactorSecret)
          : user.twoFactorSecret

        const totpCodeHash = await hash2FACode(totpCode)
        const isBackupCode = user.twoFactorBackupCodes?.includes(totpCodeHash)
        const isValidTOTP = await verifyTOTP(decryptedSecret, totpCode)

        if (!isValidTOTP && !isBackupCode) {
          const currentAttempt = attempt || { count: 0, lastAttempt: 0 }
          currentAttempt.count++
          currentAttempt.lastAttempt = now

          if (currentAttempt.count >= MAX_ATTEMPTS) {
            currentAttempt.lockedUntil = now + LOCKOUT_DURATION
          }

          attemptsData[email] = currentAttempt
          await setLoginAttempts(attemptsData)
          
          await logAudit(user.id, user.email, 'login_2fa_failed', 'Invalid 2FA code', 'auth', user.id)
          return { success: false, error: 'Invalid authentication code', requires2FA: true }
        }

        if (isBackupCode) {
          const updatedBackupCodes = user.twoFactorBackupCodes?.filter(h => h !== totpCodeHash) || []
          const updatedUsers = allUsers.map(u => 
            u.id === user.id ? { ...u, twoFactorBackupCodes: updatedBackupCodes } : u
          )
          await kv.set(USERS_KEY, updatedUsers)
          setUsers(updatedUsers)
          await logAudit(user.id, user.email, 'backup_code_used', `Backup code used. ${updatedBackupCodes.length} remaining`, 'auth', user.id)
        }
      }

      delete attemptsData[email]
      await setLoginAttempts(attemptsData)
      await kv.delete(PENDING_2FA_KEY)

      user.lastLogin = now
      const updatedUsers = allUsers.map(u => u.id === user.id ? user : u)
      await kv.set(USERS_KEY, updatedUsers)
      setUsers(updatedUsers)

      const newSession: Session = {
        userId: user.id,
        role: user.role,
        expiresAt: now + SESSION_DURATION,
        _sig: await signSession(user.id + ':' + user.role + ':' + (now + SESSION_DURATION))
      }

      log('[auth.login] Creating session')
      setSession(newSession)
      
      // Force update the users state to ensure effect finds the user
      const latestUsers = await kv.get<User[]>(USERS_KEY) || []
      log('[auth.login] Updating users state')
      setUsers(latestUsers)
      
      log('[auth.login] Logging audit...')
      await logAudit(user.id, user.email, 'login', 'User logged in successfully', 'auth', user.id)
      log('[auth.login] Login complete')

      // Register/identify device — fire-and-forget, must never block login
      identifyCurrentDevice(user.id).catch(() => {})

      return { success: true }
    } catch (error) {
      console.error('[auth] Login error:', error)
      return { success: false, error: 'An error occurred. Please try again.' }
    }
  }

  const logout = async () => {
    log('[auth] Logging out...')
    if (currentUser) {
      await logAudit(currentUser.id, currentUser.email, 'logout', 'User logged out', 'auth', currentUser.id)
    }
    // Clear session from localStorage directly to ensure it's removed
    localStorage.removeItem('founder-hub:' + SESSION_KEY)
    setSession(null)
    setCurrentUser(null)
    log('[auth] Logout complete')
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    if (newPassword.length < 12) {
      return { success: false, error: 'Password must be at least 12 characters long' }
    }

    // Verify current password (supports both legacy and PBKDF2)
    const { valid } = await verifyPassword(
      currentPassword,
      currentUser.passwordHash,
      currentUser.passwordSalt
    )
    if (!valid) {
      await logAudit(currentUser.id, currentUser.email, 'password_change_failed', 'Invalid current password', 'auth', currentUser.id)
      return { success: false, error: 'Current password is incorrect' }
    }

    // Always use PBKDF2 for new passwords
    const { hash: newHash, salt: newSalt } = await hashPassword(newPassword)
    const allUsers = await kv.get<User[]>(USERS_KEY) || []
    const updatedUsers = allUsers.map(u => 
      u.id === currentUser.id ? { ...u, passwordHash: newHash, passwordSalt: newSalt } : u
    )
    
    await kv.set(USERS_KEY, updatedUsers)
    setUsers(updatedUsers)
    
    await logAudit(currentUser.id, currentUser.email, 'password_changed', 'Password changed successfully (PBKDF2)', 'auth', currentUser.id)
    
    return { success: true }
  }

  const setup2FA = async (): Promise<{ success: boolean; secret?: string; qrCodeURL?: string; backupCodes?: string[]; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    if (currentUser.twoFactorEnabled) {
      return { success: false, error: 'Two-factor authentication is already enabled' }
    }

    const secret = generateSecret()
    const qrCodeURL = await generateQRCodeDataURL(secret, 'Founder Hub', currentUser.email)
    
    const backupCodes = Array.from({ length: 10 }, () => generateBackupCode())

    return {
      success: true,
      secret,
      qrCodeURL,
      backupCodes
    }
  }

  const enable2FA = async (secret: string, verificationCode: string, backupCodes: string[]): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const isValid = await verifyTOTP(secret, verificationCode)
    
    if (!isValid) {
      await logAudit(currentUser.id, currentUser.email, 'login_2fa_failed', 'Invalid verification code during setup', 'auth', currentUser.id)
      return { success: false, error: 'Invalid verification code. Please try again.' }
    }

    // Encrypt 2FA secret before storage (E2E — AES-256-GCM)
    const encryptedSecret = await encryptField(secret)
    // Hash backup codes before storage — plaintext shown once to user, only hashes persisted
    const hashedCodes = await Promise.all(backupCodes.map(c => hash2FACode(c)))

    const allUsers = await kv.get<User[]>(USERS_KEY) || []
    const updatedUsers = allUsers.map(u => 
      u.id === currentUser.id 
        ? { 
            ...u, 
            twoFactorEnabled: true, 
            twoFactorSecret: encryptedSecret,
            twoFactorBackupCodes: hashedCodes
          } 
        : u
    )
    
    await kv.set(USERS_KEY, updatedUsers)
    setUsers(updatedUsers)
    
    await logAudit(currentUser.id, currentUser.email, '2fa_enabled', 'Two-factor authentication enabled (secret encrypted)', 'auth', currentUser.id)
    
    return { success: true }
  }

  const disable2FA = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!currentUser.twoFactorEnabled) {
      return { success: false, error: 'Two-factor authentication is not enabled' }
    }

    const { valid } = await verifyPassword(password, currentUser.passwordHash, currentUser.passwordSalt)
    if (!valid) {
      await logAudit(currentUser.id, currentUser.email, 'password_change_failed', 'Invalid password during 2FA disable', 'auth', currentUser.id)
      return { success: false, error: 'Invalid password' }
    }

    const allUsers = await kv.get<User[]>(USERS_KEY) || []
    const updatedUsers = allUsers.map(u => 
      u.id === currentUser.id 
        ? { 
            ...u, 
            twoFactorEnabled: false, 
            twoFactorSecret: undefined,
            twoFactorBackupCodes: undefined
          } 
        : u
    )
    
    await kv.set(USERS_KEY, updatedUsers)
    setUsers(updatedUsers)
    
    await logAudit(currentUser.id, currentUser.email, '2fa_disabled', 'Two-factor authentication disabled', 'auth', currentUser.id)
    
    return { success: true }
  }

  const regenerateBackupCodes = async (password: string): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!currentUser.twoFactorEnabled) {
      return { success: false, error: 'Two-factor authentication is not enabled' }
    }

    const { valid } = await verifyPassword(password, currentUser.passwordHash, currentUser.passwordSalt)
    if (!valid) {
      return { success: false, error: 'Invalid password' }
    }

    const backupCodes = Array.from({ length: 10 }, () => generateBackupCode())
    const hashedCodes = await Promise.all(backupCodes.map(c => hash2FACode(c)))

    const allUsers = await kv.get<User[]>(USERS_KEY) || []
    const updatedUsers = allUsers.map(u => 
      u.id === currentUser.id 
        ? { ...u, twoFactorBackupCodes: hashedCodes } 
        : u
    )
    
    await kv.set(USERS_KEY, updatedUsers)
    setUsers(updatedUsers)
    
    await logAudit(currentUser.id, currentUser.email, 'backup_codes_regenerated', 'Backup codes regenerated', 'auth', currentUser.id)
    
    return { success: true, backupCodes }
  }

  /**
   * Set up keyfile-based authentication (USB key + backup codes + recovery phrase)
   * This is the recommended primary authentication method for admin accounts.
   */
  const setupKeyfileAuth = async (
    password: string,
    backupPassphrase: string,
    keyfileLabel: string = 'USB Key'
  ): Promise<{ 
    success: boolean
    recovery?: RecoverySetup
    error?: string 
  }> => {
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify password first
    const { valid } = await verifyPassword(password, currentUser.passwordHash, currentUser.passwordSalt)
    if (!valid) {
      await logAudit(currentUser.id, currentUser.email, 'keyfile_setup_failed', 'Invalid password', 'auth', currentUser.id)
      return { success: false, error: 'Invalid password' }
    }

    try {
      // Generate keyfile + backup codes + recovery phrase
      const recovery = await setupAdminKeyfile(
        currentUser.id,
        password,
        backupPassphrase,
        keyfileLabel
      )

      // Enable keyfile requirement for this user
      const allUsers = await kv.get<User[]>(USERS_KEY) || []
      const updatedUsers = allUsers.map(u => 
        u.id === currentUser.id 
          ? { 
              ...u, 
              keyfileEnabled: true, 
              keyfileHash: recovery.keyHash,
              keyfileId: recovery.keyfile.keyId
            } 
          : u
      )
      
      await kv.set(USERS_KEY, updatedUsers)
      setUsers(updatedUsers)
      
      await logAudit(
        currentUser.id, 
        currentUser.email, 
        'keyfile_enabled', 
        `USB keyfile authentication enabled: ${keyfileLabel}`, 
        'auth', 
        currentUser.id
      )
      
      // Auto-download the recovery backup file
      exportRecoveryBackup(recovery.keyfile, recovery.backupCodes, recovery.recoveryPhrase)
      
      return { success: true, recovery }
    } catch (error) {
      console.error('[auth] Keyfile setup error:', error)
      return { success: false, error: 'Failed to set up keyfile authentication' }
    }
  }

  /**
   * Disable keyfile authentication (revert to password-only)
   */
  const disableKeyfileAuth = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!currentUser.keyfileEnabled) {
      return { success: false, error: 'Keyfile authentication is not enabled' }
    }

    const { valid } = await verifyPassword(password, currentUser.passwordHash, currentUser.passwordSalt)
    if (!valid) {
      return { success: false, error: 'Invalid password' }
    }

    const allUsers = await kv.get<User[]>(USERS_KEY) || []
    const updatedUsers = allUsers.map(u => 
      u.id === currentUser.id 
        ? { 
            ...u, 
            keyfileEnabled: false, 
            keyfileHash: undefined,
            keyfileId: undefined
          } 
        : u
    )
    
    await kv.set(USERS_KEY, updatedUsers)
    setUsers(updatedUsers)
    
    await logAudit(currentUser.id, currentUser.email, 'keyfile_disabled', 'USB keyfile authentication disabled', 'auth', currentUser.id)
    
    return { success: true }
  }

  // ── First-Run Setup (production only — no VITE_ADMIN in bundle) ──

  /** True when no admin account exists and interactive setup is needed. */
  const needsFirstRunSetup = !isLoading && (!users || users.length === 0)

  /** Create the initial admin account during first-run setup. */
  const createFirstAdmin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password) return { success: false, error: 'Email and password are required' }
    if (password.length < 12) return { success: false, error: 'Password must be at least 12 characters' }

    const existingUsers = await kv.get<User[]>(USERS_KEY)
    if (existingUsers && existingUsers.length > 0) {
      return { success: false, error: 'Admin already exists — use login instead' }
    }

    await initEncryption()
    const { hash, salt } = await hashPassword(password)
    const admin: User = {
      id: `user_${Date.now()}`,
      email,
      passwordHash: hash,
      passwordSalt: salt,
      role: 'owner',
      createdAt: Date.now(),
      lastLogin: 0,
      requiresPasswordChange: false,
    }
    await kv.set(USERS_KEY, [admin])
    setUsers([admin])
    await logAudit(admin.id, email, 'first_run_setup', 'First-run admin setup', 'auth', admin.id)
    return { success: true }
  }

  return {
    currentUser,
    isAuthenticated: !!currentUser && !!session && session.expiresAt > Date.now(),
    isLoading,
    needsFirstRunSetup,
    createFirstAdmin,
    login,
    logout,
    changePassword,
    setup2FA,
    enable2FA,
    disable2FA,
    regenerateBackupCodes,
    setupKeyfileAuth,
    disableKeyfileAuth
  }
}

// ─── Remote Login via GitHub Token ──────────────────────────────────────────

const REPO_OWNER = 'DTMBX'
const REPO_NAME = 'Founder-Hub'

interface GitHubTokenLoginResult {
  success: boolean
  error?: string
  username?: string
}

/**
 * Authenticate remotely using a GitHub Personal Access Token.
 *
 * Flow:
 *  1. Call GET /user to verify the token and get the authenticated GitHub user
 *  2. Call GET /repos/{owner}/{repo} to check the user has push permission
 *  3. If valid, bootstrap an owner user (or find existing) and create a session
 *  4. Save the token in the secret vault for publishing
 *
 * This lets the owner log in from any browser, anywhere.
 */
export async function loginWithGitHubToken(token: string): Promise<GitHubTokenLoginResult> {
  if (!token || token.length < 10) {
    return { success: false, error: 'Invalid token format' }
  }

  try {
    // Step 1: Verify token and get authenticated user
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!userRes.ok) {
      if (userRes.status === 401) return { success: false, error: 'Invalid or expired token' }
      return { success: false, error: `GitHub API error: ${userRes.status}` }
    }

    const ghUser = await userRes.json()
    const username: string = ghUser.login

    // Step 2: Check repo access (must have push permission)
    const repoRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!repoRes.ok) {
      return { success: false, error: 'Token cannot access this repository' }
    }

    const repo = await repoRes.json()
    if (!repo.permissions?.push && !repo.permissions?.admin) {
      return { success: false, error: `User "${username}" does not have write access to ${REPO_OWNER}/${REPO_NAME}` }
    }

    // Step 3: Bootstrap or find user, create session
    await initEncryption()
    const allUsers = await kv.get<User[]>(USERS_KEY) || []

    // Find existing user or create one from GitHub identity
    let user = allUsers.find(u => u.role === 'owner') || allUsers[0]
    if (!user) {
      // No users exist yet — create one from GitHub identity
      const { hash, salt } = await hashPasswordPBKDF2(token, undefined)
      user = {
        id: `user_gh_${Date.now()}`,
        email: ghUser.email || `${username}@github`,
        passwordHash: hash,
        passwordSalt: salt,
        role: 'owner',
        createdAt: Date.now(),
        lastLogin: Date.now(),
      }
      await kv.set(USERS_KEY, [user])
    } else {
      // Update last login
      user.lastLogin = Date.now()
      const updated = allUsers.map(u => u.id === user!.id ? user! : u)
      await kv.set(USERS_KEY, updated)
    }

    // Create session
    const sessionExpiry = Date.now() + SESSION_DURATION
    const newSession: Session = {
      userId: user.id,
      role: user.role,
      expiresAt: sessionExpiry,
      _sig: await signSession(user.id + ':' + user.role + ':' + sessionExpiry)
    }
    await kv.set(SESSION_KEY, newSession)

    // Step 4: Save PAT in secret vault for publishing
    try {
      const { storeSecret } = await import('./secret-vault')
      await storeSecret('github-pat', `GitHub PAT (${username})`, token)
    } catch {
      // Secret vault not available — encrypt minimally rather than storing plaintext
      try {
        const encrypted = await encryptField(token)
        localStorage.setItem('founder-hub:github-token', encrypted)
      } catch {
        // Last resort: don't store at all rather than store plaintext
        console.warn('[auth] Could not store GitHub token securely')
      }
    }

    // Audit
    await logAudit(user.id, user.email, 'login', `Remote login via GitHub token (${username})`, 'auth', user.id)

    // Register/identify device — fire-and-forget
    identifyCurrentDevice(user.id).catch(() => {})

    return { success: true, username }
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error — check your connection' }
  }
}

export async function logAudit(
  userId: string,
  userEmail: string,
  action: AuditAction,
  details: string,
  entityType?: string,
  entityId?: string
) {
  const log = await kv.get<(AuditEvent | string)[]>(AUDIT_LOG_KEY) || []
  
  const event: AuditEvent = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    userEmail,
    action,
    details,
    entityType,
    entityId,
    timestamp: Date.now()
  }

  // Encrypt the audit entry at rest (E2E — AES-256-GCM)
  const encryptedEvent = await encryptData(event)
  log.unshift(encryptedEvent)
  
  if (log.length > 1000) {
    log.splice(1000)
  }

  await kv.set(AUDIT_LOG_KEY, log)
}

/**
 * Decrypt audit log entries for display.
 * Handles both encrypted and legacy plaintext entries.
 */
export async function decryptAuditLog(
  rawLog: (AuditEvent | string)[]
): Promise<AuditEvent[]> {
  const decrypted: AuditEvent[] = []
  for (const entry of rawLog) {
    try {
      if (typeof entry === 'string' && isEncrypted(entry)) {
        decrypted.push(await decryptData<AuditEvent>(entry))
      } else if (typeof entry === 'object' && entry !== null) {
        decrypted.push(entry as AuditEvent)
      }
    } catch {
      // Skip corrupted entries
    }
  }
  return decrypted
}

export function useRequireAuth() {
  const { currentUser, isAuthenticated, isLoading } = useAuth()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShouldRedirect(true)
    }
  }, [isLoading, isAuthenticated])

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    shouldRedirect
  }
}
