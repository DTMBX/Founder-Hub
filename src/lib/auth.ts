import { useKV } from '@/lib/local-storage-kv'
import { User, Session, AuditEvent, AuditAction } from './types'
import { useState, useEffect } from 'react'
import { generateSecret, verifyTOTP, generateQRCodeURL } from './totp'
import {
  hashPasswordPBKDF2,
  hashPasswordLegacy,
  encryptField,
  decryptField,
  encryptData,
  decryptData,
  isEncrypted,
  initEncryption
} from './crypto'

const SESSION_KEY = 'founder-hub-session'
const USERS_KEY = 'founder-hub-users'
const LOGIN_ATTEMPTS_KEY = 'founder-hub-login-attempts'
const AUDIT_LOG_KEY = 'founder-hub-audit-log'
const PENDING_2FA_KEY = 'founder-hub-pending-2fa'
const LOCKOUT_DURATION = 30 * 60 * 1000   // 30 min lockout (was 15)
const MAX_ATTEMPTS = 3                     // 3 attempts before lockout (was 5)
const SESSION_DURATION = 4 * 60 * 60 * 1000 // 4 hour sessions (was 8)

interface LoginAttempt {
  count: number
  lockedUntil?: number
  lastAttempt: number
}

interface Pending2FA {
  userId: string
  expiresAt: number
}

// ─── Password Hashing (PBKDF2 with legacy SHA-256 fallback) ──────

/**
 * Hash password with PBKDF2 + random salt.
 * If salt is provided, re-derive using that salt (for verification).
 */
async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  return hashPasswordPBKDF2(password, salt)
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

async function initializeDefaultAdmin(): Promise<void> {
  console.log('[auth] initializeDefaultAdmin starting...')
  await initEncryption()
  const users = await window.spark.kv.get<User[]>(USERS_KEY)
  console.log('[auth] existing users:', users?.length || 0)
  
  if (!users || users.length === 0) {
    const { hash, salt } = await hashPassword('SecureAdmin2024!')
    
    const defaultAdmin: User = {
      id: `user_${Date.now()}`,
      email: 'dTb33@pm.me',
      passwordHash: hash,
      passwordSalt: salt,
      role: 'owner',
      createdAt: Date.now(),
      lastLogin: 0
    }
    
    await window.spark.kv.set(USERS_KEY, [defaultAdmin])
    console.log('Default admin account created (PBKDF2 + AES-256-GCM)')
  } else {
    // Migrate existing admin email if needed
    let changed = false
    const migrated = users.map(u => {
      if (u.email === 'admin@xtx396.online') {
        changed = true
        return { ...u, email: 'dTb33@pm.me' }
      }
      return u
    })
    if (changed) {
      await window.spark.kv.set(USERS_KEY, migrated)
      console.log('Admin email migrated to dTb33@pm.me')
    }
  }
}

export function useAuth() {
  const [session, setSession] = useKV<Session | null>(SESSION_KEY, null)
  const [users, setUsers] = useKV<User[]>(USERS_KEY, [])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  console.log('[useAuth] Hook called, session:', session, 'users:', users?.length, 'isLoading:', isLoading)

  useEffect(() => {
    console.log('[useAuth] Initializing default admin...')
    initializeDefaultAdmin().then(async () => {
      // After init, load the users into state
      const latestUsers = await window.spark.kv.get<User[]>(USERS_KEY) || []
      console.log('[useAuth] Post-init users:', latestUsers.length)
      if (latestUsers.length > 0 && (!users || users.length === 0)) {
        setUsers(latestUsers)
      }
    })
  }, [])

  useEffect(() => {
    console.log('[useAuth] Session effect triggered - session:', session, 'users:', users?.length)
    if (session && session.expiresAt > Date.now()) {
      console.log('[useAuth] Valid session found, looking for user:', session.userId)
      const user = users?.find(u => u.id === session.userId)
      if (user) {
        console.log('[useAuth] User found:', user.email)
        setCurrentUser(user)
        setIsLoading(false)
      } else if (users && users.length > 0) {
        // Only clear session if we have users loaded but can't find this user
        console.log('[useAuth] User not found in users array, clearing session')
        setSession(null)
        setCurrentUser(null)
        setIsLoading(false)
      } else {
        // Users not loaded yet, keep waiting
        console.log('[useAuth] Users not loaded yet, waiting...')
      }
    } else if (session) {
      console.log('[useAuth] Session expired, clearing')
      setSession(null)
      setCurrentUser(null)
      setIsLoading(false)
    } else {
      console.log('[useAuth] No session')
      setCurrentUser(null)
      setIsLoading(false)
    }
  }, [session, users, setSession])

  const login = async (email: string, password: string, totpCode?: string): Promise<{ success: boolean; error?: string; requires2FA?: boolean }> => {
    console.log('[auth.login] Starting login for:', email)
    try {
      const attemptsData = await window.spark.kv.get<Record<string, LoginAttempt>>(LOGIN_ATTEMPTS_KEY) || {}
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
        await window.spark.kv.set(LOGIN_ATTEMPTS_KEY, attemptsData)
      }

      const allUsers = await window.spark.kv.get<User[]>(USERS_KEY) || []
      console.log('[auth.login] Found users:', allUsers.length, allUsers.map(u => u.email))
      const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
      console.log('[auth.login] User lookup result:', user ? user.email : 'NOT FOUND')
      
      if (!user) {
        const currentAttempt = attempt || { count: 0, lastAttempt: 0 }
        currentAttempt.count++
        currentAttempt.lastAttempt = now

        if (currentAttempt.count >= MAX_ATTEMPTS) {
          currentAttempt.lockedUntil = now + LOCKOUT_DURATION
        }

        attemptsData[email] = currentAttempt
        await window.spark.kv.set(LOGIN_ATTEMPTS_KEY, attemptsData)
        
        await logAudit('system', 'system', 'login_failed', `Failed login attempt for ${email}`, 'auth', email)
        return { success: false, error: 'Invalid email or password' }
      }

      // PBKDF2 verification with automatic legacy SHA-256 migration
      console.log('[auth.login] Verifying password, user has salt:', !!user.passwordSalt)
      const { valid, needsMigration } = await verifyPassword(
        password,
        user.passwordHash,
        user.passwordSalt
      )
      console.log('[auth.login] Password verification result - valid:', valid, 'needsMigration:', needsMigration)
      
      if (!valid) {
        const currentAttempt = attempt || { count: 0, lastAttempt: 0 }
        currentAttempt.count++
        currentAttempt.lastAttempt = now

        if (currentAttempt.count >= MAX_ATTEMPTS) {
          currentAttempt.lockedUntil = now + LOCKOUT_DURATION
        }

        attemptsData[email] = currentAttempt
        await window.spark.kv.set(LOGIN_ATTEMPTS_KEY, attemptsData)
        
        await logAudit(user.id, user.email, 'login_failed', 'Invalid password attempt', 'auth', user.id)
        return { success: false, error: 'Invalid email or password' }
      }

      // Auto-migrate legacy SHA-256 passwords to PBKDF2
      if (needsMigration) {
        const { hash: newHash, salt: newSalt } = await hashPassword(password)
        const migratedUsers = allUsers.map(u =>
          u.id === user.id ? { ...u, passwordHash: newHash, passwordSalt: newSalt } : u
        )
        await window.spark.kv.set(USERS_KEY, migratedUsers)
        setUsers(migratedUsers)
        user.passwordHash = newHash
        user.passwordSalt = newSalt
        await logAudit(user.id, user.email, 'password_migrated', 'Password hash upgraded from SHA-256 to PBKDF2', 'auth', user.id)
      }

      if (user.twoFactorEnabled && user.twoFactorSecret) {
        if (!totpCode) {
          const pending: Pending2FA = {
            userId: user.id,
            expiresAt: now + 5 * 60 * 1000
          }
          // Encrypt pending 2FA data at rest
          await window.spark.kv.set(PENDING_2FA_KEY, await encryptData(pending))
          await logAudit(user.id, user.email, 'login_2fa_required', 'Password verified, awaiting 2FA', 'auth', user.id)
          return { success: false, requires2FA: true }
        }

        // Decrypt 2FA secret for verification
        const decryptedSecret = isEncrypted(user.twoFactorSecret)
          ? await decryptField(user.twoFactorSecret)
          : user.twoFactorSecret

        const isBackupCode = user.twoFactorBackupCodes?.includes(totpCode)
        const isValidTOTP = await verifyTOTP(decryptedSecret, totpCode)

        if (!isValidTOTP && !isBackupCode) {
          const currentAttempt = attempt || { count: 0, lastAttempt: 0 }
          currentAttempt.count++
          currentAttempt.lastAttempt = now

          if (currentAttempt.count >= MAX_ATTEMPTS) {
            currentAttempt.lockedUntil = now + LOCKOUT_DURATION
          }

          attemptsData[email] = currentAttempt
          await window.spark.kv.set(LOGIN_ATTEMPTS_KEY, attemptsData)
          
          await logAudit(user.id, user.email, 'login_2fa_failed', 'Invalid 2FA code', 'auth', user.id)
          return { success: false, error: 'Invalid authentication code', requires2FA: true }
        }

        if (isBackupCode) {
          const updatedBackupCodes = user.twoFactorBackupCodes?.filter(code => code !== totpCode) || []
          const updatedUsers = allUsers.map(u => 
            u.id === user.id ? { ...u, twoFactorBackupCodes: updatedBackupCodes } : u
          )
          await window.spark.kv.set(USERS_KEY, updatedUsers)
          setUsers(updatedUsers)
          await logAudit(user.id, user.email, 'backup_code_used', `Backup code used. ${updatedBackupCodes.length} remaining`, 'auth', user.id)
        }
      }

      delete attemptsData[email]
      await window.spark.kv.set(LOGIN_ATTEMPTS_KEY, attemptsData)
      await window.spark.kv.delete(PENDING_2FA_KEY)

      user.lastLogin = now
      const updatedUsers = allUsers.map(u => u.id === user.id ? user : u)
      await window.spark.kv.set(USERS_KEY, updatedUsers)
      setUsers(updatedUsers)

      const newSession: Session = {
        userId: user.id,
        expiresAt: now + SESSION_DURATION
      }

      console.log('[auth.login] Creating session:', newSession)
      setSession(newSession)
      
      // Force update the users state to ensure effect finds the user
      const latestUsers = await window.spark.kv.get<User[]>(USERS_KEY) || []
      console.log('[auth.login] Force updating users state with:', latestUsers.length, 'users')
      setUsers(latestUsers)
      
      console.log('[auth.login] Session set, logging audit...')
      await logAudit(user.id, user.email, 'login', 'User logged in successfully', 'auth', user.id)
      console.log('[auth.login] Login complete, returning success')

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An error occurred. Please try again.' }
    }
  }

  const logout = async () => {
    if (currentUser) {
      await logAudit(currentUser.id, currentUser.email, 'logout', 'User logged out', 'auth', currentUser.id)
    }
    setSession(null)
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
    const allUsers = await window.spark.kv.get<User[]>(USERS_KEY) || []
    const updatedUsers = allUsers.map(u => 
      u.id === currentUser.id ? { ...u, passwordHash: newHash, passwordSalt: newSalt } : u
    )
    
    await window.spark.kv.set(USERS_KEY, updatedUsers)
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
    const qrCodeURL = generateQRCodeURL(secret, 'xTx396 Hub', currentUser.email)
    
    const backupCodes = Array.from({ length: 10 }, () => {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase()
      return code.slice(0, 4) + '-' + code.slice(4)
    })

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

    const allUsers = await window.spark.kv.get<User[]>(USERS_KEY) || []
    const updatedUsers = allUsers.map(u => 
      u.id === currentUser.id 
        ? { 
            ...u, 
            twoFactorEnabled: true, 
            twoFactorSecret: encryptedSecret,
            twoFactorBackupCodes: backupCodes
          } 
        : u
    )
    
    await window.spark.kv.set(USERS_KEY, updatedUsers)
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

    const allUsers = await window.spark.kv.get<User[]>(USERS_KEY) || []
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
    
    await window.spark.kv.set(USERS_KEY, updatedUsers)
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

    const backupCodes = Array.from({ length: 10 }, () => {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase()
      return code.slice(0, 4) + '-' + code.slice(4)
    })

    const allUsers = await window.spark.kv.get<User[]>(USERS_KEY) || []
    const updatedUsers = allUsers.map(u => 
      u.id === currentUser.id 
        ? { ...u, twoFactorBackupCodes: backupCodes } 
        : u
    )
    
    await window.spark.kv.set(USERS_KEY, updatedUsers)
    setUsers(updatedUsers)
    
    await logAudit(currentUser.id, currentUser.email, 'backup_codes_regenerated', 'Backup codes regenerated', 'auth', currentUser.id)
    
    return { success: true, backupCodes }
  }

  return {
    currentUser,
    isAuthenticated: !!currentUser && !!session && session.expiresAt > Date.now(),
    isLoading,
    login,
    logout,
    changePassword,
    setup2FA,
    enable2FA,
    disable2FA,
    regenerateBackupCodes
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
  const log = await window.spark.kv.get<(AuditEvent | string)[]>(AUDIT_LOG_KEY) || []
  
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

  await window.spark.kv.set(AUDIT_LOG_KEY, log)
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
