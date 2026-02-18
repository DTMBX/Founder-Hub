# B23 — Baseline Gaps

Gaps identified in existing B21/B22 blueprints relative to B23 quality standard.

## Missing from ALL Blueprints

| Requirement | Status |
|-------------|--------|
| FAQ section (required) | Only law_firm has it as optional |
| Testimonials section (required) | Only law_firm has it as optional |
| Lead capture with consent + rate limit | Not declared |
| sitemap.xml, robots.txt in SEO | Not referenced |
| OG preview config | seo_profile exists but no og_image_url |
| schema.org baseline | schema_type exists but no structured data |
| About section on all | Exists in most but not as required cross-check |
| Services/Offerings section | Exists but naming varies |
| Primary + Secondary CTA | Only one CTA block per blueprint |
| Privacy page stub | Compliance block exists, no dedicated page |
| Terms page stub | Only agency has terms-of-service block |
| Complementary minimum (6) | Not enforced |

## Per-Blueprint Gaps

### Law Firm
- Missing: Case Results page (has 4 pages, needs 5+)
- Missing: Team page (attorneys on About only)
- Missing: FAQ as required section
- Missing: Testimonials as required section
- Missing: case-results-table not in required_components
- Missing: Document/download card section

### Agency
- Missing: FAQ section
- Missing: Testimonials section
- Missing: Trust badges
- Missing: Metrics/stats section
- Missing: Process timeline in required

### Contractor
- Missing: FAQ section
- Missing: Testimonials section
- Missing: Project showcase page
- Missing: Before/after slider
- Missing: Estimate CTA emphasis

### Nonprofit
- Missing: FAQ section
- Missing: Testimonials section
- Missing: Timeline for org history
- Missing: Event/program details

### Professional Services
- Missing: FAQ section
- Missing: Testimonials section
- Missing: Appointment booking emphasis
- Missing: Comparison/pricing section

## Wizard Gaps

- No wizard code exists (greenfield)
- No step validation models
- No "Professional Defaults" toggle
- No publish-readiness checklist

## Preview Gaps

- No device toggle model
- No curated hero variants per blueprint
- No share-link model beyond existing PreviewService
- Watermark enforced in pipeline but no completeness guarantee

## Generation Completeness Gaps

- No check that all required_pages produced
- No check that all required_sections included
- No SEO artifact verification
- No audit.jsonl generation event logging
