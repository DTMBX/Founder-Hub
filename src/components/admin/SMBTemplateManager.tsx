import { useState } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import {
  SMBTemplateData,
  SMBTemplateConfig,
  SMBServiceItem,
  SMBTeamMember,
  SMBFaq,
  ClientTestimonial
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Plus, Pencil, Trash, Star, EyeSlash,
  Storefront, Wrench, UsersThree, ChatCircleDots,
  Question, Images, Info, Globe, Layout
} from '@phosphor-icons/react'
import { toast } from 'sonner'

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
  },
}

const DEFAULT_DATA: SMBTemplateData = {
  config: DEFAULT_CONFIG,
  services: [],
  team: [],
  testimonials: [],
  faqs: [],
  galleryImages: [],
}

const INDUSTRIES = [
  'Restaurant', 'Retail', 'Professional Services', 'Healthcare',
  'Construction', 'Real Estate', 'Beauty & Wellness', 'Fitness',
  'Auto Services', 'Home Services', 'Photography', 'Education',
  'Legal', 'Financial', 'Technology', 'Other',
]

export default function SMBTemplateManager() {
  const [data, setData] = useKV<SMBTemplateData>('smb-template', DEFAULT_DATA)
  const [activeSubTab, setActiveSubTab] = useState('setup')
  const [editingService, setEditingService] = useState<SMBServiceItem | null>(null)
  const [editingTeamMember, setEditingTeamMember] = useState<SMBTeamMember | null>(null)
  const [editingTestimonial, setEditingTestimonial] = useState<ClientTestimonial | null>(null)
  const [editingFaq, setEditingFaq] = useState<SMBFaq | null>(null)
  const [dialogType, setDialogType] = useState<'service' | 'team' | 'testimonial' | 'faq' | null>(null)

  const updateConfig = (updates: Partial<SMBTemplateConfig>) => {
    setData(prev => ({
      ...prev,
      config: { ...prev.config, ...updates }
    }))
  }

  const updateSections = (key: keyof SMBTemplateConfig['sections'], value: boolean) => {
    setData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        sections: { ...prev.config.sections, [key]: value }
      }
    }))
  }

  // ─── Services CRUD ───────────────────────────────
  const addService = () => {
    setEditingService({
      id: `svc_${Date.now()}`,
      name: '',
      description: '',
      featured: false,
      order: (data.services?.length || 0) + 1,
    })
    setDialogType('service')
  }

  const saveService = () => {
    if (!editingService) return
    if (!editingService.name.trim()) { toast.error('Service name required'); return }
    const isNew = !data.services.find(s => s.id === editingService.id)
    const updated = isNew
      ? [...data.services, editingService]
      : data.services.map(s => s.id === editingService.id ? editingService : s)
    setData(prev => ({ ...prev, services: updated }))
    toast.success(isNew ? 'Service added' : 'Service updated')
    setDialogType(null)
    setEditingService(null)
  }

  const deleteService = (id: string) => {
    if (!confirm('Delete this service?')) return
    setData(prev => ({ ...prev, services: prev.services.filter(s => s.id !== id) }))
    toast.success('Service deleted')
  }

  // ─── Team CRUD ───────────────────────────────────
  const addTeamMember = () => {
    setEditingTeamMember({
      id: `team_${Date.now()}`,
      name: '',
      role: '',
      bio: '',
      order: (data.team?.length || 0) + 1,
    })
    setDialogType('team')
  }

  const saveTeamMember = () => {
    if (!editingTeamMember) return
    if (!editingTeamMember.name.trim()) { toast.error('Name required'); return }
    const isNew = !data.team.find(t => t.id === editingTeamMember.id)
    const updated = isNew
      ? [...data.team, editingTeamMember]
      : data.team.map(t => t.id === editingTeamMember.id ? editingTeamMember : t)
    setData(prev => ({ ...prev, team: updated }))
    toast.success(isNew ? 'Member added' : 'Member updated')
    setDialogType(null)
    setEditingTeamMember(null)
  }

  const deleteTeamMember = (id: string) => {
    if (!confirm('Delete this team member?')) return
    setData(prev => ({ ...prev, team: prev.team.filter(t => t.id !== id) }))
    toast.success('Member deleted')
  }

  // ─── Testimonials CRUD ───────────────────────────
  const addTestimonial = () => {
    setEditingTestimonial({
      id: `tst_${Date.now()}`,
      clientName: '',
      quote: '',
      featured: false,
      order: (data.testimonials?.length || 0) + 1,
    })
    setDialogType('testimonial')
  }

  const saveTestimonial = () => {
    if (!editingTestimonial) return
    if (!editingTestimonial.quote.trim()) { toast.error('Quote required'); return }
    const isNew = !data.testimonials.find(t => t.id === editingTestimonial.id)
    const updated = isNew
      ? [...data.testimonials, editingTestimonial]
      : data.testimonials.map(t => t.id === editingTestimonial.id ? editingTestimonial : t)
    setData(prev => ({ ...prev, testimonials: updated }))
    toast.success(isNew ? 'Testimonial added' : 'Testimonial updated')
    setDialogType(null)
    setEditingTestimonial(null)
  }

  // ─── FAQ CRUD ────────────────────────────────────
  const addFaq = () => {
    setEditingFaq({
      id: `faq_${Date.now()}`,
      question: '',
      answer: '',
      order: (data.faqs?.length || 0) + 1,
    })
    setDialogType('faq')
  }

  const saveFaq = () => {
    if (!editingFaq) return
    if (!editingFaq.question.trim()) { toast.error('Question required'); return }
    const isNew = !data.faqs.find(f => f.id === editingFaq.id)
    const updated = isNew
      ? [...data.faqs, editingFaq]
      : data.faqs.map(f => f.id === editingFaq.id ? editingFaq : f)
    setData(prev => ({ ...prev, faqs: updated }))
    toast.success(isNew ? 'FAQ added' : 'FAQ updated')
    setDialogType(null)
    setEditingFaq(null)
  }

  const deleteFaq = (id: string) => {
    if (!confirm('Delete this FAQ?')) return
    setData(prev => ({ ...prev, faqs: prev.faqs.filter(f => f.id !== id) }))
    toast.success('FAQ deleted')
  }

  const activeSectionCount = Object.values(data.config.sections).filter(Boolean).length

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
            White-label website framework for small business clients — no branding included
          </p>
        </div>
        <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
          <EyeSlash className="h-3 w-3 mr-1" />
          Private Framework
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-accent">{activeSectionCount}</p>
          <p className="text-xs text-muted-foreground">Active Sections</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-violet-400">{data.services.length}</p>
          <p className="text-xs text-muted-foreground">Services</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-cyan-400">{data.team.length}</p>
          <p className="text-xs text-muted-foreground">Team</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{data.testimonials.length}</p>
          <p className="text-xs text-muted-foreground">Reviews</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{data.faqs.length}</p>
          <p className="text-xs text-muted-foreground">FAQs</p>
        </GlassCard>
      </div>

      {/* SMB Market Insight */}
      <GlassCard className="p-4 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" weight="fill" />
          <div>
            <h3 className="text-sm font-semibold text-blue-400 mb-2">Small Business Web Needs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground">
              <span>• Mobile-responsive (70%+ traffic is mobile)</span>
              <span>• Google Business & Maps integration</span>
              <span>• Service/product showcase pages</span>
              <span>• Online booking / contact forms</span>
              <span>• Customer reviews & testimonials</span>
              <span>• Fast loading (&lt; 2.5s LCP)</span>
              <span>• Basic SEO (meta, schema, sitemap)</span>
              <span>• Social media links & feeds</span>
              <span>• Photo gallery for portfolio/work</span>
              <span>• Hours, location, directions</span>
              <span>• SSL certificate (trust signal)</span>
              <span>• CMS or easy self-service edits</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        {/* Setup */}
        <TabsContent value="setup" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Business Details
              </CardTitle>
              <CardDescription>Template defaults — each client site overrides</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input value={data.config.businessName} onChange={(e) => updateConfig({ businessName: e.target.value })} placeholder="e.g., Sunset Coffee Roasters" />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={data.config.industry || ''}
                    onChange={(e) => updateConfig({ industry: e.target.value })}
                  >
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input value={data.config.tagline || ''} onChange={(e) => updateConfig({ tagline: e.target.value })} placeholder="e.g., Fresh roasted, locally sourced" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={data.config.description || ''} onChange={(e) => updateConfig({ description: e.target.value })} rows={3} placeholder="A brief description for hero area and meta tags" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={data.config.phone || ''} onChange={(e) => updateConfig({ phone: e.target.value })} placeholder="(555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={data.config.email || ''} onChange={(e) => updateConfig({ email: e.target.value })} placeholder="info@business.com" />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={data.config.address || ''} onChange={(e) => updateConfig({ address: e.target.value })} placeholder="123 Main St, City, ST" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={data.config.primaryColor || '#2563eb'} onChange={(e) => updateConfig({ primaryColor: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" />
                    <Input value={data.config.primaryColor || '#2563eb'} onChange={(e) => updateConfig({ primaryColor: e.target.value })} className="font-mono text-xs" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={data.config.accentColor || '#f59e0b'} onChange={(e) => updateConfig({ accentColor: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" />
                    <Input value={data.config.accentColor || '#f59e0b'} onChange={(e) => updateConfig({ accentColor: e.target.value })} className="font-mono text-xs" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Hours</Label>
                  <Input value={data.config.hours || ''} onChange={(e) => updateConfig({ hours: e.target.value })} placeholder="Mon-Fri 9am-6pm" />
                </div>
                <div className="space-y-2">
                  <Label>Google Maps Embed URL</Label>
                  <Input value={data.config.mapEmbedUrl || ''} onChange={(e) => updateConfig({ mapEmbedUrl: e.target.value })} placeholder="https://maps.google.com/..." />
                </div>
                <div className="space-y-2">
                  <Label>Google Analytics ID</Label>
                  <Input value={data.config.analyticsId || ''} onChange={(e) => updateConfig({ analyticsId: e.target.value })} placeholder="G-XXXXXXXXXX" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Toggles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Section Visibility
              </CardTitle>
              <CardDescription>Toggle which sections appear on the generated site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(Object.keys(data.config.sections) as (keyof SMBTemplateConfig['sections'])[]).map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <Switch checked={data.config.sections[key]} onCheckedChange={(checked) => updateSections(key, checked)} />
                    <Label className="capitalize text-sm">{key}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Social Links</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {['facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'yelp'].map((platform) => (
                <div key={platform} className="space-y-1">
                  <Label className="capitalize text-xs">{platform}</Label>
                  <Input
                    value={(data.config.socialLinks as Record<string, string>)?.[platform] || ''}
                    onChange={(e) => updateConfig({
                      socialLinks: { ...data.config.socialLinks, [platform]: e.target.value }
                    })}
                    placeholder={`https://${platform}.com/...`}
                    className="text-xs"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services */}
        <TabsContent value="services" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Services ({data.services.length})</h3>
            <Button onClick={addService} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Service
            </Button>
          </div>
          {data.services.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Wrench className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-sm">No services defined yet</p>
            </GlassCard>
          ) : (
            <div className="grid gap-3">
              {[...data.services].sort((a, b) => a.order - b.order).map((service) => (
                <GlassCard key={service.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{service.name || 'Unnamed'}</h4>
                        {service.featured && <Star className="h-4 w-4 text-amber-400" weight="fill" />}
                        {service.price && <Badge variant="secondary" className="text-[10px]">{service.price}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingService(service); setDialogType('service') }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => deleteService(service.id)}><Trash className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Team */}
        <TabsContent value="team" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Team Members ({data.team.length})</h3>
            <Button onClick={addTeamMember} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Member
            </Button>
          </div>
          {data.team.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <UsersThree className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-sm">No team members yet</p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...data.team].sort((a, b) => a.order - b.order).map((member) => (
                <GlassCard key={member.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                      {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">{member.name}</h4>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingTeamMember(member); setDialogType('team') }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => deleteTeamMember(member.id)}><Trash className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Reviews / Testimonials */}
        <TabsContent value="reviews" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Testimonials ({data.testimonials.length})</h3>
            <Button onClick={addTestimonial} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Review
            </Button>
          </div>
          {data.testimonials.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <ChatCircleDots className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-sm">No testimonials yet</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {[...data.testimonials].sort((a, b) => a.order - b.order).map((t) => (
                <GlassCard key={t.id} className="p-4">
                  <blockquote className="border-l-2 border-accent/50 pl-3 text-sm italic text-muted-foreground">"{t.quote}"</blockquote>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs font-medium">— {t.clientName || 'Anonymous'}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTestimonial(t); setDialogType('testimonial') }}><Pencil className="h-3.5 w-3.5" /></Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">FAQs ({data.faqs.length})</h3>
            <Button onClick={addFaq} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add FAQ
            </Button>
          </div>
          {data.faqs.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Question className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-sm">No FAQs yet</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {[...data.faqs].sort((a, b) => a.order - b.order).map((faq) => (
                <GlassCard key={faq.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{faq.question}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingFaq(faq); setDialogType('faq') }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => deleteFaq(faq.id)}><Trash className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Service Dialog ──────────────────────────── */}
      <Dialog open={dialogType === 'service'} onOpenChange={(open) => { if (!open) { setDialogType(null); setEditingService(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingService && data.services.find(s => s.id === editingService.id) ? 'Edit' : 'New'} Service</DialogTitle>
          </DialogHeader>
          {editingService && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Service Name *</Label>
                <Input value={editingService.name} onChange={(e) => setEditingService({ ...editingService, name: e.target.value })} placeholder="e.g., Deep Cleaning" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editingService.description} onChange={(e) => setEditingService({ ...editingService, description: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (display text)</Label>
                  <Input value={editingService.price || ''} onChange={(e) => setEditingService({ ...editingService, price: e.target.value })} placeholder="e.g., From $99" />
                </div>
                <div className="space-y-2">
                  <Label>Icon Name</Label>
                  <Input value={editingService.icon || ''} onChange={(e) => setEditingService({ ...editingService, icon: e.target.value })} placeholder="e.g., Broom" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingService.featured} onCheckedChange={(c) => setEditingService({ ...editingService, featured: c })} />
                <Label>Featured service</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogType(null); setEditingService(null) }}>Cancel</Button>
            <Button onClick={saveService}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Team Dialog ─────────────────────────────── */}
      <Dialog open={dialogType === 'team'} onOpenChange={(open) => { if (!open) { setDialogType(null); setEditingTeamMember(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTeamMember && data.team.find(t => t.id === editingTeamMember.id) ? 'Edit' : 'New'} Team Member</DialogTitle>
          </DialogHeader>
          {editingTeamMember && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={editingTeamMember.name} onChange={(e) => setEditingTeamMember({ ...editingTeamMember, name: e.target.value })} placeholder="Jane Smith" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={editingTeamMember.role} onChange={(e) => setEditingTeamMember({ ...editingTeamMember, role: e.target.value })} placeholder="e.g., Owner" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea value={editingTeamMember.bio} onChange={(e) => setEditingTeamMember({ ...editingTeamMember, bio: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={editingTeamMember.email || ''} onChange={(e) => setEditingTeamMember({ ...editingTeamMember, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn</Label>
                  <Input value={editingTeamMember.linkedIn || ''} onChange={(e) => setEditingTeamMember({ ...editingTeamMember, linkedIn: e.target.value })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogType(null); setEditingTeamMember(null) }}>Cancel</Button>
            <Button onClick={saveTeamMember}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Testimonial Dialog ──────────────────────── */}
      <Dialog open={dialogType === 'testimonial'} onOpenChange={(open) => { if (!open) { setDialogType(null); setEditingTestimonial(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTestimonial && data.testimonials.find(t => t.id === editingTestimonial.id) ? 'Edit' : 'New'} Testimonial</DialogTitle>
          </DialogHeader>
          {editingTestimonial && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input value={editingTestimonial.clientName} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, clientName: e.target.value })} placeholder="J. Smith" />
              </div>
              <div className="space-y-2">
                <Label>Quote *</Label>
                <Textarea value={editingTestimonial.quote} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, quote: e.target.value })} rows={4} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingTestimonial.featured} onCheckedChange={(c) => setEditingTestimonial({ ...editingTestimonial, featured: c })} />
                <Label>Featured</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogType(null); setEditingTestimonial(null) }}>Cancel</Button>
            <Button onClick={saveTestimonial}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── FAQ Dialog ──────────────────────────────── */}
      <Dialog open={dialogType === 'faq'} onOpenChange={(open) => { if (!open) { setDialogType(null); setEditingFaq(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFaq && data.faqs.find(f => f.id === editingFaq.id) ? 'Edit' : 'New'} FAQ</DialogTitle>
          </DialogHeader>
          {editingFaq && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Question *</Label>
                <Input value={editingFaq.question} onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })} placeholder="What are your hours?" />
              </div>
              <div className="space-y-2">
                <Label>Answer</Label>
                <Textarea value={editingFaq.answer} onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogType(null); setEditingFaq(null) }}>Cancel</Button>
            <Button onClick={saveFaq}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
