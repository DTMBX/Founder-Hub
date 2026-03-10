import { useState, useCallback } from 'react'
import { useKV, isLocalhost } from '@/lib/local-storage-kv'
import { Section, SectionType } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAuth, logAudit } from '@/lib/auth'
import { workspaceApi } from '@/lib/workspace-api'
import { ArrowUp, ArrowDown, Eye, EyeSlash, PencilSimple, Plus, Trash, FloppyDisk, CaretDown, CaretRight, Check } from '@phosphor-icons/react'

const SECTION_TYPES: SectionType[] = ['hero', 'projects', 'now', 'court', 'proof', 'contact', 'about', 'offerings', 'services']

export default function ContentManager() {
  const [sections, setSections] = useKV<Section[]>('founder-hub-sections', [])
  const { currentUser } = useAuth()
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showAddSection, setShowAddSection] = useState(false)
  const [newSectionType, setNewSectionType] = useState<SectionType>('about')
  const [newSectionTitle, setNewSectionTitle] = useState('')

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
    const arr = [...sortedSections]
    const tmpOrder = arr[idx].order
    arr[idx] = { ...arr[idx], order: arr[target].order }
    arr[target] = { ...arr[target], order: tmpOrder }
    setSections(arr)
  }

  const deleteSection = (id: string) => {
    setSections(currentSections => (currentSections || []).filter(s => s.id !== id))
    if (expandedSection === id) setExpandedSection(null)
  }

  const addSection = () => {
    const title = newSectionTitle.trim()
    if (!title) {
      toast.error('Section title is required')
      return
    }
    const maxOrder = Math.max(0, ...(sections || []).map(s => s.order))
    const newSection: Section = {
      id: `${newSectionType}-${Date.now()}`,
      type: newSectionType,
      title,
      content: '',
      order: maxOrder + 1,
      enabled: false,
      investorRelevant: false,
    }
    setSections(currentSections => [...(currentSections || []), newSection])
    setShowAddSection(false)
    setNewSectionTitle('')
    toast.success(`Added "${title}" section`)
  }

  /** Write sections.json to disk via workspace API (dev mode) */
  const saveToDisk = useCallback(async () => {
    if (!isLocalhost()) return false
    try {
      const json = JSON.stringify(sections, null, 2)
      await workspaceApi.write('Founder-Hub/public/data/sections.json', json)
      return true
    } catch (e) {
      console.warn('[ContentManager] Disk save failed:', e)
      return false
    }
  }, [sections])

  const handlePublish = async () => {
    setPublishing(true)
    try {
      // Save to disk in dev mode
      const diskOk = await saveToDisk()

      if (currentUser) {
        await logAudit(currentUser.id, currentUser.email, 'update_section', 'Published section changes')
      }

      setLastSaved(new Date())

      if (diskOk) {
        toast.success('Saved to public/data/sections.json')
      } else {
        toast.success('Changes saved to localStorage (disk save unavailable outside dev)')
      }
    } catch {
      toast.error('Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  const heroSection = sections?.find(s => s.type === 'hero')
  const nonHeroSections = sortedSections.filter(s => s.type !== 'hero')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Content Management</h2>
          <p className="text-muted-foreground">
            Manage section visibility, ordering, and content.
            {lastSaved && (
              <span className="ml-2 text-xs text-green-400">
                <Check className="h-3 w-3 inline mr-0.5" />
                Last saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddSection(!showAddSection)}>
            <Plus className="h-4 w-4 mr-1" /> Add Section
          </Button>
          <Button onClick={handlePublish} disabled={publishing}>
            <FloppyDisk className="h-4 w-4 mr-1" />
            {publishing ? 'Saving…' : 'Save & Publish'}
          </Button>
        </div>
      </div>

      {/* Add section form */}
      {showAddSection && (
        <Card className="border-dashed border-primary/30">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-end gap-3">
              <div className="space-y-1 flex-1">
                <Label htmlFor="new-section-title">Section Title</Label>
                <Input
                  id="new-section-title"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="My New Section"
                  onKeyDown={(e) => e.key === 'Enter' && addSection()}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-section-type">Type</Label>
                <select
                  id="new-section-type"
                  value={newSectionType}
                  onChange={(e) => setNewSectionType(e.target.value as SectionType)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {SECTION_TYPES.filter(t => t !== 'hero').map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <Button onClick={addSection} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Create
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
          <CardDescription>
            Reorder and toggle sections. Click the edit icon to expand inline editing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {nonHeroSections.map((section, index) => {
              const isExpanded = expandedSection === section.id
              return (
                <div key={section.id} className="rounded-lg border border-border/40 bg-card/30 hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-3 p-3 group">
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

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                      className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                    >
                      {isExpanded ? (
                        <CaretDown className="h-3.5 w-3.5 text-primary shrink-0" />
                      ) : (
                        <CaretRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium capitalize">{section.type}</p>
                        <p className="text-xs text-muted-foreground truncate">{section.title}</p>
                      </div>
                    </button>

                    {/* Status indicators */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Enabled toggle */}
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

                      {/* Investor toggle */}
                      <div className="flex items-center gap-1.5">
                        <Badge variant={section.investorRelevant ? 'default' : 'outline'} className="text-[10px] px-1.5">
                          INV
                        </Badge>
                        <Switch
                          checked={section.investorRelevant}
                          onCheckedChange={(checked) => updateSection(section.id, { investorRelevant: checked })}
                        />
                      </div>

                      {/* Edit / Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                      >
                        <PencilSimple className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded inline editor */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 border-t border-border/20 space-y-3">
                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <div className="space-y-1">
                          <Label htmlFor={`section-title-${section.id}`}>Title</Label>
                          <Input
                            id={`section-title-${section.id}`}
                            value={section.title}
                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                            placeholder="Section title"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Type</Label>
                          <Badge variant="secondary" className="capitalize">{section.type}</Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`section-content-${section.id}`}>Content</Label>
                        <Textarea
                          id={`section-content-${section.id}`}
                          value={section.content}
                          onChange={(e) => updateSection(section.id, { content: e.target.value })}
                          placeholder="Section content…"
                          rows={4}
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Order: {section.order}</span>
                          <span>ID: <code className="text-[10px]">{section.id}</code></span>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Delete "${section.title}" section?`)) {
                              deleteSection(section.id)
                            }
                          }}
                        >
                          <Trash className="h-3.5 w-3.5 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
