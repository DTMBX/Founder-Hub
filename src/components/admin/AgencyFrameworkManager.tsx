import { useState } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import {
  AgencyFrameworkData,
  AgencyClientProject,
  AgencyPipelineLead,
  AgencyProjectStatus,
} from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Plus, Pencil, Trash, EyeSlash, Kanban, FunnelSimple,
  Buildings, CurrencyDollar, Clock, CheckCircle, Warning,
  Rocket, Gear, MagnifyingGlass, PaintBrush, Code,
  Info, ArrowRight, TrendUp
} from '@phosphor-icons/react'
import { toast } from 'sonner'

const DEFAULT_DATA: AgencyFrameworkData = {
  projects: [],
  pipeline: [],
  brandingRemoved: true,
}

const PROJECT_STATUSES: { value: AgencyProjectStatus; label: string; color: string; icon: typeof MagnifyingGlass }[] = [
  { value: 'discovery', label: 'Discovery', color: 'text-blue-400', icon: MagnifyingGlass },
  { value: 'design', label: 'Design', color: 'text-violet-400', icon: PaintBrush },
  { value: 'development', label: 'Development', color: 'text-amber-400', icon: Code },
  { value: 'review', label: 'Review', color: 'text-cyan-400', icon: CheckCircle },
  { value: 'launched', label: 'Launched', color: 'text-emerald-400', icon: Rocket },
  { value: 'maintenance', label: 'Maintenance', color: 'text-gray-400', icon: Gear },
]

const TEMPLATE_TYPES = [
  { value: 'law-firm', label: 'Law Firm' },
  { value: 'small-business', label: 'Small Business' },
  { value: 'custom', label: 'Custom Build' },
  { value: 'landing-page', label: 'Landing Page' },
]

const LEAD_STATUSES = [
  { value: 'new', label: 'New', color: 'text-blue-400' },
  { value: 'contacted', label: 'Contacted', color: 'text-cyan-400' },
  { value: 'proposal', label: 'Proposal Sent', color: 'text-violet-400' },
  { value: 'negotiation', label: 'Negotiation', color: 'text-amber-400' },
  { value: 'won', label: 'Won', color: 'text-emerald-400' },
  { value: 'lost', label: 'Lost', color: 'text-red-400' },
]

function formatCurrency(cents: number): string {
  if (cents === 0) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function getStatusIndex(status: AgencyProjectStatus): number {
  return PROJECT_STATUSES.findIndex(s => s.value === status)
}

export default function AgencyFrameworkManager() {
  const [data, setData] = useKV<AgencyFrameworkData>('agency-framework', DEFAULT_DATA)
  const [activeSubTab, setActiveSubTab] = useState('dashboard')
  const [editingProject, setEditingProject] = useState<AgencyClientProject | null>(null)
  const [editingLead, setEditingLead] = useState<AgencyPipelineLead | null>(null)
  const [dialogType, setDialogType] = useState<'project' | 'lead' | null>(null)

  // ─── Project CRUD ────────────────────────────────
  const addProject = () => {
    setEditingProject({
      id: `proj_${Date.now()}`,
      clientName: '',
      templateType: 'small-business',
      status: 'discovery',
      startDate: new Date().toISOString().split('T')[0],
      budget: 0,
      hoursEstimated: 0,
      hoursUsed: 0,
      deliverables: [],
      notes: '',
    })
    setDialogType('project')
  }

  const saveProject = () => {
    if (!editingProject) return
    if (!editingProject.clientName.trim()) { toast.error('Client name required'); return }
    const isNew = !data.projects.find(p => p.id === editingProject.id)
    const updated = isNew
      ? [...data.projects, editingProject]
      : data.projects.map(p => p.id === editingProject.id ? editingProject : p)
    setData(prev => ({ ...prev, projects: updated }))
    toast.success(isNew ? 'Project added' : 'Project updated')
    setDialogType(null)
    setEditingProject(null)
  }

  const deleteProject = (id: string) => {
    if (!confirm('Delete this project?')) return
    setData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }))
    toast.success('Project deleted')
  }

  // ─── Lead / Pipeline CRUD ───────────────────────
  const addLead = () => {
    setEditingLead({
      id: `lead_${Date.now()}`,
      contactName: '',
      email: '',
      serviceInterest: '',
      budget: '',
      status: 'new',
      source: '',
      notes: '',
      createdAt: new Date().toISOString(),
    })
    setDialogType('lead')
  }

  const saveLead = () => {
    if (!editingLead) return
    if (!editingLead.contactName.trim()) { toast.error('Contact name required'); return }
    const isNew = !data.pipeline.find(l => l.id === editingLead.id)
    const updated = isNew
      ? [...data.pipeline, editingLead]
      : data.pipeline.map(l => l.id === editingLead.id ? editingLead : l)
    setData(prev => ({ ...prev, pipeline: updated }))
    toast.success(isNew ? 'Lead added' : 'Lead updated')
    setDialogType(null)
    setEditingLead(null)
  }

  const deleteLead = (id: string) => {
    if (!confirm('Delete this lead?')) return
    setData(prev => ({ ...prev, pipeline: prev.pipeline.filter(l => l.id !== id) }))
    toast.success('Lead deleted')
  }

  // ─── Computed metrics ────────────────────────────
  const activeProjects = data.projects.filter(p => !['launched', 'maintenance'].includes(p.status))
  const totalRevenue = data.projects.filter(p => p.status === 'launched').reduce((s, p) => s + p.budget, 0)
  const pipelineValue = data.pipeline
    .filter(l => !['won', 'lost'].includes(l.status))
    .reduce((s, l) => {
      const num = parseInt(l.budget?.replace(/[^0-9]/g, '') || '0', 10)
      return s + num * 100 // convert to cents
    }, 0)
  const wonLeads = data.pipeline.filter(l => l.status === 'won').length
  const totalHoursUsed = data.projects.reduce((s, p) => s + p.hoursUsed, 0)
  const totalHoursEstimated = data.projects.reduce((s, p) => s + p.hoursEstimated, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Buildings className="h-6 w-6 text-accent" weight="duotone" />
            Agency Framework
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            White-label agency operations — project tracking, pipeline CRM, template management
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs border-emerald-500/50 text-emerald-400">
            No Branding
          </Badge>
          <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
            <EyeSlash className="h-3 w-3 mr-1" />
            Private
          </Badge>
        </div>
      </div>

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-accent">{activeProjects.length}</p>
          <p className="text-xs text-muted-foreground">Active Projects</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">Revenue (Launched)</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-violet-400">{formatCurrency(pipelineValue)}</p>
          <p className="text-xs text-muted-foreground">Pipeline Value</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-cyan-400">{wonLeads}</p>
          <p className="text-xs text-muted-foreground">Won Deals</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">
            {totalHoursEstimated > 0 ? `${Math.round((totalHoursUsed / totalHoursEstimated) * 100)}%` : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Hours Utilization</p>
        </GlassCard>
      </div>

      {/* Revenue Strategy */}
      <GlassCard className="p-4 border-emerald-500/20">
        <div className="flex items-start gap-3">
          <TrendUp className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" weight="fill" />
          <div>
            <h3 className="text-sm font-semibold text-emerald-400 mb-2">Agency Revenue Model</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground">
              <span>• White-label: No personal brand on client sites</span>
              <span>• Law firm sites: $5K-$35K per project</span>
              <span>• SMB sites: $2K-$10K per project</span>
              <span>• Landing pages: $1K-$3K per page</span>
              <span>• Monthly retainers: $500-$2.5K/mo</span>
              <span>• Template reuse: 70-80% code shared</span>
              <span>• Upselling: SEO, content, maintenance</span>
              <span>• Scale via processes, not more hours</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="dashboard">Project Board</TabsTrigger>
          <TabsTrigger value="pipeline">Sales Pipeline</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* ─── Project Board ─────────────────────────── */}
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Kanban className="h-4 w-4" />
              Projects ({data.projects.length})
            </h3>
            <Button onClick={addProject} size="sm">
              <Plus className="h-4 w-4 mr-1" /> New Project
            </Button>
          </div>

          {data.projects.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Kanban className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-sm mb-1">No projects yet</p>
              <p className="text-xs text-muted-foreground">Add client projects to track from discovery through launch</p>
            </GlassCard>
          ) : (
            <>
              {/* Kanban-style status groups */}
              <div className="space-y-6">
                {PROJECT_STATUSES.map((statusDef) => {
                  const projectsInStatus = data.projects.filter(p => p.status === statusDef.value)
                  if (projectsInStatus.length === 0) return null
                  const StatusIcon = statusDef.icon

                  return (
                    <div key={statusDef.value}>
                      <div className="flex items-center gap-2 mb-2">
                        <StatusIcon className={`h-4 w-4 ${statusDef.color}`} weight="duotone" />
                        <h4 className={`text-sm font-semibold ${statusDef.color}`}>{statusDef.label}</h4>
                        <Badge variant="secondary" className="text-[10px]">{projectsInStatus.length}</Badge>
                      </div>
                      <div className="grid gap-3">
                        {projectsInStatus.map((project) => (
                          <GlassCard key={project.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold">{project.clientName}</h4>
                                  <Badge variant="outline" className="text-[10px] capitalize">{project.templateType.replace('-', ' ')}</Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                  {project.budget > 0 && (
                                    <span className="flex items-center gap-1">
                                      <CurrencyDollar className="h-3 w-3" />
                                      {formatCurrency(project.budget)}
                                    </span>
                                  )}
                                  {project.hoursEstimated > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {project.hoursUsed}/{project.hoursEstimated}h
                                    </span>
                                  )}
                                  {project.domain && (
                                    <span className="truncate">{project.domain}</span>
                                  )}
                                </div>
                                {project.deliverables.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {project.deliverables.slice(0, 4).map((d, i) => (
                                      <Badge key={i} variant="secondary" className="text-[10px]">{d}</Badge>
                                    ))}
                                    {project.deliverables.length > 4 && (
                                      <Badge variant="secondary" className="text-[10px]">+{project.deliverables.length - 4}</Badge>
                                    )}
                                  </div>
                                )}
                                {/* Progress bar for hours */}
                                {project.hoursEstimated > 0 && (
                                  <div className="mt-2 h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        project.hoursUsed / project.hoursEstimated > 0.9 ? 'bg-red-400' :
                                        project.hoursUsed / project.hoursEstimated > 0.7 ? 'bg-amber-400' :
                                        'bg-emerald-400'
                                      }`}
                                      style={{ width: `${Math.min(100, (project.hoursUsed / project.hoursEstimated) * 100)}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1 shrink-0 ml-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingProject(project); setDialogType('project') }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => deleteProject(project.id)}>
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </GlassCard>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* ─── Sales Pipeline ────────────────────────── */}
        <TabsContent value="pipeline" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <FunnelSimple className="h-4 w-4" />
              Sales Pipeline ({data.pipeline.length})
            </h3>
            <Button onClick={addLead} size="sm">
              <Plus className="h-4 w-4 mr-1" /> New Lead
            </Button>
          </div>

          {data.pipeline.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <FunnelSimple className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-sm mb-1">No leads in pipeline</p>
              <p className="text-xs text-muted-foreground">Track potential clients from first contact through close</p>
            </GlassCard>
          ) : (
            <div className="space-y-6">
              {LEAD_STATUSES.map((statusDef) => {
                const leadsInStatus = data.pipeline.filter(l => l.status === statusDef.value)
                if (leadsInStatus.length === 0) return null

                return (
                  <div key={statusDef.value}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${statusDef.color.replace('text-', 'bg-')}`} />
                      <h4 className={`text-sm font-semibold ${statusDef.color}`}>{statusDef.label}</h4>
                      <Badge variant="secondary" className="text-[10px]">{leadsInStatus.length}</Badge>
                    </div>
                    <div className="grid gap-3">
                      {leadsInStatus.map((lead) => (
                        <GlassCard key={lead.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold">{lead.contactName}</h4>
                                {lead.company && <span className="text-xs text-muted-foreground">at {lead.company}</span>}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                {lead.email && <span>{lead.email}</span>}
                                {lead.phone && <span>{lead.phone}</span>}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                {lead.serviceInterest && <Badge variant="outline" className="text-[10px]">{lead.serviceInterest}</Badge>}
                                {lead.budget && <span className="font-medium text-emerald-400">{lead.budget}</span>}
                                {lead.source && <span>via {lead.source}</span>}
                              </div>
                              {lead.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{lead.notes}</p>}
                            </div>
                            <div className="flex gap-1 shrink-0 ml-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingLead(lead); setDialogType('lead') }}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => deleteLead(lead.id)}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── Templates Overview ────────────────────── */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <h3 className="font-semibold">Available Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard className="p-5 border-blue-500/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Buildings className="h-5 w-5 text-blue-400" weight="duotone" />
                </div>
                <div>
                  <h4 className="font-semibold">Law Firm Template</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Case results showcase, attorney profiles, practice area pages, intake forms,
                    ADA compliance, bar disclaimers
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="text-[10px]">Case Results</Badge>
                    <Badge variant="secondary" className="text-[10px]">Attorney Bios</Badge>
                    <Badge variant="secondary" className="text-[10px]">Intake Forms</Badge>
                    <Badge variant="secondary" className="text-[10px]">ADA Compliant</Badge>
                  </div>
                  <p className="text-[10px] text-emerald-400 mt-2">$5,000 – $35,000 per build</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-5 border-violet-500/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Gear className="h-5 w-5 text-violet-400" weight="duotone" />
                </div>
                <div>
                  <h4 className="font-semibold">Small Business Template</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configurable sections (hero, services, team, reviews, FAQ, gallery, contact),
                    social links, Google Maps, analytics
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="text-[10px]">8 Sections</Badge>
                    <Badge variant="secondary" className="text-[10px]">Mobile-First</Badge>
                    <Badge variant="secondary" className="text-[10px]">SEO Ready</Badge>
                    <Badge variant="secondary" className="text-[10px]">Social Links</Badge>
                  </div>
                  <p className="text-[10px] text-emerald-400 mt-2">$2,000 – $10,000 per build</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-5 border-amber-500/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-amber-400" weight="duotone" />
                </div>
                <div>
                  <h4 className="font-semibold">Landing Page Template</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Single-page conversion-focused design, CTA-driven, A/B test ready,
                    analytics-integrated
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="text-[10px]">Single Page</Badge>
                    <Badge variant="secondary" className="text-[10px]">CTA Focused</Badge>
                    <Badge variant="secondary" className="text-[10px]">Fast Deploy</Badge>
                  </div>
                  <p className="text-[10px] text-emerald-400 mt-2">$1,000 – $3,000 per page</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-5 border-emerald-500/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Code className="h-5 w-5 text-emerald-400" weight="duotone" />
                </div>
                <div>
                  <h4 className="font-semibold">Custom Build</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fully custom architecture — e-commerce, SaaS dashboards, multi-page apps,
                    API integrations
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="text-[10px]">Full Custom</Badge>
                    <Badge variant="secondary" className="text-[10px]">API Ready</Badge>
                    <Badge variant="secondary" className="text-[10px]">Scalable</Badge>
                  </div>
                  <p className="text-[10px] text-emerald-400 mt-2">$10,000+ per project</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Template stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {TEMPLATE_TYPES.map(tt => {
                  const count = data.projects.filter(p => p.templateType === tt.value).length
                  return (
                    <div key={tt.value}>
                      <p className="text-2xl font-bold text-accent">{count}</p>
                      <p className="text-xs text-muted-foreground">{tt.label}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Project Dialog ──────────────────────────── */}
      <Dialog open={dialogType === 'project'} onOpenChange={(open) => { if (!open) { setDialogType(null); setEditingProject(null) } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProject && data.projects.find(p => p.id === editingProject.id) ? 'Edit' : 'New'} Project</DialogTitle>
          </DialogHeader>
          {editingProject && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name *</Label>
                  <Input value={editingProject.clientName} onChange={(e) => setEditingProject({ ...editingProject, clientName: e.target.value })} placeholder="Acme Corp" />
                </div>
                <div className="space-y-2">
                  <Label>Template Type</Label>
                  <Select value={editingProject.templateType} onValueChange={(v: AgencyClientProject['templateType']) => setEditingProject({ ...editingProject, templateType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editingProject.status} onValueChange={(v: AgencyProjectStatus) => setEditingProject({ ...editingProject, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={editingProject.startDate} onChange={(e) => setEditingProject({ ...editingProject, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Input value={editingProject.domain || ''} onChange={(e) => setEditingProject({ ...editingProject, domain: e.target.value })} placeholder="client.com" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Budget (cents)</Label>
                  <Input type="number" value={editingProject.budget} onChange={(e) => setEditingProject({ ...editingProject, budget: parseInt(e.target.value) || 0 })} />
                  <p className="text-[10px] text-muted-foreground">{formatCurrency(editingProject.budget)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Hours Estimated</Label>
                  <Input type="number" value={editingProject.hoursEstimated} onChange={(e) => setEditingProject({ ...editingProject, hoursEstimated: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Hours Used</Label>
                  <Input type="number" value={editingProject.hoursUsed} onChange={(e) => setEditingProject({ ...editingProject, hoursUsed: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deliverables (comma-separated)</Label>
                <Input value={editingProject.deliverables.join(', ')} onChange={(e) => setEditingProject({ ...editingProject, deliverables: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Homepage, About, Services, Contact" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={editingProject.notes || ''} onChange={(e) => setEditingProject({ ...editingProject, notes: e.target.value })} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogType(null); setEditingProject(null) }}>Cancel</Button>
            <Button onClick={saveProject}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Lead Dialog ─────────────────────────────── */}
      <Dialog open={dialogType === 'lead'} onOpenChange={(open) => { if (!open) { setDialogType(null); setEditingLead(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLead && data.pipeline.find(l => l.id === editingLead.id) ? 'Edit' : 'New'} Lead</DialogTitle>
          </DialogHeader>
          {editingLead && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name *</Label>
                  <Input value={editingLead.contactName} onChange={(e) => setEditingLead({ ...editingLead, contactName: e.target.value })} placeholder="John Smith" />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input value={editingLead.company || ''} onChange={(e) => setEditingLead({ ...editingLead, company: e.target.value })} placeholder="Acme Corp" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={editingLead.email} onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })} placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={editingLead.phone || ''} onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })} placeholder="(555) 123-4567" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service Interest</Label>
                  <Input value={editingLead.serviceInterest} onChange={(e) => setEditingLead({ ...editingLead, serviceInterest: e.target.value })} placeholder="Law Firm Website" />
                </div>
                <div className="space-y-2">
                  <Label>Budget</Label>
                  <Input value={editingLead.budget || ''} onChange={(e) => setEditingLead({ ...editingLead, budget: e.target.value })} placeholder="$5,000 - $10,000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editingLead.status} onValueChange={(v: AgencyPipelineLead['status']) => setEditingLead({ ...editingLead, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Input value={editingLead.source || ''} onChange={(e) => setEditingLead({ ...editingLead, source: e.target.value })} placeholder="e.g., Referral, Google, Cold" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={editingLead.notes || ''} onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogType(null); setEditingLead(null) }}>Cancel</Button>
            <Button onClick={saveLead}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
