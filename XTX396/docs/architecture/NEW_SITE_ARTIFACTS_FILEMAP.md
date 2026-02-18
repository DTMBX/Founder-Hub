# New Site Artifacts File Map

> Architecture Planning — Session B (Supplement)  
> Status: PLANNING ONLY — no implementation  
> Date: 2026-02-18

---

## 1. Generated Site Directory Structure

When the generation pipeline produces a new site, the following file
tree is emitted. Every file is hashed (SHA-256) and recorded in the
integrity manifest.

```
{siteId}/
├── manifest.json                 # Site manifest (see §2)
├── integrity.json                # SHA-256 hashes for all files (see §3)
├── index.html                    # Home page
├── about/
│   └── index.html                # About page
├── services/
│   └── index.html                # Services listing page
├── contact/
│   └── index.html                # Contact page (form disabled in preview)
├── blog/                         # (only if enableBlog === true)
│   └── index.html                # Blog index (placeholder in preview)
├── legal/
│   ├── disclaimer.html           # Auto-generated or custom legal disclaimer
│   ├── privacy.html              # Privacy notice stub
│   └── terms.html                # Terms of service stub
├── assets/
│   ├── css/
│   │   ├── tokens.css            # Resolved theme tokens (CSS custom properties)
│   │   └── main.css              # Site stylesheet
│   ├── images/
│   │   ├── logo.svg              # Uploaded or placeholder logo
│   │   ├── hero.webp             # Hero image (placeholder in preview)
│   │   ├── og-image.png          # Open Graph image (1200×630)
│   │   └── favicon.ico           # Favicon
│   └── fonts/                    # (only if custom fonts configured)
│       └── *.woff2
├── data/
│   ├── site.json                 # Full site configuration snapshot
│   ├── sections.json             # Ordered section definitions
│   ├── copy.json                 # Generated copy from vertical templates
│   ├── seo.json                  # SEO metadata (title, description, keywords)
│   └── structured-data.json      # JSON-LD templates for schema.org markup
├── config/
│   ├── theme-tokens.json         # Raw ThemeTokenOverrides used in generation
│   ├── preset-ref.json           # Reference to source preset (id + version hash)
│   ├── vertical-ref.json         # Reference to source vertical pack
│   ├── watermark.json            # Watermark config (null for owner sites)
│   └── generation-meta.json      # Pipeline metadata (see §4)
├── audit/
│   └── generation-log.json       # Audit trail for this generation (see §5)
├── robots.txt                    # Search engine directives
├── sitemap.xml                   # XML sitemap
├── CNAME                         # Custom domain (empty in preview)
└── _headers                      # Security headers (CSP, X-Frame-Options)
```

---

## 2. manifest.json

```json
{
  "version": "1.0.0",
  "siteId": "uuid-v4",
  "siteType": "law-firm | small-business | agency",
  "businessType": "personal-injury",
  "businessName": "Smith & Associates",
  "presetId": "classic-authority",
  "verticalPackId": "personal-injury",
  "status": "draft | demo | private | unlisted | public",
  "createdAt": "ISO-8601",
  "createdBy": "owner-id | preview-session",
  "generationVersion": "pipeline-semver",
  "fileCount": 28,
  "totalSizeBytes": 524288,
  "integrityHash": "sha256-of-integrity.json",
  "watermarked": false,
  "ttl": null,
  "pages": [
    { "route": "/", "title": "Home", "file": "index.html" },
    { "route": "/about", "title": "About", "file": "about/index.html" },
    { "route": "/services", "title": "Services", "file": "services/index.html" },
    { "route": "/contact", "title": "Contact", "file": "contact/index.html" }
  ],
  "features": {
    "blog": false,
    "contactForm": true,
    "analytics": false,
    "customDomain": false
  }
}
```

---

## 3. integrity.json

```json
{
  "algorithm": "sha256",
  "generatedAt": "ISO-8601",
  "siteId": "uuid-v4",
  "files": {
    "index.html": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "about/index.html": "...",
    "assets/css/tokens.css": "...",
    "manifest.json": "..."
  },
  "manifestHash": "sha256-of-this-file-excluding-manifestHash-field"
}
```

Integrity verification: any consuming system can re-hash files and
compare against this manifest. The `manifestHash` field is computed
over all other fields and used as the top-level integrity check.

---

## 4. generation-meta.json

```json
{
  "pipelineVersion": "1.0.0",
  "inputHash": "sha256-of-serialized-TemplateInput",
  "steps": [
    { "name": "validate", "durationMs": 12, "status": "pass" },
    { "name": "scaffold", "durationMs": 45, "status": "pass" },
    { "name": "render", "durationMs": 230, "status": "pass" },
    { "name": "watermark", "durationMs": 8, "status": "skipped" },
    { "name": "hash", "durationMs": 15, "status": "pass" },
    { "name": "store", "durationMs": 50, "status": "pass" }
  ],
  "totalDurationMs": 360,
  "deterministic": true,
  "seed": "derived-from-siteId"
}
```

---

## 5. generation-log.json

```json
{
  "siteId": "uuid-v4",
  "entries": [
    {
      "timestamp": "ISO-8601",
      "action": "site_generation_started",
      "actor": "owner-id | preview-session-token",
      "correlationId": "uuid-v4",
      "metadata": { "siteType": "law-firm", "presetId": "classic-authority" }
    },
    {
      "timestamp": "ISO-8601",
      "action": "validation_passed",
      "correlationId": "uuid-v4",
      "metadata": { "warnings": [] }
    },
    {
      "timestamp": "ISO-8601",
      "action": "site_generation_completed",
      "correlationId": "uuid-v4",
      "metadata": {
        "fileCount": 28,
        "totalSizeBytes": 524288,
        "integrityHash": "sha256..."
      }
    }
  ]
}
```

---

## 6. Preview vs. Owner Artifact Differences

| Artifact | Owner Site | Preview/Demo Site |
|----------|-----------|-------------------|
| `manifest.json` → status | `draft` (initially) | `demo` |
| `manifest.json` → watermarked | `false` | `true` |
| `manifest.json` → ttl | `null` | `"PT24H"` (24 hours) |
| `config/watermark.json` | `{ "enabled": false }` | `{ "enabled": true, "text": "DEMO — Not for production", "opacity": 0.12, "rotation": -30, "repeat": true }` |
| `robots.txt` | Standard allow rules | `Disallow: /` |
| HTML `<meta>` | Standard SEO tags | `<meta name="robots" content="noindex, nofollow">` + `<meta name="evident-demo" content="true">` |
| Contact form | Functional | Display-only (inputs disabled, no action) |
| Analytics scripts | Owner-configured | Absent |
| CNAME | Custom domain | Empty |
| `_headers` → CSP | Standard | Adds `frame-ancestors 'self' *.evident.tech` |

---

## 7. File Size Budget

| Category | Max Size | Notes |
|----------|----------|-------|
| HTML pages (all) | 500 KB | Compressed |
| CSS (all) | 100 KB | Two files |
| Images | 5 MB | Placeholder images for preview ≤ 200 KB total |
| Data JSON (all) | 200 KB | site.json, sections, copy, seo, structured-data |
| Config JSON (all) | 50 KB | theme-tokens, preset-ref, vertical-ref, watermark, meta |
| Audit log | 50 KB | Growth-limited per generation |
| Fonts (optional) | 2 MB | Max 2 font families, woff2 only |
| **Total** | **10 MB** | Hard limit enforced at hash step |

---

## 8. Storage Keys (KV Layout)

For sites stored in the current localStorage-based SiteRegistry, the
key pattern is:

```
sites:index                          → SiteIndexEntry[]
sites:{siteId}:data                  → SiteData (manifest.json content)
sites:{siteId}:files:{path}          → File content (base64 for binary)
sites:{siteId}:integrity             → integrity.json
sites:{siteId}:audit                 → generation-log.json
sites:{siteId}:config:theme          → theme-tokens.json
sites:{siteId}:config:watermark      → watermark.json
sites:{siteId}:config:meta           → generation-meta.json
```

**Preview-specific keys** (ephemeral, TTL-enforced):

```
previews:{sessionToken}:manifest     → Preview manifest (24h TTL)
previews:{sessionToken}:files:{path} → Preview file content (24h TTL)
previews:{sessionToken}:meta         → Preview session metadata
```

---

## Non-Goals

- This file map does NOT define the admin UI for browsing generated
  artifacts.
- This file map does NOT define deployment targets (Cloudflare Pages,
  Netlify, etc.).
- This file map does NOT define a content update mechanism — only
  initial generation artifacts.
