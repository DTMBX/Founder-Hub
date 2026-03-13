/**
 * Incident Log Tests
 * Chain B6 — Test incident management system
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
vi.stubGlobal('localStorage', mockLocalStorage)
vi.stubGlobal('crypto', {
  subtle: {
    digest: vi.fn(async (_algorithm: string, data: ArrayBuffer) => {
      const str = new TextDecoder().decode(data)
      const hash = new Uint8Array(32)
      for (let i = 0; i < 32; i++) {
        hash[i] = (str.charCodeAt(i % str.length) + i) % 256
      }
      return hash.buffer
    })
  },
  randomUUID: () => `${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`,
  getRandomValues: (arr: Uint8Array) => { for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256); return arr },
})

// Import after mocking
const { 
  incidentLog,
  createSecurityIncident,
  createKeyExposureIncident,
  createDeployFailureIncident,
  createAccessAnomalyIncident,
  getOpenIncidentCount,
  getIncidentStats
} = await import('../incident-log')

describe('incident-log', () => {
  beforeEach(async () => {
    mockStorage.clear()
    vi.clearAllMocks()
    // Reset the singleton
    // @ts-expect-error - accessing private for testing
    incidentLog.incidents = []
    // @ts-expect-error - accessing private for testing
    incidentLog.initialized = false
  })

  describe('create', () => {
    it('should create an incident with correct fields', async () => {
      const incident = await incidentLog.create({
        type: 'security_event',
        title: 'Test Security Event',
        description: 'This is a test incident',
        severity: 'high',
        affected: ['api', 'database']
      })

      expect(incident).toHaveProperty('id')
      expect(incident.id).toMatch(/^INC-/)
      expect(incident.type).toBe('security_event')
      expect(incident.title).toBe('Test Security Event')
      expect(incident.severity).toBe('high')
      expect(incident.status).toBe('open')
      expect(incident.affected).toContain('api')
      expect(incident.timeline).toHaveLength(1)
      expect(incident.timeline[0].action).toBe('created')
    })

    it('should assign unique IDs', async () => {
      const first = await incidentLog.create({
        type: 'security_event',
        title: 'First',
        description: 'First incident',
        severity: 'low'
      })

      const second = await incidentLog.create({
        type: 'security_event',
        title: 'Second',
        description: 'Second incident',
        severity: 'low'
      })

      expect(first.id).not.toBe(second.id)
    })

    it('should persist to localStorage', async () => {
      await incidentLog.create({
        type: 'deploy_failure',
        title: 'Deploy Failed',
        description: 'Production deploy failed',
        severity: 'high'
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      const stored = mockStorage.get('founder-hub_incident_log')
      expect(stored).toBeTruthy()
      const incidents = JSON.parse(stored!)
      expect(incidents).toHaveLength(1)
    })
  })

  describe('get', () => {
    it('should retrieve an incident by ID', async () => {
      const created = await incidentLog.create({
        type: 'access_anomaly',
        title: 'Anomaly Detected',
        description: 'Unusual access pattern',
        severity: 'medium'
      })

      const retrieved = incidentLog.get(created.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(created.id)
      expect(retrieved?.title).toBe('Anomaly Detected')
    })

    it('should return undefined for unknown ID', () => {
      const retrieved = incidentLog.get('INC-NONEXISTENT')

      expect(retrieved).toBeUndefined()
    })
  })

  describe('update', () => {
    it('should update incident fields', async () => {
      const incident = await incidentLog.create({
        type: 'security_event',
        title: 'Original Title',
        description: 'Original description',
        severity: 'low'
      })

      const updated = await incidentLog.update(incident.id, {
        title: 'Updated Title',
        severity: 'high'
      })

      expect(updated?.title).toBe('Updated Title')
      expect(updated?.severity).toBe('high')
      expect(updated?.timeline).toHaveLength(2)
    })

    it('should add timeline entry for updates', async () => {
      const incident = await incidentLog.create({
        type: 'security_event',
        title: 'Test',
        description: 'Test',
        severity: 'low'
      })

      await incidentLog.update(incident.id, {
        rootCause: 'Configuration error'
      })

      const updated = incidentLog.get(incident.id)
      expect(updated?.timeline).toHaveLength(2)
      expect(updated?.timeline[1].action).toBe('updated')
      expect(updated?.timeline[1].description).toContain('root cause')
    })
  })

  describe('transition', () => {
    it('should transition open -> investigating', async () => {
      const incident = await incidentLog.create({
        type: 'security_event',
        title: 'Test',
        description: 'Test',
        severity: 'medium'
      })

      const transitioned = await incidentLog.transition(incident.id, 'investigating')

      expect(transitioned?.status).toBe('investigating')
      expect(transitioned?.timeline).toHaveLength(2)
      expect(transitioned?.timeline[1].action).toBe('status_changed')
    })

    it('should transition investigating -> resolved', async () => {
      const incident = await incidentLog.create({
        type: 'security_event',
        title: 'Test',
        description: 'Test',
        severity: 'medium'
      })

      await incidentLog.transition(incident.id, 'investigating')
      const resolved = await incidentLog.transition(incident.id, 'resolved')

      expect(resolved?.status).toBe('resolved')
      expect(resolved?.resolvedAt).toBeTruthy()
    })

    it('should transition resolved -> closed', async () => {
      const incident = await incidentLog.create({
        type: 'security_event',
        title: 'Test',
        description: 'Test',
        severity: 'low'
      })

      await incidentLog.transition(incident.id, 'resolved')
      const closed = await incidentLog.transition(incident.id, 'closed')

      expect(closed?.status).toBe('closed')
      expect(closed?.closedAt).toBeTruthy()
    })

    it('should allow reopening closed incidents', async () => {
      const incident = await incidentLog.create({
        type: 'security_event',
        title: 'Test',
        description: 'Test',
        severity: 'low'
      })

      await incidentLog.transition(incident.id, 'resolved')
      await incidentLog.transition(incident.id, 'closed')
      const reopened = await incidentLog.transition(incident.id, 'open')

      expect(reopened?.status).toBe('open')
    })

    it('should reject invalid transitions', async () => {
      const incident = await incidentLog.create({
        type: 'security_event',
        title: 'Test',
        description: 'Test',
        severity: 'low'
      })

      // Can't go directly from open to closed? Actually, looking at the code, it allows this
      // Let's test a different invalid transition - resolved -> investigating is valid
      // Actually closed -> investigating is invalid per the validTransitions map
      await incidentLog.transition(incident.id, 'resolved')
      await incidentLog.transition(incident.id, 'closed')
      
      const invalid = await incidentLog.transition(incident.id, 'investigating')
      
      expect(invalid).toBeUndefined()
    })
  })

  describe('query', () => {
    beforeEach(async () => {
      await incidentLog.create({
        type: 'security_event',
        title: 'Security Issue',
        description: 'Critical security issue',
        severity: 'critical'
      })

      const medium = await incidentLog.create({
        type: 'deploy_failure',
        title: 'Deploy Failed',
        description: 'Deploy failed',
        severity: 'high'
      })
      await incidentLog.transition(medium.id, 'resolved')

      await incidentLog.create({
        type: 'access_anomaly',
        title: 'Anomaly',
        description: 'Access anomaly',
        severity: 'medium',
        tags: ['monitoring']
      })
    })

    it('should query by status', () => {
      const open = incidentLog.query({ status: 'open' })

      expect(open).toHaveLength(2)
    })

    it('should query by severity', () => {
      const critical = incidentLog.query({ severity: 'critical' })

      expect(critical).toHaveLength(1)
      expect(critical[0].title).toBe('Security Issue')
    })

    it('should query by type', () => {
      const deploys = incidentLog.query({ type: 'deploy_failure' })

      expect(deploys).toHaveLength(1)
      expect(deploys[0].title).toBe('Deploy Failed')
    })

    it('should search by text', () => {
      const results = incidentLog.query({ search: 'security' })

      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('Security Issue')
    })

    it('should filter by tags', () => {
      const results = incidentLog.query({ tags: ['monitoring'] })

      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('Anomaly')
    })
  })

  describe('getStats', () => {
    it('should calculate statistics correctly', async () => {
      await incidentLog.create({
        type: 'security_event',
        title: 'Open',
        description: 'Open incident',
        severity: 'high'
      })

      const resolved = await incidentLog.create({
        type: 'deploy_failure',
        title: 'Resolved',
        description: 'Resolved incident',
        severity: 'medium'
      })
      await incidentLog.transition(resolved.id, 'resolved')

      const stats = incidentLog.getStats()

      expect(stats.total).toBe(2)
      expect(stats.byStatus.open).toBe(1)
      expect(stats.byStatus.resolved).toBe(1)
      expect(stats.bySeverity.high).toBe(1)
      expect(stats.bySeverity.medium).toBe(1)
      expect(stats.openCount).toBe(1)
    })
  })

  describe('convenience functions', () => {
    it('createSecurityIncident should create security incident', async () => {
      const incident = await createSecurityIncident(
        'Test Security',
        'Security incident description',
        'high',
        ['auth']
      )

      expect(incident.type).toBe('security_event')
      expect(incident.severity).toBe('high')
    })

    it('createKeyExposureIncident should create critical incident', async () => {
      const incident = await createKeyExposureIncident(
        'API',
        'API key exposed in logs'
      )

      expect(incident.type).toBe('key_exposure')
      expect(incident.severity).toBe('critical')
      expect(incident.tags).toContain('key-exposure')
    })

    it('createDeployFailureIncident should create deploy incident', async () => {
      const incident = await createDeployFailureIncident(
        'production',
        'Build failed'
      )

      expect(incident.type).toBe('deploy_failure')
      expect(incident.severity).toBe('high')
      expect(incident.affected).toContain('production')
    })

    it('createAccessAnomalyIncident should create access incident', async () => {
      const incident = await createAccessAnomalyIncident(
        'brute-force',
        'Multiple failed login attempts'
      )

      expect(incident.type).toBe('access_anomaly')
      expect(incident.tags).toContain('access-anomaly')
    })

    it('getOpenIncidentCount should return count', async () => {
      await incidentLog.create({
        type: 'security_event',
        title: 'Open1',
        description: 'Open',
        severity: 'low'
      })

      await incidentLog.create({
        type: 'security_event',
        title: 'Open2',
        description: 'Open',
        severity: 'low'
      })

      const count = getOpenIncidentCount()
      expect(count).toBe(2)
    })

    it('getIncidentStats should return stats', async () => {
      await incidentLog.create({
        type: 'security_event',
        title: 'Test',
        description: 'Test',
        severity: 'low'
      })

      const stats = getIncidentStats()
      expect(stats.total).toBe(1)
    })
  })

  describe('timeline', () => {
    it('should add timeline entries', async () => {
      const incident = await incidentLog.create({
        type: 'security_event',
        title: 'Test',
        description: 'Test',
        severity: 'medium'
      })

      await incidentLog.addTimelineEntry(
        incident.id,
        'investigation',
        'Started investigating the issue'
      )

      const updated = incidentLog.get(incident.id)
      expect(updated?.timeline).toHaveLength(2)
      expect(updated?.timeline[1].action).toBe('investigation')
    })
  })

  describe('export', () => {
    it('should export incidents as JSON', async () => {
      await incidentLog.create({
        type: 'security_event',
        title: 'Test',
        description: 'Test',
        severity: 'low'
      })

      const exported = incidentLog.export()
      const parsed = JSON.parse(exported)

      expect(parsed).toHaveProperty('exportedAt')
      expect(parsed).toHaveProperty('incidents')
      expect(parsed).toHaveProperty('stats')
      expect(parsed.incidents).toHaveLength(1)
    })

    it('should filter by status on export', async () => {
      await incidentLog.create({
        type: 'security_event',
        title: 'Open',
        description: 'Open',
        severity: 'low'
      })

      const resolved = await incidentLog.create({
        type: 'security_event',
        title: 'Resolved',
        description: 'Resolved',
        severity: 'low'
      })
      await incidentLog.transition(resolved.id, 'resolved')

      const exported = incidentLog.export({ status: ['open'] })
      const parsed = JSON.parse(exported)

      expect(parsed.incidents).toHaveLength(1)
      expect(parsed.incidents[0].title).toBe('Open')
    })
  })
})
