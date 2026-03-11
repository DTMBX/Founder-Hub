# Hugo — Founder Hub Static Site Generator

Bounded subproject for generating static HTML sites from Founder Hub data.

## Prerequisites

- [Hugo Extended](https://gohugo.io/installation/) v0.147+ (`winget install Hugo.Hugo.Extended`)
- PowerShell 7+ (ships with Windows 11, or install via `winget install Microsoft.PowerShell`)

## Quick Start

```powershell
# From repo root:

# Build production sites
pwsh scripts/hugo-build.ps1

# Start dev server with live reload
pwsh scripts/hugo-build.ps1 -Serve

# Clean build
pwsh scripts/hugo-build.ps1 -Clean

# Sync data only (no build)
pwsh scripts/hugo-data-sync.ps1
```

## Or via npm scripts

```bash
npm run hugo:build     # Production build
npm run hugo:serve     # Dev server
npm run hugo:clean     # Clean + build
npm run hugo:sync      # Data sync only
```

## Architecture

```
hugo/
├── config/           # Hugo configuration (per-environment)
├── content/          # Markdown content (blog posts, pages)
│   ├── blog/         # Blog posts (new capability)
│   └── _index.md     # Homepage
├── data/sites/       # Auto-synced from public/data/ (JSON)
├── layouts/          # Go templates (ported from static-renderer.ts)
│   ├── _default/     # Base layouts
│   ├── law-firm/     # Law firm site type
│   ├── small-business/ # SMB site type
│   ├── agency/       # Agency site type (dark theme)
│   ├── blog/         # Blog list + single post
│   └── partials/     # Shared: nav, footer, SEO head
├── assets/css/       # Hugo-processed CSS
├── static/           # Static files (images, etc.)
└── public/           # Build output (gitignored)
```

## Data Flow

1. Admin panel edits data → saved as JSON in `public/data/`
2. `hugo-data-sync.ps1` copies JSON into `hugo/data/sites/`
3. Hugo templates read JSON via `.Site.Data.sites.*`
4. `hugo build` generates multi-page HTML in `hugo/public/`
5. Output copied to `dist/sites/` for deployment

## Adding a New Site Type

1. Create `layouts/{type}/single.html` with `{{ define "main" }}`
2. Add data factory in `site-registry.ts` (React side)
3. Add corresponding JSON data files
4. Templates use `{{ .Site.Data.sites.* }}` to access data

## Relationship to Existing SSG

- `scripts/generate-static-sites.mjs` — Legacy CI-time renderer (single-page, inline styles)
- `src/lib/static-renderer.ts` — Browser-side renderer (for in-app preview/export)
- `hugo/` — This system (multi-page, proper templates, blog, RSS, sitemap)

All three coexist. Hugo does not replace the browser-side renderer.

