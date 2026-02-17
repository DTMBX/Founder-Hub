/**
 * Destructive Action Safety Module
 * Chain A4 — Anti-Accident System
 *
 * PRINCIPLES:
 * 1. Any destructive action requires confirm + typed confirmation + audit
 * 2. Soft delete (archive) where possible instead of hard delete
 * 3. Safe commit workflow - branches, never direct to main
 * 4. All changes traceable with metadata
 */

import { kv } from './local-storage-kv'
import { logAudit } from './auth'
import type { AuditAction } from './types'

// ─── Archive Types ───────────────────────────────────────────

export interface ArchivedItem {
  id: string
  originalId: string
  type: 'site' | 'satellite' | 'project' | 'document' | 'case' | 'offering'
  name: string
  data: unknown
  archivedAt: string
  archivedBy: string
  reason?: string
  restorable: boolean
  expiresAt?: string  // When the archived item can be permanently deleted
}

export interface ArchiveIndex {
  items: ArchivedItem[]
  lastUpdated: string
}

const ARCHIVE_KEY = 'founder-hub-archive'
const DEFAULT_RETENTION_DAYS = 90

// ─── Archive Operations ──────────────────────────────────────

/**
 * Get the archive index
 */
export async function getArchiveIndex(): Promise<ArchiveIndex> {
  const archive = await kv.get<ArchiveIndex>(ARCHIVE_KEY)
  return archive ?? { items: [], lastUpdated: new Date().toISOString() }
}

/**
 * Archive an item (soft delete)
 */
export async function archiveItem(
  originalId: string,
  type: ArchivedItem['type'],
  name: string,
  data: unknown,
  userId: string,
  userEmail: string,
  reason?: string
): Promise<ArchivedItem> {
  const archive = await getArchiveIndex()
  
  const archivedItem: ArchivedItem = {
    id: `arc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    originalId,
    type,
    name,
    data,
    archivedAt: new Date().toISOString(),
    archivedBy: userEmail,
    reason,
    restorable: true,
    expiresAt: new Date(Date.now() + DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  }
  
  archive.items.push(archivedItem)
  archive.lastUpdated = new Date().toISOString()
  
  await kv.set(ARCHIVE_KEY, archive)
  
  // Log to audit trail
  await logAudit(
    userId,
    userEmail,
    `archive_${type}` as AuditAction,
    `Archived ${type}: ${name}${reason ? ` (reason: ${reason})` : ''}`,
    type,
    archivedItem.id
  )
  
  return archivedItem
}

/**
 * Restore an archived item
 */
export async function restoreArchivedItem(
  archivedId: string,
  userId: string,
  userEmail: string
): Promise<ArchivedItem | null> {
  const archive = await getArchiveIndex()
  
  const itemIndex = archive.items.findIndex(i => i.id === archivedId)
  if (itemIndex === -1) return null
  
  const item = archive.items[itemIndex]
  if (!item.restorable) return null
  
  // Remove from archive
  archive.items.splice(itemIndex, 1)
  archive.lastUpdated = new Date().toISOString()
  
  await kv.set(ARCHIVE_KEY, archive)
  
  // Log restoration
  await logAudit(
    userId,
    userEmail,
    `restore_${item.type}` as AuditAction,
    `Restored ${item.type}: ${item.name}`,
    item.type,
    item.originalId
  )
  
  return item
}

/**
 * Permanently delete an archived item
 */
export async function permanentlyDeleteArchivedItem(
  archivedId: string,
  userId: string,
  userEmail: string
): Promise<boolean> {
  const archive = await getArchiveIndex()
  
  const itemIndex = archive.items.findIndex(i => i.id === archivedId)
  if (itemIndex === -1) return false
  
  const item = archive.items[itemIndex]
  
  // Remove from archive
  archive.items.splice(itemIndex, 1)
  archive.lastUpdated = new Date().toISOString()
  
  await kv.set(ARCHIVE_KEY, archive)
  
  // Log permanent deletion
  await logAudit(
    userId,
    userEmail,
    `permanent_delete_${item.type}` as AuditAction,
    `Permanently deleted ${item.type}: ${item.name}`,
    item.type,
    item.originalId
  )
  
  return true
}

/**
 * List archived items by type
 */
export async function listArchivedItems(type?: ArchivedItem['type']): Promise<ArchivedItem[]> {
  const archive = await getArchiveIndex()
  
  if (type) {
    return archive.items.filter(i => i.type === type)
  }
  
  return archive.items
}

/**
 * Check if an item with the original ID is archived
 */
export async function isItemArchived(originalId: string): Promise<boolean> {
  const archive = await getArchiveIndex()
  return archive.items.some(i => i.originalId === originalId)
}

/**
 * Clean up expired archived items
 */
export async function cleanupExpiredArchives(
  userId: string,
  userEmail: string
): Promise<number> {
  const archive = await getArchiveIndex()
  const now = new Date()
  
  const expired = archive.items.filter(
    i => i.expiresAt && new Date(i.expiresAt) < now
  )
  
  if (expired.length === 0) return 0
  
  archive.items = archive.items.filter(
    i => !i.expiresAt || new Date(i.expiresAt) >= now
  )
  archive.lastUpdated = new Date().toISOString()
  
  await kv.set(ARCHIVE_KEY, archive)
  
  // Log cleanup
  await logAudit(
    userId,
    userEmail,
    'archive_cleanup',
    `Cleaned up ${expired.length} expired archived items: ${expired.map(i => i.id).join(', ')}`,
    'archive'
  )
  
  return expired.length
}

// ─── Safe Commit Workflow ────────────────────────────────────

export interface SafeCommitMetadata {
  author: string
  authorEmail: string
  timestamp: string
  action: string
  affectedItems: string[]
  reviewRequired: boolean
  branch: string
}

/**
 * Generate a safe branch name for a commit
 */
export function generateSafeBranchName(action: string, userId: string): string {
  const timestamp = Date.now()
  const sanitizedAction = action.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const shortUserId = userId.slice(-6)
  return `change/${sanitizedAction}/${shortUserId}-${timestamp}`
}

/**
 * Create commit message with metadata header
 */
export function createCommitMessage(
  title: string,
  metadata: SafeCommitMetadata
): string {
  const metadataLines = [
    `---`,
    `author: ${metadata.author}`,
    `email: ${metadata.authorEmail}`,
    `timestamp: ${metadata.timestamp}`,
    `action: ${metadata.action}`,
    `affected: ${metadata.affectedItems.length} item(s)`,
    `review-required: ${metadata.reviewRequired}`,
    `branch: ${metadata.branch}`,
    `---`,
  ]
  
  return `${title}\n\n${metadataLines.join('\n')}`
}

/**
 * Validate that a commit is safe (not to main)
 */
export function isCommitToProtectedBranch(branch: string): boolean {
  const protectedBranches = ['main', 'master', 'production', 'prod']
  return protectedBranches.includes(branch.toLowerCase())
}

// ─── Confirmation Requirements ───────────────────────────────

export interface ConfirmationRequirement {
  actionId: string
  requiresTyped: boolean
  typedText?: string
  requiresAudit: boolean
  cooldownMs?: number  // Prevent rapid repeated actions
}

/**
 * Action confirmation requirements
 */
export const CONFIRMATION_REQUIREMENTS: Record<string, ConfirmationRequirement> = {
  // Site operations
  'delete-site': {
    actionId: 'delete-site',
    requiresTyped: true,
    requiresAudit: true,
    cooldownMs: 5000,
  },
  'archive-site': {
    actionId: 'archive-site',
    requiresTyped: false,
    requiresAudit: true,
  },
  'restore-site': {
    actionId: 'restore-site',
    requiresTyped: false,
    requiresAudit: true,
  },
  // Satellite operations
  'delete-satellite': {
    actionId: 'delete-satellite',
    requiresTyped: true,
    requiresAudit: true,
  },
  // Publishing
  'publish-live': {
    actionId: 'publish-live',
    requiresTyped: true,
    typedText: 'PUBLISH',
    requiresAudit: true,
    cooldownMs: 10000,
  },
  'deploy-production': {
    actionId: 'deploy-production',
    requiresTyped: true,
    typedText: 'DEPLOY-PROD',
    requiresAudit: true,
    cooldownMs: 30000,
  },
  // Data operations
  'export-data': {
    actionId: 'export-data',
    requiresTyped: true,
    typedText: 'EXPORT',
    requiresAudit: true,
  },
  'clear-all-data': {
    actionId: 'clear-all-data',
    requiresTyped: true,
    typedText: 'CLEAR-ALL',
    requiresAudit: true,
    cooldownMs: 60000,
  },
  // Document operations
  'delete-document': {
    actionId: 'delete-document',
    requiresTyped: true,
    requiresAudit: true,
  },
  // Project operations
  'delete-project': {
    actionId: 'delete-project',
    requiresTyped: true,
    requiresAudit: true,
  },
}

/**
 * Get confirmation requirement for an action
 */
export function getConfirmationRequirement(actionId: string): ConfirmationRequirement | undefined {
  return CONFIRMATION_REQUIREMENTS[actionId]
}

// ─── Action Cooldowns ────────────────────────────────────────

const actionCooldowns = new Map<string, number>()

/**
 * Check if an action is on cooldown
 */
export function isActionOnCooldown(actionId: string, userId: string): boolean {
  const key = `${actionId}:${userId}`
  const cooldownUntil = actionCooldowns.get(key)
  
  if (!cooldownUntil) return false
  
  return Date.now() < cooldownUntil
}

/**
 * Get remaining cooldown time in ms
 */
export function getActionCooldownRemaining(actionId: string, userId: string): number {
  const key = `${actionId}:${userId}`
  const cooldownUntil = actionCooldowns.get(key)
  
  if (!cooldownUntil) return 0
  
  const remaining = cooldownUntil - Date.now()
  return remaining > 0 ? remaining : 0
}

/**
 * Set action cooldown
 */
export function setActionCooldown(actionId: string, userId: string, durationMs: number): void {
  const key = `${actionId}:${userId}`
  actionCooldowns.set(key, Date.now() + durationMs)
}

/**
 * Clear action cooldown
 */
export function clearActionCooldown(actionId: string, userId: string): void {
  const key = `${actionId}:${userId}`
  actionCooldowns.delete(key)
}
