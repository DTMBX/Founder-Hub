import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Case, CaseStatus, CaseVisibility } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useAuth, logAudit } from '@/lib/auth'

export default function CourtManager() {
  const [cases, setCases] = useKV<Case[]>('founder-hub-cases', [])
  const [editingCase, setEditingCase] = useState<Case | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { currentUser } = useAuth()

  const handleAdd = () => {
    const newCase: Case = {
      id: `case_${Date.now()}`,
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
      lastUpdated: Date.now()
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

    setCases(currentCases => {
      const existing = currentCases?.find(c => c.id === editingCase.id)
      if (existing) {
        return (currentCases || []).map(c => c.id === editingCase.id ? { ...editingCase, lastUpdated: Date.now() } : c)
      } else {
        return [...(currentCases || []), { ...editingCase, lastUpdated: Date.now() }]
      }
    })

    if (currentUser) {
      await logAudit(
        currentUser.id,
        currentUser.email,
        'update_case',
        `Updated case: ${editingCase.title}`,
        'case',
        editingCase.id
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

  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case 'active': return 'bg-accent text-accent-foreground'
      case 'settled': return 'bg-green-500/20 text-green-400'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400'
      case 'closed': return 'bg-gray-500/20 text-gray-400'
      case 'dismissed': return 'bg-blue-500/20 text-blue-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Court Cases</h2>
          <p className="text-muted-foreground">Manage court case documentation and materials.</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Case
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cases?.sort((a, b) => a.order - b.order).map(courtCase => (
          <Card key={courtCase.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2 mb-2">
                <CardTitle className="text-lg">{courtCase.title || 'Untitled Case'}</CardTitle>
                <Badge className={getStatusColor(courtCase.status)}>
                  {courtCase.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <CardDescription>{courtCase.court}</CardDescription>
                <p className="font-mono text-xs text-accent">{courtCase.docket}</p>
                <Badge variant="outline" className="text-xs">
                  {courtCase.visibility}
                </Badge>
              </div>
            </CardHeader>
            <CardFooter className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(courtCase)} className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(courtCase.id)} className="gap-2 text-destructive">
                <Trash className="h-4 w-4" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}

        {(!cases || cases.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No cases yet. Add your first case to get started.</p>
              <Button onClick={handleAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Case
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCase?.title ? 'Edit Case' : 'New Case'}</DialogTitle>
          </DialogHeader>
          {editingCase && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="case-title">Title</Label>
                  <Input
                    id="case-title"
                    value={editingCase.title}
                    onChange={(e) => setEditingCase({ ...editingCase, title: e.target.value })}
                    placeholder="Case Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case-docket">Docket Number</Label>
                  <Input
                    id="case-docket"
                    value={editingCase.docket}
                    onChange={(e) => setEditingCase({ ...editingCase, docket: e.target.value })}
                    placeholder="ABC-L-123-21"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="case-court">Court</Label>
                <Input
                  id="case-court"
                  value={editingCase.court}
                  onChange={(e) => setEditingCase({ ...editingCase, court: e.target.value })}
                  placeholder="Superior Court of New Jersey, Law Division"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="case-status">Status</Label>
                  <Select value={editingCase.status} onValueChange={(value: CaseStatus) => setEditingCase({ ...editingCase, status: value })}>
                    <SelectTrigger id="case-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="settled">Settled</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case-visibility">Visibility</Label>
                  <Select value={editingCase.visibility} onValueChange={(value: CaseVisibility) => setEditingCase({ ...editingCase, visibility: value })}>
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

              <div className="space-y-2">
                <Label htmlFor="case-dateRange">Date Range</Label>
                <Input
                  id="case-dateRange"
                  value={editingCase.dateRange}
                  onChange={(e) => setEditingCase({ ...editingCase, dateRange: e.target.value })}
                  placeholder="2021 - 2023"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="case-summary">Summary</Label>
                <Textarea
                  id="case-summary"
                  value={editingCase.summary}
                  onChange={(e) => setEditingCase({ ...editingCase, summary: e.target.value })}
                  placeholder="Brief summary for card display"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="case-description">Full Description</Label>
                <Textarea
                  id="case-description"
                  value={editingCase.description}
                  onChange={(e) => setEditingCase({ ...editingCase, description: e.target.value })}
                  placeholder="Detailed description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="case-tags">Tags (comma-separated)</Label>
                <Input
                  id="case-tags"
                  value={editingCase.tags.join(', ')}
                  onChange={(e) => setEditingCase({ ...editingCase, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="civil, appeal, fraud"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="case-source">Source Notes (optional)</Label>
                <Textarea
                  id="case-source"
                  value={editingCase.sourceNotes || ''}
                  onChange={(e) => setEditingCase({ ...editingCase, sourceNotes: e.target.value })}
                  placeholder="Where/how documents were obtained"
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Case</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
