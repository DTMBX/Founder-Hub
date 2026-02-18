# B22-P7 — Abuse Controls and Rate Limits

## Purpose

Prevent operational abuse of the publish pipeline through deterministic,
fail-closed safety controls. No external dependencies.

## Components

### PublishRateLimiter (Token Bucket)

Located at `ops/publish/safety/PublishRateLimiter.ts`.

Token-bucket rate limiter keyed by arbitrary string (tenantId, actorId, etc.).

**Defaults:**
- Max tokens (burst): 5
- Refill rate: 1 token per interval
- Refill interval: 60 seconds

**API:**
- `consume(key)` — check and consume a token; returns `{ allowed, remaining, retryAfterMs }`
- `peek(key)` — check remaining without consuming
- `reset(key)` — clear a single key
- `resetAll()` — clear all buckets

**Fail-closed behavior:**
- Empty key → denied
- No bucket → creates fresh bucket at max capacity
- Insufficient tokens → denied with `retryAfterMs`

### CircuitBreaker

Located at `ops/publish/safety/CircuitBreaker.ts`.

Three-state circuit breaker per publish target.

```
closed ──[threshold failures]──▶ open ──[timeout]──▶ half-open ──▶ closed
                                  ▲                       │
                                  └──[failure in probe]───┘
```

**Defaults:**
- Failure threshold: 3
- Reset timeout: 60 seconds
- Half-open success threshold: 1

**API:**
- `state` — current state (evaluates timeout lazily)
- `isAllowed` — whether requests should proceed
- `recordSuccess()` / `recordFailure()` — update state
- `forceClose()` / `forceOpen()` — admin overrides
- `getEvents()` — state transition audit log

**Fail-closed behavior:**
- `open` state blocks all requests
- Failure during half-open → back to open
- Unknown state → treated as open

## Integration Points

These controls sit between the `TargetRegistry` preflight chain and individual
target `publish()` calls. When integrated:

1. Rate limiter checks before preflight passes
2. Circuit breaker checked before publish execution
3. Circuit breaker updated on success/failure

## Testing

All time-dependent behavior is injectable via `nowFn` constructor parameter
and `setNow()` method. No `setTimeout` or real clock dependency.

## Design Decisions

- **No persistence:** State is in-memory only. Restarts reset all state.
- **No distributed lock:** Single-process model. Future work may add Redis-backed
  state for multi-instance coordination.
- **Deterministic:** No randomness, no jitter. Reproducible state transitions.
