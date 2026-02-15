import { useKV } from '@github/spark/hooks'
import { SiteSettings } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useAuth, logAudit } from '@/lib/auth'
import { Info, Globe, Eye, Gauge, Palette } from '@phosphor-icons/react'

export default function SettingsManager() {
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
  const { currentUser } = useAuth()

  const handleSave = async () => {
    if (currentUser) {
      await logAudit(currentUser.id, currentUser.email, 'update_settings', 'Updated site settings')
    }
    toast.success('Settings saved successfully')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Site Settings</h2>
        <p className="text-sm text-muted-foreground">Configure your site identity, features, and display preferences.</p>
      </div>

      {/* Identity */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-primary" weight="duotone" />
            Identity & Branding
          </CardTitle>
          <CardDescription>Your site's name, tagline, and metadata.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings?.siteName || ''}
                onChange={(e) => setSettings(prev => ({ ...prev!, siteName: e.target.value }))}
                placeholder="Devon Tyler Barber"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={settings?.tagline || ''}
                onChange={(e) => setSettings(prev => ({ ...prev!, tagline: e.target.value }))}
                placeholder="Founder & Innovator"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Site Description</Label>
            <Textarea
              id="description"
              value={settings?.description || ''}
              onChange={(e) => setSettings(prev => ({ ...prev!, description: e.target.value }))}
              rows={2}
              placeholder="A brief description for search engines and social previews"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="socialPreview">Social Preview Image URL</Label>
            <Input
              id="socialPreview"
              value={settings?.socialPreviewImage || ''}
              onChange={(e) => setSettings(prev => ({ ...prev!, socialPreviewImage: e.target.value }))}
              placeholder="https://example.com/og-image.png"
            />
            <p className="text-xs text-muted-foreground">Used for Open Graph / social media previews (1200×630 recommended)</p>
          </div>
        </CardContent>
      </Card>

      {/* Domain */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-primary" weight="duotone" />
            Domain Configuration
          </CardTitle>
          <CardDescription>Primary domain and redirect settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primaryDomain">Primary Domain</Label>
            <Input
              id="primaryDomain"
              value={settings?.primaryDomain || ''}
              onChange={(e) => setSettings(prev => ({ ...prev!, primaryDomain: e.target.value }))}
              placeholder="xTx396.online"
            />
          </div>
          <div className="space-y-2">
            <Label>Domain Redirects</Label>
            <div className="flex flex-wrap gap-2">
              {(settings?.domainRedirects || []).map((domain, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs font-mono">
                  {domain}
                  <button
                    onClick={() => setSettings(prev => ({
                      ...prev!,
                      domainRedirects: (prev?.domainRedirects || []).filter((_, idx) => idx !== i)
                    }))}
                    className="text-muted-foreground hover:text-foreground ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <Input
              placeholder="Add redirect domain (press Enter)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  setSettings(prev => ({
                    ...prev!,
                    domainRedirects: [...(prev?.domainRedirects || []), e.currentTarget.value.trim()]
                  }))
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4 text-primary" weight="duotone" />
            Features & Privacy
          </CardTitle>
          <CardDescription>Toggle site-wide features on or off.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            {
              id: 'investorMode',
              label: 'Investor Pathway',
              description: 'Show investor-focused pathway option on landing page',
              checked: settings?.investorModeAvailable,
              onChange: (checked: boolean) => setSettings(prev => ({ ...prev!, investorModeAvailable: checked }))
            },
            {
              id: 'analytics',
              label: 'Page View Tracking',
              description: 'Track basic page views for internal analytics',
              checked: settings?.analyticsEnabled,
              onChange: (checked: boolean) => setSettings(prev => ({ ...prev!, analyticsEnabled: checked }))
            },
            {
              id: 'indexing',
              label: 'Search Engine Indexing',
              description: 'Allow search engines to discover and index pages',
              checked: settings?.indexingEnabled,
              onChange: (checked: boolean) => setSettings(prev => ({ ...prev!, indexingEnabled: checked }))
            },
          ].map((feature) => (
            <div key={feature.id} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={feature.id} className="text-sm font-medium">{feature.label}</Label>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
              <Switch
                id={feature.id}
                checked={feature.checked}
                onCheckedChange={feature.onChange}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4 text-primary" weight="duotone" />
            Display Preferences
          </CardTitle>
          <CardDescription>Control motion, glass effects, and contrast across the site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Motion Level</Label>
              <Select
                value={settings?.motionLevel || 'full'}
                onValueChange={(value) => setSettings(prev => ({ ...prev!, motionLevel: value as any }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full animations</SelectItem>
                  <SelectItem value="reduced">Reduced motion</SelectItem>
                  <SelectItem value="off">No motion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Glass Effect Intensity</Label>
              <Select
                value={settings?.glassIntensity || 'medium'}
                onValueChange={(value) => setSettings(prev => ({ ...prev!, glassIntensity: value as any }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Subtle</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">Strong</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contrast Mode</Label>
              <Select
                value={settings?.contrastMode || 'standard'}
                onValueChange={(value) => setSettings(prev => ({ ...prev!, contrastMode: value as any }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="extra">Extra contrast</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">Save Settings</Button>
      </div>
    </div>
  )
}
