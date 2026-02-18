# Visitor Preview Panel — B21-P5

> Defines the preview share system: HMAC tokens, rate limiting, and session management.

---

## Overview

The Visitor Preview Panel allows operators to generate secure, time-limited
share links for site previews. Visitors access previews using signed tokens.
The system enforces rate limits and tracks page views per session.

## Architecture

```
createToken() → PreviewToken (signed, time-bounded)
     ↓
verifyToken() → TokenValidationResult
     ↓
PreviewService.startPreview() → [verify token → rate limit → check site → create session]
     ↓
PreviewService.recordPageView() → append page slug to session
```

## Security Model

### Token signing (HMAC-SHA256)

- Tokens are signed with a server-side secret using HMAC-SHA256.
- The canonical payload format is: `siteId|operatorId|createdAt|expiresAt`.
- Constant-time comparison prevents timing attacks.
- Tokens are bound to a specific site and operator.

### Token expiration

- Default TTL: 24 hours.
- Expired tokens are rejected before any other processing.
- Custom TTL supported (minimum: 1 second).

### Rate limiting

- Fixed-window rate limiter per client key (token ID).
- Default: 60 requests per 60-second window.
- Configurable per service instance.
- Independent tracking per client.

## Files

| File | Purpose |
|------|---------|
| `apps/sitegen/preview/types.ts` | Preview type definitions |
| `apps/sitegen/preview/token.ts` | HMAC token create/verify |
| `apps/sitegen/preview/rate-limit.ts` | Fixed-window rate limiter |
| `apps/sitegen/preview/preview-service.ts` | Preview orchestrator |
| `apps/sitegen/preview/__tests__/preview.test.ts` | Tests |

## Flow

1. Operator creates a token: `createToken(siteId, operatorId, secret)`
2. Token is embedded in a share URL (out of scope for P5).
3. Visitor hits preview endpoint with token.
4. Service verifies token signature and expiration.
5. Service checks rate limit for the token ID.
6. Service verifies the site exists in storage.
7. Service creates a session and returns it.
8. Page views are recorded as the visitor navigates.

## Invariants

1. Expired tokens are always rejected.
2. Tampered tokens (wrong signature) are always rejected.
3. Rate-limited clients are blocked before session creation.
4. Missing sites are rejected (fail-closed).
5. Sessions are append-only (page views only grow).
6. Same inputs to `createToken` always produce the same token (deterministic).
7. Token ID is derived from the payload (not random).
