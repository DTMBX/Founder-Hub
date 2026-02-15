# USA Flag Hero Video - Setup Complete ✓

## Overview
The xTx396 Founder Hub now features a premium hero section with the USA flag video (flag-video.mp4) as a full-bleed background, with optimal settings for text readability, accessibility, and performance.

## Current Configuration (Active by Default)

### Video & Media
- **Video**: `/src/assets/video/flag-video.mp4` (autoplay, muted, looped)
- **Poster**: `/src/assets/images/us-flag-50.png` (instant display, fallback)

### Readability Settings
- **Overlay Intensity**: 65% dark scrim (optimal for bright patriotic content)
- **Vignette**: Enabled (gradient darkening at edges for text safety)
- **Auto-Contrast**: Enabled (enforces minimum 60% overlay for readability)

### Typography
- **Headline**: Pure white (#FFFFFF), 700 weight, tight letter-spacing (-0.02em)
- **Subhead**: White with 95% opacity, 500 weight, subtle letter-spacing (0.01em)
- **Text Shadow**: Restrained multi-layer shadows for legibility (0 2px 20px, 0 4px 40px)

### Layout & Alignment
- **Text Alignment**: Center (vertically and horizontally)
- **Safe Area**: Max-width 1100px container with clamp(1.5rem, 5vw, 4rem) horizontal padding
- **Mobile**: Stacked layout with larger tap targets

### Motion & Accessibility
- **Motion Mode**: Full (autoplay enabled)
- **Reduced Motion**: Automatically pauses video and shows poster for users with `prefers-reduced-motion`
- **Pause/Play Control**: Fixed bottom-right button for manual control
- **Scroll Indicator**: Animated "Scroll" cue with chevron, fades out after 100px scroll

### CTA Buttons
- **Style**: Glassmorphism with frosted surface, thin borders, white text
- **Variants**: Primary (glassPrimary) and Secondary (glass)
- **Focus States**: Visible ring outline on dark backgrounds (2px ring-offset)

## Admin Panel Access

Navigate to `#admin` in your browser, log in, and access the **Hero Media Manager** to modify settings:

### Quick Setup Option
Click **"Apply USA Flag Preset"** to instantly configure:
- Video URL: `/src/assets/video/flag-video.mp4`
- Poster URL: `/src/assets/images/us-flag-50.png`
- Overlay: 65%
- Vignette: On
- Auto-Contrast: On
- Text Alignment: Center
- Motion Mode: Full

### Manual Configuration
Fine-tune individual settings:
- **Video & Poster URLs**: Upload or link to custom media
- **Overlay Intensity Slider**: 0-100% (40-50% for dark videos, 65-70% for bright content)
- **Vignette Toggle**: Enable/disable gradient edge darkening
- **Auto-Contrast Toggle**: Automatic brightness compensation
- **Text Alignment**: Left or Center
- **Headline & Subhead**: Custom text content
- **CTA Buttons**: Primary/Secondary labels and URLs (optional)
- **Motion Mode**: Full / Reduced / Off

## Technical Implementation

### Performance
✓ Video lazy-loaded, never blocks initial content display  
✓ Poster shows immediately while video buffers in background  
✓ Optimized MP4 encoding (H.264 codec, reasonable bitrate)  
✓ Fallback strategy: poster → video → gradient background  

### Accessibility
✓ Respects `prefers-reduced-motion` system preference  
✓ Manual pause/play control always available  
✓ Poster fallback for failed video loads  
✓ WCAG AA contrast ratios maintained (white text on 65% darkened video)  
✓ Focus outlines visible on CTA buttons  
✓ Keyboard navigable Trinity selector  

### Responsiveness
✓ Desktop: Centered content with balanced spacing  
✓ Mobile: Stacked CTAs with increased overlay for readability  
✓ Safe-area composition keeps text away from edges  
✓ Scroll indicator fades out on scroll (disabled in reduced-motion)  

## Video Specifications

### Recommended Format
- **Container**: MP4
- **Codec**: H.264
- **Resolution**: 1080p (1920x1080) maximum
- **Bitrate**: 1-2 Mbps
- **Duration**: 10-30 seconds (loopable)
- **Frame Rate**: 24-30 fps
- **Audio**: None (muted playback)

### Current Asset
- **File**: `flag-video.mp4` in `/src/assets/video/`
- **Poster**: `us-flag-50.png` in `/src/assets/images/`

## Acceptance Criteria - All Met ✓

✅ White hero text remains readable across entire video loop on desktop and mobile  
✅ Video never blocks initial content display (poster renders instantly)  
✅ Reduced-motion users see static hero with poster  
✅ Video optimized for web delivery (efficient encoding, fast buffering)  
✅ Admin can tune overlay, alignment, and hero content without code changes  
✅ Fallback strategy works (poster → video → gradient)  
✅ CTA buttons high-contrast with glassmorphism and visible focus states  
✅ Scroll indicator fades out after scroll, doesn't distract from content  
✅ Pause/play control visible and accessible  
✅ Mobile: increased overlay strength, larger tap targets, stacked layout  

## Trinity Layout Integration

The hero section maintains the Trinity selector for audience triage:
1. **Investors** → Projects, Roadmap, Traction
2. **Legal/Court** → Case materials, Documentation
3. **About/Friends** → Mission, Updates, Contact

All three pathways remain accessible with the video background providing a premium, memorable first impression.

## Support & Troubleshooting

### Video Not Playing?
- Check browser console for errors
- Verify video path: `/src/assets/video/flag-video.mp4`
- Ensure autoplay policies allow muted video
- Check motion mode setting (should be "Full" or "Reduced")

### Text Not Readable?
- Increase overlay intensity (65-70% recommended for bright content)
- Enable vignette for edge darkening
- Enable auto-contrast for automatic brightness compensation
- Check text shadow styling (should be present)

### Performance Issues?
- Ensure video is optimized (1-2 Mbps bitrate)
- Verify lazy loading (video shouldn't block first paint)
- Check poster is displaying immediately
- Consider reducing video resolution or duration

## File Locations

```
/src/assets/video/flag-video.mp4          # Main hero video
/src/assets/images/us-flag-50.png         # Hero poster fallback
/src/components/sections/HeroSection.tsx  # Hero component
/src/components/admin/HeroMediaManager.tsx # Admin settings panel
/src/lib/asset-helpers.ts                 # Asset path constants
```

## Summary

The USA flag hero video is now fully operational with:
- **Premium visual experience**: Full-bleed flag video background
- **Optimal readability**: 65% overlay + vignette + white text with shadows
- **Complete accessibility**: Reduced-motion support + manual controls
- **High performance**: Lazy loading, instant poster, efficient encoding
- **Admin flexibility**: One-click preset or granular control
- **Trinity integration**: Audience triage pathways preserved

The implementation exceeds all acceptance criteria and provides a polished, accessible, and performant hero section worthy of a premium founder hub.
