/**
 * Follow-Up Task Service Tests
 *
 * Tests for FollowUpTaskService CRUD operations, reminders, and overdue detection.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { FollowUpTask, FollowUpTaskStatus } from '../types'
import type { StorageAdapter } from '@/lib/storage-adapter'

// ─── Mock Storage Adapter ────────────────────────────────────

function createMockStorageAdapter(): StorageAdapter {
  const store: Record<string, unknown> = {}

  return {
    get: async <T = unknown>(key: string): Promise<T | null> => {
      return (store[key] as T) ?? null
    },
    set: async <T = unknown>(key: string, value: T): Promise<void> => {
      store[key] = value
    },
    del: async (key: string): Promise<void> => {
      delete store[key]
    },
    list: async (prefix: string): Promise<string[]> => {
      return Object.keys(store).filter((k) => k.startsWith(prefix))
    },
  }
}

// ─── FollowUpTaskService Tests ───────────────────────────────

describe('FollowUpTaskService', () => {
  let mockStorage: StorageAdapter

  beforeEach(() => {
    mockStorage = createMockStorageAdapter()
    vi.resetModules()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a task with required fields', async () => {
      const { FollowUpTaskService } = await import('../follow-up-task.service')
      const service = new FollowUpTaskService(mockStorage)

      const task = await service.create({
        leadId: 'lead-123',
        taskType: 'follow_up_call',
        title: 'Initial call with lead',
        dueDate: '2024-12-01T10:00:00.000Z',
      })

      expect(task.id).toBeDefined()
      expect(task.leadId).toBe('lead-123')
      expect(task.taskType).toBe('follow_up_call')
      expect(task.title).toBe('Initial call with lead')
      expect(task.status).toBe('pending')
      expect(task.createdAt).toBeDefined()
    })

    it('should save task to storage', async () => {
      const { FollowUpTaskService } = await import('../follow-up-task.service')
      const service = new FollowUpTaskService(mockStorage)

      const task = await service.create({
        leadId: 'lead-123',
        taskType: 'send_proposal',
        title: 'Send proposal',
        dueDate: '2024-12-01T10:00:00.000Z',
      })

      const retrieved = await service.get(task.id)
      expect(retrieved).not.toBeNull()
      expect(retrieved?.title).toBe('Send proposal')
    })

    it('should link task to lead via list query', async () => {
      const { FollowUpTaskService } = await import('../follow-up-task.service')
      const service = new FollowUpTaskService(mockStorage)

      await service.create({
        leadId: 'lead-abc',
        taskType: 'initial_contact',
        title: 'Demo meeting',
        dueDate: '2024-12-01T10:00:00.000Z',
      })

      const result = await service.list({ leadId: 'lead-abc' })
      expect(result.tasks).toHaveLength(1)
      expect(result.tasks[0].title).toBe('Demo meeting')
    })

    it('should add task id to global list', async () => {
      const { FollowUpTaskService } = await import('../follow-up-task.service')
      const service = new FollowUpTaskService(mockStorage)

      await service.create({
        leadId: 'lead-1',
        taskType: 'follow_up_call',
        title: 'Task 1',
        dueDate: '2024-12-01T10:00:00.000Z',
      })

      await service.create({
        leadId: 'lead-2',
        taskType: 'send_proposal',
        title: 'Task 2',
        dueDate: '2024-12-02T10:00:00.000Z',
      })

      const allTasks = await service.list()
      expect(allTasks.tasks).toHaveLength(2)
    })
  })

  describe('complete', () => {
    it('should mark task as completed', async () => {
      const { FollowUpTaskService } = await import('../follow-up-task.service')
      const service = new FollowUpTaskService(mockStorage)

      const task = await service.create({
        leadId: 'lead-123',
        taskType: 'follow_up_call',
        title: 'Follow up',
        dueDate: '2024-12-01T10:00:00.000Z',
      })

      const completed = await service.complete(task.id)

      expect(completed?.status).toBe('completed')
      expect(completed?.completedAt).toBeDefined()
    })

    it('should return null for non-existent task', async () => {
      const { FollowUpTaskService } = await import('../follow-up-task.service')
      const service = new FollowUpTaskService(mockStorage)

      const result = await service.complete('nonexistent-id')
      expect(result).toBeNull()
    })
  })

  describe('cancel', () => {
    it('should mark task as cancelled', async () => {
      const { FollowUpTaskService } = await import('../follow-up-task.service')
      const service = new FollowUpTaskService(mockStorage)

      const task = await service.create({
        leadId: 'lead-123',
        taskType: 'follow_up_call',
        title: 'Follow up',
        dueDate: '2024-12-01T10:00:00.000Z',
      })

      const cancelled = await service.cancel(task.id)

      expect(cancelled?.status).toBe('cancelled')
    })
  })

  describe('list with filters', () => {
    it('should filter by status', async () => {
      const { FollowUpTaskService } = await import('../follow-up-task.service')
      const service = new FollowUpTaskService(mockStorage)

      // Use far future dates to prevent overdue marking
      const futureDate1 = new Date(Date.now() + 86400000 * 30).toISOString() // 30 days out
      const futureDate2 = new Date(Date.now() + 86400000 * 31).toISOString() // 31 days out

      const task1 = await service.create({
        leadId: 'lead-1',
        taskType: 'follow_up_call',
        title: 'Task 1',
        dueDate: futureDate1,
      })

      await service.create({
        leadId: 'lead-2',
        taskType: 'send_proposal',
        title: 'Task 2',
        dueDate: futureDate2,
      })

      await service.complete(task1.id)

      const pendingOnly = await service.list({ status: 'pending' })
      expect(pendingOnly.tasks).toHaveLength(1)
      expect(pendingOnly.tasks[0].title).toBe('Task 2')
    })
  })

  describe('markReminderSent', () => {
    it('should update reminder sent flag', async () => {
      const { FollowUpTaskService } = await import('../follow-up-task.service')
      const service = new FollowUpTaskService(mockStorage)

      const task = await service.create({
        leadId: 'lead-123',
        taskType: 'follow_up_call',
        title: 'Task with reminder',
        dueDate: '2024-12-01T10:00:00.000Z',
      })

      const updated = await service.markReminderSent(task.id)

      expect(updated?.reminderSent).toBe(true)
      expect(updated?.reminderSentAt).toBeDefined()
    })
  })

  describe('delete', () => {
    it('should remove task from storage', async () => {
      const { FollowUpTaskService } = await import('../follow-up-task.service')
      const service = new FollowUpTaskService(mockStorage)

      const task = await service.create({
        leadId: 'lead-123',
        taskType: 'follow_up_call',
        title: 'To delete',
        dueDate: '2024-12-01T10:00:00.000Z',
      })

      const deleted = await service.delete(task.id)
      expect(deleted).toBe(true)

      const retrieved = await service.get(task.id)
      expect(retrieved).toBeNull()
    })

    it('should return false for non-existent task', async () => {
      const { FollowUpTaskService } = await import('../follow-up-task.service')
      const service = new FollowUpTaskService(mockStorage)

      const deleted = await service.delete('nonexistent-id')
      expect(deleted).toBe(false)
    })
  })

  describe('getStats', () => {
    it('should calculate task statistics correctly', async () => {
      const { FollowUpTaskService } = await import('../follow-up-task.service')
      const service = new FollowUpTaskService(mockStorage)

      // Create pending task
      await service.create({
        leadId: 'lead-1',
        taskType: 'follow_up_call',
        title: 'Pending task',
        dueDate: new Date(Date.now() + 86400000).toISOString(), // Future date
      })

      // Create and complete a task
      const task2 = await service.create({
        leadId: 'lead-2',
        taskType: 'send_proposal',
        title: 'Completed task',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      })
      await service.complete(task2.id)

      const stats = await service.getStats()
      expect(stats.total).toBe(2)
      expect(stats.pending).toBe(1)
    })
  })
})
