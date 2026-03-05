/**
 * Clients Module Tests
 *
 * Tests for ClientService, ProjectService, SubscriptionService, and WeeklyUpdateService.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryAdapter } from '@/lib/storage-adapter'
import { ClientService } from '../client.service'
import { ProjectService } from '../project.service'
import { SubscriptionService, PLAN_PRICING } from '../subscription.service'
import { WeeklyUpdateService } from '../weekly-update.service'

// ─── ClientService Tests ─────────────────────────────────────

describe('ClientService', () => {
  let adapter: MemoryAdapter
  let service: ClientService

  beforeEach(() => {
    adapter = new MemoryAdapter()
    service = new ClientService(adapter)
  })

  describe('create', () => {
    it('should create a client with required fields', async () => {
      const client = await service.create({
        name: 'John Doe',
        email: 'john@example.com',
      })

      expect(client.id).toBeDefined()
      expect(client.name).toBe('John Doe')
      expect(client.email).toBe('john@example.com')
      expect(client.portalEnabled).toBe(false)
      expect(client.createdAt).toBeDefined()
    })

    it('should create a client with all fields', async () => {
      const client = await service.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '555-1234',
        company: 'Acme Corp',
        tags: ['vip', 'enterprise'],
      })

      expect(client.phone).toBe('555-1234')
      expect(client.company).toBe('Acme Corp')
      expect(client.tags).toEqual(['vip', 'enterprise'])
    })
  })

  describe('get', () => {
    it('should retrieve a created client', async () => {
      const created = await service.create({ name: 'Test', email: 'test@test.com' })
      const retrieved = await service.get(created.id)

      expect(retrieved).not.toBeNull()
      expect(retrieved?.id).toBe(created.id)
    })

    it('should return null for non-existent client', async () => {
      const result = await service.get('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('getByEmail', () => {
    it('should find client by email', async () => {
      await service.create({ name: 'Test', email: 'find@test.com' })
      const found = await service.getByEmail('find@test.com')

      expect(found).not.toBeNull()
      expect(found?.email).toBe('find@test.com')
    })
  })

  describe('update', () => {
    it('should update client fields', async () => {
      const created = await service.create({ name: 'Original', email: 'orig@test.com' })
      const updated = await service.update(created.id, { name: 'Updated Name' })

      expect(updated).not.toBeNull()
      expect(updated?.name).toBe('Updated Name')
      expect(updated?.email).toBe('orig@test.com')
    })
  })

  describe('delete', () => {
    it('should delete a client', async () => {
      const created = await service.create({ name: 'ToDelete', email: 'del@test.com' })
      const deleted = await service.delete(created.id)

      expect(deleted).toBe(true)
      expect(await service.get(created.id)).toBeNull()
    })
  })

  describe('portal access', () => {
    it('should enable portal access with token', async () => {
      const created = await service.create({ name: 'Portal User', email: 'portal@test.com' })
      const result = await service.enablePortal(created.id)

      expect(result).not.toBeNull()
      expect(result?.token).toBeDefined()
      expect(result?.token.length).toBe(32)
      expect(result?.expiresAt).toBeDefined()
      
      // Verify client was updated
      const updated = await service.get(created.id)
      expect(updated?.portalEnabled).toBe(true)
      expect(updated?.portalToken).toBe(result?.token)
    })

    it('should validate portal token', async () => {
      const created = await service.create({ name: 'Token User', email: 'token@test.com' })
      const result = await service.enablePortal(created.id)
      
      // validatePortalToken returns a PortalSession
      const session = await service.validatePortalToken(result!.token)
      expect(session).not.toBeNull()
      expect(session?.clientId).toBe(created.id)
    })

    it('should reject invalid token', async () => {
      const result = await service.getPortalSession('invalid-token')
      expect(result).toBeNull()
    })
  })

  describe('list', () => {
    it('should list clients with pagination', async () => {
      await service.create({ name: 'Client 1', email: 'c1@test.com' })
      await service.create({ name: 'Client 2', email: 'c2@test.com' })
      await service.create({ name: 'Client 3', email: 'c3@test.com' })

      const result = await service.list({ offset: 0, limit: 2 })
      
      expect(result.clients.length).toBe(2)
      expect(result.total).toBe(3)
      expect(result.hasMore).toBe(true)
    })

    it('should filter by search', async () => {
      await service.create({ name: 'Alice Smith', email: 'alice@test.com' })
      await service.create({ name: 'Bob Jones', email: 'bob@test.com' })

      const result = await service.list({ search: 'alice' })
      
      expect(result.clients.length).toBe(1)
      expect(result.clients[0].name).toBe('Alice Smith')
    })
  })
})

// ─── ProjectService Tests ────────────────────────────────────

describe('ProjectService', () => {
  let adapter: MemoryAdapter
  let service: ProjectService

  beforeEach(() => {
    adapter = new MemoryAdapter()
    service = new ProjectService(adapter)
  })

  describe('create', () => {
    it('should create a project with planned status', async () => {
      const project = await service.create({
        clientId: 'client-1',
        name: 'Website Redesign',
        description: 'Full redesign',
        estimatedCompletion: new Date('2025-12-31').toISOString(),
      })

      expect(project.id).toBeDefined()
      expect(project.status).toBe('planned')
      expect(project.name).toBe('Website Redesign')
      // Project creation adds an initial "Project Created" update
      expect(project.updates).toHaveLength(1)
      expect(project.updates[0].type).toBe('status_change')
      expect(project.files).toEqual([])
    })
  })

  describe('status transitions', () => {
    it('should allow planned → active transition', async () => {
      const project = await service.create({
        clientId: 'client-1',
        name: 'Test Project',
      })

      const updated = await service.changeStatus(project.id, 'active')
      expect(updated?.status).toBe('active')
      // Initial creation update + status change update = 2
      expect(updated?.updates).toHaveLength(2)
    })

    it('should allow active → review transition', async () => {
      const project = await service.create({
        clientId: 'client-1',
        name: 'Test Project',
      })

      await service.changeStatus(project.id, 'active')
      const updated = await service.changeStatus(project.id, 'review')
      expect(updated?.status).toBe('review')
    })

    it('should allow review → complete transition', async () => {
      const project = await service.create({
        clientId: 'client-1',
        name: 'Test Project',
      })

      await service.changeStatus(project.id, 'active')
      await service.changeStatus(project.id, 'review')
      const updated = await service.changeStatus(project.id, 'complete')
      expect(updated?.status).toBe('complete')
    })

    it('should reject invalid transitions', async () => {
      const project = await service.create({
        clientId: 'client-1',
        name: 'Test Project',
      })

      // planned → complete is invalid, returns null
      const result = await service.changeStatus(project.id, 'complete')
      expect(result).toBeNull()
    })
  })

  describe('updates', () => {
    it('should add project update', async () => {
      const project = await service.create({
        clientId: 'client-1',
        name: 'Test Project',
      })

      const updated = await service.addUpdate(project.id, {
        type: 'progress',
        title: 'First Update',
        content: 'Progress made this week',
        author: 'test-user',
      })

      // Initial update (1) + new update (1) = 2
      expect(updated?.updates).toHaveLength(2)
      // New update is added at the beginning
      expect(updated?.updates[0].title).toBe('First Update')
      expect(updated?.updates[0].sentToClient).toBe(false)
    })

    it('should mark update as sent', async () => {
      const project = await service.create({
        clientId: 'client-1',
        name: 'Test Project',
      })

      await service.addUpdate(project.id, {
        type: 'note',
        title: 'Update',
        content: 'Content',
        author: 'test-user',
      })

      const p = await service.get(project.id)
      const updateId = p!.updates[0].id

      // markUpdateSent returns boolean
      const success = await service.markUpdateSent(project.id, updateId)
      expect(success).toBe(true)
      
      // Verify the update was marked as sent
      const afterMark = await service.get(project.id)
      expect(afterMark?.updates[0].sentToClient).toBe(true)
    })
  })

  describe('files', () => {
    it('should add project file', async () => {
      const project = await service.create({
        clientId: 'client-1',
        name: 'Test Project',
      })

      const updated = await service.addFile(project.id, {
        name: 'mockup.png',
        url: 'https://example.com/mockup.png',
        mimeType: 'image/png',
        size: 1024,
        uploadedBy: 'test-user',
      })

      expect(updated?.files).toHaveLength(1)
      expect(updated?.files[0].name).toBe('mockup.png')
    })

    it('should remove project file', async () => {
      const project = await service.create({
        clientId: 'client-1',
        name: 'Test Project',
      })

      await service.addFile(project.id, {
        name: 'file.pdf',
        url: 'https://example.com/file.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        uploadedBy: 'test-user',
      })

      const p = await service.get(project.id)
      const fileId = p!.files[0].id

      // removeFile returns boolean
      const success = await service.removeFile(project.id, fileId)
      expect(success).toBe(true)
      
      // Verify file was removed
      const afterRemove = await service.get(project.id)
      expect(afterRemove?.files).toHaveLength(0)
    })
  })

  describe('progress', () => {
    it('should update progress percentage', async () => {
      const project = await service.create({
        clientId: 'client-1',
        name: 'Test Project',
      })

      const updated = await service.updateProgress(project.id, 50)
      expect(updated?.progress).toBe(50)
    })

    it('should clamp progress to 0-100', async () => {
      const project = await service.create({
        clientId: 'client-1',
        name: 'Test Project',
      })

      const over = await service.updateProgress(project.id, 150)
      expect(over?.progress).toBe(100)

      const under = await service.updateProgress(project.id, -10)
      expect(under?.progress).toBe(0)
    })
  })
})

// ─── SubscriptionService Tests ───────────────────────────────

describe('SubscriptionService', () => {
  let adapter: MemoryAdapter
  let service: SubscriptionService

  beforeEach(() => {
    adapter = new MemoryAdapter()
    service = new SubscriptionService(adapter)
  })

  describe('create', () => {
    it('should create subscription with default price', async () => {
      const sub = await service.create({
        clientId: 'client-1',
        siteId: 'site-1',
        siteName: 'Example Site',
        planTier: 'standard',
        billingCycle: 'monthly',
      })

      expect(sub.id).toBeDefined()
      expect(sub.planTier).toBe('standard')
      // PLAN_PRICING structure is { monthly, name, services }
      expect(sub.monthlyPrice).toBe(PLAN_PRICING.standard.monthly)
      expect(sub.status).toBe('active')
      // Renewal date is auto-calculated
      expect(sub.renewalDate).toBeDefined()
    })

    it('should set correct billing cycle', async () => {
      const sub = await service.create({
        clientId: 'client-1',
        siteId: 'site-1',
        siteName: 'Custom Site',
        planTier: 'basic',
        billingCycle: 'quarterly',
      })

      expect(sub.billingCycle).toBe('quarterly')
    })
  })

  describe('enrichSubscription', () => {
    it('should add daysUntilRenewal for future renewals', async () => {
      // Create a subscription - renewal is auto-calculated ~30 days out
      const created = await service.create({
        clientId: 'client-1',
        siteId: 'site-1',
        siteName: 'Test Site',
        planTier: 'basic',
        billingCycle: 'monthly',
      })

      // Fetch via get() to get enriched data
      const sub = await service.get(created.id)
      
      // Fresh subscription should have ~30 days until renewal
      expect(sub?.daysUntilRenewal).toBeDefined()
      expect(sub?.daysUntilRenewal).toBeGreaterThanOrEqual(28)
      expect(sub?.isPastDue).toBe(false)
    })
  })

  describe('renew', () => {
    it('should renew subscription and reset to active status', async () => {
      const sub = await service.create({
        clientId: 'client-1',
        siteId: 'site-1',
        siteName: 'Renewable Site',
        planTier: 'standard',
        billingCycle: 'monthly',
      })

      // Change to past_due first
      await service.changeStatus(sub.id, 'past_due')

      // Renew should reset to active
      const renewed = await service.renew(sub.id)
      
      expect(renewed).not.toBeNull()
      expect(renewed?.status).toBe('active')
      expect(renewed?.renewalDate).toBeDefined()
    })
  })

  describe('getStats', () => {
    it('should calculate MRR correctly', async () => {
      await service.create({
        clientId: 'client-1',
        siteId: 'site-1',
        siteName: 'Site 1',
        planTier: 'basic',
        billingCycle: 'monthly',
      })

      await service.create({
        clientId: 'client-2',
        siteId: 'site-2',
        siteName: 'Site 2',
        planTier: 'premium',
        billingCycle: 'monthly',
      })

      const stats = await service.getStats()
      
      expect(stats.total).toBe(2)
      expect(stats.active).toBe(2)
      expect(stats.mrr).toBe(PLAN_PRICING.basic.monthly + PLAN_PRICING.premium.monthly)
    })
  })

  describe('getPastDue', () => {
    it('should return only past due subscriptions when set via changeStatus', async () => {
      // Create fresh subscriptions (not past due)
      const sub1 = await service.create({
        clientId: 'client-1',
        siteId: 'site-past',
        siteName: 'Past Due Site',
        planTier: 'basic',
        billingCycle: 'monthly',
      })

      await service.create({
        clientId: 'client-2',
        siteId: 'site-current',
        siteName: 'Current Site',
        planTier: 'basic',
        billingCycle: 'monthly',
      })

      // Mark one as past due via status change
      await service.changeStatus(sub1.id, 'past_due')

      const pastDue = await service.getPastDue()
      
      expect(pastDue).toHaveLength(1)
      expect(pastDue[0].siteName).toBe('Past Due Site')
    })
  })
})

// ─── WeeklyUpdateService Tests ───────────────────────────────

describe('WeeklyUpdateService', () => {
  let adapter: MemoryAdapter
  let projectService: ProjectService
  let service: WeeklyUpdateService

  beforeEach(() => {
    // Create fresh adapter and services for each test
    adapter = new MemoryAdapter()
    projectService = new ProjectService(adapter)
    // Explicitly pass services to avoid singleton issues
    service = new WeeklyUpdateService({ 
      adapter,
      projectService,
      clientService: new ClientService(adapter),
    })
  })

  describe('config', () => {
    it('should save and retrieve custom config', async () => {
      await service.saveConfig({
        enabled: false,
        dayOfWeek: 3,
        hourToSend: 10,
        ccAdmin: false,
        adminEmail: 'admin@test.com',
      })

      const config = await service.getConfig()
      
      expect(config.enabled).toBe(false)
      expect(config.dayOfWeek).toBe(3)
      expect(config.hourToSend).toBe(10)
    })

    it('should return default config for fresh adapter', async () => {
      // Create a completely fresh adapter and service
      const freshAdapter = new MemoryAdapter()
      const freshProjectService = new ProjectService(freshAdapter)
      const freshClientService = new ClientService(freshAdapter)
      const freshService = new WeeklyUpdateService({ 
        adapter: freshAdapter,
        projectService: freshProjectService,
        clientService: freshClientService,
      })
      
      const config = await freshService.getConfig()
      
      expect(config.enabled).toBe(true)
      expect(config.dayOfWeek).toBe(5) // Friday (actual default)
      expect(config.hourToSend).toBe(14) // 2 PM (actual default property name)
    })
  })

  describe('generateProjectSummary', () => {
    it('should generate summary with project details', async () => {
      const project = await projectService.create({
        clientId: 'client-1',
        name: 'Summary Test Project',
      })
      
      await projectService.changeStatus(project.id, 'active')
      await projectService.updateProgress(project.id, 50)
      await projectService.addUpdate(project.id, {
        type: 'note',
        title: 'Recent Update',
        content: 'Work done',
        author: 'test-user',
      })

      const fullProject = await projectService.get(project.id)
      // generateProjectSummary returns {highlights, nextSteps}
      const summary = service.generateProjectSummary(fullProject!)

      expect(summary.highlights).toBeDefined()
      expect(summary.nextSteps).toBeDefined()
    })
  })

  describe('getRecentEvents', () => {
    it('should return empty array when no events', async () => {
      const events = await service.getRecentEvents(10)
      expect(events).toHaveLength(0)
    })
  })
})
