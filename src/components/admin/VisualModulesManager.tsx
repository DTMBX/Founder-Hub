import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { AssetMetadata, HeroAccentSettings, FlagGallerySettings, MapSpotlightSettings } from '@/lib/asset-types'
import { CheckCircle, Flag, MapTrifold, Sparkle } from '@phosphor-icons/react'

export default function VisualModulesManager() {
  const [assets] = useKV<AssetMetadata[]>('asset-metadata', [])
  const [heroAccent, setHeroAccent] = useKV<HeroAccentSettings>('hero-accent-settings', {
    enabled: false,
    position: 'corner-right',
    opacity: 0.15,
    blendMode: 'normal',
  })
  
  const [flagGallery, setFlagGallery] = useKV<FlagGallerySettings>('flag-gallery-settings', {
    enabled: false,
    enabledForAudiences: ['friends'],
    title: 'Heritage Flags',
    description: 'A collection of historical American flags representing key moments in the nation\'s founding.',
    flagAssetIds: [],
  })
  
  const [mapSpotlight, setMapSpotlight] = useKV<MapSpotlightSettings>('map-spotlight-settings', {
    enabled: false,
    animationType: 'outline',
    animationSpeed: 3,
    animationIntensity: 0.5,
    placement: 'about',
    respectReducedMotion: true,
  })
  
  const flagAssets = (assets || []).filter(a => a.category === 'flags')
  const mapAssets = (assets || []).filter(a => a.category === 'maps')
  const allAccentAssets = (assets || []).filter(a => 
    a.usageIntent.includes('hero') || 
    a.usageIntent.includes('accent') || 
    a.usageIntent.includes('watermark')
  )
  
  const handleSaveHeroAccent = () => {
    toast.success('Hero accent settings saved')
  }
  
  const handleSaveFlagGallery = () => {
    toast.success('Flag gallery settings saved')
  }
  
  const handleSaveMapSpotlight = () => {
    toast.success('Map spotlight settings saved')
  }
  
  const toggleFlagInGallery = (assetId: string) => {
    setFlagGallery(current => {
      const settings = current || {
        enabled: false,
        enabledForAudiences: ['friends'],
        title: 'Heritage Flags',
        description: '',
        flagAssetIds: [],
      }
      
      const flagAssetIds = settings.flagAssetIds.includes(assetId)
        ? settings.flagAssetIds.filter(id => id !== assetId)
        : [...settings.flagAssetIds, assetId]
      
      return { ...settings, flagAssetIds }
    })
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Visual Modules Manager</h2>
        <p className="text-sm text-muted-foreground">
          Configure hero accents, flag galleries, and map animations
        </p>
      </div>
      
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Sparkle className="text-primary" size={24} />
          <div>
            <h3 className="text-lg font-semibold">Hero Accent Asset</h3>
            <p className="text-sm text-muted-foreground">
              Add a subtle decorative element behind hero text
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label>Enable Hero Accent</Label>
            <Switch
              checked={heroAccent?.enabled || false}
              onCheckedChange={(checked) => setHeroAccent(prev => ({ ...(prev || {}), enabled: checked } as HeroAccentSettings))}
            />
          </div>
          
          {heroAccent?.enabled && (
            <>
              <Separator />
              
              <div>
                <Label>Select Asset</Label>
                <Select
                  value={heroAccent.assetId || ''}
                  onValueChange={(value) => setHeroAccent(prev => ({ ...(prev || {}), assetId: value } as HeroAccentSettings))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an asset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allAccentAssets.map(asset => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.fileName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Position</Label>
                <Select
                  value={heroAccent.position}
                  onValueChange={(value: any) => setHeroAccent(prev => ({ ...(prev || {}), position: value } as HeroAccentSettings))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corner-left">Corner Left</SelectItem>
                    <SelectItem value="corner-right">Corner Right</SelectItem>
                    <SelectItem value="watermark">Center Watermark</SelectItem>
                    <SelectItem value="full-background">Full Background</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Opacity: {((heroAccent.opacity || 0.15) * 100).toFixed(0)}%</Label>
                <Slider
                  value={[heroAccent.opacity * 100]}
                  onValueChange={([value]) => setHeroAccent(prev => ({ ...(prev || {}), opacity: value / 100 } as HeroAccentSettings))}
                  min={5}
                  max={50}
                  step={5}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label>Blend Mode</Label>
                <Select
                  value={heroAccent.blendMode}
                  onValueChange={(value: any) => setHeroAccent(prev => ({ ...(prev || {}), blendMode: value } as HeroAccentSettings))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="multiply">Multiply</SelectItem>
                    <SelectItem value="screen">Screen</SelectItem>
                    <SelectItem value="overlay">Overlay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleSaveHeroAccent} className="w-full">
                <CheckCircle className="mr-2" />
                Save Hero Accent Settings
              </Button>
            </>
          )}
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Flag className="text-primary" size={24} />
          <div>
            <h3 className="text-lg font-semibold">Heritage Flags Gallery</h3>
            <p className="text-sm text-muted-foreground">
              Curated gallery of historical American flags
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label>Enable Flag Gallery</Label>
            <Switch
              checked={flagGallery?.enabled || false}
              onCheckedChange={(checked) => setFlagGallery(prev => ({ ...(prev || {}), enabled: checked } as FlagGallerySettings))}
            />
          </div>
          
          {flagGallery?.enabled && (
            <>
              <Separator />
              
              <div>
                <Label>Gallery Title</Label>
                <Input
                  value={flagGallery.title}
                  onChange={(e) => setFlagGallery(prev => ({ ...(prev || {}), title: e.target.value } as FlagGallerySettings))}
                  placeholder="Heritage Flags"
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={flagGallery.description}
                  onChange={(e) => setFlagGallery(prev => ({ ...(prev || {}), description: e.target.value } as FlagGallerySettings))}
                  placeholder="A collection of historical American flags..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label className="mb-3 block">Select Flags to Display</Label>
                <ScrollArea className="h-[300px] rounded-lg border p-4">
                  <div className="space-y-3">
                    {flagAssets.map(asset => (
                      <div
                        key={asset.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => toggleFlagInGallery(asset.id)}
                      >
                        <div className="w-16 h-10 bg-muted rounded overflow-hidden shrink-0">
                          <img src={asset.filePath} alt={asset.fileName} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{asset.fileName}</p>
                          <div className="flex gap-1 mt-1">
                            {asset.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          {flagGallery.flagAssetIds.includes(asset.id) && (
                            <CheckCircle className="text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              <div>
                <Label>Enabled for Audiences</Label>
                <div className="flex gap-2 mt-2">
                  {['investors', 'legal', 'friends', 'all'].map(audience => (
                    <Button
                      key={audience}
                      size="sm"
                      variant={flagGallery.enabledForAudiences.includes(audience as any) ? 'default' : 'outline'}
                      onClick={() => {
                        setFlagGallery(prev => {
                          const settings = prev || { enabled: false, enabledForAudiences: [], title: '', description: '', flagAssetIds: [] }
                          const audiences = settings.enabledForAudiences.includes(audience as any)
                            ? settings.enabledForAudiences.filter(a => a !== audience)
                            : [...settings.enabledForAudiences, audience as any]
                          return { ...settings, enabledForAudiences: audiences }
                        })
                      }}
                    >
                      {audience}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Button onClick={handleSaveFlagGallery} className="w-full">
                <CheckCircle className="mr-2" />
                Save Flag Gallery Settings
              </Button>
            </>
          )}
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <MapTrifold className="text-primary" size={24} />
          <div>
            <h3 className="text-lg font-semibold">USA Map Spotlight</h3>
            <p className="text-sm text-muted-foreground">
              Animated decorative map element
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label>Enable Map Spotlight</Label>
            <Switch
              checked={mapSpotlight?.enabled || false}
              onCheckedChange={(checked) => setMapSpotlight(prev => ({ ...(prev || {}), enabled: checked } as MapSpotlightSettings))}
            />
          </div>
          
          {mapSpotlight?.enabled && (
            <>
              <Separator />
              
              <div>
                <Label>Select Map Asset</Label>
                <Select
                  value={mapSpotlight.assetId || ''}
                  onValueChange={(value) => setMapSpotlight(prev => ({ ...(prev || {}), assetId: value } as MapSpotlightSettings))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a map..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mapAssets.map(asset => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.fileName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Animation Type</Label>
                <Select
                  value={mapSpotlight.animationType}
                  onValueChange={(value: any) => setMapSpotlight(prev => ({ ...(prev || {}), animationType: value } as MapSpotlightSettings))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Static)</SelectItem>
                    <SelectItem value="outline">Outline Draw</SelectItem>
                    <SelectItem value="pulse">Pulse</SelectItem>
                    <SelectItem value="gradient">Sweeping Gradient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {mapSpotlight.animationType !== 'none' && (
                <>
                  <div>
                    <Label>Animation Speed: {mapSpotlight.animationSpeed}s</Label>
                    <Slider
                      value={[mapSpotlight.animationSpeed]}
                      onValueChange={([value]) => setMapSpotlight(prev => ({ ...(prev || {}), animationSpeed: value } as MapSpotlightSettings))}
                      min={1}
                      max={10}
                      step={0.5}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label>Animation Intensity: {(mapSpotlight.animationIntensity * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[mapSpotlight.animationIntensity * 100]}
                      onValueChange={([value]) => setMapSpotlight(prev => ({ ...(prev || {}), animationIntensity: value / 100 } as MapSpotlightSettings))}
                      min={10}
                      max={100}
                      step={10}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Respect Reduced Motion</Label>
                    <Switch
                      checked={mapSpotlight.respectReducedMotion}
                      onCheckedChange={(checked) => setMapSpotlight(prev => ({ ...(prev || {}), respectReducedMotion: checked } as MapSpotlightSettings))}
                    />
                  </div>
                </>
              )}
              
              <div>
                <Label>Placement</Label>
                <Select
                  value={mapSpotlight.placement}
                  onValueChange={(value: any) => setMapSpotlight(prev => ({ ...(prev || {}), placement: value } as MapSpotlightSettings))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero Section</SelectItem>
                    <SelectItem value="about">About Section</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleSaveMapSpotlight} className="w-full">
                <CheckCircle className="mr-2" />
                Save Map Spotlight Settings
              </Button>
            </>
          )}
        </div>
      </Card>
      
      <Card className="p-4 bg-muted/50">
        <h4 className="font-semibold text-sm mb-2">Best Practices</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Keep hero accents subtle (10-20% opacity) to maintain text readability</li>
          <li>• Flag gallery works best in Friends/Supporters mode - keep it off for Investors/Legal by default</li>
          <li>• Map animations should be short (2-4s) and respect reduced-motion preferences</li>
          <li>• Test all visual modules on mobile devices for performance</li>
        </ul>
      </Card>
    </div>
  )
}
