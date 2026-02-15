# USA Flag Video Setup & Optimal Overlay Configuration

## Quick Start: Adding USA-flag.mp4

### Step 1: Place Your Video File

You have two options for adding your USA-flag.mp4 video:

#### Option A: Local Assets (Bundled with App)
1. Place `USA-flag.mp4` in `/src/assets/video/` directory
2. The file will be processed and bundled by Vite
3. Reference it in admin using the relative path

#### Option B: External CDN (Recommended for Production)
1. Upload `USA-flag.mp4` to a CDN or media hosting service (e.g., Cloudflare, AWS S3, Vercel Blob)
2. Get the direct HTTPS URL to the video
3. Enter the full URL in the admin dashboard

### Step 2: Configure in Admin Dashboard

1. Navigate to **Admin Dashboard** → **Hero Media** tab
2. Enter video URL:
   - **Local**: `/src/assets/video/USA-flag.mp4`
   - **CDN**: `https://your-cdn.com/USA-flag.mp4`
3. Set a poster image (static frame for loading/fallback)
4. Configure overlay settings (see below)

## Optimal Overlay Settings for USA Flag Video

The USA flag has bright red, white, and blue colors that can reduce text readability. Here are the **recommended settings**:

### Recommended Configuration

```
Overlay Intensity: 0.65 (65%)
Vignette: Enabled
Auto-Contrast: Enabled
Text Alignment: Center
Motion Mode: Full (with pause control)
```

### Why These Settings Work

1. **65% Overlay Intensity**: Creates a strong enough scrim to ensure white text stands out against the bright stripes and stars
2. **Vignette Enabled**: Darkens edges where the flag motion might bring bright content close to text
3. **Auto-Contrast**: Enforces minimum 60% overlay, preventing accidental reduction below readable levels
4. **Text Shadow**: Already built-in to hero text styling for additional depth

### Testing Different Overlay Values

| Overlay % | Best For | Text Readability |
|-----------|----------|------------------|
| 40-50% | Very dark videos | May struggle with flag |
| 55-60% | Moderately dark content | Marginal with flag |
| **65-70%** | **Bright patriotic content** | **✓ Recommended** |
| 75-80% | Extremely bright videos | Very safe, may feel heavy |

### Fine-Tuning Steps

1. Start with **65% overlay** and **vignette enabled**
2. Preview the hero section
3. Watch the entire video loop (check all frames)
4. Adjust up to 70% if any frames feel too bright
5. Adjust down to 60% only if text feels too dark/heavy

## Video Optimization for USA-flag.mp4

To ensure fast loading and smooth playback:

### Recommended Video Specs

```
Format: MP4 (H.264)
Resolution: 1920x1080 (1080p)
Frame Rate: 30fps
Bitrate: 1.5-2 Mbps
Duration: 10-20 seconds (loopable)
Target Size: <2MB
Audio: None (remove audio track)
```

### Compression Command (FFmpeg)

```bash
ffmpeg -i USA-flag.mp4 \
  -c:v libx264 \
  -preset slow \
  -crf 28 \
  -vf "scale=1920:1080:flags=lanczos" \
  -an \
  -movflags +faststart \
  USA-flag-optimized.mp4
```

This creates a web-optimized version with:
- Efficient H.264 encoding
- Proper resolution
- No audio (saves bandwidth)
- Fast-start metadata (plays while downloading)

## Accessibility Considerations

### Motion Settings

The flag video includes waving motion. Respect user preferences:

- **Full Motion**: Video autoplays for all users (default)
- **Reduced Motion**: Video pauses if user's OS requests reduced motion
- **Off**: Always show poster, never autoplay

### Pause/Play Control

A fixed button appears in the bottom-right corner allowing users to:
- Manually pause/play the video at any time
- Control the experience without relying on browser settings

### Poster Image Requirements

Always provide a high-quality poster image:
- Still frame from the flag video
- Same 16:9 aspect ratio (1920x1080)
- Optimized for web (<200KB)
- Same overlay/vignette settings apply for consistency

## Text Styling Best Practices

With the USA flag background, ensure maximum readability:

### Hero Headline
- **Color**: Pure white (#FFFFFF)
- **Weight**: Bold (700)
- **Shadow**: Multi-layer (built-in)
- **Letter Spacing**: Tight (-0.02em)
- **Max Length**: 1-2 lines

### Subhead
- **Color**: White with 95% opacity
- **Weight**: Medium (500)
- **Shadow**: Softer depth
- **Max Length**: 2-3 lines

### CTA Buttons
- **Style**: Glassmorphism with high contrast
- **Text**: White, bold
- **Border**: Visible outline
- **Focus**: Clear focus states

## Trinity Selector Buttons

The three pathway buttons must remain prominent:

- **High Contrast**: Glass buttons with strong borders
- **Large Touch Targets**: Minimum 120px height on mobile
- **Clear Labels**: "Investors", "Legal / Court", "About / Friends"
- **Hover/Tap States**: Immediate visual feedback

## Testing Checklist

Before going live, verify:

- [ ] Video URL is accessible (HTTPS)
- [ ] Poster image loads immediately
- [ ] Headline text readable throughout video loop
- [ ] Subhead text readable throughout video loop
- [ ] Trinity buttons remain prominent
- [ ] CTA buttons have clear contrast
- [ ] Pause/play button works
- [ ] Reduced motion shows poster only
- [ ] Mobile overlay is strong enough
- [ ] Video doesn't block page interactions
- [ ] Smooth transitions on content fade-in

## Admin Dashboard Settings Reference

Navigate to **Admin Dashboard** → **Hero Media**

### Video Configuration
- **Video URL**: Path or CDN URL to USA-flag.mp4
- **Poster URL**: Path to static poster image
- **Overlay Intensity**: Slider (0-100%), set to **65%**
- **Vignette**: Toggle (enable recommended)
- **Auto-Contrast**: Toggle (enable recommended)

### Text Configuration
- **Headline**: Your main hero text
- **Subhead**: Supporting tagline
- **Text Alignment**: Center (recommended for flag)

### CTA Buttons (Optional)
- **Primary CTA**: Label + URL
- **Secondary CTA**: Label + URL

### Motion Settings
- **Motion Mode**: Full / Reduced / Off
- Default: Full (recommended with pause control)

## Troubleshooting

### Text Still Hard to Read
1. Increase overlay to 70%
2. Verify vignette is enabled
3. Enable auto-contrast
4. Check text shadow is rendering
5. Consider shorter headline (1 line)

### Video Not Loading
1. Verify file path is correct
2. Check HTTPS is used for CDN URLs
3. Verify MP4 format with H.264 codec
4. Check browser console for CORS errors
5. Test poster image shows as fallback

### Performance Issues
1. Reduce video bitrate to 1-1.5 Mbps
2. Lower resolution to 720p if needed
3. Ensure video size is under 2MB
4. Host on fast CDN
5. Consider poster-only mode for mobile

### Flag Appears Too Dark
1. Reduce overlay to 60%
2. Keep vignette enabled
3. Test across entire video loop
4. Ensure text remains readable

## Support

For additional help configuring your USA flag hero video:
1. Check the **Best Practices** card in Admin → Hero Media
2. Use the **Preview** button to test settings before publishing
3. Review the main **HERO_VIDEO_SETUP.md** guide for general video setup

---

**Pro Tip**: Start with the recommended 65% overlay and adjust from there. The flag's bright colors need a stronger overlay than typical hero videos.
