# Open Questions

> Architecture Planning — Session D  
> Status: PLANNING ONLY  
> Date: 2026-02-18

---

Questions below are potentially blocking. Each must be resolved before
the relevant implementation phase begins.

---

## Q1. Edge Runtime Target

**Phase:** 2, 3  
**Question:** Is the preview generation Worker deployed to Cloudflare
Workers, or should it target a different edge runtime (Vercel Edge
Functions, Deno Deploy, etc.)?

**Impact:** Determines KV API, deployment tooling, and Worker size
limits.

**Default assumption if unresolved:** Cloudflare Workers + Cloudflare
KV, consistent with existing CNAME and deployment patterns.

---

## Q2. Captcha Provider

**Phase:** 3  
**Question:** Cloudflare Turnstile (free, privacy-focused) or
proof-of-work challenge (no third-party dependency)?

**Impact:** Turnstile is simpler to implement but adds a third-party
dependency. Proof-of-work is self-hosted but adds client CPU cost and
implementation complexity.

**Default assumption if unresolved:** Cloudflare Turnstile, with
proof-of-work as a fallback if Turnstile is unavailable.

---

## Q3. Offensive Content Filtering

**Phase:** 3  
**Question:** Should the generation pipeline reject business
names/taglines that contain profanity or offensive language? If so,
what dictionary or service should be used?

**Impact:** Without filtering, offensive demos can be generated under
the brand. With filtering, false positives may block legitimate
businesses (e.g., "Slaughter & Associates" law firm).

**Default assumption if unresolved:** No automated filtering at launch.
Watermark + `noindex` + audit log mitigate risk. Add filtering in a
later iteration after reviewing actual usage patterns.

---

## Q4. Preview Generation Budget

**Phase:** 4  
**Question:** What is the acceptable monthly cost ceiling for preview
generation compute and KV storage?

**Impact:** Determines daily generation cap (currently proposed at
1,000/day) and TTL policy (currently 24 hours).

**Default assumption if unresolved:** Free tier / minimal cost.
1,000 previews/day × 2 MB average = 2 GB KV writes/day. Cloudflare
Workers free tier allows 100,000 requests/day and 1 GB KV storage.
Adjust caps if costs exceed $20/month.

---

## Q5. Preset Public Subset

**Phase:** 2, 3  
**Question:** Should all 25+ presets be available in the public preview
form, or only a curated subset (e.g., 3 per site type)?

**Impact:** Full set provides better demo experience but exposes the
complete preset library. Curated subset protects IP but limits demo
appeal.

**Default assumption if unresolved:** Curated subset of 3–5 presets per
site type for public preview. Full set available only in admin.

---

## Q6. Follow-Up Lead Storage

**Phase:** 3  
**Question:** Should follow-up leads be stored in the existing
client-side leads system (localStorage), or does this require a
server-side data store?

**Impact:** Client-side storage means leads are only visible on the
owner's browser. Server-side storage requires infrastructure not
currently in place.

**Default assumption if unresolved:** Edge Worker writes to KV with
indefinite TTL. Admin panel reads leads from KV via API. This avoids
localStorage limitation for visitor-submitted leads.

---

## Q7. Multi-Device Tenancy

**Phase:** 0, 1  
**Question:** The current `SiteRegistry` uses localStorage
(single-browser). Is cross-device access a requirement for Phase 0–3,
or can it be deferred?

**Impact:** Cross-device requires server-side storage migration. If
deferred, preview leads submitted via Edge Worker will need a separate
read path in admin.

**Default assumption if unresolved:** Deferred. Single-browser tenancy
is acceptable for owner admin. Preview leads use KV (server-side) and
are surfaced in admin via a KV-reading component.

---

## Resolution Protocol

Each question should be resolved by recording:

1. The decision
2. The rationale
3. Who decided
4. The date

Resolved questions should be moved to a `## Resolved` section at the
bottom of this file with the above metadata.

---

## Resolved

(none yet)
