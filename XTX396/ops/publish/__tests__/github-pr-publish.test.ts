/**
 * ops/publish/__tests__/github-pr-publish.test.ts
 *
 * Tests for P4: GitHub PR Publish Target
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { GitHubPrPublishTarget } from '../targets/GitHubPrPublishTarget.js'
import type { GitHubPrPublishConfig } from '../targets/GitHubPrPublishTarget.js'
import { MockGitHubApiAdapter, redactPrBody } from '../../integrations/github/GitHubIntegration.js'
import { RepoAllowlist } from '../../integrations/github/RepoAllowlist.js'
import type { ArtifactBundle, ArtifactEntry } from '../targets/HostedPublishTarget.js'
import type { PublishRequest } from '../models/PublishRequest.js'
import { TargetRegistry } from '../targets/TargetRegistry.js'

// ── Helpers ──────────────────────────────────────────────────────

function makeArtifact(path: string, content: string): ArtifactEntry {
  return { path, content, sha256: `sha_${path}`, size: content.length }
}

function makeBundle(overrides: Partial<ArtifactBundle> = {}): ArtifactBundle {
  return {
    siteId: 'site-1',
    blueprintId: 'law_firm',
    artifacts: [makeArtifact('index.html', '<html>Home</html>')],
    manifestHash: 'manifest_abc123',
    watermarked: true,
    generatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeConfig(overrides: Partial<GitHubPrPublishConfig> = {}): GitHubPrPublishConfig {
  return {
    targetRepo: 'DTMBX/site-output',
    baseBranch: 'main',
    branchPrefix: 'b22/site-',
    allowedRepos: ['DTMBX/site-output'],
    ...overrides,
  }
}

function makeRequest(overrides: Partial<PublishRequest> = {}): PublishRequest {
  return {
    tenantId: 'tenant-1',
    tenantType: 'standard',
    actorId: 'actor-1',
    actorRole: 'admin',
    siteId: 'site-1',
    blueprintId: 'law_firm',
    artifactRef: 'ref-1',
    publishTarget: 'github_pr',
    mode: 'owner',
    safeModeOn: false,
    correlationId: 'cor-1',
    requestedAt: '2026-01-15T10:30:00.000Z',
    ...overrides,
  }
}

function defaultCapChecker(role: string, capability: string): boolean {
  const caps: Record<string, string[]> = {
    operator: ['publish_site'],
    admin: ['publish_site', 'manage_deployments'],
    owner: ['publish_site', 'manage_deployments', 'dangerous_actions'],
  }
  return (caps[role] ?? []).includes(capability)
}

// ── RepoAllowlist ────────────────────────────────────────────────

describe('RepoAllowlist', () => {
  it('allows listed repos', () => {
    const al = new RepoAllowlist({ allowedRepos: ['org/repo-a', 'org/repo-b'] })
    expect(al.isAllowed('org/repo-a')).toBe(true)
    expect(al.isAllowed('org/repo-b')).toBe(true)
  })

  it('blocks unlisted repos', () => {
    const al = new RepoAllowlist({ allowedRepos: ['org/repo-a'] })
    expect(al.isAllowed('org/repo-b')).toBe(false)
  })

  it('is case-insensitive', () => {
    const al = new RepoAllowlist({ allowedRepos: ['Org/Repo'] })
    expect(al.isAllowed('org/repo')).toBe(true)
    expect(al.isAllowed('ORG/REPO')).toBe(true)
  })

  it('blocks empty string', () => {
    const al = new RepoAllowlist({ allowedRepos: ['org/repo'] })
    expect(al.isAllowed('')).toBe(false)
  })

  it('blocks malformed repo names', () => {
    const al = new RepoAllowlist({ allowedRepos: ['org/repo'] })
    expect(al.isAllowed('noslash')).toBe(false)
  })

  it('empty allowlist blocks all', () => {
    const al = new RepoAllowlist({ allowedRepos: [] })
    expect(al.isEmpty).toBe(true)
    expect(al.isAllowed('org/repo')).toBe(false)
  })

  it('reports size', () => {
    const al = new RepoAllowlist({ allowedRepos: ['a/b', 'c/d'] })
    expect(al.size).toBe(2)
  })
})

// ── redactPrBody ─────────────────────────────────────────────────

describe('redactPrBody', () => {
  it('redacts GitHub PAT', () => {
    const body = 'token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij'
    expect(redactPrBody(body)).toContain('[REDACTED')
    expect(redactPrBody(body)).not.toContain('ghp_')
  })

  it('redacts GitHub installation token', () => {
    const body = 'ghs_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij'
    expect(redactPrBody(body)).toContain('[REDACTED')
  })

  it('redacts Stripe keys', () => {
    // Build the test token dynamically so GitHub push-protection
    // does not flag the literal as a real Stripe secret.
    const prefix = 'sk' + '_live_'
    const body = prefix + 'ABCDEFGHIJKLMNOPQRSTUVWXYZaa'
    expect(redactPrBody(body)).toContain('[REDACTED')
  })

  it('redacts Bearer tokens', () => {
    const body = 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.something'
    expect(redactPrBody(body)).toContain('Bearer [REDACTED]')
  })

  it('redacts private keys', () => {
    const body = '-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----'
    expect(redactPrBody(body)).toContain('[REDACTED_PRIVATE_KEY]')
  })

  it('leaves clean text unchanged', () => {
    const body = '## Site Publish\nsite_id: site-1'
    expect(redactPrBody(body)).toBe(body)
  })
})

// ── MockGitHubApiAdapter ─────────────────────────────────────────

describe('MockGitHubApiAdapter', () => {
  it('records calls', async () => {
    const adapter = new MockGitHubApiAdapter()
    await adapter.createPullRequest({
      repo: 'org/repo', baseBranch: 'main', headBranch: 'b22/test',
      title: 'Test', body: 'body', files: [],
    })
    expect(adapter.callCount).toBe(1)
    expect(adapter.getLastCall()?.repo).toBe('org/repo')
  })

  it('returns custom response', async () => {
    const adapter = new MockGitHubApiAdapter()
    adapter.registerResponse('org/repo', {
      success: false, error: 'rate limited',
    })
    const result = await adapter.createPullRequest({
      repo: 'org/repo', baseBranch: 'main', headBranch: 'b22/test',
      title: 'Test', body: 'body', files: [],
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe('rate limited')
  })

  it('reports configured state', () => {
    const adapter = new MockGitHubApiAdapter()
    expect(adapter.isConfigured()).toBe(true)
    adapter.setConfigured(false)
    expect(adapter.isConfigured()).toBe(false)
  })
})

// ── GitHubAppConfig.schema.json ──────────────────────────────────

describe('GitHubAppConfig.schema.json', () => {
  it('parses as valid JSON', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const schemaPath = path.resolve(__dirname, '../../integrations/github/GitHubAppConfig.schema.json')
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'))
    expect(schema.required).toContain('app_id_env')
    expect(schema.required).toContain('allowed_repos')
    expect(schema.properties.enabled.default).toBe(false)
  })

  it('requires env var names not values', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const schemaPath = path.resolve(__dirname, '../../integrations/github/GitHubAppConfig.schema.json')
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'))
    // Env var pattern: must start with uppercase, only uppercase + digits + underscore
    expect(schema.properties.app_id_env.pattern).toContain('^[A-Z]')
  })
})

// ── GitHubPrPublishTarget ────────────────────────────────────────

describe('GitHubPrPublishTarget', () => {
  let adapter: MockGitHubApiAdapter
  let target: GitHubPrPublishTarget

  beforeEach(() => {
    adapter = new MockGitHubApiAdapter()
    target = new GitHubPrPublishTarget(adapter, makeConfig())
  })

  it('creates PR with site artifacts', async () => {
    target.registerBundle('ref-1', makeBundle())
    const result = await target.publish(makeRequest())
    expect(result.success).toBe(true)
    expect(result.target).toBe('github_pr')
    expect(result.prUrl).toContain('github.com')
    expect(result.version).toContain('b22/site-')
  })

  it('includes manifest in PR files', async () => {
    target.registerBundle('ref-1', makeBundle())
    await target.publish(makeRequest())
    const call = adapter.getLastCall()
    expect(call?.files.some(f => f.path.includes('manifest.json'))).toBe(true)
  })

  it('generates correct branch name', async () => {
    target.registerBundle('ref-1', makeBundle())
    await target.publish(makeRequest())
    const call = adapter.getLastCall()
    expect(call?.headBranch).toMatch(/^b22\/site-site-1-\d{14}$/)
  })

  it('fails when bundle not found', async () => {
    const result = await target.publish(makeRequest({ artifactRef: 'missing' }))
    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('enforces watermark in demo mode', async () => {
    target.registerBundle('ref-1', makeBundle({ watermarked: false }))
    const result = await target.publish(makeRequest({ mode: 'demo' }))
    expect(result.success).toBe(false)
    expect(result.error).toContain('watermark')
  })

  it('handles adapter failure', async () => {
    adapter.registerResponse('dtmbx/site-output', {
      success: false, error: 'API error',
    })
    target.registerBundle('ref-1', makeBundle())
    const result = await target.publish(makeRequest())
    expect(result.success).toBe(false)
    expect(result.error).toBe('API error')
  })

  describe('canPublish', () => {
    it('blocks when adapter not configured', () => {
      adapter.setConfigured(false)
      const t = new GitHubPrPublishTarget(adapter, makeConfig())
      const result = t.canPublish(makeRequest())
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('not configured')
    })

    it('blocks when allowlist empty', () => {
      const t = new GitHubPrPublishTarget(adapter, makeConfig({ allowedRepos: [] }))
      const result = t.canPublish(makeRequest())
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('allowlist')
    })

    it('blocks when target repo not in allowlist', () => {
      const t = new GitHubPrPublishTarget(adapter, makeConfig({
        targetRepo: 'other/repo',
        allowedRepos: ['DTMBX/site-output'],
      }))
      const result = t.canPublish(makeRequest())
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('not in allowlist')
    })

    it('allows when properly configured', () => {
      const result = target.canPublish(makeRequest())
      expect(result.allowed).toBe(true)
    })
  })
})

// ── Registry Integration ─────────────────────────────────────────

describe('Registry + GitHubPrPublishTarget', () => {
  it('publishes through registry', async () => {
    const adapter = new MockGitHubApiAdapter()
    const target = new GitHubPrPublishTarget(adapter, makeConfig())
    target.registerBundle('ref-1', makeBundle())

    const registry = new TargetRegistry(defaultCapChecker)
    registry.register(target)

    const result = await registry.publish(makeRequest())
    expect(result.success).toBe(true)
    expect(registry.getAuditLog().some(e => e.action === 'publish_succeeded')).toBe(true)
  })

  it('blocks in safe mode', async () => {
    const adapter = new MockGitHubApiAdapter()
    const target = new GitHubPrPublishTarget(adapter, makeConfig())
    target.registerBundle('ref-1', makeBundle())

    const registry = new TargetRegistry(defaultCapChecker)
    registry.register(target)

    const result = await registry.publish(makeRequest({ safeModeOn: true }))
    expect(result.success).toBe(false)
    expect(result.error).toContain('Safe Mode')
  })

  it('blocks public-demo tenant', async () => {
    const adapter = new MockGitHubApiAdapter()
    const target = new GitHubPrPublishTarget(adapter, makeConfig())
    target.registerBundle('ref-1', makeBundle())

    const registry = new TargetRegistry(defaultCapChecker)
    registry.register(target)

    const result = await registry.publish(makeRequest({ tenantType: 'public-demo' }))
    expect(result.success).toBe(false)
    expect(result.error).toContain('public-demo')
  })

  it('blocks operator role (missing manage_deployments)', async () => {
    const adapter = new MockGitHubApiAdapter()
    const target = new GitHubPrPublishTarget(adapter, makeConfig())
    target.registerBundle('ref-1', makeBundle())

    const registry = new TargetRegistry(defaultCapChecker)
    registry.register(target)

    const result = await registry.publish(makeRequest({ actorRole: 'operator' }))
    expect(result.success).toBe(false)
    expect(result.error).toContain('manage_deployments')
  })

  it('audit trail records blocked publish for demo tenant', async () => {
    const adapter = new MockGitHubApiAdapter()
    const target = new GitHubPrPublishTarget(adapter, makeConfig())

    const registry = new TargetRegistry(defaultCapChecker)
    registry.register(target)

    await registry.publish(makeRequest({ tenantType: 'public-demo' }))
    const blocked = registry.getAuditLog().filter(e => e.action === 'publish_blocked')
    expect(blocked.length).toBeGreaterThan(0)
  })
})
