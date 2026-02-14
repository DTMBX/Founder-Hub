import { useKV } from '@github/spark/hooks'
import { User, Session, AuditEvent, AuditAction } from './types'
import { useState, useEffect } from 'react'

const SESSION_KEY = 'founder-hub-session'
const USERS_KEY = 'founder-hub-users'
const LOGIN_ATTEMPTS_KEY = 'founder-hub-login-attempts'
const AUDIT_LOG_KEY = 'founder-hub-audit-log'

export function useAuth() {
  const [session, setSession] = useKV<Session | null>(SESSION_KEY, null)
  const [users] = useKV<User[]>(USERS_KEY, [])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session && session.expiresAt > Date.now()) {
      const user = users?.find(u => u.id === session.userId)
      setCurrentUser(user || null)
    } else {
      setCurrentUser(null)
    }
    setIsLoading(false)
  }, [session, users])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const attempts = await window.spark.kv.get<Record<string, number>>(LOGIN_ATTEMPTS_KEY) || {}
    const attemptCount = attempts[email] || 0

    if (attemptCount >= 5) {
      return { success: false, error: 'Account locked. Too many failed attempts. Please try again later.' }
    }

    const user = users?.find(u => u.email === email)
    
    if (!user || password !== 'admin123') {
      attempts[email] = attemptCount + 1
      await window.spark.kv.set(LOGIN_ATTEMPTS_KEY, attempts)
      return { success: false, error: 'Invalid email or password' }
    }

    delete attempts[email]
    await window.spark.kv.set(LOGIN_ATTEMPTS_KEY, attempts)

    const newSession: Session = {
      userId: user.id,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    }

    setSession(newSession)
    await logAudit(user.id, user.email, 'login', 'User logged in')

    return { success: true }
  }

  const logout = async () => {
    if (currentUser) {
      await logAudit(currentUser.id, currentUser.email, 'logout', 'User logged out')
    }
    setSession(null)
  }

  return {
    currentUser,
    isAuthenticated: !!currentUser && !!session && session.expiresAt > Date.now(),
    isLoading,
    login,
    logout
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
