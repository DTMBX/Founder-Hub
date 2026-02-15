# 🎬 USA-flag.mp4 Testing Guide

## Quick Status Check

Run through this checklist to verify your USA flag video setup.

---

## Pre-Upload Checklist

Before uploading USA-flag.mp4, verify:

- [ ] Video file is in MP4 format (H.264 codec)
- [ ] Video is optimized for web (<2MB recommended)
- [ ] Video resolution is 1080p or 720p
- [ ] Video duration is 10-20 seconds (loopable)
- [ ] Audio track removed (not required for hero background)
- [ ] You have the file ready to copy

---

## Upload Process Checklist

### Step 1: File Placement
- [ ] Navigated to project directory: `/workspaces/spark-template/`
- [ ] Located assets video directory: `/src/assets/video/`
- [ ] Copied USA-flag.mp4 to: `/workspaces/spark-template/src/assets/video/USA-flag.mp4`
- [ ] Verified file exists in correct location

### Step 2: Admin Configuration
- [ ] Opened site and navigated to admin: `#admin`
- [ ] Successfully logged in
- [ ] Found "Hero Media" in left sidebar or Settings menu
- [ ] Clicked "Apply USA Flag Preset" button
- [ ] Verified settings changed to:
  - Overlay Intensity: 65%
  - Vignette: Enabled (toggle on)
  - Auto-Contrast: Enabled (toggle on)
  - Text Alignment: Center
  - Motion Mode: Full
- [ ] Entered video URL: `/src/assets/video/USA-flag.mp4`
- [ ] (Optional) Entered poster image URL
- [ ] Clicked "Save Hero Media Settings"
- [ ] Saw success toast message

### Step 3: Initial Verification
- [ ] Exited admin dashboard
- [ ] Navigated to home page
- [ ] Saw video loading indicator or poster
- [ ] Video started playing automatically
- [ ] No console errors (checked F12 → Console)

---

## Visual Testing Checklist

### Desktop Experience (Chrome/Firefox/Safari)

#### Video Playback
- [ ] Video loads and plays automatically
- [ ] Video loops smoothly without pause
- [ ] Video covers entire hero section
- [ ] Video maintains aspect ratio (no stretching)
- [ ] No flickering or stuttering

#### Text Readability
- [ ] Headline text is pure white
- [ ] Headline has visible text shadow/depth
- [ ] Headline readable in ALL frames of video loop
- [ ] Subhead text is white/near-white
- [ ] Subhead readable in ALL frames of video loop
- [ ] Text never disappears against bright flag stripes

#### Trinity Buttons
- [ ] "Investors" button visible and prominent
- [ ] "Legal / Court" button visible and prominent
- [ ] "About / Friends" button visible and prominent
- [ ] All buttons have frosted glass effect
- [ ] Buttons have clear borders/outlines
- [ ] Button text is readable
- [ ] Hover effect works (subtle lift/highlight)

#### Overlay & Vignette
- [ ] Dark overlay visible over video
- [ ] Overlay doesn't make video too dark
- [ ] Vignette effect visible at edges
- [ ] Center area brighter than edges
- [ ] Overall balance feels professional

#### Controls
- [ ] Pause/play button appears (bottom-right corner)
- [ ] Button has frosted glass effect
- [ ] Clicking button pauses video
- [ ] Clicking again resumes video
- [ ] Button icon changes (Play ↔ Pause)

#### Scroll Indicator
- [ ] Scroll indicator visible at bottom center
- [ ] Indicator animates smoothly
- [ ] Indicator fades when scrolling down

---

### Mobile Experience (iOS/Android)

#### Video Behavior
- [ ] Video loads on mobile
- [ ] Video plays inline (doesn't force fullscreen)
- [ ] Video fills screen width
- [ ] Video maintains aspect ratio

#### Layout
- [ ] Headline stacks properly
- [ ] Subhead stacks below headline
- [ ] Trinity buttons stack vertically
- [ ] Buttons are large enough to tap (minimum 120px height)
- [ ] All text remains centered

#### Touch Interactions
- [ ] Tap on "Investors" button works
- [ ] Tap on "Legal / Court" button works
- [ ] Tap on "About / Friends" button works
- [ ] Pause/play button tappable
- [ ] No accidental taps or overlap

#### Readability
- [ ] Overlay strong enough for mobile brightness
- [ ] Text readable on small screen
- [ ] No text too close to screen edges

---

### Tablet Experience (iPad/Android Tablet)

- [ ] Video displays correctly
- [ ] Layout adapts appropriately
- [ ] Buttons sized correctly
- [ ] Text properly scaled
- [ ] All interactions work

---

## Accessibility Testing

### Reduced Motion Preference

#### Test Setup
Enable reduced motion in your OS:
- **macOS**: System Preferences → Accessibility → Display → Reduce Motion
- **Windows**: Settings → Ease of Access → Display → Show animations
- **iOS**: Settings → Accessibility → Motion → Reduce Motion
- **Android**: Settings → Accessibility → Remove animations

#### Expected Behavior
- [ ] Video does NOT autoplay
- [ ] Poster image shows instead
- [ ] Text still readable on poster
- [ ] Overlay applies to poster
- [ ] No motion-based animations
- [ ] Trinity buttons still functional

### Keyboard Navigation
- [ ] Tab key moves focus through page
- [ ] Trinity buttons receive visible focus
- [ ] Focus outline clearly visible
- [ ] Enter key activates focused button
- [ ] Pause/play button reachable via Tab
- [ ] No keyboard traps

### Screen Reader (Optional)
- [ ] Hero section has proper heading
- [ ] Trinity buttons have clear labels
- [ ] Video doesn't interfere with reading
- [ ] Pause/play button has aria-label

---

## Performance Testing

### Load Time
- [ ] Hero section visible within 1-2 seconds
- [ ] Poster appears immediately (if set)
- [ ] Video starts within 2-3 seconds
- [ ] No long loading spinner
- [ ] Page remains interactive while video loads

### Network Throttling Test

In Chrome DevTools (F12 → Network tab):
1. Set throttling to "Slow 3G"
2. Reload page
3. Verify:
   - [ ] Poster shows immediately
   - [ ] Text readable while video loads
   - [ ] Video eventually plays
   - [ ] No frozen UI

### Resource Usage
- [ ] Video file size reasonable (<5MB)
- [ ] No excessive CPU usage
- [ ] Browser doesn't lag while playing
- [ ] Scrolling remains smooth

---

## Content Quality Testing

### Video Loop Continuity
Watch the entire video loop 3 times:
- [ ] Loop point is seamless
- [ ] No jarring transitions
- [ ] Flag motion feels natural
- [ ] Colors consistent throughout

### Text Contrast Across Frames

At different points in the video loop:
- [ ] Frame 1 (start): Text readable
- [ ] Frame 2 (bright stripes): Text readable
- [ ] Frame 3 (stars/blue): Text readable
- [ ] Frame 4 (red stripes): Text readable
- [ ] Frame 5 (loop point): Text readable

### Overall Professional Feel
- [ ] Feels premium and polished
- [ ] Patriotic but not over-the-top
- [ ] Professional for investors
- [ ] Appropriate for legal context
- [ ] Credible and trustworthy

---

## Browser Compatibility Testing

Test in multiple browsers:

### ✅ Chrome/Chromium
- [ ] Video plays
- [ ] All features work
- [ ] No console errors

### ✅ Firefox
- [ ] Video plays
- [ ] All features work
- [ ] No console errors

### ✅ Safari (macOS/iOS)
- [ ] Video plays
- [ ] All features work
- [ ] No console errors

### ✅ Edge
- [ ] Video plays
- [ ] All features work
- [ ] No console errors

---

## Overlay Intensity Fine-Tuning

If text readability isn't optimal:

### Too Hard to Read (Overlay Too Light)
Current: 65% → Try:
- [ ] Increase to 68%
- [ ] Test across video loop
- [ ] Increase to 70% if needed
- [ ] Verify flag still visible

### Flag Too Dark (Overlay Too Strong)
Current: 65% → Try:
- [ ] Decrease to 62%
- [ ] Test across video loop
- [ ] Ensure text still readable
- [ ] Check brightest frames carefully

### Optimal Range
- [ ] Overlay between 60-70%
- [ ] Vignette enabled
- [ ] Auto-contrast enabled
- [ ] Text readable in all frames
- [ ] Flag colors visible

---

## Final Acceptance Criteria

Before considering the setup complete, ALL must pass:

### Critical (Must Pass)
- [x] Video file uploaded to correct location
- [x] Video plays automatically on desktop
- [x] Video plays on mobile (inline)
- [x] Headline text readable throughout video
- [x] Subhead text readable throughout video
- [x] Trinity buttons visible and functional
- [x] Pause/play control works
- [x] No console errors
- [x] Page loads quickly (<3 seconds)
- [x] Reduced motion shows poster instead

### Important (Should Pass)
- [ ] Overlay at optimal intensity (60-70%)
- [ ] Vignette enhances readability
- [ ] Video loops seamlessly
- [ ] Mobile experience smooth
- [ ] Keyboard navigation works
- [ ] Professional appearance

### Nice to Have (Could Pass)
- [ ] Poster image set for instant display
- [ ] Video optimized (<2MB)
- [ ] Works on all browsers tested
- [ ] Scroll indicator animates smoothly
- [ ] Custom CTA buttons configured

---

## Common Issues & Solutions

### Issue: "Video URL not found"
**Solution:** Check path is exactly: `/src/assets/video/USA-flag.mp4`

### Issue: "Text disappears in bright frames"
**Solution:** Increase overlay to 70%, ensure vignette enabled

### Issue: "Video doesn't loop smoothly"
**Solution:** Re-encode video with loop-friendly keyframes

### Issue: "Video file too large"
**Solution:** Optimize with FFmpeg (see optimization guide)

### Issue: "Video stutters on mobile"
**Solution:** Reduce resolution to 720p, lower bitrate

### Issue: "Buttons hard to tap on mobile"
**Solution:** Already sized correctly (120px min height)

### Issue: "Text not centered"
**Solution:** Verify Text Alignment = "Center" in admin

---

## Next Steps After Passing All Tests

1. **Document your configuration:**
   - Video URL used
   - Poster URL used
   - Final overlay intensity
   - Any custom adjustments

2. **Backup your settings:**
   - Note: Settings stored in `useKV('founder-hub-settings')`
   - Consider exporting settings for backup

3. **Share with stakeholders:**
   - Test URL with investors
   - Get feedback on readability
   - Verify professional appearance

4. **Monitor performance:**
   - Check page load times in production
   - Monitor user behavior/bounce rate
   - Consider CDN if needed

---

## Support Resources

- **Detailed Setup:** `UPLOAD_USA_FLAG.md`
- **Optimal Settings:** `USA_FLAG_VIDEO_GUIDE.md`
- **Quick Start:** `README_USA_FLAG_VIDEO.md`
- **Testing Guide:** `USA_FLAG_UPLOAD_TEST.md` (this file)

---

## ✅ Sign-Off

Once all critical criteria pass:

**Tested By:** ________________  
**Date:** ________________  
**Browser(s):** ________________  
**Device(s):** ________________  

**Configuration Used:**
- Video URL: ________________
- Poster URL: ________________
- Overlay Intensity: _______%
- Special Notes: ________________

**Status:** ☐ Passed  ☐ Needs Adjustment

---

**USA Flag Hero Video Testing Complete!** 🇺🇸✅
