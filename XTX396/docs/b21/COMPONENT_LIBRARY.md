# Component Library — B21-P3

> Registry of 35+ UI components with explicit a11y rules, category grouping,
> and blueprint cross-reference validation.

---

## Overview

The Component Library provides a **machine-readable registry** of every UI
component available for site generation. Blueprints reference components by ID;
the generation pipeline resolves those IDs against this registry.

Every component carries explicit **accessibility rules** (ARIA role, contrast
level, keyboard navigability, focus visibility, reduced-motion safety).

## Files

| File | Purpose |
|------|---------|
| `apps/ui/components/registry.schema.json` | JSON Schema for the registry |
| `apps/ui/components/registry.json` | Component definitions (35+ entries) |
| `apps/ui/components/ComponentRegistry.ts` | TypeScript registry class |
| `apps/ui/components/__tests__/registry.test.ts` | Tests |

## Categories

| ID | Label | Components |
|----|-------|------------|
| `core-ux` | Core UX | site-header, site-footer |
| `hero` | Hero & Banner | hero-banner, video-hero |
| `cards` | Cards & Grids | card-grid, icon-card-grid, team-grid, project-showcase, portfolio-grid, blog-feed |
| `sections` | Content Sections | cta-block, text-block, service-list, map-embed, faq-accordion, stats-counter, case-results-table, event-list, pricing-table, insurance-list |
| `media` | Media | image-gallery, before-after-slider |
| `forms` | Forms & Input | contact-form, intake-form, estimate-form, appointment-form, newsletter-form |
| `social-proof` | Social Proof | testimonial-carousel, trust-badge-row, social-proof-bar, logo-bar, badge-grid, partner-logo-bar |
| `compliance` | Compliance | (reserved for future compliance-specific renderers) |
| `navigation` | Navigation | nav-bar |
| `utility` | Utility | process-timeline, hours-widget, chat-widget |

## Accessibility Rules

Every component defines:

- **role** — ARIA landmark role
- **keyboard_navigable** — must support keyboard interaction
- **min_contrast** — WCAG contrast level (AA or AAA)
- **requires_label** — needs aria-label or visible label
- **focus_visible** — focus indicator must be visible
- **reduced_motion_safe** — respects `prefers-reduced-motion`
- **screen_reader_text** — requires SR-only text

### Invariants

- All interactive components MUST be keyboard navigable
- All interactive components MUST have visible focus indicators
- All form components MUST require labels
- All components MUST respect reduced motion

## ComponentRegistry Class

```typescript
import { COMPONENT_REGISTRY } from 'apps/ui/components/ComponentRegistry'

// Lookup
const comp = COMPONENT_REGISTRY.get('hero-banner')

// Existence check
COMPONENT_REGISTRY.has('hero-banner') // true

// Category filtering
COMPONENT_REGISTRY.getByCategory('forms') // ComponentDef[]

// Tag filtering
COMPONENT_REGISTRY.getByTag('hero') // ComponentDef[]

// Blueprint validation
const missing = COMPONENT_REGISTRY.validateComponentIds(['hero-banner', 'unknown'])
// ['unknown']
```

## Blueprint Cross-Reference

Tests verify that every component ID referenced by any blueprint:
- exists in the registry
- has valid a11y rules
- belongs to a valid category

This ensures blueprints and the component library stay in sync.
