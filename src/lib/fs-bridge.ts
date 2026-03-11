/**
 * fs-bridge.ts — Browser File System Access API bridge.
 *
 * Provides read/write access to local filesystem directories
 * via the File System Access API (Chrome/Edge 86+).
 *
 * This enables the web builder to:
 *  - Open any local project directory
 *  - Read/write JSON data files directly
 *  - Detect project structure (data directories, config files)
 *  - Work fully offline without Git or a dev server
 *
 * The directory handle is NOT persisted across sessions by default,
 * but can be stored in IndexedDB for "reopen last project" UX.
 */

// ─── Feature Detection ─────────────────────────────────────────────────────

export function supportsFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LocalProject {
  /** Display name (directory name) */
  name: string
  /** The directory handle for FS access */
  handle: FileSystemDirectoryHandle
  /** Detected data directory path (e.g. 'public/data') */
  dataPath: string | null
  /** Files found in the data directory */
  dataFiles: string[]
  /** Whether a package.json was found */
  hasPackageJson: boolean
  /** Whether a CNAME file was found */
  hasCNAME: boolean
  /** Detected project type */
  projectType: 'vite' | 'next' | 'static' | 'unknown'
}

export interface FSFileEntry {
  name: string
  kind: 'file' | 'directory'
  path: string
}

// ─── Directory Picker ───────────────────────────────────────────────────────

/**
 * Open a native directory picker dialog.
 * Returns the directory handle or null if cancelled.
 */
export async function openDirectoryPicker(): Promise<FileSystemDirectoryHandle | null> {
  if (!supportsFileSystemAccess()) return null
  try {
    return await (window as any).showDirectoryPicker({ mode: 'readwrite' })
  } catch (e: any) {
    // User cancelled
    if (e.name === 'AbortError') return null
    throw e
  }
}

// ─── File Operations ────────────────────────────────────────────────────────

/**
 * Read a text file from a directory handle.
 * Path is relative (e.g. 'public/data/settings.json').
 */
export async function readFile(
  root: FileSystemDirectoryHandle,
  path: string,
): Promise<string | null> {
  try {
    const parts = path.split('/').filter(Boolean)
    let dir = root
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i])
    }
    const fileHandle = await dir.getFileHandle(parts[parts.length - 1])
    const file = await fileHandle.getFile()
    return await file.text()
  } catch {
    return null
  }
}

/**
 * Write a text file to a directory handle.
 * Creates intermediate directories if needed.
 */
export async function writeFile(
  root: FileSystemDirectoryHandle,
  path: string,
  content: string,
): Promise<boolean> {
  try {
    const parts = path.split('/').filter(Boolean)
    let dir = root
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i], { create: true })
    }
    const fileHandle = await dir.getFileHandle(parts[parts.length - 1], { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(content)
    await writable.close()
    return true
  } catch {
    return false
  }
}

/**
 * List files in a directory (non-recursive).
 */
export async function listDirectory(
  root: FileSystemDirectoryHandle,
  path?: string,
): Promise<FSFileEntry[]> {
  try {
    let dir = root
    if (path) {
      const parts = path.split('/').filter(Boolean)
      for (const part of parts) {
        dir = await dir.getDirectoryHandle(part)
      }
    }
    const entries: FSFileEntry[] = []
    for await (const [name, handle] of (dir as any).entries()) {
      entries.push({
        name,
        kind: handle.kind,
        path: path ? `${path}/${name}` : name,
      })
    }
    return entries.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  } catch {
    return []
  }
}

/**
 * Check if a path exists in the directory.
 */
export async function pathExists(
  root: FileSystemDirectoryHandle,
  path: string,
): Promise<boolean> {
  try {
    const parts = path.split('/').filter(Boolean)
    let dir = root
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i])
    }
    const last = parts[parts.length - 1]
    // Try as file first, then directory
    try {
      await dir.getFileHandle(last)
      return true
    } catch {
      await dir.getDirectoryHandle(last)
      return true
    }
  } catch {
    return false
  }
}

// ─── Project Detection ──────────────────────────────────────────────────────

/** Common data directory paths to probe */
const DATA_DIR_CANDIDATES = [
  'public/data',
  'data',
  'src/data',
  'static/data',
  'content/data',
  '_data',
]

/**
 * Analyze a directory to detect project structure.
 * Returns a LocalProject with detected metadata.
 */
export async function analyzeProject(
  handle: FileSystemDirectoryHandle,
): Promise<LocalProject> {
  const name = handle.name

  // Check for common project indicators
  const hasPackageJson = await pathExists(handle, 'package.json')
  const hasCNAME = await pathExists(handle, 'CNAME')
  const hasViteConfig = await pathExists(handle, 'vite.config.ts') || await pathExists(handle, 'vite.config.js')
  const hasNextConfig = await pathExists(handle, 'next.config.js') || await pathExists(handle, 'next.config.ts')

  const projectType: LocalProject['projectType'] = hasViteConfig
    ? 'vite'
    : hasNextConfig
    ? 'next'
    : hasPackageJson
    ? 'unknown'
    : 'static'

  // Probe for data directory
  let dataPath: string | null = null
  let dataFiles: string[] = []

  for (const candidate of DATA_DIR_CANDIDATES) {
    try {
      const entries = await listDirectory(handle, candidate)
      const jsonFiles = entries.filter(e => e.kind === 'file' && e.name.endsWith('.json'))
      if (jsonFiles.length > 0) {
        dataPath = candidate
        dataFiles = jsonFiles.map(e => e.name)
        break
      }
    } catch {
      // Directory doesn't exist, try next
    }
  }

  return {
    name,
    handle,
    dataPath,
    dataFiles,
    hasPackageJson,
    hasCNAME,
    projectType,
  }
}

// ─── IndexedDB Handle Persistence ───────────────────────────────────────────

const IDB_NAME = 'wb-fs-handles'
const IDB_STORE = 'handles'

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Save a directory handle for later reopening.
 * Key should be the workspace ID.
 */
export async function saveDirectoryHandle(key: string, handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openIDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(handle, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Retrieve a saved directory handle.
 * Returns null if not found or permission expired.
 */
export async function getSavedDirectoryHandle(key: string): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openIDB()
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

/**
 * Verify that a saved handle still has permission.
 * Prompts user if needed (must be called from user gesture).
 */
export async function verifyPermission(
  handle: FileSystemDirectoryHandle,
  mode: 'read' | 'readwrite' = 'readwrite',
): Promise<boolean> {
  try {
    const opts = { mode } as any
    if (await (handle as any).queryPermission(opts) === 'granted') return true
    if (await (handle as any).requestPermission(opts) === 'granted') return true
    return false
  } catch {
    return false
  }
}
