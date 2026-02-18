# Blueprint Quality Standard

## Purpose

Every blueprint must meet a baseline quality standard before it can be used by
the operator wizard or published. This ensures professional output regardless of
which business type is selected.

## Required Component Sets

### Core UX (must be in required_components)

| Component | Registry ID |
|-----------|------------|
| Hero | `hero-banner` |
| Sticky header | `site-header` |
| Mobile nav | `nav-bar` |
| Footer | `site-footer` |
| CTA block | `cta-block` |
| Contact form | `contact-form` |
| FAQ section | `faq-accordion` |
| Testimonials | `testimonial-carousel` |
| Trust badges | `trust-badge-row` |

### Content (must be in required_sections or required_pages)

| Requirement | Validation |
|-------------|-----------|
| About section | Page with slug `about` OR section with component `text-block` labeled "About" |
| Services/Offerings | Page or section using `service-list`, `icon-card-grid`, or `card-grid` |
| Primary CTA | At least one `cta-block` section with required=true |
| Contact section | Page with slug `contact` containing `contact-form` |

### SEO (must be in seo_profile)

| Field | Required |
|-------|----------|
| title_pattern | Yes |
| description_pattern | Yes |
| schema_type | Yes |
| og_image_pattern | Yes |
| keywords | Yes (min 3) |

### Compliance (must be in compliance_blocks)

| Block | Required |
|-------|----------|
| Privacy policy | Always |
| Terms | Always |
| Disclaimer | Business-type dependent |
| Accessibility | Always |

### Watermark (must be in demo_watermark_profile)

| Field | Required |
|-------|----------|
| enabled | Must be `true` |
| text | Non-empty |
| opacity | 0 < value ≤ 1 |
| position | Valid position value |

## Complementary Set (minimum 6 from this list)

A blueprint must include at least 6 of these in either `required_components`
or `optional_components`:

| Component | Registry ID |
|-----------|------------|
| Metrics strip | `stats-counter` |
| Comparison/pricing | `pricing-table` |
| Timeline | `process-timeline` |
| Team section | `team-grid` |
| Gallery/portfolio | `image-gallery`, `portfolio-grid`, or `project-showcase` |
| Blog cards | `blog-feed` |
| Document/download cards | `case-results-table` |
| Before/after slider | `before-after-slider` |
| Logo bar | `logo-bar` or `partner-logo-bar` |
| Social proof bar | `social-proof-bar` |
| Badge grid | `badge-grid` |
| Hours widget | `hours-widget` |
| Event list | `event-list` |

## Fail-Closed

If any blueprint fails quality validation:
- Catalog build rejects it
- Wizard refuses to load it
- Publish is blocked

No partial compliance. No overrides.
