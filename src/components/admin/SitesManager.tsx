import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { GlassCard } from '@/components/ui/glass-card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useKV } from '@/lib/local-storage-kv'
import { ManagedSite, SatelliteApp, SitesConfig } from '@/lib/types'
import { useSite } from '@/lib/site-context'
import { useAuthStore } from '@/lib/auth'
import { toast } from 'sonner'
import { 
  Plus, Trash, PencilSimple, Globe, Folder, TreeStructure,
  Check, X, FloppyDisk, GithubLogo, FolderOpen, Archive, ArrowCounterClockwise
} from '@phosphor-icons/react'

const SITES_KEY = 'founder-hub-sites-config'

const defaultSitesConfig: SitesConfig = {
  sites: [],
  activeSiteId: ''
}

export default function SitesManager() {
  const [config, setConfig] = useKV<SitesConfig>(SITES_KEY, defaultSitesConfig)
  const { refreshSites } = useSite()
  const { user } = useAuthStore()
  const [editingSite, setEditingSite] = useState<ManagedSite | null>(null)
  const [editingSatellite, setEditingSatellite] = useState<{ siteId: string; satellite: SatelliteApp } | null>(null)
  const [isAddingSite, setIsAddingSite] = useState(false)
  const [isAddingSatellite, setIsAddingSatellite] = useState<string | null>(null)
  
  // Confirmation dialog state for destructive actions
  const [archiveConfirm, setArchiveConfirm] = useState<{ siteId: string; siteName: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ siteId: string; siteName: string } | null>(null)
  const [deleteSatelliteConfirm, setDeleteSatelliteConfirm] = useState<{ siteId: string; satelliteId: string; satelliteName: string } | null>(null)
  
  // Active tab for showing archived/active sites
  const [viewTab, setViewTab] = useState<'active' | 'archived'>('active')

  // Filter sites by archived status
  const activeSites = (config?.sites || []).filter(s => !s.archived)
  const archivedSites = (config?.sites || []).filter(s => s.archived)

  const handleSaveSite = (site: ManagedSite) => {
    const sites = config?.sites || []
    const existing = sites.findIndex(s => s.id === site.id)
    
    let updated: ManagedSite[]
    if (existing >= 0) {
      updated = sites.map(s => s.id === site.id ? site : s)
    } else {
      updated = [...sites, site]
    }
    
    setConfig({ ...config!, sites: updated })
    setEditingSite(null)
    setIsAddingSite(false)
    toast.success('Site saved')
    refreshSites()
  }

  // Archive site (soft delete) - replaces hard delete
  const handleArchiveSite = (siteId: string) => {
    const sites = config?.sites || []
    const site = sites.find(s => s.id === siteId)
    if (!site) return
    
    const updated = sites.map(s => 
      s.id === siteId 
        ? { 
            ...s, 
            archived: true, 
            archivedAt: new Date().toISOString(),
            archivedBy: user?.email || 'unknown'
          } 
        : s
    )
    
    setConfig({ ...config!, sites: updated })
    setArchiveConfirm(null)
    toast.success(`Site "${site.name}" archived. It can be restored from the Archived tab.`)
    refreshSites()
  }

  // Restore archived site
  const handleRestoreSite = (siteId: string) => {
    const sites = config?.sites || []
    const site = sites.find(s => s.id === siteId)
    if (!site) return
    
    const updated = sites.map(s => 
      s.id === siteId 
        ? { 
            ...s, 
            archived: false, 
            archivedAt: undefined,
            archivedBy: undefined,
            archiveReason: undefined
          } 
        : s
    )
    
    setConfig({ ...config!, sites: updated })
    toast.success(`Site "${site.name}" restored`)
    setViewTab('active')
    refreshSites()
  }

  // Permanent delete (only for archived sites, requires typed confirmation)
  const handlePermanentDeleteSite = (siteId: string) => {
    const sites = (config?.sites || []).filter(s => s.id !== siteId)
    setConfig({ ...config!, sites })
    setDeleteConfirm(null)
    toast.success('Site permanently deleted')
    refreshSites()
  }

  const handleSaveSatellite = (siteId: string, satellite: SatelliteApp) => {
    const sites = config?.sites || []
    const site = sites.find(s => s.id === siteId)
    if (!site) return
    
    const satellites = site.satellites || []
    const existing = satellites.findIndex(s => s.id === satellite.id)
    
    let updated: SatelliteApp[]
    if (existing >= 0) {
      updated = satellites.map(s => s.id === satellite.id ? satellite : s)
    } else {
      updated = [...satellites, satellite]
    }
    
    const updatedSite = { ...site, satellites: updated }
    const updatedSites = sites.map(s => s.id === siteId ? updatedSite : s)
    
    setConfig({ ...config!, sites: updatedSites })
    setEditingSatellite(null)
    setIsAddingSatellite(null)
    toast.success('Satellite app saved')
    refreshSites()
  }

  const handleDeleteSatellite = (siteId: string, satelliteId: string) => {
    const sites = config?.sites || []
    const site = sites.find(s => s.id === siteId)
    if (!site) return
    
    const satellites = (site.satellites || []).filter(s => s.id !== satelliteId)
    const updatedSite = { ...site, satellites }
    const updatedSites = sites.map(s => s.id === siteId ? updatedSite : s)
    
    setConfig({ ...config!, sites: updatedSites })
    setDeleteSatelliteConfirm(null)
    toast.success('Satellite removed')
    refreshSites()
  }

  const createEmptySite = (): ManagedSite => ({
    id: `site-${Date.now()}`,
    name: '',
    description: '',
    repo: '',
    dataPath: '/public/data',
    localPath: '',
    type: 'primary',
    enabled: true,
    satellites: []
  })

  const createEmptySatellite = (): SatelliteApp => ({
    id: `sat-${Date.now()}`,
    name: '',
    path: '',
    dataPath: '/public/data',
    enabled: true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sites Manager</h2>
          <p className="text-muted-foreground">Configure repositories and satellite apps for multi-site control.</p>
        </div>
        <Button onClick={() => { setIsAddingSite(true); setEditingSite(createEmptySite()) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Site
        </Button>
      </div>

      {/* Active/Archived Tabs */}
      <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as 'active' | 'archived')}>
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeSites.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({archivedSites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <div className="grid gap-4">
            {activeSites.map((site) => (
              <GlassCard key={site.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Globe className="h-5 w-5 text-primary" weight="duotone" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{site.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${site.enabled ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                        {site.enabled ? 'Active' : 'Disabled'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                        {site.type}
                      </span>
                    </div>
                    {site.description && (
                      <p className="text-sm text-muted-foreground mt-1">{site.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GithubLogo className="h-3 w-3" />
                        {site.repo}
                      </span>
                      <span className="flex items-center gap-1">
                        <FolderOpen className="h-3 w-3" />
                        {site.dataPath}
                      </span>
                    </div>

                    {/* Satellite Apps */}
                    {site.satellites && site.satellites.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <TreeStructure className="h-3 w-3" />
                          <span>Satellite Apps ({site.satellites.length})</span>
                        </div>
                        <div className="grid gap-2 ml-4">
                          {site.satellites.filter(s => !s.archived).map((satellite) => (
                            <div 
                              key={satellite.id} 
                              className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border/50"
                            >
                              <div className="flex items-center gap-2">
                                <Folder className="h-4 w-4 text-primary" weight="duotone" />
                                <span className="text-sm font-medium">{satellite.name}</span>
                                <span className="text-xs text-muted-foreground">({satellite.path})</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0"
                                  onClick={() => setEditingSatellite({ siteId: site.id, satellite })}
                                >
                                  <PencilSimple className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteSatelliteConfirm({ 
                                    siteId: site.id, 
                                    satelliteId: satellite.id, 
                                    satelliteName: satellite.name 
                                  })}
                                >
                                  <Trash className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsAddingSatellite(site.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Satellite
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditingSite(site)}
                    >
                      <PencilSimple className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-amber-500 hover:text-amber-500"
                      onClick={() => setArchiveConfirm({ siteId: site.id, siteName: site.name })}
                      title="Archive site"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}

            {activeSites.length === 0 && (
              <GlassCard className="p-8 text-center">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" weight="duotone" />
                <h3 className="font-semibold mb-2">No active sites</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add a site to start managing multiple repositories from this admin panel.
                </p>
                <Button onClick={() => { setIsAddingSite(true); setEditingSite(createEmptySite()) }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Site
                </Button>
              </GlassCard>
            )}
          </div>
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          <div className="grid gap-4">
            {archivedSites.map((site) => (
              <GlassCard key={site.id} className="p-4 border-dashed opacity-75">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Archive className="h-5 w-5 text-muted-foreground" weight="duotone" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-muted-foreground">{site.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        Archived
                      </span>
                    </div>
                    {site.description && (
                      <p className="text-sm text-muted-foreground mt-1">{site.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GithubLogo className="h-3 w-3" />
                        {site.repo}
                      </span>
                      {site.archivedAt && (
                        <span>Archived: {new Date(site.archivedAt).toLocaleDateString()}</span>
                      )}
                      {site.archivedBy && (
                        <span>By: {site.archivedBy}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRestoreSite(site.id)}
                    >
                      <ArrowCounterClockwise className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm({ siteId: site.id, siteName: site.name })}
                      title="Permanently delete"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}

            {archivedSites.length === 0 && (
              <GlassCard className="p-8 text-center">
                <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" weight="duotone" />
                <h3 className="font-semibold mb-2">No archived sites</h3>
                <p className="text-sm text-muted-foreground">
                  When you archive a site, it will appear here for later restoration.
                </p>
              </GlassCard>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Site Dialog */}
      <Dialog open={!!editingSite} onOpenChange={() => { setEditingSite(null); setIsAddingSite(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAddingSite ? 'Add Site' : 'Edit Site'}</DialogTitle>
            <DialogDescription>
              Configure repository settings for this site.
            </DialogDescription>
          </DialogHeader>
          {editingSite && (
            <SiteForm 
              site={editingSite} 
              onSave={handleSaveSite} 
              onCancel={() => { setEditingSite(null); setIsAddingSite(false) }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Satellite Dialog */}
      <Dialog open={!!isAddingSatellite} onOpenChange={() => setIsAddingSatellite(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Satellite App</DialogTitle>
            <DialogDescription>
              Add a satellite app from within this repository.
            </DialogDescription>
          </DialogHeader>
          {isAddingSatellite && (
            <SatelliteForm
              satellite={createEmptySatellite()}
              onSave={(sat) => handleSaveSatellite(isAddingSatellite, sat)}
              onCancel={() => setIsAddingSatellite(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Satellite Dialog */}
      <Dialog open={!!editingSatellite} onOpenChange={() => setEditingSatellite(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Satellite App</DialogTitle>
            <DialogDescription>
              Update satellite app configuration.
            </DialogDescription>
          </DialogHeader>
          {editingSatellite && (
            <SatelliteForm
              satellite={editingSatellite.satellite}
              onSave={(sat) => handleSaveSatellite(editingSatellite.siteId, sat)}
              onCancel={() => setEditingSatellite(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Archive Site Confirmation */}
      <ConfirmDialog
        open={!!archiveConfirm}
        onOpenChange={(open) => !open && setArchiveConfirm(null)}
        title="Archive Site"
        description={`Are you sure you want to archive "${archiveConfirm?.siteName}"? The site will be moved to the Archived tab and can be restored later.`}
        intent="archive"
        confirmationType="simple"
        onConfirm={() => archiveConfirm && handleArchiveSite(archiveConfirm.siteId)}
      />

      {/* Permanent Delete Confirmation (typed) */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Permanently Delete Site"
        description={`This action cannot be undone. The site configuration for "${deleteConfirm?.siteName}" will be permanently removed.`}
        intent="delete"
        confirmationType="typed-slug"
        confirmText={deleteConfirm?.siteName}
        onConfirm={() => deleteConfirm && handlePermanentDeleteSite(deleteConfirm.siteId)}
      />

      {/* Delete Satellite Confirmation (typed) */}
      <ConfirmDialog
        open={!!deleteSatelliteConfirm}
        onOpenChange={(open) => !open && setDeleteSatelliteConfirm(null)}
        title="Remove Satellite App"
        description={`Are you sure you want to remove the satellite app "${deleteSatelliteConfirm?.satelliteName}"?`}
        intent="delete"
        confirmationType="typed"
        confirmText="DELETE"
        onConfirm={() => deleteSatelliteConfirm && handleDeleteSatellite(deleteSatelliteConfirm.siteId, deleteSatelliteConfirm.satelliteId)}
      />
    </div>
  )
}

// ─── Site Form ──────────────────────────────────────────

interface SiteFormProps {
  site: ManagedSite
  onSave: (site: ManagedSite) => void
  onCancel: () => void
}

function SiteForm({ site, onSave, onCancel }: SiteFormProps) {
  const [form, setForm] = useState(site)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.repo.trim()) {
      toast.error('Name and repository are required')
      return
    }
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Site Name</Label>
          <Input 
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="My Site"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Input 
            id="description"
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description of the site"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="repo">GitHub Repository</Label>
          <Input 
            id="repo"
            value={form.repo}
            onChange={(e) => setForm({ ...form, repo: e.target.value })}
            placeholder="owner/repo-name"
          />
          <p className="text-xs text-muted-foreground">Format: owner/repository</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="dataPath">Data Path</Label>
          <Input 
            id="dataPath"
            value={form.dataPath}
            onChange={(e) => setForm({ ...form, dataPath: e.target.value })}
            placeholder="/public/data"
          />
          <p className="text-xs text-muted-foreground">Path to JSON data files in the repo</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="localPath">Local Path (optional)</Label>
          <Input 
            id="localPath"
            value={form.localPath}
            onChange={(e) => setForm({ ...form, localPath: e.target.value })}
            placeholder="C:/web-dev/github-repos/my-site"
          />
          <p className="text-xs text-muted-foreground">Filesystem path for local development</p>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="type">Site Type</Label>
          <select
            id="type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as 'primary' | 'worktree' })}
            className="px-3 py-2 rounded-md bg-background border border-border text-sm"
          >
            <option value="primary">Primary</option>
            <option value="worktree">Worktree (with satellites)</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="enabled">Enabled</Label>
          <Switch 
            id="enabled"
            checked={form.enabled}
            onCheckedChange={(checked) => setForm({ ...form, enabled: checked })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <FloppyDisk className="h-4 w-4 mr-2" />
          Save Site
        </Button>
      </div>
    </form>
  )
}

// ─── Satellite Form ──────────────────────────────────────

interface SatelliteFormProps {
  satellite: SatelliteApp
  onSave: (satellite: SatelliteApp) => void
  onCancel: () => void
}

function SatelliteForm({ satellite, onSave, onCancel }: SatelliteFormProps) {
  const [form, setForm] = useState(satellite)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.path.trim()) {
      toast.error('Name and path are required')
      return
    }
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="sat-name">App Name</Label>
          <Input 
            id="sat-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="My App"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sat-path">App Path</Label>
          <Input 
            id="sat-path"
            value={form.path}
            onChange={(e) => setForm({ ...form, path: e.target.value })}
            placeholder="apps/my-app"
          />
          <p className="text-xs text-muted-foreground">Relative path within the repo</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sat-dataPath">Data Path</Label>
          <Input 
            id="sat-dataPath"
            value={form.dataPath}
            onChange={(e) => setForm({ ...form, dataPath: e.target.value })}
            placeholder="/public/data"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sat-description">Description (optional)</Label>
          <Input 
            id="sat-description"
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="sat-enabled">Enabled</Label>
          <Switch 
            id="sat-enabled"
            checked={form.enabled}
            onCheckedChange={(checked) => setForm({ ...form, enabled: checked })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <FloppyDisk className="h-4 w-4 mr-2" />
          Save Satellite
        </Button>
      </div>
    </form>
  )
}
