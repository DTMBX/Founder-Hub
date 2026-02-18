import { describe, it, expect, beforeEach } from 'vitest'
import registryData from '../registry.json'
import schema from '../OpenApiRegistry.schema.json'
import { MockOpenApiAdapter } from '../MockAdapter'
import { OpenApiClient, OpenApiError } from '../OpenApiClient'

// ─── Registry Schema & Data ─────────────────────────────────

describe('OpenAPI: registry schema', () => {
  it('schema has required top-level fields', () => {
    expect(schema.$schema).toBeTruthy()
    expect(schema.$id).toBe('openapi-registry.schema.json')
    expect(schema.properties).toHaveProperty('endpoints')
    expect(schema.$defs).toHaveProperty('Endpoint')
    expect(schema.$defs).toHaveProperty('AuthConfig')
    expect(schema.$defs).toHaveProperty('RateLimitConfig')
  })

  it('Endpoint def requires HTTPS baseUrl', () => {
    const baseUrlProp = schema.$defs.Endpoint.properties.baseUrl
    expect(baseUrlProp.pattern).toBe('^https://')
  })

  it('Endpoint def restricts HTTP methods', () => {
    const methodItems = schema.$defs.Endpoint.properties.methods.items
    expect(methodItems.enum).toContain('GET')
    expect(methodItems.enum).toContain('POST')
    expect(methodItems.enum).not.toContain('OPTIONS')
  })
})

describe('OpenAPI: registry data', () => {
  const endpoints = registryData.endpoints

  it('has at least one endpoint', () => {
    expect(endpoints.length).toBeGreaterThan(0)
  })

  it('all endpoints have unique IDs', () => {
    const ids = endpoints.map((e: { id: string }) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all endpoints use HTTPS', () => {
    for (const ep of endpoints) {
      expect(ep.baseUrl).toMatch(/^https:\/\//)
    }
  })

  it('all endpoints have at least one method', () => {
    for (const ep of endpoints) {
      expect(ep.methods.length).toBeGreaterThan(0)
    }
  })

  it('all endpoints have rate limits', () => {
    for (const ep of endpoints) {
      expect(ep.rateLimit.maxRequests).toBeGreaterThan(0)
      expect(ep.rateLimit.windowMs).toBeGreaterThanOrEqual(1000)
    }
  })

  it('all endpoints have a valid status', () => {
    const validStatuses = ['active', 'deprecated', 'disabled']
    for (const ep of endpoints) {
      expect(validStatuses).toContain(ep.status)
    }
  })

  it('contains expected government/legal endpoints', () => {
    const ids = endpoints.map((e: { id: string }) => e.id)
    expect(ids).toContain('court-listener')
    expect(ids).toContain('federal-register')
    expect(ids).toContain('sec-edgar')
  })
})

// ─── Mock Adapter ────────────────────────────────────────────

describe('OpenAPI: MockOpenApiAdapter', () => {
  let adapter: MockOpenApiAdapter

  beforeEach(() => {
    adapter = new MockOpenApiAdapter()
  })

  it('returns default mock response', async () => {
    const res = await adapter.execute({
      endpointId: 'test',
      path: '/search',
      method: 'GET',
    })
    expect(res.ok).toBe(true)
    expect(res.meta.mock).toBe(true)
    expect(res.headers['x-mock']).toBe('true')
  })

  it('returns registered response when available', async () => {
    adapter.registerResponse('test', '/search', { results: [{ id: 1 }] })
    const res = await adapter.execute<{ results: { id: number }[] }>({
      endpointId: 'test',
      path: '/search',
      method: 'GET',
    })
    expect(res.data.results).toHaveLength(1)
    expect(res.data.results[0].id).toBe(1)
  })

  it('clear removes all responses', () => {
    adapter.registerResponse('a', '/b', {})
    expect(adapter.registeredCount).toBe(1)
    adapter.clear()
    expect(adapter.registeredCount).toBe(0)
  })

  it('adapter ID is deterministic', () => {
    expect(adapter.adapterId).toBe('mock-openapi-v1')
  })
})

// ─── OpenAPI Client ──────────────────────────────────────────

describe('OpenAPI: OpenApiClient', () => {
  let client: OpenApiClient
  let adapter: MockOpenApiAdapter

  beforeEach(() => {
    adapter = new MockOpenApiAdapter()
    client = new OpenApiClient(adapter)
  })

  it('lists allowlisted endpoints', () => {
    const ids = client.listEndpoints()
    expect(ids.length).toBeGreaterThan(0)
    expect(ids).toContain('court-listener')
    expect(ids).toContain('usa-spending')
  })

  it('retrieves endpoint definition', () => {
    const ep = client.getEndpoint('court-listener')
    expect(ep).toBeDefined()
    expect(ep!.name).toBe('CourtListener RECAP')
    expect(ep!.baseUrl).toMatch(/^https:\/\//)
  })

  it('returns undefined for unknown endpoint', () => {
    expect(client.getEndpoint('nonexistent')).toBeUndefined()
  })

  it('executes request to allowlisted endpoint', async () => {
    const res = await client.request('court-listener', '/search/')
    expect(res.ok).toBe(true)
    expect(res.meta.mock).toBe(true)
    expect(res.meta.endpointId).toBe('court-listener')
  })

  it('rejects non-allowlisted endpoint', async () => {
    await expect(
      client.request('evil-api', '/hack'),
    ).rejects.toThrow(OpenApiError)
    await expect(
      client.request('evil-api', '/hack'),
    ).rejects.toThrow('not in the allowlist')
  })

  it('rejects disallowed HTTP method', async () => {
    // court-listener only allows GET
    await expect(
      client.request('court-listener', '/search/', 'DELETE'),
    ).rejects.toThrow('not allowed')
  })

  it('enforces rate limits', async () => {
    // SEC EDGAR allows 10 per 1000ms
    const ep = client.getEndpoint('sec-edgar')!
    expect(ep.rateLimit.maxRequests).toBe(10)

    // Make 10 requests (should all succeed)
    for (let i = 0; i < 10; i++) {
      await client.request('sec-edgar', '/search')
    }

    // 11th should fail
    await expect(
      client.request('sec-edgar', '/search'),
    ).rejects.toThrow('Rate limit exceeded')
  })

  it('logs all requests in audit log', async () => {
    await client.request('court-listener', '/search/')
    try {
      await client.request('evil-api', '/hack')
    } catch {
      // expected
    }

    const log = client.getAuditLog()
    expect(log.length).toBe(2)
    expect(log[0].allowed).toBe(true)
    expect(log[1].allowed).toBe(false)
    expect(log[1].error).toContain('not in allowlist')
  })

  it('audit entries have timestamps', async () => {
    await client.request('court-listener', '/search/')
    const entry = client.getAuditLog()[0]
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}/)
  })
})

// ─── Allowlist Invariants ────────────────────────────────────

describe('OpenAPI: allowlist invariants', () => {
  it('no endpoint allows all methods', () => {
    const allMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    for (const ep of registryData.endpoints) {
      expect(ep.methods.length).toBeLessThan(allMethods.length)
    }
  })

  it('all baseUrls are HTTPS', () => {
    for (const ep of registryData.endpoints) {
      expect(ep.baseUrl.startsWith('https://')).toBe(true)
    }
  })

  it('no secrets stored in registry', () => {
    const raw = JSON.stringify(registryData)
    // Should not contain actual tokens/keys, only env var references
    expect(raw).not.toMatch(/sk-[a-zA-Z0-9]{20,}/)
    expect(raw).not.toMatch(/Bearer [a-zA-Z0-9]{20,}/)
  })
})
