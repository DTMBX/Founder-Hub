# B22-P6 — Domain Binding Hooks

## Purpose

Provides a structured domain-request model and verification state machine for
publish targets. This phase establishes the **interface only** — no automated
DNS provisioning is performed.

Future adapters may implement DNS verification, CNAME record checking, or
integration with providers. The current implementation stores requests in memory
and tracks their verification lifecycle.

## Architecture

```
DomainRequestModel.ts  — Request shape, validation, factory
DomainStatus.ts        — Verification state machine (pending → verified|failed)
DomainBinder.ts        — Adapter interface + InMemoryDomainBinder
```

## State Machine

```
┌─────────┐    verify    ┌──────────┐
│ pending  │────────────▶│ verified │
│         │              └──────────┘
│         │    fail       ┌────────┐
│         │────────────▶│ failed  │
└─────────┘              └────────┘
```

Valid transitions:
- `pending → verified`
- `pending → failed`

Invalid transitions (rejected):
- `verified → pending`
- `verified → failed`
- `failed → verified`
- `failed → pending`

## Domain Validation

`isValidDomain()` rejects:
- Domains with protocol prefixes (`http://`, `https://`)
- IP addresses
- Domains with spaces or invalid characters
- Labels exceeding 63 characters
- Total length exceeding 253 characters
- Single-label domains (no TLD)

## Audit Events

All domain operations emit append-only audit events:

| Action            | Trigger                          |
|-------------------|----------------------------------|
| domain_requested  | New domain request created       |
| domain_verified   | Status updated to verified       |
| domain_failed     | Status updated to failed         |
| domain_removed    | Domain request removed           |

## Duplicate Detection

The binder rejects requests for domains already in `pending` or `verified`
state. Domains in `failed` state can be re-requested.

## Fail-Closed Behavior

- Invalid domains produce `{ error: string }` — never silently accepted
- Invalid state transitions return errors
- Nonexistent request IDs return null or false

## Future Work (Not in Scope)

- DNS record verification (TXT, CNAME)
- Certificate provisioning (Let's Encrypt, etc.)
- CDN integration
- Domain transfer workflows
