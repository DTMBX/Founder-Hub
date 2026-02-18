# Site Template Generation Specification

> Architecture Planning — Session B  
> Status: PLANNING ONLY — no implementation  
> Date: 2026-02-18

---

## 1. Template Inventory

### 1.1 Site Types

| Type | Registry Key | Presets | Verticals | Status |
|------|-------------|---------|-----------|--------|
| Law Firm | `law-firm` | 18 (4 base + 14 practice-area) | 8 | Complete |
| Small Business | `small-business` | 5 | 7 | Complete |
| Agency | `agency` | 3 (inline) | 4 | Complete |

### 1.2 Business Type Enum (19 values)

**Law Firm:** personal-injury, criminal-defense, family-law,
corporate-law, immigration, estate-planning, employment-law,
intellectual-property

**SMB:** restaurant, retail, healthcare, real-estate, fitness,
professional-services, home-services

**Agency:** marketing, design, development, consulting

### 1.3 Preset Architecture

```
PresetConfig
  ├── id: string
  ├── name: string
  ├── description: string
  ├── category: "law-firm" | "small-business" | "agency"
  ├── tokens: ThemeTokenOverrides
  │     ├── spacing: { unit, scale, containerMax, sectionPadding }
  │     ├── typography: { fontFamily.heading/body/mono, scale, lineHeight, letterSpacing }
  │     ├── radius: { base, button, card, input, badge }
  │     ├── shadows: { sm, md, lg, xl }
  │     ├── buttons: { height, padding, fontSize }
  │     └── colors: Record<string, string>
  ├── preview?: { thumbnail, description }
  └── tags?: string[]
```

### 1.4 Vertical Pack Architecture

```
VerticalPack
  ├── type: BusinessType
  ├── label: string
  ├── recommendedPresets: string[]
  ├── validators: ValidatorConfig[]
  ├── defaultSections: SectionConfig[]
  ├── copyTemplates: CopyTemplate[]
  ├── seoDefaults: SEOConfig
  ├── structuredData: StructuredDataTemplate
  └── trustBadges: Badge[]
```

---

## 2. Template Contract

### 2.1 Required Inputs

```typescript
interface TemplateInput {
  siteType: "law-firm" | "small-business" | "agency";
  businessType: BusinessType;
  presetId: string;
  businessName: string;
  tagline?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: AddressInput;
  services: string[];       // min 1, max 12
  heroStyle: "default" | "video" | "split" | "minimal";
  colorOverrides?: Partial<ThemeTokenOverrides["colors"]>;
  logoUrl?: string;
  enableBlog?: boolean;
  enableContactForm?: boolean;
  legalDisclaimer: "auto" | "custom";
  customDisclaimer?: string;
}
```

### 2.2 Required Outputs

```typescript
interface TemplateOutput {
  siteId: string;           // crypto.randomUUID()
  manifest: SiteManifest;   // full site descriptor
  files: GeneratedFile[];   // all output artifacts
  themeTokens: ThemeTokenOverrides;
  validation: ValidationResult;
  hashes: Record<string, string>; // SHA-256 per file
  auditTrail: AuditEntry[];
  watermark?: WatermarkConfig;   // null if owner site
  previewUrl?: string;           // signed URL if demo
}
```

### 2.3 Constraints

| Rule | Enforcement |
|------|-------------|
| All generated files MUST be hashed (SHA-256) | `static-export.ts` pipeline |
| All generation events MUST be audit-logged | Append to audit ledger |
| Template originals are IMMUTABLE | Copy-on-generate, never mutate presets |
| No PII in generated site content | Validation step strips PII patterns |
| Demo sites MUST be watermarked | Watermark injected during render phase |
| Output MUST be reproducible from inputs | Deterministic pipeline, seeded randomness |
| Maximum generated site size: 10 MB | Validation gate before output |

---

## 3. Template Safe Subset (for Preview)

When generating a preview (not a full site), the following constraints
apply:

| Attribute | Full Site | Preview |
|-----------|-----------|---------|
| Pages generated | All routes | Home + 1 inner page |
| Assets included | All (images, fonts, data) | Placeholder images only |
| Contact form | Functional | Disabled (display-only) |
| Analytics | Owner-configured | Disabled |
| SEO metadata | Full | `noindex, nofollow` |
| Watermark | None (owner site) | Required visible overlay |
| Legal disclaimer | Full | Auto-generated notice |
| Export capability | Full static bundle | Disabled |
| TTL | Indefinite | 24 hours |
| Storage | Persistent KV | Ephemeral cache |

---

## 4. Generation Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                    SITE GENERATION PIPELINE                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. INPUT VALIDATION                                             │
│     ├── Schema validation (TemplateInput)                        │
│     ├── Business type ↔ site type compatibility check            │
│     ├── Preset existence check                                   │
│     ├── PII pattern scan on free-text fields                     │
│     └── Output: ValidatedInput | ValidationError                 │
│                                                                  │
│  2. SCAFFOLD                                                     │
│     ├── Load vertical pack for businessType                      │
│     ├── Apply preset tokens                                      │
│     ├── Apply color overrides (clamped to contrast ratios)       │
│     ├── Generate page routes from defaultSections                │
│     ├── Generate copy from copyTemplates                         │
│     └── Output: SiteScaffold                                     │
│                                                                  │
│  3. RENDER                                                       │
│     ├── Generate HTML pages from scaffold + sections             │
│     ├── Generate CSS from resolved tokens                        │
│     ├── Generate site.json manifest                              │
│     ├── Generate robots.txt + sitemap.xml                        │
│     ├── Generate legal disclaimers                               │
│     ├── Inject structured data (JSON-LD)                         │
│     └── Output: RenderedSite                                     │
│                                                                  │
│  4. WATERMARK (conditional)                                      │
│     ├── IF preview OR demo: inject CSS overlay watermark         │
│     ├── Add meta tag: <meta name="evident-demo" content="true">  │
│     ├── Add watermark config to manifest                         │
│     ├── Disable all forms and CTAs                               │
│     └── Output: WatermarkedSite | RenderedSite                   │
│                                                                  │
│  5. HASH & SIGN                                                  │
│     ├── SHA-256 hash each generated file                         │
│     ├── Generate integrity manifest (hash → filename)            │
│     ├── Sign manifest with site generation key                   │
│     └── Output: SignedSite                                       │
│                                                                  │
│  6. STORE & AUDIT                                                │
│     ├── Persist to KV (or ephemeral cache for previews)          │
│     ├── Write audit entry: site_generated                        │
│     ├── Write audit entry: files_hashed                          │
│     ├── Return signed preview URL (if applicable)                │
│     └── Output: TemplateOutput                                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.1 Existing Pipeline (static-export.ts)

The current `static-export.ts` already implements steps 1, 3, 5, and 6
partially:

```
validate site config
  → render HTML from sections
  → write site.json snapshot
  → write CNAME
  → SHA-256 hash all files
  → write audit trail
```

**Gaps to fill:**
- Step 2 (Scaffold) — currently the scaffold is implicit in the admin UI
- Step 4 (Watermark) — no watermark injection exists
- Step 5 — hashing exists but no signing
- Step 6 — ephemeral preview storage not implemented

### 4.2 Determinism Guarantee

All generation steps MUST be deterministic given the same
`TemplateInput`. This means:

- No `Date.now()` in content generation (use input timestamp)
- No `Math.random()` (use seeded PRNG from siteId)
- No network-dependent content (all assets bundled or referenced by
  content-hash URL)
- CSS class names derived from tokens, not generated randomly

---

## 5. Abuse Prevention in Generation

| Threat | Mitigation |
|--------|------------|
| Spam generation | Rate limit: 5 sites / IP / hour |
| Oversized input | Max 10 KB input payload |
| XSS in business name/tagline | Strict HTML escaping, CSP headers |
| Resource exhaustion | Max 10 MB output, 30-second timeout |
| Template enumeration | Preview tokens are signed + time-limited |
| Source code leakage | Generated sites contain NO source code, only rendered HTML/CSS |

---

## 6. Integration Points

| System | Direction | Data |
|--------|-----------|------|
| SiteRegistry | Write | New site record |
| Site Validation | Read | Validation rules |
| Vertical Packs | Read | Section configs, copy, SEO |
| Presets | Read | Theme tokens |
| Static Export | Write | Generated files |
| Audit Ledger | Append | generation events |
| Preview Panel | Read | Preview artifacts |
| Offers Config | Read | Pricing tiers for CTA |

---

## Non-Goals

- This spec does NOT define the visitor-facing preview UI (see
  PREVIEW_PANEL_PRODUCT_SPEC.md).
- This spec does NOT describe the admin UI for template selection (that
  exists in Frameworks tab already).
- This spec does NOT address custom template authoring by end users.
- This spec does NOT define a marketplace or template store.
