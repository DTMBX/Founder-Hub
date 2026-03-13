/**
 * Audit Ledger Tests
 * Chain B6 — Test hash-chained tamper-evident audit log
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const mockStorage = new Map<string, string>()

const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => mockStorage.set(key, value)),
  removeItem: vi.fn((key: string) => mockStorage.delete(key)),
  clear: vi.fn(() => mockStorage.clear()),
  key: vi.fn((index: number) => Array.from(mockStorage.keys())[index] ?? null),
  get length() { return mockStorage.size }
}

// Mock crypto.subtle.digest
const mockDigest = vi.fn(async (_algorithm: string, data: ArrayBuffer) => {
  // Simple mock hash - just return the data with a hash prefix
  const str = new TextDecoder().decode(data)
  const hash = new Uint8Array(32)
  for (let i = 0; i < str.length && i < 32; i++) {
    hash[i] = str.charCodeAt(i) % 256
  }
  // Fill rest with consistent pattern based on input
  for (let i = Math.min(str.length, 32); i < 32; i++) {
    hash[i] = (str.length + i) % 256
  }
  return hash.buffer
})

vi.stubGlobal('localStorage', mockLocalStorage)
vi.stubGlobal('crypto', {
  subtle: {
    digest: mockDigest
  },
  randomUUID: () => `${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`,
  getRandomValues: (arr: Uint8Array) => { for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256); return arr },
})

// Now import the module after mocking
const { auditLedger, audit, auditSecurity, verifyAuditIntegrity, generateAuditReport } = 
  await import('../audit-ledger')

describe('audit-ledger', () => {
  beforeEach(async () => {
    mockStorage.clear()
    vi.clearAllMocks()
    // Reset the ledger by reloading (since it's a singleton)
    // @ts-expect-error - accessing private for testing
    auditLedger.entries = []
    // @ts-expect-error - accessing private for testing
    auditLedger.checkpoints = []
    // @ts-expect-error - accessing private for testing
    auditLedger.initialized = false
  })

  describe('append', () => {
    it('should append an event and return hashes', async () => {
      const result = await auditLedger.append({
        category: 'security',
        action: 'test_action',
        description: 'Test description',
        severity: 'info'
      })

      expect(result).toHaveProperty('eventHash')
      expect(result).toHaveProperty('chainHash')
      expect(result).toHaveProperty('sequence')
      expect(result.sequence).toBe(1)
      expect(result.eventHash).toBeTruthy()
      expect(result.chainHash).toBeTruthy()
    })

    it('should create hash chain across entries', async () => {
      const first = await auditLedger.append({
        category: 'access',
        action: 'login',
        description: 'User logged in',
        severity: 'info'
      })

      const second = await auditLedger.append({
        category: 'access',
        action: 'logout',
        description: 'User logged out',
        severity: 'info'
      })

      expect(second.sequence).toBe(2)
      // Chain hash should be different from event hash
      expect(second.chainHash).not.toBe(second.eventHash)
      // Chain hashes should be different
      expect(first.chainHash).not.toBe(second.chainHash)
    })

    it('should store entries in localStorage', async () => {
      await auditLedger.append({
        category: 'system',
        action: 'startup',
        description: 'System started',
        severity: 'info'
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      const stored = mockStorage.get('founder-hub_audit_ledger')
      expect(stored).toBeTruthy()
      const entries = JSON.parse(stored!)
      expect(entries).toHaveLength(1)
    })
  })

  describe('verify', () => {
    it('should verify empty ledger as valid', async () => {
      const result = await auditLedger.verify()

      expect(result.valid).toBe(true)
      expect(result.entriesVerified).toBe(0)
      expect(result.invalidEntries).toBe(0)
    })

    it('should verify valid entries as valid', async () => {
      await auditLedger.append({
        category: 'security',
        action: 'test',
        description: 'Test',
        severity: 'info'
      })

      await auditLedger.append({
        category: 'access',
        action: 'test2',
        description: 'Test 2',
        severity: 'warning'
      })

      const result = await auditLedger.verify()

      expect(result.valid).toBe(true)
      expect(result.entriesVerified).toBe(2)
      expect(result.validEntries).toBe(2)
      expect(result.invalidEntries).toBe(0)
    })

    it('should detect tampered event hash', async () => {
      await auditLedger.append({
        category: 'security',
        action: 'test',
        description: 'Test',
        severity: 'info'
      })

      // Tamper with the entry
      // @ts-expect-error - accessing private for testing
      auditLedger.entries[0].eventHash = 'tampered_hash'

      const result = await auditLedger.verify()

      expect(result.valid).toBe(false)
      expect(result.invalidEntries).toBe(1)
      expect(result.errors[0].type).toBe('event_hash')
    })

    it('should detect tampered chain hash', async () => {
      await auditLedger.append({
        category: 'security',
        action: 'test',
        description: 'Test',
        severity: 'info'
      })

      // Tamper with the chain hash
      // @ts-expect-error - accessing private for testing
      auditLedger.entries[0].chainHash = 'tampered_chain'

      const result = await auditLedger.verify()

      expect(result.valid).toBe(false)
      expect(result.errors[0].type).toBe('chain_hash')
    })
  })

  describe('query', () => {
    beforeEach(async () => {
      await auditLedger.append({
        category: 'security',
        action: 'login_attempt',
        description: 'Failed login',
        severity: 'warning'
      })

      await auditLedger.append({
        category: 'access',
        action: 'resource_access',
        description: 'Accessed resource',
        severity: 'info'
      })

      await auditLedger.append({
        category: 'security',
        action: 'password_change',
        description: 'Password changed',
        severity: 'info'
      })
    })

    it('should query by category', () => {
      const results = auditLedger.query({ category: 'security' })

      expect(results).toHaveLength(2)
      results.forEach(r => expect(r.event.category).toBe('security'))
    })

    it('should query by severity', () => {
      const results = auditLedger.query({ severity: 'warning' })

      expect(results).toHaveLength(1)
      expect(results[0].event.action).toBe('login_attempt')
    })

    it('should query by action', () => {
      const results = auditLedger.query({ action: 'resource_access' })

      expect(results).toHaveLength(1)
      expect(results[0].event.category).toBe('access')
    })

    it('should apply limit', () => {
      const results = auditLedger.query({ limit: 2 })

      expect(results).toHaveLength(2)
    })
  })

  describe('generateReport', () => {
    it('should generate a valid report', async () => {
      await auditLedger.append({
        category: 'security',
        action: 'test',
        description: 'Test',
        severity: 'info'
      })

      const report = await auditLedger.generateReport()

      expect(report).toHaveProperty('reportId')
      expect(report).toHaveProperty('generatedAt')
      expect(report).toHaveProperty('statistics')
      expect(report).toHaveProperty('integrity')
      expect(report).toHaveProperty('signature')
      expect(report.statistics.totalEntries).toBeGreaterThan(0)
    })
  })

  describe('convenience functions', () => {
    it('audit() should append event', async () => {
      const result = await audit({
        category: 'data',
        action: 'export',
        description: 'Data exported',
        severity: 'info'
      })

      expect(result.eventHash).toBeTruthy()
    })

    it('auditSecurity() should log security event', async () => {
      await auditSecurity('breach_attempt', 'Detected breach attempt', 'critical')

      const entries = auditLedger.getEntries()
      expect(entries[0].event.category).toBe('security')
      expect(entries[0].event.severity).toBe('critical')
    })

    it('verifyAuditIntegrity() should verify ledger', async () => {
      await audit({
        category: 'system',
        action: 'test',
        description: 'Test',
        severity: 'info'
      })

      const result = await verifyAuditIntegrity()
      expect(result.valid).toBe(true)
    })
  })
})
