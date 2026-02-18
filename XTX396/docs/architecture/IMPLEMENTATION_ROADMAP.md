# Implementation Roadmap

> Architecture Planning — Session D  
> Status: PLANNING ONLY — no implementation  
> Date: 2026-02-18

---

## Phase Overview

```
Phase 0 ─── Foundations & Hardening ──────────── (1 sprint)
Phase 1 ─── Admin Panel Governance ───────────── (1 sprint)
Phase 2 ─── Generation Pipeline ──────────────── (2 sprints)
Phase 3 ─── Preview Panel (Visitor-Facing) ───── (2 sprints)
Phase 4 ─── Abuse Protection & Monitoring ────── (1 sprint)
Phase 5 ─── Integration Testing & Launch ─────── (1 sprint)
```

Total estimated: **8 sprints** (assuming 1-week sprints for a solo/small
team).

---

## Phase 0: Foundations & Hardening

**Goal:** Close known gaps from the current codebase audit before
building new features.

### Tasks

| # | Task | Files / Modules | Tests |
|---|------|----------------|-------|
| 0.1 | Add 6 missing routes to `ROUTE_PERMISSIONS` | `src/lib/permissions.ts` | Unit: verify all admin routes have explicit entries |
| 0.2 | Add `correlationId` to all destructive actions | `src/lib/route-guards.ts`, admin components with delete/publish | Unit: correlationId present in audit events |
| 0.3 | Add cool-down (5s) on repeated destructive actions | `src/lib/route-guards.ts` | Unit: second call within 5s is rejected |
| 0.4 | Audit mode toggle events | `src/components/admin/AdminDashboard.tsx` | Unit: mode changes produce audit entries |
| 0.5 | Add confirmation dialog to Export Data | `src/components/admin/AdminDashboard.tsx` | Unit: export requires confirm |
| 0.6 | Persist ThemeManager to KV | `src/components/admin/ThemeManager.tsx` | Unit: save writes to KV, load reads from KV |
| 0.7 | Add demo-tenant guard (block admin for demo sites) | `src/lib/route-guards.ts`, `src/App.tsx` | Unit: demo tenant cannot access admin routes |

### Acceptance Criteria

- [ ] All 40+ admin routes have explicit permission entries
- [ ] All destructive actions include `correlationId` in audit log
- [ ] Export Data shows confirmation before executing
- [ ] ThemeManager persists + loads from KV
- [ ] Demo tenant is blocked from admin at route level
- [ ] All existing 450+ tests still pass

### Security Checks

- [ ] No destructive action can execute without audit trail
- [ ] Demo tenant restriction cannot be bypassed by URL manipulation

---

## Phase 1: Admin Panel Governance

**Goal:** Implement the capability allowlist model and Safe Mode
enforcement.

### Tasks

| # | Task | Files / Modules | Tests |
|---|------|----------------|-------|
| 1.1 | Create `src/lib/capabilities.ts` — capability registry | New file | Unit: all capabilities have valid schema |
| 1.2 | Create capability check middleware | New file: `src/lib/capability-check.ts` | Unit: blocked actions return 403 |
| 1.3 | Integrate capability checks into admin actions | All admin components with destructive actions | Integration: actions gated by capabilities |
| 1.4 | Implement Safe Mode state + enforcement | `src/lib/feature-flags.ts`, new: `src/lib/safe-mode.ts` | Unit: safe mode blocks external API calls |
| 1.5 | Add Safe Mode toggle to admin UI | `src/components/admin/AdminDashboard.tsx` | Unit: toggle visible only to owner |
| 1.6 | Default Safe Mode ON for all public/demo flows | `src/lib/safe-mode.ts`, route guards | Unit: public routes always in safe mode |

### Acceptance Criteria

- [ ] Every destructive action is gated by a registered capability
- [ ] Safe Mode ON blocks: external API, file uploads, terminal, dangerous actions
- [ ] Safe Mode cannot be disabled in public/demo contexts
- [ ] Capability violations produce audit events
- [ ] Existing tests pass + new governance tests pass

### Security Checks

- [ ] Capability bypass is not possible via direct function import
- [ ] Safe Mode state cannot be modified from browser console in production

---

## Phase 2: Generation Pipeline

**Goal:** Build the site generation pipeline from validated input to
hashed, watermarked output.

### Sprint 2a: Core Pipeline

| # | Task | Files / Modules | Tests |
|---|------|----------------|-------|
| 2.1 | Define `TemplateInput` / `TemplateOutput` types | New: `src/generation/types.ts` | Type-check only |
| 2.2 | Input validation step | New: `src/generation/validate.ts` | Unit: all validation rules |
| 2.3 | Scaffold step (load vertical pack + preset + merge) | New: `src/generation/scaffold.ts` | Unit: scaffold produces expected sections |
| 2.4 | Render step (HTML + CSS generation from scaffold) | New: `src/generation/render.ts` | Unit: output is valid HTML, contains expected content |
| 2.5 | Hash step (SHA-256 all files + integrity manifest) | Extend: `src/lib/static-export.ts` or new `src/generation/hash.ts` | Unit: hashes match re-computation |
| 2.6 | Store step (write to KV / localStorage bridge) | New: `src/generation/store.ts` | Unit: artifacts stored with correct keys |

### Sprint 2b: Watermark + Audit

| # | Task | Files / Modules | Tests |
|---|------|----------------|-------|
| 2.7 | Watermark injection (CSS overlay in HTML) | New: `src/generation/watermark.ts` | Unit: demo output contains watermark, owner output does not |
| 2.8 | Watermark config model | New: `src/generation/watermark-config.ts` | Unit: config schema matches spec |
| 2.9 | Generation audit trail | New: `src/generation/audit.ts` | Unit: generation produces audit log JSON |
| 2.10 | Determinism verification | `src/generation/render.ts`, `scaffold.ts` | Unit: same input → identical output (hash match) |
| 2.11 | Pipeline orchestrator (validate→scaffold→render→watermark→hash→store) | New: `src/generation/pipeline.ts` | Integration: full pipeline end-to-end |
| 2.12 | Preview-safe subset rules | `src/generation/pipeline.ts` | Unit: preview generates only Home + 1 page, no functional forms |

### Acceptance Criteria

- [ ] Pipeline produces valid HTML sites from any valid `TemplateInput`
- [ ] All generated files are SHA-256 hashed
- [ ] Watermark present on demo/preview; absent on owner sites
- [ ] Pipeline is deterministic (same input → same hashes)
- [ ] Generation events logged in audit trail
- [ ] Output does not contain source code, React, or internal class names
- [ ] Preview subset is enforced (2 pages max, forms disabled)

### Security Checks

- [ ] XSS: business name/tagline properly escaped in all HTML contexts
- [ ] No `<script>` tags in generated output (CSP `script-src 'none'`)
- [ ] No generation pipeline code exposed in output
- [ ] File size limit (10 MB full site, 2 MB preview) enforced

---

## Phase 3: Preview Panel (Visitor-Facing)

**Goal:** Build the public-facing preview form and iframe rendering.

### Sprint 3a: Form + API

| # | Task | Files / Modules | Tests |
|---|------|----------------|-------|
| 3.1 | Preview form component | New: `src/components/preview/PreviewForm.tsx` | Unit: renders fields, validates, submits |
| 3.2 | Business type dynamic filtering | `PreviewForm.tsx` | Unit: options filter by site type |
| 3.3 | Preset card selector | New: `src/components/preview/PresetSelector.tsx` | Unit: renders presets, handles selection |
| 3.4 | Color picker with contrast validation | New: `src/components/preview/ColorPicker.tsx` | Unit: rejects non-AA colors |
| 3.5 | Captcha integration (Turnstile) | New: `src/components/preview/CaptchaGate.tsx` | Unit: blocks submission without valid token |
| 3.6 | Preview API endpoint (Edge Worker) | New: `workers/preview/generate.ts` | Integration: API returns preview response |
| 3.7 | Preview serving endpoint | New: `workers/preview/serve.ts` | Integration: serves HTML from KV |

### Sprint 3b: Iframe + Polish

| # | Task | Files / Modules | Tests |
|---|------|----------------|-------|
| 3.8 | Preview iframe container with responsive toggle | New: `src/components/preview/PreviewFrame.tsx` | Unit: renders iframe, resize works |
| 3.9 | Page navigation in preview | `PreviewFrame.tsx` | Unit: page switch updates iframe src |
| 3.10 | Split layout (form + preview) | New: `src/pages/PreviewPage.tsx` | Unit: layout renders both panels |
| 3.11 | Share link generation + resolution | `workers/preview/generate.ts`, new route | Integration: share URL loads preview |
| 3.12 | Follow-up form | New: `src/components/preview/FollowUpForm.tsx` | Unit: validates, submits, shows confirmation |
| 3.13 | Error + loading states | `PreviewPage.tsx` | Unit: all states render correctly |
| 3.14 | Accessibility audit | All preview components | Manual: keyboard nav, screen reader, contrast |

### Acceptance Criteria

- [ ] Visitor can generate a watermarked preview without authentication
- [ ] Preview renders in sandboxed iframe with CSP
- [ ] Responsive toggle shows mobile/tablet/desktop widths
- [ ] Share link works for 24 hours then shows expiry notice
- [ ] Follow-up form creates a lead record
- [ ] All form fields keyboard-accessible + screen-reader compatible
- [ ] WCAG 2.1 AA compliance on all preview panel UI

### Security Checks

- [ ] No authentication tokens in preview flow
- [ ] Captcha required before generation
- [ ] Iframe sandbox prevents script injection
- [ ] CSP headers on all preview pages
- [ ] No source code or internal paths in response

---

## Phase 4: Abuse Protection & Monitoring

**Goal:** Harden the preview system against automated abuse.

### Tasks

| # | Task | Files / Modules | Tests |
|---|------|----------------|-------|
| 4.1 | IP-based rate limiting (hashed) | `workers/preview/rate-limit.ts` | Unit: counters increment, limits enforce |
| 4.2 | Global daily generation cap | `workers/preview/rate-limit.ts` | Unit: cap triggers 429 for all |
| 4.3 | View count limiter per session | `workers/preview/serve.ts` | Unit: 500+ views return 410 |
| 4.4 | Circuit breaker for generation errors | New: `workers/preview/circuit-breaker.ts` | Unit: opens at 20% error rate, closes after recovery |
| 4.5 | Email-based follow-up rate limit | `workers/preview/follow-up.ts` | Unit: 4th request in 24h rejected |
| 4.6 | Monitoring dashboard (admin) | New: `src/components/admin/PreviewMonitor.tsx` | Unit: renders metrics |
| 4.7 | Alert on global cap / circuit breaker open | `workers/preview/alerts.ts` | Integration: alert fires on threshold |

### Acceptance Criteria

- [ ] Rate limits enforced at edge (not client-side only)
- [ ] No raw IP addresses stored
- [ ] Circuit breaker prevents cascading failures
- [ ] Owner receives alerts on abuse thresholds
- [ ] Monitoring dashboard shows: generation count, error rate, rate limit hits

### Security Checks

- [ ] Rate limit bypass not possible by rotating user-agent
- [ ] KV exhaustion not possible within daily cap
- [ ] No PII in rate limit keys

---

## Phase 5: Integration Testing & Launch

**Goal:** End-to-end validation and production readiness.

### Tasks

| # | Task | Files / Modules | Tests |
|---|------|----------------|-------|
| 5.1 | E2E: visitor generates preview, views, shares | Playwright test | E2E |
| 5.2 | E2E: admin reviews generated preview in audit log | Playwright test | E2E |
| 5.3 | E2E: rate limiting prevents abuse | Playwright test + API test | E2E |
| 5.4 | E2E: expired preview shows correct state | Playwright test | E2E |
| 5.5 | E2E: follow-up creates lead accessible in admin | Playwright test | E2E |
| 5.6 | Performance: generation < 2s p99 | Artillery load test | Performance |
| 5.7 | Security: penetration test (preview endpoints) | Manual or automated | Security |
| 5.8 | Accessibility: WCAG 2.1 AA audit | axe-core / manual | Accessibility |
| 5.9 | Documentation: update README, deployment guide | `README.md`, new guides | — |
| 5.10 | Production deployment checklist | New: `PREVIEW_DEPLOY_CHECKLIST.md` | — |

### Acceptance Criteria

- [ ] All E2E tests pass
- [ ] Generation latency < 2s p99 under load
- [ ] No WCAG 2.1 AA violations
- [ ] Penetration test: no critical or high findings
- [ ] Documentation complete

---

## Dependency Graph

```
Phase 0 ──► Phase 1 ──► Phase 2a ──► Phase 2b ──┐
                                                  ├──► Phase 4 ──► Phase 5
                                  Phase 3a ──► Phase 3b ──┘
```

- Phase 0 and 1 are sequential (governance before features)
- Phase 2 (generation) and Phase 3a (form/API) can partially overlap
- Phase 3b (iframe/polish) depends on Phase 2b (watermark output)
- Phase 4 (abuse protection) depends on Phase 3b (endpoints exist)
- Phase 5 (integration) depends on all prior phases

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Generation pipeline too slow (>2s) | Medium | High | Profile and optimize; consider pre-generation cache |
| KV storage costs exceed budget | Low | Medium | TTL enforcement, daily cap, monitor usage |
| Captcha provider outage | Low | Medium | Fallback to proof-of-work challenge |
| Watermark removed by screenshot + edit | Medium | Low | Watermark is brand protection, not DRM; accepted risk |
| Preset/vertical changes break generation | Medium | Medium | Version-pin presets; generation references preset hash |
| Browser compatibility (iframe sandbox) | Low | Medium | Test top 5 browsers; graceful degradation |

---

## Non-Goals for This Roadmap

- Server-side rendering of the main XTX396 site
- Payment integration or e-commerce
- Custom template authoring by visitors
- Multi-language support for generated sites
- Mobile app for preview
