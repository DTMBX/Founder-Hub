/**
 * Session Manager - Enterprise Session Control
 * 
 * Chain B7 - Identity + Session Hardening
 * 
 * Provides:
 * - Session scopes (read, write, deploy, admin, owner)
 * - Step-up authentication for privileged actions
 * - Session timeouts (idle + absolute)
 * - Concurrent session limits
 * - Session revocation
 * - Audit integration
 */

import { auditLedger } from './audit-ledger'

// ─── Types ───────────────────────────────────────────────────

export type SessionScope = 'read' | 'write' | 'deploy' | 'admin' | 'owner'

export type UserRole = 'owner' | 'admin' | 'editor' | 'support' | 'viewer'

export interface SessionConfig {
  /** Session scopes */
  scopes: SessionScope[]
  
  /** Idle timeout in milliseconds */
  idleTimeout: number
  
  /** Absolute timeout in milliseconds */
  absoluteTimeout: number
  
  /** Whether "remember me" is enabled */
  rememberMe: boolean
  
  /** Device ID for this session */
  deviceId: string
  
  /** Whether device is trusted */
  deviceTrusted: boolean
}

export interface EnhancedSession {
  /** Session ID */
  id: string
  
  /** User ID */
  userId: string
  
  /** User role */
  role: UserRole
  
  /** Session scopes */
  scopes: SessionScope[]
  
  /** Creation timestamp */
  createdAt: string
  
  /** Last activity timestamp */
  lastActivityAt: string
  
  /** Absolute expiration */
  expiresAt: string
  
  /** Idle timeout in ms */
  idleTimeoutMs: number
  
  /** Device ID */
  deviceId: string
  
  /** Whether device is trusted */
  deviceTrusted: boolean
  
  /** IP address */
  ipAddress?: string
  
  /** User agent */
  userAgent?: string
  
  /** Step-up auth timestamp (for elevated actions) */
  stepUpAuthAt?: string
  
  /** MFA verified */
  mfaVerified: boolean
  
  /** Remember me enabled */
  rememberMe: boolean
}

export interface StepUpAuthResult {
  /** Whether step-up succeeded */
  success: boolean
  
  /** Error message if failed */
  error?: string
  
  /** Valid until timestamp */
  validUntil?: string
}

export interface SessionRevocationResult {
  /** Number of sessions revoked */
  revokedCount: number
  
  /** Session IDs revoked */
  sessionIds: string[]
}

// ─── Constants ───────────────────────────────────────────────

const SESSIONS_KEY = 'xtx396_enhanced_sessions'
const STEP_UP_VALIDITY_MS = 5 * 60 * 1000 // 5 minutes

// Session timeouts by type (in ms)
const SESSION_TIMEOUTS = {
  standard: {
    idle: 30 * 60 * 1000,      // 30 minutes
    absolute: 8 * 60 * 60 * 1000 // 8 hours
  },
  rememberMe: {
    idle: 7 * 24 * 60 * 60 * 1000,    // 7 days
    absolute: 30 * 24 * 60 * 60 * 1000 // 30 days
  },
  deployCapable: {
    idle: 15 * 60 * 1000,      // 15 minutes
    absolute: 2 * 60 * 60 * 1000 // 2 hours
  },
  readOnly: {
    idle: 2 * 60 * 60 * 1000,   // 2 hours
    absolute: 24 * 60 * 60 * 1000 // 24 hours
  }
}

// Max concurrent sessions by role
const MAX_SESSIONS: Record<UserRole, number> = {
  owner: 3,
  admin: 5,
  editor: 10,
  support: 10,
  viewer: 100
}

// Scope hierarchy - higher scopes include lower ones
const SCOPE_HIERARCHY: Record<SessionScope, SessionScope[]> = {
  read: [],
  write: ['read'],
  deploy: ['read', 'write'],
  admin: ['read', 'write'],
  owner: ['read', 'write', 'deploy', 'admin']
}

// Actions requiring step-up auth
export const STEP_UP_REQUIRED_ACTIONS = [
  'publish_production',
  'modify_security_settings',
  'add_team_member',
  'remove_team_member',
  'revoke_sessions',
  'access_secrets',
  'approve_device',
  'change_email',
  'change_password',
  'export_audit_logs',
  'delete_data',
  'role_change'
] as const

export type StepUpAction = typeof STEP_UP_REQUIRED_ACTIONS[number]

// ─── Storage ─────────────────────────────────────────────────

function loadSessions(): EnhancedSession[] {
  try {
    const data = localStorage.getItem(SESSIONS_KEY)
    if (!data) return []
    return JSON.parse(data) as EnhancedSession[]
  } catch {
    return []
  }
}

function saveSessions(sessions: EnhancedSession[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  } catch (error) {
    console.error('[SessionManager] Failed to save sessions:', error)
  }
}

// ─── Helper Functions ────────────────────────────────────────

function generateSessionId(): string {
  const timestamp = Date.now().toString(36)
  const random = crypto.getRandomValues(new Uint8Array(16))
  const randomStr = Array.from(random).map(b => b.toString(16).padStart(2, '0')).join('')
  return `sess_${timestamp}_${randomStr}`
}

function getEffectiveScopes(scopes: SessionScope[]): SessionScope[] {
  const effective = new Set<SessionScope>(scopes)
  
  for (const scope of scopes) {
    const inherited = SCOPE_HIERARCHY[scope]
    inherited.forEach(s => effective.add(s))
  }
  
  return Array.from(effective)
}

function isSessionExpired(session: EnhancedSession): boolean {
  const now = Date.now()
  
  // Check absolute expiration
  if (new Date(session.expiresAt).getTime() <= now) {
    return true
  }
  
  // Check idle timeout
  const lastActivity = new Date(session.lastActivityAt).getTime()
  if (now - lastActivity > session.idleTimeoutMs) {
    return true
  }
  
  return false
}

function getDefaultScopesForRole(role: UserRole): SessionScope[] {
  switch (role) {
    case 'owner':
      return ['read', 'write'] // Must elevate for deploy/admin
    case 'admin':
      return ['read', 'write']
    case 'editor':
      return ['read', 'write']
    case 'support':
      return ['read']
    case 'viewer':
      return ['read']
    default:
      return ['read']
  }
}

// ─── Session Manager Class ───────────────────────────────────

class SessionManager {
  private sessions: EnhancedSession[] = []
  private currentSessionId: string | null = null
  private initialized = false
  
  /**
   * Initialize the session manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return
    
    this.sessions = loadSessions()
    
    // Clean up expired sessions
    await this.cleanupExpiredSessions()
    
    // Try to restore current session from sessionStorage
    this.currentSessionId = sessionStorage.getItem('current_session_id')
    
    this.initialized = true
  }
  
  /**
   * Create a new session
   */
  async createSession(options: {
    userId: string
    role: UserRole
    deviceId: string
    deviceTrusted?: boolean
    mfaVerified?: boolean
    rememberMe?: boolean
    ipAddress?: string
    userAgent?: string
    scopes?: SessionScope[]
  }): Promise<EnhancedSession> {
    await this.initialize()
    
    const now = new Date()
    const sessionId = generateSessionId()
    
    // Determine timeout based on options
    let timeoutConfig = SESSION_TIMEOUTS.standard
    if (options.rememberMe && options.deviceTrusted) {
      timeoutConfig = SESSION_TIMEOUTS.rememberMe
    }
    
    // Default scopes based on role
    const scopes = options.scopes ?? getDefaultScopesForRole(options.role)
    
    const session: EnhancedSession = {
      id: sessionId,
      userId: options.userId,
      role: options.role,
      scopes: getEffectiveScopes(scopes),
      createdAt: now.toISOString(),
      lastActivityAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + timeoutConfig.absolute).toISOString(),
      idleTimeoutMs: timeoutConfig.idle,
      deviceId: options.deviceId,
      deviceTrusted: options.deviceTrusted ?? false,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      mfaVerified: options.mfaVerified ?? false,
      rememberMe: options.rememberMe ?? false
    }
    
    // Enforce concurrent session limits
    await this.enforceSessionLimits(options.userId, options.role)
    
    this.sessions.push(session)
    saveSessions(this.sessions)
    
    this.currentSessionId = sessionId
    sessionStorage.setItem('current_session_id', sessionId)
    
    // Audit log
    await auditLedger.append({
      category: 'authentication',
      action: 'session_created',
      description: `New session created for user ${options.userId}`,
      severity: 'info',
      actor: { id: options.userId, type: 'user' },
      target: { type: 'session', id: sessionId },
      metadata: {
        deviceId: options.deviceId,
        deviceTrusted: options.deviceTrusted,
        mfaVerified: options.mfaVerified,
        scopes: session.scopes
      }
    })
    
    return session
  }
  
  /**
   * Get current session
   */
  getCurrentSession(): EnhancedSession | null {
    if (!this.currentSessionId) return null
    
    const session = this.sessions.find(s => s.id === this.currentSessionId)
    if (!session) return null
    
    if (isSessionExpired(session)) {
      this.terminateSession(session.id, 'expired')
      return null
    }
    
    return session
  }
  
  /**
   * Update session activity (refresh idle timeout)
   */
  async refreshActivity(sessionId?: string): Promise<void> {
    const id = sessionId ?? this.currentSessionId
    if (!id) return
    
    const index = this.sessions.findIndex(s => s.id === id)
    if (index === -1) return
    
    this.sessions[index].lastActivityAt = new Date().toISOString()
    saveSessions(this.sessions)
  }
  
  /**
   * Check if session has a specific scope
   */
  hasScope(scope: SessionScope, sessionId?: string): boolean {
    const id = sessionId ?? this.currentSessionId
    if (!id) return false
    
    const session = this.sessions.find(s => s.id === id)
    if (!session || isSessionExpired(session)) return false
    
    const effectiveScopes = getEffectiveScopes(session.scopes)
    return effectiveScopes.includes(scope)
  }
  
  /**
   * Elevate session scopes (requires step-up auth)
   */
  async elevateScopes(
    scopes: SessionScope[],
    sessionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    const id = sessionId ?? this.currentSessionId
    if (!id) return { success: false, error: 'No active session' }
    
    const index = this.sessions.findIndex(s => s.id === id)
    if (index === -1) return { success: false, error: 'Session not found' }
    
    const session = this.sessions[index]
    
    // Check step-up auth is valid
    if (!this.isStepUpValid(session)) {
      return { success: false, error: 'Step-up authentication required' }
    }
    
    // Add elevated scopes
    const newScopes = [...new Set([...session.scopes, ...scopes])]
    session.scopes = getEffectiveScopes(newScopes)
    
    // Reduce timeout for elevated sessions
    if (scopes.includes('deploy')) {
      session.idleTimeoutMs = SESSION_TIMEOUTS.deployCapable.idle
      session.expiresAt = new Date(
        Date.now() + SESSION_TIMEOUTS.deployCapable.absolute
      ).toISOString()
    }
    
    this.sessions[index] = session
    saveSessions(this.sessions)
    
    // Audit log
    await auditLedger.append({
      category: 'authorization',
      action: 'scope_elevated',
      description: `Session scopes elevated to: ${newScopes.join(', ')}`,
      severity: 'warning',
      actor: { id: session.userId, type: 'user' },
      target: { type: 'session', id: session.id },
      metadata: { scopes: newScopes }
    })
    
    return { success: true }
  }
  
  /**
   * Record step-up authentication
   */
  async recordStepUp(sessionId?: string): Promise<void> {
    const id = sessionId ?? this.currentSessionId
    if (!id) return
    
    const index = this.sessions.findIndex(s => s.id === id)
    if (index === -1) return
    
    this.sessions[index].stepUpAuthAt = new Date().toISOString()
    saveSessions(this.sessions)
    
    await auditLedger.append({
      category: 'authentication',
      action: 'step_up_auth_success',
      description: 'Step-up authentication completed',
      severity: 'info',
      actor: { id: this.sessions[index].userId, type: 'user' },
      target: { type: 'session', id }
    })
  }
  
  /**
   * Check if step-up auth is currently valid
   */
  isStepUpValid(session?: EnhancedSession): boolean {
    const s = session ?? this.getCurrentSession()
    if (!s || !s.stepUpAuthAt) return false
    
    const stepUpTime = new Date(s.stepUpAuthAt).getTime()
    return Date.now() - stepUpTime < STEP_UP_VALIDITY_MS
  }
  
  /**
   * Check if action requires step-up and whether it's valid
   */
  requiresStepUp(action: StepUpAction): boolean {
    return STEP_UP_REQUIRED_ACTIONS.includes(action)
  }
  
  /**
   * Validate if action can proceed (has required scope + step-up if needed)
   */
  async canPerformAction(
    action: StepUpAction,
    requiredScope: SessionScope
  ): Promise<{ allowed: boolean; reason?: string; requiresStepUp?: boolean }> {
    const session = this.getCurrentSession()
    if (!session) {
      return { allowed: false, reason: 'No active session' }
    }
    
    // Check scope
    if (!this.hasScope(requiredScope)) {
      return { allowed: false, reason: `Missing required scope: ${requiredScope}` }
    }
    
    // Check step-up requirement
    if (this.requiresStepUp(action) && !this.isStepUpValid(session)) {
      return { allowed: false, reason: 'Step-up authentication required', requiresStepUp: true }
    }
    
    return { allowed: true }
  }
  
  /**
   * Terminate a session
   */
  async terminateSession(sessionId: string, reason: string = 'user_logout'): Promise<void> {
    const index = this.sessions.findIndex(s => s.id === sessionId)
    if (index === -1) return
    
    const session = this.sessions[index]
    this.sessions.splice(index, 1)
    saveSessions(this.sessions)
    
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null
      sessionStorage.removeItem('current_session_id')
    }
    
    await auditLedger.append({
      category: 'authentication',
      action: 'session_terminated',
      description: `Session terminated: ${reason}`,
      severity: reason === 'user_logout' ? 'info' : 'warning',
      actor: { id: session.userId, type: 'user' },
      target: { type: 'session', id: sessionId },
      metadata: { reason }
    })
  }
  
  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(
    userId: string,
    exceptSessionId?: string
  ): Promise<SessionRevocationResult> {
    const userSessions = this.sessions.filter(s => 
      s.userId === userId && s.id !== exceptSessionId
    )
    
    const revokedIds = userSessions.map(s => s.id)
    
    this.sessions = this.sessions.filter(s => 
      s.userId !== userId || s.id === exceptSessionId
    )
    saveSessions(this.sessions)
    
    // Clear current if revoked
    if (this.currentSessionId && revokedIds.includes(this.currentSessionId)) {
      this.currentSessionId = null
      sessionStorage.removeItem('current_session_id')
    }
    
    await auditLedger.append({
      category: 'security',
      action: 'sessions_revoked',
      description: `Revoked ${revokedIds.length} sessions for user ${userId}`,
      severity: 'warning',
      actor: { id: userId, type: 'user' },
      metadata: { sessionIds: revokedIds, exceptSessionId }
    })
    
    return { revokedCount: revokedIds.length, sessionIds: revokedIds }
  }
  
  /**
   * Revoke sessions by device
   */
  async revokeDeviceSessions(deviceId: string): Promise<SessionRevocationResult> {
    const deviceSessions = this.sessions.filter(s => s.deviceId === deviceId)
    const revokedIds = deviceSessions.map(s => s.id)
    
    this.sessions = this.sessions.filter(s => s.deviceId !== deviceId)
    saveSessions(this.sessions)
    
    if (this.currentSessionId && revokedIds.includes(this.currentSessionId)) {
      this.currentSessionId = null
      sessionStorage.removeItem('current_session_id')
    }
    
    await auditLedger.append({
      category: 'security',
      action: 'device_sessions_revoked',
      description: `Revoked ${revokedIds.length} sessions for device ${deviceId}`,
      severity: 'warning',
      metadata: { deviceId, sessionIds: revokedIds }
    })
    
    return { revokedCount: revokedIds.length, sessionIds: revokedIds }
  }
  
  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): EnhancedSession[] {
    return this.sessions.filter(s => s.userId === userId && !isSessionExpired(s))
  }
  
  /**
   * Get all active sessions
   */
  getAllSessions(): EnhancedSession[] {
    return this.sessions.filter(s => !isSessionExpired(s))
  }
  
  /**
   * Enforce session limits for a user
   */
  private async enforceSessionLimits(userId: string, role: UserRole): Promise<void> {
    const userSessions = this.sessions
      .filter(s => s.userId === userId && !isSessionExpired(s))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    
    const maxSessions = MAX_SESSIONS[role]
    
    if (userSessions.length >= maxSessions) {
      // Terminate oldest sessions
      const toTerminate = userSessions.slice(0, userSessions.length - maxSessions + 1)
      for (const session of toTerminate) {
        await this.terminateSession(session.id, 'session_limit_exceeded')
      }
    }
  }
  
  /**
   * Clean up expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const expiredIds: string[] = []
    
    this.sessions = this.sessions.filter(s => {
      if (isSessionExpired(s)) {
        expiredIds.push(s.id)
        return false
      }
      return true
    })
    
    if (expiredIds.length > 0) {
      saveSessions(this.sessions)
    }
  }
  
  /**
   * Check if MFA is required for a role
   */
  isMfaRequired(role: UserRole): boolean {
    return role === 'owner' || role === 'admin'
  }
  
  /**
   * Get session timeout configuration for display
   */
  getSessionTimeoutInfo(session?: EnhancedSession): {
    idleTimeoutMinutes: number
    absoluteTimeoutHours: number
    expiresIn: string
  } {
    const s = session ?? this.getCurrentSession()
    if (!s) {
      return { idleTimeoutMinutes: 30, absoluteTimeoutHours: 8, expiresIn: 'N/A' }
    }
    
    const expiresAt = new Date(s.expiresAt).getTime()
    const now = Date.now()
    const remainingMs = expiresAt - now
    
    let expiresIn: string
    if (remainingMs < 0) {
      expiresIn = 'Expired'
    } else if (remainingMs < 60 * 1000) {
      expiresIn = 'Less than 1 minute'
    } else if (remainingMs < 60 * 60 * 1000) {
      expiresIn = `${Math.floor(remainingMs / (60 * 1000))} minutes`
    } else {
      expiresIn = `${Math.floor(remainingMs / (60 * 60 * 1000))} hours`
    }
    
    return {
      idleTimeoutMinutes: Math.floor(s.idleTimeoutMs / (60 * 1000)),
      absoluteTimeoutHours: Math.floor(
        (expiresAt - new Date(s.createdAt).getTime()) / (60 * 60 * 1000)
      ),
      expiresIn
    }
  }
}

// ─── Singleton Export ────────────────────────────────────────

export const sessionManager = new SessionManager()

// ─── Convenience Functions ───────────────────────────────────

/**
 * Check if current session has a scope
 */
export function hasSessionScope(scope: SessionScope): boolean {
  return sessionManager.hasScope(scope)
}

/**
 * Check if action can be performed
 */
export async function canPerformAction(
  action: StepUpAction,
  requiredScope: SessionScope
): Promise<{ allowed: boolean; reason?: string; requiresStepUp?: boolean }> {
  return sessionManager.canPerformAction(action, requiredScope)
}

/**
 * Record step-up authentication
 */
export async function recordStepUpAuth(): Promise<void> {
  return sessionManager.recordStepUp()
}

/**
 * Check if step-up auth is currently valid
 */
export function isStepUpAuthValid(): boolean {
  return sessionManager.isStepUpValid()
}

/**
 * Revoke all sessions except current
 */
export async function revokeOtherSessions(userId: string): Promise<SessionRevocationResult> {
  const currentSession = sessionManager.getCurrentSession()
  return sessionManager.revokeAllUserSessions(userId, currentSession?.id)
}
