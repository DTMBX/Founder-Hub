/**
 * Leads Module Tests
 *
 * Tests for LeadService, CSV export, and lead capture flow.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Lead } from '@/leads/types'

// ─── CSV Utility Tests ───────────────────────────────────────

describe('CSV Utilities', () => {
  describe('escapeCsvValue', () => {
    it('should return empty string for null/undefined', async () => {
      const { escapeCsvValue } = await import('@/lib/csv')
      expect(escapeCsvValue(null)).toBe('')
      expect(escapeCsvValue(undefined)).toBe('')
    })
    
    it('should return string as-is when no special chars', async () => {
      const { escapeCsvValue } = await import('@/lib/csv')
      expect(escapeCsvValue('hello')).toBe('hello')
      expect(escapeCsvValue('123')).toBe('123')
    })
    
    it('should quote strings containing commas', async () => {
      const { escapeCsvValue } = await import('@/lib/csv')
      expect(escapeCsvValue('hello, world')).toBe('"hello, world"')
    })
    
    it('should quote strings containing quotes and double them', async () => {
      const { escapeCsvValue } = await import('@/lib/csv')
      expect(escapeCsvValue('say "hello"')).toBe('"say ""hello"""')
    })
    
    it('should quote strings containing newlines', async () => {
      const { escapeCsvValue } = await import('@/lib/csv')
      expect(escapeCsvValue('line1\nline2')).toBe('"line1\nline2"')
    })
    
    it('should stringify objects', async () => {
      const { escapeCsvValue } = await import('@/lib/csv')
      expect(escapeCsvValue({ a: 1 })).toBe('"{""a"":1}"')
    })
  })
  
  describe('toCsv', () => {
    it('should generate header row by default', async () => {
      const { toCsv } = await import('@/lib/csv')
      const data = [{ name: 'Alice', age: 30 }]
      const csv = toCsv(data, {
        columns: [
          { header: 'Name', accessor: 'name' },
          { header: 'Age', accessor: 'age' },
        ],
      })
      const lines = csv.split('\r\n')
      expect(lines[0]).toBe('Name,Age')
      expect(lines[1]).toBe('Alice,30')
    })
    
    it('should support accessor functions', async () => {
      const { toCsv } = await import('@/lib/csv')
      const data = [{ first: 'John', last: 'Doe' }]
      const csv = toCsv(data, {
        columns: [
          { header: 'Full Name', accessor: (r) => `${r.first} ${r.last}` },
        ],
      })
      expect(csv).toContain('John Doe')
    })
    
    it('should omit header when requested', async () => {
      const { toCsv } = await import('@/lib/csv')
      const data = [{ name: 'Alice' }]
      const csv = toCsv(data, {
        columns: [{ header: 'Name', accessor: 'name' }],
        includeHeader: false,
      })
      expect(csv).toBe('Alice')
    })
    
    it('should support custom delimiter', async () => {
      const { toCsv } = await import('@/lib/csv')
      const data = [{ a: 1, b: 2 }]
      const csv = toCsv(data, {
        columns: [
          { header: 'A', accessor: 'a' },
          { header: 'B', accessor: 'b' },
        ],
        delimiter: ';',
      })
      expect(csv).toContain('A;B')
      expect(csv).toContain('1;2')
    })
    
    it('should handle empty data', async () => {
      const { toCsv } = await import('@/lib/csv')
      const csv = toCsv([], {
        columns: [{ header: 'Name', accessor: 'name' }],
      })
      expect(csv).toBe('Name')
    })
  })
  
  describe('autoColumns', () => {
    it('should generate columns from object keys', async () => {
      const { autoColumns } = await import('@/lib/csv')
      const cols = autoColumns({ firstName: 'John', lastName: 'Doe' })
      expect(cols).toHaveLength(2)
      expect(cols[0].header).toBe('first Name')
      expect(cols[1].header).toBe('last Name')
    })
  })
})

// ─── Lead Service Tests ──────────────────────────────────────

describe('LeadService', () => {
  // Mock localStorage
  const mockStorage: Record<string, string> = {}
  
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
    
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => { mockStorage[key] = value },
      removeItem: (key: string) => { delete mockStorage[key] },
      clear: () => Object.keys(mockStorage).forEach((key) => delete mockStorage[key]),
    })
    
    // Reset service singleton
    vi.resetModules()
  })
  
  afterEach(() => {
    vi.unstubAllGlobals()
  })
  
  describe('capture', () => {
    it('should create a lead with required fields', async () => {
      const { getLeadService } = await import('@/leads/service')
      const service = getLeadService()
      
      const lead = await service.capture({
        email: 'test@example.com',
        source: 'website_form',
      })
      
      expect(lead.id).toBeDefined()
      expect(lead.email).toBe('test@example.com')
      expect(lead.source).toBe('website_form')
      expect(lead.status).toBe('new')
      expect(lead.createdAt).toBeDefined()
    })
    
    it('should save lead to storage', async () => {
      const { getLeadService } = await import('@/leads/service')
      const service = getLeadService()
      
      const lead = await service.capture({
        email: 'test@example.com',
        firstName: 'Test',
        company: 'Acme Inc',
      })
      
      const retrieved = await service.get(lead.id)
      expect(retrieved).not.toBeNull()
      expect(retrieved?.email).toBe('test@example.com')
      expect(retrieved?.firstName).toBe('Test')
      expect(retrieved?.company).toBe('Acme Inc')
    })
  })
  
  describe('list', () => {
    it('should list all leads', async () => {
      const { getLeadService } = await import('@/leads/service')
      const service = getLeadService()
      
      await service.capture({ email: 'a@test.com' })
      await service.capture({ email: 'b@test.com' })
      await service.capture({ email: 'c@test.com' })
      
      const result = await service.list()
      expect(result.leads).toHaveLength(3)
      expect(result.total).toBe(3)
    })
    
    it('should filter by status', async () => {
      const { getLeadService } = await import('@/leads/service')
      const service = getLeadService()
      
      const lead1 = await service.capture({ email: 'a@test.com' })
      await service.capture({ email: 'b@test.com' })
      
      await service.updateStatus(lead1.id, 'qualified')
      
      const result = await service.list({ status: 'qualified' })
      expect(result.leads).toHaveLength(1)
      expect(result.leads[0].email).toBe('a@test.com')
    })
    
    it('should search by email', async () => {
      const { getLeadService } = await import('@/leads/service')
      const service = getLeadService()
      
      await service.capture({ email: 'alice@test.com' })
      await service.capture({ email: 'bob@test.com' })
      
      const result = await service.list({ search: 'alice' })
      expect(result.leads).toHaveLength(1)
      expect(result.leads[0].email).toBe('alice@test.com')
    })
    
    it('should paginate results', async () => {
      const { getLeadService } = await import('@/leads/service')
      const service = getLeadService()
      
      for (let i = 0; i < 10; i++) {
        await service.capture({ email: `user${i}@test.com` })
      }
      
      const page1 = await service.list({ limit: 3, offset: 0 })
      expect(page1.leads).toHaveLength(3)
      expect(page1.total).toBe(10)
      expect(page1.hasMore).toBe(true)
      
      const page2 = await service.list({ limit: 3, offset: 3 })
      expect(page2.leads).toHaveLength(3)
    })
  })
  
  describe('updateStatus', () => {
    it('should update lead status', async () => {
      const { getLeadService } = await import('@/leads/service')
      const service = getLeadService()
      
      const lead = await service.capture({ email: 'test@example.com' })
      expect(lead.status).toBe('new')
      
      const updated = await service.updateStatus(lead.id, 'qualified')
      expect(updated?.status).toBe('qualified')
      
      const retrieved = await service.get(lead.id)
      expect(retrieved?.status).toBe('qualified')
    })
    
    it('should return null for non-existent lead', async () => {
      const { getLeadService } = await import('@/leads/service')
      const service = getLeadService()
      
      const result = await service.updateStatus('non-existent', 'qualified')
      expect(result).toBeNull()
    })
  })
  
  describe('exportCsv', () => {
    it('should export leads to CSV', async () => {
      const { getLeadService } = await import('@/leads/service')
      const service = getLeadService()
      
      await service.capture({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        company: 'Acme Inc',
      })
      
      const csv = await service.exportCsv()
      
      // Check header
      expect(csv).toContain('ID,Created,Status,Source,Email,First Name,Last Name,Company')
      // Check data
      expect(csv).toContain('test@example.com')
      expect(csv).toContain('Test')
      expect(csv).toContain('User')
      expect(csv).toContain('Acme Inc')
    })
    
    it('should include all defined columns', async () => {
      const { getLeadService } = await import('@/leads/service')
      const service = getLeadService()
      
      await service.capture({ email: 'test@example.com' })
      
      const csv = await service.exportCsv()
      const headers = csv.split('\r\n')[0]
      
      expect(headers).toContain('ID')
      expect(headers).toContain('Email')
      expect(headers).toContain('First Name')
      expect(headers).toContain('Company')
      expect(headers).toContain('Status')
      expect(headers).toContain('Source')
    })
  })
  
  describe('activities', () => {
    it('should add activity on lead creation', async () => {
      const { getLeadService } = await import('@/leads/service')
      const service = getLeadService()
      
      const lead = await service.capture({ email: 'test@example.com', source: 'preview_generator' })
      
      const activities = await service.getActivities(lead.id)
      expect(activities.length).toBeGreaterThanOrEqual(1)
      expect(activities[0].type).toBe('created')
    })
    
    it('should add activity on status change', async () => {
      const { getLeadService } = await import('@/leads/service')
      const service = getLeadService()
      
      const lead = await service.capture({ email: 'test@example.com' })
      await service.updateStatus(lead.id, 'qualified')
      
      const activities = await service.getActivities(lead.id)
      const statusChange = activities.find((a) => a.type === 'status_changed')
      expect(statusChange).toBeDefined()
      expect(statusChange?.description).toContain('qualified')
    })
  })
})

// ─── Lead Types Tests ────────────────────────────────────────

describe('Lead Types', () => {
  it('should export all required types', async () => {
    // Verify type exports exist (compile-time check)
    const lead: Lead = {
      id: '1',
      email: 'test@test.com',
      status: 'new',
      source: 'website_form',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    expect(lead.id).toBe('1')
  })
  
  it('should have correct status values', async () => {
    const { getLeadService } = await import('@/leads/service')
    const service = getLeadService()
    
    // Mock localStorage
    const mockStorage: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => { mockStorage[key] = value },
      removeItem: (key: string) => { delete mockStorage[key] },
      clear: () => Object.keys(mockStorage).forEach((key) => delete mockStorage[key]),
    })
    
    const lead = await service.capture({ email: 'test@example.com' })
    
    // Test all valid statuses
    const statuses: Array<'new' | 'qualified' | 'contacted' | 'proposal_sent' | 'deposit_paid' | 'converted' | 'lost' | 'unqualified'> = [
      'new', 'qualified', 'contacted', 'proposal_sent',
      'deposit_paid', 'converted', 'lost', 'unqualified',
    ]
    
    for (const status of statuses) {
      const updated = await service.updateStatus(lead.id, status)
      expect(updated?.status).toBe(status)
    }
  })
})
