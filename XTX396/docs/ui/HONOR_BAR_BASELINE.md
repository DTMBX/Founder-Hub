# Honor Flag Bar — Baseline Triage

> Date: 2026-02-17
> Branch: `feature/honorbar-security-admin-upgrade`

---

## Component Location

| Asset | Path |
|---|---|
| HonorFlagBar component | `src/components/HonorFlagBar.tsx` |
| HonorFlagBar admin manager | `src/components/admin/HonorFlagBarManager.tsx` |
| Height constants | `HONOR_BAR_HEIGHT_DESKTOP = 64`, `HONOR_BAR_HEIGHT_MOBILE = 56` |
| KV settings keys | `honor-flag-bar-enabled`, `-animation`, `-parallax`, `-rotation`, `-max-desktop`, `-max-mobile`, `-alignment`, `-settings` |

---

## Current Render Locations

| View | File | Rendered? | Notes |
|---|---|---|---|
| PublicSite | `src/components/PublicSite.tsx` L207 | YES | Props wired from KV |
| CaseJacket | `src/components/CaseJacket.tsx` L457 | YES | Hardcoded props, hardcoded sticky offsets |
| AdminDashboard | `src/components/admin/AdminDashboard.tsx` | NO | Only manager (editor) is loaded |
| SiteRouter | `src/components/sites/SiteRouter.tsx` | NO | Has its own layout |
| CheckoutResult | `src/components/CheckoutResult.tsx` | NO | Standalone page |
| OfferingPage | `src/marketing/` | NO | Marketing page |

**Problem:** HonorFlagBar is NOT at the app root. It is rendered per-page,
causing inconsistency (missing on Admin, SiteRouter, Checkout pages) and
requiring each page to independently coordinate offsets.

---

## Layout Roots

| Root | File | Type |
|---|---|---|
| App shell | `src/App.tsx` | Hash router, view switch |
| PublicSite | `src/components/PublicSite.tsx` | `min-h-screen` wrapper |
| AdminDashboard | `src/components/admin/AdminDashboard.tsx` | `min-h-screen flex` |
| CaseJacket | `src/components/CaseJacket.tsx` | `min-h-screen` wrapper |
| SiteRouter | `src/components/sites/SiteRouter.tsx` | Client site renderer |

---

## Stacking Context Analysis

### z-index Map (XTX396 src/)

| Layer | z-index | Component | Position |
|---|---|---|---|
| SkipLinks | 9999 | `src/marketing/components/SkipLinks.tsx` | fixed |
| FounderModal overlay | 1000 | `FounderDashboard.css` | fixed |
| Navigation | z-50 (50) | `src/components/Navigation.tsx` | fixed |
| HonorFlagBar | z-40 (40) | `src/components/HonorFlagBar.tsx` | fixed |
| Mobile sidebar | z-40 (40) | `AdminDashboard.tsx` | fixed |
| Admin header | z-30 (30) | `AdminDashboard.tsx` | sticky |
| Pathway badge | z-40 (40) | `PublicSite.tsx` | fixed |
| HeroSection button | z-50 (50) | `HeroSection.tsx` | fixed |
| Background grid | z-[-1] | `index.css body::before` | fixed |

### overflow:hidden Ancestors

| File | Element | Risk |
|---|---|---|
| `HeroSection.tsx` L85 | `.overflow-hidden` on hero section | LOW — HonorBar is sibling, not child |
| `FounderDashboard.css` L614 | `.founder-modal` | LOW — modal only |
| `static-renderer.ts` L132 | inline card style | NONE — different render path |

### Stacking Context Creators (transform/filter/backdrop-filter)

| File | Property | Risk |
|---|---|---|
| Navigation.tsx | `backdrop-blur-xl` when scrolled | MEDIUM — creates new stacking context |
| AdminDashboard.tsx | `backdrop-blur-sm/xl` on overlays | LOW — overlays only |
| PublicSite.tsx | `backdrop-blur-xl` on footer | NONE — below bar |

---

## Identified Issues

1. **HonorFlagBar is per-page, not at layout root.**
   Admin, SiteRouter, Checkout, and Offerings views have no flag bar.

2. **CaseJacket sticky offsets are hardcoded and wrong.**
   Uses `top-[18px] sm:top-[20px] md:top-[24px]` — should be bar height.

3. **Navigation uses `top: {honorBarHeight}px` correctly** but this
   coordination breaks if HonorFlagBar is conditionally absent.

4. **No CSS guard** to prevent future ancestors from adding
   `overflow: hidden` above the bar.

5. **z-index ordering is correct** (bar=40, nav=50) but fragile
   without a documented stack policy.

---

## Recommended Fix

1. Move `<HonorFlagBar>` to `App.tsx` as the first child — single
   render point for all views.
2. Remove per-page renders from `PublicSite.tsx` and `CaseJacket.tsx`.
3. Expose CSS custom property `--honor-bar-height` on `:root` for
   any component to reference.
4. Fix CaseJacket sticky header to use `top: var(--honor-bar-height)`.
5. Add CSS guard utility that checks for overflow clipping on ancestors.
6. Document z-index stack policy.
