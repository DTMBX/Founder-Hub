/**
 * ops/publish/__tests__/abuse-controls.test.ts
 *
 * Tests for PublishRateLimiter and CircuitBreaker.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  PublishRateLimiter,
  DEFAULT_RATE_CONFIG,
} from '../safety/PublishRateLimiter.js'
import {
  CircuitBreaker,
  DEFAULT_CIRCUIT_CONFIG,
} from '../safety/CircuitBreaker.js'
import type { CircuitState } from '../safety/CircuitBreaker.js'

// ─── PublishRateLimiter ────────────────────────────────────────────

describe('PublishRateLimiter', () => {
  let limiter: PublishRateLimiter
  let now: number

  beforeEach(() => {
    now = 1_000_000
    limiter = new PublishRateLimiter(
      { maxTokens: 3, refillRate: 1, refillIntervalMs: 1000 },
      () => now,
    )
  })

  it('allows requests up to max tokens', () => {
    expect(limiter.consume('t1').allowed).toBe(true)
    expect(limiter.consume('t1').allowed).toBe(true)
    expect(limiter.consume('t1').allowed).toBe(true)
    expect(limiter.consume('t1').allowed).toBe(false)
  })

  it('returns remaining count', () => {
    const r1 = limiter.consume('t1')
    expect(r1.remaining).toBe(2)
    limiter.consume('t1')
    const r3 = limiter.consume('t1')
    expect(r3.remaining).toBe(0)
  })

  it('returns retryAfterMs when denied', () => {
    limiter.consume('t1')
    limiter.consume('t1')
    limiter.consume('t1')
    const denied = limiter.consume('t1')
    expect(denied.allowed).toBe(false)
    expect(denied.retryAfterMs).toBeTypeOf('number')
    expect(denied.retryAfterMs!).toBeGreaterThanOrEqual(0)
  })

  it('refills tokens after interval', () => {
    limiter.consume('t1') // 3→2
    limiter.consume('t1') // 2→1
    limiter.consume('t1') // 1→0
    expect(limiter.consume('t1').allowed).toBe(false)

    now += 1000 // one refill interval
    expect(limiter.consume('t1').allowed).toBe(true)
    expect(limiter.consume('t1').allowed).toBe(false)
  })

  it('caps refill at maxTokens', () => {
    limiter.consume('t1') // 3→2
    now += 10_000 // 10 intervals, but cap at 3
    expect(limiter.peek('t1')).toBe(3)
  })

  it('isolates keys', () => {
    limiter.consume('t1')
    limiter.consume('t1')
    limiter.consume('t1')
    expect(limiter.consume('t1').allowed).toBe(false)
    expect(limiter.consume('t2').allowed).toBe(true) // separate bucket
  })

  it('peek does not consume', () => {
    expect(limiter.peek('t1')).toBe(3)
    expect(limiter.peek('t1')).toBe(3)
    limiter.consume('t1')
    expect(limiter.peek('t1')).toBe(2)
  })

  it('peek returns maxTokens for unknown key', () => {
    expect(limiter.peek('unknown')).toBe(3)
  })

  it('reset clears a single key', () => {
    limiter.consume('t1')
    limiter.consume('t1')
    limiter.consume('t1')
    limiter.reset('t1')
    expect(limiter.consume('t1').allowed).toBe(true)
  })

  it('resetAll clears all keys', () => {
    limiter.consume('t1')
    limiter.consume('t2')
    limiter.resetAll()
    expect(limiter.bucketCount).toBe(0)
  })

  it('denies empty key', () => {
    expect(limiter.consume('').allowed).toBe(false)
  })

  it('exposes default config', () => {
    expect(DEFAULT_RATE_CONFIG.maxTokens).toBe(5)
    expect(DEFAULT_RATE_CONFIG.refillRate).toBe(1)
    expect(DEFAULT_RATE_CONFIG.refillIntervalMs).toBe(60_000)
  })
})

// ─── CircuitBreaker ────────────────────────────────────────────────

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker
  let now: number

  beforeEach(() => {
    now = 1_000_000
    breaker = new CircuitBreaker(
      { failureThreshold: 2, resetTimeoutMs: 5000, halfOpenSuccessThreshold: 1 },
      () => now,
    )
  })

  it('starts in closed state', () => {
    expect(breaker.state).toBe('closed')
    expect(breaker.isAllowed).toBe(true)
  })

  it('stays closed below failure threshold', () => {
    breaker.recordFailure()
    expect(breaker.state).toBe('closed')
    expect(breaker.failureCount).toBe(1)
  })

  it('opens after reaching failure threshold', () => {
    breaker.recordFailure()
    breaker.recordFailure()
    expect(breaker.state).toBe('open')
    expect(breaker.isAllowed).toBe(false)
  })

  it('transitions to half-open after timeout', () => {
    breaker.recordFailure()
    breaker.recordFailure()
    expect(breaker.state).toBe('open')

    now += 5000
    expect(breaker.state).toBe('half-open')
    expect(breaker.isAllowed).toBe(true)
  })

  it('closes from half-open on success', () => {
    breaker.recordFailure()
    breaker.recordFailure()
    now += 5000 // move to half-open
    expect(breaker.state).toBe('half-open')

    breaker.recordSuccess()
    expect(breaker.state).toBe('closed')
    expect(breaker.failureCount).toBe(0)
  })

  it('re-opens from half-open on failure', () => {
    breaker.recordFailure()
    breaker.recordFailure()
    now += 5000
    expect(breaker.state).toBe('half-open')

    breaker.recordFailure()
    expect(breaker.state).toBe('open')
  })

  it('resets failure count on success in closed state', () => {
    breaker.recordFailure()
    expect(breaker.failureCount).toBe(1)
    breaker.recordSuccess()
    expect(breaker.failureCount).toBe(0)
  })

  it('forceClose resets to closed', () => {
    breaker.recordFailure()
    breaker.recordFailure()
    expect(breaker.state).toBe('open')
    breaker.forceClose()
    expect(breaker.state).toBe('closed')
    expect(breaker.failureCount).toBe(0)
  })

  it('forceOpen blocks requests', () => {
    expect(breaker.state).toBe('closed')
    breaker.forceOpen()
    expect(breaker.state).toBe('open')
    expect(breaker.isAllowed).toBe(false)
  })

  it('records state transition events', () => {
    breaker.recordFailure()
    breaker.recordFailure() // → open
    now += 5000             // → half-open
    breaker.state           // trigger evaluation
    breaker.recordSuccess() // → closed

    const events = breaker.getEvents()
    expect(events.length).toBeGreaterThanOrEqual(3)
    expect(events[0].from).toBe('closed')
    expect(events[0].to).toBe('open')
  })

  it('events are append-only (returned copy)', () => {
    breaker.forceOpen()
    const events = breaker.getEvents()
    ;(events as { from: CircuitState }[]).length = 0
    expect(breaker.getEvents()).toHaveLength(1)
  })

  it('no duplicate event for same-state transition', () => {
    breaker.forceOpen()
    breaker.forceOpen() // same state, no new event
    expect(breaker.eventCount).toBe(1)
  })

  it('exposes default config', () => {
    expect(DEFAULT_CIRCUIT_CONFIG.failureThreshold).toBe(3)
    expect(DEFAULT_CIRCUIT_CONFIG.resetTimeoutMs).toBe(60_000)
    expect(DEFAULT_CIRCUIT_CONFIG.halfOpenSuccessThreshold).toBe(1)
  })

  it('half-open requires configured number of successes', () => {
    const b = new CircuitBreaker(
      { failureThreshold: 1, resetTimeoutMs: 100, halfOpenSuccessThreshold: 3 },
      () => now,
    )
    b.recordFailure() // → open
    now += 100        // → half-open
    b.recordSuccess()
    expect(b.state).toBe('half-open') // still half-open, need 3
    b.recordSuccess()
    expect(b.state).toBe('half-open')
    b.recordSuccess()
    expect(b.state).toBe('closed')
  })
})
