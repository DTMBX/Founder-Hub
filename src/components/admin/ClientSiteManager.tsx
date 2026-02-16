/**
 * Client Site Manager
 *
 * Admin panel for managing multi-tenant client sites.
 * Provides: site list, create wizard, edit/delete, site selection.
 * Each site links to its type-specific framework manager.
 */

import { useState } from 'react'
import { useClientSites } from '@/hooks/use-client-sites'
import type { SiteType, SiteStatus, SiteSummary } from '@/lib/types'
import { generateSlug } from '@/lib/site-registry'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Trash,
  Pencil,
  Buildings,
  Storefront,
  Kanban,
  Check,
  Globe,
  CircleNotch,
  ArrowRight,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

// ─── Helpers ─────────────────────────────────────────────────

const TYPE_LABELS: Record<SiteType, string> = {
  'law-firm': 'Law Firm',
  'small-business': 'Small Business',
  agency: 'Agency',
}

const TYPE_ICONS: Record<SiteType, React.ElementType> = {
  'law-firm': Buildings,
  'small-business': Storefront,
  agency: Kanban,
}

const STATUS_COLORS: Record<SiteStatus, string> = {
  draft: 'bg-yellow-500/15 text-yellow-600',
  demo: 'bg-blue-500/15 text-blue-600',
  private: 'bg-gray-500/15 text-gray-600',
  unlisted: 'bg-orange-500/15 text-orange-600',
  public: 'bg-green-500/15 text-green-600',
}

// ─── Props ───────────────────────────────────────────────────

interface ClientSiteManagerProps {
  onNavigateToSite?: (siteId: string, siteType: SiteType) => void
}

// ─── Component ───────────────────────────────────────────────

export default function ClientSiteManager({ onNavigateToSite }: ClientSiteManagerProps) {
  const {
    sites,
    activeSite,
    setActiveSiteId,
    createSite,
    updateSite,
    deleteSite,
    loading,
    migrating,
  } = useClientSites()

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [newType, setNewType] = useState<SiteType>('law-firm')
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [creating, setCreating] = useState(false)

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [editSite, setEditSite] = useState<SiteSummary | null>(null)
  const [editName, setEditName] = useState('')
  const [editDomain, setEditDomain] = useState('')
  const [editStatus, setEditStatus] = useState<SiteStatus>('draft')

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // ── Create Handlers ────────────────────────────────────

  const handleNameChange = (name: string) => {
    setNewName(name)
    if (!slugManual) {
      setNewSlug(generateSlug(name))
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Name is required')
      return
    }
    setCreating(true)
    try {
      const site = await createSite(newType, newName.trim(), newSlug || undefined)
      toast.success(`Created ${TYPE_LABELS[newType]}: ${site.name}`)
      setCreateOpen(false)
      resetCreateForm()
      // Auto-navigate to the new site's manager
      if (onNavigateToSite) {
        onNavigateToSite(site.siteId, site.type)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create site')
    } finally {
      setCreating(false)
    }
  }

  const resetCreateForm = () => {
    setNewType('law-firm')
    setNewName('')
    setNewSlug('')
    setSlugManual(false)
  }

  // ── Edit Handlers ──────────────────────────────────────

  const openEdit = (site: SiteSummary) => {
    setEditSite(site)
    setEditName(site.name)
    setEditDomain(site.domain ?? '')
    setEditStatus(site.status)
    setEditOpen(true)
  }

  const handleEdit = async () => {
    if (!editSite) return
    try {
      await updateSite(editSite.siteId, {
        name: editName.trim() || editSite.name,
        domain: editDomain.trim() || undefined,
        status: editStatus,
      })
      toast.success('Site updated')
      setEditOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update site')
    }
  }

  // ── Delete Handler ─────────────────────────────────────

  const handleDelete = async (siteId: string) => {
    try {
      await deleteSite(siteId)
      toast.success('Site deleted')
      setDeleteConfirm(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete site')
    }
  }

  // ── Render ─────────────────────────────────────────────

  if (loading || migrating) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <CircleNotch className="h-5 w-5 animate-spin" />
        <span>{migrating ? 'Migrating legacy data...' : 'Loading sites...'}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Client Sites</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage client websites across law firms, small businesses, and agency clients.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Site
        </Button>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['law-firm', 'small-business', 'agency'] as SiteType[]).map((type) => {
          const Icon = TYPE_ICONS[type]
          const count = sites.filter((s) => s.type === type).length
          return (
            <GlassCard key={type} className="p-4">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary" weight="duotone" />
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{TYPE_LABELS[type]}s</p>
                </div>
              </div>
            </GlassCard>
          )
        })}
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary" weight="duotone" />
            <div>
              <p className="text-2xl font-bold">{sites.length}</p>
              <p className="text-xs text-muted-foreground">Total Sites</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Site list */}
      {sites.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Globe className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-lg mb-1">No client sites yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first client site to start building.
            </p>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Site
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sites.map((site) => {
            const Icon = TYPE_ICONS[site.type]
            const isActive = activeSite?.siteId === site.siteId
            return (
              <Card
                key={site.siteId}
                className={`cursor-pointer transition-all ${
                  isActive ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/30'
                }`}
                onClick={() => setActiveSiteId(site.siteId)}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  {/* Icon */}
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" weight="duotone" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{site.name}</h3>
                      {isActive && <Check className="h-4 w-4 text-primary shrink-0" weight="bold" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>/{site.slug}</span>
                      <span>·</span>
                      <span>{TYPE_LABELS[site.type]}</span>
                      {site.domain && (
                        <>
                          <span>·</span>
                          <span>{site.domain}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <Badge variant="secondary" className={STATUS_COLORS[site.status]}>
                    {site.status}
                  </Badge>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(site)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(site.siteId)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    {onNavigateToSite && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setActiveSiteId(site.siteId)
                          onNavigateToSite(site.siteId, site.type)
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Create Dialog ───────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Client Site</DialogTitle>
            <DialogDescription>
              Set up a new website for a client. Choose the site type and enter basic details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Type */}
            <div className="space-y-2">
              <Label>Site Type</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as SiteType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="law-firm">
                    <span className="flex items-center gap-2">
                      <Buildings className="h-4 w-4" /> Law Firm
                    </span>
                  </SelectItem>
                  <SelectItem value="small-business">
                    <span className="flex items-center gap-2">
                      <Storefront className="h-4 w-4" /> Small Business
                    </span>
                  </SelectItem>
                  <SelectItem value="agency">
                    <span className="flex items-center gap-2">
                      <Kanban className="h-4 w-4" /> Agency
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input
                value={newName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Smith & Associates"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label>URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/s/</span>
                <Input
                  value={newSlug}
                  onChange={(e) => {
                    setNewSlug(e.target.value)
                    setSlugManual(true)
                  }}
                  placeholder="auto-generated"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Public URL will be: /s/{newSlug || '...'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? (
                <>
                  <CircleNotch className="h-4 w-4 animate-spin mr-2" /> Creating...
                </>
              ) : (
                'Create Site'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ─────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Site</DialogTitle>
            <DialogDescription>Update site settings. Slug cannot be changed here.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Domain</Label>
              <Input
                value={editDomain}
                onChange={(e) => setEditDomain(e.target.value)}
                placeholder="example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as SiteStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="demo">Demo</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ─────────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Site</DialogTitle>
            <DialogDescription>
              This will permanently remove the site and all its data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete Site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
