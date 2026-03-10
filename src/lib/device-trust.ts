/**
 * Device Trust - Device Registration and Approval
 * 
 * Chain B7 - Identity + Session Hardening
 * 
 * Provides:
 * - Device fingerprinting
 * - Trusted device list management
 * - New device alerts + approval flow
 * - Device revocation
 * - Audit integration
 */

import { auditLedger } from './audit-ledger'
import type { UserRole } from './session-manager'

// ─── Types ───────────────────────────────────────────────────

export interface DeviceFingerprint {
  /** Browser name and version */
  browser: string
  
  /** Operating system */
  os: string
  
  /** Screen resolution */
  screen: string
  
  /** Timezone */
  timezone: string
  
  /** Language */
  language: string
  
  /** Color depth */
  colorDepth: number
  
  /** Platform */
  platform: string
  
  /** Touch support */
  touchSupport: boolean
  
  /** WebGL renderer (hardware ID) */
  webglRenderer?: string
  
  /** Canvas fingerprint hash */
  canvasHash?: string
}

export interface Device {
  /** Unique device ID */
  id: string
  
  /** User ID who owns this device */
  userId: string
  
  /** Device name (user-provided) */
  name: string
  
  /** Device fingerprint */
  fingerprint: DeviceFingerprint
  
  /** Whether device is trusted */
  trusted: boolean
  
  /** First seen timestamp */
  firstSeenAt: string
  
  /** Last seen timestamp */
  lastSeenAt: string
  
  /** Last successful login */
  lastLoginAt?: string
  
  /** Approximate location (country/city) */
  location?: {
    country?: string
    city?: string
    ip?: string
  }
  
  /** Device approval status */
  approvalStatus: 'pending' | 'approved' | 'denied' | 'revoked'
  
  /** Approval timestamp */
  approvedAt?: string
  
  /** Who approved the device */
  approvedBy?: string
  
  /** Denial/revocation reason */
  rejectionReason?: string
}

export interface PendingApproval {
  /** Approval request ID */
  id: string
  
  /** Device ID */
  deviceId: string
  
  /** User ID */
  userId: string
  
  /** Request timestamp */
  requestedAt: string
  
  /** Expiration timestamp */
  expiresAt: string
  
  /** Approval code (sent via email/authenticator) */
  approvalCode: string
  
  /** Number of attempts */
  attempts: number
  
  /** Whether expired */
  expired: boolean
}

export interface DeviceAlert {
  /** Alert ID */
  id: string
  
  /** User ID */
  userId: string
  
  /** Device ID */
  deviceId: string
  
  /** Alert type */
  type: 'new_device' | 'suspicious_location' | 'device_revoked'
  
  /** Alert message */
  message: string
  
  /** Timestamp */
  timestamp: string
  
  /** Whether read */
  read: boolean
  
  /** Device info for display */
  deviceInfo: {
    browser: string
    os: string
    location?: string
  }
}

// ─── Constants ───────────────────────────────────────────────

const DEVICES_KEY = 'founder-hub_devices'
const PENDING_APPROVALS_KEY = 'founder-hub_pending_device_approvals'
const ALERTS_KEY = 'founder-hub_device_alerts'
const MAX_TRUSTED_DEVICES = 10
const APPROVAL_EXPIRY_MS = 15 * 60 * 1000 // 15 minutes
const MAX_APPROVAL_ATTEMPTS = 3

// Roles that require device approval for new devices
const DEVICE_APPROVAL_REQUIRED_ROLES: UserRole[] = ['owner', 'admin']

// ─── Storage ─────────────────────────────────────────────────

function loadDevices(): Device[] {
  try {
    const data = localStorage.getItem(DEVICES_KEY)
    if (!data) return []
    return JSON.parse(data) as Device[]
  } catch {
    return []
  }
}

function saveDevices(devices: Device[]): void {
  try {
    localStorage.setItem(DEVICES_KEY, JSON.stringify(devices))
  } catch (error) {
    console.error('[DeviceTrust] Failed to save devices:', error)
  }
}

function loadPendingApprovals(): PendingApproval[] {
  try {
    const data = localStorage.getItem(PENDING_APPROVALS_KEY)
    if (!data) return []
    return JSON.parse(data) as PendingApproval[]
  } catch {
    return []
  }
}

function savePendingApprovals(approvals: PendingApproval[]): void {
  try {
    localStorage.setItem(PENDING_APPROVALS_KEY, JSON.stringify(approvals))
  } catch (error) {
    console.error('[DeviceTrust] Failed to save approvals:', error)
  }
}

function loadAlerts(): DeviceAlert[] {
  try {
    const data = localStorage.getItem(ALERTS_KEY)
    if (!data) return []
    return JSON.parse(data) as DeviceAlert[]
  } catch {
    return []
  }
}

function saveAlerts(alerts: DeviceAlert[]): void {
  try {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts))
  } catch (error) {
    console.error('[DeviceTrust] Failed to save alerts:', error)
  }
}

// ─── Helper Functions ────────────────────────────────────────

function generateDeviceId(): string {
  const timestamp = Date.now().toString(36)
  const random = crypto.getRandomValues(new Uint8Array(8))
  const randomStr = Array.from(random).map(b => b.toString(16).padStart(2, '0')).join('')
  return `dev_${timestamp}_${randomStr}`
}

function generateApprovalCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const random = crypto.getRandomValues(new Uint8Array(6))
  for (const byte of random) {
    code += chars[byte % chars.length]
  }
  return code
}

/**
 * Generate device fingerprint from browser
 */
export async function generateFingerprint(): Promise<DeviceFingerprint> {
  const nav = navigator
  const screen = window.screen
  
  // Get browser info
  const browserInfo = getBrowserInfo()
  
  // Get WebGL renderer for hardware fingerprint
  let webglRenderer: string | undefined
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl')
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      }
    }
  } catch {
    // WebGL not available
  }
  
  // Generate canvas fingerprint hash
  let canvasHash: string | undefined
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 50
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = '#069'
      ctx.fillText('Fingerprint', 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('Canvas', 4, 17)
      
      const data = canvas.toDataURL()
      canvasHash = await hashString(data)
    }
  } catch {
    // Canvas not available
  }
  
  return {
    browser: browserInfo.name + ' ' + browserInfo.version,
    os: getOSInfo(),
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: nav.language,
    colorDepth: screen.colorDepth,
    platform: nav.platform,
    touchSupport: 'ontouchstart' in window || nav.maxTouchPoints > 0,
    webglRenderer,
    canvasHash
  }
}

function getBrowserInfo(): { name: string; version: string } {
  const ua = navigator.userAgent
  
  if (ua.includes('Firefox/')) {
    const match = ua.match(/Firefox\/(\d+)/)
    return { name: 'Firefox', version: match?.[1] ?? 'Unknown' }
  }
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    const match = ua.match(/Chrome\/(\d+)/)
    return { name: 'Chrome', version: match?.[1] ?? 'Unknown' }
  }
  if (ua.includes('Edg/')) {
    const match = ua.match(/Edg\/(\d+)/)
    return { name: 'Edge', version: match?.[1] ?? 'Unknown' }
  }
  if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    const match = ua.match(/Version\/(\d+)/)
    return { name: 'Safari', version: match?.[1] ?? 'Unknown' }
  }
  
  return { name: 'Unknown', version: 'Unknown' }
}

function getOSInfo(): string {
  const ua = navigator.userAgent
  
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac OS')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  
  return 'Unknown'
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Compare two fingerprints for similarity
 */
function fingerprintsMatch(a: DeviceFingerprint, b: DeviceFingerprint): boolean {
  // Core attributes that must match
  if (a.browser !== b.browser) return false
  if (a.os !== b.os) return false
  if (a.platform !== b.platform) return false
  
  // WebGL renderer is a strong hardware identifier
  if (a.webglRenderer && b.webglRenderer && a.webglRenderer !== b.webglRenderer) {
    return false
  }
  
  // Allow some variance in screen resolution
  // (user might connect/disconnect external monitor)
  
  return true
}

// ─── Device Trust Class ──────────────────────────────────────

class DeviceTrust {
  private devices: Device[] = []
  private pendingApprovals: PendingApproval[] = []
  private alerts: DeviceAlert[] = []
  private currentDeviceId: string | null = null
  private initialized = false
  
  /**
   * Initialize device trust
   */
  async initialize(): Promise<void> {
    if (this.initialized) return
    
    this.devices = loadDevices()
    this.pendingApprovals = loadPendingApprovals()
    this.alerts = loadAlerts()
    
    // Clean up expired approvals
    this.cleanupExpiredApprovals()
    
    // Try to restore current device ID
    this.currentDeviceId = localStorage.getItem('current_device_id')
    
    this.initialized = true
  }
  
  /**
   * Identify current device (returns device ID)
   */
  async identifyDevice(userId: string): Promise<{
    deviceId: string
    isNew: boolean
    isTrusted: boolean
    requiresApproval: boolean
    device: Device
  }> {
    await this.initialize()
    
    const fingerprint = await generateFingerprint()
    
    // Look for existing device with matching fingerprint for this user
    const existingDevice = this.devices.find(d => 
      d.userId === userId && fingerprintsMatch(d.fingerprint, fingerprint)
    )
    
    if (existingDevice) {
      // Update last seen
      existingDevice.lastSeenAt = new Date().toISOString()
      saveDevices(this.devices)
      
      this.currentDeviceId = existingDevice.id
      localStorage.setItem('current_device_id', existingDevice.id)
      
      return {
        deviceId: existingDevice.id,
        isNew: false,
        isTrusted: existingDevice.trusted && existingDevice.approvalStatus === 'approved',
        requiresApproval: existingDevice.approvalStatus === 'pending',
        device: existingDevice
      }
    }
    
    // New device - create entry
    const now = new Date().toISOString()
    const device: Device = {
      id: generateDeviceId(),
      userId,
      name: `${fingerprint.browser} on ${fingerprint.os}`,
      fingerprint,
      trusted: false,
      firstSeenAt: now,
      lastSeenAt: now,
      approvalStatus: 'pending'
    }
    
    this.devices.push(device)
    saveDevices(this.devices)
    
    this.currentDeviceId = device.id
    localStorage.setItem('current_device_id', device.id)
    
    return {
      deviceId: device.id,
      isNew: true,
      isTrusted: false,
      requiresApproval: true,
      device
    }
  }
  
  /**
   * Check if device approval is required for role
   */
  isApprovalRequired(role: UserRole): boolean {
    return DEVICE_APPROVAL_REQUIRED_ROLES.includes(role)
  }
  
  /**
   * Create a new device approval request
   */
  async requestApproval(
    deviceId: string,
    userId: string
  ): Promise<{ approvalId: string; code: string; expiresAt: string }> {
    await this.initialize()
    
    const now = Date.now()
    const approval: PendingApproval = {
      id: `approval_${now.toString(36)}`,
      deviceId,
      userId,
      requestedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + APPROVAL_EXPIRY_MS).toISOString(),
      approvalCode: generateApprovalCode(),
      attempts: 0,
      expired: false
    }
    
    this.pendingApprovals.push(approval)
    savePendingApprovals(this.pendingApprovals)
    
    // Create alert
    await this.createAlert(userId, deviceId, 'new_device', 'New device detected and pending approval')
    
    // Audit log
    await auditLedger.append({
      category: 'authentication',
      action: 'device_approval_requested',
      description: `New device approval requested`,
      severity: 'warning',
      actor: { id: userId, type: 'user' },
      target: { type: 'device', id: deviceId },
      metadata: { approvalId: approval.id }
    })
    
    return {
      approvalId: approval.id,
      code: approval.approvalCode,
      expiresAt: approval.expiresAt
    }
  }
  
  /**
   * Verify approval code
   */
  async verifyApprovalCode(
    approvalId: string,
    code: string,
    trustDevice: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    await this.initialize()
    
    const index = this.pendingApprovals.findIndex(a => a.id === approvalId)
    if (index === -1) {
      return { success: false, error: 'Approval request not found' }
    }
    
    const approval = this.pendingApprovals[index]
    
    // Check expiration
    if (new Date(approval.expiresAt).getTime() < Date.now()) {
      approval.expired = true
      savePendingApprovals(this.pendingApprovals)
      return { success: false, error: 'Approval request expired' }
    }
    
    // Check attempts
    if (approval.attempts >= MAX_APPROVAL_ATTEMPTS) {
      return { success: false, error: 'Maximum attempts exceeded' }
    }
    
    approval.attempts++
    
    if (approval.approvalCode !== code.toUpperCase()) {
      savePendingApprovals(this.pendingApprovals)
      return { success: false, error: 'Invalid approval code' }
    }
    
    // Approve device
    await this.approveDevice(approval.deviceId, trustDevice, approval.userId)
    
    // Remove pending approval
    this.pendingApprovals.splice(index, 1)
    savePendingApprovals(this.pendingApprovals)
    
    return { success: true }
  }
  
  /**
   * Approve a device
   */
  async approveDevice(
    deviceId: string,
    trustDevice: boolean = false,
    approvedBy?: string
  ): Promise<void> {
    await this.initialize()
    
    const device = this.devices.find(d => d.id === deviceId)
    if (!device) return
    
    const now = new Date().toISOString()
    device.approvalStatus = 'approved'
    device.approvedAt = now
    device.approvedBy = approvedBy
    
    if (trustDevice) {
      // Check trust limit
      const trustedCount = this.devices.filter(d => 
        d.userId === device.userId && d.trusted
      ).length
      
      if (trustedCount < MAX_TRUSTED_DEVICES) {
        device.trusted = true
      }
    }
    
    saveDevices(this.devices)
    
    await auditLedger.append({
      category: 'security',
      action: 'device_approved',
      description: `Device ${device.name} approved${trustDevice ? ' and trusted' : ''}`,
      severity: 'info',
      actor: { id: device.userId, type: 'user' },
      target: { type: 'device', id: deviceId, name: device.name },
      metadata: { trusted: device.trusted }
    })
  }
  
  /**
   * Deny a device
   */
  async denyDevice(deviceId: string, reason: string): Promise<void> {
    await this.initialize()
    
    const device = this.devices.find(d => d.id === deviceId)
    if (!device) return
    
    device.approvalStatus = 'denied'
    device.rejectionReason = reason
    device.trusted = false
    
    saveDevices(this.devices)
    
    await auditLedger.append({
      category: 'security',
      action: 'device_denied',
      description: `Device ${device.name} denied: ${reason}`,
      severity: 'warning',
      actor: { id: device.userId, type: 'user' },
      target: { type: 'device', id: deviceId, name: device.name },
      metadata: { reason }
    })
  }
  
  /**
   * Revoke a device
   */
  async revokeDevice(deviceId: string, reason: string): Promise<void> {
    await this.initialize()
    
    const device = this.devices.find(d => d.id === deviceId)
    if (!device) return
    
    device.approvalStatus = 'revoked'
    device.rejectionReason = reason
    device.trusted = false
    
    saveDevices(this.devices)
    
    // Create alert
    await this.createAlert(
      device.userId,
      deviceId,
      'device_revoked',
      `Device ${device.name} has been revoked: ${reason}`
    )
    
    await auditLedger.append({
      category: 'security',
      action: 'device_revoked',
      description: `Device ${device.name} revoked: ${reason}`,
      severity: 'warning',
      actor: { id: device.userId, type: 'user' },
      target: { type: 'device', id: deviceId, name: device.name },
      metadata: { reason }
    })
  }
  
  /**
   * Trust/untrust a device
   */
  async setDeviceTrust(deviceId: string, trusted: boolean): Promise<{ success: boolean; error?: string }> {
    await this.initialize()
    
    const device = this.devices.find(d => d.id === deviceId)
    if (!device) return { success: false, error: 'Device not found' }
    
    if (device.approvalStatus !== 'approved') {
      return { success: false, error: 'Device must be approved first' }
    }
    
    if (trusted) {
      // Check trust limit
      const trustedCount = this.devices.filter(d => 
        d.userId === device.userId && d.trusted && d.id !== deviceId
      ).length
      
      if (trustedCount >= MAX_TRUSTED_DEVICES) {
        return { success: false, error: `Maximum ${MAX_TRUSTED_DEVICES} trusted devices allowed` }
      }
    }
    
    device.trusted = trusted
    saveDevices(this.devices)
    
    await auditLedger.append({
      category: 'security',
      action: trusted ? 'device_trusted' : 'device_untrusted',
      description: `Device ${device.name} ${trusted ? 'marked as trusted' : 'removed from trusted list'}`,
      severity: 'info',
      actor: { id: device.userId, type: 'user' },
      target: { type: 'device', id: deviceId }
    })
    
    return { success: true }
  }
  
  /**
   * Update device name
   */
  async updateDeviceName(deviceId: string, name: string): Promise<void> {
    await this.initialize()
    
    const device = this.devices.find(d => d.id === deviceId)
    if (!device) return
    
    device.name = name
    saveDevices(this.devices)
  }
  
  /**
   * Record successful login on device
   */
  async recordLogin(deviceId: string, location?: { country?: string; city?: string; ip?: string }): Promise<void> {
    await this.initialize()
    
    const device = this.devices.find(d => d.id === deviceId)
    if (!device) return
    
    device.lastLoginAt = new Date().toISOString()
    device.lastSeenAt = device.lastLoginAt
    
    if (location) {
      device.location = location
    }
    
    saveDevices(this.devices)
  }
  
  /**
   * Get devices for a user
   */
  getUserDevices(userId: string): Device[] {
    return this.devices.filter(d => d.userId === userId)
  }
  
  /**
   * Get current device
   */
  getCurrentDevice(): Device | null {
    if (!this.currentDeviceId) return null
    return this.devices.find(d => d.id === this.currentDeviceId) ?? null
  }
  
  /**
   * Get device by ID
   */
  getDevice(deviceId: string): Device | undefined {
    return this.devices.find(d => d.id === deviceId)
  }
  
  /**
   * Get pending approvals for a user
   */
  getPendingApprovals(userId: string): PendingApproval[] {
    return this.pendingApprovals.filter(a => 
      a.userId === userId && 
      !a.expired && 
      new Date(a.expiresAt).getTime() > Date.now()
    )
  }
  
  /**
   * Get alerts for a user
   */
  getAlerts(userId: string, unreadOnly: boolean = false): DeviceAlert[] {
    return this.alerts.filter(a => 
      a.userId === userId && (!unreadOnly || !a.read)
    ).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }
  
  /**
   * Mark alert as read
   */
  markAlertRead(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.read = true
      saveAlerts(this.alerts)
    }
  }
  
  /**
   * Mark all alerts as read
   */
  markAllAlertsRead(userId: string): void {
    this.alerts
      .filter(a => a.userId === userId)
      .forEach(a => a.read = true)
    saveAlerts(this.alerts)
  }
  
  /**
   * Create device alert
   */
  private async createAlert(
    userId: string,
    deviceId: string,
    type: DeviceAlert['type'],
    message: string
  ): Promise<void> {
    const device = this.devices.find(d => d.id === deviceId)
    
    const alert: DeviceAlert = {
      id: `alert_${Date.now().toString(36)}`,
      userId,
      deviceId,
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      deviceInfo: {
        browser: device?.fingerprint.browser ?? 'Unknown',
        os: device?.fingerprint.os ?? 'Unknown',
        location: device?.location 
          ? `${device.location.city ?? ''}${device.location.country ? `, ${device.location.country}` : ''}`
          : undefined
      }
    }
    
    this.alerts.push(alert)
    saveAlerts(this.alerts)
  }
  
  /**
   * Clean up expired approvals
   */
  private cleanupExpiredApprovals(): void {
    const now = Date.now()
    this.pendingApprovals = this.pendingApprovals.filter(a => 
      new Date(a.expiresAt).getTime() > now && !a.expired
    )
    savePendingApprovals(this.pendingApprovals)
  }
}

// ─── Singleton Export ────────────────────────────────────────

export const deviceTrust = new DeviceTrust()

// ─── Convenience Functions ───────────────────────────────────

// generateFingerprint is already exported at definition

/**
 * Identify current device for user
 */
export async function identifyCurrentDevice(userId: string): ReturnType<typeof deviceTrust.identifyDevice> {
  return deviceTrust.identifyDevice(userId)
}

/**
 * Get user's devices
 */
export function getUserDevices(userId: string): Device[] {
  return deviceTrust.getUserDevices(userId)
}

/**
 * Get current device
 */
export function getCurrentDevice(): Device | null {
  return deviceTrust.getCurrentDevice()
}

/**
 * Revoke a device
 */
export async function revokeDevice(deviceId: string, reason: string): Promise<void> {
  return deviceTrust.revokeDevice(deviceId, reason)
}

/**
 * Get unread alerts
 */
export function getUnreadAlerts(userId: string): DeviceAlert[] {
  return deviceTrust.getAlerts(userId, true)
}
