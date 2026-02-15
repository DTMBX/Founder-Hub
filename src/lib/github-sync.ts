/**
 * GitHub Sync Module
 * 
 * Commits data changes directly to GitHub repo via API.
 * Admin panel changes → GitHub commit → Auto-deploy via Actions.
 */

const GITHUB_TOKEN_KEY = 'xtx396:github-pat'
const REPO_OWNER = 'DTMBX'
const REPO_NAME = 'XTX396'
const BRANCH = 'main'

// Data files to sync to repo
const DATA_FILES: Record<string, string> = {
  'founder-hub-settings': 'public/data/settings.json',
  'founder-hub-sections': 'public/data/sections.json',
  'founder-hub-projects': 'public/data/projects.json',
  'founder-hub-court-cases': 'public/data/court-cases.json',
  'founder-hub-proof-links': 'public/data/links.json',
  'founder-hub-profile': 'public/data/profile.json',
  'founder-hub-about': 'public/data/about.json',
  'founder-hub-pdfs': 'public/data/documents.json',
  'founder-hub-document-types': 'public/data/document-types.json',
  'founder-hub-offerings': 'public/data/offerings.json',
}

const STORAGE_PREFIX = 'xtx396:'

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

/**
 * Get file SHA from GitHub (needed for updates)
 */
async function getFileSha(token: string, path: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`,
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
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current file SHA (required for updates)
    const sha = await getFileSha(token, path)
    
    const body: any = {
      message,
      content: btoa(unescape(encodeURIComponent(content))), // Base64 encode with UTF-8 support
      branch: BRANCH,
    }
    
    if (sha) {
      body.sha = sha
    }
    
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
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
 */
export async function publishToGitHub(): Promise<CommitResult> {
  const token = getGitHubToken()
  
  if (!token) {
    return { success: false, error: 'GitHub token not configured. Go to Settings to add your PAT.' }
  }
  
  const errors: string[] = []
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19)
  
  for (const [kvKey, filePath] of Object.entries(DATA_FILES)) {
    const data = localStorage.getItem(STORAGE_PREFIX + kvKey)
    
    if (data) {
      // Pretty-print JSON for readability in repo
      let prettyJson: string
      try {
        prettyJson = JSON.stringify(JSON.parse(data), null, 2)
      } catch {
        prettyJson = data
      }
      
      const result = await updateFile(
        token,
        filePath,
        prettyJson,
        `Update ${filePath.split('/').pop()} via admin panel [${timestamp}]`
      )
      
      if (!result.success) {
        errors.push(`${filePath}: ${result.error}`)
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
    commitUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/commits/${BRANCH}`
  }
}

/**
 * Test GitHub token by fetching repo info
 */
export async function testGitHubToken(token: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`,
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
