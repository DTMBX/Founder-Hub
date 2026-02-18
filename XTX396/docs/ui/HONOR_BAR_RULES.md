# Honor Flag Bar — Layout Invariants

> Last updated: 2026-02-17
> Enforced by: CSS guard utility + automated tests

---

## Invariants (Non-Negotiable)

### 1. Single Render Point

The HonorFlagBar renders ONCE in `App.tsx` — the highest layout root.
No other component may render its own instance.

**Removed from:** `PublicSite.tsx`, `CaseJacket.tsx`
**Settings centralized in:** `useHonorBarSettings` hook

### 2. Never Clipped

No ancestor of the HonorFlagBar may set:
- `overflow: hidden`
- `overflow: clip`
- `overflow-x: hidden`
- `overflow-y: hidden`

The bar itself uses `overflow: visible` explicitly.

**Enforced by:** `honor-bar-guard.ts` — dev-only console warnings.

### 3. Fixed Position, Top 0

The bar is `position: fixed; top: 0; left: 0; right: 0;` with `z-index: 40`.

All content below the bar must account for its height via:
```css
padding-top: var(--honor-bar-height, 64px);
/* or */
top: var(--honor-bar-height, 64px);
```

### 4. CSS Custom Property Coordination

The bar publishes `--honor-bar-height` on `:root` via JavaScript.
Fallback value `64px` is set in `index.css`.

Components that need the height:
- **Navigation:** `top: {honorBarHeight}px` (uses JS constant)
- **AdminDashboard sidebar:** `top: var(--honor-bar-height, 64px)`
- **AdminDashboard header:** `top: var(--honor-bar-height, 64px)`
- **CaseJacket sticky header:** `top: var(--honor-bar-height, 64px)`

### 5. Z-Index Stack Policy

| Layer | z-index | Purpose |
|---|---|---|
| SkipLinks | 9999 | Accessibility skip navigation |
| Modals/Overlays | 1000 | Founder dashboard modals |
| Navigation | 50 (z-50) | Sticky nav below bar |
| HonorFlagBar | 40 (z-40) | Flag bar above content |
| Admin header | 30 (z-30) | Admin panel sticky header |
| Content | auto | Regular page content |
| Background | -1 | Grid pattern overlay |

Bar z-index must always be LESS than nav z-index.
**Enforced by:** `verifyZIndexOrdering()` in guard utility.

### 6. Safe Area Inset (iOS)

The bar applies `padding-top: env(safe-area-inset-top, 0px)` for
iPhone notch/dynamic island support.

### 7. Responsive Sizing

| Viewport | Height | Flag Size |
|---|---|---|
| Desktop (≥768px) | 64px | 48px |
| Mobile (<768px) | 56px | 40px |

Flag icons use:
- `display: block` (via flex child)
- `height: 100%` (of container)
- `width: auto`
- `overflow: visible`
- `object-fit: contain`

Flags are never cropped. On very small viewports, the number of
visible flags reduces (via `maxFlagsMobile` setting) but each
flag maintains its full aspect ratio.

### 8. Disabled State

When the bar is disabled (`enabled = false`), it still renders a
transparent spacer with the same height to prevent layout shift.

---

## Test Coverage

File: `src/__tests__/honor-bar-layout.test.ts` — 18 tests

| Suite | Tests | What it validates |
|---|---|---|
| Height Constants | 4 | Correct values, positive integers, desktop ≥ mobile |
| Ancestor Overflow Guard | 6 | Detects hidden, clip, nested clipping, null safety |
| Layout Guard Runner | 1 | Null safety, no-throw guarantee |
| Z-Index Ordering | 4 | Correct ordering, conflict detection, null/missing nav |
| CSS Property Contract | 2 | Fallback alignment, sanity bounds |

---

## Manual Sanity Checklist

Before any release that modifies layout:

- [ ] Load PublicSite — flag bar visible, not clipped
- [ ] Load AdminDashboard — flag bar visible above sidebar
- [ ] Load CaseJacket — flag bar visible, sticky header below it
- [ ] Resize to mobile — bar height reduces, flags still visible
- [ ] Scroll down — nav appears below bar, neither overlaps
- [ ] Open HonorFlagBarManager in admin — changes apply in real time
- [ ] Disable bar in admin — spacer maintains layout

---

## Files

| File | Purpose |
|---|---|
| `src/components/HonorFlagBar.tsx` | Component (single instance) |
| `src/hooks/use-honor-bar-settings.ts` | KV settings hook |
| `src/lib/honor-bar-guard.ts` | Overflow + z-index guard |
| `src/__tests__/honor-bar-layout.test.ts` | Layout tests (18) |
| `src/App.tsx` | Layout root (renders HonorFlagBar) |
| `src/index.css` | CSS fallback `--honor-bar-height: 64px` |
