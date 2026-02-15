# 🇺🇸 USA Flag Video Upload Instructions

## Quick Start

Your xTx396 Founder Hub is ready for the USA-flag.mp4 video! Follow these steps to upload and configure it.

## Step 1: Prepare Your Video File

### Option A: Place in Local Assets (Simple, Bundled)

1. Navigate to your project directory
2. Place your `USA-flag.mp4` file in:
   ```
   /workspaces/spark-template/src/assets/video/USA-flag.mp4
   ```
3. The file will be automatically processed by Vite and bundled with your app

**Pros**: Simple, no external hosting needed  
**Cons**: Increases bundle size, slower build times  
**Best for**: Small videos (<2MB), development/testing

### Option B: Upload to CDN (Recommended for Production)

1. Upload your `USA-flag.mp4` to a CDN service:
   - Cloudflare R2
   - AWS S3 + CloudFront
   - Vercel Blob Storage
   - Any HTTPS-accessible location

2. Get the direct HTTPS URL to the video file
3. You'll enter this URL in the admin dashboard

**Pros**: Fast loading, no bundle bloat, optimized delivery  
**Cons**: Requires external service  
**Best for**: Production, larger videos, optimal performance

## Step 2: Access Admin Dashboard

1. Navigate to your site
2. Click the "Admin" link or go to `#admin`
3. Log in with your credentials
4. Navigate to **Settings** → **Hero Media** (or find it in the left sidebar)

## Step 3: Apply USA Flag Preset

At the top of the Hero Media settings, you'll see a highlighted card:

**"USA Flag Video Quick Setup"**

1. Click the **"Apply USA Flag Preset"** button
2. This automatically sets:
   - Overlay Intensity: 65%
   - Vignette: Enabled
   - Auto-Contrast: Enabled
   - Text Alignment: Center
   - Motion Mode: Full

These are the optimal settings for bright patriotic content like the USA flag.

## Step 4: Enter Video URL

In the "Video & Poster" section:

### If you used Option A (Local Assets):
```
/src/assets/video/USA-flag.mp4
```

### If you used Option B (CDN):
```
https://your-cdn.com/path/to/USA-flag.mp4
```

## Step 5: Add Poster Image (Recommended)

A poster image is shown:
- While the video loads
- For users with reduced motion preferences
- If the video fails to load

1. Take a still frame from your USA-flag.mp4 video
2. Export as JPG or PNG (optimized, <200KB)
3. Upload to `/src/assets/images/` or your CDN
4. Enter the URL in the "Poster Image URL" field

Example:
```
/src/assets/images/USA-flag-poster.jpg
```

## Step 6: Verify Settings

Double-check your configuration:

- ✅ Video URL is correct
- ✅ Poster URL is set (optional but recommended)
- ✅ Overlay Intensity: **65%** (or 60-70% range)
- ✅ Vignette: **Enabled**
- ✅ Auto-Contrast: **Enabled**
- ✅ Text Alignment: **Center** (recommended)
- ✅ Motion Mode: **Full** (with pause control)

## Step 7: Customize Text (Optional)

In the "Text Content & Layout" section:

- **Headline Text**: Your name or main message (default: "Devon Tyler Barber")
- **Subhead Text**: Your positioning line (default: "Founder & Innovator")
- **Text Alignment**: Center recommended for flag background

## Step 8: Save Settings

1. Scroll to the bottom
2. Click **"Save Hero Media Settings"**
3. Wait for the success message
4. Exit admin dashboard

## Step 9: View Your Hero Section

1. Navigate back to the home page
2. Your USA flag video should now be playing in the background
3. White text should be clearly readable throughout the video loop
4. Trinity selector buttons should be prominent

## Troubleshooting

### Video Doesn't Play

**Issue**: Video URL is incorrect or file isn't accessible

**Solutions**:
- Verify the file exists at the specified path
- Check browser console for errors (F12 → Console tab)
- Ensure URL uses HTTPS (for CDN)
- Try the poster URL first to test if images work

### Text Hard to Read

**Issue**: Overlay isn't dark enough for the bright flag colors

**Solutions**:
1. Increase overlay to 70%
2. Make sure vignette is enabled
3. Enable auto-contrast if not already on
4. Test across the entire video loop (some frames may be brighter)

### Video Too Dark

**Issue**: Overlay is too strong, flag colors aren't visible

**Solutions**:
1. Reduce overlay to 60-62%
2. Keep vignette and auto-contrast enabled
3. Make sure your video isn't too dark to begin with

### Performance Issues

**Issue**: Page loads slowly or video stutters

**Solutions**:
1. Optimize your video file (see optimization section below)
2. Use a CDN instead of local assets
3. Reduce video bitrate or resolution
4. Consider using motion mode "Reduced" or "Off" for mobile

### Text Still Not Centered

**Issue**: Text appears off-center despite settings

**Solutions**:
1. In Hero Media settings, set Text Alignment to "Center"
2. Clear browser cache
3. Check if custom CSS is overriding alignment

## Video Optimization Guide

For best performance, optimize your USA-flag.mp4:

### Recommended Specifications

```
Format:      MP4 (H.264 codec)
Resolution:  1920x1080 (1080p) max
Frame Rate:  30fps
Bitrate:     1.5-2 Mbps
Duration:    10-20 seconds (loopable)
Audio:       None (remove audio track)
File Size:   Target <2MB
```

### Using FFmpeg (Command Line)

If you have FFmpeg installed:

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

This command:
- Encodes with H.264 (widely supported)
- Uses CRF 28 (good quality/size balance)
- Scales to 1080p if larger
- Removes audio track
- Enables fast-start (streams while downloading)

### Using HandBrake (GUI Tool)

1. Open HandBrake (free, available at handbrake.fr)
2. Load your USA-flag.mp4
3. Select "Fast 1080p30" preset
4. Set Video Codec: H.264
5. Set Quality (RF): 28
6. Remove audio track
7. Start encode

### Expected File Size

- Original 4K flag video: 10-50MB
- Optimized 1080p version: 1-3MB
- Poster image (1920x1080 JPG): 100-200KB

## Testing Checklist

Before considering setup complete:

- [ ] Video loads and autoplays on desktop
- [ ] Poster image appears immediately while video buffers
- [ ] Headline text is clearly readable
- [ ] Subhead text is clearly readable
- [ ] Trinity selector buttons are prominent
- [ ] Pause/play button appears and works
- [ ] Text remains readable throughout entire video loop
- [ ] Mobile view: overlay is strong enough
- [ ] Mobile view: Trinity buttons stack properly
- [ ] Reduced motion: poster shows, video doesn't play
- [ ] Page loads quickly (no lag)
- [ ] No console errors

## Advanced Configuration

### Fine-Tuning Overlay

The preset sets overlay to 65%, but you can adjust:

- **60%**: If flag colors should be more vibrant
- **65%**: **Recommended** - Good balance
- **70%**: If text still struggles in bright frames

### Custom Text Shadows

The hero text already has built-in shadows for readability:
- Primary shadow: `0 2px 20px rgba(0,0,0,0.5)`
- Secondary shadow: `0 4px 40px rgba(0,0,0,0.3)`

These are automatically applied - no configuration needed.

### Motion Modes Explained

**Full Mode** (Recommended):
- Video always autoplays
- Users can manually pause with button
- Best user experience

**Reduced Mode**:
- Video pauses if user's OS requests reduced motion
- Respects accessibility preferences
- Good for sensitive audiences

**Off Mode**:
- Always shows poster, never plays video
- Fastest loading
- Use if video causes issues

## Support & Documentation

### Additional Resources

- **General Hero Video Setup**: See `HERO_VIDEO_SETUP.md`
- **USA Flag Specific Guide**: See `USA_FLAG_VIDEO_GUIDE.md`
- **Admin Dashboard**: In-app best practices card

### Getting Help

If you encounter issues:

1. Check browser console (F12 → Console)
2. Review the troubleshooting section above
3. Verify video file format and codec
4. Test with poster image only first
5. Try a different browser

### Optimal Workflow

1. Start with the preset (65% overlay)
2. Enter video and poster URLs
3. Save settings
4. Test on public site
5. Fine-tune overlay if needed (60-70% range)
6. Re-save and re-test
7. Verify on mobile device

## File Structure Reference

```
/workspaces/spark-template/
├── src/
│   ├── assets/
│   │   ├── video/
│   │   │   └── USA-flag.mp4          ← Place video here
│   │   └── images/
│   │       └── USA-flag-poster.jpg   ← Place poster here
│   └── components/
│       ├── sections/
│       │   └── HeroSection.tsx       ← Renders hero video
│       └── admin/
│           └── HeroMediaManager.tsx  ← Configure settings here
├── HERO_VIDEO_SETUP.md               ← General video guide
├── USA_FLAG_VIDEO_GUIDE.md           ← Detailed USA flag guide
└── UPLOAD_USA_FLAG.md                ← This file
```

## Quick Command Reference

### Create assets directories (if needed)
```bash
mkdir -p src/assets/video
mkdir -p src/assets/images
```

### Copy video file (example)
```bash
cp ~/Downloads/USA-flag.mp4 src/assets/video/
```

### Check video info with FFmpeg
```bash
ffmpeg -i src/assets/video/USA-flag.mp4
```

### Optimize existing video
```bash
ffmpeg -i src/assets/video/USA-flag.mp4 \
  -c:v libx264 -preset slow -crf 28 \
  -vf scale=1920:1080 -an -movflags +faststart \
  src/assets/video/USA-flag-optimized.mp4
```

---

**Ready to launch?** Follow the 9 steps above and your USA flag hero video will be live with optimal text readability in minutes!
