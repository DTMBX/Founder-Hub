# OpenAPI Integration — B21-P7

> Safe adapter model for external API access with allowlist, rate limiting, and
> audit logging.

---

## Overview

The OpenAPI integration layer provides a governed, auditable way to interact
with external APIs. All requests go through a single client that enforces:

1. **Allowlist** — Only registered endpoints can be called.
2. **Method restrictions** — Each endpoint declares allowed HTTP methods.
3. **Rate limiting** — Per-endpoint, fixed-window rate limits.
4. **HTTPS only** — All endpoints must use HTTPS.
5. **Adapter pattern** — Default is a mock adapter (safe mode).
6. **Audit logging** — Every request (allowed or denied) is logged.

## Architecture

```
OpenApiClient
├── Allowlist check (registry.json)
├── Status check (active/deprecated/disabled)
├── Method check
├── Rate limit check
├── Adapter execution (MockAdapter or production)
└── Audit log (append-only)
```

## Files

| File | Purpose |
|------|---------|
| `ops/integrations/openapi/OpenApiRegistry.schema.json` | JSON Schema for the registry |
| `ops/integrations/openapi/registry.json` | Allowlisted endpoints |
| `ops/integrations/openapi/MockAdapter.ts` | Mock adapter (default, safe) |
| `ops/integrations/openapi/OpenApiClient.ts` | Client wrapper with enforcement |
| `ops/integrations/openapi/__tests__/openapi.test.ts` | Tests |

## Registered Endpoints

| ID | Name | Auth | Methods |
|----|------|------|---------|
| court-listener | CourtListener RECAP | API Key | GET |
| case-law-access | Case Law Access Project | API Key | GET |
| usa-spending | USASpending.gov | None | GET, POST |
| federal-register | Federal Register | None | GET |
| sec-edgar | SEC EDGAR | None | GET |

## Security Model

- **No secrets in config.** Auth tokens are referenced by environment variable names, never stored directly.
- **HTTPS only.** The schema enforces `^https://` for all baseUrls.
- **Fail-closed.** Unknown endpoints, disallowed methods, and rate-exceeded requests throw `OpenApiError`.
- **Mock default.** The default adapter makes no real network calls.
- **Audit trail.** Every request is logged with timestamp, endpoint, method, status, and whether it was allowed.

## Invariants

1. Only allowlisted endpoints can be called.
2. Only declared methods per endpoint are accepted.
3. Rate limits are enforced per-endpoint.
4. All baseUrls use HTTPS.
5. Mock adapter is the default (no real network calls unless explicitly configured).
6. All requests are audited (allowed and denied).
7. No secrets stored in registry files.
