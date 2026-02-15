import { useState, useEffect } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import { FilingType } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash, ArrowsDownUp, DotsSixVertical, FloppyDisk } from '@phosphor-icons/react'
import { toast } from 'sonner'

const DEFAULT_FILING_TYPES: Omit<FilingType, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Complaint', sortOrder: 0, defaultNamingToken: 'CMPL', icon: '⚖️', defaultVisibility: 'public' },
  { name: 'Certification/Affidavit', sortOrder: 1, defaultNamingToken: 'CERT', icon: '📜', defaultVisibility: 'public' },
  { name: 'Motion', sortOrder: 2, defaultNamingToken: 'MTN', icon: '📋', defaultVisibility: 'public' },
  { name: 'Opposition', sortOrder: 3, defaultNamingToken: 'OPP', icon: '🛡️', defaultVisibility: 'public' },
  { name: 'Reply', sortOrder: 4, defaultNamingToken: 'RPLY', icon: '↩️', defaultVisibility: 'public' },
  { name: 'Order', sortOrder: 5, defaultNamingToken: 'ORD', icon: '⚖️', defaultVisibility: 'public' },
  { name: 'Notice', sortOrder: 6, defaultNamingToken: 'NOT', icon: '📢', defaultVisibility: 'public' },
  { name: 'Exhibit', sortOrder: 7, defaultNamingToken: 'EXH', icon: '📎', defaultVisibility: 'unlisted' },
  { name: 'Transcript', sortOrder: 8, defaultNamingToken: 'TRAN', icon: '📝', defaultVisibility: 'unlisted' },
  { name: 'OPRA/Records', sortOrder: 9, defaultNamingToken: 'OPRA', icon: '📁', defaultVisibility: 'private' },
  { name: 'Other', sortOrder: 99, defaultNamingToken: 'OTH', icon: '📄', defaultVisibility: 'private' },
]

export default function FilingTypesManager() {
  const [filingTypes, setFilingTypes] = useKV<FilingType[]>('founder-hub-filing-types', [])
  const [editingType, setEditingType] = useState<FilingType | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (!filingTypes || filingTypes.length === 0) {
      const now = Date.now()
      const initialTypes: FilingType[] = DEFAULT_FILING_TYPES.map((t, i) => ({
        ...t,
        id: `filing_type_${now}_${i}`,
        createdAt: now,
        updatedAt: now
      }))
      setFilingTypes(initialTypes)
    }
  }, [])

  const handleAdd = () => {
    const now = Date.now()
    const newType: FilingType = {
      id: `filing_type_${now}`,
      name: '',
      sortOrder: (filingTypes?.length || 0),
      defaultNamingToken: '',
      icon: '📄',
      defaultVisibility: 'private',
      createdAt: now,
      updatedAt: now
    }
    setEditingType(newType)
    setIsDialogOpen(true)
  }

  const handleEdit = (type: FilingType) => {
    setEditingType(type)
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!editingType) return

    if (!editingType.name.trim()) {
      toast.error('Filing type name is required')
      return
    }

    if (!editingType.defaultNamingToken.trim()) {
      toast.error('Naming token is required')
      return
    }

    const updatedType = { ...editingType, updatedAt: Date.now() }

    setFilingTypes((current) => {
      const existing = current?.find(t => t.id === editingType.id)
      if (existing) {
        return (current || []).map(t => t.id === editingType.id ? updatedType : t)
      } else {
        return [...(current || []), updatedType]
      }
    })

    toast.success('Filing type saved')
    setIsDialogOpen(false)
    setEditingType(null)
  }

  const handleDelete = (typeId: string) => {
    if (window.confirm('Delete this filing type? Documents using it will become uncategorized.')) {
      setFilingTypes((current) => (current || []).filter(t => t.id !== typeId))
      toast.success('Filing type deleted')
    }
  }

  const handleMoveUp = (index: number) => {
    if (index === 0 || !filingTypes) return
    
    const items = [...filingTypes]
    const temp = items[index - 1]
    items[index - 1] = items[index]
    items[index] = temp

    const reorderedWithSortOrder = items.map((item, i) => ({
      ...item,
      sortOrder: i,
      updatedAt: Date.now()
    }))

    setFilingTypes(reorderedWithSortOrder)
  }

  const handleMoveDown = (index: number) => {
    if (!filingTypes || index >= filingTypes.length - 1) return
    
    const items = [...filingTypes]
    const temp = items[index + 1]
    items[index + 1] = items[index]
    items[index] = temp

    const reorderedWithSortOrder = items.map((item, i) => ({
      ...item,
      sortOrder: i,
      updatedAt: Date.now()
    }))

    setFilingTypes(reorderedWithSortOrder)
  }

  const sortedTypes = [...(filingTypes || [])].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filing Types</CardTitle>
              <CardDescription>
                Define document filing types for consistent categorization and organization
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus size={18} weight="bold" />
              Add Filing Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedTypes.map((type, index) => (
              <div
                key={type.id}
                className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-accent/50 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ArrowsDownUp size={14} className="rotate-180" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === sortedTypes.length - 1}
                  >
                    <ArrowsDownUp size={14} />
                  </Button>
                </div>

                <div className="text-2xl">{type.icon}</div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{type.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Token: {type.defaultNamingToken}
                  </div>
                </div>

                <Badge variant="outline">
                  {type.defaultVisibility}
                </Badge>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(type)}
                  >
                    <Pencil size={16} />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(type.id)}
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {sortedTypes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No filing types defined.</p>
              <p className="text-sm mt-2">Add your first filing type to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType?.name ? 'Edit Filing Type' : 'New Filing Type'}
            </DialogTitle>
          </DialogHeader>

          {editingType && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Filing Type Name *</Label>
                <Input
                  id="name"
                  value={editingType.name}
                  onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                  placeholder="e.g., Complaint, Motion, Order"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Naming Token *</Label>
                <Input
                  id="token"
                  value={editingType.defaultNamingToken}
                  onChange={(e) => setEditingType({ ...editingType, defaultNamingToken: e.target.value.toUpperCase() })}
                  placeholder="e.g., CMPL, MTN, ORD"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  Short code used in filename templates (max 10 chars)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={editingType.icon || ''}
                  onChange={(e) => setEditingType({ ...editingType, icon: e.target.value })}
                  placeholder="📄"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility">Default Visibility</Label>
                <Select
                  value={editingType.defaultVisibility || 'private'}
                  onValueChange={(value: any) => setEditingType({ ...editingType, defaultVisibility: value })}
                >
                  <SelectTrigger id="visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="unlisted">Unlisted (link only)</SelectItem>
                    <SelectItem value="private">Private (admin only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <FloppyDisk size={18} />
              Save Filing Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
