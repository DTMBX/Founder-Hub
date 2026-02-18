import { useState } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import { SiteSettings } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { VideoCamera, Image as ImageIcon, Check, Warning, FlagBanner } from '@phosphor-icons/react'
import { ASSET_PATHS } from '@/lib/asset-helpers'

export default function HeroMediaManager() {
  const [settings, setSettings] = useKV<SiteSettings>('founder-hub-settings', {
    siteName: 'Devon Tyler Barber',
    tagline: 'Founder & Innovator',
    description: 'Building transformative solutions at the intersection of technology and justice.',
    primaryDomain: 'xTx396.online',
    domainRedirects: [],
    analyticsEnabled: true,
    indexingEnabled: true,
    investorModeAvailable: true
  })

  const [videoUrl, setVideoUrl] = useState(settings?.heroMedia?.videoUrl || '')
  const [posterUrl, setPosterUrl] = useState(settings?.heroMedia?.posterUrl || '')
  const [overlayIntensity, setOverlayIntensity] = useState(settings?.heroMedia?.overlayIntensity ?? 0.5)
  const [vignetteEnabled, setVignetteEnabled] = useState(settings?.heroMedia?.vignetteEnabled ?? true)
  const [textAlignment, setTextAlignment] = useState<'left' | 'center'>(settings?.heroMedia?.textAlignment ?? 'center')
  const [headlineText, setHeadlineText] = useState(settings?.heroMedia?.headlineText || settings?.siteName || '')
  const [subheadText, setSubheadText] = useState(settings?.heroMedia?.subheadText || settings?.tagline || '')
  const [ctaPrimaryLabel, setCtaPrimaryLabel] = useState(settings?.heroMedia?.ctaPrimary?.label || '')
  const [ctaPrimaryUrl, setCtaPrimaryUrl] = useState(settings?.heroMedia?.ctaPrimary?.url || '')
  const [ctaSecondaryLabel, setCtaSecondaryLabel] = useState(settings?.heroMedia?.ctaSecondary?.label || '')
  const [ctaSecondaryUrl, setCtaSecondaryUrl] = useState(settings?.heroMedia?.ctaSecondary?.url || '')
  const [motionMode, setMotionMode] = useState<'full' | 'reduced' | 'off'>(settings?.heroMedia?.motionMode ?? 'full')
  const [autoContrast, setAutoContrast] = useState(settings?.heroMedia?.autoContrast ?? false)

  const handleSave = () => {
    setSettings((current) => {
      const updated: SiteSettings = {
        siteName: current?.siteName || 'Devon Tyler Barber',
        tagline: current?.tagline || 'Founder & Innovator',
        description: current?.description || '',
        primaryDomain: current?.primaryDomain || 'xTx396.online',
        domainRedirects: current?.domainRedirects || [],
        analyticsEnabled: current?.analyticsEnabled ?? true,
        indexingEnabled: current?.indexingEnabled ?? true,
        investorModeAvailable: current?.investorModeAvailable ?? true,
        heroMedia: {
          videoUrl: videoUrl.trim() || undefined,
          posterUrl: posterUrl.trim() || undefined,
          overlayIntensity,
          vignetteEnabled,
          textAlignment,
          headlineText: headlineText.trim(),
          subheadText: subheadText.trim(),
          ctaPrimary: ctaPrimaryLabel.trim() && ctaPrimaryUrl.trim() 
            ? { label: ctaPrimaryLabel.trim(), url: ctaPrimaryUrl.trim() }
            : undefined,
          ctaSecondary: ctaSecondaryLabel.trim() && ctaSecondaryUrl.trim()
            ? { label: ctaSecondaryLabel.trim(), url: ctaSecondaryUrl.trim() }
            : undefined,
          motionMode,
          autoContrast
        }
      }
      return updated
    })
    toast.success('Hero media settings saved')
  }

  const handleReset = () => {
    setVideoUrl('')
    setPosterUrl('')
    setOverlayIntensity(0.5)
    setVignetteEnabled(true)
    setTextAlignment('center')
    setHeadlineText(settings?.siteName || '')
    setSubheadText(settings?.tagline || '')
    setCtaPrimaryLabel('')
    setCtaPrimaryUrl('')
    setCtaSecondaryLabel('')
    setCtaSecondaryUrl('')
    setMotionMode('full')
    setAutoContrast(false)
    toast.info('Form reset to defaults')
  }

  const applyUSAFlagPreset = () => {
    setVideoUrl(ASSET_PATHS.videos.usaFlag)
    setPosterUrl(ASSET_PATHS.images.usFlag50)
    setOverlayIntensity(0.65)
    setVignetteEnabled(true)
    setAutoContrast(true)
    setTextAlignment('center')
    setMotionMode('full')
    toast.success('USA Flag preset applied - video, poster, and optimal overlay settings configured')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Hero Media Settings</h2>
        <p className="text-muted-foreground">
          Configure background video, overlay intensity, text styling, and CTAs for the hero section.
        </p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <FlagBanner className="h-5 w-5 text-primary" />
                USA Flag Video Quick Setup
              </CardTitle>
              <CardDescription>
                Using flag-video.mp4? Apply optimized overlay settings for bright patriotic content.
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={applyUSAFlagPreset}
              className="shrink-0"
            >
              Apply USA Flag Preset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Recommended for bright flag videos:</strong> 65% overlay, vignette enabled, auto-contrast on, centered text.
            </p>
            <p className="text-xs">
              The USA flag video (flag-video.mp4) is already in <code className="px-1 py-0.5 rounded bg-muted">/src/assets/video/</code>. 
              Click "Apply USA Flag Preset" to automatically configure all settings including video URL and poster image.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <VideoCamera className="h-5 w-5" />
            Video & Poster
          </CardTitle>
          <CardDescription>
            Set the background video and fallback poster image. Video must be optimized for web (MP4, reasonable bitrate).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-url">Video URL (MP4)</Label>
            <div className="flex gap-2">
              <Input
                id="video-url"
                type="text"
                placeholder="https://example.com/video.mp4 or /src/assets/video/flag-video.mp4"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setVideoUrl(ASSET_PATHS.videos.usaFlag)
                  toast.info('USA Flag video path inserted')
                }}
                className="shrink-0"
              >
                Use Flag Video
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to use gradient background. If provided, video will autoplay muted and loop.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="poster-url">Poster Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="poster-url"
                type="text"
                placeholder="https://example.com/poster.jpg or /src/assets/images/us-flag-50.png"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setPosterUrl(ASSET_PATHS.images.usFlag50)
                  toast.info('USA Flag poster path inserted')
                }}
                className="shrink-0"
              >
                Use Flag Poster
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Shown while video loads or if video fails. Also shown for reduced-motion users when motion is off.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overlay & Readability</CardTitle>
          <CardDescription>
            Control dark overlay intensity and vignette to ensure white text remains readable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="overlay-intensity">Overlay Intensity</Label>
              <span className="text-sm text-muted-foreground">{Math.round(overlayIntensity * 100)}%</span>
            </div>
            <Slider
              id="overlay-intensity"
              min={0}
              max={1}
              step={0.05}
              value={[overlayIntensity]}
              onValueChange={([value]) => setOverlayIntensity(value)}
            />
            <p className="text-xs text-muted-foreground">
              Higher values darken the background more. Recommended: 0.4-0.5 for dark videos, 0.65-0.7 for bright content like USA flag.
            </p>
            {overlayIntensity >= 0.6 && overlayIntensity <= 0.7 && (
              <div className="flex items-center gap-2 text-xs text-primary">
                <Check className="h-4 w-4" />
                <span>Optimal range for bright patriotic content</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="vignette-enabled">Gradient Vignette</Label>
              <p className="text-xs text-muted-foreground">
                Adds subtle darkening at edges for better text readability
              </p>
            </div>
            <Switch
              id="vignette-enabled"
              checked={vignetteEnabled}
              onCheckedChange={setVignetteEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-contrast">Auto-Contrast Boost</Label>
              <p className="text-xs text-muted-foreground">
                Automatically increases overlay for brighter backgrounds
              </p>
            </div>
            <Switch
              id="auto-contrast"
              checked={autoContrast}
              onCheckedChange={setAutoContrast}
            />
          </div>

          {autoContrast && overlayIntensity < 0.6 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/10 border border-accent/30">
              <Warning className="h-5 w-5 text-accent mt-0.5" />
              <div className="text-sm">
                <strong>Auto-contrast active:</strong> Minimum overlay of 60% will be enforced for readability.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Text Content & Layout</CardTitle>
          <CardDescription>
            Customize headline, subhead, and text alignment for the hero section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="headline-text">Headline Text</Label>
            <Input
              id="headline-text"
              type="text"
              placeholder="Devon Tyler Barber"
              value={headlineText}
              onChange={(e) => setHeadlineText(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subhead-text">Subhead Text</Label>
            <Input
              id="subhead-text"
              type="text"
              placeholder="Founder & Innovator"
              value={subheadText}
              onChange={(e) => setSubheadText(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text-alignment">Text Alignment</Label>
            <Select value={textAlignment} onValueChange={(value: 'left' | 'center') => setTextAlignment(value)}>
              <SelectTrigger id="text-alignment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="left">Left (Desktop: center-left, Mobile: left)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Call-to-Action Buttons</CardTitle>
          <CardDescription>
            Optional CTA buttons displayed above the Trinity selector. Leave empty to hide.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-medium">Primary CTA</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cta-primary-label">Button Label</Label>
                <Input
                  id="cta-primary-label"
                  type="text"
                  placeholder="Download Packet"
                  value={ctaPrimaryLabel}
                  onChange={(e) => setCtaPrimaryLabel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta-primary-url">Button URL</Label>
                <Input
                  id="cta-primary-url"
                  type="url"
                  placeholder="https://example.com/packet.pdf"
                  value={ctaPrimaryUrl}
                  onChange={(e) => setCtaPrimaryUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Secondary CTA</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cta-secondary-label">Button Label</Label>
                <Input
                  id="cta-secondary-label"
                  type="text"
                  placeholder="Schedule Call"
                  value={ctaSecondaryLabel}
                  onChange={(e) => setCtaSecondaryLabel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta-secondary-url">Button URL</Label>
                <Input
                  id="cta-secondary-url"
                  type="url"
                  placeholder="https://calendly.com/..."
                  value={ctaSecondaryUrl}
                  onChange={(e) => setCtaSecondaryUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Motion & Accessibility</CardTitle>
          <CardDescription>
            Control video playback behavior for users with motion sensitivity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="motion-mode">Motion Mode</Label>
            <Select value={motionMode} onValueChange={(value: 'full' | 'reduced' | 'off') => setMotionMode(value)}>
              <SelectTrigger id="motion-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full — Always autoplay video</SelectItem>
                <SelectItem value="reduced">Reduced — Pause video if user prefers reduced motion</SelectItem>
                <SelectItem value="off">Off — Always show poster, never play video</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Users will see a pause/play button to control playback regardless of setting.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 mb-4">
            <Check className="h-5 w-5 text-accent mt-0.5" />
            <div className="space-y-1 flex-1">
              <h4 className="font-medium">Best Practices</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Optimize video for web: MP4, H.264 codec, ~1-2 Mbps bitrate, 1080p max</li>
                <li>• Keep videos short (10-30 seconds) and loopable</li>
                <li>• Always provide a poster image for fast initial display</li>
                <li>• Test text readability: 40-50% for dark videos, 65-70% for bright content</li>
                <li>• Flag video? Use the preset above for optimal settings (65% overlay)</li>
                <li>• Use white text with strong weight (700) and generous letter spacing</li>
                <li>• Respect reduced motion: users with motion sensitivity see poster only</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave}>
          Save Hero Media Settings
        </Button>
      </div>
    </div>
  )
}
