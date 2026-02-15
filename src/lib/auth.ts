import { useKV } from '@github/spark/hooks'
import { User, Session, AuditEvent, AuditAction } from './types'
import { useState, useEffect } from 'react'
import { generateSecret, verifyTOTP, generateQRCodeURL } from './totp'

const SESSION_KEY = 'founder-hub-session'
const USERS_KEY = 'founder-hub-users'
const LOGIN_ATTEMPTS_KEY = 'founder-hub-login-attempts'
const AUDIT_LOG_KEY = 'founder-hub-audit-log'
const PENDING_2FA_KEY = 'founder-hub-pending-2fa'
const LOCKOUT_DURATION = 15 * 60 * 1000
const MAX_ATTEMPTS = 5
const SESSION_DURATION = 8 * 60 * 60 * 1000

interface LoginAttempt {
  count: number
  lockedUntil?: number
  lastAttempt: number
}

interface Pending2FA {
  userId: string
  expiresAt: number
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function initializeDefaultAdmin(): Promise<void> {
  const users = await window.spark.kv.get<User[]>(USERS_KEY)
  
  if (!users || users.length === 0) {
    const defaultPasswordHash = await hashPassword('SecureAdmin2024!')
    
    const defaultAdmin: User = {
      id: `user_${Date.now()}`,
      email: 'admin@xtx396.online',
      passwordHash: defaultPasswordHash,
      role: 'owner',
      createdAt: Date.now(),
      lastLogin: 0
    }
    
    await window.spark.kv.set(USERS_KEY, [defaultAdmin])
    console.log('Default admin account created')
  }
}

export function useAuth() {
  const [session, setSession] = useKV<Session | null>(SESSION_KEY, null)
  const [users, setUsers] = useKV<User[]>(USERS_KEY, [])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeDefaultAdmin()
  }, [])

  useEffect(() => {
    if (session && session.expiresAt > Date.now()) {
      const user = users?.find(u => u.id === session.userId)
      if (user) {
        setCurrentUser(user)
      } else {
        setSession(null)
        setCurrentUser(null)
      }
    } else if (session) {
      setSession(null)
      setCurrentUser(null)
    } else {
      setCurrentUser(null)
    }
    setIsLoading(false)
  }, [session, users, setSession])

  const login = async (email: string, password: string, totpCode?: string): Promise<{ success: boolean; error?: string; requires2FA?: boolean }> => {
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
      const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
      
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

      const passwordHash = await hashPassword(password)
      
      if (passwordHash !== user.passwordHash) {
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

      if (user.twoFactorEnabled && user.twoFactorSecret) {
        if (!totpCode) {
          const pending2FA: Pending2FA = {
            userId: user.id,
            expiresAt: now + 5 * 60 * 1000
          }
          await window.spark.kv.set(PENDING_2FA_KEY, pending2FA)
          await logAudit(user.id, user.email, 'login_2fa_required', 'Password verified, awaiting 2FA', 'auth', user.id)
          return { success: false, requires2FA: true }
        }

        const isBackupCode = user.twoFactorBackupCodes?.includes(totpCode)
        const isValidTOTP = await verifyTOTP(user.twoFactorSecret, totpCode)

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

      setSession(newSession)
      await logAudit(user.id, user.email, 'login', 'User logged in successfully', 'auth', user.id)

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

    const currentHash = await hashPassword(currentPassword)
    if (currentHash !== currentUser.passwordHash) {
      await logAudit(currentUser.id, currentUser.email, 'password_change_failed', 'Invalid current password', 'auth', currentUser.id)
      return { success: false, error: 'Current password is incorrect' }
    }

    const newHash = await hashPassword(newPassword)
    const allUsers = await window.spark.kv.get<User[]>(USERS_KEY) || []
    const updatedUsers = allUsers.map(u => 
      u.id === currentUser.id ? { ...u, passwordHash: newHash } : u
    )
    
    await window.spark.kv.set(USERS_KEY, updatedUsers)
    setUsers(updatedUsers)
    
    await logAudit(currentUser.id, currentUser.email, 'password_changed', 'Password changed successfully', 'auth', currentUser.id)
    
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

    const allUsers = await window.spark.kv.get<User[]>(USERS_KEY) || []
    const updatedUsers = allUsers.map(u => 
      u.id === currentUser.id 
        ? { 
            ...u, 
            twoFactorEnabled: true, 
            twoFactorSecret: secret,
            twoFactorBackupCodes: backupCodes
          } 
        : u
    )
    
    await window.spark.kv.set(USERS_KEY, updatedUsers)
    setUsers(updatedUsers)
    
    await logAudit(currentUser.id, currentUser.email, '2fa_enabled', 'Two-factor authentication enabled', 'auth', currentUser.id)
    
    return { success: true }
  }

  const disable2FA = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!currentUser.twoFactorEnabled) {
      return { success: false, error: 'Two-factor authentication is not enabled' }
    }

    const passwordHash = await hashPassword(password)
    if (passwordHash !== currentUser.passwordHash) {
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

    const passwordHash = await hashPassword(password)
    if (passwordHash !== currentUser.passwordHash) {
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
  const log = await window.spark.kv.get<AuditEvent[]>(AUDIT_LOG_KEY) || []
  
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

  log.unshift(event)
  
  if (log.length > 1000) {
    log.splice(1000)
  }

  await window.spark.kv.set(AUDIT_LOG_KEY, log)
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
