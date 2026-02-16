import { useState } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import {
  LawFirmShowcaseData,
  LawFirmConfig,
  CaseResult,
  AttorneyProfile,
  PracticeArea,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Plus, Pencil, Trash, Star, Eye, EyeSlash,
  Scales, UserCircle, Briefcase, ChatCircleDots,
  CurrencyDollar, Buildings, Warning, Info
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useAuth, logAudit } from '@/lib/auth'

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
  disclaimer: 'This website is for informational purposes only and does not constitute legal advice. No attorney-client relationship is formed by use of this site.'
}

const DEFAULT_DATA: LawFirmShowcaseData = {
  config: DEFAULT_CONFIG,
  caseResults: [],
  attorneys: [],
  practiceAreas: [],
  testimonials: [],
  visibility: 'private'
}

const RESULT_TYPES = [
  { value: 'verdict', label: 'Verdict' },
  { value: 'settlement', label: 'Settlement' },
  { value: 'dismissal', label: 'Dismissal' },
  { value: 'acquittal', label: 'Acquittal' },
  { value: 'award', label: 'Award' },
  { value: 'other', label: 'Other' },
]

function formatCurrency(cents: number, currency: string = 'USD'): string {
  if (cents === 0) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export default function LawFirmShowcaseManager() {
  const [data, setData] = useKV<LawFirmShowcaseData>('law-firm-showcase', DEFAULT_DATA)
  const [activeSubTab, setActiveSubTab] = useState('overview')
  const [editingResult, setEditingResult] = useState<CaseResult | null>(null)
  const [editingAttorney, setEditingAttorney] = useState<AttorneyProfile | null>(null)
  const [editingArea, setEditingArea] = useState<PracticeArea | null>(null)
  const [editingTestimonial, setEditingTestimonial] = useState<ClientTestimonial | null>(null)
  const [dialogType, setDialogType] = useState<'result' | 'attorney' | 'area' | 'testimonial' | null>(null)
  const { currentUser } = useAuth()

  const updateConfig = (updates: Partial<LawFirmConfig>) => {
    setData(prev => ({
      ...prev,
      config: { ...prev.config, ...updates }
    }))
  }

  // ─── Case Results ────────────────────────────────
  const addCaseResult = () => {
    const now = Date.now()
    setEditingResult({
      id: `result_${now}`,
      title: '',
      practiceArea: '',
      resultType: 'verdict',
      amount: 0,
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      summary: '',
      featured: false,
      order: (data.caseResults?.length || 0) + 1,
      tags: []
    })
    setDialogType('result')
  }

  const saveCaseResult = () => {
    if (!editingResult) return
    if (!editingResult.title.trim()) { toast.error('Title is required'); return }
    
    const isNew = !data.caseResults.find(r => r.id === editingResult.id)
    const updated = isNew
      ? [...data.caseResults, editingResult]
      : data.caseResults.map(r => r.id === editingResult.id ? editingResult : r)
    
    setData(prev => ({ ...prev, caseResults: updated }))
    toast.success(isNew ? 'Case result added' : 'Case result updated')
    setDialogType(null)
    setEditingResult(null)
  }

  const deleteCaseResult = (id: string) => {
    if (!confirm('Delete this case result?')) return
    setData(prev => ({ ...prev, caseResults: prev.caseResults.filter(r => r.id !== id) }))
    toast.success('Case result deleted')
  }

  // ─── Attorneys ───────────────────────────────────
  const addAttorney = () => {
    const now = Date.now()
    setEditingAttorney({
      id: `atty_${now}`,
      name: '',
      title: '',
      jurisdictions: [],
      practiceAreas: [],
      education: [{ school: '', degree: '' }],
      bio: '',
      featured: false,
      order: (data.attorneys?.length || 0) + 1,
    })
    setDialogType('attorney')
  }

  const saveAttorney = () => {
    if (!editingAttorney) return
    if (!editingAttorney.name.trim()) { toast.error('Name is required'); return }
    
    const isNew = !data.attorneys.find(a => a.id === editingAttorney.id)
    const updated = isNew
      ? [...data.attorneys, editingAttorney]
      : data.attorneys.map(a => a.id === editingAttorney.id ? editingAttorney : a)
    
    setData(prev => ({ ...prev, attorneys: updated }))
    toast.success(isNew ? 'Attorney added' : 'Attorney updated')
    setDialogType(null)
    setEditingAttorney(null)
  }

  const deleteAttorney = (id: string) => {
    if (!confirm('Delete this attorney?')) return
    setData(prev => ({ ...prev, attorneys: prev.attorneys.filter(a => a.id !== id) }))
    toast.success('Attorney deleted')
  }

  // ─── Practice Areas ──────────────────────────────
  const addPracticeArea = () => {
    const now = Date.now()
    setEditingArea({
      id: `area_${now}`,
      name: '',
      slug: '',
      description: '',
      keyPoints: [],
      order: (data.practiceAreas?.length || 0) + 1,
    })
    setDialogType('area')
  }

  const savePracticeArea = () => {
    if (!editingArea) return
    if (!editingArea.name.trim()) { toast.error('Name is required'); return }
    if (!editingArea.slug) editingArea.slug = editingArea.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    const isNew = !data.practiceAreas.find(a => a.id === editingArea.id)
    const updated = isNew
      ? [...data.practiceAreas, editingArea]
      : data.practiceAreas.map(a => a.id === editingArea.id ? editingArea : a)
    
    setData(prev => ({ ...prev, practiceAreas: updated }))
    toast.success(isNew ? 'Practice area added' : 'Practice area updated')
    setDialogType(null)
    setEditingArea(null)
  }

  // ─── Testimonials ────────────────────────────────
  const addTestimonial = () => {
    const now = Date.now()
    setEditingTestimonial({
      id: `test_${now}`,
      clientName: '',
      quote: '',
      featured: false,
      order: (data.testimonials?.length || 0) + 1,
    })
    setDialogType('testimonial')
  }

  const saveTestimonial = () => {
    if (!editingTestimonial) return
    if (!editingTestimonial.quote.trim()) { toast.error('Quote is required'); return }
    
    const isNew = !data.testimonials.find(t => t.id === editingTestimonial.id)
    const updated = isNew
      ? [...data.testimonials, editingTestimonial]
      : data.testimonials.map(t => t.id === editingTestimonial.id ? editingTestimonial : t)
    
    setData(prev => ({ ...prev, testimonials: updated }))
    toast.success(isNew ? 'Testimonial added' : 'Testimonial updated')
    setDialogType(null)
    setEditingTestimonial(null)
  }

  const totalVerdicts = data.caseResults.length
  const totalValue = data.caseResults
    .filter(r => !r.isConfidential && r.amount)
    .reduce((sum, r) => sum + (r.amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Scales className="h-6 w-6 text-accent" weight="duotone" />
            Law Firm Case Showcase
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Private template for law firm client websites — case wins, attorney profiles, practice areas
          </p>
        </div>
        <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
          <EyeSlash className="h-3 w-3 mr-1" />
          {data.visibility === 'private' ? 'Private' : data.visibility === 'demo' ? 'Demo Mode' : 'Unlisted'}
        </Badge>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-accent">{totalVerdicts}</p>
          <p className="text-xs text-muted-foreground">Case Results</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalValue)}</p>
          <p className="text-xs text-muted-foreground">Total Recovered</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-violet-400">{data.attorneys.length}</p>
          <p className="text-xs text-muted-foreground">Attorneys</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-cyan-400">{data.practiceAreas.length}</p>
          <p className="text-xs text-muted-foreground">Practice Areas</p>
        </GlassCard>
      </div>

      {/* What Lawyers Need — Reference */}
      <GlassCard className="p-4 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" weight="fill" />
          <div>
            <h3 className="text-sm font-semibold text-blue-400 mb-2">What Law Firms Need from Web Services</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground">
              <span>• Case results display (verdicts, settlements)</span>
              <span>• Attorney bio pages with credentials</span>
              <span>• Practice area landing pages (SEO)</span>
              <span>• Client intake forms with routing</span>
              <span>• ADA/WCAG compliance (mandatory)</span>
              <span>• Mobile-first responsive (60%+ mobile)</span>
              <span>• Google Business Profile integration</span>
              <span>• Local SEO schema markup</span>
              <span>• Testimonials/reviews display</span>
              <span>• Secure contact forms (encryption)</span>
              <span>• Required legal disclaimers</span>
              <span>• Bar association link verification</span>
              <span>• Blog/insights for content marketing</span>
              <span>• Video integration for case overviews</span>
              <span>• Fast load times (&lt; 3 seconds)</span>
              <span>• Analytics & conversion tracking</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Revenue Insight */}
      <GlassCard className="p-4 border-emerald-500/20">
        <div className="flex items-start gap-3">
          <CurrencyDollar className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" weight="fill" />
          <div>
            <h3 className="text-sm font-semibold text-emerald-400 mb-2">Revenue Opportunity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground">
              <span>• Solo attorneys: $3K-$7K per site</span>
              <span>• Mid firms (5-20 attorneys): $10K-$25K</span>
              <span>• Large firms: $25K-$50K+ custom builds</span>
              <span>• Monthly retainer: $500-$2,500/mo</span>
              <span>• Landing pages: $1K-$3K each</span>
              <span>• SEO packages: $1K-$5K/mo ongoing</span>
              <span>• Case results widget: $500 one-time</span>
              <span>• Average client lifetime: 3-5 years</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Firm Setup</TabsTrigger>
          <TabsTrigger value="results">Case Results</TabsTrigger>
          <TabsTrigger value="attorneys">Attorneys</TabsTrigger>
          <TabsTrigger value="areas">Practice Areas</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
        </TabsList>

        {/* Firm Setup */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Firm Configuration</CardTitle>
              <CardDescription>Template defaults — each client deployment overrides these values</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Firm Name</Label>
                  <Input
                    value={data.config.firmName}
                    onChange={(e) => updateConfig({ firmName: e.target.value })}
                    placeholder="e.g., Smith & Associates, PLLC"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input
                    value={data.config.tagline || ''}
                    onChange={(e) => updateConfig({ tagline: e.target.value })}
                    placeholder="e.g., Fighting for Justice Since 1995"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={data.config.description || ''}
                  onChange={(e) => updateConfig({ description: e.target.value })}
                  placeholder="Brief firm description for homepage and meta tags"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={data.config.phone || ''}
                    onChange={(e) => updateConfig({ phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={data.config.email || ''}
                    onChange={(e) => updateConfig({ email: e.target.value })}
                    placeholder="info@firmname.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Founded Year</Label>
                  <Input
                    value={data.config.foundedYear || ''}
                    onChange={(e) => updateConfig({ foundedYear: e.target.value })}
                    placeholder="1995"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Legal Disclaimer</Label>
                <Textarea
                  value={data.config.disclaimer || ''}
                  onChange={(e) => updateConfig({ disclaimer: e.target.value })}
                  rows={2}
                  className="text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Required by most state bar associations. Displayed in footer.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={data.config.primaryColor || '#1a365d'}
                      onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={data.config.primaryColor || '#1a365d'}
                      onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                      placeholder="#1a365d"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={data.config.accentColor || '#c7a44a'}
                      onChange={(e) => updateConfig({ accentColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={data.config.accentColor || '#c7a44a'}
                      onChange={(e) => updateConfig({ accentColor: e.target.value })}
                      placeholder="#c7a44a"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={data.config.intakeFormEnabled}
                  onCheckedChange={(checked) => updateConfig({ intakeFormEnabled: checked })}
                />
                <Label>Enable Client Intake Form</Label>
              </div>

              {/* Visibility control */}
              <div className="space-y-2 pt-4 border-t border-border/30">
                <Label>Showcase Visibility</Label>
                <Select
                  value={data.visibility}
                  onValueChange={(v: 'private' | 'unlisted' | 'demo') => setData(prev => ({ ...prev, visibility: v }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private (hidden)</SelectItem>
                    <SelectItem value="unlisted">Unlisted (link-only)</SelectItem>
                    <SelectItem value="demo">Demo Mode</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Keep private during development. Switch to demo for client presentations.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Case Results */}
        <TabsContent value="results" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Case Results ({data.caseResults.length})</h3>
            <Button onClick={addCaseResult} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Result
            </Button>
          </div>

          {data.caseResults.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Scales className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-sm mb-3">No case results yet</p>
              <p className="text-xs text-muted-foreground">Add verdicts, settlements, and case outcomes to showcase the firm's track record</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {[...data.caseResults].sort((a, b) => a.order - b.order).map((result) => (
                <GlassCard key={result.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="text-right min-w-[100px]">
                      <p className="text-lg font-bold text-accent">
                        {result.isConfidential ? 'Confidential' : result.amount ? formatCurrency(result.amount, result.currency) : '—'}
                      </p>
                      <Badge variant="outline" className="text-[10px] capitalize">{result.resultType}</Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold truncate">{result.title || 'Untitled'}</h4>
                        {result.featured && <Star className="h-4 w-4 text-amber-400" weight="fill" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{result.practiceArea} · {result.date}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{result.summary}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingResult(result); setDialogType('result') }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => deleteCaseResult(result.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Attorneys */}
        <TabsContent value="attorneys" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Attorney Profiles ({data.attorneys.length})</h3>
            <Button onClick={addAttorney} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Attorney
            </Button>
          </div>

          {data.attorneys.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <UserCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-sm">No attorney profiles yet</p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...data.attorneys].sort((a, b) => a.order - b.order).map((atty) => (
                <GlassCard key={atty.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent text-lg font-bold">
                      {atty.name ? atty.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">{atty.name || 'Unnamed'}</h4>
                      <p className="text-xs text-muted-foreground">{atty.title}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {atty.practiceAreas.slice(0, 3).map(a => (
                          <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingAttorney(atty); setDialogType('attorney') }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => deleteAttorney(atty.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Practice Areas */}
        <TabsContent value="areas" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Practice Areas ({data.practiceAreas.length})</h3>
            <Button onClick={addPracticeArea} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Area
            </Button>
          </div>

          {data.practiceAreas.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-sm">No practice areas yet</p>
            </GlassCard>
          ) : (
            <div className="grid gap-3">
              {[...data.practiceAreas].sort((a, b) => a.order - b.order).map((area) => (
                <GlassCard key={area.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{area.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{area.description}</p>
                      {area.keyPoints.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {area.keyPoints.slice(0, 4).map((kp, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">{kp}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingArea(area); setDialogType('area') }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Testimonials */}
        <TabsContent value="testimonials" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Client Testimonials ({data.testimonials.length})</h3>
            <Button onClick={addTestimonial} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Testimonial
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
                  <blockquote className="border-l-2 border-accent/50 pl-3 text-sm italic text-muted-foreground">
                    "{t.quote}"
                  </blockquote>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs font-medium">— {t.clientName || 'Anonymous'}</p>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTestimonial(t); setDialogType('testimonial') }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Case Result Dialog ──────────────────────── */}
      <Dialog open={dialogType === 'result'} onOpenChange={(open) => { if (!open) { setDialogType(null); setEditingResult(null) } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingResult && data.caseResults.find(r => r.id === editingResult.id) ? 'Edit' : 'New'} Case Result</DialogTitle>
          </DialogHeader>
          {editingResult && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Case Title *</Label>
                  <Input value={editingResult.title} onChange={(e) => setEditingResult({ ...editingResult, title: e.target.value })} placeholder="e.g., Johnson v. City of Houston" />
                </div>
                <div className="space-y-2">
                  <Label>Practice Area</Label>
                  <Input value={editingResult.practiceArea} onChange={(e) => setEditingResult({ ...editingResult, practiceArea: e.target.value })} placeholder="e.g., Personal Injury" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Result Type</Label>
                  <Select value={editingResult.resultType} onValueChange={(v: CaseResult['resultType']) => setEditingResult({ ...editingResult, resultType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RESULT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (cents)</Label>
                  <Input type="number" value={editingResult.amount || 0} onChange={(e) => setEditingResult({ ...editingResult, amount: parseInt(e.target.value) || 0 })} />
                  <p className="text-[10px] text-muted-foreground">{editingResult.amount ? formatCurrency(editingResult.amount) : '$0'}</p>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={editingResult.date} onChange={(e) => setEditingResult({ ...editingResult, date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Summary</Label>
                <Textarea value={editingResult.summary} onChange={(e) => setEditingResult({ ...editingResult, summary: e.target.value })} rows={3} placeholder="Brief description of the case and outcome" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Court</Label>
                  <Input value={editingResult.court || ''} onChange={(e) => setEditingResult({ ...editingResult, court: e.target.value })} placeholder="e.g., Harris County District Court" />
                </div>
                <div className="space-y-2">
                  <Label>Jurisdiction</Label>
                  <Input value={editingResult.jurisdiction || ''} onChange={(e) => setEditingResult({ ...editingResult, jurisdiction: e.target.value })} placeholder="e.g., Texas" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={editingResult.featured} onCheckedChange={(c) => setEditingResult({ ...editingResult, featured: c })} />
                  <Label>Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editingResult.isConfidential || false} onCheckedChange={(c) => setEditingResult({ ...editingResult, isConfidential: c })} />
                  <Label>Confidential Amount</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogType(null); setEditingResult(null) }}>Cancel</Button>
            <Button onClick={saveCaseResult}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Attorney Dialog ─────────────────────────── */}
      <Dialog open={dialogType === 'attorney'} onOpenChange={(open) => { if (!open) { setDialogType(null); setEditingAttorney(null) } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAttorney && data.attorneys.find(a => a.id === editingAttorney.id) ? 'Edit' : 'New'} Attorney</DialogTitle>
          </DialogHeader>
          {editingAttorney && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={editingAttorney.name} onChange={(e) => setEditingAttorney({ ...editingAttorney, name: e.target.value })} placeholder="Jane Smith, Esq." />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={editingAttorney.title} onChange={(e) => setEditingAttorney({ ...editingAttorney, title: e.target.value })} placeholder="e.g., Partner" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bar Number</Label>
                  <Input value={editingAttorney.barNumber || ''} onChange={(e) => setEditingAttorney({ ...editingAttorney, barNumber: e.target.value })} placeholder="12345678" />
                </div>
                <div className="space-y-2">
                  <Label>Jurisdictions (comma-separated)</Label>
                  <Input value={editingAttorney.jurisdictions.join(', ')} onChange={(e) => setEditingAttorney({ ...editingAttorney, jurisdictions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Texas, Federal" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Practice Areas (comma-separated)</Label>
                <Input value={editingAttorney.practiceAreas.join(', ')} onChange={(e) => setEditingAttorney({ ...editingAttorney, practiceAreas: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Personal Injury, Civil Rights" />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea value={editingAttorney.bio} onChange={(e) => setEditingAttorney({ ...editingAttorney, bio: e.target.value })} rows={4} placeholder="Attorney biography and professional experience" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={editingAttorney.email || ''} onChange={(e) => setEditingAttorney({ ...editingAttorney, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={editingAttorney.phone || ''} onChange={(e) => setEditingAttorney({ ...editingAttorney, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Input value={editingAttorney.linkedIn || ''} onChange={(e) => setEditingAttorney({ ...editingAttorney, linkedIn: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingAttorney.featured} onCheckedChange={(c) => setEditingAttorney({ ...editingAttorney, featured: c })} />
                <Label>Featured attorney</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogType(null); setEditingAttorney(null) }}>Cancel</Button>
            <Button onClick={saveAttorney}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Practice Area Dialog ────────────────────── */}
      <Dialog open={dialogType === 'area'} onOpenChange={(open) => { if (!open) { setDialogType(null); setEditingArea(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingArea && data.practiceAreas.find(a => a.id === editingArea.id) ? 'Edit' : 'New'} Practice Area</DialogTitle>
          </DialogHeader>
          {editingArea && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={editingArea.name} onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value })} placeholder="e.g., Personal Injury" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editingArea.description} onChange={(e) => setEditingArea({ ...editingArea, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Key Points (one per line)</Label>
                <Textarea value={editingArea.keyPoints.join('\n')} onChange={(e) => setEditingArea({ ...editingArea, keyPoints: e.target.value.split('\n').filter(s => s.trim()) })} rows={4} placeholder="Free consultations&#10;No fee unless we win&#10;Millions recovered" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogType(null); setEditingArea(null) }}>Cancel</Button>
            <Button onClick={savePracticeArea}>Save</Button>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <Input value={editingTestimonial.clientName} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, clientName: e.target.value })} placeholder="J. Smith or Anonymous" />
                </div>
                <div className="space-y-2">
                  <Label>Practice Area</Label>
                  <Input value={editingTestimonial.practiceArea || ''} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, practiceArea: e.target.value })} placeholder="Personal Injury" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Quote *</Label>
                <Textarea value={editingTestimonial.quote} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, quote: e.target.value })} rows={4} placeholder="What the client said about the firm's work" />
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
    </div>
  )
}
