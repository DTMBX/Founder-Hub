import { useKV } from '@github/spark/hooks'
import { SiteSettings } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAuth, logAudit } from '@/lib/auth'

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
        <h2 className="text-2xl font-bold mb-2">Site Settings</h2>
        <p className="text-muted-foreground">Configure your site's basic information and features.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>Basic site details and metadata</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              value={settings?.siteName || ''}
              onChange={(e) => setSettings(prev => ({ ...prev!, siteName: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={settings?.tagline || ''}
              onChange={(e) => setSettings(prev => ({ ...prev!, tagline: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={settings?.description || ''}
              onChange={(e) => setSettings(prev => ({ ...prev!, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryDomain">Primary Domain</Label>
            <Input
              id="primaryDomain"
              value={settings?.primaryDomain || ''}
              onChange={(e) => setSettings(prev => ({ ...prev!, primaryDomain: e.target.value }))}
              placeholder="xTx396.online"
            />
            <p className="text-xs text-muted-foreground">
              Supported: xTx396.online, xTx396.info, xTx396.com
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Enable or disable site features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="investorMode">Investor Mode Toggle</Label>
              <p className="text-sm text-muted-foreground">
                Allow visitors to enable investor-focused view
              </p>
            </div>
            <Switch
              id="investorMode"
              checked={settings?.investorModeAvailable}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev!, investorModeAvailable: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics">Analytics</Label>
              <p className="text-sm text-muted-foreground">
                Track basic page views and section interactions
              </p>
            </div>
            <Switch
              id="analytics"
              checked={settings?.analyticsEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev!, analyticsEnabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="indexing">Search Engine Indexing</Label>
              <p className="text-sm text-muted-foreground">
                Allow search engines to index your site
              </p>
            </div>
            <Switch
              id="indexing"
              checked={settings?.indexingEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev!, indexingEnabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  )
}
