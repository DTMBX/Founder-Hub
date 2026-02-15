# Hero Video Background Setup Guide

The xTx396 Founder Hub now supports a full-bleed background video in the hero section with comprehensive accessibility and performance features.

## Quick Start

1. **Navigate to Admin Dashboard** → Hero Media tab
2. **Enter Video URL**: Direct URL to your MP4 video (e.g., `https://yourmedia.com/USA-flag.mp4`)
3. **Set Poster Image**: Static image shown while video loads or for users with reduced motion
4. **Configure Overlay**: Adjust darkness (40-70% recommended) for text readability
5. **Save Settings**: Changes apply immediately to the public site

## Video Placement Options

### Option 1: External Hosting (Recommended for large files)
- Upload video to a CDN or media hosting service
- Enter the full HTTPS URL in the Hero Media settings
- Example: `https://cdn.example.com/videos/USA-flag.mp4`

### Option 2: Local Assets (For bundled videos)
If you want to bundle the video with your app (not recommended for large files):
1. Create the directory structure: `/src/assets/video/`
2. Place your video file there (e.g., `USA-flag.mp4`)
3. In your code, import it: `import flagVideo from '@/assets/video/USA-flag.mp4'`
4. Reference the imported path in admin settings

**Note**: This template doesn't currently have an `/src/assets` directory. You would need to create it manually and ensure Vite processes video files correctly.

## Video Optimization Guidelines

### Technical Specs
- **Format**: MP4 (H.264 codec)
- **Resolution**: 1080p maximum (1920x1080)
- **Bitrate**: 1-2 Mbps for optimal web delivery
- **Duration**: 10-30 seconds (loopable)
- **File Size**: Target <2MB for fast loading

### Encoding Tips
Use tools like HandBrake or FFmpeg to optimize:
```bash
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 28 -vf scale=1920:1080 -an output.mp4
```

## Readability Settings

### Overlay Intensity
- **0.0-0.3**: Very light, only for very dark videos
- **0.4-0.5**: Light, good for moderately dark content
- **0.5-0.7**: **Recommended** — Ensures text readability
- **0.7-1.0**: Very dark, for extremely bright videos

### Vignette
- Creates subtle edge darkening
- Helps keep headlines readable when bright content moves to edges
- Toggle on/off based on your video content

### Auto-Contrast
- Automatically enforces minimum 60% overlay
- Useful if unsure about video brightness
- Can be overridden by setting higher manual overlay

## Accessibility Features

### Motion Modes
1. **Full**: Video always autoplays (default)
2. **Reduced**: Video pauses if user's OS requests reduced motion
3. **Off**: Always show poster, never autoplay

### Pause/Play Control
- Fixed button appears in bottom-right corner
- Users can manually control playback at any time
- Respects motion preferences

### Poster Fallback
- Always shown during video loading
- Displayed for reduced-motion users
- Shown if video fails to load
- Same overlay/vignette applied for consistency

## Text Styling

### Headlines
- Pure white (`oklch(1 0 0)`) or near-white
- Strong font weight (700)
- Text shadow for depth: `0 2px 20px rgba(0,0,0,0.5)`
- Generous letter spacing

### Best Practices
- Keep headline text concise (1-2 lines max)
- Use subhead for supporting text
- Test readability across entire video loop
- Ensure text doesn't compete with busy video areas

## CTA Buttons

### Configuration
- **Primary CTA**: Glassmorphism button with primary styling
- **Secondary CTA**: Ghost button variant
- Both support custom labels and URLs
- Leave empty to hide

### Button Styling
- High-contrast frosted glass effect
- White text with strong weight
- Clear focus outlines
- Tap targets meet accessibility standards (44x44px minimum)

## Responsive Behavior

### Desktop
- Content centered or centered-left based on alignment setting
- Max-width: 1100px with safe margins
- Video covers full viewport

### Mobile
- Stronger overlay intensity automatically applied
- Stacked CTA buttons with larger tap targets
- Trinity selector buttons stack vertically
- Video maintains aspect ratio and coverage

## Performance Considerations

### Loading Strategy
1. Poster image loads immediately
2. Video buffers in background
3. Autoplay begins when ready
4. No blocking of initial content

### Optimization Tips
- Host video on a fast CDN
- Provide optimized poster (<200KB)
- Use appropriate bitrate for audience
- Test on mobile data connections

## Testing Checklist

- [ ] Video loads and autoplays on desktop
- [ ] Poster shows immediately while video buffers
- [ ] Text remains readable throughout video loop
- [ ] CTA buttons have clear contrast
- [ ] Pause/play button works
- [ ] Reduced-motion mode shows poster only
- [ ] Mobile overlay is strong enough
- [ ] Video doesn't block page interactivity
- [ ] Fallback works if video fails
- [ ] Trinity selector buttons remain prominent

## Troubleshooting

### Video Doesn't Play
- Check URL is accessible (HTTPS required)
- Verify MP4 format with H.264 codec
- Ensure CORS headers allow video embedding
- Check browser console for errors

### Text Not Readable
- Increase overlay intensity (50-70%)
- Enable vignette for edge darkening
- Enable auto-contrast
- Reduce video brightness in editing

### Performance Issues
- Reduce video bitrate
- Lower resolution to 720p
- Compress video further
- Consider poster-only mode

## Admin Settings Reference

| Setting | Type | Default | Purpose |
|---------|------|---------|---------|
| Video URL | String | Empty | Path to MP4 video file |
| Poster URL | String | Empty | Path to fallback image |
| Overlay Intensity | Number (0-1) | 0.5 | Dark overlay opacity |
| Vignette Enabled | Boolean | true | Edge darkening effect |
| Text Alignment | 'left' \| 'center' | 'center' | Content alignment |
| Headline Text | String | Site name | Main hero text |
| Subhead Text | String | Tagline | Supporting text |
| CTA Primary | {label, url} | undefined | Primary action button |
| CTA Secondary | {label, url} | undefined | Secondary action button |
| Motion Mode | 'full' \| 'reduced' \| 'off' | 'full' | Autoplay behavior |
| Auto Contrast | Boolean | false | Enforce minimum overlay |

## Support

For issues or questions about hero video configuration, check the admin dashboard's "Best Practices" card in the Hero Media section.
