/**
 * GitHub repository metadata fetcher.
 *
 * Fetches stars, primary language, and last commit date from the GitHub API.
 * Results are cached in localStorage to avoid runtime API dependency and
 * respect GitHub's unauthenticated rate limit (60 req/hr).
 */

const CACHE_KEY = 'repo-metadata-cache'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

export interface RepoMetadata {
  stars: number
  language: string | null
  lastCommitDate: string | null
  fetchedAt: number
}

type MetadataCache = Record<string, RepoMetadata>

function readCache(): MetadataCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeCache(cache: MetadataCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

/**
 * Extract GitHub owner/repo from a GitHub URL.
 * Returns null if the URL is not a valid GitHub repo URL.
 */
function parseGitHubUrl(repoUrl: string): { owner: string; repo: string } | null {
  try {
    const url = new URL(repoUrl)
    if (url.hostname !== 'github.com') return null
    const parts = url.pathname.replace(/^\//, '').replace(/\/$/, '').split('/')
    if (parts.length < 2) return null
    return { owner: parts[0], repo: parts[1] }
  } catch {
    return null
  }
}

/**
 * Fetch metadata for a GitHub repository.
 * Returns cached data if fresh, otherwise fetches from the GitHub API.
 */
export async function fetchRepoMetadata(repoUrl: string): Promise<RepoMetadata | null> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return null

  const cacheKey = `${parsed.owner}/${parsed.repo}`
  const cache = readCache()
  const cached = cache[cacheKey]

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    })

    if (!response.ok) return cached ?? null

    const data = await response.json()
    const metadata: RepoMetadata = {
      stars: data.stargazers_count ?? 0,
      language: data.language ?? null,
      lastCommitDate: data.pushed_at ?? null,
      fetchedAt: Date.now(),
    }

    cache[cacheKey] = metadata
    writeCache(cache)
    return metadata
  } catch {
    return cached ?? null
  }
}

/**
 * Fetch metadata for multiple repos in parallel.
 * Respects cache and skips non-GitHub URLs.
 */
export async function fetchAllRepoMetadata(
  repoUrls: string[],
): Promise<Map<string, RepoMetadata>> {
  const results = new Map<string, RepoMetadata>()
  const fetches = repoUrls.map(async (url) => {
    const meta = await fetchRepoMetadata(url)
    if (meta) results.set(url, meta)
  })
  await Promise.all(fetches)
  return results
}

/** Clear the repo metadata cache. */
export function clearRepoMetadataCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    // noop
  }
}
