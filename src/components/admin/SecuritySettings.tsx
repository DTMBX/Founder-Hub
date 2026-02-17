/**
 * Security Settings - Device & Session Management
 * 
 * Chain B7 - Identity + Session Hardening
 * 
 * Features:
 * - View active sessions
 * - Manage trusted devices
 * - Revoke sessions
 * - Security alerts
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  Shield, 
  Smartphone, 
  Monitor, 
  LogOut, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Bell,
  MapPin,
  Star,
  RefreshCw
} from 'lucide-react'
import { 
  deviceTrust, 
  getCurrentDevice,
  type Device, 
  type DeviceAlert 
} from '@/lib/device-trust'
import { 
  sessionManager,
  type EnhancedSession 
} from '@/lib/session-manager'
import { cn } from '@/lib/utils'

interface SecuritySettingsProps {
  userId: string
  userRole: 'owner' | 'admin' | 'editor' | 'support' | 'viewer'
}

export function SecuritySettings({ userId, userRole }: SecuritySettingsProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [sessions, setSessions] = useState<EnhancedSession[]>([])
  const [alerts, setAlerts] = useState<DeviceAlert[]>([])
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      await deviceTrust.initialize()
      
      setDevices(deviceTrust.getUserDevices(userId))
      setCurrentDevice(getCurrentDevice())
      setAlerts(deviceTrust.getAlerts(userId))
      setSessions(sessionManager.getUserSessions(userId))
    } finally {
      setLoading(false)
    }
  }, [userId])
  
  useEffect(() => {
    loadData()
  }, [loadData])
  
  const handleRevokeSession = async (sessionId: string) => {
    setActionInProgress(sessionId)
    try {
      await sessionManager.terminateSession(sessionId, 'user_request')
      await loadData()
    } finally {
      setActionInProgress(null)
    }
  }
  
  const handleRevokeAllOtherSessions = async () => {
    setActionInProgress('all')
    try {
      const currentSession = sessionManager.getCurrentSession()
      await sessionManager.revokeAllUserSessions(
        userId, 
        currentSession?.id
      )
      await loadData()
    } finally {
      setActionInProgress(null)
    }
  }
  
  const handleRevokeDevice = async (deviceId: string) => {
    setActionInProgress(deviceId)
    try {
      await deviceTrust.revokeDevice(deviceId, 'User manually revoked')
      await sessionManager.revokeDeviceSessions(deviceId)
      await loadData()
    } finally {
      setActionInProgress(null)
    }
  }
  
  const handleToggleTrust = async (deviceId: string, currentlyTrusted: boolean) => {
    setActionInProgress(deviceId)
    try {
      await deviceTrust.setDeviceTrust(deviceId, !currentlyTrusted)
      await loadData()
    } finally {
      setActionInProgress(null)
    }
  }
  
  const handleMarkAlertsRead = () => {
    deviceTrust.markAllAlertsRead(userId)
    setAlerts(deviceTrust.getAlerts(userId))
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    )
  }
  
  const unreadAlerts = alerts.filter(a => !a.read)
  const trustedDeviceCount = devices.filter(d => d.trusted).length
  const activeSessionCount = sessions.length
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">Security Settings</h2>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>
      
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Smartphone className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Trusted Devices</p>
              <p className="text-xl font-semibold text-slate-900">
                {trustedDeviceCount} / 10
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active Sessions</p>
              <p className="text-xl font-semibold text-slate-900">
                {activeSessionCount}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              unreadAlerts.length > 0 ? "bg-amber-100" : "bg-slate-100"
            )}>
              <Bell className={cn(
                "h-5 w-5",
                unreadAlerts.length > 0 ? "text-amber-600" : "text-slate-500"
              )} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Unread Alerts</p>
              <p className="text-xl font-semibold text-slate-900">
                {unreadAlerts.length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Security Alerts */}
      {unreadAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-medium text-amber-900">Security Alerts</h3>
            </div>
            <button
              onClick={handleMarkAlertsRead}
              className="text-sm text-amber-700 hover:text-amber-900"
            >
              Mark all read
            </button>
          </div>
          <div className="space-y-2">
            {unreadAlerts.slice(0, 5).map(alert => (
              <div 
                key={alert.id}
                className="flex items-start gap-3 p-3 bg-white/50 rounded-md"
              >
                <div className={cn(
                  "p-1.5 rounded-full",
                  alert.type === 'new_device' && "bg-blue-100",
                  alert.type === 'device_revoked' && "bg-red-100",
                  alert.type === 'suspicious_location' && "bg-amber-100"
                )}>
                  {alert.type === 'new_device' && <Smartphone className="h-4 w-4 text-blue-600" />}
                  {alert.type === 'device_revoked' && <XCircle className="h-4 w-4 text-red-600" />}
                  {alert.type === 'suspicious_location' && <MapPin className="h-4 w-4 text-amber-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-900">{alert.message}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {alert.deviceInfo.browser} on {alert.deviceInfo.os}
                    {alert.deviceInfo.location && ` • ${alert.deviceInfo.location}`}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Devices */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-medium text-slate-900">Your Devices</h3>
          <p className="text-sm text-slate-500 mt-1">
            Manage devices that have accessed your account
          </p>
        </div>
        <div className="divide-y divide-slate-200">
          {devices.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No devices registered
            </div>
          ) : (
            devices.map(device => (
              <DeviceRow
                key={device.id}
                device={device}
                isCurrent={device.id === currentDevice?.id}
                isLoading={actionInProgress === device.id}
                onRevoke={() => handleRevokeDevice(device.id)}
                onToggleTrust={() => handleToggleTrust(device.id, device.trusted)}
                userRole={userRole}
              />
            ))
          )}
        </div>
      </div>
      
      {/* Sessions */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-slate-900">Active Sessions</h3>
            <p className="text-sm text-slate-500 mt-1">
              Sessions currently signed in to your account
            </p>
          </div>
          {activeSessionCount > 1 && (
            <button
              onClick={handleRevokeAllOtherSessions}
              disabled={actionInProgress === 'all'}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out all other sessions
            </button>
          )}
        </div>
        <div className="divide-y divide-slate-200">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No active sessions
            </div>
          ) : (
            sessions
              .map(session => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isCurrent={session.id === sessionManager.getCurrentSession()?.id}
                  isLoading={actionInProgress === session.id}
                  onRevoke={() => handleRevokeSession(session.id)}
                />
              ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Device Row Component ────────────────────────────────────

interface DeviceRowProps {
  device: Device
  isCurrent: boolean
  isLoading: boolean
  onRevoke: () => void
  onToggleTrust: () => void
  userRole: string
}

function DeviceRow({ 
  device, 
  isCurrent, 
  isLoading, 
  onRevoke, 
  onToggleTrust,
  userRole 
}: DeviceRowProps) {
  const isRevoked = device.approvalStatus === 'revoked'
  const isDenied = device.approvalStatus === 'denied'
  const isPending = device.approvalStatus === 'pending'
  
  return (
    <div className={cn(
      "p-4 flex items-center justify-between",
      isRevoked && "bg-red-50/50",
      isPending && "bg-amber-50/50"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-2.5 rounded-lg",
          device.trusted ? "bg-green-100" : "bg-slate-100"
        )}>
          {device.fingerprint.os.includes('Windows') || 
           device.fingerprint.os.includes('Mac') || 
           device.fingerprint.os.includes('Linux') ? (
            <Monitor className={cn(
              "h-5 w-5",
              device.trusted ? "text-green-600" : "text-slate-500"
            )} />
          ) : (
            <Smartphone className={cn(
              "h-5 w-5",
              device.trusted ? "text-green-600" : "text-slate-500"
            )} />
          )}
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-900">{device.name}</p>
            {isCurrent && (
              <span className="px-1.5 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded">
                This device
              </span>
            )}
            {device.trusted && (
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
            <span>{device.fingerprint.browser}</span>
            <span>•</span>
            <span>{device.fingerprint.os}</span>
            {device.location?.city && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {device.location.city}{device.location.country && `, ${device.location.country}`}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            <span>First seen: {new Date(device.firstSeenAt).toLocaleDateString()}</span>
            {device.lastLoginAt && (
              <>
                <span>•</span>
                <span>Last login: {new Date(device.lastLoginAt).toLocaleString()}</span>
              </>
            )}
          </div>
          
          {/* Status badges */}
          <div className="flex items-center gap-2 mt-2">
            {isPending && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
                <Clock className="h-3 w-3" />
                Pending Approval
              </span>
            )}
            {device.approvalStatus === 'approved' && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                Approved
              </span>
            )}
            {isRevoked && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                <XCircle className="h-3 w-3" />
                Revoked
              </span>
            )}
            {isDenied && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                <XCircle className="h-3 w-3" />
                Denied
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      {!isRevoked && !isDenied && (
        <div className="flex items-center gap-2">
          {device.approvalStatus === 'approved' && (
            <button
              onClick={onToggleTrust}
              disabled={isLoading}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors disabled:opacity-50",
                device.trusted
                  ? "text-amber-700 hover:bg-amber-50"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Star className={cn(
                "h-4 w-4",
                device.trusted && "fill-current"
              )} />
              {device.trusted ? 'Untrust' : 'Trust'}
            </button>
          )}
          
          {!isCurrent && (
            <button
              onClick={onRevoke}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Revoke
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Session Row Component ───────────────────────────────────

interface SessionRowProps {
  session: EnhancedSession
  isCurrent: boolean
  isLoading: boolean
  onRevoke: () => void
}

function SessionRow({ session, isCurrent, isLoading, onRevoke }: SessionRowProps) {
  const expiresAt = new Date(session.expiresAt)
  const isExpired = expiresAt.getTime() < Date.now()
  
  return (
    <div className={cn(
      "p-4 flex items-center justify-between",
      isExpired && "bg-slate-50"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-2.5 rounded-lg",
          isCurrent ? "bg-green-100" : "bg-slate-100"
        )}>
          <Clock className={cn(
            "h-5 w-5",
            isCurrent ? "text-green-600" : "text-slate-500"
          )} />
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-900">
              Session {session.id.slice(0, 12)}...
            </p>
            {isCurrent && (
              <span className="px-1.5 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded">
                Current
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
            <span>Role: {session.role}</span>
            <span>•</span>
            <span>Scopes: {session.scopes.join(', ')}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            <span>Created: {new Date(session.createdAt).toLocaleString()}</span>
            <span>•</span>
            <span>
              {isExpired ? (
                <span className="text-red-500">Expired</span>
              ) : (
                <>Expires: {expiresAt.toLocaleString()}</>
              )}
            </span>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      {!isCurrent && (
        <button
          onClick={onRevoke}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      )}
    </div>
  )
}

export default SecuritySettings
