import { useKV } from '@github/spark/hooks'
import { Section } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAuth, logAudit } from '@/lib/auth'

export default function ContentManager() {
  const [sections, setSections] = useKV<Section[]>('founder-hub-sections', [])
  const { currentUser } = useAuth()

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSections(currentSections => 
      (currentSections || []).map(s => s.id === id ? { ...s, ...updates } : s)
    )
  }

  const handlePublish = async () => {
    if (currentUser) {
      await logAudit(currentUser.id, currentUser.email, 'update_section', 'Published section changes')
    }
    toast.success('Changes published successfully')
  }

  const heroSection = sections?.find(s => s.type === 'hero')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Content Management</h2>
          <p className="text-muted-foreground">Edit your site's content sections.</p>
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

      {sections?.filter(s => s.type !== 'hero').map(section => (
        <Card key={section.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="capitalize">{section.type} Section</CardTitle>
                <CardDescription>{section.title}</CardDescription>
              </div>
              <Switch
                checked={section.enabled}
                onCheckedChange={(checked) => updateSection(section.id, { enabled: checked })}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id={`${section.id}-investor`}
                  checked={section.investorRelevant}
                  onCheckedChange={(checked) => updateSection(section.id, { investorRelevant: checked })}
                />
                <Label htmlFor={`${section.id}-investor`} className="text-sm">
                  Show in Investor Mode
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
