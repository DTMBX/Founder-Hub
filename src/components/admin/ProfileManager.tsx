import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Trash, EnvelopeSimple, ArrowUp, ArrowDown, PencilSimple, X, FloppyDisk
} from '@phosphor-icons/react'
import ContentEditorShell from './ContentEditorShell'
import { useContentEditor } from '@/hooks/use-content-editor'

export interface ProfessionalEmail {
  label: string
  email: string
  icon: string
  desc: string
}

export interface SiteProfile {
  ownerName: string
  title: string
  bio: string
  catchAllEmail: string
  professionalEmails: ProfessionalEmail[]
  domain: string
}

const ICON_OPTIONS = [
  { value: 'envelope', label: 'Email' },
  { value: 'scales', label: 'Legal' },
  { value: 'chart', label: 'Investor' },
  { value: 'handshake', label: 'Partnership' },
  { value: 'shield', label: 'Security' },
  { value: 'support', label: 'Support' },
  { value: 'press', label: 'Press/Media' },
  { value: 'general', label: 'General' },
]

export default function ProfileManager() {
  const editor = useContentEditor<SiteProfile>('profile')

  return (
    <ContentEditorShell
      registryId="profile"
      editor={editor}
      footer={<ProfessionalEmailsSection editor={editor} />}
    />
  )
}

// ─── Professional Emails Section (custom CRUD) ─────────────────────────────

function ProfessionalEmailsSection({ editor }: { editor: ReturnType<typeof useContentEditor<SiteProfile>> }) {
  const [showAddEmail, setShowAddEmail] = useState(false)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [emailForm, setEmailForm] = useState({ label: '', email: '', icon: 'envelope', desc: '' })

  const emails = editor.value.professionalEmails || []

  const addEmail = () => {
    if (!emailForm.label.trim() || !emailForm.email.trim()) return
    editor.setField('professionalEmails', [...emails, {
      label: emailForm.label.trim(),
      email: emailForm.email.trim(),
      icon: emailForm.icon,
      desc: emailForm.desc.trim()
    }])
    setEmailForm({ label: '', email: '', icon: 'envelope', desc: '' })
    setShowAddEmail(false)
  }

  const removeEmail = (index: number) => {
    editor.setField('professionalEmails', emails.filter((_: unknown, i: number) => i !== index))
  }

  const moveEmail = (index: number, direction: 'up' | 'down') => {
    const arr = [...emails]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= arr.length) return
    ;[arr[index], arr[target]] = [arr[target], arr[index]]
    editor.setField('professionalEmails', arr)
  }

  const saveEmail = (index: number) => {
    const arr = [...emails]
    arr[index] = {
      label: emailForm.label.trim(),
      email: emailForm.email.trim(),
      icon: emailForm.icon,
      desc: emailForm.desc.trim()
    }
    editor.setField('professionalEmails', arr)
    setEditingIdx(null)
    setEmailForm({ label: '', email: '', icon: 'envelope', desc: '' })
  }

  const startEdit = (index: number) => {
    const em = emails[index]
    setEditingIdx(index)
    setEmailForm({ label: em.label, email: em.email, icon: em.icon, desc: em.desc })
    setShowAddEmail(false)
  }

  return (
    <Card className="p-6 bg-card/50 border-border/50">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold">Professional Email Addresses</h3>
        <Button size="sm" onClick={() => { setShowAddEmail(true); setEditingIdx(null); setEmailForm({ label: '', email: '', icon: 'envelope', desc: '' }) }} disabled={showAddEmail}>
          <Plus className="h-4 w-4 mr-1" /> Add Email
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Departmental emails shown as contact cards on the public site. All route to your catch-all ({editor.value.catchAllEmail}).
      </p>

      {/* Add form */}
      {showAddEmail && (
        <Card className="p-4 mb-4 bg-primary/5 border-primary/20">
          <EmailForm
            form={emailForm}
            setForm={setEmailForm}
            onSave={addEmail}
            onCancel={() => setShowAddEmail(false)}
            saveLabel="Add"
          />
        </Card>
      )}

      {/* Email list */}
      <div className="space-y-1.5">
        {emails.map((em, index) => (
          <Card key={index} className="p-3 bg-card/30 border-border/40 group hover:border-border/60 transition-colors">
            {editingIdx === index ? (
              <EmailForm
                form={emailForm}
                setForm={setEmailForm}
                onSave={() => saveEmail(index)}
                onCancel={() => setEditingIdx(null)}
                saveLabel="Save"
              />
            ) : (
              <div className="flex items-center gap-3">
                <div className="shrink-0 p-2 rounded-lg bg-primary/10 border border-border/30">
                  <EnvelopeSimple className="h-4 w-4 text-primary" weight="duotone" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{em.label}</p>
                    <Badge variant="outline" className="text-[10px]">{em.icon}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{em.email}</p>
                  {em.desc && <p className="text-[11px] text-muted-foreground/70">{em.desc}</p>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveEmail(index, 'up')} disabled={index === 0}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveEmail(index, 'down')} disabled={index === emails.length - 1}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(index)}>
                    <PencilSimple className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeEmail(index)}>
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </Card>
  )
}

function EmailForm({
  form,
  setForm,
  onSave,
  onCancel,
  saveLabel
}: {
  form: { label: string; email: string; icon: string; desc: string }
  setForm: (f: { label: string; email: string; icon: string; desc: string }) => void
  onSave: () => void
  onCancel: () => void
  saveLabel: string
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Label</label>
          <Input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Legal & Court"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
          <Input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="legal@devon-tyler.com"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
          <select
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {ICON_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
          <Input
            value={form.desc}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
            placeholder="Case inquiries"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-3.5 w-3.5 mr-1" /> Cancel
        </Button>
        <Button size="sm" onClick={onSave} disabled={!form.label.trim() || !form.email.trim()}>
          <FloppyDisk className="h-3.5 w-3.5 mr-1" /> {saveLabel}
        </Button>
      </div>
    </div>
  )
}
