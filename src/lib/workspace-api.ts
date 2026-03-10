/**
 * workspace-api — browser-side client for the Vite workspace API plugin.
 * Only functional on localhost dev server.
 */

export interface DirEntry {
  name: string
  isDir: boolean
  size?: number
}

export interface RepoInfo {
  key: string
  exists: boolean
}

export interface SearchHit {
  file: string
  line: number
  text: string
}

const BASE = '/__workspace'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data as T
}

export const workspaceApi = {
  /** List available repos */
  repos: () => api<RepoInfo[]>('/repos'),

  /** List directory contents */
  list: (dir: string) => api<DirEntry[]>(`/list?dir=${encodeURIComponent(dir)}`),

  /** Read a file */
  read: (file: string) => api<{ content: string; size: number }>(`/read?file=${encodeURIComponent(file)}`),

  /** Write a file */
  write: (file: string, content: string) =>
    api<{ ok: boolean; path: string }>('/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file, content }),
    }),

  /** Search for text in a repo */
  search: (query: string, dir: string) =>
    api<{ results: SearchHit[]; total: number; capped: boolean }>(
      `/search?q=${encodeURIComponent(query)}&dir=${encodeURIComponent(dir)}`
    ),
}
