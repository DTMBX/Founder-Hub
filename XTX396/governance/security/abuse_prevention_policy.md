# Abuse Prevention Policy

> B16-P5 | Governance | Classification: Mandatory

## Purpose

This policy defines the automated abuse detection and prevention
measures enforced across all platform endpoints.

## Controls

### 1. Per-IP Rate Limiting

- Default: 60 requests per minute per IP.
- Exceeding the limit results in request rejection with retry delay.

### 2. Burst Detection

- Burst threshold: 15 requests in 5 seconds.
- Burst violations trigger throttling with exponential backoff.
- Repeated burst violations (3+) trigger automatic soft ban.

### 3. Soft Ban

- Duration: 10 minutes by default.
- Bans are automatically removed after expiration.
- Bans can be manually applied or removed by administrators.
- All ban events are audit-logged.

### 4. Exponential Backoff

- Base delay: 1 second.
- Doubles with each violation.
- Capped at 60 seconds.
- Communicated via `retryAfterMs` in response.

### 5. Search Throttling

- Search queries inherit the per-IP rate limits.
- Heavy search patterns may trigger burst detection.

## Audit

All abuse detection events are logged with:
- `eventId`
- `ip` (source IP)
- `action` (allowed, throttled, blocked, banned)
- `timestamp`
- `detail`

## Enforcement

Abuse protection is enforced at the service layer before any
business logic executes. All checks are fail-closed.

---

*Effective with B16-P5 implementation.*
