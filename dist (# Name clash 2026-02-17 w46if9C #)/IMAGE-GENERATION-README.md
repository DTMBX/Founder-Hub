# Image Asset Generation for xTx396

This directory contains tools to generate OG preview images and favicons for the xTx396 Founder Hub.

## Quick Start

### Option 1: Automated Generation (Recommended)

1. Open `public/generate-images.html` in your browser
2. Images will automatically generate and download
3. Move the downloaded files to the `/public` directory:
   - `og-preview.png` (1200x630px)
   - `favicon-32x32.png` (32x32px)
   - `apple-touch-icon.png` (180x180px)

### Option 2: Manual Generation

1. Open `public/og-image-generator.html` in your browser
2. Click the download buttons for each image type
3. Save files to `/public` directory

## What Gets Generated

### OG Preview Image (og-preview.png)
- **Dimensions:** 1200x630px
- **Purpose:** Social media sharing (Twitter, LinkedIn, Facebook)
- **Content:** 
  - xTx monogram watermark
  - Devon Tyler Barber name
  - "Founder & Innovator" tagline
  - Mission statement
  - xTx396.com domain
- **Design:** Dark theme with emerald accent (#9de0ad)

### Favicon (favicon-32x32.png)
- **Dimensions:** 32x32px
- **Purpose:** Browser tab icon
- **Content:** Simple "xTx" monogram on dark background

### Apple Touch Icon (apple-touch-icon.png)
- **Dimensions:** 180x180px
- **Purpose:** iOS home screen icon, PWA icon
- **Content:** "xTx396" monogram with accent border

## Files Already Referenced in HTML

The following files are already referenced in `/index.html`:

```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<meta property="og:image" content="/og-preview.png" />
```

Once you generate and place the files in `/public`, they will automatically be used.

## Design Specifications

### Color Palette
- **Background:** `#0a0e1a` (dark slate)
- **Gradient accent:** `#12172b` 
- **Primary accent:** `#9de0ad` (emerald)
- **Text primary:** `#f0f3f5` (off-white)
- **Text muted:** `rgba(240, 243, 245, 0.75)`

### Typography
- **Monogram:** Bold 180px sans-serif (large), 48px (Apple icon)
- **Name:** Bold 64px sans-serif
- **Tagline:** 500 weight 32px sans-serif
- **Body:** 400 weight 24px sans-serif
- **Domain:** 500 weight 22px monospace

### Visual Elements
- Dot pattern background (40px spacing, 1.5px dots, 8% opacity)
- Gradient accent line (horizontal divider)
- Soft gradients for depth
- High contrast for readability

## Testing Your Images

### Test OG Preview
1. Use [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
2. Use [Twitter Card Validator](https://cards-dev.twitter.com/validator)
3. Use [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)

### Test Favicons
1. Deploy your site
2. Open in browser and check tab icon
3. Add to iOS home screen and check icon appearance
4. Test in both light and dark browser themes

## Manual Editing

If you need to customize the images:

1. Open `public/og-image-generator.html`
2. Edit the canvas drawing code in the `<script>` section
3. Modify colors, text, fonts, or layout
4. Regenerate and download

## Troubleshooting

**Images not showing up?**
- Ensure files are in `/public` directory (not `/public/og-images/` or elsewhere)
- Check file names match exactly (case-sensitive)
- Clear browser cache and hard reload (Cmd+Shift+R / Ctrl+Shift+R)

**OG preview not updating on social media?**
- Social platforms cache images aggressively
- Use the platform's cache-clearing tools linked above
- Add a query parameter to force refresh: `og-preview.png?v=2`

**Images look pixelated?**
- Ensure you're generating at exact dimensions (1200x630, 32x32, 180x180)
- Use PNG format, not JPEG
- Don't resize generated images - regenerate at correct size

## Next Steps

After generating images:

1. ✓ Place files in `/public` directory
2. ✓ Files are already referenced in `index.html`
3. Test social sharing with the tools above
4. Update design via admin when needed (future feature)

## Future Enhancements

Planned features:
- Admin panel for OG image customization
- Dynamic OG images per page/case
- Animated favicon support
- Multiple icon sizes for different platforms
- Logo variant generator
