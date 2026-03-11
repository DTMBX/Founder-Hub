/**
 * GitHub Sync Module
 * 
 * Commits data changes directly to GitHub repo via API.
 * Admin panel changes → GitHub commit → Auto-deploy via Actions.
 * 
 * Supports multi-site publishing for worktree repositories.
 * 
 * SECURITY:
 * - CHAIN B2: Prefers GitHub App (installation tokens, least privilege)
 * - Falls back to PAT if App not connected (legacy mode)
 * - GitHub PAT stored encrypted via secret-vault module
 */

import { storeGitHubPAT, getGitHubPAT, hasGitHubPAT as vaultHasGitHubPAT, clearGitHubPAT } from './secret-vault'
import * as GitHubApp from './github-app'
import { getWorkspace, buildDataFilesMap, getStoragePrefix, type WorkspaceDef } from './workspace-registry'

// Default repo (for backward compatibility)
const DEFAULT_REPO_OWNER = 'DTMBX'
const DEFAULT_REPO_NAME = 'Founder-Hub'
const DEFAULT_BRANCH = 'main'

/**
 * Safe commit mode:
 * - 'branch': Creates a feature branch (default, recommended)
 * - 'direct': Commits directly to main (legacy, requires admin override)
 */
export type PublishMode = 'branch' | 'direct'

// Legacy hardcoded DATA_FILES for backward compatibility.
// New workspaces use buildDataFilesMap() from workspace-registry.
const LEGACY_DATA_FILES: Record<string, string> = {
  'founder-hub-settings': 'settings.json',
  'founder-hub-sections': 'sections.json',
  'founder-hub-projects': 'projects.json',
  'founder-hub-court-cases': 'court-cases.json',
  'founder-hub-proof-links': 'links.json',
  'founder-hub-contact-links': 'contact-links.json',
  'founder-hub-profile': 'profile.json',
  'founder-hub-about': 'about.json',
  'founder-hub-pdfs': 'documents.json',
  'founder-hub-document-types': 'document-types.json',
  'founder-hub-offerings': 'offerings.json',
  'founder-hub-investor': 'investor.json',
  'founder-hub-filing-types': 'filing-types.json',
  'founder-hub-naming-rules': 'naming-rules.json',
  'founder-hub-sites-config': 'sites.json',
  'honor-flag-bar-settings': 'honor-flag-bar.json',
  'honor-flag-bar-enabled': 'honor-flag-bar-enabled.json',
  'honor-flag-bar-animation': 'honor-flag-bar-animation.json',
  'honor-flag-bar-parallax': 'honor-flag-bar-parallax.json',
  'honor-flag-bar-rotation': 'honor-flag-bar-rotation.json',
  'honor-flag-bar-max-desktop': 'honor-flag-bar-max-desktop.json',
  'honor-flag-bar-max-mobile': 'honor-flag-bar-max-mobile.json',
  'honor-flag-bar-alignment': 'honor-flag-bar-alignment.json',
  'hero-accent-settings': 'hero-accent-settings.json',
  'flag-gallery-settings': 'flag-gallery-settings.json',
  'map-spotlight-settings': 'map-spotlight-settings.json',
  'asset-metadata': 'asset-metadata.json',
  'asset-usage-policy': 'asset-usage-policy.json',
  'founder-hub-audit-log': 'audit-log.json',
  'law-firm-showcase': 'law-firm-showcase.json',
  'smb-template': 'smb-template.json',
  'agency-framework': 'agency-framework.json',
  'sites:index': 'sites-index.json',
}

const DEFAULT_STORAGE_PREFIX = 'founder-hub:'

/**
 * Resolve the DATA_FILES map and storage prefix for a workspace.
 * Falls back to legacy hardcoded map for founder-hub.
 */
function resolveWorkspaceConfig(siteId?: string): { dataFiles: Record<string, string>; storagePrefix: string } {
  if (!siteId || siteId === 'founder-hub') {
    return { dataFiles: LEGACY_DATA_FILES, storagePrefix: DEFAULT_STORAGE_PREFIX }
  }
  const ws = getWorkspace(siteId)
  if (ws) {
    return { dataFiles: buildDataFilesMap(ws), storagePrefix: getStoragePrefix(ws) }
  }
  // Unknown workspace — use generic prefix
  return { dataFiles: {}, storagePrefix: `${siteId}:` }
}

interface GitHubFileResponse {
  sha: string
  content: string
}

interface CommitResult {
  success: boolean
  error?: string
  warning?: string        // Non-fatal issue (e.g. PR creation failed)
  commitUrl?: string
  branch?: string       // Branch name if published to branch
  pullRequestUrl?: string  // PR URL if auto-created
  mode?: PublishMode    // How the commit was made
}

/**
 * Get stored GitHub PAT (encrypted via vault)
 */
export async function getGitHubToken(): Promise<string | null> {
  return getGitHubPAT()
}

/**
 * Save GitHub PAT (encrypted via vault)
 */
export async function setGitHubToken(token: string): Promise<void> {
  await storeGitHubPAT(token)
}

/**
 * Remove GitHub PAT
 */
export async function clearGitHubToken(): Promise<void> {
  await clearGitHubPAT()
}

/**
 * Check if GitHub token is configured
 */
export async function hasGitHubToken(): Promise<boolean> {
  return vaultHasGitHubPAT()
}

interface RepoConfig {
  owner: string
  repo: string
  dataPath: string  // e.g., "public/data" or "apps/civics-hierarchy/public/data"
  branch: string    // target branch (e.g., 'main')
}

/**
 * Get file SHA from GitHub (needed for updates)
 */
async function getFileSha(token: string, path: string, config: RepoConfig): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )
    
    if (response.ok) {
      const data: GitHubFileResponse = await response.json()
      return data.sha
    }
    return null
  } catch {
    return null
  }
}

/**
 * Update a single file in the GitHub repo
 */
async function updateFile(
  token: string, 
  path: string, 
  content: string, 
  message: string,
  config: RepoConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current file SHA (required for updates)
    const sha = await getFileSha(token, path, config)
    
    const body: any = {
      message,
      content: btoa(unescape(encodeURIComponent(content))), // Base64 encode with UTF-8 support
      branch: config.branch,
    }
    
    if (sha) {
      body.sha = sha
    }
    
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )
    
    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.message || 'Failed to update file' }
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Publish all local data to GitHub repo in a single commit.
 * Uses the Git Trees API to batch all file changes into one commit,
 * avoiding sequential per-file API calls.
 * 
 * SAFE COMMIT WORKFLOW (Chain A4):
 * - Default mode ('branch'): creates a feature branch + opens PR
 * - Legacy mode ('direct'): commits to main (admin override only)
 * 
 * @param siteConfig Optional site config for multi-site publishing
 * @param mode Publish mode — 'branch' (safe, default) or 'direct' (admin override)
 */
export async function publishToGitHub(siteConfig?: {
  owner: string
  repo: string
  dataPath: string
  siteId?: string
}, mode: PublishMode = 'branch', commitMessage?: string): Promise<CommitResult> {
  const token = await getGitHubToken()
  
  if (!token) {
    return { success: false, error: 'GitHub token not configured. Go to Settings to add your PAT.' }
  }

  // Resolve workspace config: look up by siteId for dynamic DATA_FILES
  const wsConfig = resolveWorkspaceConfig(siteConfig?.siteId)
  
  // Determine branch from workspace or default
  const ws = siteConfig?.siteId ? getWorkspace(siteConfig.siteId) : undefined
  const branch = ws?.remote?.branch || DEFAULT_BRANCH

  // Use provided config or defaults
  const config: RepoConfig = siteConfig ? {
    owner: siteConfig.owner,
    repo: siteConfig.repo,
    dataPath: siteConfig.dataPath,
    branch,
  } : {
    owner: DEFAULT_REPO_OWNER,
    repo: DEFAULT_REPO_NAME,
    dataPath: 'public/data',
    branch: DEFAULT_BRANCH,
  }
  
  const storagePrefix = wsConfig.storagePrefix
  const dataFiles = wsConfig.dataFiles
  
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const repoBase = `https://api.github.com/repos/${config.owner}/${config.repo}`
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }
  
  // Collect all files that have data to push
  const filesToPush: { path: string; content: string }[] = []
  
  for (const [kvKey, fileName] of Object.entries(dataFiles)) {
    const data = localStorage.getItem(storagePrefix + kvKey)
    if (data) {
      let prettyJson: string
      try {
        prettyJson = JSON.stringify(JSON.parse(data), null, 2)
      } catch {
        prettyJson = data
      }
      const fullPath = `${config.dataPath}/${fileName}`.replace(/^\//, '')
      filesToPush.push({ path: fullPath, content: prettyJson })
    }
  }
  
  if (filesToPush.length === 0) {
    return { success: false, error: 'No data to publish. Make changes in the admin panel first.' }
  }

  try {
    // 1. Get the latest commit SHA on target branch
    const refRes = await fetch(`${repoBase}/git/ref/heads/${config.branch}`, { headers })
    if (!refRes.ok) {
      return { success: false, error: `Failed to read branch ref: ${refRes.status}` }
    }
    const refData = await refRes.json()
    const latestCommitSha = refData.object.sha
    
    // 2. Get the tree SHA of the latest commit
    const commitRes = await fetch(`${repoBase}/git/commits/${latestCommitSha}`, { headers })
    if (!commitRes.ok) {
      return { success: false, error: `Failed to read commit: ${commitRes.status}` }
    }
    const commitData = await commitRes.json()
    const baseTreeSha = commitData.tree.sha
    
    // 3. Create blobs for each file
    const treeItems: { path: string; mode: string; type: string; sha: string }[] = []
    
    for (const file of filesToPush) {
      const blobRes = await fetch(`${repoBase}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: file.content,
          encoding: 'utf-8'
        })
      })
      
      if (!blobRes.ok) {
        const err = await blobRes.json()
        return { success: false, error: `Failed to create blob for ${file.path}: ${err.message}` }
      }
      
      const blobData = await blobRes.json()
      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha
      })
    }
    
    // 4. Create a new tree with all file changes
    const treeRes = await fetch(`${repoBase}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems
      })
    })
    
    if (!treeRes.ok) {
      const err = await treeRes.json()
      return { success: false, error: `Failed to create tree: ${err.message}` }
    }
    
    const treeData = await treeRes.json()
    
    // 5. Create a new commit
    const defaultMsg = mode === 'branch'
      ? `chore(admin): update ${filesToPush.length} data files [${timestamp}]`
      : `Update ${filesToPush.length} data files via admin panel [${timestamp}]`
    
    const finalMessage = commitMessage
      ? (mode === 'branch'
          ? `${commitMessage}\n\n---\nmode: branch\nfiles: ${filesToPush.length}\ntimestamp: ${timestamp}\n---`
          : commitMessage)
      : (mode === 'branch'
          ? `${defaultMsg}\n\n---\nmode: branch\nfiles: ${filesToPush.length}\ntimestamp: ${timestamp}\n---`
          : defaultMsg)

    const newCommitRes = await fetch(`${repoBase}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: finalMessage,
        tree: treeData.sha,
        parents: [latestCommitSha]
      })
    })
    
    if (!newCommitRes.ok) {
      const err = await newCommitRes.json()
      return { success: false, error: `Failed to create commit: ${err.message}` }
    }
    
    const newCommitData = await newCommitRes.json()

    // ─── Safe Commit Workflow (Chain A4) ─────────────────────
    if (mode === 'branch') {
      // Create a feature branch from main, push commit there, then open PR
      const branchName = `admin/data-update-${Date.now()}`

      // 6a. Create the feature branch ref
      const createBranchRes = await fetch(`${repoBase}/git/refs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: newCommitData.sha
        })
      })

      if (!createBranchRes.ok) {
        const err = await createBranchRes.json()
        return { success: false, error: `Failed to create branch: ${err.message}` }
      }

      // 7a. Open a pull request from the branch to main
      let pullRequestUrl: string | undefined
      let prWarning: string | undefined
      try {
        const prRes = await fetch(`${repoBase}/pulls`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: `Admin Panel: Update ${filesToPush.length} data files [${timestamp}]`,
            head: branchName,
            base: config.branch,
            body: [
              `## Data Update from Admin Panel`,
              ``,
              `**Files changed:** ${filesToPush.length}`,
              `**Timestamp:** ${timestamp}`,
              `**Mode:** Safe commit (branch + PR)`,
              ``,
              `### Files Updated`,
              ...filesToPush.map(f => `- \`${f.path}\``),
              ``,
              `---`,
              `*This PR was auto-created by the admin panel safe commit workflow.*`,
            ].join('\n')
          })
        })

        if (prRes.ok) {
          const prData = await prRes.json()
          pullRequestUrl = prData.html_url
        } else {
          // Surface PR failure — branch commit still succeeded
          const prErr = await prRes.json().catch(() => ({ message: 'Unknown error' }))
          prWarning = `Branch pushed but PR creation failed: ${prErr.message || 'Unknown error'}. Create PR manually.`
        }
      } catch {
        prWarning = 'Branch pushed but PR creation failed (network error). Create PR manually.'
      }

      return {
        success: true,
        commitUrl: `https://github.com/${config.owner}/${config.repo}/commit/${newCommitData.sha}`,
        branch: branchName,
        pullRequestUrl,
        warning: prWarning,
        mode: 'branch',
      }
    }

    // ─── Direct Commit (Legacy / Admin Override) ─────────────
    // 6b. Update the target branch reference directly
    const updateRefRes = await fetch(`${repoBase}/git/refs/heads/${config.branch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: newCommitData.sha
      })
    })
    
    if (!updateRefRes.ok) {
      const err = await updateRefRes.json()
      return { success: false, error: `Failed to update branch: ${err.message}` }
    }
    
    return { 
      success: true, 
      commitUrl: `https://github.com/${config.owner}/${config.repo}/commit/${newCommitData.sha}`,
      mode: 'direct',
    }
    
  } catch (error) {
    return { success: false, error: `Network error: ${String(error)}` }
  }
}
/**
 * Test GitHub token by fetching repo info
 */
export async function testGitHubToken(
  token: string, 
  repoPath?: string
): Promise<{ valid: boolean; error?: string }> {
  const [owner, repo] = repoPath 
    ? repoPath.split('/') 
    : [DEFAULT_REPO_OWNER, DEFAULT_REPO_NAME]
    
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )
    
    if (response.ok) {
      return { valid: true }
    }
    
    if (response.status === 401) {
      return { valid: false, error: 'Invalid token' }
    }
    
    if (response.status === 403) {
      return { valid: false, error: 'Token lacks required permissions (needs Contents write access)' }
    }
    
    if (response.status === 404) {
      return { valid: false, error: 'Repository not found or token lacks access' }
    }
    
    return { valid: false, error: `GitHub API error: ${response.status}` }
  } catch (error) {
    return { valid: false, error: String(error) }
  }
}

// ─── CHAIN B2: GitHub App Integration Layer ─────────────────────────────────

/**
 * Connection method type
 */
export type GitHubConnectionMethod = 'app' | 'pat' | 'none'

/**
 * Get current connection method
 * Prefers GitHub App if available (more secure)
 */
export async function getConnectionMethod(): Promise<GitHubConnectionMethod> {
  return GitHubApp.getConnectionMethod()
}

/**
 * Check if any GitHub connection is available
 */
export async function isGitHubConnected(): Promise<boolean> {
  const method = await getConnectionMethod()
  return method !== 'none'
}

/**
 * Get saved repo mapping (for GitHub App)
 */
function getSavedRepoMapping(): { owner: string; repo: string; dataPath: string } | null {
  const raw = localStorage.getItem('founder-hub:github-app-repo-mapping')
  if (!raw) return null
  try {
    const mapping = JSON.parse(raw)
    const [owner, repo] = mapping.repoFullName.split('/')
    return { owner, repo, dataPath: mapping.dataPath }
  } catch {
    return null
  }
}

/**
 * Unified publish function
 * Routes to GitHub App or PAT-based publish based on connection
 */
export async function publish(
  siteConfig?: {
    owner: string
    repo: string
    dataPath: string
    siteId?: string
  },
  mode: PublishMode = 'branch'
): Promise<CommitResult> {
  const method = await getConnectionMethod()

  if (method === 'app') {
    return publishViaApp(siteConfig)
  }

  if (method === 'pat') {
    return publishToGitHub(siteConfig, mode)
  }

  return {
    success: false,
    error: 'No GitHub connection configured. Connect via GitHub App or add a PAT in Settings.',
  }
}

/**
 * Publish via GitHub App (least privilege)
 */
async function publishViaApp(siteConfig?: {
  owner: string
  repo: string
  dataPath: string
  siteId?: string
}): Promise<CommitResult> {
  // Get config from saved mapping if not provided
  const mapping = getSavedRepoMapping()
  const config = siteConfig || mapping

  if (!config) {
    return {
      success: false,
      error: 'No repository mapped. Select a repository in GitHub settings.',
    }
  }

  const wsConfig = resolveWorkspaceConfig(siteConfig?.siteId)

  // Collect files to push
  const files: GitHubApp.FileChange[] = []

  for (const [kvKey, fileName] of Object.entries(wsConfig.dataFiles)) {
    const data = localStorage.getItem(wsConfig.storagePrefix + kvKey)
    if (data) {
      let prettyJson: string
      try {
        prettyJson = JSON.stringify(JSON.parse(data), null, 2)
      } catch {
        prettyJson = data
      }
      const fullPath = `${config.dataPath}/${fileName}`.replace(/^\//, '')
      files.push({ path: fullPath, content: prettyJson })
    }
  }

  if (files.length === 0) {
    return {
      success: false,
      error: 'No data to publish. Make changes in the admin panel first.',
    }
  }

  // Publish using GitHub App operations
  const result = await GitHubApp.publishChanges(
    {
      owner: config.owner,
      repo: config.repo,
      dataPath: config.dataPath,
      branch: getWorkspace(siteConfig?.siteId ?? '')?.remote?.branch || DEFAULT_BRANCH,
    },
    files
  )

  return {
    success: result.success,
    error: result.error,
    commitUrl: result.commitUrl,
    branch: result.branch,
    pullRequestUrl: result.pullRequestUrl,
    mode: 'branch',
  }
}

/**
 * Re-export GitHub App functions for convenience
 */
export {
  GitHubApp,
  // Connection
  getConnectionMethod as getGitHubConnectionMethod,
}

// ─── GitHub Repo Browser API ────────────────────────────────────────────────

export interface GitHubRepoInfo {
  full_name: string     // 'owner/repo'
  name: string
  description: string | null
  html_url: string
  default_branch: string
  private: boolean
  language: string | null
  updated_at: string
  topics: string[]
}

/**
 * List repositories for the authenticated user.
 * Supports pagination and filtering.
 */
export async function listUserRepos(opts?: {
  sort?: 'updated' | 'pushed' | 'full_name'
  per_page?: number
  page?: number
  type?: 'all' | 'owner' | 'public' | 'private'
}): Promise<{ repos: GitHubRepoInfo[]; error?: string }> {
  const token = await getGitHubToken()
  if (!token) return { repos: [], error: 'No GitHub token configured' }

  const sort = opts?.sort ?? 'updated'
  const per_page = opts?.per_page ?? 30
  const page = opts?.page ?? 1
  const type = opts?.type ?? 'all'

  try {
    const res = await fetch(
      `https://api.github.com/user/repos?sort=${sort}&per_page=${per_page}&page=${page}&type=${type}`,
      { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' } }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
      return { repos: [], error: err.message }
    }
    const data = await res.json()
    return { repos: data }
  } catch (e) {
    return { repos: [], error: String(e) }
  }
}

/**
 * List repos for a specific owner (for connecting to other accounts).
 */
export async function listOwnerRepos(
  owner: string,
  opts?: { per_page?: number; page?: number }
): Promise<{ repos: GitHubRepoInfo[]; error?: string }> {
  const token = await getGitHubToken()
  if (!token) return { repos: [], error: 'No GitHub token configured' }

  const per_page = opts?.per_page ?? 30
  const page = opts?.page ?? 1

  try {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(owner)}/repos?sort=updated&per_page=${per_page}&page=${page}`,
      { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' } }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
      return { repos: [], error: err.message }
    }
    const data = await res.json()
    return { repos: data }
  } catch (e) {
    return { repos: [], error: String(e) }
  }
}

/**
 * Check if a specific repo's data directory has JSON files.
 * Useful for auto-detecting content structure when connecting a new repo.
 */
export async function probeRepoDataDir(
  owner: string,
  repo: string,
  dataPath: string,
  branch?: string,
): Promise<{ files: string[]; error?: string }> {
  const token = await getGitHubToken()
  if (!token) return { files: [], error: 'No token' }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(dataPath)}?ref=${branch || 'main'}`,
      { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' } }
    )
    if (!res.ok) return { files: [], error: `HTTP ${res.status}` }
    const data: Array<{ name: string; type: string }> = await res.json()
    return {
      files: data
        .filter((f) => f.type === 'file' && f.name.endsWith('.json'))
        .map((f) => f.name),
    }
  } catch (e) {
    return { files: [], error: String(e) }
  }
}
