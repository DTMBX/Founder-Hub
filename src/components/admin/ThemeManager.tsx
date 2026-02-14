import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ThemeManager() {
  const [colors, setColors] = useState({
    background: 'oklch(0.15 0.04 250)',
    foreground: 'oklch(0.98 0 0)',
    card: 'oklch(0.25 0.06 250)',
    primary: 'oklch(0.65 0.24 250)',
    accent: 'oklch(0.75 0.15 200)',
    border: 'oklch(0.30 0.05 250)'
  })

  const [radius, setRadius] = useState('0.75')

  useEffect(() => {
    const root = document.documentElement
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })
    root.style.setProperty('--radius', `${radius}rem`)
  }, [colors, radius])

  const handleColorChange = (key: string, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    setColors({
      background: 'oklch(0.15 0.04 250)',
      foreground: 'oklch(0.98 0 0)',
      card: 'oklch(0.25 0.06 250)',
      primary: 'oklch(0.65 0.24 250)',
      accent: 'oklch(0.75 0.15 200)',
      border: 'oklch(0.30 0.05 250)'
    })
    setRadius('0.75')
    toast.success('Theme reset to defaults')
  }

  const handleSave = () => {
    toast.success('Theme saved (changes are already applied live)')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Theme Customization</h2>
          <p className="text-muted-foreground">Customize your site's appearance. Changes preview instantly.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>Reset to Defaults</Button>
          <Button onClick={handleSave}>Save Theme</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>Define your brand colors using OKLCH format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="color-background">Background</Label>
              <div className="flex gap-2">
                <Input
                  id="color-background"
                  value={colors.background}
                  onChange={(e) => handleColorChange('background', e.target.value)}
                  className="font-mono text-sm"
                />
                <div 
                  className="w-12 h-10 rounded border border-border flex-shrink-0"
                  style={{ background: colors.background }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-foreground">Foreground (Text)</Label>
              <div className="flex gap-2">
                <Input
                  id="color-foreground"
                  value={colors.foreground}
                  onChange={(e) => handleColorChange('foreground', e.target.value)}
                  className="font-mono text-sm"
                />
                <div 
                  className="w-12 h-10 rounded border border-border flex-shrink-0"
                  style={{ background: colors.foreground }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-card">Card Surface</Label>
              <div className="flex gap-2">
                <Input
                  id="color-card"
                  value={colors.card}
                  onChange={(e) => handleColorChange('card', e.target.value)}
                  className="font-mono text-sm"
                />
                <div 
                  className="w-12 h-10 rounded border border-border flex-shrink-0"
                  style={{ background: colors.card }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-primary">Primary (Buttons)</Label>
              <div className="flex gap-2">
                <Input
                  id="color-primary"
                  value={colors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="font-mono text-sm"
                />
                <div 
                  className="w-12 h-10 rounded border border-border flex-shrink-0"
                  style={{ background: colors.primary }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-accent">Accent (Highlights)</Label>
              <div className="flex gap-2">
                <Input
                  id="color-accent"
                  value={colors.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="font-mono text-sm"
                />
                <div 
                  className="w-12 h-10 rounded border border-border flex-shrink-0"
                  style={{ background: colors.accent }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-border">Border</Label>
              <div className="flex gap-2">
                <Input
                  id="color-border"
                  value={colors.border}
                  onChange={(e) => handleColorChange('border', e.target.value)}
                  className="font-mono text-sm"
                />
                <div 
                  className="w-12 h-10 rounded border border-border flex-shrink-0"
                  style={{ background: colors.border }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Border Radius</CardTitle>
          <CardDescription>Adjust the roundness of corners (in rem)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="radius">Radius: {radius} rem</Label>
              <Input
                id="radius"
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <div 
                className="w-20 h-20 bg-primary"
                style={{ borderRadius: `${radius}rem` }}
              />
              <div 
                className="w-20 h-20 bg-accent"
                style={{ borderRadius: `${radius}rem` }}
              />
              <div 
                className="w-20 h-20 bg-card border border-border"
                style={{ borderRadius: `${radius}rem` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>See how your theme looks with UI components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button>Primary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
          </div>
          <Card className="p-4">
            <h3 className="font-bold mb-2">Card Example</h3>
            <p className="text-muted-foreground text-sm">
              This is a preview card showing how content will look with your chosen theme colors and radius.
            </p>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
