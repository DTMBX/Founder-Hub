import { useState } from 'react'
import { useTrackedKV } from '@/hooks/use-tracked-kv'
import { Link } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, Trash, PencilSimple, FloppyDisk, ArrowUp, ArrowDown, X,
  EnvelopeSimple, GithubLogo, LinkedinLogo, TwitterLogo, Globe,
  CalendarBlank, Newspaper, ArrowSquareOut, Link as LinkIcon
} from '@phosphor-icons/react'

const ICON_OPTIONS = [
  { value: 'email', label: 'Email', icon: EnvelopeSimple },
  { value: 'github', label: 'GitHub', icon: GithubLogo },
  { value: 'linkedin', label: 'LinkedIn', icon: LinkedinLogo },
  { value: 'twitter', label: 'Twitter / X', icon: TwitterLogo },
  { value: 'calendar', label: 'Calendar', icon: CalendarBlank },
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'press', label: 'Press', icon: Newspaper },
  { value: 'link', label: 'Link', icon: LinkIcon },
]

function getIcon(iconName?: string) {
  const match = ICON_OPTIONS.find(o => o.value === iconName)
  if (match) {
    const Icon = match.icon
    return <Icon className="h-4 w-4" weight="duotone" />
  }
  return <LinkIcon className="h-4 w-4" weight="duotone" />
}

interface LinkFormData {
  label: string
  url: string
  icon: string
  category: string
}

const EMPTY_LINK: LinkFormData = { label: '', url: '', icon: 'link', category: '' }

export default function LinksManager() {
  const [contactLinks, setContactLinks] = useTrackedKV<Link[]>('founder-hub-contact-links', [], 'Contact Links')
  const [proofLinks, setProofLinks] = useTrackedKV<Link[]>('founder-hub-proof-links', [], 'Proof Links')
  const [activeTab, setActiveTab] = useState('contact')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<LinkFormData>(EMPTY_LINK)
  const [saved, setSaved] = useState(false)

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Get the right links array and setter based on tab
  const getLinksForTab = (tab: string): [Link[], (links: Link[]) => void, string] => {
    if (tab === 'contact') return [contactLinks?.filter(l => l.category === 'contact') || [], (links) => {
      const socialOnly = contactLinks?.filter(l => l.category === 'social') || []
      setContactLinks([...links, ...socialOnly])
    }, 'contact']
    if (tab === 'social') return [contactLinks?.filter(l => l.category === 'social') || [], (links) => {
      const contactOnly = contactLinks?.filter(l => l.category === 'contact') || []
      setContactLinks([...contactOnly, ...links])
    }, 'social']
    if (tab === 'proof') return [proofLinks?.filter(l => l.category === 'proof') || [], (links) => {
      setProofLinks(links)
    }, 'proof']
    return [[], () => {}, '']
  }

  const [currentLinks, setCurrentLinks, currentCategory] = getLinksForTab(activeTab)
  const sorted = [...currentLinks].sort((a, b) => a.order - b.order)

  const resetForm = () => {
    setForm(EMPTY_LINK)
    setShowAdd(false)
    setEditingId(null)
  }

  const addLink = () => {
    if (!form.label.trim() || !form.url.trim()) return
    const newLink: Link = {
      id: `link-${Date.now()}`,
      label: form.label.trim(),
      url: form.url.trim(),
      icon: form.icon || 'link',
      category: currentCategory,
      order: currentLinks.length
    }
    setCurrentLinks([...currentLinks, newLink])
    resetForm()
    showSaved()
  }

  const updateLink = (id: string) => {
    if (!form.label.trim() || !form.url.trim()) return
    setCurrentLinks(currentLinks.map(l => 
      l.id === id ? { ...l, label: form.label.trim(), url: form.url.trim(), icon: form.icon } : l
    ))
    resetForm()
    showSaved()
  }

  const removeLink = (id: string) => {
    setCurrentLinks(currentLinks.filter(l => l.id !== id).map((l, i) => ({ ...l, order: i })))
    showSaved()
  }

  const moveLink = (id: string, direction: 'up' | 'down') => {
    const arr = [...sorted]
    const idx = arr.findIndex(l => l.id === id)
    const target = direction === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    setCurrentLinks(arr.map((l, i) => ({ ...l, order: i })))
    showSaved()
  }

  const startEdit = (link: Link) => {
    setEditingId(link.id)
    setForm({ label: link.label, url: link.url, icon: link.icon || 'link', category: link.category })
    setShowAdd(false)
  }

  const tabDescriptions: Record<string, { title: string; desc: string; placeholder: { label: string; url: string } }> = {
    contact: {
      title: 'Contact Links',
      desc: 'Buttons that appear in the Contact section (email, scheduling, etc.).',
      placeholder: { label: 'Schedule a Call', url: 'https://cal.com/you' }
    },
    social: {
      title: 'Social Profiles',
      desc: 'Social media icons shown at the bottom of the Contact section.',
      placeholder: { label: 'GitHub', url: 'https://github.com/username' }
    },
    proof: {
      title: 'Press & Proof Links',
      desc: 'Media coverage and verification materials shown in the Press & Proof section.',
      placeholder: { label: 'Article Title', url: 'https://example.com/article' }
    }
  }

  const tabInfo = tabDescriptions[activeTab] || tabDescriptions.contact

  return (
    <div className="space-y-6">
      {/* Save indicator */}
      {saved && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-right-4 duration-300">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/40 px-3 py-1.5">
            <FloppyDisk className="h-3.5 w-3.5 mr-1.5" /> Saved
          </Badge>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); resetForm() }}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="contact" className="gap-1.5">
            <EnvelopeSimple className="h-4 w-4" /> Contact
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-1.5">
            <Globe className="h-4 w-4" /> Social
          </TabsTrigger>
          <TabsTrigger value="proof" className="gap-1.5">
            <Newspaper className="h-4 w-4" /> Press & Proof
          </TabsTrigger>
        </TabsList>

        {['contact', 'social', 'proof'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">{tabInfo.title}</h3>
                <p className="text-xs text-muted-foreground">{tabInfo.desc}</p>
              </div>
              <Button size="sm" onClick={() => { setShowAdd(true); setEditingId(null); setForm(EMPTY_LINK) }} disabled={showAdd}>
                <Plus className="h-4 w-4 mr-1" /> Add Link
              </Button>
            </div>

            {/* Add / Edit form */}
            {(showAdd || editingId) && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Label</label>
                      <Input
                        value={form.label}
                        onChange={(e) => setForm({ ...form, label: e.target.value })}
                        placeholder={tabInfo.placeholder.label}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">URL</label>
                      <Input
                        value={form.url}
                        onChange={(e) => setForm({ ...form, url: e.target.value })}
                        placeholder={tabInfo.placeholder.url}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Icon</label>
                      <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ICON_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <opt.icon className="h-4 w-4" />
                                {opt.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={resetForm}>
                      <X className="h-3.5 w-3.5 mr-1" /> Cancel
                    </Button>
                    {editingId ? (
                      <Button size="sm" onClick={() => updateLink(editingId)} disabled={!form.label.trim() || !form.url.trim()}>
                        <FloppyDisk className="h-3.5 w-3.5 mr-1" /> Save
                      </Button>
                    ) : (
                      <Button size="sm" onClick={addLink} disabled={!form.label.trim() || !form.url.trim()}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Links list */}
            {sorted.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No {tab} links yet. Click "Add Link" to create one.
              </p>
            ) : (
              <div className="space-y-1.5">
                {sorted.map((link, index) => (
                  <Card key={link.id} className="p-3 bg-card/30 border-border/40 group hover:border-border/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 p-2 rounded-lg bg-accent/10 border border-border/30">
                        {getIcon(link.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{link.label}</p>
                        <p className="text-xs text-muted-foreground truncate font-mono">{link.url}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveLink(link.id, 'up')} disabled={index === 0}>
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveLink(link.id, 'down')} disabled={index === sorted.length - 1}>
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(link)}>
                          <PencilSimple className="h-3.5 w-3.5" />
                        </Button>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ArrowSquareOut className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeLink(link.id)}>
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
