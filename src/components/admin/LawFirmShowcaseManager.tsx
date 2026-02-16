import { useState } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import {
  LawFirmShowcaseData,
  LawFirmConfig,
  LawFirmSEOConfig,
  CaseResult,
  AttorneyProfile,
  PracticeArea,
  ClientTestimonial,
  LawFirmBlogPost,
  LawFirmIntakeSubmission,
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
  Scales, UserCircle, Briefcase, ChatCircleDots,
  CurrencyDollar, Info,
  Article, MagnifyingGlass, MapPin,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

// ─── Defaults ──────────────────────────────────────────────────

const DEFAULT_SEO: LawFirmSEOConfig = {
  sitemapEnabled: true,
  schemaOrgType: 'LegalService',
}

const DEFAULT_CONFIG: LawFirmConfig = {
  firmName: '',
  tagline: '',
  description: '',
  primaryColor: '#1a365d',
  accentColor: '#c7a44a',
  intakeFormEnabled: false,
  intakeFields: [
    { id: 'name', label: 'Full Name', type: 'text', required: true },
    { id: 'email', label: 'Email', type: 'email', required: true },
    { id: 'phone', label: 'Phone', type: 'phone', required: false },
    { id: 'case-type', label: 'Type of Case', type: 'select', required: true, options: ['Personal Injury', 'Criminal Defense', 'Family Law', 'Business Law', 'Employment Law', 'Other'] },
    { id: 'description', label: 'Brief Description', type: 'textarea', required: true },
  ],
  seo: DEFAULT_SEO,
  disclaimer: 'This website is for informational purposes only and does not constitute legal advice. No attorney-client relationship is formed by use of this site.',
}

const DEFAULT_DATA: LawFirmShowcaseData = {
  config: DEFAULT_CONFIG,
  caseResults: [],
  attorneys: [],
  practiceAreas: [],
  testimonials: [],
  blogPosts: [],
  intakeSubmissions: [],
  visibility: 'private',
}

const RESULT_TYPES = [
  { value: 'verdict', label: 'Verdict' },
  { value: 'settlement', label: 'Settlement' },
  { value: 'dismissal', label: 'Dismissal' },
  { value: 'acquittal', label: 'Acquittal' },
  { value: 'award', label: 'Award' },
  { value: 'other', label: 'Other' },
]

const SCHEMA_TYPES = [
  'LegalService', 'Attorney', 'LocalBusiness', 'ProfessionalService',
]

function fmt(cents: number, currency = 'USD'): string {
  if (!cents) return '$0'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cents / 100)
}

// ─── Component ─────────────────────────────────────────────────

interface LawFirmShowcaseManagerProps {
  siteId?: string
}

export default function LawFirmShowcaseManager({ siteId }: LawFirmShowcaseManagerProps) {
  const kvKey = siteId ? `sites:${siteId}:data` : 'law-firm-showcase'
  const [data, setData] = useKV<LawFirmShowcaseData>(kvKey, DEFAULT_DATA)
  const [tab, setTab] = useState('overview')
  const [editingResult, setEditingResult] = useState<CaseResult | null>(null)
  const [editingAttorney, setEditingAttorney] = useState<AttorneyProfile | null>(null)
  const [editingArea, setEditingArea] = useState<PracticeArea | null>(null)
  const [editingTestimonial, setEditingTestimonial] = useState<ClientTestimonial | null>(null)
  const [editingBlog, setEditingBlog] = useState<LawFirmBlogPost | null>(null)
  const [dialogType, setDialogType] = useState<string | null>(null)

  // ─── Helpers ───────────────────────────────────────
  const up = (updates: Partial<LawFirmConfig>) => setData(prev => ({ ...prev, config: { ...prev.config, ...updates } }))
  const upSEO = (updates: Partial<LawFirmSEOConfig>) => setData(prev => ({
    ...prev,
    config: { ...prev.config, seo: { ...(prev.config.seo || DEFAULT_SEO), ...updates } }
  }))
  const seo = data.config.seo || DEFAULT_SEO
  const close = () => { setDialogType(null); setEditingResult(null); setEditingAttorney(null); setEditingArea(null); setEditingTestimonial(null); setEditingBlog(null) }

  // ─── CRUD helpers ──────────────────────────────────
  function crudSave<T extends { id: string }>(
    list: T[], item: T, key: keyof LawFirmShowcaseData
  ) {
    const isNew = !list.find(x => x.id === item.id)
    const updated = isNew ? [...list, item] : list.map(x => x.id === item.id ? item : x)
    setData(prev => ({ ...prev, [key]: updated }))
    toast.success(isNew ? 'Added' : 'Updated')
    close()
  }
  function crudDelete<T extends { id: string }>(list: T[], id: string, key: keyof LawFirmShowcaseData) {
    if (!confirm('Delete this item?')) return
    setData(prev => ({ ...prev, [key]: list.filter(x => x.id !== id) }))
    toast.success('Deleted')
  }

  // ─── Metrics ───────────────────────────────────────
  const totalValue = data.caseResults.filter(r => !r.isConfidential && r.amount).reduce((s, r) => s + (r.amount || 0), 0)
  const newIntakes = (data.intakeSubmissions || []).filter(s => s.status === 'new').length
  const publishedPosts = (data.blogPosts || []).filter(p => p.status === 'published').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Scales className="h-6 w-6 text-accent" weight="duotone" />
            Law Firm Website Framework
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Full-service law firm site builder — case wins, attorneys, SEO, blog, intake
          </p>
        </div>
        <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
          <EyeSlash className="h-3 w-3 mr-1" />
          {data.visibility === 'private' ? 'Private' : data.visibility === 'demo' ? 'Demo' : 'Unlisted'}
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <GlassCard className="p-3 text-center"><p className="text-xl font-bold text-accent">{data.caseResults.length}</p><p className="text-[10px] text-muted-foreground">Results</p></GlassCard>
        <GlassCard className="p-3 text-center"><p className="text-xl font-bold text-emerald-400">{fmt(totalValue)}</p><p className="text-[10px] text-muted-foreground">Recovered</p></GlassCard>
        <GlassCard className="p-3 text-center"><p className="text-xl font-bold text-violet-400">{data.attorneys.length}</p><p className="text-[10px] text-muted-foreground">Attorneys</p></GlassCard>
        <GlassCard className="p-3 text-center"><p className="text-xl font-bold text-cyan-400">{data.practiceAreas.length}</p><p className="text-[10px] text-muted-foreground">Areas</p></GlassCard>
        <GlassCard className="p-3 text-center"><p className="text-xl font-bold text-amber-400">{publishedPosts}</p><p className="text-[10px] text-muted-foreground">Posts</p></GlassCard>
        <GlassCard className="p-3 text-center"><p className="text-xl font-bold text-rose-400">{newIntakes}</p><p className="text-[10px] text-muted-foreground">New Intakes</p></GlassCard>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <GlassCard className="p-4 border-blue-500/20">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" weight="fill" />
            <div>
              <h3 className="text-sm font-semibold text-blue-400 mb-1">What Law Firms Need</h3>
              <div className="grid gap-y-0.5 text-xs text-muted-foreground">
                <span>Case results with verdicts/settlements</span>
                <span>Attorney profiles and credentials</span>
                <span>Practice area SEO landing pages</span>
                <span>Client intake form with routing</span>
                <span>Blog/insights for content marketing</span>
                <span>ADA/WCAG compliance (mandatory)</span>
                <span>Local SEO schema markup</span>
                <span>Bar-required legal disclaimers</span>
              </div>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4 border-emerald-500/20">
          <div className="flex items-start gap-3">
            <CurrencyDollar className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" weight="fill" />
            <div>
              <h3 className="text-sm font-semibold text-emerald-400 mb-1">Revenue per Client</h3>
              <div className="grid gap-y-0.5 text-xs text-muted-foreground">
                <span>Solo: $3K-$7K  Mid: $10K-$25K</span>
                <span>Large: $25K-$50K+</span>
                <span>Retainer: $500-$2,500/mo</span>
                <span>Landing pages: $1K-$3K each</span>
                <span>SEO packages: $1K-$5K/mo</span>
                <span>Avg. lifetime: 3-5 years</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ─── Main Tabs ─────────────────────────────── */}
      <Tabs value={tab} onValueChange={setTab}>
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto min-w-full">
            <TabsTrigger value="overview">Firm Setup</TabsTrigger>
            <TabsTrigger value="results">Case Results</TabsTrigger>
            <TabsTrigger value="attorneys">Attorneys</TabsTrigger>
            <TabsTrigger value="areas">Practice Areas</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="blog">Blog / Insights</TabsTrigger>
            <TabsTrigger value="intake">Intake Forms</TabsTrigger>
            <TabsTrigger value="seo">SEO &amp; Analytics</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* ═══ Firm Setup ═══════════════════════════ */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Firm Identity</CardTitle><CardDescription>Template defaults — each client overrides</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Firm Name</Label><Input value={data.config.firmName} onChange={e => up({ firmName: e.target.value })} placeholder="Smith & Associates, PLLC" /></div>
                <div className="space-y-2"><Label>Tagline</Label><Input value={data.config.tagline || ''} onChange={e => up({ tagline: e.target.value })} placeholder="Fighting for Justice Since 1995" /></div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={data.config.description || ''} onChange={e => up({ description: e.target.value })} rows={3} placeholder="Brief firm description for homepage / meta" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Phone</Label><Input value={data.config.phone || ''} onChange={e => up({ phone: e.target.value })} placeholder="(555) 123-4567" /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={data.config.email || ''} onChange={e => up({ email: e.target.value })} placeholder="info@firm.com" /></div>
                <div className="space-y-2"><Label>Founded</Label><Input value={data.config.foundedYear || ''} onChange={e => up({ foundedYear: e.target.value })} placeholder="1995" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Website</Label><Input value={data.config.website || ''} onChange={e => up({ website: e.target.value })} placeholder="https://firmname.com" /></div>
                <div className="space-y-2"><Label>Privacy Policy URL</Label><Input value={data.config.privacyPolicyUrl || ''} onChange={e => up({ privacyPolicyUrl: e.target.value })} placeholder="https://firmname.com/privacy" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Logo URL</Label><Input value={data.config.logoUrl || ''} onChange={e => up({ logoUrl: e.target.value })} placeholder="https://..." /></div>
                <div className="space-y-2"><Label>Logo (light variant)</Label><Input value={data.config.logoLightUrl || ''} onChange={e => up({ logoLightUrl: e.target.value })} placeholder="https://..." /></div>
              </div>
              <div className="space-y-2"><Label>Legal Disclaimer</Label><Textarea value={data.config.disclaimer || ''} onChange={e => up({ disclaimer: e.target.value })} rows={2} className="text-xs" /><p className="text-[10px] text-muted-foreground">Required by most bar associations. Appears in footer.</p></div>
              <div className="space-y-2"><Label>Bar Associations (comma-separated)</Label><Input value={(data.config.barAssociations || []).join(', ')} onChange={e => up({ barAssociations: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Texas State Bar, ABA" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Primary Color</Label><div className="flex gap-2"><Input type="color" value={data.config.primaryColor || '#1a365d'} onChange={e => up({ primaryColor: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" /><Input value={data.config.primaryColor || '#1a365d'} onChange={e => up({ primaryColor: e.target.value })} className="font-mono text-xs" /></div></div>
                <div className="space-y-2"><Label>Accent Color</Label><div className="flex gap-2"><Input type="color" value={data.config.accentColor || '#c7a44a'} onChange={e => up({ accentColor: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" /><Input value={data.config.accentColor || '#c7a44a'} onChange={e => up({ accentColor: e.target.value })} className="font-mono text-xs" /></div></div>
              </div>
              <div className="space-y-2 pt-4 border-t border-border/30">
                <Label>Visibility</Label>
                <Select value={data.visibility} onValueChange={(v: 'private' | 'unlisted' | 'demo') => setData(prev => ({ ...prev, visibility: v }))}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private (hidden)</SelectItem>
                    <SelectItem value="unlisted">Unlisted (link-only)</SelectItem>
                    <SelectItem value="demo">Demo Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Header / Footer Links */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Navigation Links</CardTitle><CardDescription>Header and footer nav items for the generated site</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Header Links</Label>
                {(data.config.headerLinks || []).map((link, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={link.label} onChange={e => { const links = [...(data.config.headerLinks || [])]; links[i] = { ...link, label: e.target.value }; up({ headerLinks: links }) }} placeholder="Label" className="w-32" />
                    <Input value={link.href} onChange={e => { const links = [...(data.config.headerLinks || [])]; links[i] = { ...link, href: e.target.value }; up({ headerLinks: links }) }} placeholder="#section or /page" className="flex-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => { const links = (data.config.headerLinks || []).filter((_, j) => j !== i); up({ headerLinks: links }) }}><Trash className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => up({ headerLinks: [...(data.config.headerLinks || []), { label: '', href: '', order: (data.config.headerLinks || []).length }] })}><Plus className="h-3 w-3 mr-1" />Add Header Link</Button>
              </div>
              <div className="space-y-2">
                <Label>Footer Links</Label>
                {(data.config.footerLinks || []).map((link, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={link.label} onChange={e => { const links = [...(data.config.footerLinks || [])]; links[i] = { ...link, label: e.target.value }; up({ footerLinks: links }) }} placeholder="Label" className="w-32" />
                    <Input value={link.href} onChange={e => { const links = [...(data.config.footerLinks || [])]; links[i] = { ...link, href: e.target.value }; up({ footerLinks: links }) }} placeholder="/privacy" className="flex-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => { const links = (data.config.footerLinks || []).filter((_, j) => j !== i); up({ footerLinks: links }) }}><Trash className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => up({ footerLinks: [...(data.config.footerLinks || []), { label: '', href: '', order: (data.config.footerLinks || []).length }] })}><Plus className="h-3 w-3 mr-1" />Add Footer Link</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Case Results ═════════════════════════ */}
        <TabsContent value="results" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Case Results ({data.caseResults.length})</h3>
            <Button size="sm" onClick={() => { setEditingResult({ id: `r_${Date.now()}`, title: '', practiceArea: '', resultType: 'verdict', amount: 0, currency: 'USD', date: new Date().toISOString().split('T')[0], summary: '', featured: false, order: data.caseResults.length + 1, tags: [] }); setDialogType('result') }}>
              <Plus className="h-4 w-4 mr-1" />Add Result
            </Button>
          </div>
          {data.caseResults.length === 0 ? (
            <GlassCard className="p-8 text-center"><Scales className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" /><p className="text-muted-foreground text-sm">No case results yet</p><p className="text-xs text-muted-foreground">Add verdicts, settlements, and outcomes to display the firm's track record</p></GlassCard>
          ) : (
            <div className="space-y-3">
              {[...data.caseResults].sort((a, b) => a.order - b.order).map(result => (
                <GlassCard key={result.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="text-right min-w-[100px]">
                      <p className="text-lg font-bold text-accent">{result.isConfidential ? 'Confidential' : result.amount ? fmt(result.amount, result.currency) : '—'}</p>
                      <Badge variant="outline" className="text-[10px] capitalize">{result.resultType}</Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><h4 className="font-semibold truncate">{result.title || 'Untitled'}</h4>{result.featured && <Star className="h-4 w-4 text-amber-400" weight="fill" />}</div>
                      <p className="text-xs text-muted-foreground">{result.practiceArea} · {result.date}{result.court ? ` · ${result.court}` : ''}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{result.summary}</p>
                      {result.tags.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{result.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingResult(result); setDialogType('result') }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => crudDelete(data.caseResults, result.id, 'caseResults')}><Trash className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ Attorneys ════════════════════════════ */}
        <TabsContent value="attorneys" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Attorney Profiles ({data.attorneys.length})</h3>
            <Button size="sm" onClick={() => { setEditingAttorney({ id: `a_${Date.now()}`, name: '', title: '', jurisdictions: [], practiceAreas: [], education: [{ school: '', degree: '' }], bio: '', featured: false, order: data.attorneys.length + 1 }); setDialogType('attorney') }}>
              <Plus className="h-4 w-4 mr-1" />Add Attorney
            </Button>
          </div>
          {data.attorneys.length === 0 ? (
            <GlassCard className="p-8 text-center"><UserCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" /><p className="text-muted-foreground text-sm">No attorneys yet</p></GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...data.attorneys].sort((a, b) => a.order - b.order).map(atty => (
                <GlassCard key={atty.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent text-lg font-bold shrink-0">
                      {atty.photoUrl ? <img src={atty.photoUrl} alt={atty.name} className="w-full h-full rounded-full object-cover" /> : (atty.name?.charAt(0)?.toUpperCase() || '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><h4 className="font-semibold">{atty.name || 'Unnamed'}</h4>{atty.featured && <Star className="h-3 w-3 text-amber-400" weight="fill" />}</div>
                      <p className="text-xs text-muted-foreground">{atty.title}{atty.barNumber ? ` · Bar #${atty.barNumber}` : ''}</p>
                      <div className="flex flex-wrap gap-1 mt-1">{atty.practiceAreas.slice(0, 3).map(a => <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>)}{atty.practiceAreas.length > 3 && <Badge variant="secondary" className="text-[10px]">+{atty.practiceAreas.length - 3}</Badge>}</div>
                      {atty.email && <p className="text-[10px] text-muted-foreground mt-1">{atty.email}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingAttorney(atty); setDialogType('attorney') }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => crudDelete(data.attorneys, atty.id, 'attorneys')}><Trash className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ Practice Areas ═══════════════════════ */}
        <TabsContent value="areas" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Practice Areas ({data.practiceAreas.length})</h3>
            <Button size="sm" onClick={() => { setEditingArea({ id: `pa_${Date.now()}`, name: '', slug: '', description: '', keyPoints: [], order: data.practiceAreas.length + 1 }); setDialogType('area') }}>
              <Plus className="h-4 w-4 mr-1" />Add Area
            </Button>
          </div>
          {data.practiceAreas.length === 0 ? (
            <GlassCard className="p-8 text-center"><Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" /><p className="text-muted-foreground text-sm">No practice areas yet</p></GlassCard>
          ) : (
            <div className="grid gap-3">
              {[...data.practiceAreas].sort((a, b) => a.order - b.order).map(area => (
                <GlassCard key={area.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><h4 className="font-semibold">{area.name}</h4><Badge variant="outline" className="text-[10px] font-mono">{area.slug || '—'}</Badge></div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{area.description}</p>
                      {area.keyPoints.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{area.keyPoints.slice(0, 5).map((kp, i) => <Badge key={i} variant="secondary" className="text-[10px]">{kp}</Badge>)}</div>}
                      {area.caseResultIds && area.caseResultIds.length > 0 && <p className="text-[10px] text-muted-foreground mt-1">{area.caseResultIds.length} linked case result(s)</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingArea(area); setDialogType('area') }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => crudDelete(data.practiceAreas, area.id, 'practiceAreas')}><Trash className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ Testimonials ═════════════════════════ */}
        <TabsContent value="testimonials" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Client Testimonials ({data.testimonials.length})</h3>
            <Button size="sm" onClick={() => { setEditingTestimonial({ id: `t_${Date.now()}`, clientName: '', quote: '', featured: false, order: data.testimonials.length + 1 }); setDialogType('testimonial') }}>
              <Plus className="h-4 w-4 mr-1" />Add Testimonial
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
                      {t.practiceArea && <Badge variant="secondary" className="text-[10px]">{t.practiceArea}</Badge>}
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

        {/* ═══ Blog / Insights ══════════════════════ */}
        <TabsContent value="blog" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Blog Posts ({(data.blogPosts || []).length})</h3>
            <Button size="sm" onClick={() => {
              const now = new Date().toISOString()
              setEditingBlog({ id: `blog_${Date.now()}`, title: '', slug: '', author: '', content: '', excerpt: '', tags: [], status: 'draft', createdAt: now, updatedAt: now, order: (data.blogPosts || []).length + 1 })
              setDialogType('blog')
            }}><Plus className="h-4 w-4 mr-1" />New Post</Button>
          </div>
          {(data.blogPosts || []).length === 0 ? (
            <GlassCard className="p-8 text-center"><Article className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" /><p className="text-muted-foreground text-sm">No blog posts yet</p><p className="text-xs text-muted-foreground">Law firm blogs drive SEO traffic and demonstrate expertise</p></GlassCard>
          ) : (
            <div className="space-y-3">
              {[...(data.blogPosts || [])].sort((a, b) => a.order - b.order).map(post => (
                <GlassCard key={post.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold truncate">{post.title || 'Untitled'}</h4>
                        <Badge variant={post.status === 'published' ? 'default' : 'outline'} className="text-[10px] capitalize">{post.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">by {post.author || '—'} · {post.practiceArea || 'General'}{post.publishedAt ? ` · ${post.publishedAt.split('T')[0]}` : ''}</p>
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

        {/* ═══ Intake Forms & Submissions ═══════════ */}
        <TabsContent value="intake" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Intake Form Builder</CardTitle><CardDescription>Configure client intake form fields</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch checked={data.config.intakeFormEnabled} onCheckedChange={c => up({ intakeFormEnabled: c })} />
                <Label>Enable Client Intake Form</Label>
              </div>
              {data.config.intakeFormEnabled && (
                <div className="space-y-3">
                  {(data.config.intakeFields || []).map((field, i) => (
                    <div key={field.id} className="flex gap-2 items-start p-3 rounded border border-border/30 bg-muted/5">
                      <div className="flex-1 grid grid-cols-4 gap-2">
                        <Input value={field.label} onChange={e => { const fields = [...data.config.intakeFields]; fields[i] = { ...field, label: e.target.value }; up({ intakeFields: fields }) }} placeholder="Label" />
                        <select className="flex h-10 rounded-md border border-input bg-background px-2 py-2 text-sm" value={field.type} onChange={e => { const fields = [...data.config.intakeFields]; fields[i] = { ...field, type: e.target.value as 'text' | 'email' | 'phone' | 'select' | 'textarea' }; up({ intakeFields: fields }) }}>
                          <option value="text">Text</option><option value="email">Email</option><option value="phone">Phone</option><option value="select">Select</option><option value="textarea">Textarea</option>
                        </select>
                        <div className="flex items-center gap-2">
                          <Switch checked={field.required} onCheckedChange={c => { const fields = [...data.config.intakeFields]; fields[i] = { ...field, required: c }; up({ intakeFields: fields }) }} />
                          <Label className="text-xs">Required</Label>
                        </div>
                        {field.type === 'select' && (
                          <Input value={(field.options || []).join(', ')} onChange={e => { const fields = [...data.config.intakeFields]; fields[i] = { ...field, options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }; up({ intakeFields: fields }) }} placeholder="Option1, Option2" className="text-xs" />
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:text-destructive" onClick={() => { const fields = data.config.intakeFields.filter((_, j) => j !== i); up({ intakeFields: fields }) }}><Trash className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => up({ intakeFields: [...data.config.intakeFields, { id: `f_${Date.now()}`, label: '', type: 'text', required: false }] })}><Plus className="h-3 w-3 mr-1" />Add Field</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submissions List */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Intake Submissions ({(data.intakeSubmissions || []).length})</CardTitle><CardDescription>Received form submissions — review and assign to attorneys</CardDescription></CardHeader>
            <CardContent>
              {(data.intakeSubmissions || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No submissions yet</p>
              ) : (
                <div className="space-y-3">
                  {(data.intakeSubmissions || []).map(sub => (
                    <div key={sub.id} className="p-3 rounded border border-border/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={sub.status === 'new' ? 'default' : 'outline'} className="text-[10px] capitalize">{sub.status}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                        </div>
                        <Select value={sub.status} onValueChange={(v: LawFirmIntakeSubmission['status']) => {
                          const subs = (data.intakeSubmissions || []).map(s => s.id === sub.id ? { ...s, status: v } : s)
                          setData(prev => ({ ...prev, intakeSubmissions: subs }))
                        }}>
                          <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem><SelectItem value="reviewed">Reviewed</SelectItem><SelectItem value="contacted">Contacted</SelectItem><SelectItem value="converted">Converted</SelectItem><SelectItem value="dismissed">Dismissed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        {Object.entries(sub.fields).map(([k, v]) => (
                          <span key={k}><strong className="capitalize">{k.replace(/-/g, ' ')}:</strong> {v}</span>
                        ))}
                      </div>
                      {sub.assignedTo && <p className="text-[10px] text-muted-foreground mt-1">Assigned: {sub.assignedTo}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ SEO & Analytics ══════════════════════ */}
        <TabsContent value="seo" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MagnifyingGlass className="h-5 w-5" />SEO Configuration</CardTitle><CardDescription>Search engine optimization and analytics</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Site Title (SEO)</Label><Input value={seo.globalTitle || ''} onChange={e => upSEO({ globalTitle: e.target.value })} placeholder="Firm Name | Tagline" /></div>
                <div className="space-y-2"><Label>Schema.org Type</Label>
                  <Select value={seo.schemaOrgType || 'LegalService'} onValueChange={v => upSEO({ schemaOrgType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SCHEMA_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Meta Description</Label><Textarea value={seo.globalDescription || ''} onChange={e => upSEO({ globalDescription: e.target.value })} rows={2} placeholder="Primary meta description for homepage (150-160 chars)" /><p className="text-[10px] text-muted-foreground">{(seo.globalDescription || '').length}/160 characters</p></div>
              <div className="space-y-2"><Label>OG Image URL</Label><Input value={seo.ogImageUrl || ''} onChange={e => upSEO({ ogImageUrl: e.target.value })} placeholder="https://..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Google Analytics ID</Label><Input value={seo.analyticsId || ''} onChange={e => upSEO({ analyticsId: e.target.value })} placeholder="G-XXXXXXXXXX" /></div>
                <div className="space-y-2"><Label>GTM Container ID</Label><Input value={seo.gtmId || ''} onChange={e => upSEO({ gtmId: e.target.value })} placeholder="GTM-XXXXXXX" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Google Site Verification</Label><Input value={seo.googleSiteVerification || ''} onChange={e => upSEO({ googleSiteVerification: e.target.value })} /></div>
                <div className="space-y-2"><Label>Twitter Handle</Label><Input value={seo.twitterHandle || ''} onChange={e => upSEO({ twitterHandle: e.target.value })} placeholder="@firmname" /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={seo.sitemapEnabled} onCheckedChange={c => upSEO({ sitemapEnabled: c })} /><Label>Generate Sitemap</Label></div>
              <div className="space-y-2"><Label>robots.txt (custom)</Label><Textarea value={seo.robotsTxt || ''} onChange={e => upSEO({ robotsTxt: e.target.value })} rows={3} className="font-mono text-xs" placeholder={'User-agent: *\nAllow: /'} /></div>
            </CardContent>
          </Card>

          {/* Local Business Schema */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Local Business Schema</CardTitle><CardDescription>Structured data for Google search results and maps</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Business Name</Label><Input value={seo.localBusinessSchema?.name || ''} onChange={e => upSEO({ localBusinessSchema: { ...seo.localBusinessSchema, name: e.target.value, address: seo.localBusinessSchema?.address || '', phone: seo.localBusinessSchema?.phone || '' } })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={seo.localBusinessSchema?.phone || ''} onChange={e => upSEO({ localBusinessSchema: { ...seo.localBusinessSchema, phone: e.target.value, name: seo.localBusinessSchema?.name || '', address: seo.localBusinessSchema?.address || '' } })} /></div>
              </div>
              <div className="space-y-2"><Label>Address</Label><Input value={seo.localBusinessSchema?.address || ''} onChange={e => upSEO({ localBusinessSchema: { ...seo.localBusinessSchema, address: e.target.value, name: seo.localBusinessSchema?.name || '', phone: seo.localBusinessSchema?.phone || '' } })} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Price Range</Label><Input value={seo.localBusinessSchema?.priceRange || ''} onChange={e => upSEO({ localBusinessSchema: { ...seo.localBusinessSchema, priceRange: e.target.value, name: seo.localBusinessSchema?.name || '', address: seo.localBusinessSchema?.address || '', phone: seo.localBusinessSchema?.phone || '' } })} placeholder="$$-$$$" /></div>
                <div className="space-y-2"><Label>Latitude</Label><Input type="number" step="any" value={seo.localBusinessSchema?.geo?.lat || ''} onChange={e => upSEO({ localBusinessSchema: { ...seo.localBusinessSchema, geo: { lat: parseFloat(e.target.value) || 0, lng: seo.localBusinessSchema?.geo?.lng || 0 }, name: seo.localBusinessSchema?.name || '', address: seo.localBusinessSchema?.address || '', phone: seo.localBusinessSchema?.phone || '' } })} /></div>
                <div className="space-y-2"><Label>Longitude</Label><Input type="number" step="any" value={seo.localBusinessSchema?.geo?.lng || ''} onChange={e => upSEO({ localBusinessSchema: { ...seo.localBusinessSchema, geo: { lat: seo.localBusinessSchema?.geo?.lat || 0, lng: parseFloat(e.target.value) || 0 }, name: seo.localBusinessSchema?.name || '', address: seo.localBusinessSchema?.address || '', phone: seo.localBusinessSchema?.phone || '' } })} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Office Locations ═════════════════════ */}
        <TabsContent value="locations" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Office Locations ({(data.config.officeLocations || []).length})</h3>
            <Button size="sm" onClick={() => up({ officeLocations: [...(data.config.officeLocations || []), { id: `loc_${Date.now()}`, name: 'Main Office', address: '', isPrimary: (data.config.officeLocations || []).length === 0 }] })}>
              <Plus className="h-4 w-4 mr-1" />Add Location
            </Button>
          </div>
          {(data.config.officeLocations || []).length === 0 ? (
            <GlassCard className="p-8 text-center"><MapPin className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" /><p className="text-muted-foreground text-sm">No office locations yet</p></GlassCard>
          ) : (
            <div className="space-y-3">
              {(data.config.officeLocations || []).map((loc, i) => (
                <Card key={loc.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">{loc.isPrimary && <Badge className="text-[10px]">Primary</Badge>}<span className="font-semibold text-sm">{loc.name || `Office ${i + 1}`}</span></div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => { const locs = (data.config.officeLocations || []).filter(l => l.id !== loc.id); up({ officeLocations: locs }) }}><Trash className="h-4 w-4" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={loc.name} onChange={e => { const locs = [...(data.config.officeLocations || [])]; locs[i] = { ...loc, name: e.target.value }; up({ officeLocations: locs }) }} /></div>
                      <div className="space-y-1"><Label className="text-xs">Phone</Label><Input value={loc.phone || ''} onChange={e => { const locs = [...(data.config.officeLocations || [])]; locs[i] = { ...loc, phone: e.target.value }; up({ officeLocations: locs }) }} /></div>
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Address</Label><Input value={loc.address} onChange={e => { const locs = [...(data.config.officeLocations || [])]; locs[i] = { ...loc, address: e.target.value }; up({ officeLocations: locs }) }} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-xs">Email</Label><Input value={loc.email || ''} onChange={e => { const locs = [...(data.config.officeLocations || [])]; locs[i] = { ...loc, email: e.target.value }; up({ officeLocations: locs }) }} /></div>
                      <div className="space-y-1"><Label className="text-xs">Map Embed URL</Label><Input value={loc.mapEmbedUrl || ''} onChange={e => { const locs = [...(data.config.officeLocations || [])]; locs[i] = { ...loc, mapEmbedUrl: e.target.value }; up({ officeLocations: locs }) }} /></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={loc.isPrimary} onCheckedChange={c => { const locs = (data.config.officeLocations || []).map((l, j) => ({ ...l, isPrimary: j === i ? c : (c ? false : l.isPrimary) })); up({ officeLocations: locs }) }} />
                      <Label className="text-xs">Primary office</Label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ Case Result Dialog ═════════════════════ */}
      <Dialog open={dialogType === 'result'} onOpenChange={o => { if (!o) close() }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingResult && data.caseResults.find(r => r.id === editingResult.id) ? 'Edit' : 'New'} Case Result</DialogTitle></DialogHeader>
          {editingResult && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Case Title *</Label><Input value={editingResult.title} onChange={e => setEditingResult({ ...editingResult, title: e.target.value })} placeholder="Johnson v. City of Houston" /></div>
                <div className="space-y-2"><Label>Practice Area</Label><Input value={editingResult.practiceArea} onChange={e => setEditingResult({ ...editingResult, practiceArea: e.target.value })} placeholder="Personal Injury" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Type</Label><Select value={editingResult.resultType} onValueChange={(v: CaseResult['resultType']) => setEditingResult({ ...editingResult, resultType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RESULT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Amount (cents)</Label><Input type="number" value={editingResult.amount || 0} onChange={e => setEditingResult({ ...editingResult, amount: parseInt(e.target.value) || 0 })} /><p className="text-[10px] text-muted-foreground">{fmt(editingResult.amount || 0)}</p></div>
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={editingResult.date} onChange={e => setEditingResult({ ...editingResult, date: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Summary</Label><Textarea value={editingResult.summary} onChange={e => setEditingResult({ ...editingResult, summary: e.target.value })} rows={3} placeholder="Brief case description" /></div>
              <div className="space-y-2"><Label>Full Description (optional)</Label><Textarea value={editingResult.description || ''} onChange={e => setEditingResult({ ...editingResult, description: e.target.value })} rows={4} placeholder="Detailed case narrative for detail page" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Court</Label><Input value={editingResult.court || ''} onChange={e => setEditingResult({ ...editingResult, court: e.target.value })} placeholder="Harris County District Court" /></div>
                <div className="space-y-2"><Label>Jurisdiction</Label><Input value={editingResult.jurisdiction || ''} onChange={e => setEditingResult({ ...editingResult, jurisdiction: e.target.value })} placeholder="Texas" /></div>
              </div>
              <div className="space-y-2"><Label>Tags (comma-separated)</Label><Input value={editingResult.tags.join(', ')} onChange={e => setEditingResult({ ...editingResult, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="medical malpractice, trucking accident" /></div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2"><Switch checked={editingResult.featured} onCheckedChange={c => setEditingResult({ ...editingResult, featured: c })} /><Label>Featured</Label></div>
                <div className="flex items-center gap-2"><Switch checked={editingResult.isConfidential || false} onCheckedChange={c => setEditingResult({ ...editingResult, isConfidential: c })} /><Label>Confidential Amount</Label></div>
              </div>
              <div className="space-y-2"><Label>Display Order</Label><Input type="number" value={editingResult.order} onChange={e => setEditingResult({ ...editingResult, order: parseInt(e.target.value) || 0 })} className="w-24" /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={() => { if (!editingResult) return; if (!editingResult.title.trim()) { toast.error('Title required'); return }; crudSave(data.caseResults, editingResult, 'caseResults') }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Attorney Dialog ════════════════════════ */}
      <Dialog open={dialogType === 'attorney'} onOpenChange={o => { if (!o) close() }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingAttorney && data.attorneys.find(a => a.id === editingAttorney.id) ? 'Edit' : 'New'} Attorney</DialogTitle></DialogHeader>
          {editingAttorney && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Full Name *</Label><Input value={editingAttorney.name} onChange={e => setEditingAttorney({ ...editingAttorney, name: e.target.value })} placeholder="Jane Smith, Esq." /></div>
                <div className="space-y-2"><Label>Title</Label><Input value={editingAttorney.title} onChange={e => setEditingAttorney({ ...editingAttorney, title: e.target.value })} placeholder="Partner" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Bar Number</Label><Input value={editingAttorney.barNumber || ''} onChange={e => setEditingAttorney({ ...editingAttorney, barNumber: e.target.value })} /></div>
                <div className="space-y-2"><Label>Jurisdictions</Label><Input value={editingAttorney.jurisdictions.join(', ')} onChange={e => setEditingAttorney({ ...editingAttorney, jurisdictions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Texas, Federal" /></div>
              </div>
              <div className="space-y-2"><Label>Practice Areas</Label><Input value={editingAttorney.practiceAreas.join(', ')} onChange={e => setEditingAttorney({ ...editingAttorney, practiceAreas: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></div>
              <div className="space-y-2"><Label>Photo URL</Label><Input value={editingAttorney.photoUrl || ''} onChange={e => setEditingAttorney({ ...editingAttorney, photoUrl: e.target.value })} placeholder="https://..." /></div>
              <div className="space-y-2"><Label>Bio</Label><Textarea value={editingAttorney.bio} onChange={e => setEditingAttorney({ ...editingAttorney, bio: e.target.value })} rows={4} /></div>
              <div className="space-y-2">
                <Label>Education</Label>
                {editingAttorney.education.map((edu, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={edu.school} onChange={e => { const ed = [...editingAttorney.education]; ed[i] = { ...edu, school: e.target.value }; setEditingAttorney({ ...editingAttorney, education: ed }) }} placeholder="Law School" className="flex-1" />
                    <Input value={edu.degree} onChange={e => { const ed = [...editingAttorney.education]; ed[i] = { ...edu, degree: e.target.value }; setEditingAttorney({ ...editingAttorney, education: ed }) }} placeholder="J.D." className="w-24" />
                    <Input value={edu.year || ''} onChange={e => { const ed = [...editingAttorney.education]; ed[i] = { ...edu, year: e.target.value }; setEditingAttorney({ ...editingAttorney, education: ed }) }} placeholder="2010" className="w-20" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { const ed = editingAttorney.education.filter((_, j) => j !== i); setEditingAttorney({ ...editingAttorney, education: ed }) }}><Trash className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setEditingAttorney({ ...editingAttorney, education: [...editingAttorney.education, { school: '', degree: '' }] })}><Plus className="h-3 w-3 mr-1" />Add Education</Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Email</Label><Input value={editingAttorney.email || ''} onChange={e => setEditingAttorney({ ...editingAttorney, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={editingAttorney.phone || ''} onChange={e => setEditingAttorney({ ...editingAttorney, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>LinkedIn</Label><Input value={editingAttorney.linkedIn || ''} onChange={e => setEditingAttorney({ ...editingAttorney, linkedIn: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><Switch checked={editingAttorney.featured} onCheckedChange={c => setEditingAttorney({ ...editingAttorney, featured: c })} /><Label>Featured</Label></div>
                <div className="space-y-2 flex items-center gap-2"><Label className="text-xs">Order</Label><Input type="number" value={editingAttorney.order} onChange={e => setEditingAttorney({ ...editingAttorney, order: parseInt(e.target.value) || 0 })} className="w-20" /></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={() => { if (!editingAttorney) return; if (!editingAttorney.name.trim()) { toast.error('Name required'); return }; crudSave(data.attorneys, editingAttorney, 'attorneys') }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Practice Area Dialog ═══════════════════ */}
      <Dialog open={dialogType === 'area'} onOpenChange={o => { if (!o) close() }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingArea && data.practiceAreas.find(a => a.id === editingArea.id) ? 'Edit' : 'New'} Practice Area</DialogTitle></DialogHeader>
          {editingArea && (
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Name *</Label><Input value={editingArea.name} onChange={e => setEditingArea({ ...editingArea, name: e.target.value, slug: editingArea.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} placeholder="Personal Injury" /></div>
              <div className="space-y-2"><Label>URL Slug</Label><Input value={editingArea.slug} onChange={e => setEditingArea({ ...editingArea, slug: e.target.value })} className="font-mono text-xs" placeholder="personal-injury" /></div>
              <div className="space-y-2"><Label>Icon (Phosphor name)</Label><Input value={editingArea.icon || ''} onChange={e => setEditingArea({ ...editingArea, icon: e.target.value })} placeholder="Scales, Heart, Shield" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={editingArea.description} onChange={e => setEditingArea({ ...editingArea, description: e.target.value })} rows={4} /></div>
              <div className="space-y-2"><Label>Key Points (one per line)</Label><Textarea value={editingArea.keyPoints.join('\n')} onChange={e => setEditingArea({ ...editingArea, keyPoints: e.target.value.split('\n').filter(s => s.trim()) })} rows={5} placeholder={'Free consultations\nNo fee unless we win\nMillions recovered'} /></div>
              <div className="space-y-2"><Label>Linked Case Results (IDs, comma-separated)</Label><Input value={(editingArea.caseResultIds || []).join(', ')} onChange={e => setEditingArea({ ...editingArea, caseResultIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></div>
              <div className="space-y-2"><Label>Order</Label><Input type="number" value={editingArea.order} onChange={e => setEditingArea({ ...editingArea, order: parseInt(e.target.value) || 0 })} className="w-24" /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={() => { if (!editingArea) return; if (!editingArea.name.trim()) { toast.error('Name required'); return }; crudSave(data.practiceAreas, editingArea, 'practiceAreas') }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Testimonial Dialog ═════════════════════ */}
      <Dialog open={dialogType === 'testimonial'} onOpenChange={o => { if (!o) close() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTestimonial && data.testimonials.find(t => t.id === editingTestimonial.id) ? 'Edit' : 'New'} Testimonial</DialogTitle></DialogHeader>
          {editingTestimonial && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Client Name</Label><Input value={editingTestimonial.clientName} onChange={e => setEditingTestimonial({ ...editingTestimonial, clientName: e.target.value })} placeholder="J. Smith" /></div>
                <div className="space-y-2"><Label>Title / Role</Label><Input value={editingTestimonial.clientTitle || ''} onChange={e => setEditingTestimonial({ ...editingTestimonial, clientTitle: e.target.value })} placeholder="Business Owner" /></div>
              </div>
              <div className="space-y-2"><Label>Quote *</Label><Textarea value={editingTestimonial.quote} onChange={e => setEditingTestimonial({ ...editingTestimonial, quote: e.target.value })} rows={4} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Practice Area</Label><Input value={editingTestimonial.practiceArea || ''} onChange={e => setEditingTestimonial({ ...editingTestimonial, practiceArea: e.target.value })} /></div>
                <div className="space-y-2"><Label>Rating (1-5)</Label><Input type="number" min={1} max={5} value={editingTestimonial.rating || ''} onChange={e => setEditingTestimonial({ ...editingTestimonial, rating: parseInt(e.target.value) || undefined })} /></div>
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={editingTestimonial.date || ''} onChange={e => setEditingTestimonial({ ...editingTestimonial, date: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={editingTestimonial.featured} onCheckedChange={c => setEditingTestimonial({ ...editingTestimonial, featured: c })} /><Label>Featured</Label></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={() => { if (!editingTestimonial) return; if (!editingTestimonial.quote.trim()) { toast.error('Quote required'); return }; crudSave(data.testimonials, editingTestimonial, 'testimonials') }}>Save</Button></DialogFooter>
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
                <div className="space-y-2"><Label>Author</Label><Input value={editingBlog.author} onChange={e => setEditingBlog({ ...editingBlog, author: e.target.value })} /></div>
                <div className="space-y-2"><Label>Practice Area</Label><Input value={editingBlog.practiceArea || ''} onChange={e => setEditingBlog({ ...editingBlog, practiceArea: e.target.value })} /></div>
                <div className="space-y-2"><Label>Status</Label>
                  <Select value={editingBlog.status} onValueChange={(v: LawFirmBlogPost['status']) => setEditingBlog({ ...editingBlog, status: v, publishedAt: v === 'published' ? (editingBlog.publishedAt || new Date().toISOString()) : editingBlog.publishedAt })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Excerpt</Label><Textarea value={editingBlog.excerpt} onChange={e => setEditingBlog({ ...editingBlog, excerpt: e.target.value })} rows={2} placeholder="Short description for listings" /></div>
              <div className="space-y-2"><Label>Content (Markdown/HTML)</Label><Textarea value={editingBlog.content} onChange={e => setEditingBlog({ ...editingBlog, content: e.target.value })} rows={12} className="font-mono text-xs" placeholder="Full article content..." /></div>
              <div className="space-y-2"><Label>Featured Image URL</Label><Input value={editingBlog.featuredImageUrl || ''} onChange={e => setEditingBlog({ ...editingBlog, featuredImageUrl: e.target.value })} /></div>
              <div className="space-y-2"><Label>Tags (comma-separated)</Label><Input value={editingBlog.tags.join(', ')} onChange={e => setEditingBlog({ ...editingBlog, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>SEO Title</Label><Input value={editingBlog.seoTitle || ''} onChange={e => setEditingBlog({ ...editingBlog, seoTitle: e.target.value })} placeholder="Custom SEO title" /></div>
                <div className="space-y-2"><Label>SEO Description</Label><Input value={editingBlog.seoDescription || ''} onChange={e => setEditingBlog({ ...editingBlog, seoDescription: e.target.value })} placeholder="Meta description" /></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={() => { if (!editingBlog) return; if (!editingBlog.title.trim()) { toast.error('Title required'); return }; editingBlog.updatedAt = new Date().toISOString(); crudSave(data.blogPosts || [], editingBlog, 'blogPosts') }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
