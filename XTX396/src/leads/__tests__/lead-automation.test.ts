/**
 * Lead Automation Service Tests
 *
 * Tests for LeadAutomationService auto-reply, task creation, and notifications.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Lead, NotificationConfig } from '../types'
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

// ─── LeadAutomationService Tests ─────────────────────────────

describe('LeadAutomationService', () => {
  let mockStorage: StorageAdapter
  let sendEmailSpy: (to: string, subject: string, body: string) => Promise<boolean>
  let sendSmsSpy: (to: string, message: string) => Promise<boolean>
  let sendPushSpy: (endpoint: string, title: string, body: string) => Promise<boolean>

  beforeEach(() => {
    mockStorage = createMockStorageAdapter()
    sendEmailSpy = vi.fn().mockResolvedValue(true)
    sendSmsSpy = vi.fn().mockResolvedValue(true)
    sendPushSpy = vi.fn().mockResolvedValue(true)
    vi.resetModules()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('onLeadCreated', () => {
    it('should create automation event with actions', async () => {
      const { LeadAutomationService } = await import('../lead-automation.service')

      const automationService = new LeadAutomationService({
        adapter: mockStorage,
        sendEmail: sendEmailSpy,
        sendSms: sendSmsSpy,
        sendPush: sendPushSpy,
      })

      const lead: Lead = {
        id: 'lead-123',
        email: 'customer@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'new',
        source: 'website_form',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const event = await automationService.onLeadCreated(lead)

      expect(event.id).toBeDefined()
      expect(event.type).toBe('lead_created')
      expect(event.leadId).toBe('lead-123')
      expect(event.actions.length).toBeGreaterThan(0)
    })

    it('should send auto-reply email to lead', async () => {
      const { LeadAutomationService } = await import('../lead-automation.service')

      const automationService = new LeadAutomationService({
        adapter: mockStorage,
        sendEmail: sendEmailSpy,
        sendSms: sendSmsSpy,
        sendPush: sendPushSpy,
      })

      const lead: Lead = {
        id: 'lead-123',
        email: 'customer@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'new',
        source: 'website_form',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await automationService.onLeadCreated(lead)

      expect(sendEmailSpy).toHaveBeenCalledWith(
        'customer@example.com',
        expect.any(String),
        expect.any(String),
      )
    })

    it('should create follow-up task for new lead', async () => {
      const { LeadAutomationService } = await import('../lead-automation.service')
      const { FollowUpTaskService } = await import('../follow-up-task.service')

      const taskService = new FollowUpTaskService(mockStorage)
      const automationService = new LeadAutomationService({
        adapter: mockStorage,
        taskService,
        sendEmail: sendEmailSpy,
        sendSms: sendSmsSpy,
        sendPush: sendPushSpy,
      })

      const lead: Lead = {
        id: 'lead-456',
        email: 'client@example.com',
        firstName: 'Jane',
        status: 'new',
        source: 'website_form',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await automationService.onLeadCreated(lead)

      const tasksResult = await taskService.list({ leadId: lead.id })
      expect(tasksResult.tasks.length).toBeGreaterThanOrEqual(1)
    })

    it('should notify founder via email when configured', async () => {
      const { LeadAutomationService } = await import('../lead-automation.service')

      const notificationConfig: NotificationConfig = {
        notifyEmail: 'founder@company.com',
        notifyPhone: '+1234567890',
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: false,
      }

      // Set notification config in storage
      await mockStorage.set('xtx_notification_config', notificationConfig)

      const automationService = new LeadAutomationService({
        adapter: mockStorage,
        sendEmail: sendEmailSpy,
        sendSms: sendSmsSpy,
        sendPush: sendPushSpy,
      })

      const lead: Lead = {
        id: 'lead-789',
        email: 'prospect@example.com',
        firstName: 'Bob',
        company: 'BigCorp',
        status: 'new',
        source: 'website_form',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await automationService.onLeadCreated(lead)

      // Should have been called multiple times: auto-reply + founder notification
      expect(sendEmailSpy).toHaveBeenCalledTimes(2)
      expect(sendEmailSpy).toHaveBeenCalledWith(
        'founder@company.com',
        expect.any(String),
        expect.any(String),
      )
    })

    it('should notify founder via SMS when configured', async () => {
      const { LeadAutomationService } = await import('../lead-automation.service')

      const notificationConfig: NotificationConfig = {
        notifyEmail: 'founder@company.com',
        notifyPhone: '+1234567890',
        emailEnabled: false,
        smsEnabled: true,
        pushEnabled: false,
      }

      await mockStorage.set('xtx_notification_config', notificationConfig)

      const automationService = new LeadAutomationService({
        adapter: mockStorage,
        sendEmail: sendEmailSpy,
        sendSms: sendSmsSpy,
        sendPush: sendPushSpy,
      })

      const lead: Lead = {
        id: 'lead-sms',
        email: 'smstest@example.com',
        firstName: 'SMS',
        status: 'new',
        source: 'website_form',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await automationService.onLeadCreated(lead)

      expect(sendSmsSpy).toHaveBeenCalledWith(
        '+1234567890',
        expect.any(String),
      )
    })
  })

  describe('template management', () => {
    it('should return default templates when none saved', async () => {
      const { LeadAutomationService } = await import('../lead-automation.service')

      const automationService = new LeadAutomationService({
        adapter: mockStorage,
      })

      const templates = await automationService.getTemplates()
      expect(templates.length).toBeGreaterThan(0)
      expect(templates[0].trigger).toBe('lead_created')
    })

    it('should save and retrieve templates', async () => {
      const { LeadAutomationService } = await import('../lead-automation.service')

      const automationService = new LeadAutomationService({
        adapter: mockStorage,
      })

      await automationService.saveTemplate({
        id: 'custom-template',
        name: 'Custom Template',
        subject: 'Custom Subject',
        body: 'Custom body text',
        trigger: 'custom',
        active: true,
      })

      const templates = await automationService.getTemplates()
      const custom = templates.find((t) => t.id === 'custom-template')
      expect(custom).toBeDefined()
      expect(custom?.name).toBe('Custom Template')
    })
  })

  describe('notification config', () => {
    it('should return default config when none saved', async () => {
      const { LeadAutomationService } = await import('../lead-automation.service')

      const automationService = new LeadAutomationService({
        adapter: mockStorage,
      })

      const config = await automationService.getNotificationConfig()
      expect(config.emailEnabled).toBe(false)
      expect(config.smsEnabled).toBe(false)
      expect(config.pushEnabled).toBe(false)
    })

    it('should save and retrieve notification config', async () => {
      const { LeadAutomationService } = await import('../lead-automation.service')

      const automationService = new LeadAutomationService({
        adapter: mockStorage,
      })

      await automationService.saveNotificationConfig({
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: false,
        notifyEmail: 'test@example.com',
        notifyPhone: '+1999999999',
      })

      const config = await automationService.getNotificationConfig()
      expect(config.emailEnabled).toBe(true)
      expect(config.smsEnabled).toBe(true)
      expect(config.notifyEmail).toBe('test@example.com')
    })
  })

  describe('error handling', () => {
    it('should not throw when email sending fails', async () => {
      const { LeadAutomationService } = await import('../lead-automation.service')

      const failingEmailSpy = vi.fn().mockRejectedValue(new Error('SMTP error'))

      const automationService = new LeadAutomationService({
        adapter: mockStorage,
        sendEmail: failingEmailSpy,
        sendSms: sendSmsSpy,
        sendPush: sendPushSpy,
      })

      const lead: Lead = {
        id: 'lead-error',
        email: 'error@example.com',
        firstName: 'Error',
        status: 'new',
        source: 'website_form',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Should not throw
      await expect(automationService.onLeadCreated(lead)).resolves.not.toThrow()
    })

    it('should track failed actions in event', async () => {
      const { LeadAutomationService } = await import('../lead-automation.service')

      const failingEmailSpy = vi.fn().mockResolvedValue(false)

      const automationService = new LeadAutomationService({
        adapter: mockStorage,
        sendEmail: failingEmailSpy,
        sendSms: sendSmsSpy,
        sendPush: sendPushSpy,
      })

      const lead: Lead = {
        id: 'lead-fail',
        email: 'fail@example.com',
        firstName: 'Fail',
        status: 'new',
        source: 'website_form',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const event = await automationService.onLeadCreated(lead)
      const autoReplyAction = event.actions.find((a) => a.type === 'auto_reply')
      expect(autoReplyAction?.result).toBe('failed')
    })
  })
})
