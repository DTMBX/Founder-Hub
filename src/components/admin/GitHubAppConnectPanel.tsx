/**
 * GitHub App Connection Panel
 *
 * Admin UI for connecting via GitHub App (replaces PAT-based auth).
 * Provides installation flow, repo selection, and disconnect capability.
 *
 * CHAIN B2: Migrate GitHub integration to GitHub App
 *
 * FEATURES:
 * - One-click GitHub App installation
 * - Repository selection with monorepo path support
 * - Connection status display
 * - Disconnect with confirmation
 * - Migration from PAT to App
 */

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  GithubLogo,
  CheckCircle,
  XCircle,
  ArrowRight,
  Warning,
  Plugs,
  PlugsConnected,
  Folder,
  GitBranch,
  CaretDown,
  ArrowsClockwise,
} from '@phosphor-icons/react'

import type { GitHubInstallation, InstalledRepository, GitHubAppState } from '@/lib/github-app/types'
import {
  initiateInstallFlow,
  handleInstallCallback,
  getConnectionState,
  disconnect,
  fetchInstallationRepos,
  getInstallation,
  GITHUB_APP_CONFIG,
} from '@/lib/github-app/auth'
import { getRepoInfo } from '@/lib/github-app/operations'
import { clearAllTokens } from '@/lib/github-app/cache'
import { hasGitHubPAT, clearGitHubPAT } from '@/lib/secret-vault'

// ─── Local Storage for Site-Repo Mapping ────────────────────────────────────

const SITE_REPO_MAPPING_KEY = 'xtx396:github-app-repo-mapping'

interface RepoMapping {
  repoFullName: string
  dataPath: string
  defaultBranch: string
}

function getSavedRepoMapping(): RepoMapping | null {
  const raw = localStorage.getItem(SITE_REPO_MAPPING_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveRepoMapping(mapping: RepoMapping): void {
  localStorage.setItem(SITE_REPO_MAPPING_KEY, JSON.stringify(mapping))
}

function clearRepoMapping(): void {
  localStorage.removeItem(SITE_REPO_MAPPING_KEY)
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function GitHubAppConnectPanel() {
  // Connection state
  const [state, setState] = useState<GitHubAppState>({ connected: false })
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)

  // PAT migration state
  const [hasPAT, setHasPAT] = useState(false)
  const [showMigrateDialog, setShowMigrateDialog] = useState(false)

  // Repo selection state
  const [repositories, setRepositories] = useState<InstalledRepository[]>([])
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [dataPath, setDataPath] = useState('public/data')
  const [isSavingMapping, setIsSavingMapping] = useState(false)
  const [mapping, setMapping] = useState<RepoMapping | null>(null)

  // ─── Load Initial State ───────────────────────────────────────────────────

  useEffect(() => {
    const loadState = async () => {
      setIsLoading(true)
      try {
        // Check for OAuth callback
        const params = new URLSearchParams(window.location.search)
        if (params.has('installation_id')) {
          const result = await handleInstallCallback(params)
          if (result.success) {
            toast.success('GitHub App connected successfully!')
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname)
          } else {
            toast.error(result.error)
          }
        }

        // Load connection state
        const connectionState = await getConnectionState()
        setState(connectionState)

        // Load saved mapping
        const savedMapping = getSavedRepoMapping()
        if (savedMapping) {
          setMapping(savedMapping)
          setSelectedRepo(savedMapping.repoFullName)
          setDataPath(savedMapping.dataPath)
        }

        // Check for existing PAT
        const patExists = await hasGitHubPAT()
        setHasPAT(patExists)

        // Load repos if connected
        if (connectionState.connected && connectionState.installation) {
          await loadRepositories(connectionState.installation.installationId)
        }
      } catch (error) {
        console.error('Failed to load GitHub App state:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadState()
  }, [])

  // ─── Load Repositories ────────────────────────────────────────────────────

  const loadRepositories = useCallback(async (installationId: number) => {
    try {
      const repos = await fetchInstallationRepos(installationId)
      setRepositories(repos)
    } catch (error) {
      console.error('Failed to load repositories:', error)
      toast.error('Failed to load repositories')
    }
  }, [])

  // ─── Connect Flow ─────────────────────────────────────────────────────────

  const handleConnect = () => {
    setIsConnecting(true)
    initiateInstallFlow()
    // Page will redirect, so loading state stays
  }

  // ─── Disconnect Flow ──────────────────────────────────────────────────────

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      await disconnect()
      clearAllTokens()
      clearRepoMapping()
      setState({ connected: false })
      setRepositories([])
      setSelectedRepo('')
      setMapping(null)
      toast.success('GitHub App disconnected')
    } catch (error) {
      toast.error('Failed to disconnect')
    } finally {
      setIsDisconnecting(false)
      setShowDisconnectDialog(false)
    }
  }

  // ─── PAT Migration ────────────────────────────────────────────────────────

  const handleMigratePAT = async () => {
    if (!state.connected) {
      toast.error('Connect GitHub App first')
      return
    }

    try {
      await clearGitHubPAT()
      setHasPAT(false)
      toast.success('PAT removed — now using GitHub App')
    } catch {
      toast.error('Failed to remove PAT')
    } finally {
      setShowMigrateDialog(false)
    }
  }

  // ─── Save Repo Mapping ────────────────────────────────────────────────────

  const handleSaveMapping = async () => {
    if (!selectedRepo) {
      toast.error('Select a repository')
      return
    }

    setIsSavingMapping(true)
    try {
      const repo = repositories.find((r) => r.fullName === selectedRepo)
      if (!repo) {
        toast.error('Repository not found')
        return
      }

      // Test connection to repo
      const result = await getRepoInfo({
        owner: selectedRepo.split('/')[0],
        repo: selectedRepo.split('/')[1],
        dataPath,
      })

      if (!result.success) {
        toast.error(result.error || 'Failed to access repository')
        return
      }

      const newMapping: RepoMapping = {
        repoFullName: selectedRepo,
        dataPath,
        defaultBranch: repo.defaultBranch,
      }

      saveRepoMapping(newMapping)
      setMapping(newMapping)
      toast.success('Repository mapping saved')
    } catch (error) {
      toast.error('Failed to save mapping')
    } finally {
      setIsSavingMapping(false)
    }
  }

  // ─── Refresh Installation ─────────────────────────────────────────────────

  const handleRefresh = async () => {
    if (!state.installation) return

    setIsLoading(true)
    try {
      await loadRepositories(state.installation.installationId)
      const connectionState = await getConnectionState()
      setState(connectionState)
      toast.success('Refreshed')
    } catch {
      toast.error('Failed to refresh')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <GithubLogo className="h-4 w-4 text-muted-foreground animate-pulse" weight="duotone" />
            GitHub Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <GithubLogo className="h-4 w-4 text-primary" weight="duotone" />
            GitHub Integration
            {state.connected && (
              <span className="ml-2 text-xs font-normal text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                Connected via App
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {state.connected
              ? 'Auto-publish changes to GitHub via secure GitHub App integration.'
              : 'Connect via GitHub App for secure, least-privilege access to your repository.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* PAT Migration Warning */}
          {hasPAT && state.connected && (
            <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
              <Warning className="h-4 w-4 text-yellow-600" weight="fill" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-yellow-700 dark:text-yellow-400">
                  You have a PAT configured. Migrate to GitHub App for better security.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMigrateDialog(true)}
                  className="ml-4"
                >
                  Migrate
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Not Connected State */}
          {!state.connected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Plugs className="h-6 w-6 text-muted-foreground" weight="duotone" />
                  <div>
                    <p className="font-medium">Not Connected</p>
                    <p className="text-sm text-muted-foreground">
                      Install the GitHub App to enable auto-publish
                    </p>
                  </div>
                </div>
                <Button onClick={handleConnect} disabled={isConnecting}>
                  {isConnecting ? (
                    'Redirecting...'
                  ) : (
                    <>
                      Connect GitHub
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>The GitHub App requests minimal permissions:</p>
                <ul className="list-disc list-inside pl-2 space-y-0.5">
                  <li>
                    <code className="bg-muted px-1 rounded">Contents: write</code> — Create commits
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded">Pull requests: write</code> — Open PRs
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded">Checks: read</code> — View CI status
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Connected State */}
          {state.connected && state.installation && (
            <div className="space-y-4">
              {/* Connection Info */}
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-3">
                  <PlugsConnected className="h-6 w-6 text-green-600" weight="duotone" />
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      Connected
                      <CheckCircle className="h-4 w-4 text-green-600" weight="fill" />
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Installed by{' '}
                      <span className="font-mono">{state.installation.account.login}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleRefresh}>
                    <ArrowsClockwise className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDisconnectDialog(true)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Repository Selection */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Target Repository
                </Label>
                <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a repository..." />
                  </SelectTrigger>
                  <SelectContent>
                    {repositories.map((repo) => (
                      <SelectItem key={repo.id} value={repo.fullName}>
                        <div className="flex items-center gap-2">
                          <GithubLogo className="h-3.5 w-3.5" />
                          <span>{repo.fullName}</span>
                          {repo.private && (
                            <span className="text-xs text-muted-foreground">(private)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data Path (Monorepo Support) */}
              <div className="space-y-3">
                <Label htmlFor="data-path" className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Data Path
                </Label>
                <Input
                  id="data-path"
                  value={dataPath}
                  onChange={(e) => setDataPath(e.target.value)}
                  placeholder="public/data"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Path within the repo where JSON data files are stored. Supports monorepo setups.
                </p>
              </div>

              {/* Save Mapping Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  {mapping ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Mapped to <code className="bg-muted px-1 rounded">{mapping.repoFullName}</code>
                    </span>
                  ) : (
                    'No repository mapped'
                  )}
                </div>
                <Button onClick={handleSaveMapping} disabled={isSavingMapping || !selectedRepo}>
                  {isSavingMapping ? 'Saving...' : 'Save Mapping'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect GitHub App?</DialogTitle>
            <DialogDescription>
              This will remove the connection to GitHub. You'll need to reconnect to publish
              changes. The GitHub App installation will remain on your account — you can remove it
              from GitHub settings if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PAT Migration Dialog */}
      <Dialog open={showMigrateDialog} onOpenChange={setShowMigrateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Migrate from PAT to GitHub App</DialogTitle>
            <DialogDescription>
              You're now connected via GitHub App, which provides better security than PATs:
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Scoped permissions (least privilege)</li>
                <li>Automatic token rotation (1 hour expiry)</li>
                <li>No long-lived secrets stored</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMigrateDialog(false)}>
              Keep PAT
            </Button>
            <Button onClick={handleMigratePAT}>Remove PAT</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
