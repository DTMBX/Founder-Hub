import { useKV } from '@/lib/local-storage-kv'
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
import { Info, Globe, Eye, Gauge, Palette, GithubLogo, CheckCircle, XCircle, CreditCard } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import { 
  getGitHubToken, 
  setGitHubToken, 
  clearGitHubToken, 
  hasGitHubToken, 
  testGitHubToken 
} from '@/lib/github-sync'

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
  
  // GitHub integration state
  const [githubToken, setGithubTokenState] = useState('')
  const [tokenStatus, setTokenStatus] = useState<'unchecked' | 'valid' | 'invalid'>('unchecked')
  const [isTestingToken, setIsTestingToken] = useState(false)
  
  useEffect(() => {
    const existing = getGitHubToken()
    if (existing) {
      setGithubTokenState('••••••••••••••••') // Masked
      setTokenStatus('valid') // Assume valid if exists
    }
  }, [])
  
  const handleTestToken = async () => {
    const tokenToTest = githubToken.startsWith('••') ? getGitHubToken() : githubToken
    if (!tokenToTest) {
      toast.error('Please enter a token')
      return
    }
    
    setIsTestingToken(true)
    const result = await testGitHubToken(tokenToTest)
    setIsTestingToken(false)
    
    if (result.valid) {
      setTokenStatus('valid')
      if (!githubToken.startsWith('••')) {
        setGitHubToken(tokenToTest)
        setGithubTokenState('••••••••••••••••')
      }
      toast.success('GitHub token is valid!')
    } else {
      setTokenStatus('invalid')
      toast.error(result.error || 'Invalid token')
    }
  }
  
  const handleClearToken = () => {
    clearGitHubToken()
    setGithubTokenState('')
    setTokenStatus('unchecked')
    toast.success('GitHub token removed')
  }

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

      {/* GitHub Integration */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <GithubLogo className="h-4 w-4 text-primary" weight="duotone" />
            GitHub Integration
          </CardTitle>
          <CardDescription>Configure auto-publish to GitHub. Changes will be committed directly to your repo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="github-token">Personal Access Token</Label>
            <div className="flex gap-2">
              <Input
                id="github-token"
                type={githubToken.startsWith('••') ? 'text' : 'password'}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={githubToken}
                onChange={(e) => {
                  setGithubTokenState(e.target.value)
                  setTokenStatus('unchecked')
                }}
                className="font-mono text-sm"
              />
              <Button 
                variant="outline" 
                onClick={handleTestToken}
                disabled={isTestingToken || !githubToken}
              >
                {isTestingToken ? 'Testing...' : 'Test'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Create a token at GitHub Settings → Developer settings → Personal access tokens (classic). 
              Requires <code className="bg-muted px-1 rounded">repo</code> scope.
            </p>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {tokenStatus === 'valid' && <CheckCircle className="h-4 w-4 text-green-500" weight="fill" />}
              {tokenStatus === 'invalid' && <XCircle className="h-4 w-4 text-red-500" weight="fill" />}
              {tokenStatus === 'unchecked' && <div className="h-4 w-4 rounded-full bg-muted-foreground/30" />}
              <span className="text-sm">
                {tokenStatus === 'valid' && 'Token configured and valid'}
                {tokenStatus === 'invalid' && 'Token is invalid or expired'}
                {tokenStatus === 'unchecked' && 'Token not verified'}
              </span>
            </div>
            {tokenStatus === 'valid' && (
              <Button variant="ghost" size="sm" onClick={handleClearToken}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stripe Integration */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" weight="duotone" />
            Stripe Payments
          </CardTitle>
          <CardDescription>Enable secure checkout for offerings. Payments are processed through Stripe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Switch
                checked={settings?.stripeEnabled || false}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev!, stripeEnabled: checked }))}
              />
              <div>
                <p className="text-sm font-medium">Enable Stripe Checkout</p>
                <p className="text-xs text-muted-foreground">Allow customers to pay directly on your site</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="stripe-pk">Publishable Key</Label>
            <Input
              id="stripe-pk"
              type="password"
              placeholder="pk_live_xxxxxxxxxxxxxxxxxxxx"
              value={settings?.stripePublishableKey || ''}
              onChange={(e) => setSettings(prev => ({ ...prev!, stripePublishableKey: e.target.value }))}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Find this in your{' '}
              <a 
                href="https://dashboard.stripe.com/apikeys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Stripe Dashboard → API Keys
              </a>
              . Use your <strong>Publishable key</strong> (starts with pk_).
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stripe-success">Success URL</Label>
              <Input
                id="stripe-success"
                placeholder="/checkout/success"
                value={settings?.stripeSuccessUrl || ''}
                onChange={(e) => setSettings(prev => ({ ...prev!, stripeSuccessUrl: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Redirect after successful payment</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe-cancel">Cancel URL</Label>
              <Input
                id="stripe-cancel"
                placeholder="/checkout/cancel"
                value={settings?.stripeCancelUrl || ''}
                onChange={(e) => setSettings(prev => ({ ...prev!, stripeCancelUrl: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Redirect if checkout is cancelled</p>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-xs text-amber-200">
              <strong>Important:</strong> For each offering price tier, add the Stripe Price ID from your{' '}
              <a 
                href="https://dashboard.stripe.com/products" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline"
              >
                Stripe Products
              </a>
              . Create products in Stripe Dashboard → Products, then copy the Price ID (price_xxx).
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">Save Settings</Button>
      </div>
    </div>
  )
}
