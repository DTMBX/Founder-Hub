import { useState, useMemo } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import type {
  AgencyFrameworkData,
  AgencyClientProject,
  AgencyPipelineLead,
  AgencyProjectStatus,
  AgencyInvoice,
  AgencyProposal,
  AgencyTimeEntry,
  AgencyConfig,
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
  Plus, Pencil, Trash, Kanban, Funnel, CurrencyDollar,
  Timer, FileText, GearSix, Clock, CheckCircle, WarningCircle,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

/* ── constants ─────────────────────────────────────────── */

const DEFAULT_CONFIG: AgencyConfig = {
  agencyName: '',
  defaultHourlyRate: 15000,
  currency: 'USD',
  invoicePrefix: 'INV-',
  proposalPrefix: 'PROP-',
  taxRate: 0,
  paymentTerms: 'Net 30',
  bankDetails: '',
  notificationEmail: '',
}

const DEFAULT_DATA: AgencyFrameworkData = {
  config: { ...DEFAULT_CONFIG },
  projects: [],
  pipeline: [],
  invoices: [],
  proposals: [],
  timeEntries: [],
  brandingRemoved: true,
}

const PROJECT_STATUSES: { value: AgencyProjectStatus; label: string; color: string }[] = [
  { value: 'discovery', label: 'Discovery', color: 'bg-violet-500/30 text-violet-300' },
  { value: 'design', label: 'Design', color: 'bg-sky-500/30 text-sky-300' },
  { value: 'development', label: 'Development', color: 'bg-amber-500/30 text-amber-300' },
  { value: 'review', label: 'Review', color: 'bg-orange-500/30 text-orange-300' },
  { value: 'launched', label: 'Launched', color: 'bg-emerald-500/30 text-emerald-300' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-slate-500/30 text-slate-300' },
]

const TEMPLATE_TYPES = [
  { value: 'law-firm', label: 'Law Firm' },
  { value: 'small-business', label: 'Small Business' },
  { value: 'custom', label: 'Custom' },
  { value: 'landing-page', label: 'Landing Page' },
]

const LEAD_STATUSES = [
  { value: 'new', label: 'New', color: 'bg-blue-500/30 text-blue-300' },
  { value: 'contacted', label: 'Contacted', color: 'bg-cyan-500/30 text-cyan-300' },
  { value: 'proposal', label: 'Proposal', color: 'bg-violet-500/30 text-violet-300' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-amber-500/30 text-amber-300' },
  { value: 'won', label: 'Won', color: 'bg-emerald-500/30 text-emerald-300' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500/30 text-red-300' },
]

const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-500/30 text-slate-300' },
  { value: 'sent', label: 'Sent', color: 'bg-blue-500/30 text-blue-300' },
  { value: 'paid', label: 'Paid', color: 'bg-emerald-500/30 text-emerald-300' },
  { value: 'overdue', label: 'Overdue', color: 'bg-red-500/30 text-red-300' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-zinc-500/30 text-zinc-300' },
]

const PROPOSAL_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-500/30 text-slate-300' },
  { value: 'sent', label: 'Sent', color: 'bg-blue-500/30 text-blue-300' },
  { value: 'accepted', label: 'Accepted', color: 'bg-emerald-500/30 text-emerald-300' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500/30 text-red-300' },
  { value: 'expired', label: 'Expired', color: 'bg-zinc-500/30 text-zinc-300' },
]

const TIME_CATEGORIES = [
  'discovery', 'design', 'development', 'review', 'meeting', 'admin',
] as const

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-slate-500/30 text-slate-300' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-500/30 text-blue-300' },
  { value: 'high', label: 'High', color: 'bg-amber-500/30 text-amber-300' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500/30 text-red-300' },
]

/* ── helpers ───────────────────────────────────────────── */

const fmt = (cents: number, cur = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(cents / 100)

const uid = () => crypto.randomUUID()
const today = () => new Date().toISOString().slice(0, 10)

function statusBadge(statuses: { value: string; label: string; color: string }[], val: string) {
  const s = statuses.find(x => x.value === val)
  return s ? <Badge className={s.color}>{s.label}</Badge> : <Badge>{val}</Badge>
}

/* ── component ─────────────────────────────────────────── */

interface AgencyFrameworkManagerProps {
  siteId?: string
}

export default function AgencyFrameworkManager({ siteId }: AgencyFrameworkManagerProps) {
  const kvKey = siteId ? `sites:${siteId}:data` : 'agency-framework'
  const [data, setData] = useKV<AgencyFrameworkData>(kvKey, DEFAULT_DATA)
  const d = data ?? DEFAULT_DATA

  const [tab, setTab] = useState('projects')

  /* dialogs */
  const [editProject, setEditProject] = useState<AgencyClientProject | null>(null)
  const [editLead, setEditLead] = useState<AgencyPipelineLead | null>(null)
  const [editInvoice, setEditInvoice] = useState<AgencyInvoice | null>(null)
  const [editProposal, setEditProposal] = useState<AgencyProposal | null>(null)
  const [editTime, setEditTime] = useState<AgencyTimeEntry | null>(null)

  /* generic helpers */
  function save<T extends { id: string }>(key: keyof AgencyFrameworkData, item: T) {
    setData(prev => {
      const p = prev ?? DEFAULT_DATA
      const arr = (p[key] as unknown as T[]) ?? []
      const idx = arr.findIndex(x => x.id === item.id)
      const next = idx >= 0 ? arr.map((x, i) => (i === idx ? item : x)) : [...arr, item]
      return { ...p, [key]: next }
    })
    toast.success('Saved')
  }

  function del(key: keyof AgencyFrameworkData, id: string) {
    setData(prev => {
      const p = prev ?? DEFAULT_DATA
      return { ...p, [key]: ((p[key] as unknown as { id: string }[]) ?? []).filter(x => x.id !== id) }
    })
    toast.success('Deleted')
  }

  function upCfg(patch: Partial<AgencyConfig>) {
    setData(prev => {
      const p = prev ?? DEFAULT_DATA
      return { ...p, config: { ...p.config, ...patch } }
    })
    toast.success('Settings saved')
  }

  /* KPIs */
  const kpi = useMemo(() => {
    const activeProjects = d.projects.filter(p => !['launched', 'maintenance'].includes(p.status)).length
    const revenue = (d.invoices ?? []).filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
    const outstanding = (d.invoices ?? []).filter(i => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + i.amount, 0)
    const pipelineValue = (d.proposals ?? []).filter(p => ['sent', 'accepted'].includes(p.status)).reduce((s, p) => s + p.investment, 0)
    const hoursThisMonth = (d.timeEntries ?? []).filter(t => t.date >= new Date().toISOString().slice(0, 7)).reduce((s, t) => s + t.hours, 0)
    const openLeads = d.pipeline.filter(l => !['won', 'lost'].includes(l.status)).length
    return { activeProjects, revenue, outstanding, pipelineValue, hoursThisMonth, openLeads }
  }, [d])

  /* close helpers */
  const close = () => { setEditProject(null); setEditLead(null); setEditInvoice(null); setEditProposal(null); setEditTime(null) }

  return (
    <div className="space-y-6">
      {/* KPI bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <GlassCard className="p-3 text-center"><div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Kanban size={14} />Active</div><div className="text-lg font-semibold">{kpi.activeProjects}</div></GlassCard>
        <GlassCard className="p-3 text-center"><div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><CheckCircle size={14} className="text-emerald-400" />Revenue</div><div className="text-lg font-semibold text-emerald-400">{fmt(kpi.revenue, d.config.currency)}</div></GlassCard>
        <GlassCard className="p-3 text-center"><div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><WarningCircle size={14} className="text-amber-400" />Outstanding</div><div className="text-lg font-semibold text-amber-400">{fmt(kpi.outstanding, d.config.currency)}</div></GlassCard>
        <GlassCard className="p-3 text-center"><div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><CurrencyDollar size={14} />Pipeline</div><div className="text-lg font-semibold">{fmt(kpi.pipelineValue, d.config.currency)}</div></GlassCard>
        <GlassCard className="p-3 text-center"><div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Clock size={14} />Hours (Mo)</div><div className="text-lg font-semibold">{kpi.hoursThisMonth.toFixed(1)}</div></GlassCard>
        <GlassCard className="p-3 text-center"><div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Funnel size={14} />Open Leads</div><div className="text-lg font-semibold">{kpi.openLeads}</div></GlassCard>
      </div>

      {/* tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="projects" className="gap-1"><Kanban size={14} /> Projects</TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-1"><Funnel size={14} /> Pipeline</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1"><CurrencyDollar size={14} /> Invoices</TabsTrigger>
          <TabsTrigger value="proposals" className="gap-1"><FileText size={14} /> Proposals</TabsTrigger>
          <TabsTrigger value="time" className="gap-1"><Timer size={14} /> Time Log</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1"><GearSix size={14} /> Settings</TabsTrigger>
        </TabsList>

        {/* ═══ PROJECTS ══════════════════════════════ */}
        <TabsContent value="projects" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Kanban size={20} /> Client Projects</h3>
            <Button size="sm" onClick={() => setEditProject({ id: uid(), clientName: '', projectName: '', templateType: 'custom', status: 'discovery', startDate: today(), budget: 0, hoursEstimated: 0, hoursUsed: 0, deliverables: [], priority: 'normal' })}><Plus size={14} className="mr-1" /> Add Project</Button>
          </div>

          {d.projects.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">No projects yet. Add your first client project above.</CardContent></Card>}

          {PROJECT_STATUSES.map(st => {
            const items = d.projects.filter(p => p.status === st.value)
            if (items.length === 0) return null
            return (
              <div key={st.value} className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Badge className={st.color}>{st.label}</Badge><span className="text-muted-foreground/50">({items.length})</span></h4>
                {items.map(p => (
                  <Card key={p.id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.projectName || p.clientName}</p>
                        <p className="text-xs text-muted-foreground flex gap-3 mt-0.5 flex-wrap">
                          <span>{p.clientName}</span>
                          <span>{TEMPLATE_TYPES.find(t => t.value === p.templateType)?.label}</span>
                          {p.priority && p.priority !== 'normal' && statusBadge(PRIORITIES, p.priority)}
                          <span>{fmt(p.budget, d.config.currency)}</span>
                          <span>{p.hoursUsed}/{p.hoursEstimated}h</span>
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => setEditProject({ ...p })}><Pencil size={14} /></Button>
                        <Button size="icon" variant="ghost" onClick={() => del('projects', p.id)}><Trash size={14} /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          })}
        </TabsContent>

        {/* ═══ PIPELINE ══════════════════════════════ */}
        <TabsContent value="pipeline" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Funnel size={20} /> Sales Pipeline</h3>
            <Button size="sm" onClick={() => setEditLead({ id: uid(), contactName: '', email: '', serviceInterest: '', status: 'new', createdAt: new Date().toISOString() })}><Plus size={14} className="mr-1" /> Add Lead</Button>
          </div>

          {d.pipeline.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">No leads yet.</CardContent></Card>}

          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {d.pipeline.map(l => (
                <Card key={l.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{l.contactName}{l.company ? ` — ${l.company}` : ''}</p>
                      <p className="text-xs text-muted-foreground flex gap-3 mt-0.5 flex-wrap">
                        {statusBadge(LEAD_STATUSES, l.status)}
                        <span>{l.serviceInterest}</span>
                        {l.budget && <span>{l.budget}</span>}
                        {l.followUpDate && <span className="flex items-center gap-0.5"><Clock size={12} /> {l.followUpDate}</span>}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => setEditLead({ ...l })}><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => del('pipeline', l.id)}><Trash size={14} /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ═══ INVOICES ══════════════════════════════ */}
        <TabsContent value="invoices" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2"><CurrencyDollar size={20} /> Invoices</h3>
            <Button size="sm" onClick={() => {
              const nextNum = `${d.config.invoicePrefix}${String((d.invoices ?? []).length + 1).padStart(4, '0')}`
              setEditInvoice({ id: uid(), projectId: '', clientName: '', invoiceNumber: nextNum, amount: 0, status: 'draft', issuedDate: today(), dueDate: today(), lineItems: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }] })
            }}><Plus size={14} className="mr-1" /> New Invoice</Button>
          </div>

          {(d.invoices ?? []).length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">No invoices yet.</CardContent></Card>}

          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {(d.invoices ?? []).map(inv => (
                <Card key={inv.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{inv.invoiceNumber} — {inv.clientName}</p>
                      <p className="text-xs text-muted-foreground flex gap-3 mt-0.5 flex-wrap">
                        {statusBadge(INVOICE_STATUSES, inv.status)}
                        <span>{fmt(inv.amount, d.config.currency)}</span>
                        <span>Due {inv.dueDate}</span>
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => setEditInvoice({ ...inv, lineItems: inv.lineItems.map(li => ({ ...li })) })}><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => del('invoices', inv.id)}><Trash size={14} /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ═══ PROPOSALS ═════════════════════════════ */}
        <TabsContent value="proposals" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2"><FileText size={20} /> Proposals</h3>
            <Button size="sm" onClick={() => setEditProposal({ id: uid(), title: '', clientName: '', scope: '', deliverables: [], timeline: '', investment: 0, status: 'draft', createdAt: new Date().toISOString() })}><Plus size={14} className="mr-1" /> New Proposal</Button>
          </div>

          {(d.proposals ?? []).length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">No proposals yet.</CardContent></Card>}

          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {(d.proposals ?? []).map(pr => (
                <Card key={pr.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{pr.title || 'Untitled Proposal'}</p>
                      <p className="text-xs text-muted-foreground flex gap-3 mt-0.5 flex-wrap">
                        {statusBadge(PROPOSAL_STATUSES, pr.status)}
                        <span>{pr.clientName}</span>
                        <span>{fmt(pr.investment, d.config.currency)}</span>
                        {pr.validUntil && <span>Valid until {pr.validUntil}</span>}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => setEditProposal({ ...pr, deliverables: [...pr.deliverables] })}><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => del('proposals', pr.id)}><Trash size={14} /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ═══ TIME TRACKING ═════════════════════════ */}
        <TabsContent value="time" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Timer size={20} /> Time Tracking</h3>
            <Button size="sm" onClick={() => setEditTime({ id: uid(), projectId: '', description: '', hours: 0, date: today(), category: 'development', billable: true })}><Plus size={14} className="mr-1" /> Log Time</Button>
          </div>

          {/* summary by project */}
          <TimeSummary entries={d.timeEntries ?? []} projects={d.projects} />

          {(d.timeEntries ?? []).length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">No time entries yet.</CardContent></Card>}

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {[...(d.timeEntries ?? [])].sort((a, b) => b.date.localeCompare(a.date)).map(t => {
                const proj = d.projects.find(p => p.id === t.projectId)
                return (
                  <Card key={t.id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{t.description || 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground flex gap-3 mt-0.5 flex-wrap">
                          <span>{t.date}</span>
                          <span>{t.hours}h</span>
                          <Badge variant="outline">{t.category}</Badge>
                          {t.billable && <Badge className="bg-emerald-500/20 text-emerald-300">Billable</Badge>}
                          {proj && <span>{proj.projectName || proj.clientName}</span>}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => setEditTime({ ...t })}><Pencil size={14} /></Button>
                        <Button size="icon" variant="ghost" onClick={() => del('timeEntries', t.id)}><Trash size={14} /></Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ═══ SETTINGS ══════════════════════════════ */}
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><GearSix size={20} /> Agency Settings</CardTitle><CardDescription>Configure defaults for invoicing, proposals, and branding</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Agency Name (blank = white-label)</Label><Input value={d.config.agencyName ?? ''} onChange={e => upCfg({ agencyName: e.target.value })} /></div>
                <div className="space-y-2"><Label>Notification Email</Label><Input type="email" value={d.config.notificationEmail ?? ''} onChange={e => upCfg({ notificationEmail: e.target.value })} /></div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Default Hourly Rate (cents)</Label><Input type="number" value={d.config.defaultHourlyRate} onChange={e => upCfg({ defaultHourlyRate: Number(e.target.value) })} /></div>
                <div className="space-y-2"><Label>Currency</Label><Input value={d.config.currency} onChange={e => upCfg({ currency: e.target.value })} /></div>
                <div className="space-y-2"><Label>Tax Rate (%)</Label><Input type="number" value={d.config.taxRate ?? 0} onChange={e => upCfg({ taxRate: Number(e.target.value) })} /></div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Payment Terms</Label><Input value={d.config.paymentTerms} onChange={e => upCfg({ paymentTerms: e.target.value })} /></div>
                <div className="space-y-2"><Label>Invoice Prefix</Label><Input value={d.config.invoicePrefix} onChange={e => upCfg({ invoicePrefix: e.target.value })} /></div>
                <div className="space-y-2"><Label>Proposal Prefix</Label><Input value={d.config.proposalPrefix} onChange={e => upCfg({ proposalPrefix: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Bank / Payment Details</Label><Textarea value={d.config.bankDetails ?? ''} onChange={e => upCfg({ bankDetails: e.target.value })} rows={3} /></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ DIALOGS ════════════════════════════════ */}

      {/* Project Dialog */}
      <Dialog open={editProject !== null} onOpenChange={() => setEditProject(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editProject?.clientName ? 'Edit Project' : 'New Project'}</DialogTitle></DialogHeader>
          {editProject && <ProjectForm value={editProject} onChange={setEditProject} currency={d.config.currency} />}
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={() => { if (!editProject || !editProject.clientName.trim()) { toast.error('Client name required'); return }; save('projects', editProject); close() }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Dialog */}
      <Dialog open={editLead !== null} onOpenChange={() => setEditLead(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editLead?.contactName ? 'Edit Lead' : 'New Lead'}</DialogTitle></DialogHeader>
          {editLead && <LeadForm value={editLead} onChange={setEditLead} />}
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={() => { if (!editLead || !editLead.contactName.trim() || !editLead.email.trim()) { toast.error('Name and email required'); return }; save('pipeline', editLead); close() }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={editInvoice !== null} onOpenChange={() => setEditInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editInvoice?.clientName ? 'Edit Invoice' : 'New Invoice'}</DialogTitle></DialogHeader>
          {editInvoice && <InvoiceForm value={editInvoice} onChange={setEditInvoice} projects={d.projects} config={d.config} />}
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={() => { if (!editInvoice || !editInvoice.clientName.trim()) { toast.error('Client name required'); return }; save('invoices', editInvoice); close() }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proposal Dialog */}
      <Dialog open={editProposal !== null} onOpenChange={() => setEditProposal(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editProposal?.title ? 'Edit Proposal' : 'New Proposal'}</DialogTitle></DialogHeader>
          {editProposal && <ProposalForm value={editProposal} onChange={setEditProposal} leads={d.pipeline} projects={d.projects} config={d.config} />}
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={() => { if (!editProposal || !editProposal.title.trim() || !editProposal.clientName.trim()) { toast.error('Title and client required'); return }; save('proposals', editProposal); close() }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time Entry Dialog */}
      <Dialog open={editTime !== null} onOpenChange={() => setEditTime(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editTime?.description ? 'Edit Time Entry' : 'Log Time'}</DialogTitle></DialogHeader>
          {editTime && <TimeForm value={editTime} onChange={setEditTime} projects={d.projects} />}
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={() => { if (!editTime || !editTime.projectId || editTime.hours <= 0) { toast.error('Project and hours required'); return }; save('timeEntries', editTime); close() }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   FORM COMPONENTS
   ═══════════════════════════════════════════════════════ */

function TimeSummary({ entries, projects }: { entries: AgencyTimeEntry[]; projects: AgencyClientProject[] }) {
  const byProject = useMemo(() => {
    const map = new Map<string, { total: number; billable: number }>()
    for (const t of entries) {
      const cur = map.get(t.projectId) ?? { total: 0, billable: 0 }
      cur.total += t.hours
      if (t.billable) cur.billable += t.hours
      map.set(t.projectId, cur)
    }
    return map
  }, [entries])

  if (byProject.size === 0) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {Array.from(byProject.entries()).map(([pid, hrs]) => {
        const proj = projects.find(p => p.id === pid)
        return (
          <Card key={pid}>
            <CardContent className="py-2 px-3">
              <p className="font-medium truncate text-sm">{proj?.projectName || proj?.clientName || pid.slice(0, 8)}</p>
              <p className="text-xs text-muted-foreground">{hrs.total.toFixed(1)}h total · {hrs.billable.toFixed(1)}h billable</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function ProjectForm({ value: f, onChange, currency }: { value: AgencyClientProject; onChange: (v: AgencyClientProject) => void; currency: string }) {
  const up = (patch: Partial<AgencyClientProject>) => onChange({ ...f, ...patch })
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Client Name *</Label><Input value={f.clientName} onChange={e => up({ clientName: e.target.value })} /></div>
        <div className="space-y-2"><Label>Project Name</Label><Input value={f.projectName ?? ''} onChange={e => up({ projectName: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Template Type</Label>
          <Select value={f.templateType} onValueChange={(v: string) => up({ templateType: v as AgencyClientProject['templateType'] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TEMPLATE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Status</Label>
          <Select value={f.status} onValueChange={(v: string) => up({ status: v as AgencyProjectStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PROJECT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Priority</Label>
          <Select value={f.priority ?? 'normal'} onValueChange={(v: string) => up({ priority: v as AgencyClientProject['priority'] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Domain</Label><Input value={f.domain ?? ''} onChange={e => up({ domain: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Contact Email</Label><Input type="email" value={f.contactEmail ?? ''} onChange={e => up({ contactEmail: e.target.value })} /></div>
        <div className="space-y-2"><Label>Contact Phone</Label><Input value={f.contactPhone ?? ''} onChange={e => up({ contactPhone: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Budget (cents)</Label><Input type="number" value={f.budget} onChange={e => up({ budget: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>Hours Estimated</Label><Input type="number" value={f.hoursEstimated} onChange={e => up({ hoursEstimated: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>Hours Used</Label><Input type="number" value={f.hoursUsed} onChange={e => up({ hoursUsed: Number(e.target.value) })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={f.startDate} onChange={e => up({ startDate: e.target.value })} /></div>
        <div className="space-y-2"><Label>Launch Date</Label><Input type="date" value={f.launchDate ?? ''} onChange={e => up({ launchDate: e.target.value })} /></div>
      </div>
      <div className="space-y-2"><Label>Repo URL</Label><Input value={f.repoUrl ?? ''} onChange={e => up({ repoUrl: e.target.value })} /></div>
      <div className="space-y-2"><Label>Deliverables (comma-separated)</Label><Input value={f.deliverables.join(', ')} onChange={e => up({ deliverables: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></div>
      <div className="space-y-2"><Label>Notes</Label><Textarea value={f.notes ?? ''} onChange={e => up({ notes: e.target.value })} rows={3} /></div>
    </div>
  )
}

function LeadForm({ value: f, onChange }: { value: AgencyPipelineLead; onChange: (v: AgencyPipelineLead) => void }) {
  const up = (patch: Partial<AgencyPipelineLead>) => onChange({ ...f, ...patch })
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Contact Name *</Label><Input value={f.contactName} onChange={e => up({ contactName: e.target.value })} /></div>
        <div className="space-y-2"><Label>Company</Label><Input value={f.company ?? ''} onChange={e => up({ company: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Email *</Label><Input type="email" value={f.email} onChange={e => up({ email: e.target.value })} /></div>
        <div className="space-y-2"><Label>Phone</Label><Input value={f.phone ?? ''} onChange={e => up({ phone: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Status</Label>
          <Select value={f.status} onValueChange={(v: string) => up({ status: v as AgencyPipelineLead['status'] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LEAD_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Source</Label><Input value={f.source ?? ''} onChange={e => up({ source: e.target.value })} placeholder="referral, ads, organic" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Service Interest</Label><Input value={f.serviceInterest} onChange={e => up({ serviceInterest: e.target.value })} /></div>
        <div className="space-y-2"><Label>Follow-Up Date</Label><Input type="date" value={f.followUpDate ?? ''} onChange={e => up({ followUpDate: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Budget</Label><Input value={f.budget ?? ''} onChange={e => up({ budget: e.target.value })} /></div>
        <div className="space-y-2"><Label>Timeline</Label><Input value={f.timeline ?? ''} onChange={e => up({ timeline: e.target.value })} /></div>
      </div>
      <div className="space-y-2"><Label>Notes</Label><Textarea value={f.notes ?? ''} onChange={e => up({ notes: e.target.value })} rows={3} /></div>
    </div>
  )
}

function InvoiceForm({ value: f, onChange, projects, config }: { value: AgencyInvoice; onChange: (v: AgencyInvoice) => void; projects: AgencyClientProject[]; config: AgencyConfig }) {
  const up = (patch: Partial<AgencyInvoice>) => onChange({ ...f, ...patch })

  const recalcTotal = (items: AgencyInvoice['lineItems']) =>
    items.reduce((s, li) => s + li.total, 0)

  const updateLine = (idx: number, patch: Partial<AgencyInvoice['lineItems'][0]>) => {
    const next = f.lineItems.map((li, i) => {
      if (i !== idx) return li
      const merged = { ...li, ...patch }
      merged.total = merged.quantity * merged.unitPrice
      return merged
    })
    up({ lineItems: next, amount: recalcTotal(next) })
  }

  const addLine = () => up({ lineItems: [...f.lineItems, { description: '', quantity: 1, unitPrice: 0, total: 0 }] })
  const removeLine = (idx: number) => { const next = f.lineItems.filter((_, i) => i !== idx); up({ lineItems: next, amount: recalcTotal(next) }) }

  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Invoice #</Label><Input value={f.invoiceNumber} onChange={e => up({ invoiceNumber: e.target.value })} /></div>
        <div className="space-y-2"><Label>Client Name *</Label><Input value={f.clientName} onChange={e => up({ clientName: e.target.value })} /></div>
        <div className="space-y-2"><Label>Status</Label>
          <Select value={f.status} onValueChange={(v: string) => up({ status: v as AgencyInvoice['status'] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{INVOICE_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Project</Label>
          <Select value={f.projectId || '__none__'} onValueChange={v => up({ projectId: v === '__none__' ? '' : v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="__none__">— None —</SelectItem>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.projectName || p.clientName}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Payment Method</Label><Input value={f.paymentMethod ?? ''} onChange={e => up({ paymentMethod: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Issued Date</Label><Input type="date" value={f.issuedDate} onChange={e => up({ issuedDate: e.target.value })} /></div>
        <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={f.dueDate} onChange={e => up({ dueDate: e.target.value })} /></div>
        <div className="space-y-2"><Label>Paid Date</Label><Input type="date" value={f.paidDate ?? ''} onChange={e => up({ paidDate: e.target.value })} /></div>
      </div>

      {/* line items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between"><Label className="font-semibold">Line Items</Label><Button size="sm" variant="outline" onClick={addLine}><Plus size={12} className="mr-1" /> Add Line</Button></div>
        {f.lineItems.map((li, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_60px_90px_90px_32px] gap-2 items-end">
            <div>{idx === 0 && <Label className="text-xs text-muted-foreground">Description</Label>}<Input value={li.description} onChange={e => updateLine(idx, { description: e.target.value })} /></div>
            <div>{idx === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}<Input type="number" value={li.quantity} onChange={e => updateLine(idx, { quantity: Number(e.target.value) })} /></div>
            <div>{idx === 0 && <Label className="text-xs text-muted-foreground">Unit ¢</Label>}<Input type="number" value={li.unitPrice} onChange={e => updateLine(idx, { unitPrice: Number(e.target.value) })} /></div>
            <div className="text-right text-sm py-2">{idx === 0 && <Label className="text-xs text-muted-foreground block">Total</Label>}{fmt(li.total, config.currency)}</div>
            <Button size="icon" variant="ghost" onClick={() => removeLine(idx)}><Trash size={12} /></Button>
          </div>
        ))}
        <div className="text-right text-sm font-semibold border-t pt-2">
          Total: {fmt(f.amount, config.currency)}
          {config.taxRate ? ` + ${config.taxRate}% = ${fmt(Math.round(f.amount * (1 + (config.taxRate ?? 0) / 100)), config.currency)}` : ''}
        </div>
      </div>

      <div className="space-y-2"><Label>Notes</Label><Textarea value={f.notes ?? ''} onChange={e => up({ notes: e.target.value })} rows={3} /></div>
    </div>
  )
}

function ProposalForm({ value: f, onChange, leads, projects, config }: { value: AgencyProposal; onChange: (v: AgencyProposal) => void; leads: AgencyPipelineLead[]; projects: AgencyClientProject[]; config: AgencyConfig }) {
  const up = (patch: Partial<AgencyProposal>) => onChange({ ...f, ...patch })
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2"><Label>Title *</Label><Input value={f.title} onChange={e => up({ title: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Client Name *</Label><Input value={f.clientName} onChange={e => up({ clientName: e.target.value })} /></div>
        <div className="space-y-2"><Label>Status</Label>
          <Select value={f.status} onValueChange={(v: string) => up({ status: v as AgencyProposal['status'] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PROPOSAL_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Linked Lead</Label>
          <Select value={f.leadId ?? '__none__'} onValueChange={v => up({ leadId: v === '__none__' ? undefined : v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="__none__">— None —</SelectItem>{leads.map(l => <SelectItem key={l.id} value={l.id}>{l.contactName}{l.company ? ` (${l.company})` : ''}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Linked Project</Label>
          <Select value={f.projectId ?? '__none__'} onValueChange={v => up({ projectId: v === '__none__' ? undefined : v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="__none__">— None —</SelectItem>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.projectName || p.clientName}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Investment (cents)</Label><Input type="number" value={f.investment} onChange={e => up({ investment: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>Timeline</Label><Input value={f.timeline} onChange={e => up({ timeline: e.target.value })} /></div>
        <div className="space-y-2"><Label>Valid Until</Label><Input type="date" value={f.validUntil ?? ''} onChange={e => up({ validUntil: e.target.value })} /></div>
      </div>
      <div className="space-y-2"><Label>Scope (Markdown)</Label><Textarea value={f.scope} onChange={e => up({ scope: e.target.value })} rows={6} className="font-mono text-xs" /></div>
      <div className="space-y-2"><Label>Deliverables (comma-separated)</Label><Input value={f.deliverables.join(', ')} onChange={e => up({ deliverables: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></div>
      <div className="space-y-2"><Label>Notes</Label><Textarea value={f.notes ?? ''} onChange={e => up({ notes: e.target.value })} rows={3} /></div>
    </div>
  )
}

function TimeForm({ value: f, onChange, projects }: { value: AgencyTimeEntry; onChange: (v: AgencyTimeEntry) => void; projects: AgencyClientProject[] }) {
  const up = (patch: Partial<AgencyTimeEntry>) => onChange({ ...f, ...patch })
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2"><Label>Project *</Label>
        <Select value={f.projectId || '__none__'} onValueChange={v => up({ projectId: v === '__none__' ? '' : v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="__none__">— Select —</SelectItem>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.projectName || p.clientName}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2"><Label>Description</Label><Input value={f.description} onChange={e => up({ description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Hours *</Label><Input type="number" step="0.25" value={f.hours} onChange={e => up({ hours: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>Date</Label><Input type="date" value={f.date} onChange={e => up({ date: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Category</Label>
          <Select value={f.category} onValueChange={(v: string) => up({ category: v as AgencyTimeEntry['category'] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TIME_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-6"><Switch checked={f.billable} onCheckedChange={c => up({ billable: c })} /><Label>Billable</Label></div>
      </div>
    </div>
  )
}
