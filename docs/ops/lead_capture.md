# Lead Capture System — B11-03

## Overview

The lead capture system provides a structured pipeline for collecting, validating,
and managing prospective client leads. It supports both in-memory and file-based
storage, with pluggable repository implementations.

## Architecture

```
ops/automation/leads/
├── LeadModel.ts      # Lead type, validation, In-Memory + JSON-file repos
├── lead-api.ts       # Framework-agnostic request handler
├── rate-limit.ts     # Per-client rate limiting
└── index.ts          # Barrel export
```

## Lead Fields

| Field              | Type      | Required | Notes                                |
| ------------------ | --------- | -------- | ------------------------------------ |
| name               | string    | Yes      | Contact full name                    |
| email              | string    | *        | At least one of email/phone required |
| phone              | string    | *        | At least one of email/phone required |
| source             | LeadSource| Yes      | website, referral, organic, paid, manual, api |
| message            | string    | No       | Free-form intake message             |
| tags               | string[]  | No       | Categorization labels                |
| consentFollowUp    | boolean   | No       | Explicit opt-in for follow-up        |
| consentDataStorage | boolean   | Yes      | Must be true to create the lead      |
| notes              | string    | No       | Operator notes                       |

## API Routes

All routes are handled by `handleLeadRequest()`:

| Method | Path          | Description              |
| ------ | ------------- | ------------------------ |
| POST   | /leads        | Create a new lead        |
| GET    | /leads        | List leads (?status=&source=) |
| GET    | /leads/:id    | Get lead by ID           |
| PATCH  | /leads/:id    | Update lead fields       |
| DELETE | /leads/:id    | Delete a lead            |

## Rate Limiting

- Default: 10 requests per 60 seconds per client identifier.
- Applied to POST requests only.
- Returns HTTP 429 with `Retry-After` header when exceeded.
- Configurable via `RateLimitConfig`.

## Audit Integration

Every create, update, status change, and delete emits an event to the
`OpsAuditLogger`:

- `lead.created` — new lead added
- `lead.updated` — lead fields modified
- `lead.status_changed` — lead moved through pipeline
- `lead.deleted` — lead removed (logged as severity: warn)

## Consent

- `consentDataStorage` is **required** to create a lead. Without it, validation
  fails and the lead is rejected.
- `consentFollowUp` governs whether automated follow-up sequences may target the
  lead. The follow-up engine (B11-05) must check this flag before scheduling
  any outbound communication.

## Embeddable Snippet

To capture leads from an external page:

```html
<form id="lead-capture" method="POST" action="/api/leads">
  <input name="name" required placeholder="Full Name" />
  <input name="email" type="email" placeholder="Email" />
  <input name="phone" type="tel" placeholder="Phone" />
  <textarea name="message" placeholder="How can we help?"></textarea>
  <label>
    <input name="consentDataStorage" type="checkbox" required />
    I consent to data storage
  </label>
  <label>
    <input name="consentFollowUp" type="checkbox" />
    I consent to follow-up communications
  </label>
  <input type="hidden" name="source" value="website" />
  <button type="submit">Submit</button>
</form>
```

Adapt the form action URL to match the deployment endpoint.

## Repository Implementations

1. **InMemoryLeadRepository** — default, suitable for development and testing.
2. **JsonFileLeadRepository** — persists leads to a JSON file on disk.

Swap implementations via `setLeadRepository()`.
