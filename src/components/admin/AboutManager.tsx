import { useState } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash, PencilSimple, FloppyDisk, ArrowUp, ArrowDown, X } from '@phosphor-icons/react'

interface AboutContent {
  mission: string
  currentFocus: string
  values: string[]
  updates: Array<{ date: string; title: string; content: string }>
}

const DEFAULT_ABOUT: AboutContent = {
  mission: 'Forging transformative solutions at the intersection of technology, home improvement, transparency, and justice.',
  currentFocus: 'Building civic technology, home improvement platforms, and legal infrastructure that increase transparency and empower communities.',
  values: ['Integrity', 'Stewardship', 'Fortitude', 'Veracity'],
  updates: []
}

export default function AboutManager() {
  const [aboutContent, setAboutContent] = useKV<AboutContent>('founder-hub-about', DEFAULT_ABOUT)
  const [newValue, setNewValue] = useState('')
  const [editingUpdate, setEditingUpdate] = useState<number | null>(null)
  const [newUpdate, setNewUpdate] = useState({ date: '', title: '', content: '' })
  const [showAddUpdate, setShowAddUpdate] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!aboutContent) return null

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updateField = (field: keyof AboutContent, value: any) => {
    setAboutContent({ ...aboutContent, [field]: value })
    showSaved()
  }

  // Values management
  const addValue = () => {
    if (!newValue.trim()) return
    updateField('values', [...aboutContent.values, newValue.trim()])
    setNewValue('')
  }

  const removeValue = (index: number) => {
    updateField('values', aboutContent.values.filter((_, i) => i !== index))
  }

  const moveValue = (index: number, direction: 'up' | 'down') => {
    const arr = [...aboutContent.values]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= arr.length) return
    ;[arr[index], arr[target]] = [arr[target], arr[index]]
    updateField('values', arr)
  }

  // Updates management
  const addUpdate = () => {
    if (!newUpdate.title.trim()) return
    const update = {
      date: newUpdate.date || new Date().toISOString().slice(0, 7),
      title: newUpdate.title.trim(),
      content: newUpdate.content.trim()
    }
    updateField('updates', [update, ...(aboutContent.updates || [])])
    setNewUpdate({ date: '', title: '', content: '' })
    setShowAddUpdate(false)
  }

  const removeUpdate = (index: number) => {
    updateField('updates', aboutContent.updates.filter((_, i) => i !== index))
  }

  const saveUpdate = (index: number, updated: { date: string; title: string; content: string }) => {
    const arr = [...aboutContent.updates]
    arr[index] = updated
    updateField('updates', arr)
    setEditingUpdate(null)
  }

  const moveUpdate = (index: number, direction: 'up' | 'down') => {
    const arr = [...aboutContent.updates]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= arr.length) return
    ;[arr[index], arr[target]] = [arr[target], arr[index]]
    updateField('updates', arr)
  }

  return (
    <div className="space-y-8">
      {/* Save indicator */}
      {saved && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-right-4 duration-300">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/40 px-3 py-1.5">
            <FloppyDisk className="h-3.5 w-3.5 mr-1.5" /> Saved
          </Badge>
        </div>
      )}

      {/* Mission */}
      <Card className="p-6 bg-card/50 border-border/50">
        <h3 className="text-lg font-semibold mb-1">Mission Statement</h3>
        <p className="text-xs text-muted-foreground mb-4">Your core mission — displayed prominently on the About section.</p>
        <Textarea
          value={aboutContent.mission}
          onChange={(e) => updateField('mission', e.target.value)}
          rows={3}
          className="resize-none"
          placeholder="Your mission statement..."
        />
      </Card>

      {/* Current Focus */}
      <Card className="p-6 bg-card/50 border-border/50">
        <h3 className="text-lg font-semibold mb-1">Current Focus</h3>
        <p className="text-xs text-muted-foreground mb-4">What you're actively working on right now.</p>
        <Textarea
          value={aboutContent.currentFocus}
          onChange={(e) => updateField('currentFocus', e.target.value)}
          rows={3}
          className="resize-none"
          placeholder="What you're focused on..."
        />
      </Card>

      {/* Core Values */}
      <Card className="p-6 bg-card/50 border-border/50">
        <h3 className="text-lg font-semibold mb-1">Core Values</h3>
        <p className="text-xs text-muted-foreground mb-4">Displayed as badges — add, remove, or reorder.</p>
        
        <div className="space-y-2 mb-4">
          {aboutContent.values.map((value, index) => (
            <div key={index} className="flex items-center gap-2 group">
              <Badge variant="secondary" className="text-sm px-3 py-1.5 flex-1 justify-start">
                {value}
              </Badge>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveValue(index, 'up')} disabled={index === 0}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveValue(index, 'down')} disabled={index === aboutContent.values.length - 1}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeValue(index)}>
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Add a value..."
            onKeyDown={(e) => e.key === 'Enter' && addValue()}
            className="flex-1"
          />
          <Button onClick={addValue} size="sm" disabled={!newValue.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </Card>

      {/* Updates / Posts */}
      <Card className="p-6 bg-card/50 border-border/50">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold">Updates & Posts</h3>
          <Button size="sm" onClick={() => setShowAddUpdate(true)} disabled={showAddUpdate}>
            <Plus className="h-4 w-4 mr-1" /> New Update
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Add news, milestones, or announcements that appear on the About section. Most recent shows first.</p>

        {/* Add update form */}
        {showAddUpdate && (
          <Card className="p-4 mb-4 bg-primary/5 border-primary/20">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
                  <Input
                    type="month"
                    value={newUpdate.date}
                    onChange={(e) => setNewUpdate({ ...newUpdate, date: e.target.value })}
                    placeholder="YYYY-MM"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
                  <Input
                    value={newUpdate.title}
                    onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                    placeholder="Update title..."
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Content</label>
                <Textarea
                  value={newUpdate.content}
                  onChange={(e) => setNewUpdate({ ...newUpdate, content: e.target.value })}
                  placeholder="Update details..."
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => { setShowAddUpdate(false); setNewUpdate({ date: '', title: '', content: '' }) }}>
                  Cancel
                </Button>
                <Button size="sm" onClick={addUpdate} disabled={!newUpdate.title.trim()}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Publish
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Updates list */}
        <div className="space-y-2">
          {(!aboutContent.updates || aboutContent.updates.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-8">No updates yet. Click "New Update" to post one.</p>
          )}
          {aboutContent.updates?.map((update, index) => (
            <Card key={index} className="p-4 bg-card/30 border-border/40 group">
              {editingUpdate === index ? (
                <EditUpdateForm
                  update={update}
                  onSave={(u) => saveUpdate(index, u)}
                  onCancel={() => setEditingUpdate(null)}
                />
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{update.title}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">{update.date}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{update.content}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveUpdate(index, 'up')} disabled={index === 0}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveUpdate(index, 'down')} disabled={index === (aboutContent.updates?.length || 0) - 1}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingUpdate(index)}>
                      <PencilSimple className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeUpdate(index)}>
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Card>
    </div>
  )
}

function EditUpdateForm({ 
  update, 
  onSave, 
  onCancel 
}: { 
  update: { date: string; title: string; content: string }
  onSave: (u: { date: string; title: string; content: string }) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(update)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="month"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Title"
        />
      </div>
      <Textarea
        value={form.content}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
        rows={2}
        className="resize-none"
      />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-3.5 w-3.5 mr-1" /> Cancel
        </Button>
        <Button size="sm" onClick={() => onSave(form)}>
          <FloppyDisk className="h-3.5 w-3.5 mr-1" /> Save
        </Button>
      </div>
    </div>
  )
}
