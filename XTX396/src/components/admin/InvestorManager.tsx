import { useState } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import { 
  InvestorData, 
  InvestorMetric, 
  InvestorMilestone, 
  InvestorDocument,
  InvestorFAQ,
  InvestmentTier 
} from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Pencil, 
  Trash, 
  ChartLine,
  Rocket,
  Files,
  Question,
  Handshake,
  Calendar,
  Play,
  TrendUp,
  TrendDown,
  Minus
} from '@phosphor-icons/react'
import { toast } from 'sonner'

const INVESTOR_KEY = 'founder-hub-investor'

const defaultData: InvestorData = {
  metrics: [],
  milestones: [],
  documents: [],
  faqs: [],
  investmentTiers: []
}

export default function InvestorManager() {
  const [data, setData] = useKV<InvestorData>(INVESTOR_KEY, defaultData)
  const [activeTab, setActiveTab] = useState('metrics')
  
  // Dialog states
  const [editingMetric, setEditingMetric] = useState<InvestorMetric | null>(null)
  const [editingMilestone, setEditingMilestone] = useState<InvestorMilestone | null>(null)
  const [editingDocument, setEditingDocument] = useState<InvestorDocument | null>(null)
  const [editingFaq, setEditingFaq] = useState<InvestorFAQ | null>(null)
  const [editingTier, setEditingTier] = useState<InvestmentTier | null>(null)

  const saveAndSync = async (newData: InvestorData) => {
    setData(newData)
    toast.success('Changes saved')
  }

  // ─── Metrics CRUD ─────────────────────────────────────────

  const handleSaveMetric = async (metric: InvestorMetric) => {
    const metrics = data?.metrics || []
    const existing = metrics.findIndex(m => m.id === metric.id)
    
    let updated: InvestorMetric[]
    if (existing >= 0) {
      updated = metrics.map(m => m.id === metric.id ? metric : m)
    } else {
      updated = [...metrics, { ...metric, order: metrics.length }]
    }
    
    await saveAndSync({ ...data, metrics: updated })
    setEditingMetric(null)
  }

  const handleDeleteMetric = async (id: string) => {
    const updated = (data?.metrics || []).filter(m => m.id !== id)
    await saveAndSync({ ...data, metrics: updated })
  }

  // ─── Milestones CRUD ──────────────────────────────────────

  const handleSaveMilestone = async (milestone: InvestorMilestone) => {
    const milestones = data?.milestones || []
    const existing = milestones.findIndex(m => m.id === milestone.id)
    
    let updated: InvestorMilestone[]
    if (existing >= 0) {
      updated = milestones.map(m => m.id === milestone.id ? milestone : m)
    } else {
      updated = [...milestones, { ...milestone, order: milestones.length }]
    }
    
    await saveAndSync({ ...data, milestones: updated })
    setEditingMilestone(null)
  }

  const handleDeleteMilestone = async (id: string) => {
    const updated = (data?.milestones || []).filter(m => m.id !== id)
    await saveAndSync({ ...data, milestones: updated })
  }

  // ─── Documents CRUD ───────────────────────────────────────

  const handleSaveDocument = async (doc: InvestorDocument) => {
    const documents = data?.documents || []
    const existing = documents.findIndex(d => d.id === doc.id)
    
    let updated: InvestorDocument[]
    if (existing >= 0) {
      updated = documents.map(d => d.id === doc.id ? doc : d)
    } else {
      updated = [...documents, { ...doc, order: documents.length }]
    }
    
    await saveAndSync({ ...data, documents: updated })
    setEditingDocument(null)
  }

  const handleDeleteDocument = async (id: string) => {
    const updated = (data?.documents || []).filter(d => d.id !== id)
    await saveAndSync({ ...data, documents: updated })
  }

  // ─── FAQ CRUD ─────────────────────────────────────────────

  const handleSaveFaq = async (faq: InvestorFAQ) => {
    const faqs = data?.faqs || []
    const existing = faqs.findIndex(f => f.id === faq.id)
    
    let updated: InvestorFAQ[]
    if (existing >= 0) {
      updated = faqs.map(f => f.id === faq.id ? faq : f)
    } else {
      updated = [...faqs, { ...faq, order: faqs.length }]
    }
    
    await saveAndSync({ ...data, faqs: updated })
    setEditingFaq(null)
  }

  const handleDeleteFaq = async (id: string) => {
    const updated = (data?.faqs || []).filter(f => f.id !== id)
    await saveAndSync({ ...data, faqs: updated })
  }

  // ─── Investment Tiers CRUD ────────────────────────────────

  const handleSaveTier = async (tier: InvestmentTier) => {
    const tiers = data?.investmentTiers || []
    const existing = tiers.findIndex(t => t.id === tier.id)
    
    let updated: InvestmentTier[]
    if (existing >= 0) {
      updated = tiers.map(t => t.id === tier.id ? tier : t)
    } else {
      updated = [...tiers, { ...tier, order: tiers.length }]
    }
    
    await saveAndSync({ ...data, investmentTiers: updated })
    setEditingTier(null)
  }

  const handleDeleteTier = async (id: string) => {
    const updated = (data?.investmentTiers || []).filter(t => t.id !== id)
    await saveAndSync({ ...data, investmentTiers: updated })
  }

  // ─── Settings Save ────────────────────────────────────────

  const handleSettingsChange = async (field: keyof InvestorData, value: any) => {
    await saveAndSync({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Investor Content</h2>
        <p className="text-muted-foreground">
          Manage investor-facing content. Sections appear automatically when content is added.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="metrics" className="gap-1">
            <ChartLine className="h-4 w-4" />
            <span className="hidden sm:inline">Metrics</span>
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="gap-1">
            <Rocket className="h-4 w-4" />
            <span className="hidden sm:inline">Roadmap</span>
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-1">
            <Files className="h-4 w-4" />
            <span className="hidden sm:inline">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="investment" className="gap-1">
            <Handshake className="h-4 w-4" />
            <span className="hidden sm:inline">Invest</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-1">
            <Question className="h-4 w-4" />
            <span className="hidden sm:inline">FAQ</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Key performance indicators displayed to investors
            </p>
            <Button onClick={() => setEditingMetric({ 
              id: `metric_${Date.now()}`, 
              label: '', 
              value: '', 
              order: (data?.metrics?.length || 0) 
            })}>
              <Plus className="h-4 w-4 mr-2" />
              Add Metric
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(data?.metrics || []).sort((a, b) => a.order - b.order).map(metric => (
              <Card key={metric.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-2xl font-bold">{metric.value}</p>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditingMetric(metric)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteMetric(metric.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {metric.trend && (
                    <Badge variant="outline" className="text-xs">
                      {metric.trend === 'up' && <TrendUp className="h-3 w-3 mr-1" />}
                      {metric.trend === 'down' && <TrendDown className="h-3 w-3 mr-1" />}
                      {metric.trend === 'neutral' && <Minus className="h-3 w-3 mr-1" />}
                      {metric.trendValue}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Timeline of milestones showing execution capability
            </p>
            <Button onClick={() => setEditingMilestone({ 
              id: `milestone_${Date.now()}`, 
              date: new Date().toISOString().split('T')[0],
              title: '', 
              status: 'upcoming',
              order: (data?.milestones?.length || 0) 
            })}>
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>

          <div className="space-y-2">
            {(data?.milestones || []).sort((a, b) => a.order - b.order).map(milestone => (
              <Card key={milestone.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant={
                      milestone.status === 'completed' ? 'default' :
                      milestone.status === 'in-progress' ? 'secondary' : 'outline'
                    }>
                      {milestone.status}
                    </Badge>
                    <div>
                      <p className="font-medium">{milestone.title}</p>
                      <p className="text-sm text-muted-foreground">{milestone.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditingMilestone(milestone)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteMilestone(milestone.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="docs" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Pitch deck, one-pager, and other investor documents
            </p>
            <Button onClick={() => setEditingDocument({ 
              id: `doc_${Date.now()}`, 
              title: '', 
              type: 'pitch-deck',
              url: '',
              updatedAt: Date.now(),
              order: (data?.documents?.length || 0) 
            })}>
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {(data?.documents || []).sort((a, b) => a.order - b.order).map(doc => (
              <Card key={doc.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                      {doc.fileSize && <span className="text-xs text-muted-foreground">{doc.fileSize}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditingDocument(doc)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteDocument(doc.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Investment Tab */}
        <TabsContent value="investment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fundraising Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Raising Amount (cents)</Label>
                  <Input
                    type="number"
                    value={data?.raisingAmount || 0}
                    onChange={(e) => handleSettingsChange('raisingAmount', parseInt(e.target.value) || 0)}
                    placeholder="e.g., 50000000 for $500k"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected ROI</Label>
                  <Input
                    value={data?.expectedROI || ''}
                    onChange={(e) => handleSettingsChange('expectedROI', e.target.value)}
                    placeholder="e.g., 3-5x in 3 years"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Use of Funds</Label>
                <Textarea
                  value={data?.useOfFunds || ''}
                  onChange={(e) => handleSettingsChange('useOfFunds', e.target.value)}
                  placeholder="Product development 40%, Marketing 30%, Operations 30%"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Investment tiers</p>
            <Button onClick={() => setEditingTier({ 
              id: `tier_${Date.now()}`, 
              name: '',
              minAmount: 0,
              perks: [],
              available: true,
              order: (data?.investmentTiers?.length || 0) 
            })}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tier
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.investmentTiers || []).sort((a, b) => a.order - b.order).map(tier => (
              <Card key={tier.id} className={!tier.available ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{tier.name}</p>
                      <p className="text-lg font-bold">
                        ${(tier.minAmount / 100).toLocaleString()}
                        {tier.maxAmount && ` - $${(tier.maxAmount / 100).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditingTier(tier)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteTier(tier.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {tier.equity && <Badge variant="outline" className="mb-2">{tier.equity} equity</Badge>}
                  {!tier.available && <Badge variant="secondary">Sold Out</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Common investor questions
            </p>
            <Button onClick={() => setEditingFaq({ 
              id: `faq_${Date.now()}`, 
              question: '', 
              answer: '',
              order: (data?.faqs?.length || 0) 
            })}>
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </div>

          <div className="space-y-2">
            {(data?.faqs || []).sort((a, b) => a.order - b.order).map(faq => (
              <Card key={faq.id}>
                <CardContent className="p-4 flex items-start justify-between">
                  <div>
                    <p className="font-medium">{faq.question}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => setEditingFaq(faq)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteFaq(faq.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Pitch Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Video URL (YouTube, Vimeo, or direct)</Label>
                <Input
                  value={data?.pitchVideoUrl || ''}
                  onChange={(e) => handleSettingsChange('pitchVideoUrl', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail URL (optional)</Label>
                <Input
                  value={data?.pitchVideoThumbnail || ''}
                  onChange={(e) => handleSettingsChange('pitchVideoThumbnail', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Meeting Scheduler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Calendly / Cal.com URL</Label>
                <Input
                  value={data?.calendlyUrl || ''}
                  onChange={(e) => handleSettingsChange('calendlyUrl', e.target.value)}
                  placeholder="https://calendly.com/yourname/investor-call"
                />
              </div>
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={data?.meetingCTA || ''}
                  onChange={(e) => handleSettingsChange('meetingCTA', e.target.value)}
                  placeholder="Schedule a Call"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Direct Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Investor Relations Email</Label>
                <Input
                  type="email"
                  value={data?.investorEmail || ''}
                  onChange={(e) => handleSettingsChange('investorEmail', e.target.value)}
                  placeholder="investors@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone (optional)</Label>
                <Input
                  type="tel"
                  value={data?.investorPhone || ''}
                  onChange={(e) => handleSettingsChange('investorPhone', e.target.value)}
                  placeholder="+1 555 123 4567"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Metric Dialog */}
      <Dialog open={!!editingMetric} onOpenChange={() => setEditingMetric(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMetric?.id.startsWith('metric_') && !data?.metrics?.find(m => m.id === editingMetric.id) ? 'Add' : 'Edit'} Metric</DialogTitle>
          </DialogHeader>
          {editingMetric && (
            <MetricForm 
              metric={editingMetric} 
              onSave={handleSaveMetric}
              onCancel={() => setEditingMetric(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Milestone Dialog */}
      <Dialog open={!!editingMilestone} onOpenChange={() => setEditingMilestone(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMilestone?.id.startsWith('milestone_') && !data?.milestones?.find(m => m.id === editingMilestone.id) ? 'Add' : 'Edit'} Milestone</DialogTitle>
          </DialogHeader>
          {editingMilestone && (
            <MilestoneForm 
              milestone={editingMilestone} 
              onSave={handleSaveMilestone}
              onCancel={() => setEditingMilestone(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Document Dialog */}
      <Dialog open={!!editingDocument} onOpenChange={() => setEditingDocument(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDocument?.id.startsWith('doc_') && !data?.documents?.find(d => d.id === editingDocument.id) ? 'Add' : 'Edit'} Document</DialogTitle>
          </DialogHeader>
          {editingDocument && (
            <DocumentForm 
              document={editingDocument} 
              onSave={handleSaveDocument}
              onCancel={() => setEditingDocument(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* FAQ Dialog */}
      <Dialog open={!!editingFaq} onOpenChange={() => setEditingFaq(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFaq?.id.startsWith('faq_') && !data?.faqs?.find(f => f.id === editingFaq.id) ? 'Add' : 'Edit'} FAQ</DialogTitle>
          </DialogHeader>
          {editingFaq && (
            <FAQForm 
              faq={editingFaq} 
              onSave={handleSaveFaq}
              onCancel={() => setEditingFaq(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Tier Dialog */}
      <Dialog open={!!editingTier} onOpenChange={() => setEditingTier(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTier?.id.startsWith('tier_') && !data?.investmentTiers?.find(t => t.id === editingTier.id) ? 'Add' : 'Edit'} Investment Tier</DialogTitle>
          </DialogHeader>
          {editingTier && (
            <TierForm 
              tier={editingTier} 
              onSave={handleSaveTier}
              onCancel={() => setEditingTier(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Form Components ────────────────────────────────────────

function MetricForm({ 
  metric, 
  onSave, 
  onCancel 
}: { 
  metric: InvestorMetric
  onSave: (m: InvestorMetric) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(metric)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Label</Label>
        <Input 
          value={form.label} 
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="e.g., Monthly Active Users"
        />
      </div>
      <div className="space-y-2">
        <Label>Value</Label>
        <Input 
          value={form.value} 
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          placeholder="e.g., 10,000+"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Trend</Label>
          <Select 
            value={form.trend || 'none'} 
            onValueChange={(v) => setForm({ ...form, trend: v === 'none' ? undefined : v as any })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="up">Up</SelectItem>
              <SelectItem value="down">Down</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Trend Value</Label>
          <Input 
            value={form.trendValue || ''} 
            onChange={(e) => setForm({ ...form, trendValue: e.target.value })}
            placeholder="+25% MoM"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)}>Save</Button>
      </DialogFooter>
    </div>
  )
}

function MilestoneForm({ 
  milestone, 
  onSave, 
  onCancel 
}: { 
  milestone: InvestorMilestone
  onSave: (m: InvestorMilestone) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(milestone)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input 
          value={form.title} 
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g., MVP Launch"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input 
            type="date"
            value={form.date} 
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select 
            value={form.status} 
            onValueChange={(v) => setForm({ ...form, status: v as any })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Textarea 
          value={form.description || ''} 
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of the milestone"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)}>Save</Button>
      </DialogFooter>
    </div>
  )
}

function DocumentForm({ 
  document, 
  onSave, 
  onCancel 
}: { 
  document: InvestorDocument
  onSave: (d: InvestorDocument) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(document)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input 
          value={form.title} 
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g., Q1 2026 Pitch Deck"
        />
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select 
          value={form.type} 
          onValueChange={(v) => setForm({ ...form, type: v as any })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pitch-deck">Pitch Deck</SelectItem>
            <SelectItem value="executive-summary">Executive Summary</SelectItem>
            <SelectItem value="financials">Financials</SelectItem>
            <SelectItem value="one-pager">One-Pager</SelectItem>
            <SelectItem value="media-kit">Media Kit</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>URL</Label>
        <Input 
          value={form.url} 
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          placeholder="https://drive.google.com/..."
        />
      </div>
      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Input 
          value={form.description || ''} 
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description"
        />
      </div>
      <div className="space-y-2">
        <Label>File Size (optional)</Label>
        <Input 
          value={form.fileSize || ''} 
          onChange={(e) => setForm({ ...form, fileSize: e.target.value })}
          placeholder="2.5 MB"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...form, updatedAt: Date.now() })}>Save</Button>
      </DialogFooter>
    </div>
  )
}

function FAQForm({ 
  faq, 
  onSave, 
  onCancel 
}: { 
  faq: InvestorFAQ
  onSave: (f: InvestorFAQ) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(faq)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Question</Label>
        <Input 
          value={form.question} 
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          placeholder="What is your competitive advantage?"
        />
      </div>
      <div className="space-y-2">
        <Label>Answer</Label>
        <Textarea 
          value={form.answer} 
          onChange={(e) => setForm({ ...form, answer: e.target.value })}
          placeholder="Detailed answer..."
          rows={4}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)}>Save</Button>
      </DialogFooter>
    </div>
  )
}

function TierForm({ 
  tier, 
  onSave, 
  onCancel 
}: { 
  tier: InvestmentTier
  onSave: (t: InvestmentTier) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(tier)
  const [newPerk, setNewPerk] = useState('')

  const addPerk = () => {
    if (newPerk.trim()) {
      setForm({ ...form, perks: [...form.perks, newPerk.trim()] })
      setNewPerk('')
    }
  }

  const removePerk = (idx: number) => {
    setForm({ ...form, perks: form.perks.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tier Name</Label>
        <Input 
          value={form.name} 
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g., Angel, Seed, Series A"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Min Amount (cents)</Label>
          <Input 
            type="number"
            value={form.minAmount} 
            onChange={(e) => setForm({ ...form, minAmount: parseInt(e.target.value) || 0 })}
            placeholder="2500000"
          />
        </div>
        <div className="space-y-2">
          <Label>Max Amount (optional)</Label>
          <Input 
            type="number"
            value={form.maxAmount || ''} 
            onChange={(e) => setForm({ ...form, maxAmount: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="10000000"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Equity %</Label>
        <Input 
          value={form.equity || ''} 
          onChange={(e) => setForm({ ...form, equity: e.target.value })}
          placeholder="e.g., 1-2%"
        />
      </div>
      <div className="space-y-2">
        <Label>Perks</Label>
        <div className="flex gap-2">
          <Input 
            value={newPerk} 
            onChange={(e) => setNewPerk(e.target.value)}
            placeholder="Add a perk"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPerk())}
          />
          <Button type="button" onClick={addPerk}>Add</Button>
        </div>
        {form.perks.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.perks.map((perk, idx) => (
              <Badge key={idx} variant="secondary" className="gap-1">
                {perk}
                <button onClick={() => removePerk(idx)} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Switch 
          checked={form.available} 
          onCheckedChange={(checked) => setForm({ ...form, available: checked })}
        />
        <Label>Available for investment</Label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)}>Save</Button>
      </DialogFooter>
    </div>
  )
}
