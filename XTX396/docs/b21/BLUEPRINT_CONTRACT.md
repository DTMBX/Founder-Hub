# Blueprint Contract — B21-P2

> Defines the data contract for site blueprints used by the generation pipeline.

---

## Overview

A **Blueprint** is a JSON document that defines everything required to generate
a professional site for a specific business type. Blueprints are the single
source of truth for what pages, sections, components, compliance blocks, and
content thresholds a generated site must satisfy.

## Schema

The canonical schema lives at:

```
apps/sitegen/blueprints/Blueprint.schema.json
```

All blueprint files reference this schema via `$schema`.

## Catalog

The master index lives at:

```
apps/sitegen/blueprints/catalog.json
```

Each entry maps a blueprint `id` to its filename, site type, and business type.

## Available Blueprints

| ID | Name | Site Type | Business Type |
|----|------|-----------|---------------|
| `law-firm` | Law Firm | law-firm | lawfirm_general |
| `agency` | Digital Agency | agency | agency_general |
| `contractor` | Contractor / Trades | small-business | smb_contractor |
| `nonprofit` | Nonprofit Organization | small-business | smb_nonprofit |
| `professional-services` | Professional Services | small-business | smb_medical |

## Blueprint Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | string | Yes | Unique identifier (kebab/snake, 3-49 chars) |
| `name` | string | Yes | Human-readable name |
| `version` | string | Yes | Semver |
| `business_type` | string | Yes | Maps to vertical registry BusinessType |
| `site_type` | enum | Yes | `law-firm`, `small-business`, or `agency` |
| `audience` | string | Yes | Target audience description |
| `required_pages` | Page[] | Yes | Pages that MUST exist |
| `required_sections` | Section[] | Yes | Sections that MUST exist |
| `required_components` | string[] | Yes | Component IDs that MUST render |
| `optional_components` | string[] | Yes | Component IDs that MAY render |
| `style_presets` | string[] | Yes | Compatible preset IDs |
| `compliance_blocks` | ComplianceBlock[] | Yes | Regulatory/professional blocks |
| `content_requirements` | ContentRequirements | Yes | Minimum thresholds (fail-closed) |
| `demo_watermark_profile` | WatermarkProfile | Yes | Demo watermark settings |
| `seo_profile` | SEOProfile | Yes | SEO defaults |
| `feature_flags` | Record<string, boolean> | Yes | Toggle optional behaviors |

## Fail-Closed Invariant

**Generation MUST fail if any `content_requirements` field is not satisfied.**

This is enforced at the pipeline validation step. The pipeline will not produce
output if:

- The number of pages is below `min_pages`
- The number of sections is below `min_sections`
- Any page has fewer words than `min_words_per_page`
- `require_contact_info` is `true` and no contact method is provided
- `require_business_name` is `true` and no business name is set
- `require_address` is `true` and no address is provided
- `require_hours` is `true` and no business hours are provided

## Cross-Blueprint Invariants

Every blueprint MUST:

1. Include `site-header`, `site-footer`, and `nav-bar` in `required_components`
2. Include a `contact` page in `required_pages`
3. Include `hero-banner` and `cta-block` in `required_components`
4. Have `demo_watermark_profile.enabled` set to `true`
5. Have `feature_flags.safe_mode` set to `true`
6. Include at least a `privacy` and `accessibility` compliance block

## Adding a New Blueprint

1. Create a new JSON file in `apps/sitegen/blueprints/`
2. Reference `$schema: "./Blueprint.schema.json"`
3. Add an entry to `catalog.json`
4. Add the filename to the `BLUEPRINT_FILES` array in the test file
5. Run `npx vitest run apps/sitegen/blueprints` — all tests must pass
6. Commit

## Test Coverage

Tests validate:

- Schema structural integrity
- Catalog consistency
- Per-blueprint field validation (every field checked)
- Cross-blueprint invariants (universal requirements)
- Fail-closed content validation (pipeline simulation)
