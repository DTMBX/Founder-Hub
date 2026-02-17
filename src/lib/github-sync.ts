/**
 * GitHub Sync Module
 * 
 * Commits data changes directly to GitHub repo via API.
 * Admin panel changes → GitHub commit → Auto-deploy via Actions.
 * 
 * Supports multi-site publishing for worktree repositories.
 * 
 * SECURITY: GitHub PAT stored encrypted via secret-vault module.
 */

import { storeGitHubPAT, getGitHubPAT, hasGitHubPAT as vaultHasGitHubPAT, clearGitHubPAT } from './secret-vault'

// Default repo (for backward compatibility)
const DEFAULT_REPO_OWNER = 'DTMBX'
const DEFAULT_REPO_NAME = 'XTX396'
const BRANCH = 'main'

// Data files to sync to repo (relative to dataPath)
const DATA_FILES: Record<string, string> = {
  // Core content
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
  // Case management
  'founder-hub-filing-types': 'filing-types.json',
  'founder-hub-naming-rules': 'naming-rules.json',
  // Multi-site config
  'founder-hub-sites-config': 'sites.json',
  // Honor Flag Bar
  'honor-flag-bar-settings': 'honor-flag-bar.json',
  'honor-flag-bar-enabled': 'honor-flag-bar-enabled.json',
  'honor-flag-bar-animation': 'honor-flag-bar-animation.json',
  'honor-flag-bar-parallax': 'honor-flag-bar-parallax.json',
  'honor-flag-bar-rotation': 'honor-flag-bar-rotation.json',
  'honor-flag-bar-max-desktop': 'honor-flag-bar-max-desktop.json',
  'honor-flag-bar-max-mobile': 'honor-flag-bar-max-mobile.json',
  'honor-flag-bar-alignment': 'honor-flag-bar-alignment.json',
  // Visual modules
  'hero-accent-settings': 'hero-accent-settings.json',
  'flag-gallery-settings': 'flag-gallery-settings.json',
  'map-spotlight-settings': 'map-spotlight-settings.json',
  // Asset management
  'asset-metadata': 'asset-metadata.json',
  'asset-usage-policy': 'asset-usage-policy.json',
  // Audit trail
  'founder-hub-audit-log': 'audit-log.json',
  // Frameworks (private)
  'law-firm-showcase': 'law-firm-showcase.json',
  'smb-template': 'smb-template.json',
  'agency-framework': 'agency-framework.json',
  // Multi-tenant site registry
  'sites:index': 'sites-index.json',
}

const STORAGE_PREFIX = 'xtx396:'

// Site-specific storage prefix for multi-site data
function getSiteStoragePrefix(siteId?: string): string {
  return siteId ? `site:${siteId}:` : STORAGE_PREFIX
}

interface GitHubFileResponse {
  sha: string
  content: string
}

interface CommitResult {
  success: boolean
  error?: string
  commitUrl?: string
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
}

/**
 * Get file SHA from GitHub (needed for updates)
 */
async function getFileSha(token: string, path: string, config: RepoConfig): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${BRANCH}`,
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
      branch: BRANCH,
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
 * @param siteConfig Optional site config for multi-site publishing
 */
export async function publishToGitHub(siteConfig?: {
  owner: string
  repo: string
  dataPath: string
  siteId?: string
}): Promise<CommitResult> {
  const token = await getGitHubToken()
  
  if (!token) {
    return { success: false, error: 'GitHub token not configured. Go to Settings to add your PAT.' }
  }

  // Use default config if not provided
  const config: RepoConfig = siteConfig ? {
    owner: siteConfig.owner,
    repo: siteConfig.repo,
    dataPath: siteConfig.dataPath,
  } : {
    owner: DEFAULT_REPO_OWNER,
    repo: DEFAULT_REPO_NAME,
    dataPath: 'public/data',
  }
  
  const storagePrefix = siteConfig?.siteId 
    ? getSiteStoragePrefix(siteConfig.siteId) 
    : STORAGE_PREFIX
  
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const repoBase = `https://api.github.com/repos/${config.owner}/${config.repo}`
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }
  
  // Collect all files that have data to push
  const filesToPush: { path: string; content: string }[] = []
  
  for (const [kvKey, fileName] of Object.entries(DATA_FILES)) {
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
    // 1. Get the latest commit SHA on the branch
    const refRes = await fetch(`${repoBase}/git/ref/heads/${BRANCH}`, { headers })
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
    const newCommitRes = await fetch(`${repoBase}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: `Update ${filesToPush.length} data files via admin panel [${timestamp}]`,
        tree: treeData.sha,
        parents: [latestCommitSha]
      })
    })
    
    if (!newCommitRes.ok) {
      const err = await newCommitRes.json()
      return { success: false, error: `Failed to create commit: ${err.message}` }
    }
    
    const newCommitData = await newCommitRes.json()
    
    // 6. Update the branch reference to point to the new commit
    const updateRefRes = await fetch(`${repoBase}/git/refs/heads/${BRANCH}`, {
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
      commitUrl: `https://github.com/${config.owner}/${config.repo}/commit/${newCommitData.sha}`
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
