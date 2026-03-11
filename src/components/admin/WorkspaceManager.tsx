/**
 * WorkspaceManager.tsx — Multi-workspace management panel.
 *
 * Allows users to:
 *  - View all connected workspaces (built-in + user-added)
 *  - Connect a new GitHub repo (any account)
 *  - Open a local project directory (File System Access API)
 *  - Switch active workspace
 *  - Configure workspace settings (branch, data path, content keys)
 *  - Remove user-added workspaces
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Plus, GithubLogo, FolderOpen, Trash, Pencil, Check, X,
  Globe, HardDrive, GitBranch, CaretRight, ArrowsClockwise,
  MagnifyingGlass, CircleNotch, Lightning, Database, Info,
  FolderSimple,
} from '@phosphor-icons/react'
import {
  loadWorkspaces, addWorkspace, removeWorkspace, updateWorkspace,
  SCHEMA_TEMPLATES,
  type WorkspaceDef, type SchemaTemplate, type ContentKeyDef,
} from '@/lib/workspace-registry'
import {
  listUserRepos, listOwnerRepos, probeRepoDataDir, hasGitHubToken,
  type GitHubRepoInfo,
} from '@/lib/github-sync'
import {
  supportsFileSystemAccess, openDirectoryPicker, analyzeProject,
  saveDirectoryHandle,
  type LocalProject,
} from '@/lib/fs-bridge'
import { cn } from '@/lib/utils'

// ─── Sub-components ─────────────────────────────────────────────────────────

function WorkspaceCard({
  ws,
  isActive,
  onSelect,
  onEdit,
  onRemove,
}: {
  ws: WorkspaceDef
  isActive: boolean
  onSelect: () => void
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 transition-all cursor-pointer hover:shadow-md',
        isActive
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'border-border bg-card hover:border-primary/30'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{ws.name}</h3>
            {ws.builtIn && (
              <Badge variant="secondary" className="text-[9px] px-1.5">BUILT-IN</Badge>
            )}
            {isActive && (
              <Badge variant="default" className="text-[9px] px-1.5">ACTIVE</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{ws.description}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {ws.remote && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <GithubLogo className="h-3 w-3" />
                {ws.remote.owner}/{ws.remote.repo}
              </span>
            )}
            {ws.remote?.branch && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                {ws.remote.branch}
              </span>
            )}
            {ws.localPath && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <FolderSimple className="h-3 w-3" />
                {ws.localPath}
              </span>
            )}
            {ws.domain && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Globe className="h-3 w-3" />
                {ws.domain}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Database className="h-3 w-3" />
              {ws.contentKeys.length} keys
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {!ws.builtIn && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onRemove} title="Remove">
              <Trash className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Connect GitHub Repo Flow ───────────────────────────────────────────────

function ConnectGitHubFlow({
  onConnect,
  onCancel,
}: {
  onConnect: (ws: Omit<WorkspaceDef, 'createdAt' | 'builtIn'>) => void
  onCancel: () => void
}) {
  const [step, setStep] = useState<'search' | 'configure'>('search')
  const [repos, setRepos] = useState<GitHubRepoInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [ownerSearch, setOwnerSearch] = useState('')
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepoInfo | null>(null)

  // Config step
  const [dataPath, setDataPath] = useState('public/data')
  const [schemaId, setSchemaId] = useState('generic')
  const [probedFiles, setProbedFiles] = useState<string[]>([])
  const [probing, setProbing] = useState(false)

  const loadRepos = useCallback(async (owner?: string) => {
    setLoading(true)
    const result = owner
      ? await listOwnerRepos(owner, { per_page: 50 })
      : await listUserRepos({ per_page: 50, sort: 'updated' })
    setRepos(result.repos)
    if (result.error) toast.error(result.error)
    setLoading(false)
  }, [])

  useEffect(() => { loadRepos() }, [loadRepos])

  const handleSearchOwner = () => {
    if (ownerSearch.trim()) loadRepos(ownerSearch.trim())
  }

  const handleSelectRepo = async (repo: GitHubRepoInfo) => {
    setSelectedRepo(repo)
    setStep('configure')
    // Auto-probe for data directory
    setProbing(true)
    const [owner, repoName] = repo.full_name.split('/')
    const result = await probeRepoDataDir(owner, repoName, 'public/data', repo.default_branch)
    if (result.files.length > 0) {
      setDataPath('public/data')
      setProbedFiles(result.files)
    } else {
      // Try other common paths
      for (const path of ['data', 'src/data', 'static/data']) {
        const r = await probeRepoDataDir(owner, repoName, path, repo.default_branch)
        if (r.files.length > 0) {
          setDataPath(path)
          setProbedFiles(r.files)
          break
        }
      }
    }
    setProbing(false)
  }

  const handleProbe = async () => {
    if (!selectedRepo) return
    setProbing(true)
    const [owner, repoName] = selectedRepo.full_name.split('/')
    const result = await probeRepoDataDir(owner, repoName, dataPath, selectedRepo.default_branch)
    setProbedFiles(result.files)
    if (result.error) toast.error(result.error)
    setProbing(false)
  }

  const handleConnect = () => {
    if (!selectedRepo) return
    const [owner, repo] = selectedRepo.full_name.split('/')
    const template = SCHEMA_TEMPLATES.find(s => s.id === schemaId)
    const id = selectedRepo.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')

    onConnect({
      id,
      name: selectedRepo.name,
      description: selectedRepo.description || '',
      namespace: id,
      remote: {
        owner,
        repo,
        branch: selectedRepo.default_branch,
        dataPath,
      },
      localPath: null,
      schemaId,
      contentKeys: template?.keys || SCHEMA_TEMPLATES[0].keys,
      previewUrl: '',
      domain: '',
      enabled: true,
    })
  }

  const filteredRepos = search
    ? repos.filter(r =>
        r.full_name.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase())
      )
    : repos

  if (step === 'configure' && selectedRepo) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setStep('search')}>
            <CaretRight className="h-3.5 w-3.5 rotate-180" /> Back
          </Button>
          <h3 className="text-sm font-semibold">Configure: {selectedRepo.full_name}</h3>
        </div>

        {/* Data path */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Data Directory Path</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={dataPath}
              onChange={e => setDataPath(e.target.value)}
              placeholder="public/data"
              className="flex-1 h-8 rounded-md border border-border bg-background px-3 text-sm"
            />
            <Button variant="outline" size="sm" onClick={handleProbe} disabled={probing}>
              {probing ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <MagnifyingGlass className="h-3.5 w-3.5" />}
              Probe
            </Button>
          </div>
          {probedFiles.length > 0 && (
            <div className="text-[10px] text-emerald-600 flex flex-wrap gap-1 mt-1">
              <span className="font-medium">Found:</span>
              {probedFiles.map(f => (
                <Badge key={f} variant="secondary" className="text-[9px]">{f}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Schema template */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Content Schema</label>
          <div className="grid grid-cols-2 gap-2">
            {SCHEMA_TEMPLATES.map(tmpl => (
              <button
                key={tmpl.id}
                onClick={() => setSchemaId(tmpl.id)}
                className={cn(
                  'rounded-lg border p-2.5 text-left transition-all',
                  schemaId === tmpl.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border hover:border-primary/30'
                )}
              >
                <span className="text-xs font-medium">{tmpl.label}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">{tmpl.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="default" size="sm" onClick={handleConnect} className="gap-1.5">
            <Lightning className="h-3.5 w-3.5" /> Connect Workspace
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold flex-1">Connect GitHub Repository</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Search own repos */}
      <div className="space-y-2">
        <div className="relative">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter your repositories..."
            className="w-full h-8 rounded-md border border-border bg-background pl-8 pr-3 text-sm"
          />
        </div>

        {/* Search other owners */}
        <div className="flex gap-2">
          <input
            type="text"
            value={ownerSearch}
            onChange={e => setOwnerSearch(e.target.value)}
            placeholder="Other GitHub username..."
            className="flex-1 h-8 rounded-md border border-border bg-background px-3 text-sm"
            onKeyDown={e => e.key === 'Enter' && handleSearchOwner()}
          />
          <Button variant="outline" size="sm" onClick={handleSearchOwner} disabled={loading}>
            {loading ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <ArrowsClockwise className="h-3.5 w-3.5" />}
            Load
          </Button>
        </div>
      </div>

      {/* Repo list */}
      <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1">
        {loading && repos.length === 0 && (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            <CircleNotch className="h-5 w-5 animate-spin mr-2" /> Loading repositories...
          </div>
        )}
        {filteredRepos.map(repo => (
          <button
            key={repo.full_name}
            onClick={() => handleSelectRepo(repo)}
            className="w-full rounded-lg border border-border p-3 text-left hover:border-primary/30 hover:bg-muted/30 transition-all"
          >
            <div className="flex items-center gap-2">
              <GithubLogo className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium truncate">{repo.full_name}</span>
              {repo.private && (
                <Badge variant="outline" className="text-[9px] px-1">Private</Badge>
              )}
            </div>
            {repo.description && (
              <p className="text-[10px] text-muted-foreground mt-0.5 ml-6 truncate">{repo.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1 ml-6">
              {repo.language && (
                <span className="text-[10px] text-muted-foreground">{repo.language}</span>
              )}
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <GitBranch className="h-2.5 w-2.5" /> {repo.default_branch}
              </span>
            </div>
          </button>
        ))}
        {!loading && filteredRepos.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-6">No repositories found</p>
        )}
      </div>
    </div>
  )
}

// ─── Connect Local Flow ─────────────────────────────────────────────────────

function ConnectLocalFlow({
  onConnect,
  onCancel,
}: {
  onConnect: (ws: Omit<WorkspaceDef, 'createdAt' | 'builtIn'>, handle: FileSystemDirectoryHandle) => void
  onCancel: () => void
}) {
  const [project, setProject] = useState<LocalProject | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [schemaId, setSchemaId] = useState('generic')

  const handlePickDirectory = async () => {
    const handle = await openDirectoryPicker()
    if (!handle) return
    setAnalyzing(true)
    const proj = await analyzeProject(handle)
    setProject(proj)
    setAnalyzing(false)
  }

  const handleConnect = () => {
    if (!project) return
    const template = SCHEMA_TEMPLATES.find(s => s.id === schemaId)
    const id = project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')

    // If we detected data files, build content keys from them
    let contentKeys: ContentKeyDef[] = template?.keys || SCHEMA_TEMPLATES[0].keys
    if (project.dataFiles.length > 0) {
      contentKeys = project.dataFiles.map(f => {
        const suffix = f.replace('.json', '')
        return { suffix, filename: f, label: suffix.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }
      })
    }

    onConnect(
      {
        id,
        name: project.name,
        description: `Local project: ${project.name}`,
        namespace: id,
        remote: null,
        localPath: project.name,
        schemaId,
        contentKeys,
        previewUrl: '',
        domain: '',
        enabled: true,
      },
      project.handle,
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold flex-1">Open Local Project</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {!supportsFileSystemAccess() ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium text-amber-600">File System Access not supported</p>
          <p className="text-xs text-amber-600/80 mt-1">
            This feature requires Chrome or Edge 86+. Use the GitHub workflow instead, or run the Vite dev server locally.
          </p>
        </div>
      ) : !project ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <FolderOpen className="h-12 w-12 text-muted-foreground/50" weight="duotone" />
          <p className="text-sm text-muted-foreground">Select a project directory to analyze</p>
          <Button onClick={handlePickDirectory} disabled={analyzing} className="gap-2">
            {analyzing ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
            Choose Directory
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Project info */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <FolderSimple className="h-4 w-4 text-primary" weight="duotone" />
              <span className="font-medium text-sm">{project.name}</span>
              <Badge variant="secondary" className="text-[9px]">{project.projectType}</Badge>
            </div>
            <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
              {project.dataPath && <p>Data: {project.dataPath}/ ({project.dataFiles.length} JSON files)</p>}
              {project.hasPackageJson && <p>Has package.json</p>}
              {project.hasCNAME && <p>Has CNAME (GitHub Pages)</p>}
            </div>
            {project.dataFiles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {project.dataFiles.map(f => (
                  <Badge key={f} variant="outline" className="text-[9px]">{f}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Schema selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Content Schema</label>
            <div className="grid grid-cols-2 gap-2">
              {SCHEMA_TEMPLATES.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => setSchemaId(tmpl.id)}
                  className={cn(
                    'rounded-lg border p-2 text-left transition-all',
                    schemaId === tmpl.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  <span className="text-xs font-medium">{tmpl.label}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{tmpl.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="default" size="sm" onClick={handleConnect} className="gap-1.5">
              <Lightning className="h-3.5 w-3.5" /> Connect Workspace
            </Button>
            <Button variant="outline" size="sm" onClick={handlePickDirectory}>
              <FolderOpen className="h-3.5 w-3.5 mr-1" /> Choose Different
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function WorkspaceManager() {
  const [workspaces, setWorkspaces] = useState<WorkspaceDef[]>([])
  const [activeId, setActiveId] = useState<string>('founder-hub')
  const [flow, setFlow] = useState<'none' | 'github' | 'local'>('none')
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    setWorkspaces(loadWorkspaces())
    const stored = localStorage.getItem('workspace-active-site')
    if (stored) setActiveId(stored)
    hasGitHubToken().then(setHasToken)
  }, [])

  const handleSelectWorkspace = useCallback((id: string) => {
    setActiveId(id)
    localStorage.setItem('workspace-active-site', id)
    toast.success(`Switched to ${workspaces.find(w => w.id === id)?.name || id}`)
  }, [workspaces])

  const handleConnectGitHub = useCallback((ws: Omit<WorkspaceDef, 'createdAt' | 'builtIn'>) => {
    try {
      addWorkspace(ws)
      setWorkspaces(loadWorkspaces())
      setFlow('none')
      toast.success(`Connected: ${ws.name}`)
    } catch (e: any) {
      toast.error(e.message)
    }
  }, [])

  const handleConnectLocal = useCallback(async (
    ws: Omit<WorkspaceDef, 'createdAt' | 'builtIn'>,
    handle: FileSystemDirectoryHandle,
  ) => {
    try {
      addWorkspace(ws)
      await saveDirectoryHandle(ws.id, handle)
      setWorkspaces(loadWorkspaces())
      setFlow('none')
      toast.success(`Connected local: ${ws.name}`)
    } catch (e: any) {
      toast.error(e.message)
    }
  }, [])

  const handleRemove = useCallback((id: string) => {
    if (!confirm('Remove this workspace? Data in localStorage will remain.')) return
    removeWorkspace(id)
    setWorkspaces(loadWorkspaces())
    if (activeId === id) {
      setActiveId('founder-hub')
      localStorage.setItem('workspace-active-site', 'founder-hub')
    }
    toast.success('Workspace removed')
  }, [activeId])

  const handleEdit = useCallback((ws: WorkspaceDef) => {
    // For now just show info — a full edit form would be added later
    toast.info(`${ws.name}: ${ws.contentKeys.length} content keys, schema: ${ws.schemaId}`)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Workspaces</h2>
          <p className="text-sm text-muted-foreground">Connect GitHub repos or local projects to the web builder</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFlow('github')}
            disabled={!hasToken || flow !== 'none'}
            className="gap-1.5"
          >
            <GithubLogo className="h-3.5 w-3.5" /> Connect Repo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFlow('local')}
            disabled={!supportsFileSystemAccess() || flow !== 'none'}
            className="gap-1.5"
          >
            <HardDrive className="h-3.5 w-3.5" /> Open Local
          </Button>
        </div>
      </div>

      {/* Info banner */}
      {!hasToken && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-400 flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">GitHub token needed</p>
            <p className="text-blue-400/80 mt-0.5">Go to Settings and add your Personal Access Token to browse and connect GitHub repositories.</p>
          </div>
        </div>
      )}

      {/* Connection Flows */}
      {flow === 'github' && (
        <div className="rounded-lg border border-border bg-card p-4">
          <ConnectGitHubFlow onConnect={handleConnectGitHub} onCancel={() => setFlow('none')} />
        </div>
      )}
      {flow === 'local' && (
        <div className="rounded-lg border border-border bg-card p-4">
          <ConnectLocalFlow onConnect={handleConnectLocal} onCancel={() => setFlow('none')} />
        </div>
      )}

      {/* Workspace Grid */}
      <div className="space-y-3">
        {workspaces.map(ws => (
          <WorkspaceCard
            key={ws.id}
            ws={ws}
            isActive={ws.id === activeId}
            onSelect={() => handleSelectWorkspace(ws.id)}
            onEdit={() => handleEdit(ws)}
            onRemove={() => handleRemove(ws.id)}
          />
        ))}
      </div>

      {/* Capabilities info */}
      <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-2 text-xs text-muted-foreground">
        <h4 className="font-medium text-foreground text-sm">Web Builder Capabilities</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-start gap-2">
            <GithubLogo className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Any GitHub Repo</p>
              <p>Connect repos from any account. Publish directly or via PR.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <HardDrive className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Local Projects</p>
              <p>Open any directory on your machine. Read/write JSON data files directly.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Database className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Content Schemas</p>
              <p>Portfolio, docs, blog, e-commerce — or define custom data structure.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Lightning className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Zero Config</p>
              <p>Auto-detects data directories and project type. Start editing immediately.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
