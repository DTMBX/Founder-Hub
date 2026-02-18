/**
 * ops/publish/__tests__/publish-panel.test.ts
 *
 * Tests for P5: Admin Panel Publish UI models
 */

import { describe, it, expect } from 'vitest'
import {
  resolvePublishPanel,
  buildPublishHistory,
} from '../ui/PublishPanelModels.js'
import type { PublishAuditEvent } from '../models/PublishResult.js'

// ── Helpers ──────────────────────────────────────────────────────

function capChecker(role: string, capability: string): boolean {
  const caps: Record<string, string[]> = {
    operator: ['publish_site'],
    admin: ['publish_site', 'manage_deployments'],
    owner: ['publish_site', 'manage_deployments', 'dangerous_actions'],
    viewer: [],
  }
  return (caps[role] ?? []).includes(capability)
}

const ghConfigured = { configured: true, allowedRepoCount: 2 }
const ghNotConfigured = { configured: false, allowedRepoCount: 0 }

// ── resolvePublishPanel ──────────────────────────────────────────

describe('resolvePublishPanel', () => {
  describe('operator role', () => {
    it('shows hosted and zip as ready', () => {
      const panel = resolvePublishPanel('operator', 'standard', false, capChecker, ghConfigured)
      const hosted = panel.buttons.find(b => b.target === 'hosted')
      const zip = panel.buttons.find(b => b.target === 'zip')
      expect(hosted?.state).toBe('ready')
      expect(zip?.state).toBe('ready')
    })

    it('marks hosted as primary', () => {
      const panel = resolvePublishPanel('operator', 'standard', false, capChecker, ghConfigured)
      const hosted = panel.buttons.find(b => b.target === 'hosted')
      expect(hosted?.primary).toBe(true)
    })

    it('blocks github_pr (missing manage_deployments)', () => {
      const panel = resolvePublishPanel('operator', 'standard', false, capChecker, ghConfigured)
      const gh = panel.buttons.find(b => b.target === 'github_pr')
      expect(gh?.state).toBe('blocked')
      expect(gh?.reason).toContain('manage_deployments')
    })
  })

  describe('admin role', () => {
    it('shows all three as ready when configured', () => {
      const panel = resolvePublishPanel('admin', 'standard', false, capChecker, ghConfigured)
      expect(panel.buttons.every(b => b.state === 'ready')).toBe(true)
    })

    it('shows github as not_configured when missing setup', () => {
      const panel = resolvePublishPanel('admin', 'standard', false, capChecker, ghNotConfigured)
      const gh = panel.buttons.find(b => b.target === 'github_pr')
      expect(gh?.state).toBe('not_configured')
    })
  })

  describe('safe mode', () => {
    it('blocks github_pr in safe mode', () => {
      const panel = resolvePublishPanel('admin', 'standard', true, capChecker, ghConfigured)
      const gh = panel.buttons.find(b => b.target === 'github_pr')
      expect(gh?.state).toBe('blocked')
      expect(gh?.reason).toContain('Safe Mode')
    })

    it('hosted and zip remain ready in safe mode', () => {
      const panel = resolvePublishPanel('admin', 'standard', true, capChecker, ghConfigured)
      expect(panel.buttons.find(b => b.target === 'hosted')?.state).toBe('ready')
      expect(panel.buttons.find(b => b.target === 'zip')?.state).toBe('ready')
    })
  })

  describe('tenant restrictions', () => {
    it('blocks github_pr for public-demo', () => {
      const panel = resolvePublishPanel('admin', 'public-demo', false, capChecker, ghConfigured)
      const gh = panel.buttons.find(b => b.target === 'github_pr')
      expect(gh?.state).toBe('blocked')
      expect(gh?.reason).toContain('public-demo')
    })

    it('blocks github_pr for trial', () => {
      const panel = resolvePublishPanel('admin', 'trial', false, capChecker, ghConfigured)
      const gh = panel.buttons.find(b => b.target === 'github_pr')
      expect(gh?.state).toBe('blocked')
    })
  })

  describe('viewer role', () => {
    it('blocks all targets for viewer', () => {
      const panel = resolvePublishPanel('viewer', 'standard', false, capChecker, ghConfigured)
      expect(panel.buttons.find(b => b.target === 'hosted')?.state).toBe('blocked')
      expect(panel.buttons.find(b => b.target === 'zip')?.state).toBe('blocked')
      expect(panel.buttons.find(b => b.target === 'github_pr')?.state).toBe('blocked')
    })
  })

  it('always returns three buttons', () => {
    const panel = resolvePublishPanel('operator', 'standard', false, capChecker, ghConfigured)
    expect(panel.buttons.length).toBe(3)
  })

  it('includes context in panel state', () => {
    const panel = resolvePublishPanel('admin', 'enterprise', true, capChecker, ghConfigured)
    expect(panel.safeModeOn).toBe(true)
    expect(panel.tenantType).toBe('enterprise')
    expect(panel.actorRole).toBe('admin')
  })
})

// ── buildPublishHistory ──────────────────────────────────────────

describe('buildPublishHistory', () => {
  function makeEvent(
    correlationId: string,
    action: string,
    timestamp: string,
  ): PublishAuditEvent {
    return {
      entryId: `aud_${Math.random().toString(36).slice(2, 6)}`,
      correlationId,
      tenantId: 'tenant-1',
      actorId: 'actor-1',
      siteId: 'site-1',
      target: 'hosted',
      action: action as any,
      timestamp,
    }
  }

  it('builds history from audit events grouped by correlationId', () => {
    const events: PublishAuditEvent[] = [
      makeEvent('c1', 'publish_requested', '2026-01-01T01:00:00Z'),
      makeEvent('c1', 'publish_started', '2026-01-01T01:00:01Z'),
      makeEvent('c1', 'publish_succeeded', '2026-01-01T01:00:02Z'),
    ]
    const history = buildPublishHistory(events)
    expect(history.length).toBe(1)
    expect(history[0].result).toBe('succeeded')
    expect(history[0].correlationId).toBe('c1')
  })

  it('identifies failed publishes', () => {
    const events: PublishAuditEvent[] = [
      makeEvent('c2', 'publish_requested', '2026-01-01T02:00:00Z'),
      makeEvent('c2', 'publish_started', '2026-01-01T02:00:01Z'),
      makeEvent('c2', 'publish_failed', '2026-01-01T02:00:02Z'),
    ]
    const history = buildPublishHistory(events)
    expect(history[0].result).toBe('failed')
  })

  it('identifies blocked publishes', () => {
    const events: PublishAuditEvent[] = [
      makeEvent('c3', 'publish_requested', '2026-01-01T03:00:00Z'),
      makeEvent('c3', 'publish_blocked', '2026-01-01T03:00:01Z'),
    ]
    const history = buildPublishHistory(events)
    expect(history[0].result).toBe('blocked')
  })

  it('groups multiple correlationIds', () => {
    const events: PublishAuditEvent[] = [
      makeEvent('c1', 'publish_requested', '2026-01-01T01:00:00Z'),
      makeEvent('c1', 'publish_succeeded', '2026-01-01T01:00:02Z'),
      makeEvent('c2', 'publish_requested', '2026-01-01T02:00:00Z'),
      makeEvent('c2', 'publish_failed', '2026-01-01T02:00:02Z'),
    ]
    const history = buildPublishHistory(events)
    expect(history.length).toBe(2)
    expect(history[0].correlationId).toBe('c2') // sorted newest first
    expect(history[1].correlationId).toBe('c1')
  })

  it('resolves links via linkResolver', () => {
    const events: PublishAuditEvent[] = [
      makeEvent('c1', 'publish_succeeded', '2026-01-01T01:00:00Z'),
    ]
    const history = buildPublishHistory(events, () => 'https://example.com/site')
    expect(history[0].link).toBe('https://example.com/site')
  })

  it('returns empty for no events', () => {
    expect(buildPublishHistory([])).toEqual([])
  })
})
