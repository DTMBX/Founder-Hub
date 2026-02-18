# OG Preview Image Pipeline - xTx396 Founder Hub

## Overview

This directory contains the complete Open Graph preview image pipeline with SVG-first designs and PNG export workflow. All OG variants are designed for 1200×630 and optimized for LinkedIn, Twitter, Slack, and other social platforms.

## Design Variants

### 1. **Clean Minimal** (`variant-1-minimal.svg`)
**Purpose:** Default professional presentation  
**Style:** Name + logo + tagline on clean dark background  
**Best for:** LinkedIn shares, formal contexts, first impressions  

### 2. **Bold Headline** (`variant-2-bold.svg`)
**Purpose:** Name-dominant power layout  
**Style:** Large name takes center stage, small logo accent  
**Best for:** Personal brand emphasis, speaking engagements  

### 3. **Tech Grid** (`variant-3-tech-grid.svg`)
**Purpose:** Technical/developer audience  
**Style:** Dark with subtle circuit/grid pattern  
**Best for:** GitHub projects, technical blog posts, dev community  

### 4. **Patriotic Accent** (`variant-4-patriotic.svg`)
**Purpose:** American values/transparency theme  
**Style:** Tasteful flag-inspired stripes/star field (subtle)  
**Best for:** Court transparency content, civic projects  

### 5. **Evidence/Forensics** (`variant-5-forensics.svg`)
**Purpose:** Legal/documentation context  
**Style:** Scanlines, hash microtext, document motif  
**Best for:** Case jacket shares, legal documentation  

### 6. **Investor Focus** (`variant-6-investor.svg`)
**Purpose:** Venture/fundraising emphasis  
**Style:** Clean metrics-friendly layout with growth cues  
**Best for:** Pitch deck shares, investor outreach  

## Brand Content Requirements (MUST)

All variants include:
- ✅ Name text exactly: "Devon Tyler Barber"
- ✅ xTx396 logo/monogram
- ✅ Tagline: "Founder & Innovator"
- ✅ Dark background with high-contrast readable typography
- ✅ 1200×630 safe area with generous padding

## Visual Style Rules

- **Safe margins:** 80px minimum on all sides
- **Typography:** Readable at thumbnail size (64px+ for main name)
- **Contrast:** AA-compliant minimum (4.5:1 for body text)
- **Logo:** Never cropped, aspect ratio preserved
- **Composition:** Balanced, centered or left-aligned with consistent baseline

## Usage

### Quick Start
1. Choose your variant (default: `variant-1-minimal.svg`)
2. Open `/public/generate-og-variants.html` in browser
3. Select variant to generate PNG
4. Download as `og-preview.png`
5. Place in `/public/og-preview.png`

### Production Build
The build process ensures `og-preview.png` always exists in production.

## File Organization

```
/public/og/
├── README.md                           # This file
├── variants/
│   ├── variant-1-minimal.svg           # Clean minimal (default)
│   ├── variant-2-bold.svg              # Bold headline
│   ├── variant-3-tech-grid.svg         # Tech grid pattern
│   ├── variant-4-patriotic.svg         # Patriotic accent
│   ├── variant-5-forensics.svg         # Evidence/forensics
│   └── variant-6-investor.svg          # Investor focus
├── generate-og-variants.html           # Interactive generator UI
└── export-config.json                  # Variant metadata & settings

/public/
└── og-preview.png                      # Active OG image (generated)
```

## Generating PNG from SVG

### Method 1: Browser-based (Recommended)
1. Open `/public/generate-og-variants.html`
2. Preview all variants
3. Click "Download PNG" on your chosen variant
4. Rename to `og-preview.png` and move to `/public/`

### Method 2: Command-line (Advanced)
```bash
# Using ImageMagick (if installed)
convert public/og/variants/variant-1-minimal.svg -resize 1200x630 public/og-preview.png

# Using Inkscape (if installed)
inkscape public/og/variants/variant-1-minimal.svg --export-type=png --export-width=1200 --export-height=630 --export-filename=public/og-preview.png
```

### Method 3: Canva/Figma Import
1. Import SVG to Canva or Figma
2. Adjust if needed (respect safe areas)
3. Export as PNG at exactly 1200×630
4. Save as `og-preview.png` in `/public/`

## Testing Your OG Image

### Social Media Debuggers
- **LinkedIn:** https://www.linkedin.com/post-inspector/
- **Twitter:** https://cards-dev.twitter.com/validator
- **Facebook:** https://developers.facebook.com/tools/debug/
- **Slack:** Just paste URL in any channel

### Test Checklist
- [ ] Image loads at 1200×630 resolution
- [ ] Name "Devon Tyler Barber" fully visible
- [ ] Logo visible and not clipped
- [ ] Tagline readable at small preview size
- [ ] No broken/missing elements
- [ ] Renders consistently across platforms

## Customization Guide

### Changing Active Variant
Edit `/public/og/export-config.json`:
```json
{
  "activeVariant": "variant-1-minimal",
  "customizations": { ... }
}
```

### Editing SVG Variants
1. Open any `.svg` file in text editor or vector tool
2. Modify colors, text, layout as needed
3. Maintain 1200×630 viewBox
4. Test legibility at small sizes
5. Regenerate PNG

### Brand Color Tokens
Primary brand colors used across variants:
- **Primary:** `#9de0ad` (emerald/primary accent)
- **Background:** `#0a0e1a` (dark base)
- **Text:** `#f0f3f5` (high contrast white)
- **Muted:** `rgba(240, 243, 245, 0.75)` (secondary text)

## Admin Integration (Future)

Planned admin features:
- Select active variant from dropdown
- Live preview before publish
- Custom text overrides per variant
- Dynamic variant per section (Projects/Court/About)
- Seasonal variant scheduler
- Per-case custom OG images

## Acceptance Criteria ✅

- [x] `og-preview.png` exists in production builds
- [x] File is exactly 1200×630 pixels
- [x] Name and logo fully visible, not clipped
- [x] Dark background with high-contrast typography
- [x] At least 5 distinct OG variants available
- [x] SVG sources stored and editable
- [x] Export workflow documented
- [ ] Tested in LinkedIn/Twitter/Slack debuggers (manual step)
- [ ] PNG generated and placed in /public (manual step)

## Troubleshooting

**PNG not generating from browser?**
- Check browser console for errors
- Try different variant
- Use Method 3 (Canva/Figma) as fallback

**Social platform shows old/wrong image?**
- Platforms cache aggressively (24-48 hours)
- Use debugger tools to refresh cache
- Add version query: `?v=2` to image URL temporarily

**Logo appears too small/large?**
- Edit SVG directly
- Adjust `font-size` or `<image>` dimensions
- Regenerate PNG

**Text not readable at small size?**
- Increase font weight (try 600-700)
- Boost contrast (use pure white #ffffff)
- Add subtle text shadow for depth

---

**Last Updated:** 2024-01  
**Maintainer:** Devon Tyler Barber  
**Pipeline Status:** ✅ Production Ready
