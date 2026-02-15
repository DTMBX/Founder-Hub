# 🎥 USA Flag Video - Quick Start Guide

## ✅ System Status

Your xTx396 Founder Hub is **fully ready** for the USA-flag.mp4 video:

- ✅ Hero video system implemented
- ✅ Admin dashboard with Hero Media Manager
- ✅ USA Flag preset with optimal overlay settings (65%)
- ✅ Video controls (pause/play, reduced motion support)
- ✅ Responsive design (desktop + mobile)
- ✅ Accessibility features built-in

## 📁 Where to Place Your Video

```
/workspaces/spark-template/src/assets/video/USA-flag.mp4
```

**Current directory status:**
- ✅ `/src/assets/video/` directory exists
- ⏳ Waiting for USA-flag.mp4 file

## 🚀 Three Simple Steps

### 1️⃣ Upload Your Video File

Place your `USA-flag.mp4` file in:
```
/workspaces/spark-template/src/assets/video/USA-flag.mp4
```

**Recommended video specs:**
- Format: MP4 (H.264 codec)
- Resolution: 1080p or 720p
- Size: <2MB (optimized for web)
- Duration: 10-20 seconds (loopable)
- Audio: Not required (will be muted)

### 2️⃣ Configure in Admin Dashboard

1. Navigate to your site: `#admin`
2. Log in with your credentials
3. Go to **Settings** → **Hero Media** (left sidebar)
4. Click **"Apply USA Flag Preset"** button (at the top)
   - This automatically sets:
     - Overlay: 65%
     - Vignette: Enabled
     - Auto-Contrast: Enabled
     - Text Alignment: Center
     - Motion Mode: Full
5. Enter Video URL: `/src/assets/video/USA-flag.mp4`
6. (Optional) Enter Poster URL for fallback image
7. Click **"Save Hero Media Settings"**

### 3️⃣ Test on Public Site

1. Exit admin dashboard
2. Go to home page
3. Verify:
   - ✅ Video plays automatically
   - ✅ White text is clearly readable
   - ✅ Trinity selector buttons are prominent
   - ✅ Pause/play button works (bottom-right corner)

## 🎯 Optimal Settings for USA Flag

The preset applies these recommended values:

| Setting | Value | Why |
|---------|-------|-----|
| **Overlay Intensity** | 65% | Balances flag visibility with text readability |
| **Vignette** | Enabled | Darkens edges, keeps text clear |
| **Auto-Contrast** | Enabled | Ensures minimum 60% overlay |
| **Text Alignment** | Center | Best for flag background |
| **Motion Mode** | Full | Video plays with pause control |

## 🔧 Troubleshooting

### Video Doesn't Play
- Check file path: `/src/assets/video/USA-flag.mp4`
- Verify file exists in directory
- Check browser console (F12) for errors
- Try hard refresh (Ctrl+Shift+R)

### Text Hard to Read
- Increase overlay to 70%
- Ensure vignette is enabled
- Check auto-contrast is on

### Video Too Dark
- Reduce overlay to 60%
- Watch entire video loop to verify text readability

### Performance Issues
- Optimize video file (see optimization guide)
- Use CDN hosting instead of local assets
- Reduce video resolution to 720p

## 📊 Testing Checklist

Before considering setup complete:

- [ ] Video URL configured in admin
- [ ] Video loads and autoplays on desktop
- [ ] Headline text clearly readable throughout video
- [ ] Subhead text clearly readable throughout video
- [ ] Trinity selector buttons prominent and readable
- [ ] Pause/play button appears and works
- [ ] Mobile: Video responsive, buttons stack properly
- [ ] Reduced motion: Poster shows instead of video
- [ ] No console errors
- [ ] Page loads quickly

## 📚 Additional Documentation

For detailed information, see:

1. **USA_FLAG_UPLOAD_TEST.md** - Comprehensive upload and testing guide
2. **USA_FLAG_VIDEO_GUIDE.md** - Optimal overlay configuration details
3. **HERO_VIDEO_SETUP.md** - General hero video setup guide
4. **UPLOAD_USA_FLAG.md** - Step-by-step upload instructions

## 🎨 Video Optimization (Optional)

If your video is large (>5MB) or not optimized:

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
- Efficient encoding
- Proper resolution
- No audio track
- Fast-start enabled
- Target: 1-2MB

## 🌐 Alternative: CDN Hosting

For production or larger files:

1. Upload USA-flag.mp4 to:
   - Cloudflare R2
   - AWS S3 + CloudFront
   - Vercel Blob Storage
   - Any HTTPS CDN

2. Get the direct HTTPS URL

3. In Admin → Hero Media, use the CDN URL instead:
   ```
   https://your-cdn.com/USA-flag.mp4
   ```

**Benefits:**
- Faster loading
- No bundle bloat
- Better scalability
- Optimized delivery

## ✨ Expected Result

Once configured, your hero section will display:

🎬 **USA flag waving** in the background  
📝 **White text** with strong contrast and shadows  
🔘 **Trinity buttons** for Investors, Legal, About pathways  
⏸️ **Pause control** for user accessibility  
📱 **Fully responsive** on all devices  
⚡ **Fast loading** with optimized video  

## 📞 Need Help?

1. Check browser console for specific errors
2. Review the troubleshooting section above
3. Consult the detailed documentation files
4. Test with poster image only first
5. Verify video file format and codec

## 🎉 Ready to Go!

Your hero video system is fully implemented and waiting for the USA-flag.mp4 file. Simply:

1. **Place file** in `/src/assets/video/`
2. **Apply preset** in Admin → Hero Media
3. **Enter URL** and save settings
4. **Test** on public site

**That's it!** Your USA flag hero background will be live. 🇺🇸
