import { useState } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import { Case, CaseStatus, CaseVisibility, TimelineEvent } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, Pencil, Trash, X, FunnelSimple, ArrowsDownUp, Calendar, ClipboardText } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useAuth, logAudit } from '@/lib/auth'
import { 
  DEFAULT_REVIEW_NOTES_TEMPLATES, 
  DEFAULT_CONTINGENCY_CHECKLIST_TEMPLATES,
  applyReviewNotesTemplate,
  applyContingencyChecklistTemplate
} from '@/lib/templates'

export default function EnhancedCourtManager() {
  const [cases, setCases] = useKV<Case[]>('founder-hub-court-cases', [])
  const [editingCase, setEditingCase] = useState<Case | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCourt, setFilterCourt] = useState<string>('all')
  const [filterVisibility, setFilterVisibility] = useState<string>('all')
  const { currentUser } = useAuth()

  const handleAdd = () => {
    const now = Date.now()
    const newCase: Case = {
      id: `case_${now}`,
      title: '',
      docket: '',
      court: '',
      stage: '',
      dateRange: '',
      summary: '',
      description: '',
      tags: [],
      status: 'pending',
      order: (cases?.length || 0) + 1,
      visibility: 'private',
      featured: false,
      lastUpdated: now,
      createdAt: now
    }
    setEditingCase(newCase)
    setIsDialogOpen(true)
  }

  const handleEdit = (courtCase: Case) => {
    setEditingCase(courtCase)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingCase) return
    
    if (!editingCase.title.trim()) {
      toast.error('Case title is required')
      return
    }

    if (!editingCase.docket.trim()) {
      toast.error('Docket number is required')
      return
    }

    const updatedCase = { ...editingCase, lastUpdated: Date.now() }

    setCases(currentCases => {
      const existing = currentCases?.find(c => c.id === editingCase.id)
      if (existing) {
        return (currentCases || []).map(c => c.id === editingCase.id ? updatedCase : c)
      } else {
        return [...(currentCases || []), updatedCase]
      }
    })

    if (currentUser) {
      await logAudit(
        currentUser.id,
        currentUser.email,
        'update_case',
        `Updated case: ${updatedCase.title}`,
        'case',
        updatedCase.id
      )
    }

    toast.success('Case saved successfully')
    setIsDialogOpen(false)
    setEditingCase(null)
  }

  const handleDelete = async (caseId: string) => {
    setCases(currentCases => (currentCases || []).filter(c => c.id !== caseId))
    
    if (currentUser) {
      await logAudit(
        currentUser.id,
        currentUser.email,
        'delete_case',
        `Deleted case`,
        'case',
        caseId
      )
    }

    toast.success('Case deleted')
  }

  const handleAddTimelineEvent = () => {
    if (!editingCase) return
    const newEvent: TimelineEvent = {
      id: `event_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: '',
      description: '',
      order: (editingCase.timeline?.length || 0) + 1
    }
    setEditingCase({
      ...editingCase,
      timeline: [...(editingCase.timeline || []), newEvent]
    })
  }

  const handleUpdateTimelineEvent = (index: number, field: keyof TimelineEvent, value: string | number) => {
    if (!editingCase || !editingCase.timeline) return
    const updatedTimeline = [...editingCase.timeline]
    updatedTimeline[index] = { ...updatedTimeline[index], [field]: value }
    setEditingCase({
      ...editingCase,
      timeline: updatedTimeline
    })
  }

  const handleRemoveTimelineEvent = (index: number) => {
    if (!editingCase) return
    setEditingCase({
      ...editingCase,
      timeline: (editingCase.timeline || []).filter((_, i) => i !== index)
    })
  }

  const handleMoveUp = (caseId: string) => {
    const sortedCases = (cases || []).sort((a, b) => a.order - b.order)
    const index = sortedCases.findIndex(c => c.id === caseId)
    if (index <= 0) return

    const newOrder = [...sortedCases]
    const temp = newOrder[index].order
    newOrder[index].order = newOrder[index - 1].order
    newOrder[index - 1].order = temp

    setCases(newOrder)
    toast.success('Order updated')
  }

  const handleMoveDown = (caseId: string) => {
    const sortedCases = (cases || []).sort((a, b) => a.order - b.order)
    const index = sortedCases.findIndex(c => c.id === caseId)
    if (index < 0 || index >= sortedCases.length - 1) return

    const newOrder = [...sortedCases]
    const temp = newOrder[index].order
    newOrder[index].order = newOrder[index + 1].order
    newOrder[index + 1].order = temp

    setCases(newOrder)
    toast.success('Order updated')
  }

  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case 'active': return 'bg-blue-500/10 text-blue-500'
      case 'settled': return 'bg-green-500/10 text-green-500'
      case 'pending': return 'bg-yellow-500/10 text-yellow-500'
      case 'closed': return 'bg-gray-500/10 text-gray-500'
      case 'dismissed': return 'bg-red-500/10 text-red-500'
      default: return ''
    }
  }

  const getVisibilityColor = (visibility: CaseVisibility) => {
    switch (visibility) {
      case 'public': return 'bg-green-500/10 text-green-500'
      case 'unlisted': return 'bg-yellow-500/10 text-yellow-500'
      case 'private': return 'bg-red-500/10 text-red-500'
      default: return ''
    }
  }

  const uniqueCourts = Array.from(new Set((cases || []).map(c => c.court).filter(Boolean)))

  const filteredCases = (cases || []).filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (filterCourt !== 'all' && c.court !== filterCourt) return false
    if (filterVisibility !== 'all' && c.visibility !== filterVisibility) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Court Cases</h2>
          <p className="text-muted-foreground">Manage case cards with metadata, timelines, and document assignments.</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Case
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FunnelSimple className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Court</Label>
            <Select value={filterCourt} onValueChange={setFilterCourt}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courts</SelectItem>
                {uniqueCourts.map(court => (
                  <SelectItem key={court} value={court}>{court}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={filterVisibility} onValueChange={setFilterVisibility}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCases.sort((a, b) => a.order - b.order).map(courtCase => (
          <Card key={courtCase.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{courtCase.title || 'Untitled Case'}</CardTitle>
                    {courtCase.featured && (
                      <Badge variant="secondary" className="text-xs">Featured</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className={getStatusColor(courtCase.status)} variant="secondary">
                      {courtCase.status}
                    </Badge>
                    <Badge className={getVisibilityColor(courtCase.visibility)} variant="outline">
                      {courtCase.visibility}
                    </Badge>
                  </div>
                  <CardDescription className="space-y-1">
                    <div className="font-mono text-xs">{courtCase.docket}</div>
                    <div className="text-xs">{courtCase.court}</div>
                    {courtCase.jurisdiction && (
                      <div className="text-xs text-muted-foreground">{courtCase.jurisdiction}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">{courtCase.dateRange}</div>
                  </CardDescription>
                  <p className="text-sm text-muted-foreground mt-2">{courtCase.summary}</p>
                  {courtCase.tags && courtCase.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {courtCase.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {courtCase.timeline && courtCase.timeline.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {courtCase.timeline.length} timeline {courtCase.timeline.length === 1 ? 'event' : 'events'}
                    </div>
                  )}
                </div>
                <Switch checked={courtCase.visibility !== 'private'} onCheckedChange={(checked) => {
                  setCases(currentCases =>
                    (currentCases || []).map(c => c.id === courtCase.id ? { ...c, visibility: checked ? 'public' : 'private' } : c)
                  )
                }} />
              </div>
            </CardHeader>
            <CardFooter className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(courtCase)} className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleMoveUp(courtCase.id)} className="h-9 w-9 p-0">
                  <ArrowsDownUp className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleDelete(courtCase.id)} className="gap-2 text-destructive ml-auto">
                <Trash className="h-4 w-4" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}

        {filteredCases.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              {(cases || []).length === 0 ? (
                <>
                  <p className="text-muted-foreground mb-4">No cases yet. Add your first case to get started.</p>
                  <Button onClick={handleAdd} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Case
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">No cases match the current filters.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCase?.title ? 'Edit Case' : 'New Case'}</DialogTitle>
          </DialogHeader>
          {editingCase && (
            <div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-7 w-full">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="review">Review</TabsTrigger>
                  <TabsTrigger value="checklist">Checklist</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <div className="mt-4">
                  <TabsContent value="overview" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label htmlFor="case-title">Case Title</Label>
                      <Input
                        id="case-title"
                        value={editingCase.title}
                        onChange={(e) => setEditingCase({ ...editingCase, title: e.target.value })}
                        placeholder="Short descriptive title"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="case-docket">Docket Number</Label>
                        <Input
                          id="case-docket"
                          value={editingCase.docket}
                          onChange={(e) => setEditingCase({ ...editingCase, docket: e.target.value })}
                          placeholder="e.g., L-123-45"
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="case-status">Status</Label>
                        <Select
                          value={editingCase.status}
                          onValueChange={(value) => setEditingCase({ ...editingCase, status: value as CaseStatus })}
                        >
                          <SelectTrigger id="case-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="settled">Settled</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="dismissed">Dismissed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="case-court">Court</Label>
                      <Input
                        id="case-court"
                        value={editingCase.court}
                        onChange={(e) => setEditingCase({ ...editingCase, court: e.target.value })}
                        placeholder="e.g., Superior Court of New Jersey, Law Division"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="case-jurisdiction">Jurisdiction (optional)</Label>
                      <Input
                        id="case-jurisdiction"
                        value={editingCase.jurisdiction || ''}
                        onChange={(e) => setEditingCase({ ...editingCase, jurisdiction: e.target.value })}
                        placeholder="e.g., Essex County"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="case-summary">Summary</Label>
                      <Textarea
                        id="case-summary"
                        value={editingCase.summary}
                        onChange={(e) => setEditingCase({ ...editingCase, summary: e.target.value })}
                        placeholder="1-2 line summary for case card"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="case-stage">Stage</Label>
                        <Input
                          id="case-stage"
                          value={editingCase.stage}
                          onChange={(e) => setEditingCase({ ...editingCase, stage: e.target.value })}
                          placeholder="e.g., Discovery, Trial"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="case-visibility">Visibility</Label>
                        <Select
                          value={editingCase.visibility}
                          onValueChange={(value) => setEditingCase({ ...editingCase, visibility: value as CaseVisibility })}
                        >
                          <SelectTrigger id="case-visibility">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="unlisted">Unlisted</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Switch
                        id="case-featured"
                        checked={editingCase.featured}
                        onCheckedChange={(checked) => setEditingCase({ ...editingCase, featured: checked })}
                      />
                      <Label htmlFor="case-featured" className="text-sm">Featured Case</Label>
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label htmlFor="case-parties">Parties (optional)</Label>
                      <Input
                        id="case-parties"
                        value={editingCase.parties || ''}
                        onChange={(e) => setEditingCase({ ...editingCase, parties: e.target.value })}
                        placeholder="e.g., Plaintiff v. Defendant"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="case-daterange">Date Range</Label>
                        <Input
                          id="case-daterange"
                          value={editingCase.dateRange}
                          onChange={(e) => setEditingCase({ ...editingCase, dateRange: e.target.value })}
                          placeholder="e.g., 2020-2023"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="case-filing-date">Filing Date (optional)</Label>
                        <Input
                          id="case-filing-date"
                          type="date"
                          value={editingCase.filingDate || ''}
                          onChange={(e) => setEditingCase({ ...editingCase, filingDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="case-last-update">Last Update (optional)</Label>
                        <Input
                          id="case-last-update"
                          type="date"
                          value={editingCase.lastUpdate || ''}
                          onChange={(e) => setEditingCase({ ...editingCase, lastUpdate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="case-description">Full Description</Label>
                      <Textarea
                        id="case-description"
                        value={editingCase.description}
                        onChange={(e) => setEditingCase({ ...editingCase, description: e.target.value })}
                        placeholder="Detailed case description"
                        rows={6}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="case-tags">Tags (comma-separated)</Label>
                      <Input
                        id="case-tags"
                        value={editingCase.tags.join(', ')}
                        onChange={(e) => setEditingCase({ ...editingCase, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="civil rights, transparency, accountability"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="case-disclosure">Public Disclosure Override (optional)</Label>
                      <Textarea
                        id="case-disclosure"
                        value={editingCase.publicDisclosureOverride || ''}
                        onChange={(e) => setEditingCase({ ...editingCase, publicDisclosureOverride: e.target.value })}
                        placeholder="Custom disclosure text for public display"
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="timeline" className="space-y-4 mt-0">
                    <div className="flex items-center justify-between mb-4">
                      <Label>Timeline Events</Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddTimelineEvent} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Event
                      </Button>
                    </div>

                    {(!editingCase.timeline || editingCase.timeline.length === 0) ? (
                      <div className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-md">
                        No timeline events yet. Add key dates and milestones.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {editingCase.timeline.sort((a, b) => a.order - b.order).map((event, index) => (
                          <Card key={event.id} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start gap-2">
                                <div className="flex-1 space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Date</Label>
                                      <Input
                                        type="date"
                                        value={event.date}
                                        onChange={(e) => handleUpdateTimelineEvent(index, 'date', e.target.value)}
                                        className="h-9"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Title</Label>
                                      <Input
                                        value={event.title}
                                        onChange={(e) => handleUpdateTimelineEvent(index, 'title', e.target.value)}
                                        placeholder="Event title"
                                        className="h-9"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Description</Label>
                                    <Textarea
                                      value={event.description}
                                      onChange={(e) => handleUpdateTimelineEvent(index, 'description', e.target.value)}
                                      placeholder="Event details"
                                      rows={2}
                                    />
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveTimelineEvent(index)}
                                  className="text-destructive hover:text-destructive h-9 w-9 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-4 mt-0">
                    <div className="text-sm text-muted-foreground mb-4">
                      Document management will be handled in the Documents tab. Featured document IDs can be specified here.
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="case-featured-docs">Featured Document IDs (comma-separated)</Label>
                      <Input
                        id="case-featured-docs"
                        value={(editingCase.featuredDocIds || []).join(', ')}
                        onChange={(e) => setEditingCase({ 
                          ...editingCase, 
                          featuredDocIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                        })}
                        placeholder="pdf_123, pdf_456"
                        className="font-mono text-xs"
                      />
                    </div>

                    <div className="p-4 bg-muted rounded-md text-xs text-muted-foreground">
                      <strong>Note:</strong> Use the Documents tab to upload and manage PDFs, then reference their IDs here to feature them in this case.
                    </div>
                  </TabsContent>

                  <TabsContent value="review" className="space-y-4 mt-0">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Attorney review notes designed for counsel triage and contingency evaluation.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Apply Template</Label>
                        <Select
                          onValueChange={(templateId) => {
                            const template = applyReviewNotesTemplate(templateId)
                            if (template) {
                              setEditingCase({
                                ...editingCase,
                                reviewNotes: template
                              })
                              toast.success('Review notes template applied')
                            }
                          }}
                        >
                          <SelectTrigger className="w-[200px] h-9">
                            <SelectValue placeholder="Choose template..." />
                          </SelectTrigger>
                          <SelectContent>
                            {DEFAULT_REVIEW_NOTES_TEMPLATES.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="review-damages">Damages/Injuries</Label>
                      <Textarea
                        id="review-damages"
                        value={editingCase.reviewNotes?.damagesInjuries || ''}
                        onChange={(e) => setEditingCase({ 
                          ...editingCase, 
                          reviewNotes: { ...(editingCase.reviewNotes || {}), damagesInjuries: e.target.value }
                        })}
                        placeholder="Describe injuries, damages, or harm alleged"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="review-evidence">Key Evidence Sources</Label>
                      <Textarea
                        id="review-evidence"
                        value={editingCase.reviewNotes?.keyEvidenceSources || ''}
                        onChange={(e) => setEditingCase({ 
                          ...editingCase, 
                          reviewNotes: { ...(editingCase.reviewNotes || {}), keyEvidenceSources: e.target.value }
                        })}
                        placeholder="BWC footage, certifications, exhibits, expert reports, etc."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="review-deadlines">Deadlines/Limitations</Label>
                      <Textarea
                        id="review-deadlines"
                        value={editingCase.reviewNotes?.deadlinesLimitations || ''}
                        onChange={(e) => setEditingCase({ 
                          ...editingCase, 
                          reviewNotes: { ...(editingCase.reviewNotes || {}), deadlinesLimitations: e.target.value }
                        })}
                        placeholder="Statute of limitations dates, filing deadlines, or time-sensitive considerations"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="review-relief">Relief Sought</Label>
                      <Textarea
                        id="review-relief"
                        value={editingCase.reviewNotes?.reliefSought || ''}
                        onChange={(e) => setEditingCase({ 
                          ...editingCase, 
                          reviewNotes: { ...(editingCase.reviewNotes || {}), reliefSought: e.target.value }
                        })}
                        placeholder="Damages requested, injunctive relief, declaratory judgment, etc."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="review-notes">Additional Review Notes</Label>
                      <Textarea
                        id="review-notes"
                        value={editingCase.reviewNotes?.notes || ''}
                        onChange={(e) => setEditingCase({ 
                          ...editingCase, 
                          reviewNotes: { ...(editingCase.reviewNotes || {}), notes: e.target.value }
                        })}
                        placeholder="General notes for attorney review"
                        rows={4}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="checklist" className="space-y-4 mt-0">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Label>Contingency Evaluation Checklist</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Track key factors for contingency case evaluation
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(templateId) => {
                            const items = applyContingencyChecklistTemplate(templateId)
                            if (items) {
                              setEditingCase({
                                ...editingCase,
                                contingencyChecklist: items
                              })
                              toast.success('Checklist template applied')
                            }
                          }}
                        >
                          <SelectTrigger className="w-[200px] h-9">
                            <SelectValue placeholder="Apply template..." />
                          </SelectTrigger>
                          <SelectContent>
                            {DEFAULT_CONTINGENCY_CHECKLIST_TEMPLATES.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const newItem = {
                              id: `checklist_${Date.now()}`,
                              label: '',
                              checked: false,
                              notes: ''
                            }
                            setEditingCase({
                              ...editingCase,
                              contingencyChecklist: [...(editingCase.contingencyChecklist || []), newItem]
                            })
                          }}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Item
                        </Button>
                      </div>
                    </div>

                    {(!editingCase.contingencyChecklist || editingCase.contingencyChecklist.length === 0) ? (
                      <div className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-md">
                        No checklist items yet. Add evaluation criteria for attorney review.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {editingCase.contingencyChecklist.map((item, index) => (
                          <Card key={item.id} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start gap-2">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={item.checked}
                                      onCheckedChange={(checked) => {
                                        const updated = [...(editingCase.contingencyChecklist || [])]
                                        updated[index] = { ...updated[index], checked }
                                        setEditingCase({ ...editingCase, contingencyChecklist: updated })
                                      }}
                                    />
                                    <Input
                                      value={item.label}
                                      onChange={(e) => {
                                        const updated = [...(editingCase.contingencyChecklist || [])]
                                        updated[index] = { ...updated[index], label: e.target.value }
                                        setEditingCase({ ...editingCase, contingencyChecklist: updated })
                                      }}
                                      placeholder="Checklist item label"
                                      className="flex-1"
                                    />
                                  </div>
                                  <Textarea
                                    value={item.notes || ''}
                                    onChange={(e) => {
                                      const updated = [...(editingCase.contingencyChecklist || [])]
                                      updated[index] = { ...updated[index], notes: e.target.value }
                                      setEditingCase({ ...editingCase, contingencyChecklist: updated })
                                    }}
                                    placeholder="Optional notes for this item"
                                    rows={2}
                                    className="text-sm"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingCase({
                                      ...editingCase,
                                      contingencyChecklist: (editingCase.contingencyChecklist || []).filter((_, i) => i !== index)
                                    })
                                  }}
                                  className="text-destructive hover:text-destructive h-9 w-9 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label htmlFor="case-source-notes">Source Notes (Admin Only)</Label>
                      <Textarea
                        id="case-source-notes"
                        value={editingCase.sourceNotes || ''}
                        onChange={(e) => setEditingCase({ ...editingCase, sourceNotes: e.target.value })}
                        placeholder="Internal notes about sources, context, or provenance"
                        rows={8}
                      />
                      <p className="text-xs text-muted-foreground">
                        These notes are for internal reference only and will not be displayed publicly.
                      </p>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Case</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
