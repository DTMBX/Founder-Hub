/**
 * ops/publish/safety/CircuitBreaker.ts
 *
 * Simple circuit breaker for publish operations.
 * States: closed (normal), open (blocking), half-open (testing).
 * Fail-closed: unknown state → open.
 */

/** Circuit breaker states. */
export type CircuitState = 'closed' | 'open' | 'half-open'

/** Circuit breaker configuration. */
export interface CircuitBreakerConfig {
  /** Number of consecutive failures to trip open. */
  readonly failureThreshold: number
  /** Time in ms before attempting half-open probe. */
  readonly resetTimeoutMs: number
  /** Number of successes in half-open to close. */
  readonly halfOpenSuccessThreshold: number
}

/** Default: trip after 3 failures, 60s reset, 1 half-open success to close. */
export const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  resetTimeoutMs: 60_000,
  halfOpenSuccessThreshold: 1,
}

/** Circuit breaker audit event. */
export interface CircuitEvent {
  readonly timestamp: string
  readonly from: CircuitState
  readonly to: CircuitState
  readonly reason: string
}

/**
 * Circuit breaker for a single publish target.
 */
export class CircuitBreaker {
  private readonly _config: CircuitBreakerConfig
  private _state: CircuitState = 'closed'
  private _failureCount = 0
  private _successCount = 0
  private _lastFailureTime = 0
  private readonly _events: CircuitEvent[] = []
  private _now: () => number

  constructor(config: Partial<CircuitBreakerConfig> = {}, nowFn?: () => number) {
    this._config = { ...DEFAULT_CIRCUIT_CONFIG, ...config }
    this._now = nowFn ?? (() => Date.now())
  }

  /** Current state. */
  get state(): CircuitState {
    this._evaluateTimeout()
    return this._state
  }

  /** Whether requests should be allowed through. */
  get isAllowed(): boolean {
    this._evaluateTimeout()
    return this._state !== 'open'
  }

  get failureCount(): number { return this._failureCount }
  get successCount(): number { return this._successCount }

  /**
   * Record a successful operation.
   */
  recordSuccess(): void {
    this._evaluateTimeout()
    if (this._state === 'half-open') {
      this._successCount += 1
      if (this._successCount >= this._config.halfOpenSuccessThreshold) {
        this._transition('closed', 'Half-open success threshold reached')
        this._failureCount = 0
        this._successCount = 0
      }
    } else if (this._state === 'closed') {
      this._failureCount = 0
    }
  }

  /**
   * Record a failed operation.
   */
  recordFailure(): void {
    this._evaluateTimeout()
    this._lastFailureTime = this._now()

    if (this._state === 'half-open') {
      this._transition('open', 'Failure during half-open probe')
      this._successCount = 0
    } else if (this._state === 'closed') {
      this._failureCount += 1
      if (this._failureCount >= this._config.failureThreshold) {
        this._transition('open', `Failure threshold reached (${this._failureCount})`)
      }
    }
  }

  /**
   * Manually reset to closed. For admin override.
   */
  forceClose(): void {
    this._transition('closed', 'Manual force-close')
    this._failureCount = 0
    this._successCount = 0
  }

  /**
   * Manually open the circuit. For emergency shutoff.
   */
  forceOpen(): void {
    this._transition('open', 'Manual force-open')
  }

  /**
   * Get circuit event history.
   */
  getEvents(): readonly CircuitEvent[] {
    return [...this._events]
  }

  get eventCount(): number {
    return this._events.length
  }

  /** Override time function (for testing). */
  setNow(fn: () => number): void {
    this._now = fn
  }

  private _evaluateTimeout(): void {
    if (this._state === 'open' && this._lastFailureTime > 0) {
      const elapsed = this._now() - this._lastFailureTime
      if (elapsed >= this._config.resetTimeoutMs) {
        this._transition('half-open', 'Reset timeout elapsed')
        this._successCount = 0
      }
    }
  }

  private _transition(to: CircuitState, reason: string): void {
    if (this._state === to) return
    this._events.push({
      timestamp: new Date(this._now()).toISOString(),
      from: this._state,
      to,
      reason,
    })
    this._state = to
  }
}
