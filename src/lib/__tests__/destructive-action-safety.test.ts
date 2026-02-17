/**
 * Tests for Destructive Action Safety Module
 * Chain A4 — Anti-Accident System
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const mockStorage = new Map<string, string>()

vi.mock('../local-storage-kv', () => ({
  kv: {
    get: vi.fn(async (key: string) => {
      const val = mockStorage.get(key)
      return val ? JSON.parse(val) : null
    }),
    set: vi.fn(async (key: string, value: unknown) => {
      mockStorage.set(key, JSON.stringify(value))
    }),
    delete: vi.fn(async (key: string) => {
      mockStorage.delete(key)
    }),
  },
}))

vi.mock('../auth', () => ({
  logAudit: vi.fn(),
}))

import {
  archiveItem,
  restoreArchivedItem,
  permanentlyDeleteArchivedItem,
  listArchivedItems,
  isItemArchived,
  cleanupExpiredArchives,
  getArchiveIndex,
  generateSafeBranchName,
  createCommitMessage,
  isCommitToProtectedBranch,
  getConfirmationRequirement,
  isActionOnCooldown,
  setActionCooldown,
  clearActionCooldown,
  getActionCooldownRemaining,
  CONFIRMATION_REQUIREMENTS,
} from '../destructive-action-safety'

describe('Archive Operations', () => {
  beforeEach(() => {
    mockStorage.clear()
    vi.clearAllMocks()
  })

  it('should archive an item', async () => {
    const item = await archiveItem(
      'site-1', 'site', 'Test Site', { name: 'Test' },
      'user-1', 'admin@test.com', 'No longer needed'
    )

    expect(item.originalId).toBe('site-1')
    expect(item.type).toBe('site')
    expect(item.name).toBe('Test Site')
    expect(item.restorable).toBe(true)
    expect(item.reason).toBe('No longer needed')
    expect(item.archivedBy).toBe('admin@test.com')
    expect(item.archivedAt).toBeDefined()
    expect(item.expiresAt).toBeDefined()
  })

  it('should list archived items', async () => {
    await archiveItem('site-1', 'site', 'Site 1', {}, 'u1', 'a@t.com')
    await archiveItem('proj-1', 'project', 'Project 1', {}, 'u1', 'a@t.com')
    await archiveItem('site-2', 'site', 'Site 2', {}, 'u1', 'a@t.com')

    const allItems = await listArchivedItems()
    expect(allItems).toHaveLength(3)

    const siteItems = await listArchivedItems('site')
    expect(siteItems).toHaveLength(2)

    const projectItems = await listArchivedItems('project')
    expect(projectItems).toHaveLength(1)
  })

  it('should check if item is archived', async () => {
    await archiveItem('site-1', 'site', 'Site 1', {}, 'u1', 'a@t.com')

    expect(await isItemArchived('site-1')).toBe(true)
    expect(await isItemArchived('site-2')).toBe(false)
  })

  it('should restore an archived item', async () => {
    const archived = await archiveItem(
      'site-1', 'site', 'Test Site', { name: 'Test' }, 'u1', 'a@t.com'
    )

    const restored = await restoreArchivedItem(archived.id, 'u1', 'a@t.com')

    expect(restored).not.toBeNull()
    expect(restored!.originalId).toBe('site-1')
    expect(restored!.name).toBe('Test Site')

    // Should no longer be in archive
    expect(await isItemArchived('site-1')).toBe(false)
  })

  it('should not restore a non-existent item', async () => {
    const result = await restoreArchivedItem('nonexistent', 'u1', 'a@t.com')
    expect(result).toBeNull()
  })

  it('should permanently delete an archived item', async () => {
    const archived = await archiveItem(
      'site-1', 'site', 'Test Site', { name: 'Test' }, 'u1', 'a@t.com'
    )

    const result = await permanentlyDeleteArchivedItem(archived.id, 'u1', 'a@t.com')
    expect(result).toBe(true)

    expect(await isItemArchived('site-1')).toBe(false)
    const allItems = await listArchivedItems()
    expect(allItems).toHaveLength(0)
  })

  it('should clean up expired archives', async () => {
    // Create an already-expired item
    const item = await archiveItem('site-1', 'site', 'Old Site', {}, 'u1', 'a@t.com')

    // Manually edit the expiry to the past
    const archive = await getArchiveIndex()
    archive.items[0].expiresAt = new Date(Date.now() - 1000).toISOString()
    mockStorage.set('founder-hub-archive', JSON.stringify(archive))

    const cleaned = await cleanupExpiredArchives('u1', 'a@t.com')
    expect(cleaned).toBe(1)

    const remaining = await listArchivedItems()
    expect(remaining).toHaveLength(0)
  })
})

describe('Safe Commit Workflow', () => {
  it('should generate a safe branch name', () => {
    const name = generateSafeBranchName('update-settings', 'user-abc123')
    expect(name).toMatch(/^change\/update-settings\//)
    expect(name).toContain('c123')
  })

  it('should create a commit message with metadata', () => {
    const msg = createCommitMessage('Update settings', {
      author: 'Test User',
      authorEmail: 'test@example.com',
      timestamp: '2026-02-17T00:00:00Z',
      action: 'update-settings',
      affectedItems: ['settings.json'],
      reviewRequired: true,
      branch: 'change/update-settings/abc123-1234567890',
    })

    expect(msg).toContain('Update settings')
    expect(msg).toContain('author: Test User')
    expect(msg).toContain('review-required: true')
    expect(msg).toContain('affected: 1 item(s)')
  })

  it('should detect protected branches', () => {
    expect(isCommitToProtectedBranch('main')).toBe(true)
    expect(isCommitToProtectedBranch('master')).toBe(true)
    expect(isCommitToProtectedBranch('production')).toBe(true)
    expect(isCommitToProtectedBranch('prod')).toBe(true)
    expect(isCommitToProtectedBranch('develop')).toBe(false)
    expect(isCommitToProtectedBranch('feature/test')).toBe(false)
    expect(isCommitToProtectedBranch('admin/data-update-123')).toBe(false)
  })
})

describe('Confirmation Requirements', () => {
  it('should have confirmation requirement for delete-site', () => {
    const req = getConfirmationRequirement('delete-site')
    expect(req).toBeDefined()
    expect(req!.requiresTyped).toBe(true)
    expect(req!.requiresAudit).toBe(true)
    expect(req!.cooldownMs).toBe(5000)
  })

  it('should have confirmation requirement for publish-live', () => {
    const req = getConfirmationRequirement('publish-live')
    expect(req).toBeDefined()
    expect(req!.requiresTyped).toBe(true)
    expect(req!.typedText).toBe('PUBLISH')
    expect(req!.cooldownMs).toBe(10000)
  })

  it('should return undefined for unknown actions', () => {
    expect(getConfirmationRequirement('unknown-action')).toBeUndefined()
  })

  it('should have all required actions defined', () => {
    const required = [
      'delete-site', 'archive-site', 'restore-site',
      'delete-satellite', 'publish-live', 'deploy-production',
      'export-data', 'clear-all-data',
    ]
    for (const action of required) {
      expect(CONFIRMATION_REQUIREMENTS[action]).toBeDefined()
    }
  })
})

describe('Action Cooldowns', () => {
  it('should not be on cooldown by default', () => {
    expect(isActionOnCooldown('delete-site', 'user-1')).toBe(false)
    expect(getActionCooldownRemaining('delete-site', 'user-1')).toBe(0)
  })

  it('should set and check cooldown', () => {
    setActionCooldown('delete-site', 'user-1', 5000)

    expect(isActionOnCooldown('delete-site', 'user-1')).toBe(true)
    expect(getActionCooldownRemaining('delete-site', 'user-1')).toBeGreaterThan(0)
    expect(getActionCooldownRemaining('delete-site', 'user-1')).toBeLessThanOrEqual(5000)
  })

  it('should clear cooldown', () => {
    setActionCooldown('delete-site', 'user-1', 5000)
    clearActionCooldown('delete-site', 'user-1')

    expect(isActionOnCooldown('delete-site', 'user-1')).toBe(false)
  })

  it('should be user-scoped', () => {
    setActionCooldown('delete-site', 'user-1', 5000)

    expect(isActionOnCooldown('delete-site', 'user-1')).toBe(true)
    expect(isActionOnCooldown('delete-site', 'user-2')).toBe(false)
  })
})
