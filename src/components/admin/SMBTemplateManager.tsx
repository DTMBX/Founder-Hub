import { useState } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import {
  SMBTemplateData,
  SMBTemplateConfig,
  SMBSEOConfig,
  SMBServiceItem,
  SMBTeamMember,
  SMBFaq,
  SMBPromotion,
  SMBBlogPost,
  SMBContactSubmission,
  ClientTestimonial,
} from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus, Pencil, Trash, Star, EyeSlash,
  Storefront, Wrench, UsersThree, ChatCircleDots,
  Question, Info, Globe, Layout,
  Tag, Article, Envelope, MagnifyingGlass, Image,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

// ─── Defaults ──────────────────────────────────────────────────

const DEFAULT_SEO: SMBSEOConfig = {
  siteTitle: '',
  siteDescription: '',
  sitemapEnabled: true,
}

const DEFAULT_CONFIG: SMBTemplateConfig = {
  businessName: '',
  tagline: '',
  description: '',
  industry: '',
  primaryColor: '#2563eb',
  accentColor: '#f59e0b',
  socialLinks: {},
  sections: {
    hero: true,
    services: true,
    about: true,
    team: false,
    testimonials: true,
    faq: true,
    contact: true,
    gallery: false,
    blog: false,
    promotions: false,
    map: false,
  },
  seo: DEFAULT_SEO,
  heroStyle: 'gradient',
}

const DEFAULT_DATA: SMBTemplateData = {
  config: DEFAULT_CONFIG,
  services: [],
  team: [],
  testimonials: [],
  faqs: [],
  galleryImages: [],
  promotions: [],
  blogPosts: [],
  contactSubmissions: [],
}

const INDUSTRIES = [
  'Restaurant', 'Retail', 'Professional Services', 'Healthcare',
  'Construction', 'Real Estate', 'Beauty & Wellness', 'Fitness',
  'Auto Services', 'Home Services', 'Photography', 'Education',
  'Legal', 'Financial', 'Technology', 'Other',
]

const HERO_STYLES = [
  { value: 'gradient', label: 'Gradient' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'split', label: 'Split Layout' },
]

// ─── Component ─────────────────────────────────────────────────

interface SMBTemplateManagerProps {
  siteId?: string
}

export default function SMBTemplateManager({ siteId }: SMBTemplateManagerProps) {
  const kvKey = siteId ? `sites:${siteId}:data` : 'smb-template'
  const [data, setData] = useKV<SMBTemplateData>(kvKey, DEFAULT_DATA)
  const [tab, setTab] = useState('setup')
  const [editingService, setEditingService] = useState<SMBServiceItem | null>(null)
  const [editingTeamMember, setEditingTeamMember] = useState<SMBTeamMember | null>(null)
  const [editingTestimonial, setEditingTestimonial] = useState<ClientTestimonial | null>(null)
  const [editingFaq, setEditingFaq] = useState<SMBFaq | null>(null)
  const [editingPromo, setEditingPromo] = useState<SMBPromotion | null>(null)
  const [editingBlog, setEditingBlog] = useState<SMBBlogPost | null>(null)
  const [dialogType, setDialogType] = useState<string | null>(null)

  // ─── Helpers ───────────────────────────────────────
  const up = (updates: Partial<SMBTemplateConfig>) => setData(prev => ({ ...prev, config: { ...prev.config, ...updates } }))
  const upSEO = (updates: Partial<SMBSEOConfig>) => setData(prev => ({
    ...prev,
    config: { ...prev.config, seo: { ...(prev.config.seo || DEFAULT_SEO), ...updates } }
  }))
  const seo = data.config.seo || DEFAULT_SEO
  const close = () => { setDialogType(null); setEditingService(null); setEditingTeamMember(null); setEditingTestimonial(null); setEditingFaq(null); setEditingPromo(null); setEditingBlog(null) }

  const updateSections = (key: string, value: boolean) => {
    setData(prev => ({
      ...prev,
      config: { ...prev.config, sections: { ...prev.config.sections, [key]: value } }
    }))
  }

  // ─── Generic CRUD ──────────────────────────────────
  function crudSave<T extends { id: string }>(list: T[], item: T, key: keyof SMBTemplateData) {
    const isNew = !list.find(x => x.id === item.id)
    const updated = isNew ? [...list, item] : list.map(x => x.id === item.id ? item : x)
    setData(prev => ({ ...prev, [key]: updated }))
    toast.success(isNew ? 'Added' : 'Updated')
    close()
  }
  function crudDelete<T extends { id: string }>(list: T[], id: string, key: keyof SMBTemplateData) {
    if (!confirm('Delete this item?')) return
    setData(prev => ({ ...prev, [key]: list.filter(x => x.id !== id) }))
    toast.success('Deleted')
  }

  // ─── Metrics ───────────────────────────────────────
  const sectionCount = Object.values(data.config.sections).filter(Boolean).length
  const activePromos = (data.promotions || []).filter(p => p.active).length
  const publishedPosts = (data.blogPosts || []).filter(p => p.status === 'published').length
  const newContacts = (data.contactSubmissions || []).filter(c => c.status === 'new').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Storefront className="h-6 w-6 text-accent" weight="duotone" />
            Small Business Template
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            White-label website framework for SMB clients — services, blog, promos, SEO
          </p>
        </div>
        <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
          <EyeSlash className="h-3 w-3 mr-1" />Private Framework
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
        <GlassCard className="p-3 text-center"><p className="text-xl font-bold text-accent">{sectionCount}</p><p className="text-[10px] text-muted-foreground">Sections</p></GlassCard>
        <GlassCard className="p-3 text-center"><p className="text-xl font-bold text-violet-400">{data.services.length}</p><p className="text-[10px] text-muted-foreground">Services</p></GlassCard>
        <GlassCard className="p-3 text-center"><p className="text-xl font-bold text-cyan-400">{data.team.length}</p><p className="text-[10px] text-muted-foreground">Team</p></GlassCard>
        <GlassCard className="p-3 text-center"><p className="text-xl font-bold text-emerald-400">{data.testimonials.length}</p><p className="text-[10px] text-muted-foreground">Reviews</p></GlassCard>
        <GlassCard className="p-3 text-center"><p className="text-xl font-bold text-amber-400">{activePromos}</p><p className="text-[10px] text-muted-foreground">Promos</p></GlassCard>
        <GlassCard className="p-3 text-center"><p className="text-xl font-bold text-blue-400">{publishedPosts}</p><p className="text-[10px] text-muted-foreground">Posts</p></GlassCard>
        <GlassCard className="p-3 text-center"><p className="text-xl font-bold text-rose-400">{newContacts}</p><p className="text-[10px] text-muted-foreground">Contacts</p></GlassCard>
      </div>

      {/* Market Info */}
      <GlassCard className="p-4 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" weight="fill" />
          <div>
            <h3 className="text-sm font-semibold text-blue-400 mb-2">Small Business Web Needs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0.5 text-xs text-muted-foreground">
              <span>Mobile-responsive (70%+ mobile traffic)</span>
              <span>Google Business and Maps integration</span>
              <span>Service/product showcase pages</span>
              <span>Online booking or contact forms</span>
              <span>Customer reviews and testimonials</span>
              <span>Fast loading (under 2.5s LCP)</span>
              <span>Blog/news for content marketing</span>
              <span>Promotions and special offers</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ─── Main Tabs ─────────────────────────────── */}
      <Tabs value={tab} onValueChange={setTab}>
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto min-w-full">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="hero">Hero & CTA</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="promos">Promotions</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* ═══ Setup ═══════════════════════════════ */}
        <TabsContent value="setup" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5" />Business Details</CardTitle><CardDescription>Template defaults — each client site overrides</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Business Name</Label><Input value={data.config.businessName} onChange={e => up({ businessName: e.target.value })} placeholder="Sunset Coffee Roasters" /></div>
                <div className="space-y-2"><Label>Industry</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={data.config.industry || ''} onChange={e => up({ industry: e.target.value })}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2"><Label>Tagline</Label><Input value={data.config.tagline || ''} onChange={e => up({ tagline: e.target.value })} placeholder="Fresh roasted, locally sourced" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={data.config.description || ''} onChange={e => up({ description: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Phone</Label><Input value={data.config.phone || ''} onChange={e => up({ phone: e.target.value })} placeholder="(555) 123-4567" /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={data.config.email || ''} onChange={e => up({ email: e.target.value })} placeholder="info@business.com" /></div>
                <div className="space-y-2"><Label>Address</Label><Input value={data.config.address || ''} onChange={e => up({ address: e.target.value })} placeholder="123 Main St" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Hours</Label><Input value={data.config.hours || ''} onChange={e => up({ hours: e.target.value })} placeholder="Mon-Fri 9am-6pm" /></div>
                <div className="space-y-2"><Label>Logo URL</Label><Input value={data.config.logoUrl || ''} onChange={e => up({ logoUrl: e.target.value })} /></div>
                <div className="space-y-2"><Label>Analytics ID</Label><Input value={data.config.analyticsId || ''} onChange={e => up({ analyticsId: e.target.value })} placeholder="G-XXXXXXX" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Primary Color</Label><div className="flex gap-2"><Input type="color" value={data.config.primaryColor || '#2563eb'} onChange={e => up({ primaryColor: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" /><Input value={data.config.primaryColor || '#2563eb'} onChange={e => up({ primaryColor: e.target.value })} className="font-mono text-xs" /></div></div>
                <div className="space-y-2"><Label>Accent Color</Label><div className="flex gap-2"><Input type="color" value={data.config.accentColor || '#f59e0b'} onChange={e => up({ accentColor: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" /><Input value={data.config.accentColor || '#f59e0b'} onChange={e => up({ accentColor: e.target.value })} className="font-mono text-xs" /></div></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Heading Font</Label><Input value={data.config.fontHeading || ''} onChange={e => up({ fontHeading: e.target.value })} placeholder="Inter, system-ui" /></div>
                <div className="space-y-2"><Label>Body Font</Label><Input value={data.config.fontBody || ''} onChange={e => up({ fontBody: e.target.value })} placeholder="Inter, system-ui" /></div>
              </div>
            </CardContent>
          </Card>

          {/* Section Toggles */}
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Layout className="h-5 w-5" />Section Visibility</CardTitle><CardDescription>Toggle which sections appear</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.keys(data.config.sections).map(key => (
                  <div key={key} className="flex items-center gap-2">
                    <Switch checked={(data.config.sections as Record<string, boolean>)[key] ?? false} onCheckedChange={c => updateSections(key, c)} />
                    <Label className="capitalize text-sm">{key}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Social Links</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {['facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'yelp', 'linkedin', 'google'].map(p => (
                <div key={p} className="space-y-1">
                  <Label className="capitalize text-xs">{p}</Label>
                  <Input value={(data.config.socialLinks as Record<string, string>)?.[p] || ''} onChange={e => up({ socialLinks: { ...data.config.socialLinks, [p]: e.target.value } })} placeholder={`https://${p}.com/...`} className="text-xs" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Hero & CTA ══════════════════════════ */}
        <TabsContent value="hero" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Hero Section</CardTitle><CardDescription>Configure the homepage hero area style and content</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Hero Style</Label>
                  <Select value={data.config.heroStyle || 'gradient'} onValueChange={(v: string) => up({ heroStyle: v as SMBTemplateConfig['heroStyle'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{HERO_STYLES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Map Embed URL</Label><Input value={data.config.mapEmbedUrl || ''} onChange={e => up({ mapEmbedUrl: e.target.value })} placeholder="https://maps.google.com/..." /></div>
              </div>
              {(data.config.heroStyle === 'image' || data.config.heroStyle === 'split') && (
                <div className="space-y-2"><Label>Hero Image URL</Label><Input value={data.config.heroImageUrl || ''} onChange={e => up({ heroImageUrl: e.target.value })} placeholder="https://..." /></div>
              )}
              {data.config.heroStyle === 'video' && (
                <div className="space-y-2"><Label>Hero Video URL</Label><Input value={data.config.heroVideoUrl || ''} onChange={e => up({ heroVideoUrl: e.target.value })} placeholder="https://..." /></div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">Call-to-Action</CardTitle><CardDescription>Primary CTA button on the hero section</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>CTA Button Text</Label><Input value={data.config.ctaText || ''} onChange={e => up({ ctaText: e.target.value })} placeholder="Get a Free Quote" /></div>
                <div className="space-y-2"><Label>CTA Link/URL</Label><Input value={data.config.ctaUrl || ''} onChange={e => up({ ctaUrl: e.target.value })} placeholder="#contact or /book" /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Services ═════════════════════════════ */}
        <TabsContent value="services" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Services ({data.services.length})</h3>
            <Button size="sm" onClick={() => { setEditingService({ id: `svc_${Date.now()}`, name: '', description: '', featured: false, order: data.services.length + 1 }); setDialogType('service') }}>
              <Plus className="h-4 w-4 mr-1" />Add Service
            </Button>
          </div>
          {data.services.length === 0 ? (
            <GlassCard className="p-8 text-center"><Wrench className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" /><p className="text-muted-foreground text-sm">No services defined yet</p></GlassCard>
          ) : (
            <div className="grid gap-3">
              {[...data.services].sort((a, b) => a.order - b.order).map(svc => (
                <GlassCard key={svc.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{svc.name || 'Unnamed'}</h4>
                        {svc.featured && <Star className="h-4 w-4 text-amber-400" weight="fill" />}
                        {svc.price && <Badge variant="secondary" className="text-[10px]">{svc.price}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{svc.description}</p>
                      {svc.ctaText && <p className="text-[10px] text-accent mt-1">CTA: {svc.ctaText} → {svc.ctaUrl || '#'}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingService(svc); setDialogType('service') }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => crudDelete(data.services, svc.id, 'services')}><Trash className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ Team ═════════════════════════════════ */}
        <TabsContent value="team" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Team Members ({data.team.length})</h3>
            <Button size="sm" onClick={() => { setEditingTeamMember({ id: `team_${Date.now()}`, name: '', role: '', bio: '', order: data.team.length + 1 }); setDialogType('team') }}>
              <Plus className="h-4 w-4 mr-1" />Add Member
            </Button>
          </div>
          {data.team.length === 0 ? (
            <GlassCard className="p-8 text-center"><UsersThree className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" /><p className="text-muted-foreground text-sm">No team members yet</p></GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...data.team].sort((a, b) => a.order - b.order).map(m => (
                <GlassCard key={m.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                      {m.photoUrl ? <img src={m.photoUrl} alt={m.name} className="w-full h-full rounded-full object-cover" /> : (m.name?.charAt(0)?.toUpperCase() || '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">{m.name}</h4>
                      <p className="text-xs text-muted-foreground">{m.role}</p>
                      {m.email && <p className="text-[10px] text-muted-foreground">{m.email}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingTeamMember(m); setDialogType('team') }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => crudDelete(data.team, m.id, 'team')}><Trash className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ Reviews ══════════════════════════════ */}
        <TabsContent value="reviews" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Testimonials ({data.testimonials.length})</h3>
            <Button size="sm" onClick={() => { setEditingTestimonial({ id: `tst_${Date.now()}`, clientName: '', quote: '', featured: false, order: data.testimonials.length + 1 }); setDialogType('testimonial') }}>
              <Plus className="h-4 w-4 mr-1" />Add Review
            </Button>
          </div>
          {data.testimonials.length === 0 ? (
            <GlassCard className="p-8 text-center"><ChatCircleDots className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" /><p className="text-muted-foreground text-sm">No testimonials yet</p></GlassCard>
          ) : (
            <div className="space-y-3">
              {[...data.testimonials].sort((a, b) => a.order - b.order).map(t => (
                <GlassCard key={t.id} className="p-4">
                  <blockquote className="border-l-2 border-accent/50 pl-3 text-sm italic text-muted-foreground">&ldquo;{t.quote}&rdquo;</blockquote>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium">— {t.clientName || 'Anonymous'}</p>
                      {t.rating && <span className="text-[10px] text-amber-400">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</span>}
                      {t.featured && <Star className="h-3 w-3 text-amber-400" weight="fill" />}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTestimonial(t); setDialogType('testimonial') }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => crudDelete(data.testimonials, t.id, 'testimonials')}><Trash className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ FAQ ══════════════════════════════════ */}
        <TabsContent value="faq" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">FAQs ({data.faqs.length})</h3>
            <Button size="sm" onClick={() => { setEditingFaq({ id: `faq_${Date.now()}`, question: '', answer: '', order: data.faqs.length + 1 }); setDialogType('faq') }}>
              <Plus className="h-4 w-4 mr-1" />Add FAQ
            </Button>
          </div>
          {data.faqs.length === 0 ? (
            <GlassCard className="p-8 text-center"><Question className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" /><p className="text-muted-foreground text-sm">No FAQs yet</p></GlassCard>
          ) : (
            <div className="space-y-3">
              {[...data.faqs].sort((a, b) => a.order - b.order).map(faq => (
                <GlassCard key={faq.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{faq.question}</h4>
                        {faq.category && <Badge variant="secondary" className="text-[10px]">{faq.category}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingFaq(faq); setDialogType('faq') }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => crudDelete(data.faqs, faq.id, 'faqs')}><Trash className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ Promotions ═══════════════════════════ */}
        <TabsContent value="promos" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Promotions ({(data.promotions || []).length})</h3>
            <Button size="sm" onClick={() => { setEditingPromo({ id: `promo_${Date.now()}`, title: '', description: '', discountText: '', active: true, order: (data.promotions || []).length + 1 }); setDialogType('promo') }}>
              <Plus className="h-4 w-4 mr-1" />Add Promotion
            </Button>
          </div>
          {(data.promotions || []).length === 0 ? (
            <GlassCard className="p-8 text-center"><Tag className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" /><p className="text-muted-foreground text-sm">No promotions yet</p><p className="text-xs text-muted-foreground">Create special offers, seasonal deals, or promo codes</p></GlassCard>
          ) : (
            <div className="space-y-3">
              {[...(data.promotions || [])].sort((a, b) => a.order - b.order).map(promo => (
                <GlassCard key={promo.id} className={`p-4 ${!promo.active ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{promo.title || 'Untitled'}</h4>
                        <Badge variant={promo.active ? 'default' : 'outline'} className="text-[10px]">{promo.active ? 'Active' : 'Inactive'}</Badge>
                        {promo.discountText && <Badge variant="secondary" className="text-[10px]">{promo.discountText}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{promo.description}</p>
                      <div className="flex gap-3 text-[10px] text-muted-foreground mt-1">
                        {promo.code && <span>Code: <strong>{promo.code}</strong></span>}
                        {promo.validFrom && <span>From: {promo.validFrom}</span>}
                        {promo.validUntil && <span>Until: {promo.validUntil}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingPromo(promo); setDialogType('promo') }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => crudDelete(data.promotions || [], promo.id, 'promotions')}><Trash className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ Blog ═════════════════════════════════ */}
        <TabsContent value="blog" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Blog Posts ({(data.blogPosts || []).length})</h3>
            <Button size="sm" onClick={() => {
              const now = new Date().toISOString()
              setEditingBlog({ id: `smblog_${Date.now()}`, title: '', slug: '', content: '', excerpt: '', tags: [], status: 'draft', createdAt: now, updatedAt: now, order: (data.blogPosts || []).length + 1 })
              setDialogType('blog')
            }}><Plus className="h-4 w-4 mr-1" />New Post</Button>
          </div>
          {(data.blogPosts || []).length === 0 ? (
            <GlassCard className="p-8 text-center"><Article className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" /><p className="text-muted-foreground text-sm">No blog posts yet</p></GlassCard>
          ) : (
            <div className="space-y-3">
              {[...(data.blogPosts || [])].sort((a, b) => a.order - b.order).map(post => (
                <GlassCard key={post.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold truncate">{post.title || 'Untitled'}</h4>
                        <Badge variant={post.status === 'published' ? 'default' : 'outline'} className="text-[10px] capitalize">{post.status}</Badge>
                        {post.category && <Badge variant="secondary" className="text-[10px]">{post.category}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
                      {post.tags.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{post.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div>}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingBlog(post); setDialogType('blog') }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => crudDelete(data.blogPosts || [], post.id, 'blogPosts')}><Trash className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ Contact Submissions ══════════════════ */}
        <TabsContent value="contacts" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Contact Submissions ({(data.contactSubmissions || []).length})</h3>
          </div>
          {(data.contactSubmissions || []).length === 0 ? (
            <GlassCard className="p-8 text-center"><Envelope className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" /><p className="text-muted-foreground text-sm">No submissions yet</p><p className="text-xs text-muted-foreground">Contact form submissions from the live site will appear here</p></GlassCard>
          ) : (
            <div className="space-y-3">
              {(data.contactSubmissions || []).map(sub => (
                <Card key={sub.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={sub.status === 'new' ? 'default' : 'outline'} className="text-[10px] capitalize">{sub.status}</Badge>
                        <span className="text-xs font-medium">{sub.name}</span>
                        <span className="text-xs text-muted-foreground">{sub.email}</span>
                      </div>
                      <Select value={sub.status} onValueChange={(v: SMBContactSubmission['status']) => {
                        const subs = (data.contactSubmissions || []).map(s => s.id === sub.id ? { ...s, status: v } : s)
                        setData(prev => ({ ...prev, contactSubmissions: subs }))
                      }}>
                        <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="read">Read</SelectItem><SelectItem value="replied">Replied</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
                      </Select>
                    </div>
                    {sub.phone && <p className="text-xs text-muted-foreground mt-1">Phone: {sub.phone}</p>}
                    {sub.service && <p className="text-xs text-muted-foreground">Service: {sub.service}</p>}
                    <p className="text-sm text-muted-foreground mt-2 border-l-2 border-border/50 pl-2">{sub.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(sub.submittedAt).toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ SEO ══════════════════════════════════ */}
        <TabsContent value="seo" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MagnifyingGlass className="h-5 w-5" />SEO Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Site Title</Label><Input value={seo.siteTitle || ''} onChange={e => upSEO({ siteTitle: e.target.value })} placeholder="Business Name | Tagline" /></div>
                <div className="space-y-2"><Label>Schema Type</Label><Input value={seo.schemaType || ''} onChange={e => upSEO({ schemaType: e.target.value })} placeholder="LocalBusiness" /></div>
              </div>
              <div className="space-y-2"><Label>Site Description</Label><Textarea value={seo.siteDescription || ''} onChange={e => upSEO({ siteDescription: e.target.value })} rows={2} /><p className="text-[10px] text-muted-foreground">{(seo.siteDescription || '').length}/160 characters</p></div>
              <div className="space-y-2"><Label>OG Image URL</Label><Input value={seo.ogImageUrl || ''} onChange={e => upSEO({ ogImageUrl: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Google Analytics ID</Label><Input value={seo.analyticsId || ''} onChange={e => upSEO({ analyticsId: e.target.value })} placeholder="G-XXXXXXXXXX" /></div>
                <div className="space-y-2"><Label>GTM Container ID</Label><Input value={seo.gtmId || ''} onChange={e => upSEO({ gtmId: e.target.value })} placeholder="GTM-XXXXXXX" /></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><Switch checked={seo.sitemapEnabled} onCheckedChange={c => upSEO({ sitemapEnabled: c })} /><Label>Generate Sitemap</Label></div>
                <div className="flex items-center gap-2"><Switch checked={seo.robotsNoindex || false} onCheckedChange={c => upSEO({ robotsNoindex: c })} /><Label>No-Index (hide from search)</Label></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">Local Business Schema</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Business Name</Label><Input value={seo.localBusinessSchema?.name || ''} onChange={e => upSEO({ localBusinessSchema: { ...seo.localBusinessSchema, name: e.target.value, address: seo.localBusinessSchema?.address || '', phone: seo.localBusinessSchema?.phone || '' } })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={seo.localBusinessSchema?.phone || ''} onChange={e => upSEO({ localBusinessSchema: { ...seo.localBusinessSchema, phone: e.target.value, name: seo.localBusinessSchema?.name || '', address: seo.localBusinessSchema?.address || '' } })} /></div>
              </div>
              <div className="space-y-2"><Label>Address</Label><Input value={seo.localBusinessSchema?.address || ''} onChange={e => upSEO({ localBusinessSchema: { ...seo.localBusinessSchema, address: e.target.value, name: seo.localBusinessSchema?.name || '', phone: seo.localBusinessSchema?.phone || '' } })} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Price Range</Label><Input value={seo.localBusinessSchema?.priceRange || ''} onChange={e => upSEO({ localBusinessSchema: { ...seo.localBusinessSchema, priceRange: e.target.value, name: seo.localBusinessSchema?.name || '', address: seo.localBusinessSchema?.address || '', phone: seo.localBusinessSchema?.phone || '' } })} placeholder="$-$$" /></div>
                <div className="space-y-2"><Label>Latitude</Label><Input type="number" step="any" value={seo.localBusinessSchema?.geo?.lat || ''} onChange={e => upSEO({ localBusinessSchema: { ...seo.localBusinessSchema, geo: { lat: parseFloat(e.target.value) || 0, lng: seo.localBusinessSchema?.geo?.lng || 0 }, name: seo.localBusinessSchema?.name || '', address: seo.localBusinessSchema?.address || '', phone: seo.localBusinessSchema?.phone || '' } })} /></div>
                <div className="space-y-2"><Label>Longitude</Label><Input type="number" step="any" value={seo.localBusinessSchema?.geo?.lng || ''} onChange={e => upSEO({ localBusinessSchema: { ...seo.localBusinessSchema, geo: { lat: seo.localBusinessSchema?.geo?.lat || 0, lng: parseFloat(e.target.value) || 0 }, name: seo.localBusinessSchema?.name || '', address: seo.localBusinessSchema?.address || '', phone: seo.localBusinessSchema?.phone || '' } })} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Gallery ══════════════════════════════ */}
        <TabsContent value="gallery" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Gallery Images ({data.galleryImages.length})</h3>
            <Button size="sm" onClick={() => setData(prev => ({ ...prev, galleryImages: [...prev.galleryImages, { id: `img_${Date.now()}`, url: '', alt: '', order: prev.galleryImages.length + 1 }] }))}>
              <Plus className="h-4 w-4 mr-1" />Add Image
            </Button>
          </div>
          {data.galleryImages.length === 0 ? (
            <GlassCard className="p-8 text-center"><Image className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" /><p className="text-muted-foreground text-sm">No gallery images yet</p></GlassCard>
          ) : (
            <div className="space-y-3">
              {[...data.galleryImages].sort((a, b) => a.order - b.order).map((img, i) => (
                <div key={img.id} className="flex gap-3 items-start p-3 rounded border border-border/30">
                  {img.url && <img src={img.url} alt={img.alt} className="w-16 h-16 rounded object-cover shrink-0" />}
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <Input value={img.url} onChange={e => { const imgs = [...data.galleryImages]; imgs[i] = { ...img, url: e.target.value }; setData(prev => ({ ...prev, galleryImages: imgs })) }} placeholder="Image URL" />
                    <Input value={img.alt} onChange={e => { const imgs = [...data.galleryImages]; imgs[i] = { ...img, alt: e.target.value }; setData(prev => ({ ...prev, galleryImages: imgs })) }} placeholder="Alt text" />
                    <Input value={img.caption || ''} onChange={e => { const imgs = [...data.galleryImages]; imgs[i] = { ...img, caption: e.target.value }; setData(prev => ({ ...prev, galleryImages: imgs })) }} placeholder="Caption" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:text-destructive" onClick={() => setData(prev => ({ ...prev, galleryImages: prev.galleryImages.filter(g => g.id !== img.id) }))}><Trash className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ Service Dialog ═════════════════════════ */}
      <Dialog open={dialogType === 'service'} onOpenChange={o => { if (!o) close() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingService && data.services.find(s => s.id === editingService.id) ? 'Edit' : 'New'} Service</DialogTitle></DialogHeader>
          {editingService && (
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Service Name *</Label><Input value={editingService.name} onChange={e => setEditingService({ ...editingService, name: e.target.value })} placeholder="Deep Cleaning" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={editingService.description} onChange={e => setEditingService({ ...editingService, description: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Price (display)</Label><Input value={editingService.price || ''} onChange={e => setEditingService({ ...editingService, price: e.target.value })} placeholder="From $99" /></div>
                <div className="space-y-2"><Label>Icon Name</Label><Input value={editingService.icon || ''} onChange={e => setEditingService({ ...editingService, icon: e.target.value })} placeholder="Broom" /></div>
              </div>
              <div className="space-y-2"><Label>Image URL</Label><Input value={editingService.imageUrl || ''} onChange={e => setEditingService({ ...editingService, imageUrl: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>CTA Text</Label><Input value={editingService.ctaText || ''} onChange={e => setEditingService({ ...editingService, ctaText: e.target.value })} placeholder="Book Now" /></div>
                <div className="space-y-2"><Label>CTA URL</Label><Input value={editingService.ctaUrl || ''} onChange={e => setEditingService({ ...editingService, ctaUrl: e.target.value })} placeholder="#contact" /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={editingService.featured} onCheckedChange={c => setEditingService({ ...editingService, featured: c })} /><Label>Featured</Label></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={() => { if (!editingService) return; if (!editingService.name.trim()) { toast.error('Name required'); return }; crudSave(data.services, editingService, 'services') }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Team Dialog ════════════════════════════ */}
      <Dialog open={dialogType === 'team'} onOpenChange={o => { if (!o) close() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTeamMember && data.team.find(t => t.id === editingTeamMember.id) ? 'Edit' : 'New'} Team Member</DialogTitle></DialogHeader>
          {editingTeamMember && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Name *</Label><Input value={editingTeamMember.name} onChange={e => setEditingTeamMember({ ...editingTeamMember, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Role</Label><Input value={editingTeamMember.role} onChange={e => setEditingTeamMember({ ...editingTeamMember, role: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Photo URL</Label><Input value={editingTeamMember.photoUrl || ''} onChange={e => setEditingTeamMember({ ...editingTeamMember, photoUrl: e.target.value })} /></div>
              <div className="space-y-2"><Label>Bio</Label><Textarea value={editingTeamMember.bio} onChange={e => setEditingTeamMember({ ...editingTeamMember, bio: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email</Label><Input value={editingTeamMember.email || ''} onChange={e => setEditingTeamMember({ ...editingTeamMember, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>LinkedIn</Label><Input value={editingTeamMember.linkedIn || ''} onChange={e => setEditingTeamMember({ ...editingTeamMember, linkedIn: e.target.value })} /></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={() => { if (!editingTeamMember) return; if (!editingTeamMember.name.trim()) { toast.error('Name required'); return }; crudSave(data.team, editingTeamMember, 'team') }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Testimonial Dialog ═════════════════════ */}
      <Dialog open={dialogType === 'testimonial'} onOpenChange={o => { if (!o) close() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTestimonial && data.testimonials.find(t => t.id === editingTestimonial.id) ? 'Edit' : 'New'} Testimonial</DialogTitle></DialogHeader>
          {editingTestimonial && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Client Name</Label><Input value={editingTestimonial.clientName} onChange={e => setEditingTestimonial({ ...editingTestimonial, clientName: e.target.value })} /></div>
                <div className="space-y-2"><Label>Title / Company</Label><Input value={editingTestimonial.clientTitle || ''} onChange={e => setEditingTestimonial({ ...editingTestimonial, clientTitle: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Quote *</Label><Textarea value={editingTestimonial.quote} onChange={e => setEditingTestimonial({ ...editingTestimonial, quote: e.target.value })} rows={4} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Rating (1-5)</Label><Input type="number" min={1} max={5} value={editingTestimonial.rating || ''} onChange={e => setEditingTestimonial({ ...editingTestimonial, rating: parseInt(e.target.value) || undefined })} /></div>
                <div className="space-y-2"><Label>Practice Area</Label><Input value={editingTestimonial.practiceArea || ''} onChange={e => setEditingTestimonial({ ...editingTestimonial, practiceArea: e.target.value })} placeholder="General" /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={editingTestimonial.featured} onCheckedChange={c => setEditingTestimonial({ ...editingTestimonial, featured: c })} /><Label>Featured</Label></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={() => { if (!editingTestimonial) return; if (!editingTestimonial.quote.trim()) { toast.error('Quote required'); return }; crudSave(data.testimonials, editingTestimonial, 'testimonials') }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ FAQ Dialog ═════════════════════════════ */}
      <Dialog open={dialogType === 'faq'} onOpenChange={o => { if (!o) close() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingFaq && data.faqs.find(f => f.id === editingFaq.id) ? 'Edit' : 'New'} FAQ</DialogTitle></DialogHeader>
          {editingFaq && (
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Question *</Label><Input value={editingFaq.question} onChange={e => setEditingFaq({ ...editingFaq, question: e.target.value })} /></div>
              <div className="space-y-2"><Label>Answer</Label><Textarea value={editingFaq.answer} onChange={e => setEditingFaq({ ...editingFaq, answer: e.target.value })} rows={3} /></div>
              <div className="space-y-2"><Label>Category</Label><Input value={editingFaq.category || ''} onChange={e => setEditingFaq({ ...editingFaq, category: e.target.value })} placeholder="General, Pricing, etc." /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={() => { if (!editingFaq) return; if (!editingFaq.question.trim()) { toast.error('Question required'); return }; crudSave(data.faqs, editingFaq, 'faqs') }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Promotion Dialog ══════════════════════ */}
      <Dialog open={dialogType === 'promo'} onOpenChange={o => { if (!o) close() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingPromo && (data.promotions || []).find(p => p.id === editingPromo.id) ? 'Edit' : 'New'} Promotion</DialogTitle></DialogHeader>
          {editingPromo && (
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Title *</Label><Input value={editingPromo.title} onChange={e => setEditingPromo({ ...editingPromo, title: e.target.value })} placeholder="Spring Special" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={editingPromo.description} onChange={e => setEditingPromo({ ...editingPromo, description: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Promo Code</Label><Input value={editingPromo.code || ''} onChange={e => setEditingPromo({ ...editingPromo, code: e.target.value })} placeholder="SPRING25" /></div>
                <div className="space-y-2"><Label>Discount Text</Label><Input value={editingPromo.discountText} onChange={e => setEditingPromo({ ...editingPromo, discountText: e.target.value })} placeholder="25% Off" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Valid From</Label><Input type="date" value={editingPromo.validFrom || ''} onChange={e => setEditingPromo({ ...editingPromo, validFrom: e.target.value })} /></div>
                <div className="space-y-2"><Label>Valid Until</Label><Input type="date" value={editingPromo.validUntil || ''} onChange={e => setEditingPromo({ ...editingPromo, validUntil: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={editingPromo.active} onCheckedChange={c => setEditingPromo({ ...editingPromo, active: c })} /><Label>Active</Label></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={() => { if (!editingPromo) return; if (!editingPromo.title.trim()) { toast.error('Title required'); return }; crudSave(data.promotions || [], editingPromo, 'promotions') }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Blog Post Dialog ══════════════════════ */}
      <Dialog open={dialogType === 'blog'} onOpenChange={o => { if (!o) close() }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingBlog && (data.blogPosts || []).find(p => p.id === editingBlog.id) ? 'Edit' : 'New'} Blog Post</DialogTitle></DialogHeader>
          {editingBlog && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Title *</Label><Input value={editingBlog.title} onChange={e => setEditingBlog({ ...editingBlog, title: e.target.value, slug: editingBlog.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} /></div>
                <div className="space-y-2"><Label>Slug</Label><Input value={editingBlog.slug} onChange={e => setEditingBlog({ ...editingBlog, slug: e.target.value })} className="font-mono text-xs" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Category</Label><Input value={editingBlog.category || ''} onChange={e => setEditingBlog({ ...editingBlog, category: e.target.value })} placeholder="News, Tips" /></div>
                <div className="space-y-2"><Label>Featured Image</Label><Input value={editingBlog.featuredImageUrl || ''} onChange={e => setEditingBlog({ ...editingBlog, featuredImageUrl: e.target.value })} placeholder="https://..." /></div>
                <div className="space-y-2"><Label>Status</Label>
                  <Select value={editingBlog.status} onValueChange={(v: SMBBlogPost['status']) => setEditingBlog({ ...editingBlog, status: v, publishedAt: v === 'published' ? (editingBlog.publishedAt || new Date().toISOString()) : editingBlog.publishedAt })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Excerpt</Label><Textarea value={editingBlog.excerpt} onChange={e => setEditingBlog({ ...editingBlog, excerpt: e.target.value })} rows={2} /></div>
              <div className="space-y-2"><Label>Content (Markdown)</Label><Textarea value={editingBlog.content} onChange={e => setEditingBlog({ ...editingBlog, content: e.target.value })} rows={10} className="font-mono text-xs" /></div>
              <div className="space-y-2"><Label>Featured Image URL</Label><Input value={editingBlog.featuredImageUrl || ''} onChange={e => setEditingBlog({ ...editingBlog, featuredImageUrl: e.target.value })} /></div>
              <div className="space-y-2"><Label>Tags (comma-separated)</Label><Input value={editingBlog.tags.join(', ')} onChange={e => setEditingBlog({ ...editingBlog, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={() => { if (!editingBlog) return; if (!editingBlog.title.trim()) { toast.error('Title required'); return }; editingBlog.updatedAt = new Date().toISOString(); crudSave(data.blogPosts || [], editingBlog, 'blogPosts') }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
