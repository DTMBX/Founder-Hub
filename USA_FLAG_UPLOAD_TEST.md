# 🎬 USA-flag.mp4 Upload & Test Guide

✅ **Hero video sy








- Resolution: 1080p or 720p



4. Ente
**Video Configuration:**
- *

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
## Video Optimization (O
3. Verify the following:

#### ✅ Video Checklist
  -preset slow \
- [ ] Headline text is clearly readable (white text on dark overlay)
- [ ] Subhead text is clearly readable
- [ ] Trinity selector buttons are prominent and readable
This creates a web-optimized version:
- [ ] Pause/play button works when clicked
- Fast-start enabled (play

#### ✅ Responsive Checklist
- [ ] Desktop: Video fills screen, text centered, buttons visible
- [ ] Mobile: Video fills screen, text stacks properly, buttons stack vertically
- [ ] Tablet: Smooth transition between desktop and mobile layouts

#### ✅ Accessibility Checklist

- [ ] Overlay makes text readable in all video frames
| 60% | Medium-High | Medium | Darker flag footage |




**Check:**
1. File path is correct: `/src/assets/video/USA-flag.mp4`
2. File actually exists in that directory
3. Browser console (F12) for any errors
4. Refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

### Text Hard to Read
   - Place in
1. Go back to Admin → Hero Media
   - Test the public URL
3. Make sure **Vignette** is **Enabled**
## Support Resource

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

  -crf 28 \
Admin URL:
  -an \
→ https://your-site.com/
  USA-flag-optimized.mp4



- Efficient H.264 encoding
✅ Pause control working  
- No audio track (saves bandwidth)
- Fast-start enabled (plays while downloading)
- Target size: 1-2MB

## Expected Results

With the USA flag video properly configured at 65% overlay:

✅ **Visual Impact**: Patriotic flag waving in background  

✅ **Trinity Buttons**: Prominent glass buttons for pathways  

✅ **Accessibility**: Pause control + reduced motion support  

## Fine-Tuning Recommendations

### Overlay Intensity Guide for USA Flag

| Setting | Flag Visibility | Text Readability | Best For |
|---------|----------------|------------------|----------|
| 50-55% | High | Low ⚠️ | Not recommended |

| **65%** | **Medium** | **High ✓** | **Recommended** |
| 70% | Medium-Low | Very High | Brighter flag footage |
| 75%+ | Low | Excellent | If flag is too distracting |

**Start with 65% and adjust based on your specific video footage.**

## Next Steps After Testing

Once your USA flag video is working:

1. **Test on Multiple Devices**

   - Mobile (iOS Safari, Android Chrome)



   - Fast network connection

   - Reduced motion preference enabled

3. **Add Poster Image** (Recommended)
   - Extract a still frame from your video
   - Save as JPG (<200KB)
   - Place in `/src/assets/images/USA-flag-poster.jpg`
   - Update Admin → Hero Media → Poster URL

4. **Share & Verify**

   - Share with colleagues/friends


## Support Resources

- **Detailed Setup**: See `UPLOAD_USA_FLAG.md`
- **USA Flag Specific Guide**: See `USA_FLAG_VIDEO_GUIDE.md`
- **General Video Setup**: See `HERO_VIDEO_SETUP.md`
- **Admin Dashboard**: Built-in best practices card

## Common Video Specs That Work Well

### Good (Fast, Recommended)

Format: MP4 (H.264)

Bitrate: 1-1.5 Mbps
Size: ~1MB
Duration: 10-15 seconds


### Better (Balanced)
```

Resolution: 1920x1080 (1080p)

Size: ~1.5-2MB



### Best (High Quality, Larger)
```
Format: MP4 (H.264)
Resolution: 1920x1080 (1080p)
Bitrate: 2-3 Mbps

Duration: 10-20 seconds
Note: Consider CDN hosting
```

## Quick Reference: File Paths

```
Project Root: /workspaces/spark-template/


→ /workspaces/spark-template/src/assets/video/USA-flag.mp4

Poster Image (optional):
→ /workspaces/spark-template/src/assets/images/USA-flag-poster.jpg


→ https://your-site.com/#admin

Hero Section (Public):
→ https://your-site.com/#hero
```

---

## Testing Complete? ✅

If all checklist items pass:

✅ Video playing smoothly  

✅ Trinity buttons prominent  

✅ Mobile responsive  


**You're done! Your USA flag hero video is live and optimized.** 🎉
