import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, Trash, FloppyDisk, EnvelopeSimple, ArrowUp, ArrowDown, PencilSimple, X
} from '@phosphor-icons/react'

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

const DEFAULT_PROFILE: SiteProfile = {
  ownerName: 'Devon Tyler Barber',
  title: 'Founder & Innovator',
  bio: 'Forging transformative solutions at the intersection of technology, home improvement, transparency, and justice.',
  catchAllEmail: 'x@xtx396.com',
  professionalEmails: [
    { label: 'General Inquiries', email: 'x@xtx396.com', icon: 'envelope', desc: 'Main contact' },
    { label: 'Legal & Court', email: 'legal@xtx396.com', icon: 'scales', desc: 'Case inquiries' },
    { label: 'Investor Relations', email: 'invest@xtx396.com', icon: 'chart', desc: 'Projects & funding' },
    { label: 'Partnerships', email: 'partner@xtx396.com', icon: 'handshake', desc: 'Collaborations' },
  ],
  domain: 'xtx396.com'
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
  const [profile, setProfile] = useKV<SiteProfile>('founder-hub-profile', DEFAULT_PROFILE)
  const [showAddEmail, setShowAddEmail] = useState(false)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [emailForm, setEmailForm] = useState({ label: '', email: '', icon: 'envelope', desc: '' })
  const [saved, setSaved] = useState(false)

  if (!profile) return null

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updateProfile = (partial: Partial<SiteProfile>) => {
    setProfile({ ...profile, ...partial })
    showSaved()
  }

  // Email CRUD
  const addEmail = () => {
    if (!emailForm.label.trim() || !emailForm.email.trim()) return
    updateProfile({
      professionalEmails: [...profile.professionalEmails, {
        label: emailForm.label.trim(),
        email: emailForm.email.trim(),
        icon: emailForm.icon,
        desc: emailForm.desc.trim()
      }]
    })
    setEmailForm({ label: '', email: '', icon: 'envelope', desc: '' })
    setShowAddEmail(false)
  }

  const removeEmail = (index: number) => {
    updateProfile({
      professionalEmails: profile.professionalEmails.filter((_, i) => i !== index)
    })
  }

  const moveEmail = (index: number, direction: 'up' | 'down') => {
    const arr = [...profile.professionalEmails]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= arr.length) return
    ;[arr[index], arr[target]] = [arr[target], arr[index]]
    updateProfile({ professionalEmails: arr })
  }

  const saveEmail = (index: number) => {
    const arr = [...profile.professionalEmails]
    arr[index] = {
      label: emailForm.label.trim(),
      email: emailForm.email.trim(),
      icon: emailForm.icon,
      desc: emailForm.desc.trim()
    }
    updateProfile({ professionalEmails: arr })
    setEditingIdx(null)
    setEmailForm({ label: '', email: '', icon: 'envelope', desc: '' })
  }

  const startEdit = (index: number) => {
    const em = profile.professionalEmails[index]
    setEditingIdx(index)
    setEmailForm({ label: em.label, email: em.email, icon: em.icon, desc: em.desc })
    setShowAddEmail(false)
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

      {/* Identity */}
      <Card className="p-6 bg-card/50 border-border/50">
        <h3 className="text-lg font-semibold mb-1">Site Identity</h3>
        <p className="text-xs text-muted-foreground mb-4">Core identity shown across the site, footer, and SEO.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Owner Name</label>
            <Input
              value={profile.ownerName}
              onChange={(e) => updateProfile({ ownerName: e.target.value })}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title / Role</label>
            <Input
              value={profile.title}
              onChange={(e) => updateProfile({ title: e.target.value })}
              placeholder="Founder & Innovator"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Primary Domain</label>
            <Input
              value={profile.domain}
              onChange={(e) => updateProfile({ domain: e.target.value })}
              placeholder="xtx396.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Catch-All Email</label>
            <Input
              value={profile.catchAllEmail}
              onChange={(e) => updateProfile({ catchAllEmail: e.target.value })}
              placeholder="x@xtx396.com"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Bio</label>
          <Textarea
            value={profile.bio}
            onChange={(e) => updateProfile({ bio: e.target.value })}
            rows={2}
            className="resize-none"
            placeholder="Short bio..."
          />
        </div>
      </Card>

      {/* Professional Emails */}
      <Card className="p-6 bg-card/50 border-border/50">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold">Professional Email Addresses</h3>
          <Button size="sm" onClick={() => { setShowAddEmail(true); setEditingIdx(null); setEmailForm({ label: '', email: '', icon: 'envelope', desc: '' }) }} disabled={showAddEmail}>
            <Plus className="h-4 w-4 mr-1" /> Add Email
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Departmental emails shown as contact cards on the public site. All route to your catch-all ({profile.catchAllEmail}).
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
          {profile.professionalEmails.map((em, index) => (
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
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveEmail(index, 'down')} disabled={index === profile.professionalEmails.length - 1}>
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
    </div>
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
            placeholder="legal@xtx396.com"
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
