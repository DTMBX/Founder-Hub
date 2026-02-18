import { describe, it, expect, beforeEach } from 'vitest'
import { createToken, verifyToken } from '../token'
import { RateLimiter } from '../rate-limit'
import { PreviewService } from '../preview-service'
import { InMemoryStorageAdapter, store as storeStep } from '../../pipeline/store'
import type { PreviewToken } from '../types'
import type { ScaffoldMetadata, HashResult } from '../../pipeline/types'

// ─── Fixtures ────────────────────────────────────────────────

const TEST_SECRET = 'test-hmac-secret-for-preview-tokens'
const SITE_ID = 'site_law-firm_op001_2026'
const OPERATOR_ID = 'op_001'
const BASE_TIME = new Date('2026-02-18T12:00:00Z')

const TEST_METADATA: ScaffoldMetadata = {
  blueprintId: 'law-firm',
  blueprintVersion: '1.0.0',
  presetId: 'default',
  businessName: 'Smith & Associates',
  generatedAt: '2026-02-18T12:00:00Z',
}

const TEST_HASH_RESULT: HashResult = {
  artifacts: [{ path: '/home.html', sha256: 'abc123', size: 500 }],
  manifestHash: 'def456',
}

/** Helper: seed a site into storage. */
async function seedSite(adapter: InMemoryStorageAdapter): Promise<void> {
  await storeStep(SITE_ID, TEST_METADATA, TEST_HASH_RESULT, OPERATOR_ID, adapter)
}

// ─── Token: Create ───────────────────────────────────────────

describe('Token: createToken', () => {
  it('creates a token with correct fields', async () => {
    const token = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, undefined, BASE_TIME)
    expect(token.siteId).toBe(SITE_ID)
    expect(token.operatorId).toBe(OPERATOR_ID)
    expect(token.createdAt).toBe(BASE_TIME.toISOString())
    expect(token.tokenId).toMatch(/^ptk_[0-9a-f]{16}$/)
    expect(token.signature).toMatch(/^[0-9a-f]{64}$/)
  })

  it('sets expiration to 24h by default', async () => {
    const token = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, undefined, BASE_TIME)
    const expires = new Date(token.expiresAt)
    const expected = new Date(BASE_TIME.getTime() + 24 * 60 * 60 * 1000)
    expect(expires.toISOString()).toBe(expected.toISOString())
  })

  it('respects custom TTL', async () => {
    const ttl = 3600_000 // 1 hour
    const token = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, ttl, BASE_TIME)
    const expires = new Date(token.expiresAt)
    const expected = new Date(BASE_TIME.getTime() + ttl)
    expect(expires.toISOString()).toBe(expected.toISOString())
  })

  it('same inputs produce same token (deterministic)', async () => {
    const a = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, undefined, BASE_TIME)
    const b = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, undefined, BASE_TIME)
    expect(a.signature).toBe(b.signature)
    expect(a.tokenId).toBe(b.tokenId)
  })

  it('different secrets produce different signatures', async () => {
    const a = await createToken(SITE_ID, OPERATOR_ID, 'secret-a', undefined, BASE_TIME)
    const b = await createToken(SITE_ID, OPERATOR_ID, 'secret-b', undefined, BASE_TIME)
    expect(a.signature).not.toBe(b.signature)
  })
})

// ─── Token: Verify ───────────────────────────────────────────

describe('Token: verifyToken', () => {
  it('accepts a valid token', async () => {
    const token = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, undefined, BASE_TIME)
    // Verify 1 hour after creation (still within 24h)
    const checkTime = new Date(BASE_TIME.getTime() + 3600_000)
    const result = await verifyToken(token, TEST_SECRET, checkTime)
    expect(result.valid).toBe(true)
    expect(result.payload?.siteId).toBe(SITE_ID)
  })

  it('rejects expired token', async () => {
    const token = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, undefined, BASE_TIME)
    // Verify 25 hours after creation
    const checkTime = new Date(BASE_TIME.getTime() + 25 * 3600_000)
    const result = await verifyToken(token, TEST_SECRET, checkTime)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Token has expired')
  })

  it('rejects tampered signature', async () => {
    const token = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, undefined, BASE_TIME)
    const tampered: PreviewToken = { ...token, signature: 'deadbeef'.repeat(8) }
    const checkTime = new Date(BASE_TIME.getTime() + 60_000)
    const result = await verifyToken(tampered, TEST_SECRET, checkTime)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid token signature')
  })

  it('rejects wrong secret', async () => {
    const token = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, undefined, BASE_TIME)
    const checkTime = new Date(BASE_TIME.getTime() + 60_000)
    const result = await verifyToken(token, 'wrong-secret', checkTime)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid token signature')
  })

  it('rejects token with modified siteId', async () => {
    const token = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, undefined, BASE_TIME)
    const tampered: PreviewToken = { ...token, siteId: 'other-site' }
    const checkTime = new Date(BASE_TIME.getTime() + 60_000)
    const result = await verifyToken(tampered, TEST_SECRET, checkTime)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid token signature')
  })
})

// ─── Rate Limiter ────────────────────────────────────────────

describe('RateLimiter', () => {
  let limiter: RateLimiter

  beforeEach(() => {
    limiter = new RateLimiter({ maxRequests: 3, windowMs: 10_000 })
  })

  it('allows requests within limit', () => {
    const r1 = limiter.check('client-a', 1000)
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = limiter.check('client-a', 2000)
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(1)

    const r3 = limiter.check('client-a', 3000)
    expect(r3.allowed).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it('denies requests exceeding limit', () => {
    limiter.check('client-a', 1000)
    limiter.check('client-a', 2000)
    limiter.check('client-a', 3000)
    const r4 = limiter.check('client-a', 4000)
    expect(r4.allowed).toBe(false)
    expect(r4.remaining).toBe(0)
  })

  it('resets after window expires', () => {
    limiter.check('client-a', 1000)
    limiter.check('client-a', 2000)
    limiter.check('client-a', 3000)
    // 4th request within window — denied
    expect(limiter.check('client-a', 4000).allowed).toBe(false)

    // After window resets (1000 + 10000 = 11000)
    const r = limiter.check('client-a', 12000)
    expect(r.allowed).toBe(true)
    expect(r.remaining).toBe(2)
  })

  it('tracks clients independently', () => {
    limiter.check('client-a', 1000)
    limiter.check('client-a', 2000)
    limiter.check('client-a', 3000)
    expect(limiter.check('client-a', 4000).allowed).toBe(false)

    // Client B still has full quota
    expect(limiter.check('client-b', 4000).allowed).toBe(true)
    expect(limiter.size).toBe(2)
  })

  it('reset clears all entries', () => {
    limiter.check('client-a', 1000)
    limiter.check('client-b', 1000)
    expect(limiter.size).toBe(2)
    limiter.reset()
    expect(limiter.size).toBe(0)
  })

  it('resetsAt is computed correctly', () => {
    const r = limiter.check('client-a', 5000)
    expect(r.resetsAt).toBe(15000) // 5000 + 10000
  })
})

// ─── Preview Service ─────────────────────────────────────────

describe('PreviewService', () => {
  let service: PreviewService
  let adapter: InMemoryStorageAdapter

  beforeEach(async () => {
    service = new PreviewService({
      secret: TEST_SECRET,
      maxRequests: 10,
      windowMs: 60_000,
    })
    adapter = new InMemoryStorageAdapter()
    await seedSite(adapter)
  })

  it('starts a preview session with a valid token', async () => {
    const token = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, undefined, BASE_TIME)
    const checkTime = new Date(BASE_TIME.getTime() + 60_000)
    const result = await service.startPreview(token, adapter, checkTime)

    expect(result.success).toBe(true)
    expect(result.session).toBeDefined()
    expect(result.session!.siteId).toBe(SITE_ID)
    expect(result.session!.tokenId).toBe(token.tokenId)
    expect(result.session!.sessionId).toMatch(/^ps_/)
  })

  it('rejects expired token', async () => {
    const token = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, undefined, BASE_TIME)
    const checkTime = new Date(BASE_TIME.getTime() + 25 * 3600_000)
    const result = await service.startPreview(token, adapter, checkTime)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Token has expired')
  })

  it('rejects when rate limited', async () => {
    const limitedService = new PreviewService({
      secret: TEST_SECRET,
      maxRequests: 2,
      windowMs: 60_000,
    })
    const localAdapter = new InMemoryStorageAdapter()
    await seedSite(localAdapter)

    const token = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, undefined, BASE_TIME)
    const checkTime = new Date(BASE_TIME.getTime() + 60_000)

    // First 2 requests succeed
    await limitedService.startPreview(token, localAdapter, checkTime)
    await limitedService.startPreview(token, localAdapter, checkTime)

    // Third fails
    const r3 = await limitedService.startPreview(token, localAdapter, checkTime)
    expect(r3.success).toBe(false)
    expect(r3.error).toBe('Rate limit exceeded')
  })

  it('rejects when site not found', async () => {
    const emptyAdapter = new InMemoryStorageAdapter()
    const token = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, undefined, BASE_TIME)
    const checkTime = new Date(BASE_TIME.getTime() + 60_000)
    const result = await service.startPreview(token, emptyAdapter, checkTime)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Site not found')
  })

  it('records page views', async () => {
    const token = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, undefined, BASE_TIME)
    const checkTime = new Date(BASE_TIME.getTime() + 60_000)
    const result = await service.startPreview(token, adapter, checkTime)
    const sessionId = result.session!.sessionId

    expect(service.recordPageView(sessionId, 'home')).toBe(true)
    expect(service.recordPageView(sessionId, 'about')).toBe(true)

    const session = service.getSession(sessionId)
    expect(session!.pagesViewed).toEqual(['home', 'about'])
  })

  it('rejects page view for unknown session', () => {
    expect(service.recordPageView('nonexistent', 'home')).toBe(false)
  })

  it('tracks session count', async () => {
    expect(service.sessionCount).toBe(0)
    const token = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, undefined, BASE_TIME)
    const checkTime = new Date(BASE_TIME.getTime() + 60_000)
    await service.startPreview(token, adapter, checkTime)
    expect(service.sessionCount).toBe(1)
    await service.startPreview(token, adapter, checkTime)
    expect(service.sessionCount).toBe(2)
  })
})

// ─── Integration: Token → Rate Limit → Preview ──────────────

describe('Integration: full preview flow', () => {
  it('end-to-end: create token → start preview → view pages', async () => {
    const adapter = new InMemoryStorageAdapter()
    await seedSite(adapter)
    const service = new PreviewService({ secret: TEST_SECRET })

    // Create token
    const token = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, undefined, BASE_TIME)
    expect(token.tokenId).toBeTruthy()

    // Start preview (1 hour after creation)
    const checkTime = new Date(BASE_TIME.getTime() + 3600_000)
    const result = await service.startPreview(token, adapter, checkTime)
    expect(result.success).toBe(true)

    // View pages
    const sid = result.session!.sessionId
    service.recordPageView(sid, 'home')
    service.recordPageView(sid, 'practice-areas')
    service.recordPageView(sid, 'contact')

    const session = service.getSession(sid)
    expect(session!.pagesViewed).toHaveLength(3)
    expect(session!.siteId).toBe(SITE_ID)
  })

  it('end-to-end: expired token blocks everything', async () => {
    const adapter = new InMemoryStorageAdapter()
    await seedSite(adapter)
    const service = new PreviewService({ secret: TEST_SECRET })

    const token = await createToken(SITE_ID, OPERATOR_ID, TEST_SECRET, 1000, BASE_TIME) // 1s TTL
    const checkTime = new Date(BASE_TIME.getTime() + 5000) // 5s later
    const result = await service.startPreview(token, adapter, checkTime)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Token has expired')
    expect(service.sessionCount).toBe(0)
  })
})
