/**
 * GitHub Sync Module
 * 
 * Commits data changes directly to GitHub repo via API.
 * Admin panel changes → GitHub commit → Auto-deploy via Actions.
 * 
 * Supports multi-site publishing for worktree repositories.
 */

const GITHUB_TOKEN_KEY = 'xtx396:github-pat'

// Default repo (for backward compatibility)
const DEFAULT_REPO_OWNER = 'DTMBX'
const DEFAULT_REPO_NAME = 'XTX396'
const BRANCH = 'main'

// Data files to sync to repo (relative to dataPath)
const DATA_FILES: Record<string, string> = {
  'founder-hub-settings': 'settings.json',
  'founder-hub-sections': 'sections.json',
  'founder-hub-projects': 'projects.json',
  'founder-hub-court-cases': 'court-cases.json',
  'founder-hub-proof-links': 'links.json',
  'founder-hub-profile': 'profile.json',
  'founder-hub-about': 'about.json',
  'founder-hub-pdfs': 'documents.json',
  'founder-hub-document-types': 'document-types.json',
  'founder-hub-offerings': 'offerings.json',
  'founder-hub-investor': 'investor.json',
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
 * Get stored GitHub PAT
 */
export function getGitHubToken(): string | null {
  return localStorage.getItem(GITHUB_TOKEN_KEY)
}

/**
 * Save GitHub PAT
 */
export function setGitHubToken(token: string): void {
  localStorage.setItem(GITHUB_TOKEN_KEY, token)
}

/**
 * Remove GitHub PAT
 */
export function clearGitHubToken(): void {
  localStorage.removeItem(GITHUB_TOKEN_KEY)
}

/**
 * Check if GitHub token is configured
 */
export function hasGitHubToken(): boolean {
  const token = getGitHubToken()
  return !!token && token.length > 0
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
 * Publish all local data to GitHub repo.
 * This commits all data files and triggers auto-deploy.
 * 
 * @param siteConfig Optional site config for multi-site publishing
 */
export async function publishToGitHub(siteConfig?: {
  owner: string
  repo: string
  dataPath: string
  siteId?: string
}): Promise<CommitResult> {
  const token = getGitHubToken()
  
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
  
  const errors: string[] = []
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19)
  
  for (const [kvKey, fileName] of Object.entries(DATA_FILES)) {
    const data = localStorage.getItem(storagePrefix + kvKey)
    
    if (data) {
      // Pretty-print JSON for readability in repo
      let prettyJson: string
      try {
        prettyJson = JSON.stringify(JSON.parse(data), null, 2)
      } catch {
        prettyJson = data
      }
      
      // Construct full path: dataPath + fileName
      const fullPath = `${config.dataPath}/${fileName}`.replace(/^\//, '')
      
      const result = await updateFile(
        token,
        fullPath,
        prettyJson,
        `Update ${fileName} via admin panel [${timestamp}]`,
        config
      )
      
      if (!result.success) {
        errors.push(`${fullPath}: ${result.error}`)
      }
    }
  }
  
  if (errors.length > 0) {
    return { 
      success: false, 
      error: `Failed to update some files:\n${errors.join('\n')}` 
    }
  }
  
  return { 
    success: true, 
    commitUrl: `https://github.com/${config.owner}/${config.repo}/commits/${BRANCH}`
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
