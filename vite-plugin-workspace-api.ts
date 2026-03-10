/**
 * vite-plugin-workspace-api
 * ─────────────────────────────────────────────────────────────
 * Dev-only Vite plugin that adds REST endpoints for reading,
 * writing, listing, and searching files across the Evident
 * workspace repos. Only active in dev mode (never bundled).
 *
 * Endpoints (all under /__workspace/):
 *   GET  /list?dir=<relative>       → directory listing
 *   GET  /read?file=<relative>      → file contents
 *   POST /write  { file, content }  → write file
 *   GET  /search?q=<text>&dir=<rel> → grep-style search
 *   GET  /repos                     → list available repos
 */

import { type Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'

// Workspace root — parent of Desktop/Ventures/*
const DESKTOP = path.resolve(process.env.USERPROFILE || process.env.HOME || '', 'Desktop')

/** Repos we expose to the browser, mapped to their disk paths */
const REPO_MAP: Record<string, string> = {
  'Founder-Hub': path.join(DESKTOP, 'Ventures', 'founder-hub'),
  'Tillerstead': path.join(DESKTOP, 'Ventures', 'tillerstead'),
  'Civics-Hierarchy': path.join(DESKTOP, 'Ventures', 'civics-hierarchy'),
  'DOJ-Library': path.join(DESKTOP, 'Ventures', 'doj-document-library'),
  'Essential-Goods': path.join(DESKTOP, 'Ventures', 'essential-goods-ledger'),
  'Geneva-Bible': path.join(DESKTOP, 'Ventures', 'geneva-bible-study'),
  'Informed-Consent': path.join(DESKTOP, 'Ventures', 'informed-consent'),
  'Contractor-CC': path.join(DESKTOP, 'Ventures', 'Contractor Command Center'),
  'Sweat-Equity': path.join(DESKTOP, 'Ventures', 'sweat-equity-insurance'),
  'Approve-Pad': path.join(DESKTOP, 'Ventures', 'approve-pad'),
  'Evident': path.join(DESKTOP, 'Evident'),
  'tillerstead-toolkit': path.join(DESKTOP, 'Ventures', 'tillerstead-toolkit'),
  'tools': path.join(DESKTOP, 'Ventures', 'tools'),
}

/**
 * Resolve a "repo/relative/path" into an absolute path,
 * validating it stays within the repo root (path traversal guard).
 */
function resolveWorkspacePath(relPath: string): string | null {
  const parts = relPath.split('/')
  const repoKey = parts[0]
  const repoRoot = REPO_MAP[repoKey]
  if (!repoRoot) return null

  const resolved = path.resolve(repoRoot, ...parts.slice(1))
  // Prevent path traversal
  if (!resolved.startsWith(repoRoot)) return null
  return resolved
}

function json(res: import('http').ServerResponse, data: unknown, status = 200) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function error(res: import('http').ServerResponse, msg: string, status = 400) {
  json(res, { error: msg }, status)
}

export default function workspaceApiPlugin(): Plugin {
  return {
    name: 'workspace-api',
    apply: 'serve', // dev only — never included in production build

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '', 'http://localhost')

        if (!url.pathname.startsWith('/__workspace/')) {
          return next()
        }

        const route = url.pathname.replace('/__workspace/', '')

        try {
          // ── GET /repos ──────────────────────────────────────
          if (route === 'repos' && req.method === 'GET') {
            const repos = Object.entries(REPO_MAP).map(([key, diskPath]) => ({
              key,
              exists: fs.existsSync(diskPath),
            }))
            return json(res, repos)
          }

          // ── GET /list?dir=Repo/path ─────────────────────────
          if (route === 'list' && req.method === 'GET') {
            const dir = url.searchParams.get('dir')
            if (!dir) return error(res, 'Missing ?dir= parameter')

            const absDir = resolveWorkspacePath(dir)
            if (!absDir) return error(res, 'Invalid repo or path')
            if (!fs.existsSync(absDir)) return error(res, 'Directory not found', 404)

            const stat = fs.statSync(absDir)
            if (!stat.isDirectory()) return error(res, 'Not a directory')

            const entries = fs.readdirSync(absDir, { withFileTypes: true })
              .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'dist')
              .map(e => ({
                name: e.name,
                isDir: e.isDirectory(),
                size: e.isFile() ? fs.statSync(path.join(absDir, e.name)).size : undefined,
              }))
              .sort((a, b) => {
                if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
                return a.name.localeCompare(b.name)
              })

            return json(res, entries)
          }

          // ── GET /read?file=Repo/path ────────────────────────
          if (route === 'read' && req.method === 'GET') {
            const file = url.searchParams.get('file')
            if (!file) return error(res, 'Missing ?file= parameter')

            const absFile = resolveWorkspacePath(file)
            if (!absFile) return error(res, 'Invalid repo or path')
            if (!fs.existsSync(absFile)) return error(res, 'File not found', 404)

            const stat = fs.statSync(absFile)
            if (stat.isDirectory()) return error(res, 'Path is a directory')

            // Limit file size to 1MB
            if (stat.size > 1_048_576) return error(res, 'File too large (>1MB)')

            const content = fs.readFileSync(absFile, 'utf-8')
            return json(res, { content, size: stat.size })
          }

          // ── POST /write { file, content } ───────────────────
          if (route === 'write' && req.method === 'POST') {
            const chunks: Buffer[] = []
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
            }
            const body = JSON.parse(Buffer.concat(chunks).toString('utf-8'))

            const { file, content } = body
            if (!file || typeof content !== 'string') {
              return error(res, 'Missing file or content in body')
            }

            const absFile = resolveWorkspacePath(file)
            if (!absFile) return error(res, 'Invalid repo or path')

            // Ensure parent directory exists
            const dir = path.dirname(absFile)
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true })
            }

            fs.writeFileSync(absFile, content, 'utf-8')
            return json(res, { ok: true, path: file })
          }

          // ── GET /search?q=text&dir=Repo[/subdir] ───────────
          if (route === 'search' && req.method === 'GET') {
            const query = url.searchParams.get('q')
            const dir = url.searchParams.get('dir')
            if (!query) return error(res, 'Missing ?q= parameter')
            if (!dir) return error(res, 'Missing ?dir= parameter')

            const absDir = resolveWorkspacePath(dir)
            if (!absDir) return error(res, 'Invalid repo or path')
            if (!fs.existsSync(absDir)) return error(res, 'Directory not found', 404)

            const results: { file: string; line: number; text: string }[] = []
            const maxResults = 50

            const SKIP = new Set(['node_modules', 'dist', '.git', '.next', 'build', 'coverage', '__pycache__'])
            const TEXT_EXT = new Set([
              '.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html',
              '.md', '.yml', '.yaml', '.toml', '.txt', '.env', '.sh',
              '.ps1', '.py', '.njk', '.svg', '.xml',
            ])

            function walk(dirPath: string, relBase: string) {
              if (results.length >= maxResults) return
              let entries: fs.Dirent[]
              try { entries = fs.readdirSync(dirPath, { withFileTypes: true }) }
              catch { return }

              for (const entry of entries) {
                if (results.length >= maxResults) return
                if (entry.name.startsWith('.') || SKIP.has(entry.name)) continue

                const full = path.join(dirPath, entry.name)
                const rel = relBase ? `${relBase}/${entry.name}` : entry.name

                if (entry.isDirectory()) {
                  walk(full, rel)
                } else if (entry.isFile()) {
                  const ext = path.extname(entry.name).toLowerCase()
                  if (!TEXT_EXT.has(ext)) continue
                  try {
                    const stat = fs.statSync(full)
                    if (stat.size > 512_000) continue // skip large files
                    const text = fs.readFileSync(full, 'utf-8')
                    const lines = text.split('\n')
                    for (let i = 0; i < lines.length && results.length < maxResults; i++) {
                      if (lines[i].toLowerCase().includes(query!.toLowerCase())) {
                        results.push({ file: `${dir}/${rel}`, line: i + 1, text: lines[i].trim().slice(0, 200) })
                      }
                    }
                  } catch { /* skip unreadable */ }
                }
              }
            }

            walk(absDir, '')
            return json(res, { results, total: results.length, capped: results.length >= maxResults })
          }

          return error(res, 'Unknown route', 404)
        } catch (e: unknown) {
          return error(res, e instanceof Error ? e.message : 'Internal error', 500)
        }
      })

      // ── Ollama AI proxy ─────────────────────────────────────────────────
      // Proxies /__ai/* → http://127.0.0.1:11434/api/* to avoid CORS.
      // Supports streaming responses for chat/generate endpoints.
      const OLLAMA_HOST = '127.0.0.1'
      const OLLAMA_PORT = 11434

      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url || '', 'http://localhost')
        if (!url.pathname.startsWith('/__ai/')) return next()

        const ollamaPath = '/api/' + url.pathname.replace('/__ai/', '')

        // Collect request body for POST
        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', () => {
          const proxyOpts: http.RequestOptions = {
            hostname: OLLAMA_HOST,
            port: OLLAMA_PORT,
            path: ollamaPath,
            method: req.method || 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(chunks.length > 0
                ? { 'Content-Length': Buffer.concat(chunks).length.toString() }
                : {}),
            },
          }

          const proxyReq = http.request(proxyOpts, (proxyRes) => {
            res.statusCode = proxyRes.statusCode || 502
            // Forward content-type for streaming
            const ct = proxyRes.headers['content-type']
            if (ct) res.setHeader('Content-Type', ct)
            res.setHeader('Cache-Control', 'no-cache')
            proxyRes.pipe(res)
          })

          proxyReq.on('error', () => {
            error(res, 'Ollama not reachable at 127.0.0.1:11434 — run `ollama serve`', 503)
          })

          if (chunks.length > 0) {
            proxyReq.write(Buffer.concat(chunks))
          }
          proxyReq.end()
        })
      })
    },
  }
}
