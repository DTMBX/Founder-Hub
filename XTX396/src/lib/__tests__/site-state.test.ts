/**
 * Site State Machine Tests (CP1)
 *
 * Tests cover:
 * - Valid state transitions (draft→preview→staging→live)
 * - Invalid transitions blocked
 * - Audit logging
 * - Backwards compatibility (mapStatusToState)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryAdapter } from '@/lib/storage-adapter'
import { SiteRegistry } from '@/lib/site-registry'
import {
  SiteStateService,
  VALID_TRANSITIONS,
  mapStatusToState,
} from '@/lib/site-state'
import type { SiteState } from '@/lib/types'

describe('VALID_TRANSITIONS', () => {
  it('allows draft → preview', () => {
    expect(VALID_TRANSITIONS.draft).toContain('preview')
  })

  it('allows preview → staging', () => {
    expect(VALID_TRANSITIONS.preview).toContain('staging')
  })

  it('allows staging → live', () => {
    expect(VALID_TRANSITIONS.staging).toContain('live')
  })

  it('allows live → staging (rollback)', () => {
    expect(VALID_TRANSITIONS.live).toContain('staging')
  })

  it('does NOT allow draft → live (skip staging)', () => {
    expect(VALID_TRANSITIONS.draft).not.toContain('live')
  })

  it('does NOT allow live → draft (must go through preview)', () => {
    expect(VALID_TRANSITIONS.live).not.toContain('draft')
  })
})

describe('mapStatusToState', () => {
  it('maps legacy "draft" to SiteState draft', () => {
    expect(mapStatusToState('draft')).toBe('draft')
  })

  it('maps legacy "public" to SiteState live', () => {
    expect(mapStatusToState('public')).toBe('live')
  })

  it('maps legacy "demo" to SiteState preview', () => {
    expect(mapStatusToState('demo')).toBe('preview')
  })

  it('maps legacy "private" to SiteState draft', () => {
    expect(mapStatusToState('private')).toBe('draft')
  })

  it('maps legacy "unlisted" to SiteState live', () => {
    expect(mapStatusToState('unlisted')).toBe('live')
  })
})

describe('SiteStateService', () => {
  let adapter: MemoryAdapter
  let registry: SiteRegistry
  let stateService: SiteStateService

  beforeEach(async () => {
    adapter = new MemoryAdapter()
    registry = new SiteRegistry(adapter)
    stateService = new SiteStateService(adapter)

    // Create a test site
    await registry.create('law-firm', 'Test Law Firm', undefined, 'test-actor')
  })

  describe('getSiteState', () => {
    it('returns draft for new site', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const state = await stateService.getSiteState(siteId)
      expect(state).toBe('draft')
    })

    it('returns null for non-existent site', async () => {
      const state = await stateService.getSiteState('non-existent')
      expect(state).toBeNull()
    })
  })

  describe('canTransition', () => {
    it('returns true for valid transition draft → preview', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const result = await stateService.canTransition(siteId, 'preview')
      expect(result.allowed).toBe(true)
    })

    it('returns false for invalid transition draft → live', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const result = await stateService.canTransition(siteId, 'live')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Invalid transition')
    })

    it('returns false for same-state transition', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const result = await stateService.canTransition(siteId, 'draft')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Invalid transition')
    })

    it('returns false for non-existent site', async () => {
      const result = await stateService.canTransition('bad-id', 'preview')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('not found')
    })
  })

  describe('setSiteState', () => {
    it('transitions from draft to preview', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      await stateService.setSiteState(siteId, 'preview', 'admin')

      const state = await stateService.getSiteState(siteId)
      expect(state).toBe('preview')
    })

    it('follows full lifecycle: draft → preview → staging → live', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      await stateService.setSiteState(siteId, 'preview', 'admin')
      expect(await stateService.getSiteState(siteId)).toBe('preview')

      await stateService.setSiteState(siteId, 'staging', 'admin')
      expect(await stateService.getSiteState(siteId)).toBe('staging')

      await stateService.setSiteState(siteId, 'live', 'admin')
      expect(await stateService.getSiteState(siteId)).toBe('live')
    })

    it('throws for invalid transition', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      await expect(
        stateService.setSiteState(siteId, 'staging', 'admin'),
      ).rejects.toThrow('Invalid transition')
    })

    it('throws for non-existent site', async () => {
      await expect(
        stateService.setSiteState('bad-id', 'preview', 'admin'),
      ).rejects.toThrow('Site not found')
    })

    it('logs state change to audit trail', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      await stateService.setSiteState(siteId, 'preview', 'admin')

      const auditLog = await registry.getAuditLog(siteId)
      const stateEvent = auditLog.find(e => e.action === 'site.state_changed')

      expect(stateEvent).toBeDefined()
      expect(stateEvent!.actor).toBe('admin')
      expect(stateEvent!.details?.previousState).toBe('draft')
      expect(stateEvent!.details?.newState).toBe('preview')
    })
  })

  describe('lifecycle rollback', () => {
    it('allows live → staging for rollback', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      // Go through full lifecycle
      await stateService.setSiteState(siteId, 'preview', 'admin')
      await stateService.setSiteState(siteId, 'staging', 'admin')
      await stateService.setSiteState(siteId, 'live', 'admin')

      // Rollback to staging
      await stateService.setSiteState(siteId, 'staging', 'admin')
      expect(await stateService.getSiteState(siteId)).toBe('staging')
    })

    it('allows staging → preview for regression', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      await stateService.setSiteState(siteId, 'preview', 'admin')
      await stateService.setSiteState(siteId, 'staging', 'admin')

      // Go back to preview
      await stateService.setSiteState(siteId, 'preview', 'admin')
      expect(await stateService.getSiteState(siteId)).toBe('preview')
    })
  })
})
