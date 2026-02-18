# B21 Baseline Findings

> Captured: 2026-02-18  
> Branch base: `feature/honorbar-security-admin-upgrade` (29d0a9e)

---

## 1. Site Generator Entrypoints

| File | Purpose | Exports |
|------|---------|---------|
| `src/lib/static-export.ts` | Export pipeline | `exportSite()`, `exportAllSites()`, `sha256()` |
| `src/lib/site-registry.ts` | CRUD + audit | `SiteRegistry` class, `createEmptySiteData()` |
| `src/lib/site-validation.ts` | Deploy readiness | `validateSiteReadyForDeploy()` |
| `scripts/generate-site.mjs` | CLI generation | npm: `site:generate` |
| `scripts/site-manager.mjs` | CLI management | npm: `site:list`, `site:status`, `site:deploy` |

**Site types:** law-firm, small-business, agency.

## 2. Admin Panel Structure

**Component:** `src/components/admin/AdminDashboard.tsx` (597 lines)  
**Categories:** 7 | **Nav items:** 37 | **Lazy components:** 37 + MobileQuickActions

| Category | Count |
|----------|-------|
| XTX396 Site | 7 |
| Investor & Trade | 2 |
| Evident Platform | 2 |
| Frameworks | 4 |
| Case Management | 6 |
| Assets | 5 |
| System | 11 |

## 3. RBAC System

**Roles (4):** owner (100), admin (75), editor (50), support (25)  
**Permissions:** 33  
**Action guards:** 14  
**Route permissions:** 30+ mapped  
**Enforcement:** `enforcePermission()`, `enforceRouteAccess()`, `enforceAction()` — all throw `PermissionDeniedError`

**Existing capabilities registry:** `governance/admin/capabilities_registry.json` (created in B20)

## 4. ToolHub Integration

| File | Purpose |
|------|---------|
| `apps/toolhub/ToolHub.ts` | Central service: search, launch, health |
| `apps/toolhub/BrandProfile.ts` | Brand profiles + validation |
| `apps/tooling/ToolManifest.ts` | Manifest schema + registry |
| `apps/tooling/HighlightTools.ts` | Risk scoring |
| `apps/manifests/` | 8 existing tool manifests |

## 5. Preview Architecture

**Current:** Video-montage-based (Playwright recordings). NOT interactive live preview.

| File | Purpose |
|------|---------|
| `src/previews/preview.types.ts` | Scene, montage, viewport types |
| `src/previews/previewDefs.ts` | Montage defs per offer |
| `src/previews/assembler.ts` | Scene assembly |
| `src/components/previews/` | VideoPlayer, Modal, Gallery, OfferCard |

**Gaps:** No live interactive preview. No watermark. No visitor input form.

## 6. Preset & Vertical Systems

**Presets:** 26 total (4 lawfirm base + 14 practice area + 5 SMB + 3 agency)  
**Verticals:** 18 business types (8 lawfirm + 7 SMB + 3 agency)  
**Registry:** `VERTICAL_REGISTRY` with O(1) lookup  
**Features:** Recommended presets, validators, section defaults, copy templates, SEO, structured data, trust badges

## 7. Test Baseline

- **Test runner:** Vitest 4.x
- **Total tests:** ~450 passing
- **Test directories:** 17 locations across `src/`, `ops/`, `apps/`
- **Pre-existing TS errors:** ~15 (clients/, admin/, landing/ — not in B21 paths)

## 8. Key Gaps to Address

| # | Gap | B21 Phase |
|---|-----|-----------|
| 1 | No operator role | P1 |
| 2 | No blueprint contract system | P2 |
| 3 | No component registry with a11y rules | P3 |
| 4 | No deterministic generation pipeline with manifests | P4 |
| 5 | No live interactive preview with watermark | P5 |
| 6 | No case jacket tool module | P6 |
| 7 | No safe OpenAPI adapter pattern | P7 |
| 8 | No operator training materials | P8 |
