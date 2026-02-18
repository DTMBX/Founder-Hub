# Preview Panel Technical Specification

> Architecture Planning — Session C  
> Status: PLANNING ONLY — no implementation  
> Date: 2026-02-18

---

## 1. Architecture Decision: Hybrid Rendering (Option 3)

Three options were evaluated:

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| 1. Client-only | Generate HTML entirely in the browser | Zero server cost, instant | Large bundle, no caching, abuse-prone |
| 2. Server-only | Edge function generates + serves HTML | Cacheable, auditable | Latency, compute cost, cold starts |
| **3. Hybrid** | **Client collects input → Edge generates → Client renders iframe** | **Balance of speed, security, cacheability** | Moderate complexity |

**Decision: Option 3 (Hybrid)**

Rationale:
- Generation logic runs on the edge (Cloudflare Worker), not in the
  visitor's browser — prevents template source leakage
- Generated HTML is signed and cached by session token — reduces
  repeated compute
- The client only renders a sandboxed iframe — minimal attack surface
- Audit events are logged server-side — not dependent on client
  cooperation

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  VISITOR BROWSER                                            │
│                                                             │
│  ┌──────────────────────┐   ┌─────────────────────────────┐ │
│  │  Preview Form (React)│   │  Preview Frame (iframe)     │ │
│  │                      │──▶│  sandbox="allow-scripts     │ │
│  │  Collects input      │   │    allow-same-origin"       │ │
│  │  Validates locally   │   │                             │ │
│  │  Sends to API        │   │  Loads signed preview URL   │ │
│  └──────────┬───────────┘   └─────────────────────────────┘ │
│             │                                               │
└─────────────┼───────────────────────────────────────────────┘
              │ POST /api/preview/generate
              ▼
┌─────────────────────────────────────────────────────────────┐
│  EDGE WORKER (Cloudflare Worker)                            │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐   │
│  │ Validate │→ │ Scaffold │→ │ Render   │→ │ Watermark │   │
│  │ Input    │  │ Site     │  │ HTML/CSS │  │ + Hash    │   │
│  └──────────┘  └──────────┘  └──────────┘  └─────┬─────┘   │
│                                                   │         │
│  ┌──────────┐  ┌──────────────────────────────────┘         │
│  │ Audit    │← │ Store in KV with TTL                       │
│  │ Log      │  │                                            │
│  └──────────┘  └────────────────────────────────────────┐   │
│                                                         │   │
│  Returns: { sessionToken, previewUrl, expiresAt }       │   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  KV STORE (Cloudflare KV)                                   │
│                                                             │
│  Key: preview:{sessionToken}:index.html                     │
│  Key: preview:{sessionToken}:about/index.html               │
│  Key: preview:{sessionToken}:assets/css/tokens.css          │
│  Key: preview:{sessionToken}:manifest.json                  │
│  ...                                                        │
│  TTL: 86400 seconds (24 hours)                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Data Models

### 3.1 PreviewRequest

```typescript
interface PreviewRequest {
  siteType: "law-firm" | "small-business" | "agency";
  businessType: BusinessType;
  businessName: string;        // 2–80 chars, sanitized
  tagline?: string;            // 0–120 chars, sanitized
  presetId: string;            // must exist in preset registry
  primaryColor?: string;       // hex, WCAG AA validated
  accentColor?: string;        // hex, WCAG AA validated
  captchaToken: string;        // Turnstile or proof-of-work
}
```

**Max payload size:** 2 KB
**Content-Type:** `application/json`

### 3.2 PreviewSession

```typescript
interface PreviewSession {
  sessionToken: string;        // HMAC-SHA256 signed token
  siteId: string;              // generated site identifier
  createdAt: string;           // ISO-8601
  expiresAt: string;           // ISO-8601 (createdAt + 24h)
  inputHash: string;           // SHA-256 of serialized request
  fileCount: number;
  totalSizeBytes: number;
  watermarked: true;           // always true for previews
  viewCount: number;           // incremented on each load
  maxViews: 500;               // hard cap per session
  sourceIp: string;            // hashed IP for rate limiting
}
```

### 3.3 PreviewArtifact

```typescript
interface PreviewArtifact {
  path: string;                // e.g., "index.html"
  contentType: string;         // e.g., "text/html"
  content: string;             // file content (text) or base64 (binary)
  hash: string;                // SHA-256
  sizeBytes: number;
}
```

### 3.4 PreviewResponse (API → Client)

```typescript
interface PreviewResponse {
  sessionToken: string;
  previewUrl: string;          // base URL for iframe
  pages: Array<{ route: string; title: string }>;
  expiresAt: string;           // ISO-8601
  shareUrl: string;            // public share link
}
```

### 3.5 PreviewError

```typescript
interface PreviewError {
  code: "VALIDATION_FAILED" | "RATE_LIMITED" | "GENERATION_FAILED" | "CAPTCHA_INVALID";
  message: string;             // human-readable
  retryAfter?: number;         // seconds (for rate limiting)
  fields?: Record<string, string>; // per-field errors
}
```

---

## 4. API Endpoints

### 4.1 Generate Preview

```
POST /api/preview/generate
Content-Type: application/json
Body: PreviewRequest

Response 200: PreviewResponse
Response 400: PreviewError (validation)
Response 429: PreviewError (rate limited)
Response 500: PreviewError (generation failed)
```

### 4.2 Serve Preview Page

```
GET /api/preview/{sessionToken}/{path?}
Accept: text/html

Response 200: HTML content (with watermark, CSP headers)
Response 404: Preview not found or expired
Response 410: Preview expired (with redirect to /preview)

Headers:
  Content-Security-Policy: default-src 'self'; style-src 'unsafe-inline'; script-src 'none'; frame-ancestors 'self' *.xtx396.com
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Cache-Control: private, max-age=3600
  X-Evident-Demo: true
```

### 4.3 Request Follow-Up

```
POST /api/preview/{sessionToken}/follow-up
Content-Type: application/json
Body: { email: string, phone?: string, notes?: string }

Response 201: { message: "Follow-up request received" }
Response 400: Validation error
Response 429: Rate limited (3 per email per 24h)
```

### 4.4 Share Link Resolution

```
GET /preview/{sessionToken}

→ Renders the preview page inline (not API, full page)
→ If expired: redirect to /preview with notice
```

---

## 5. Storage Strategy

### 5.1 KV Schema

```
preview:{token}:manifest       → PreviewSession JSON       (TTL: 24h)
preview:{token}:files:index    → HTML content              (TTL: 24h)
preview:{token}:files:about    → HTML content              (TTL: 24h)
preview:{token}:files:services → HTML content              (TTL: 24h)
preview:{token}:files:contact  → HTML content              (TTL: 24h)
preview:{token}:files:css      → CSS content               (TTL: 24h)
preview:{token}:audit          → Audit log JSON            (TTL: 72h)
```

### 5.2 TTL Policy

| Data | TTL | Rationale |
|------|-----|-----------|
| Preview files | 24 hours | Sufficient for evaluation, limits storage growth |
| Preview manifest | 24 hours | Matches file TTL |
| Audit log | 72 hours | Retained longer for abuse investigation |
| Rate limit counters | 1 hour | Rolling window |
| Follow-up leads | Indefinite | Business value, stored in leads system |

### 5.3 Storage Limits

| Metric | Limit |
|--------|-------|
| Max preview size | 2 MB (preview subset) |
| Max KV keys per preview | 10 |
| Max concurrent previews | 10,000 (KV capacity) |
| Daily generation limit | 1,000 previews / day |

---

## 6. Token Design

### 6.1 Session Token

```
base64url(
  HMAC-SHA256(
    key = SERVER_PREVIEW_SECRET,
    message = siteId + "|" + createdAt + "|" + inputHash
  )
)
```

- 43 characters (256-bit HMAC, base64url-encoded)
- Not guessable (256 bits of entropy from HMAC)
- Verifiable without database lookup (recompute from stored session)
- Embeds no PII

### 6.2 Replay Protection

- Each session token is bound to a specific `inputHash`
- Resubmitting the same input within 5 minutes returns the existing
  session (cache hit) rather than generating a new one
- After 5 minutes, a new session is created even for identical input
- Token cannot be reused across different inputs

### 6.3 Token Revocation

Tokens are not explicitly revoked — they expire via KV TTL. If abuse is
detected, the rate limiter blocks the source IP before new tokens are
issued.

---

## 7. Audit Events

| Event | Logged By | Contains |
|-------|-----------|----------|
| `preview_requested` | Edge Worker | inputHash, sourceIp (hashed), captcha result |
| `preview_generated` | Edge Worker | sessionToken, fileCount, sizeBytes, durationMs |
| `preview_cache_hit` | Edge Worker | sessionToken, inputHash |
| `preview_served` | Edge Worker | sessionToken, page, viewCount |
| `preview_shared` | Edge Worker | sessionToken (no viewer identity) |
| `preview_followup` | Edge Worker | sessionToken, timestamp (email stored in leads, not audit) |
| `preview_expired` | KV TTL | sessionToken, createdAt |
| `preview_rate_limited` | Edge Worker | sourceIp (hashed), limit hit |

---

## 8. Error Recovery

| Failure | Behavior |
|---------|----------|
| KV write fails | Return 500, do not return session token, log error |
| KV read fails (serve) | Return 503, suggest retry |
| Generation timeout (>30s) | Return 504, suggest retry |
| Invalid captcha | Return 400, require new captcha |
| Input validation fails | Return 400 with per-field errors |
| Rate limit exceeded | Return 429 with `retryAfter` |
| Expired preview viewed | Return 410, redirect to /preview |

---

## 9. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Generation latency (p50) | < 500ms | Edge Worker execution time |
| Generation latency (p99) | < 2s | Edge Worker execution time |
| Preview page load (p50) | < 200ms | KV read + response |
| Time to interactive | < 1s | Form rendered, ready for input |
| Preview iframe load | < 800ms | From API response to visible content |

---

## 10. Security Boundaries

```
┌──────────────────────────────┐
│  TRUST BOUNDARY: PUBLIC      │
│                              │
│  - Preview form              │
│  - Preview iframe            │
│  - Share links               │
│  - Follow-up form            │
│                              │
│  No authentication required  │
│  No admin access             │
│  No source code exposure     │
│  No template source exposure │
│  No KV direct access         │
│                              │
├──────────────────────────────┤
│  TRUST BOUNDARY: EDGE        │
│                              │
│  - Input validation          │
│  - Captcha verification      │
│  - Rate limiting             │
│  - Generation pipeline       │
│  - KV read/write             │
│  - Audit logging             │
│                              │
│  Has: KV access, template    │
│       sources, server secret │
│  Exposes: Only rendered HTML │
│           + CSS to public    │
│                              │
├──────────────────────────────┤
│  TRUST BOUNDARY: ADMIN       │
│                              │
│  - Template management       │
│  - Preset editing            │
│  - Audit log review          │
│  - Lead management           │
│  - Rate limit adjustments    │
│                              │
│  Requires: Owner/Admin auth  │
│                              │
└──────────────────────────────┘
```

---

## Non-Goals

- This spec does NOT define the rendering engine internals (assumed to
  be HTML string generation from templates + tokens).
- This spec does NOT define CDN caching strategy (deferred to
  deployment planning).
- This spec does NOT define analytics dashboards for preview metrics.
- This spec does NOT define A/B testing infrastructure.
