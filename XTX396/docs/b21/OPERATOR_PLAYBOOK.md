# Operator Playbook — B21

> Step-by-step field guide for operators generating sites through the B21 system.

---

## Prerequisites

- Active operator account with `operator` role assigned.
- Access to the Operator Mode interface.
- Awareness of the business type being served.

## Workflow Overview

```
1. Select Blueprint  →  Choose the business type (law firm, agency, etc.)
2. Enter Details     →  Business name, contact, address, hours
3. Add Content       →  Page content (titles, body text per page)
4. Select Preset     →  Choose visual theme/preset
5. Generate          →  Pipeline runs: validate → scaffold → render → watermark → hash → store
6. Preview           →  Review watermarked preview
7. Share (optional)  →  Generate HMAC token link for client review
8. Export (optional) →  Export site package
```

## Step-by-Step

### 1. Select Blueprint

Choose from the catalog:

| Blueprint | Business Type | Pages |
|-----------|---------------|-------|
| law_firm | Law Firm | Home, About, Practice Areas, Contact |
| agency | Agency | Home, About, Portfolio, Contact |
| contractor | Contractor | Home, About, Services, Contact |
| nonprofit | Nonprofit | Home, About, Programs, Donate, Contact |
| professional_services | Professional Services | Home, About, Services, Contact |

Each blueprint defines required pages, sections, components, and compliance blocks.

### 2. Enter Business Details

Required fields vary by blueprint:

| Field | Always Required | Notes |
|-------|----------------|-------|
| Business Name | Yes | |
| Contact Info | Yes | Email or phone |
| Address | Some blueprints | Check content_requirements |
| Hours | Some blueprints | Check content_requirements |

### 3. Add Page Content

For each required page, provide:
- **Title** (optional — defaults to blueprint title)
- **Body text** (minimum word count per blueprint)

### 4. Select Preset

Choose a style preset. Available presets are defined per blueprint
in the `style_presets` field.

### 5. Generate Site

The pipeline runs automatically:

1. **Validate** — Checks all required fields and word counts. If anything fails, you see error messages.
2. **Scaffold** — Builds the page/section structure.
3. **Render** — Produces HTML with proper escaping.
4. **Watermark** — Applies demo watermark overlay.
5. **Hash** — Computes SHA-256 for every file.
6. **Store** — Saves the site record.

### 6. Review Preview

The preview shows the generated site with a watermark overlay.
The watermark reads "PREVIEW — NOT A LIVE SITE" and is:
- Non-interactive (pointer-events: none)
- Screen-reader hidden (aria-hidden)
- Positioned per blueprint profile

### 7. Share with Client (Optional)

Generate a share link with an HMAC-signed token:
- Default TTL: 24 hours
- Token is bound to the specific site and your operator ID
- Rate-limited to prevent abuse

### 8. Export (Optional)

Generate an export package with:
- All rendered HTML pages
- CSS and JS assets
- Manifest with SHA-256 hashes
- Deterministic manifest hash for integrity verification

## Safety Nets

### Fail-Closed Validation

The pipeline will NOT generate a site if:
- Any required field is missing or empty
- Page count is below blueprint minimum
- Word count per page is below minimum
- Operator ID or timestamp is missing

### Watermark Protection

All preview sites include a watermark. The watermark:
- Cannot be removed through the operator interface
- Is controlled by the blueprint's `demo_watermark_profile`
- Is injected server-side during the pipeline

### Rate Limiting

Preview share links are rate-limited:
- Default: 60 requests per 60-second window
- Excess requests receive "Rate limit exceeded" error

### Audit Trail

Every action is logged:
- Site generation (with all input parameters)
- Preview token creation
- Preview access (session + pages viewed)
- Exports (with manifest hash)

## Troubleshooting

| Issue | Cause | Resolution |
|-------|-------|------------|
| "businessName is required" | Empty name field | Enter business name |
| "contactInfo is required" | Missing contact | Add email or phone |
| "address is required" | Blueprint requires address | Add physical address |
| Pipeline failure | Validation errors | Review all error messages, fix inputs |
| Token expired | Share link past TTL | Generate new token |
| Rate limit exceeded | Too many preview views | Wait for window reset |
