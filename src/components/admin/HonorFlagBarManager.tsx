import { useState } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Flag, Info, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface FlagConfig {
  id: string
  label: string
  description: string
  type: 'svg' | 'png'
  resolution?: string
}

const FLAG_CONFIGS: FlagConfig[] = [
  {
    id: 'us-flag-official',
    label: 'United States Flag',
    description: 'Official 50-star US flag (SVG - High Resolution)',
    type: 'svg'
  },
  {
    id: 'betsy-ross',
    label: 'Betsy Ross Flag',
    description: '13-star colonial flag (SVG - High Resolution)',
    type: 'svg'
  },
  {
    id: 'gadsden',
    label: 'Gadsden Flag',
    description: 'Don\'t Tread on Me (SVG - High Resolution)',
    type: 'svg'
  },
  {
    id: 'appeal-to-heaven',
    label: 'Appeal to Heaven Flag',
    description: 'Pine tree flag (SVG - High Resolution)',
    type: 'svg'
  },
  {
    id: 'gonzales',
    label: 'Gonzales Come and Take It',
    description: 'Texas Revolution flag (SVG - High Resolution)',
    type: 'svg'
  },
  {
    id: 'pow-mia',
    label: 'POW/MIA Flag',
    description: 'Prisoner of War/Missing in Action (SVG - High Resolution)',
    type: 'svg'
  }
]

export default function HonorFlagBarManager() {
  const [flagSettings, setFlagSettings] = useKV<Record<string, boolean>>('honor-flag-bar-settings', {
    'us-flag-official': true,
    'betsy-ross': true,
    'gadsden': true,
    'appeal-to-heaven': true,
    'gonzales': true,
    'pow-mia': true
  })

  const [barEnabled, setBarEnabled] = useKV<boolean>('honor-flag-bar-enabled', true)
  const [animationEnabled, setAnimationEnabled] = useKV<boolean>('honor-flag-bar-animation', true)
  const [parallaxEnabled, setParallaxEnabled] = useKV<boolean>('honor-flag-bar-parallax', true)
  const [rotationCadence, setRotationCadence] = useKV<number>('honor-flag-bar-rotation', 20)
  const [maxFlagsDesktop, setMaxFlagsDesktop] = useKV<number>('honor-flag-bar-max-desktop', 7)
  const [maxFlagsMobile, setMaxFlagsMobile] = useKV<number>('honor-flag-bar-max-mobile', 3)
  const [alignment, setAlignment] = useKV<'left' | 'center' | 'right'>('honor-flag-bar-alignment', 'center')

  const [saving, setSaving] = useState(false)

  const handleFlagToggle = (flagId: string, enabled: boolean) => {
    setFlagSettings((current) => ({
      ...current,
      [flagId]: enabled
    }))
    toast.success(enabled ? 'Flag enabled' : 'Flag disabled')
  }

  const enabledCount = Object.values(flagSettings || {}).filter(Boolean).length

  const handleSave = async () => {
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      toast.success('Honor Flag Bar settings saved')
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefaults = () => {
    setFlagSettings({
      'us-flag-official': true,
      'betsy-ross': true,
      'gadsden': true,
      'appeal-to-heaven': true,
      'gonzales': true,
      'pow-mia': true
    })
    setBarEnabled(true)
    setAnimationEnabled(true)
    setParallaxEnabled(true)
    setRotationCadence(20)
    setMaxFlagsDesktop(7)
    setMaxFlagsMobile(3)
    setAlignment('center')
    toast.success('Reset to default settings')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Honor Flag Bar</h2>
        <p className="text-muted-foreground mt-1">
          Configure the flag assets and appearance settings for the Honor Flag Bar
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          The Honor Flag Bar appears at the top of every page. PNG assets are optimized at 2x resolution for crisp rendering on all displays. 
          The parallax effect creates subtle downward movement when scrolling.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Control the overall behavior of the Honor Flag Bar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Honor Flag Bar</Label>
              <p className="text-sm text-muted-foreground">Show the flag bar on all pages</p>
            </div>
            <Switch
              checked={barEnabled}
              onCheckedChange={setBarEnabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Wind Animation</Label>
              <p className="text-sm text-muted-foreground">Subtle wave motion (respects reduced motion)</p>
            </div>
            <Switch
              checked={animationEnabled}
              onCheckedChange={setAnimationEnabled}
              disabled={!barEnabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Parallax Effect</Label>
              <p className="text-sm text-muted-foreground">Subtle downward movement on scroll</p>
            </div>
            <Switch
              checked={parallaxEnabled}
              onCheckedChange={setParallaxEnabled}
              disabled={!barEnabled}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="space-y-0.5">
              <Label>Alignment</Label>
              <p className="text-sm text-muted-foreground">Horizontal position of flag group</p>
            </div>
            <Select value={alignment} onValueChange={(v) => setAlignment(v as 'left' | 'center' | 'right')} disabled={!barEnabled}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="space-y-0.5">
              <Label>Rotation Cadence (seconds)</Label>
              <p className="text-sm text-muted-foreground">How often to cycle through flag sets</p>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                value={[rotationCadence ?? 20]}
                onValueChange={([v]) => setRotationCadence(v)}
                min={10}
                max={60}
                step={5}
                className="flex-1"
                disabled={!barEnabled}
              />
              <span className="text-sm font-medium w-12 text-right">{rotationCadence ?? 20}s</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="space-y-0.5">
              <Label>Max Flags (Desktop)</Label>
              <p className="text-sm text-muted-foreground">Maximum flags shown at once on wide screens</p>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                value={[maxFlagsDesktop ?? 7]}
                onValueChange={([v]) => setMaxFlagsDesktop(v)}
                min={3}
                max={9}
                step={1}
                className="flex-1"
                disabled={!barEnabled}
              />
              <span className="text-sm font-medium w-12 text-right">{maxFlagsDesktop ?? 7}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="space-y-0.5">
              <Label>Max Flags (Mobile)</Label>
              <p className="text-sm text-muted-foreground">Maximum flags shown at once on mobile</p>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                value={[maxFlagsMobile ?? 3]}
                onValueChange={([v]) => setMaxFlagsMobile(v)}
                min={2}
                max={5}
                step={1}
                className="flex-1"
                disabled={!barEnabled}
              />
              <span className="text-sm font-medium w-12 text-right">{maxFlagsMobile ?? 3}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flag Assets ({enabledCount} enabled)</CardTitle>
          <CardDescription>
            Select which flags to display in the Honor Flag Bar. All images are optimized for high-resolution displays.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {FLAG_CONFIGS.map((flag) => (
              <div key={flag.id}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={flag.id} className="font-medium">
                        {flag.label}
                      </Label>
                      {flag.type === 'svg' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-mono">
                          <CheckCircle className="h-3 w-3" weight="fill" />
                          SVG
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 text-accent text-xs font-mono">
                          <CheckCircle className="h-3 w-3" weight="fill" />
                          PNG 2×
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{flag.description}</p>
                  </div>
                  <Switch
                    id={flag.id}
                    checked={flagSettings?.[flag.id] ?? false}
                    onCheckedChange={(checked) => handleFlagToggle(flag.id, checked)}
                    disabled={!barEnabled}
                  />
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving || !barEnabled}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button variant="outline" onClick={handleResetToDefaults}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}
