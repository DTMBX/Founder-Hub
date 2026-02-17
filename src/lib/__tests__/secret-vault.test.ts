/**
 * Secret Vault Tests
 * Chain A3 — Testing encrypted secret storage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  storeSecret,
  retrieveSecret,
  deleteSecret,
  listSecrets,
  storeGitHubPAT,
  getGitHubPAT,
  hasGitHubPAT,
  clearGitHubPAT,
  rotateSecret,
  isValidGitHubPAT,
  isValidStripeKey,
  SecretNotFoundError,
  SecretIntegrityError,
} from '../secret-vault'

// Mock the crypto module
vi.mock('../crypto', () => ({
  encryptField: vi.fn(async (text: string) => `enc:${btoa(text)}`),
  decryptField: vi.fn(async (encrypted: string) => {
    if (!encrypted.startsWith('enc:')) throw new Error('Invalid encrypted format')
    return atob(encrypted.slice(4))
  }),
  encryptData: vi.fn(async (data: unknown) => `enc:${btoa(JSON.stringify(data))}`),
  decryptData: vi.fn(async <T>(encrypted: string): Promise<T> => {
    if (!encrypted.startsWith('enc:')) throw new Error('Invalid encrypted format')
    return JSON.parse(atob(encrypted.slice(4)))
  }),
}))

// Mock localStorage
const mockStorage = new Map<string, string>()
vi.mock('../local-storage-kv', () => ({
  kv: {
    get: vi.fn(async <T>(key: string): Promise<T | null> => {
      const value = mockStorage.get(key)
      return value ? JSON.parse(value) : null
    }),
    set: vi.fn(async <T>(key: string, value: T): Promise<void> => {
      mockStorage.set(key, JSON.stringify(value))
    }),
    delete: vi.fn(async (key: string): Promise<void> => {
      mockStorage.delete(key)
    }),
  },
}))

describe('secret-vault', () => {
  beforeEach(() => {
    mockStorage.clear()
    vi.clearAllMocks()
  })

  // ─── Core Operations ─────────────────────────────────────────

  describe('storeSecret', () => {
    it('should store a secret and return an ID', async () => {
      const secretId = await storeSecret('github-pat', 'Test Token', 'ghp_test123456789')
      
      expect(secretId).toMatch(/^sec_[a-z0-9_]+$/)
    })

    it('should store encrypted metadata', async () => {
      await storeSecret('github-pat', 'Test Token', 'my-secret-value')
      
      // Check that the vault index was updated
      const indexKey = 'vault:__index'
      expect(mockStorage.has(indexKey)).toBe(true)
    })
  })

  describe('retrieveSecret', () => {
    it('should retrieve a stored secret', async () => {
      const secretId = await storeSecret('api-key', 'API Key', 'my-api-key-value')
      
      const result = await retrieveSecret(secretId)
      
      expect(result).not.toBeNull()
      expect(result!.value).toBe('my-api-key-value')
      expect(result!.metadata.type).toBe('api-key')
      expect(result!.metadata.label).toBe('API Key')
    })

    it('should return null for non-existent secret', async () => {
      const result = await retrieveSecret('sec_nonexistent')
      
      expect(result).toBeNull()
    })

    it('should increment access count', async () => {
      const secretId = await storeSecret('api-key', 'API Key', 'my-secret')
      
      await retrieveSecret(secretId)
      const result = await retrieveSecret(secretId)
      
      expect(result!.metadata.accessCount).toBe(2)
    })
  })

  describe('deleteSecret', () => {
    it('should delete a secret', async () => {
      const secretId = await storeSecret('api-key', 'API Key', 'my-secret')
      
      const deleted = await deleteSecret(secretId)
      
      expect(deleted).toBe(true)
      
      const result = await retrieveSecret(secretId)
      expect(result).toBeNull()
    })

    it('should return false for non-existent secret', async () => {
      const deleted = await deleteSecret('sec_nonexistent')
      
      expect(deleted).toBe(false)
    })
  })

  describe('listSecrets', () => {
    it('should list all stored secrets', async () => {
      await storeSecret('github-pat', 'GitHub Token', 'token1')
      await storeSecret('api-key', 'API Key', 'key1')
      
      const secrets = await listSecrets()
      
      expect(secrets).toHaveLength(2)
      expect(secrets.map(s => s.metadata.type)).toContain('github-pat')
      expect(secrets.map(s => s.metadata.type)).toContain('api-key')
    })

    it('should return empty array when no secrets', async () => {
      const secrets = await listSecrets()
      
      expect(secrets).toEqual([])
    })
  })

  // ─── GitHub PAT Convenience Functions ─────────────────────────

  describe('GitHub PAT functions', () => {
    it('should store and retrieve GitHub PAT', async () => {
      await storeGitHubPAT('ghp_test1234567890abcdefghijklmnopqrstuvwx')
      
      const token = await getGitHubPAT()
      
      expect(token).toBe('ghp_test1234567890abcdefghijklmnopqrstuvwx')
    })

    it('should report hasGitHubPAT correctly', async () => {
      expect(await hasGitHubPAT()).toBe(false)
      
      await storeGitHubPAT('ghp_test1234567890abcdefghijklmnopqrstuvwx')
      
      expect(await hasGitHubPAT()).toBe(true)
    })

    it('should clear GitHub PAT', async () => {
      await storeGitHubPAT('ghp_test1234567890abcdefghijklmnopqrstuvwx')
      
      await clearGitHubPAT()
      
      expect(await hasGitHubPAT()).toBe(false)
      expect(await getGitHubPAT()).toBeNull()
    })

    it('should replace existing GitHub PAT', async () => {
      await storeGitHubPAT('ghp_old_token_12345678901234567890123456')
      await storeGitHubPAT('ghp_new_token_12345678901234567890123456')
      
      const token = await getGitHubPAT()
      
      expect(token).toBe('ghp_new_token_12345678901234567890123456')
      
      // Should only have one GitHub PAT
      const secrets = await listSecrets()
      const githubPats = secrets.filter(s => s.metadata.type === 'github-pat')
      expect(githubPats).toHaveLength(1)
    })
  })

  // ─── Key Rotation ─────────────────────────────────────────────

  describe('rotateSecret', () => {
    it('should rotate a secret to a new value', async () => {
      const oldId = await storeSecret('api-key', 'API Key', 'old-value')
      
      const newId = await rotateSecret(oldId, 'new-value')
      
      expect(newId).not.toBe(oldId)
      
      const result = await retrieveSecret(newId)
      expect(result!.value).toBe('new-value')
      expect(result!.metadata.rotatedFrom).toBe(oldId)
      
      // Old secret should be deleted
      const oldResult = await retrieveSecret(oldId)
      expect(oldResult).toBeNull()
    })

    it('should throw for non-existent secret', async () => {
      await expect(rotateSecret('sec_nonexistent', 'new-value'))
        .rejects.toThrow(SecretNotFoundError)
    })
  })

  // ─── Validation Helpers ─────────────────────────────────────────

  describe('isValidGitHubPAT', () => {
    it('should validate classic PATs', () => {
      expect(isValidGitHubPAT('ghp_1234567890abcdefghijklmnopqrstuvwxyz')).toBe(true)
    })

    it('should validate fine-grained PATs', () => {
      expect(isValidGitHubPAT('github_pat_11ABCDEFG_0123456789abcdefghijklmnopqrstuvwxyzABCDEFGH')).toBe(true)
    })

    it('should validate OAuth tokens', () => {
      expect(isValidGitHubPAT('gho_1234567890abcdefghijklmnopqrstuvwxyz')).toBe(true)
    })

    it('should reject invalid tokens', () => {
      expect(isValidGitHubPAT('invalid-token')).toBe(false)
      expect(isValidGitHubPAT('ghp_short')).toBe(false)
      expect(isValidGitHubPAT('')).toBe(false)
    })
  })

  describe('isValidStripeKey', () => {
    it('should validate test secret keys', () => {
      expect(isValidStripeKey('xk_fake_1234567890abcdefghijklmnopqrs')).toBe(true)
    })

    it('should validate live secret keys', () => {
      expect(isValidStripeKey('xk_fake_1234567890abcdefghijklmnopqrs')).toBe(true)
    })

    it('should validate publishable keys', () => {
      expect(isValidStripeKey('pk_test_1234567890abcdefghijklmnopqrs')).toBe(true)
    })

    it('should validate restricted keys', () => {
      expect(isValidStripeKey('rk_test_1234567890abcdefghijklmnopqrs')).toBe(true)
    })

    it('should reject invalid keys', () => {
      expect(isValidStripeKey('invalid-key')).toBe(false)
      expect(isValidStripeKey('sk_prod_123')).toBe(false)
    })
  })
})
