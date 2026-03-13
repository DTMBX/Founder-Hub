/**
 * DevToolsPanel.tsx — Developer tools for the web builder.
 *
 * Provides:
 *  - Environment info (build mode, storage usage, feature flags)
 *  - File browser (workspace API repos and local FS)
 *  - API tester (test GitHub token against any repo)
 *  - Data inspector (browse all KV keys, edit raw JSON)
 *  - Workspace API status
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Terminal, Database, Globe, HardDrive, ArrowsClockwise,
  CircleNotch, CaretRight, Trash, Copy, Check, Warning,
  FolderSimple, File, Eye, Pencil, Code, Lightning,
  GithubLogo, GitBranch, Info,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { isLocalhost } from '@/lib/local-storage-kv'
import { testGitHubToken, getGitHubToken, hasGitHubToken } from '@/lib/github-sync'
import { loadWorkspaces, type WorkspaceDef } from '@/lib/workspace-registry'

// ─── Environment Info ───────────────────────────────────────────────────────

function EnvironmentSection() {
  const [storageUsed, setStorageUsed] = useState<string>('...')
  const [kvKeyCount, setKvKeyCount] = useState(0)

  useEffect(() => {
    // Calculate localStorage usage
    let total = 0
    let fhKeys = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      const val = localStorage.getItem(key)
      if (val) total += key.length + val.length
      if (key.startsWith('founder-hub:')) fhKeys++
    }
    setStorageUsed(`${(total * 2 / 1024).toFixed(1)} KB`) // UTF-16, 2 bytes per char
    setKvKeyCount(fhKeys)
  }, [])

  // Quick vitals & crash summary
  const vitalsCount = (() => { try { return JSON.parse(localStorage.getItem('founder-hub:web-vitals') || '[]').length } catch { return 0 } })()
  const crashCount = (() => { try { return JSON.parse(localStorage.getItem('founder-hub:crash-log') || '[]').length } catch { return 0 } })()

  const rows = [
    ['Build Mode', import.meta.env.DEV ? 'Development' : 'Production'],
    ['Localhost', isLocalhost() ? 'Yes' : 'No'],
    ['User Agent', navigator.userAgent.split(' ').slice(-2).join(' ')],
    ['Screen', `${screen.width}x${screen.height}`],
    ['localStorage Keys', `${localStorage.length} total, ${kvKeyCount} founder-hub`],
    ['Storage Used', storageUsed],
    ['Web Vitals', `${vitalsCount} entries`],
    ['Crash Log', crashCount > 0 ? `⚠ ${crashCount} crash${crashCount !== 1 ? 'es' : ''}` : '0 crashes'],
    ['File System API', 'showDirectoryPicker' in window ? 'Supported' : 'Not supported'],
    ['Service Worker', 'serviceWorker' in navigator ? (navigator.serviceWorker.controller ? 'Active' : 'Registered') : 'Not supported'],
  ]

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Info className="h-4 w-4 text-primary" weight="duotone" /> Environment
      </h3>
      <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
        <table className="w-full text-xs">
          <tbody>
            {rows.map(([label, value], i) => (
              <tr key={label} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                <td className="px-3 py-1.5 font-medium text-muted-foreground w-40">{label}</td>
                <td className="px-3 py-1.5 font-mono">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── KV Data Inspector ──────────────────────────────────────────────────────

function DataInspector() {
  const [keys, setKeys] = useState<{ key: string; size: number }[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editing, setEditing] = useState(false)
  const [filter, setFilter] = useState('')

  const refresh = useCallback(() => {
    const kvKeys: { key: string; size: number }[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      const val = localStorage.getItem(k)
      kvKeys.push({ key: k, size: val?.length ?? 0 })
    }
    kvKeys.sort((a, b) => a.key.localeCompare(b.key))
    setKeys(kvKeys)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const filtered = filter
    ? keys.filter(k => k.key.toLowerCase().includes(filter.toLowerCase()))
    : keys

  const handleSelect = (key: string) => {
    setSelectedKey(key)
    const val = localStorage.getItem(key)
    try {
      setEditValue(JSON.stringify(JSON.parse(val || ''), null, 2))
    } catch {
      setEditValue(val || '')
    }
    setEditing(false)
  }

  const handleSave = () => {
    if (!selectedKey) return
    try {
      // Validate JSON
      JSON.parse(editValue)
      localStorage.setItem(selectedKey, editValue)
      toast.success(`Saved: ${selectedKey}`)
      setEditing(false)
      refresh()
    } catch (e) {
      toast.error('Invalid JSON')
    }
  }

  const handleDelete = (key: string) => {
    localStorage.removeItem(key)
    if (selectedKey === key) { setSelectedKey(null); setEditValue('') }
    refresh()
    toast.success(`Deleted: ${key}`)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(editValue)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Database className="h-4 w-4 text-primary" weight="duotone" /> Data Inspector
        <Badge variant="secondary" className="text-[9px] ml-auto">{keys.length} keys</Badge>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refresh}><ArrowsClockwise className="h-3 w-3" /></Button>
      </h3>

      <input
        type="text"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Filter keys..."
        className="w-full h-7 rounded-md border border-border bg-background px-2.5 text-xs"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2" style={{ maxHeight: 400 }}>
        {/* Key list */}
        <div className="overflow-y-auto space-y-0.5 max-h-[400px] pr-1">
          {filtered.map(({ key, size }) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className={cn(
                'w-full rounded px-2 py-1 text-left text-[10px] font-mono transition-colors flex items-center gap-1.5',
                selectedKey === key
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted/50 text-foreground'
              )}
            >
              <span className="truncate flex-1">{key}</span>
              <span className="text-muted-foreground shrink-0">{(size * 2 / 1024).toFixed(1)}K</span>
              <button
                className="shrink-0 text-destructive/60 hover:text-destructive"
                onClick={e => { e.stopPropagation(); handleDelete(key) }}
              >
                <Trash className="h-2.5 w-2.5" />
              </button>
            </button>
          ))}
        </div>

        {/* Value editor */}
        {selectedKey && (
          <div className="border border-border rounded-lg overflow-hidden flex flex-col max-h-[400px]">
            <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-muted/30">
              <span className="text-[10px] font-mono truncate flex-1 text-muted-foreground">{selectedKey}</span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleCopy}><Copy className="h-2.5 w-2.5" /></Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setEditing(!editing)}>
                {editing ? <Eye className="h-2.5 w-2.5" /> : <Pencil className="h-2.5 w-2.5" />}
              </Button>
              {editing && (
                <Button variant="ghost" size="icon" className="h-5 w-5 text-emerald-500" onClick={handleSave}><Check className="h-2.5 w-2.5" /></Button>
              )}
            </div>
            <textarea
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              readOnly={!editing}
              className="flex-1 p-2 text-[10px] font-mono bg-background resize-none focus:outline-none"
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── GitHub API Tester ──────────────────────────────────────────────────────

function APITester() {
  const [repoPath, setRepoPath] = useState('')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => { hasGitHubToken().then(setHasToken) }, [])

  const handleTest = async () => {
    const token = await getGitHubToken()
    if (!token) { toast.error('No token'); return }
    setTesting(true)
    setResult(null)
    const res = await testGitHubToken(token, repoPath || undefined)
    setResult(res.valid ? 'Valid — token has access' : `Failed: ${res.error}`)
    setTesting(false)
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <GithubLogo className="h-4 w-4 text-primary" weight="duotone" /> API Tester
        {hasToken && <Badge variant="secondary" className="text-[9px]">Token Set</Badge>}
      </h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={repoPath}
          onChange={e => setRepoPath(e.target.value)}
          placeholder="owner/repo (blank = default)"
          className="flex-1 h-7 rounded-md border border-border bg-background px-2.5 text-xs font-mono"
        />
        <Button variant="outline" size="sm" onClick={handleTest} disabled={testing || !hasToken} className="h-7 text-xs gap-1">
          {testing ? <CircleNotch className="h-3 w-3 animate-spin" /> : <Lightning className="h-3 w-3" />}
          Test
        </Button>
      </div>
      {result && (
        <p className={cn('text-xs px-2 py-1 rounded', result.startsWith('Valid') ? 'text-emerald-600 bg-emerald-500/10' : 'text-red-500 bg-red-500/10')}>
          {result}
        </p>
      )}
    </div>
  )
}

// ─── Workspace API Status ───────────────────────────────────────────────────

function WorkspaceAPIStatus() {
  const [repos, setRepos] = useState<Array<{ key: string; exists: boolean }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const check = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/__workspace/repos')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setRepos(data)
    } catch (e: any) {
      setError(e.message || 'Failed to connect')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isLocalhost()) check()
  }, [])

  if (!isLocalhost()) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" weight="duotone" /> Workspace API
        </h3>
        <p className="text-xs text-muted-foreground">Only available on localhost with Vite dev server</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Terminal className="h-4 w-4 text-primary" weight="duotone" /> Workspace API
        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={check}>
          {loading ? <CircleNotch className="h-3 w-3 animate-spin" /> : <ArrowsClockwise className="h-3 w-3" />}
        </Button>
      </h3>
      {error ? (
        <p className="text-xs text-red-500 bg-red-500/10 rounded px-2 py-1">{error}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {repos.map(r => (
            <div
              key={r.key}
              className={cn(
                'rounded border px-2 py-1.5 text-[10px]',
                r.exists ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-muted/20 text-muted-foreground'
              )}
            >
              <div className="flex items-center gap-1">
                <FolderSimple className="h-3 w-3 shrink-0" weight={r.exists ? 'duotone' : 'regular'} />
                <span className="truncate font-medium">{r.key}</span>
              </div>
              <span className={cn('text-[9px]', r.exists ? 'text-emerald-600' : 'text-muted-foreground/60')}>
                {r.exists ? 'Found' : 'Missing'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Workspace Registry View ────────────────────────────────────────────────

function WorkspaceRegistryInfo() {
  const workspaces = loadWorkspaces()

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Code className="h-4 w-4 text-primary" weight="duotone" /> Workspace Registry
        <Badge variant="secondary" className="text-[9px]">{workspaces.length}</Badge>
      </h3>
      <div className="space-y-1.5">
        {workspaces.map(ws => (
          <div key={ws.id} className="rounded border border-border px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium">{ws.name}</span>
              {ws.builtIn && <Badge variant="secondary" className="text-[9px]">built-in</Badge>}
              <span className="ml-auto text-muted-foreground font-mono">{ws.namespace}:</span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[10px] text-muted-foreground">
              {ws.remote && <span>{ws.remote.owner}/{ws.remote.repo}@{ws.remote.branch}</span>}
              <span>{ws.contentKeys.length} content keys</span>
              <span>schema: {ws.schemaId}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Panel ─────────────────────────────────────────────────────────────

export default function DevToolsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Developer Tools</h2>
        <p className="text-sm text-muted-foreground">Debug, inspect, and test the web builder internals</p>
      </div>

      <EnvironmentSection />
      <APITester />
      <WorkspaceAPIStatus />
      <WorkspaceRegistryInfo />
      <DataInspector />
    </div>
  )
}
