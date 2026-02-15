# 🎬 USA-flag.mp4 Upload & Test Guide

## Current Status

✅ **Hero video system is fully implemented and ready**  
✅ **Admin dashboard has Hero Media Manager**  
✅ **Optimal overlay settings are documented (65%)**  
✅ **All video controls (pause/play, reduced motion, fallback) are working**

## Quick Upload & Test (3 Steps)

### Step 1: Place Your Video File

Navigate to your project directory and place `USA-flag.mp4` in:

```bash
/workspaces/spark-template/src/assets/video/USA-flag.mp4
```

**File Requirements:**
- Format: MP4 (H.264 codec)
- Recommended size: <2MB
- Resolution: 1080p or 720p
- No audio track needed

### Step 2: Configure in Admin

1. Go to your site and navigate to **Admin Dashboard** (#admin)
2. Log in with your credentials
3. In the left sidebar, find **"Hero Media"** or navigate to **Settings → Hero Media**
4. Enter the following settings:

**Video Configuration:**
- **Video URL**: `/src/assets/video/USA-flag.mp4`
- **Poster URL**: (optional - add a poster image if you have one)
- **Overlay Intensity**: **65%** (recommended for bright USA flag)
- **Vignette**: **Enabled** ✓
- **Auto-Contrast**: **Enabled** ✓
- **Text Alignment**: **Center**
- **Motion Mode**: **Full**

**Text Content:**
- **Headline**: Your name or main message (e.g., "Devon Tyler Barber")
- **Subhead**: Your tagline (e.g., "Founder & Innovator")

5. Click **"Save Hero Media Settings"**

### Step 3: Test on Public Site

1. Exit admin dashboard
2. Navigate to home page
3. Verify the following:

#### ✅ Video Checklist
- [ ] Video loads and plays automatically
- [ ] Headline text is clearly readable (white text on dark overlay)
- [ ] Subhead text is clearly readable
- [ ] Trinity selector buttons are prominent and readable
- [ ] Pause/play button appears in bottom-right corner
- [ ] Pause/play button works when clicked
- [ ] Video loops smoothly

#### ✅ Responsive Checklist
- [ ] Desktop: Video fills screen, text centered, buttons visible
- [ ] Mobile: Video fills screen, text stacks properly, buttons stack vertically
- [ ] Tablet: Smooth transition between desktop and mobile layouts

#### ✅ Accessibility Checklist
- [ ] Text shadows provide good contrast
- [ ] Overlay makes text readable in all video frames
- [ ] Pause/play control is accessible and functional

## Troubleshooting

### Video Doesn't Appear
**Check:**
1. File path is correct: `/src/assets/video/USA-flag.mp4`
2. File actually exists in that directory
3. Browser console (F12) for any errors
4. Refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

### Text Hard to Read
**Solution:**
1. Go back to Admin → Hero Media
2. Increase **Overlay Intensity** to **70%**
3. Make sure **Vignette** is **Enabled**
4. Save and re-test

### Video Too Dark / Flag Not Visible
**Solution:**
1. Reduce **Overlay Intensity** to **60%**
2. Keep **Vignette** enabled
3. Watch entire video loop to ensure text remains readable

### Performance Issues / Slow Loading
**Solution:**
1. Optimize your video file (see optimization guide below)
2. Consider uploading to a CDN instead
3. Reduce video resolution to 720p if needed

## Video Optimization (Optional)

If your video file is large (>5MB) or causes performance issues, optimize it:

### Using FFmpeg (Command Line)
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

This creates a web-optimized version:
- Efficient H.264 encoding
- Proper resolution (1080p)
- No audio track (saves bandwidth)
- Fast-start enabled (plays while downloading)
- Target size: 1-2MB

## Expected Results

With the USA flag video properly configured at 65% overlay:

✅ **Visual Impact**: Patriotic flag waving in background  
✅ **Text Readability**: Crystal clear white text with shadows  
✅ **Trinity Buttons**: Prominent glass buttons for pathways  
✅ **Professional Feel**: Premium, credible, fast-loading hero  
✅ **Accessibility**: Pause control + reduced motion support  

## Fine-Tuning Recommendations

### Overlay Intensity Guide for USA Flag

| Setting | Flag Visibility | Text Readability | Best For |
|---------|----------------|------------------|----------|
| 50-55% | High | Low ⚠️ | Not recommended |
| 60% | Medium-High | Medium | Darker flag footage |
| **65%** | **Medium** | **High ✓** | **Recommended** |
| 70% | Medium-Low | Very High | Brighter flag footage |
| 75%+ | Low | Excellent | If flag is too distracting |

**Start with 65% and adjust based on your specific video footage.**

## Next Steps After Testing

Once your USA flag video is working:

1. **Test on Multiple Devices**
   - Desktop (Chrome, Firefox, Safari)
   - Mobile (iOS Safari, Android Chrome)
   - Tablet

2. **Test Different Scenarios**
   - Fast network connection
   - Slow network (throttle in DevTools)
   - Reduced motion preference enabled

3. **Add Poster Image** (Recommended)
   - Extract a still frame from your video
   - Save as JPG (<200KB)
   - Place in `/src/assets/images/USA-flag-poster.jpg`
   - Update Admin → Hero Media → Poster URL

4. **Share & Verify**
   - Test the public URL
   - Share with colleagues/friends
   - Get feedback on readability

## Support Resources

- **Detailed Setup**: See `UPLOAD_USA_FLAG.md`
- **USA Flag Specific Guide**: See `USA_FLAG_VIDEO_GUIDE.md`
- **General Video Setup**: See `HERO_VIDEO_SETUP.md`
- **Admin Dashboard**: Built-in best practices card

## Common Video Specs That Work Well

### Good (Fast, Recommended)
```
Format: MP4 (H.264)
Resolution: 1280x720 (720p)
Bitrate: 1-1.5 Mbps
Size: ~1MB
Duration: 10-15 seconds
```

### Better (Balanced)
```
Format: MP4 (H.264)
Resolution: 1920x1080 (1080p)
Bitrate: 1.5-2 Mbps
Size: ~1.5-2MB
Duration: 10-20 seconds
```

### Best (High Quality, Larger)
```
Format: MP4 (H.264)
Resolution: 1920x1080 (1080p)
Bitrate: 2-3 Mbps
Size: ~2-3MB
Duration: 10-20 seconds
Note: Consider CDN hosting
```

## Quick Reference: File Paths

```
Project Root: /workspaces/spark-template/

Video File:
→ /workspaces/spark-template/src/assets/video/USA-flag.mp4

Poster Image (optional):
→ /workspaces/spark-template/src/assets/images/USA-flag-poster.jpg

Admin URL:
→ https://your-site.com/#admin

Hero Section (Public):
→ https://your-site.com/#hero
```

---

## Testing Complete? ✅

If all checklist items pass:

✅ Video playing smoothly  
✅ Text clearly readable  
✅ Trinity buttons prominent  
✅ Pause control working  
✅ Mobile responsive  
✅ Performance acceptable  

**You're done! Your USA flag hero video is live and optimized.** 🎉
