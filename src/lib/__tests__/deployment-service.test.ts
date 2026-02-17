/**
 * Deployment Service Tests (CP1)
 *
 * Tests cover:
 * - Deployment record creation
 * - Status updates
 * - Log entry bounding
 * - Listing
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryAdapter } from '@/lib/storage-adapter'
import { SiteRegistry } from '@/lib/site-registry'
import {
  DeploymentService,
  MAX_LOG_ENTRIES,
} from '@/lib/deployment-service'
import type { DeploymentEnvironment } from '@/lib/types'

describe('DeploymentService', () => {
  let adapter: MemoryAdapter
  let registry: SiteRegistry
  let deploymentService: DeploymentService

  beforeEach(async () => {
    adapter = new MemoryAdapter()
    registry = new SiteRegistry(adapter)
    deploymentService = new DeploymentService(adapter)

    // Create a test site
    await registry.create('law-firm', 'Test Law Firm', undefined, 'test-actor')
  })

  describe('createDeployment', () => {
    it('creates a deployment record with pending status', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const deployment = await deploymentService.createDeployment(
        siteId,
        'v1',
        'preview',
        'admin',
      )

      expect(deployment.deploymentId).toBeTruthy()
      expect(deployment.siteId).toBe(siteId)
      expect(deployment.environment).toBe('preview')
      expect(deployment.status).toBe('pending')
      expect(deployment.deployedBy).toBe('admin')
      expect(deployment.logs).toHaveLength(1) // Initial log entry
    })

    it('supports all environment types', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId
      const environments: DeploymentEnvironment[] = ['preview', 'staging', 'production']

      for (const env of environments) {
        const deployment = await deploymentService.createDeployment(
          siteId,
          `v-${env}`,
          env,
          'admin',
        )

        expect(deployment.environment).toBe(env)
      }
    })
  })

  describe('setDeploymentStatus', () => {
    it('updates status to building', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const deployment = await deploymentService.createDeployment(
        siteId,
        'v1',
        'preview',
        'admin',
      )

      const updated = await deploymentService.setDeploymentStatus(
        siteId,
        deployment.deploymentId,
        'building',
      )

      expect(updated.status).toBe('building')
    })

    it('sets completedAt when status is success', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const deployment = await deploymentService.createDeployment(
        siteId,
        'v1',
        'preview',
        'admin',
      )

      await deploymentService.setDeploymentStatus(siteId, deployment.deploymentId, 'building')
      const completed = await deploymentService.setDeploymentStatus(
        siteId,
        deployment.deploymentId,
        'success',
      )

      expect(completed.status).toBe('success')
      expect(completed.completedAt).toBeTruthy()
    })

    it('sets completedAt when status is failed', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const deployment = await deploymentService.createDeployment(
        siteId,
        'v1',
        'preview',
        'admin',
      )

      const failed = await deploymentService.setDeploymentStatus(
        siteId,
        deployment.deploymentId,
        'failed',
      )

      expect(failed.status).toBe('failed')
      expect(failed.completedAt).toBeTruthy()
    })

    it('throws for non-existent deployment', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      await expect(
        deploymentService.setDeploymentStatus(siteId, 'bad-id', 'building'),
      ).rejects.toThrow('Deployment not found')
    })
  })

  describe('appendDeploymentLog', () => {
    it('appends log entry', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const deployment = await deploymentService.createDeployment(
        siteId,
        'v1',
        'preview',
        'admin',
      )

      await deploymentService.appendDeploymentLog(
        siteId,
        deployment.deploymentId,
        'info',
        'Building assets...',
      )

      const updated = await deploymentService.getDeployment(siteId, deployment.deploymentId)
      expect(updated!.logs.length).toBe(2)
      expect(updated!.logs[1].message).toBe('Building assets...')
      expect(updated!.logs[1].level).toBe('info')
    })

    it('supports different log levels', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const deployment = await deploymentService.createDeployment(
        siteId,
        'v1',
        'preview',
        'admin',
      )

      await deploymentService.appendDeploymentLog(siteId, deployment.deploymentId, 'info', 'Info message')
      await deploymentService.appendDeploymentLog(siteId, deployment.deploymentId, 'warn', 'Warning message')
      await deploymentService.appendDeploymentLog(siteId, deployment.deploymentId, 'error', 'Error message')

      const updated = await deploymentService.getDeployment(siteId, deployment.deploymentId)
      expect(updated!.logs.map(l => l.level)).toContain('info')
      expect(updated!.logs.map(l => l.level)).toContain('warn')
      expect(updated!.logs.map(l => l.level)).toContain('error')
    })

    it('bounds logs to MAX_LOG_ENTRIES', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const deployment = await deploymentService.createDeployment(
        siteId,
        'v1',
        'preview',
        'admin',
      )

      // Add more than MAX_LOG_ENTRIES logs
      for (let i = 0; i < MAX_LOG_ENTRIES + 50; i++) {
        await deploymentService.appendDeploymentLog(
          siteId,
          deployment.deploymentId,
          'info',
          `Log entry ${i}`,
        )
      }

      const updated = await deploymentService.getDeployment(siteId, deployment.deploymentId)
      expect(updated!.logs.length).toBeLessThanOrEqual(MAX_LOG_ENTRIES)
    })
  })

  describe('listDeployments', () => {
    it('returns deployments for a site', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      await deploymentService.createDeployment(siteId, 'v1', 'preview', 'admin')
      await deploymentService.createDeployment(siteId, 'v2', 'staging', 'admin')

      const deployments = await deploymentService.listDeployments(siteId)

      expect(deployments.length).toBe(2)
    })

    it('returns deployments in newest-first order', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      await deploymentService.createDeployment(siteId, 'v1', 'preview', 'admin')
      await new Promise(r => setTimeout(r, 10))
      await deploymentService.createDeployment(siteId, 'v2', 'staging', 'admin')

      const deployments = await deploymentService.listDeployments(siteId)

      // Newest first
      expect(deployments[0].environment).toBe('staging')
      expect(deployments[1].environment).toBe('preview')
    })

    it('respects limit parameter', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      await deploymentService.createDeployment(siteId, 'v1', 'preview', 'admin')
      await deploymentService.createDeployment(siteId, 'v2', 'staging', 'admin')
      await deploymentService.createDeployment(siteId, 'v3', 'production', 'admin')

      const deployments = await deploymentService.listDeployments(siteId, 2)

      expect(deployments.length).toBe(2)
    })
  })

  describe('getDeployment', () => {
    it('returns deployment by ID', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const created = await deploymentService.createDeployment(
        siteId,
        'v1',
        'preview',
        'admin',
      )

      const fetched = await deploymentService.getDeployment(siteId, created.deploymentId)

      expect(fetched).not.toBeNull()
      expect(fetched!.deploymentId).toBe(created.deploymentId)
    })

    it('returns null for non-existent deployment', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const fetched = await deploymentService.getDeployment(siteId, 'bad-id')
      expect(fetched).toBeNull()
    })
  })

  describe('getLatestDeployment', () => {
    it('returns most recent deployment for site+env', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      await deploymentService.createDeployment(siteId, 'v1', 'preview', 'admin')
      await new Promise(r => setTimeout(r, 10))
      const latest = await deploymentService.createDeployment(siteId, 'v2', 'preview', 'admin')

      const fetched = await deploymentService.getLatestDeployment(siteId, 'preview')

      expect(fetched).not.toBeNull()
      expect(fetched!.deploymentId).toBe(latest.deploymentId)
    })

    it('returns null if no deployments exist', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const fetched = await deploymentService.getLatestDeployment(siteId, 'production')
      expect(fetched).toBeNull()
    })
  })

  describe('audit integration', () => {
    it('logs deployment creation to audit trail', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      await deploymentService.createDeployment(siteId, 'v1', 'preview', 'admin')

      const auditLog = await registry.getAuditLog(siteId)
      const deployEvent = auditLog.find(e => e.action === 'deployment.created')

      expect(deployEvent).toBeDefined()
      expect(deployEvent!.actor).toBe('admin')
    })

    it('logs status changes to audit trail', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const deployment = await deploymentService.createDeployment(
        siteId,
        'v1',
        'preview',
        'admin',
      )

      await deploymentService.setDeploymentStatus(siteId, deployment.deploymentId, 'success')

      const auditLog = await registry.getAuditLog(siteId)
      const statusEvent = auditLog.find(e => e.action === 'deployment.status_changed')

      expect(statusEvent).toBeDefined()
      expect(statusEvent!.details?.newStatus).toBe('success')
    })
  })
})
