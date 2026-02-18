# Risk & Abuse Model — Visitor Preview Panel

> Architecture Planning — Session C  
> Status: PLANNING ONLY — no implementation  
> Date: 2026-02-18

---

## 1. Threat Model

### 1.1 Threat Actors

| Actor | Motivation | Capability |
|-------|-----------|------------|
| Spam bot | Generate massive previews to exhaust KV/compute | Automated HTTP, IP rotation |
| Scraper | Extract template designs/code | Browser automation, curl |
| Competitor | Enumerate all preset/vertical combinations | Systematic input variation |
| Vandal | Input offensive content to generate offensive pages | Manual or scripted |
| Lead spam | Submit fake follow-up requests to pollute leads | Automated form submission |
| XSS attacker | Inject scripts via business name/tagline | Crafted payloads |
| Enumeration | Guess session tokens to view others' previews | Brute-force token space |

### 1.2 Assets to Protect

| Asset | Impact if Compromised |
|-------|----------------------|
| Template source code | Intellectual property loss |
| Preset configurations | Design differentiation lost |
| Generation pipeline logic | Copyable by competitors |
| KV storage capacity | Denial of service via exhaustion |
| Edge compute budget | Cost overrun |
| Lead quality | Sales pipeline contaminated |
| Brand reputation | Offensive content generated under brand |

---

## 2. Rate Limiting

### 2.1 Preview Generation

| Dimension | Limit | Window | Action on Exceed |
|-----------|-------|--------|------------------|
| Per IP | 10 requests | 1 hour | 429 + 60-minute cooldown |
| Per IP | 3 requests | 1 minute | 429 + 5-minute cooldown |
| Global | 1,000 requests | 24 hours | 429 for all visitors + alert owner |
| Per captcha token | 1 use | Single | 400 (token already consumed) |

### 2.2 Preview Serving

| Dimension | Limit | Window | Action on Exceed |
|-----------|-------|--------|------------------|
| Per session token | 500 page views | Lifetime | 410 (expired) |
| Per IP (viewing) | 200 page views | 1 hour | 429 + 30-minute cooldown |

### 2.3 Follow-Up Requests

| Dimension | Limit | Window | Action on Exceed |
|-----------|-------|--------|------------------|
| Per email address | 3 requests | 24 hours | 429 + 24-hour cooldown |
| Per IP | 10 requests | 1 hour | 429 + 60-minute cooldown |
| Per session token | 1 request | Lifetime | 400 (already submitted) |

### 2.4 Rate Limit Implementation

```
Rate limit keys stored in KV with TTL:

  ratelimit:gen:ip:{hashedIp}:hour    → counter (TTL: 3600s)
  ratelimit:gen:ip:{hashedIp}:minute  → counter (TTL: 60s)
  ratelimit:gen:global:day            → counter (TTL: 86400s)
  ratelimit:view:ip:{hashedIp}:hour   → counter (TTL: 3600s)
  ratelimit:view:token:{token}        → counter (TTL: 86400s)
  ratelimit:lead:email:{hash}:day     → counter (TTL: 86400s)
  ratelimit:lead:ip:{hashedIp}:hour   → counter (TTL: 3600s)
```

IP addresses are SHA-256 hashed before storage — no raw IPs retained.

---

## 3. Input Validation & Sanitization

### 3.1 Input Bounds

| Field | Max Length | Allowed Characters | Sanitization |
|-------|-----------|-------------------|-------------|
| businessName | 80 | Unicode letters, numbers, spaces, `&`, `'`, `.`, `,` | Strip HTML, trim, normalize whitespace |
| tagline | 120 | Unicode letters, numbers, spaces, standard punctuation | Strip HTML, trim, normalize whitespace |
| presetId | 50 | `[a-z0-9-]` | Exact match against registry |
| siteType | 20 | Enum value | Exact match |
| businessType | 30 | Enum value | Exact match |
| primaryColor | 7 | `#[0-9a-fA-F]{6}` | Regex validation |
| accentColor | 7 | `#[0-9a-fA-F]{6}` | Regex validation |
| captchaToken | 2048 | Opaque string | Passed to verification API |

### 3.2 Content Safety

Generated HTML uses the business name and tagline in:
- `<title>` — HTML-entity-escaped
- `<h1>` — HTML-entity-escaped
- `<meta name="description">` — HTML-entity-escaped
- Hero section — HTML-entity-escaped

**No raw user input is ever inserted into HTML without escaping.**

Offensive content filtering:
- **Not implemented at generation time** (see Open Questions)
- Watermark + demo status reduces brand risk
- Audit log captures all inputs for post-hoc review
- Manual review of flagged inputs can be added later

### 3.3 File Upload Prevention

- No file upload endpoints exist in the preview API
- `Content-Type` must be `application/json`
- Max request body: 2 KB
- Binary payloads rejected at the edge

---

## 4. Source Code Leakage Prevention

### 4.1 What Visitors See

- Rendered HTML (no JSX, no React, no component source)
- Inline CSS (resolved from tokens, no Tailwind classes, no design tokens)
- No JavaScript (except minimal scroll/responsive behavior)
- No data attributes revealing internal structure
- No comments in generated HTML
- No source maps

### 4.2 What Visitors Cannot Access

- Template source files (never served to public)
- Preset JSON (tokens are resolved into CSS, originals not exposed)
- Vertical pack configurations
- Generation pipeline code
- Admin panel routes
- KV keys or storage structure
- Audit logs
- Other visitors' previews (tokens are 256-bit HMAC)

### 4.3 Technical Enforcement

| Protection | Mechanism |
|-----------|-----------|
| No source in output | Generation pipeline outputs only HTML + CSS strings |
| No template enumeration | Preset IDs in the form are a curated public subset |
| No KV direct access | KV bound to Worker, not publicly addressable |
| No session enumeration | 256-bit token space, HMAC-signed |
| CSP on preview pages | `script-src 'none'` prevents injected scripts |
| Frame isolation | `sandbox="allow-scripts allow-same-origin"` on iframe |
| No cross-origin leakage | `referrerpolicy="no-referrer"` on iframe |

---

## 5. Denial of Service Mitigations

| Vector | Mitigation |
|--------|------------|
| Generation flood | IP + global rate limits + captcha |
| KV exhaustion | 24h TTL + max 10 keys/preview + daily cap |
| Large payloads | 2 KB request limit, 2 MB output limit |
| Compute exhaustion | 30-second Worker timeout, generation circuit breaker |
| Slowloris | Cloudflare default protections |
| DNS amplification | Not applicable (no DNS in preview flow) |

### 5.1 Circuit Breaker

If the generation error rate exceeds 20% over a 5-minute window:

1. New generation requests return 503
2. Alert sent to owner
3. Existing previews continue to serve from KV
4. Auto-recovery after 10 minutes if error rate drops below 5%

---

## 6. Privacy Considerations

### 6.1 Data Minimization

| Data | Collected | Stored | Retention |
|------|-----------|--------|-----------|
| Business name / tagline | Yes | In preview HTML (24h TTL) | 24 hours |
| IP address | Hashed only | Rate limit counters | 1–24 hours |
| Email (follow-up) | Yes | Leads system | Indefinite (business record) |
| Phone (follow-up) | Optional | Leads system | Indefinite (business record) |
| Browser fingerprint | No | — | — |
| Cookies | No | — | — |
| Third-party trackers | No | — | — |

### 6.2 GDPR / Privacy Alignment

- No tracking cookies
- No persistent identifiers
- No cross-session linking
- Follow-up form includes consent notice
- Leads can be deleted on request (existing leads system)
- Audit logs contain no PII (hashed IPs only)

---

## 7. Abuse Response Procedures

### 7.1 Automated

| Trigger | Response |
|---------|----------|
| Rate limit exceeded | 429 + cooldown |
| Invalid captcha | 400 + new challenge |
| Generation timeout | 504 + circuit breaker check |
| Error rate > 20% | Circuit breaker opens |
| Global daily cap hit | 429 for all + owner alert |

### 7.2 Manual (Owner Review)

| Signal | Available in |
|--------|-------------|
| High generation volume from single IP range | Audit log (hashed IPs) |
| Offensive business names | Audit log (inputHash → stored request) |
| Lead spam patterns | Leads dashboard |
| Unusual preset/vertical distribution | Analytics events |

---

## 8. Risk Matrix Summary

| Risk | Likelihood | Impact | Mitigation | Residual Risk |
|------|-----------|--------|------------|---------------|
| Template source leakage | Low | High | No source in output, CSP, no source maps | Very Low |
| KV exhaustion (DoS) | Medium | Medium | TTL, rate limits, daily cap | Low |
| Offensive content generation | Medium | Low | Watermark, audit log, no public indexing | Low |
| Lead spam | Medium | Low | Rate limits, captcha, review | Low |
| XSS via input | Low | High | Strict escaping, CSP `script-src 'none'` | Very Low |
| Session token enumeration | Very Low | Medium | 256-bit HMAC space | Negligible |
| Compute cost overrun | Low | Medium | Timeouts, circuit breaker, daily cap | Low |
| Competitor scraping | Medium | Low | Rate limits, watermark, no source | Low |

---

## Non-Goals

- This model does NOT cover admin panel abuse (see
  ADMIN_PANEL_REVIEW_PLAN.md).
- This model does NOT define WAF rules (deferred to deployment).
- This model does NOT define legal enforcement for abuse (out of scope).
