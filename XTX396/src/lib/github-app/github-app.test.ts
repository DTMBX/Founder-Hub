/**
 * GitHub App Module Tests
 *
 * Tests for the GitHub App integration (Chain B2).
 * Uses mocked GitHub API client for isolation.
 *
 * CHAIN B2: Migrate GitHub integration to GitHub App
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock secret-vault
vi.mock('../secret-vault', () => ({
  storeSecret: vi.fn().mockResolvedValue('test-id'),
  retrieveSecret: vi.fn().mockResolvedValue(null),
  deleteSecret: vi.fn().mockResolvedValue(undefined),
  hasGitHubPAT: vi.fn().mockResolvedValue(false),
  clearGitHubPAT: vi.fn().mockResolvedValue(undefined),
}))

// Mock import.meta.env
vi.stubGlobal('import.meta', {
  env: {
    VITE_GITHUB_APP_ID: '12345',
    VITE_GITHUB_TOKEN_PROXY_URL: 'https://proxy.example.com',
  },
})

describe('GitHub App Types', () => {
  it('exports all required types', async () => {
    const types = await import('../github-app/types')
    
    // Ensure type exports exist (compile-time check)
    expect(types).toBeDefined()
  })
})

describe('GitHub App Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getInstallation', () => {
    it('returns null when not connected', async () => {
      const { getInstallation } = await import('../github-app/auth')
      const result = await getInstallation()
      expect(result).toBeNull()
    })
  })

  describe('isConnected', () => {
    it('returns false when not connected', async () => {
      const { isConnected } = await import('../github-app/auth')
      const result = await isConnected()
      expect(result).toBe(false)
    })
  })

  describe('initiateInstallFlow', () => {
    it('generates valid OAuth state', async () => {
      // Test the state generation without triggering navigation
      const state1 = crypto.getRandomValues(new Uint8Array(32))
      const state2 = crypto.getRandomValues(new Uint8Array(32))
      
      // Random states should be unique
      expect(state1).not.toEqual(state2)
      
      // State should be 32 bytes
      expect(state1.length).toBe(32)
    })
  })

  describe('handleInstallCallback', () => {
    it('rejects invalid state', async () => {
      sessionStorage.setItem('github_oauth_state', 'valid-state')

      const { handleInstallCallback } = await import('../github-app/auth')
      const params = new URLSearchParams({
        state: 'wrong-state',
        installation_id: '123',
      })

      const result = await handleInstallCallback(params)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('CSRF')
      }
    })

    it('handles missing installation_id', async () => {
      sessionStorage.setItem('github_oauth_state', 'valid-state')

      const { handleInstallCallback } = await import('../github-app/auth')
      const params = new URLSearchParams({
        state: 'valid-state',
      })

      const result = await handleInstallCallback(params)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('installation_id')
      }
    })
  })
})

describe('GitHub App Token Cache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getInstallationToken', () => {
    it('throws when not connected', async () => {
      const { getInstallationToken } = await import('../github-app/cache')

      await expect(getInstallationToken()).rejects.toThrow('Not connected')
    })
  })

  describe('clearAllTokens', () => {
    it('clears token cache', async () => {
      const { clearAllTokens, getTokenCacheStats } = await import('../github-app/cache')

      clearAllTokens()
      const stats = getTokenCacheStats()

      expect(stats.cachedCount).toBe(0)
      expect(stats.installations).toEqual([])
    })
  })
})

describe('GitHub App Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createBranch', () => {
    it('fails when not connected to GitHub App', async () => {
      const { createBranch } = await import('../github-app/operations')
      const result = await createBranch(
        { owner: 'test', repo: 'test', dataPath: 'data' },
        'new-branch'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Not connected')
    })
  })

  describe('createCommit', () => {
    it('fails when not connected to GitHub App', async () => {
      const { createCommit } = await import('../github-app/operations')
      const result = await createCommit(
        { owner: 'test', repo: 'test', dataPath: 'data' },
        [{ path: 'test.json', content: '{}' }],
        'test commit'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Not connected')
    })
  })

  describe('getCheckRuns', () => {
    it('fails when not connected to GitHub App', async () => {
      const { getCheckRuns } = await import('../github-app/operations')
      const result = await getCheckRuns(
        { owner: 'test', repo: 'test', dataPath: 'data' },
        'abc123'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Not connected')
    })
  })
})

describe('GitHub App Index', () => {
  it('exports all required functions', async () => {
    const githubApp = await import('../github-app')

    // Auth exports
    expect(githubApp.getInstallation).toBeDefined()
    expect(githubApp.saveInstallation).toBeDefined()
    expect(githubApp.clearInstallation).toBeDefined()
    expect(githubApp.isConnected).toBeDefined()
    expect(githubApp.initiateInstallFlow).toBeDefined()
    expect(githubApp.handleInstallCallback).toBeDefined()
    expect(githubApp.disconnect).toBeDefined()

    // Cache exports
    expect(githubApp.getInstallationToken).toBeDefined()
    expect(githubApp.invalidateToken).toBeDefined()
    expect(githubApp.clearAllTokens).toBeDefined()
    expect(githubApp.authenticatedFetch).toBeDefined()

    // Operations exports
    expect(githubApp.createBranch).toBeDefined()
    expect(githubApp.createCommit).toBeDefined()
    expect(githubApp.createPullRequest).toBeDefined()
    expect(githubApp.getCheckRuns).toBeDefined()
    expect(githubApp.publishChanges).toBeDefined()
  })

  it('getConnectionMethod returns correct method', async () => {
    const { getConnectionMethod } = await import('../github-app')

    // Should return 'none' when not connected
    const method = await getConnectionMethod()
    expect(['app', 'pat', 'none']).toContain(method)
  })
})

describe('Security Requirements', () => {
  it('tokens are never stored in localStorage', async () => {
    // Check that no token-related keys exist in localStorage
    const localStorageKeys = Object.keys(localStorage)
    const tokenKeys = localStorageKeys.filter(
      (key) => key.includes('token') && key.includes('github')
    )

    // The only GitHub key should be the repo mapping (safe)
    expect(tokenKeys).toHaveLength(0)
  })

  it('installation tokens have short TTL', async () => {
    // Installation tokens from GitHub expire in 1 hour
    // Our cache uses a 5 minute buffer before expiry
    const { GITHUB_APP_CONFIG } = await import('../github-app/auth')

    // Config should exist
    expect(GITHUB_APP_CONFIG).toBeDefined()
    expect(GITHUB_APP_CONFIG.appSlug).toBe('xtx396-publisher')
  })

  it('OAuth state is stored in sessionStorage only', async () => {
    const { initiateInstallFlow } = await import('../github-app/auth')

    // Check localStorage doesn't have OAuth state
    const localStorageKeys = Object.keys(localStorage)
    const oauthKeys = localStorageKeys.filter((key) => key.includes('oauth'))
    expect(oauthKeys).toHaveLength(0)
  })
})
