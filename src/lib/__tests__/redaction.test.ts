/**
 * Redaction Module Tests
 * Chain A3 — Testing pattern-based secret filtering
 */

import { describe, it, expect } from 'vitest'
import {
  redact,
  redactObject,
  detectSecrets,
  containsSecret,
  scanForSecrets,
  assertNoSecrets,
  SecretLeakError,
  createSafeConsole,
  redactForLog,
  redactForUI,
  redactForExport,
  redactForAudit,
} from '../redaction'

describe('redaction', () => {
  // ─── Core Redaction ──────────────────────────────────────────

  describe('redact', () => {
    it('should redact GitHub classic PATs', () => {
      const input = 'Token: ghp_1234567890abcdefghijklmnopqrstuvwxyz'
      
      const result = redact(input)
      
      expect(result).not.toContain('1234567890')
      expect(result).toContain('ghp_')
      expect(result).toContain('********')
      expect(result).toContain('wxyz') // Last 4 chars visible
    })

    it('should redact GitHub fine-grained PATs', () => {
      const input = 'Using github_pat_11ABCDEFG0123456789abcdefghijklmnopqrstuvwxyzABCD'
      
      const result = redact(input)
      
      expect(result).not.toContain('0123456789')
      expect(result).toContain('github_pat_')
    })

    it('should redact Stripe secret keys', () => {
      const input = 'Key: xk_fake_12345678901234567890abcdefgh'
      
      const result = redact(input)
      
      expect(result).not.toContain('12345678901234567890')
      expect(result).toContain('sk_***')
    })

    it('should redact Stripe webhook secrets', () => {
      const input = 'whsec_1234567890abcdefghijklmnopqrs'
      
      const result = redact(input)
      
      expect(result).toContain('[REDACTED]')
    })

    it('should redact AWS access key IDs', () => {
      const input = 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE'
      
      const result = redact(input)
      
      expect(result).not.toContain('IOSFODNN7EXAM')
      expect(result).toContain('AKIA')
    })

    it('should redact JWT tokens', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
      const input = `Bearer ${jwt}`
      
      const result = redact(input)
      
      expect(result).not.toContain('eyJzdWIiOiIxMjM0NTY3ODkwIn0')
      expect(result).toContain('eyJ***')
    })

    it('should redact Bearer tokens', () => {
      const input = 'Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456'
      
      const result = redact(input)
      
      expect(result).toContain('Bearer [REDACTED]')
    })

    it('should redact passwords in URLs', () => {
      const input = 'postgres://user:supersecretpassword@localhost:5432/db'
      
      const result = redact(input)
      
      expect(result).not.toContain('supersecretpassword')
      expect(result).toContain('****')
    })

    it('should redact password fields in JSON', () => {
      const input = '{"username":"admin","password":"secret123"}'
      
      const result = redact(input)
      
      expect(result).not.toContain('secret123')
      expect(result).toContain('"password":"[REDACTED]"')
    })

    it('should redact private keys', () => {
      const input = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEA
-----END PRIVATE KEY-----`
      
      const result = redact(input)
      
      expect(result).not.toContain('MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEA')
      expect(result).toContain('[REDACTED]')
    })

    it('should redact MongoDB connection strings', () => {
      const input = 'mongodb+srv://admin:password123@cluster.mongodb.net/db'
      
      const result = redact(input)
      
      expect(result).not.toContain('password123')
      expect(result).toContain('****')
    })

    it('should redact credit card numbers', () => {
      const input = 'Card: 4111111111111111'
      
      const result = redact(input)
      
      expect(result).toContain('[CARD_REDACTED]')
    })

    it('should redact SSNs', () => {
      const input = 'SSN: 123-45-6789'
      
      const result = redact(input)
      
      expect(result).toContain('***-**-****')
    })

    it('should handle strings without secrets', () => {
      const input = 'This is a normal string without any secrets.'
      
      const result = redact(input)
      
      expect(result).toBe(input)
    })

    it('should handle empty strings', () => {
      expect(redact('')).toBe('')
    })

    it('should handle null/undefined', () => {
      expect(redact(null as unknown as string)).toBe(null)
      expect(redact(undefined as unknown as string)).toBe(undefined)
    })
  })

  // ─── Object Redaction ────────────────────────────────────────

  describe('redactObject', () => {
    it('should redact secrets in object values', () => {
      const obj = {
        token: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz',
        name: 'Test User',
      }
      
      const result = redactObject(obj)
      
      expect(result.token).not.toContain('1234567890')
      expect(result.name).toBe('Test User')
    })

    it('should redact nested objects', () => {
      const obj = {
        config: {
          stripe: {
            key: 'xk_fake_12345678901234567890abcdefgh',
          },
        },
      }
      
      const result = redactObject(obj)
      
      expect(result.config.stripe.key).not.toContain('1234567890')
    })

    it('should redact arrays', () => {
      const obj = {
        tokens: [
          'ghp_1234567890abcdefghijklmnopqrstuvwxyz',
          'normal-value',
        ],
      }
      
      const result = redactObject(obj)
      
      expect(result.tokens[0]).not.toContain('1234567890')
      expect(result.tokens[1]).toBe('normal-value')
    })

    it('should handle primitive values', () => {
      expect(redactObject(42)).toBe(42)
      expect(redactObject(true)).toBe(true)
      expect(redactObject(null)).toBe(null)
    })
  })

  // ─── Detection ───────────────────────────────────────────────

  describe('detectSecrets', () => {
    it('should detect GitHub PATs', () => {
      const input = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz'
      
      const detected = detectSecrets(input)
      
      expect(detected).toContain('GitHub PAT (classic)')
    })

    it('should detect multiple secret types', () => {
      const input = `
        GitHub: ghp_1234567890abcdefghijklmnopqrstuvwxyz
        Stripe: xk_fake_12345678901234567890abcdefgh
      `
      
      const detected = detectSecrets(input)
      
      expect(detected).toContain('GitHub PAT (classic)')
      expect(detected).toContain('Stripe Secret Key')
    })

    it('should return empty array for no secrets', () => {
      const input = 'Just a normal string'
      
      const detected = detectSecrets(input)
      
      expect(detected).toEqual([])
    })
  })

  describe('containsSecret', () => {
    it('should return true when secrets present', () => {
      expect(containsSecret('ghp_1234567890abcdefghijklmnopqrstuvwxyz')).toBe(true)
    })

    it('should return false when no secrets', () => {
      expect(containsSecret('normal text')).toBe(false)
    })
  })

  // ─── Scanning ────────────────────────────────────────────────

  describe('scanForSecrets', () => {
    it('should find secrets with line numbers', () => {
      const content = `Line 1
ghp_1234567890abcdefghijklmnopqrstuvwxyz
Line 3`
      
      const result = scanForSecrets(content)
      
      expect(result.hasSecrets).toBe(true)
      expect(result.findings).toHaveLength(1)
      expect(result.findings[0].line).toBe(2)
      expect(result.findings[0].pattern).toBe('GitHub PAT (classic)')
    })

    it('should find multiple secrets', () => {
      const content = `ghp_1234567890abcdefghijklmnopqrstuvwxyz
xk_fake_12345678901234567890abcdefgh`
      
      const result = scanForSecrets(content)
      
      expect(result.hasSecrets).toBe(true)
      expect(result.findings.length).toBeGreaterThanOrEqual(2)
    })

    it('should return hasSecrets=false for clean content', () => {
      const content = `Normal code
const x = 42
No secrets here`
      
      const result = scanForSecrets(content)
      
      expect(result.hasSecrets).toBe(false)
      expect(result.findings).toEqual([])
    })

    it('should redact secrets in snippets', () => {
      const content = 'token=ghp_1234567890abcdefghijklmnopqrstuvwxyz'
      
      const result = scanForSecrets(content)
      
      expect(result.findings[0].snippet).not.toContain('1234567890')
    })
  })

  // ─── Assertions ──────────────────────────────────────────────

  describe('assertNoSecrets', () => {
    it('should pass for clean content', () => {
      expect(() => assertNoSecrets('normal content')).not.toThrow()
    })

    it('should throw SecretLeakError for secrets', () => {
      expect(() => 
        assertNoSecrets('ghp_1234567890abcdefghijklmnopqrstuvwxyz')
      ).toThrow(SecretLeakError)
    })

    it('should include context in error message', () => {
      expect(() => 
        assertNoSecrets('ghp_1234567890abcdefghijklmnopqrstuvwxyz', 'export file')
      ).toThrow(/export file/)
    })
  })

  // ─── Specialized Functions ───────────────────────────────────

  describe('redactForLog', () => {
    it('should redact for safe logging', () => {
      const result = redactForLog('Token: ghp_1234567890abcdefghijklmnopqrstuvwxyz')
      
      expect(result).not.toContain('1234567890')
    })
  })

  describe('redactForUI', () => {
    it('should redact for UI display', () => {
      const result = redactForUI('Error with token ghp_1234567890abcdefghijklmnopqrstuvwxyz')
      
      expect(result).not.toContain('1234567890')
    })
  })

  describe('redactForExport', () => {
    it('should add redaction marker when content changed', () => {
      const result = redactForExport('ghp_1234567890abcdefghijklmnopqrstuvwxyz')
      
      expect(result).toContain('[contains redacted content]')
    })

    it('should not add marker for clean content', () => {
      const result = redactForExport('Clean content')
      
      expect(result).not.toContain('[contains redacted content]')
    })
  })

  describe('redactForAudit', () => {
    it('should redact audit entries', () => {
      const entry = {
        action: 'login',
        token: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz',
        timestamp: Date.now(),
      }
      
      const result = redactForAudit(entry)
      
      expect(result.token).not.toContain('1234567890')
      expect(result.action).toBe('login')
    })
  })

  // ─── Safe Console ────────────────────────────────────────────

  describe('createSafeConsole', () => {
    it('should create console wrapper with redaction', () => {
      const safeConsole = createSafeConsole()
      
      expect(safeConsole).toHaveProperty('log')
      expect(safeConsole).toHaveProperty('warn')
      expect(safeConsole).toHaveProperty('error')
      expect(safeConsole).toHaveProperty('info')
      expect(safeConsole).toHaveProperty('debug')
    })
  })
})
