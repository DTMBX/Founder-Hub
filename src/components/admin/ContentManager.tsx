import { useKV } from '@/lib/local-storage-kv'
import { Section } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAuth, logAudit } from '@/lib/auth'
import { ArrowUp, ArrowDown, Eye, EyeSlash } from '@phosphor-icons/react'

export default function ContentManager() {
  const [sections, setSections] = useKV<Section[]>('founder-hub-sections', [])
  const { currentUser } = useAuth()

  const sortedSections = [...(sections || [])].sort((a, b) => a.order - b.order)

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSections(currentSections => 
      (currentSections || []).map(s => s.id === id ? { ...s, ...updates } : s)
    )
  }

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const idx = sortedSections.findIndex(s => s.id === id)
    const target = direction === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= sortedSections.length) return
    // Swap orders
    const arr = [...sortedSections]
    const tmpOrder = arr[idx].order
    arr[idx] = { ...arr[idx], order: arr[target].order }
    arr[target] = { ...arr[target], order: tmpOrder }
    setSections(arr)
  }

  const handlePublish = async () => {
    if (currentUser) {
      await logAudit(currentUser.id, currentUser.email, 'update_section', 'Published section changes')
    }
    toast.success('Changes published successfully')
  }

  const heroSection = sections?.find(s => s.type === 'hero')
  const nonHeroSections = sortedSections.filter(s => s.type !== 'hero')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Content Management</h2>
          <p className="text-muted-foreground">Manage section visibility, ordering, and content.</p>
        </div>
        <Button onClick={handlePublish}>Publish Changes</Button>
      </div>

      {heroSection && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>Main landing section content</CardDescription>
              </div>
              <Switch
                checked={heroSection.enabled}
                onCheckedChange={(checked) => updateSection(heroSection.id, { enabled: checked })}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hero-title">Title</Label>
              <Input
                id="hero-title"
                value={heroSection.title}
                onChange={(e) => updateSection(heroSection.id, { title: e.target.value })}
                placeholder="Devon Tyler Barber"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-content">Tagline</Label>
              <Textarea
                id="hero-content"
                value={heroSection.content}
                onChange={(e) => updateSection(heroSection.id, { content: e.target.value })}
                placeholder="Founder & Innovator"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="hero-investor"
                checked={heroSection.investorRelevant}
                onCheckedChange={(checked) => updateSection(heroSection.id, { investorRelevant: checked })}
              />
              <Label htmlFor="hero-investor" className="text-sm">
                Show in Investor Mode
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section ordering */}
      <Card>
        <CardHeader>
          <CardTitle>Section Order & Visibility</CardTitle>
          <CardDescription>Drag sections up/down to reorder. Toggle visibility on/off.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {nonHeroSections.map((section, index) => (
              <div
                key={section.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card/30 hover:bg-card/50 transition-colors group"
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveSection(section.id, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveSection(section.id, 'down')}
                    disabled={index === nonHeroSections.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                {/* Order badge */}
                <Badge variant="outline" className="text-[10px] w-6 h-6 shrink-0 flex items-center justify-center p-0">
                  {index + 1}
                </Badge>

                {/* Section info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize">{section.type}</p>
                  <p className="text-xs text-muted-foreground">{section.title}</p>
                </div>

                {/* Status indicators */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {section.enabled ? (
                      <Eye className="h-4 w-4 text-green-400" weight="fill" />
                    ) : (
                      <EyeSlash className="h-4 w-4 text-muted-foreground/50" />
                    )}
                    <Switch
                      checked={section.enabled}
                      onCheckedChange={(checked) => updateSection(section.id, { enabled: checked })}
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge variant={section.investorRelevant ? 'default' : 'outline'} className="text-[10px] px-1.5">
                      INV
                    </Badge>
                    <Switch
                      checked={section.investorRelevant}
                      onCheckedChange={(checked) => updateSection(section.id, { investorRelevant: checked })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
