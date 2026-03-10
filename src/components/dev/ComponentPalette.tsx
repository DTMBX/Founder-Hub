/**
 * ComponentPalette — Visual component browser for the DevCustomizer.
 *
 * Shows categorized React components from the Founder-Hub codebase
 * with quick info, source links, and insert-to-editor actions.
 */

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { workspaceApi } from '@/lib/workspace-api'
import {
  Cube,
  MagnifyingGlass,
  CaretRight,
  Eye,
  Code,
  Copy,
  FolderOpen,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

// ─── Component registry ─────────────────────────────────────────────────────

interface ComponentEntry {
  name: string
  file: string
  category: string
  description?: string
}

// Static registry of key components — auto-scanned on mount
const COMPONENT_CATEGORIES = [
  { key: 'sections', label: 'Page Sections', path: 'Founder-Hub/src/components/sections' },
  { key: 'ui', label: 'UI Primitives', path: 'Founder-Hub/src/components/ui' },
  { key: 'admin', label: 'Admin Panels', path: 'Founder-Hub/src/components/admin' },
  { key: 'forms', label: 'Forms', path: 'Founder-Hub/src/components/forms' },
  { key: 'offerings', label: 'Offerings', path: 'Founder-Hub/src/components/offerings' },
  { key: 'landing', label: 'Landing', path: 'Founder-Hub/src/components/landing' },
  { key: 'dev', label: 'Dev Tools', path: 'Founder-Hub/src/components/dev' },
  { key: 'ecommerce', label: 'E-Commerce', path: 'Founder-Hub/src/components/ecommerce' },
  { key: 'seo', label: 'SEO', path: 'Founder-Hub/src/components/seo' },
  { key: 'sites', label: 'Client Sites', path: 'Founder-Hub/src/components/sites' },
  { key: 'mobile', label: 'Mobile', path: 'Founder-Hub/src/components/mobile' },
]

function nameFromFile(fileName: string): string {
  return fileName.replace(/\.(tsx|ts|jsx|js)$/, '')
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ComponentPalette() {
  const [components, setComponents] = useState<ComponentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ name: string; code: string; file: string } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Scan component directories on mount
  useEffect(() => {
    async function scan() {
      const all: ComponentEntry[] = []

      for (const cat of COMPONENT_CATEGORIES) {
        try {
          const entries = await workspaceApi.list(cat.path)
          for (const entry of entries) {
            if (entry.isDir) continue
            if (!/\.(tsx|jsx)$/.test(entry.name)) continue
            if (entry.name.startsWith('index.')) continue
            all.push({
              name: nameFromFile(entry.name),
              file: `${cat.path}/${entry.name}`,
              category: cat.key,
            })
          }
        } catch {
          // Category dir might not exist
        }
      }

      setComponents(all)
      setLoading(false)
    }
    scan()
  }, [])

  const loadPreview = useCallback(async (comp: ComponentEntry) => {
    setPreviewLoading(true)
    try {
      const { content } = await workspaceApi.read(comp.file)
      // Extract first 80 lines for preview
      const preview = content.split('\n').slice(0, 80).join('\n')
      setPreview({ name: comp.name, code: preview, file: comp.file })
    } catch (e: unknown) {
      toast.error(errMsg(e))
    } finally {
      setPreviewLoading(false)
    }
  }, [])

  const copyImport = (comp: ComponentEntry) => {
    // Generate import statement
    const relPath = comp.file
      .replace('Founder-Hub/src/', '@/')
      .replace(/\.(tsx|ts|jsx|js)$/, '')
    const statement = `import ${comp.name} from '${relPath}'`
    navigator.clipboard.writeText(statement)
    toast.success(`Copied: ${statement}`)
  }

  const copyJsx = (comp: ComponentEntry) => {
    const tag = `<${comp.name} />`
    navigator.clipboard.writeText(tag)
    toast.success(`Copied: ${tag}`)
  }

  // ─── Filtered & grouped ───────────────────────────────────────────────

  const filtered = filter
    ? components.filter(
        (c) =>
          c.name.toLowerCase().includes(filter.toLowerCase()) ||
          c.category.toLowerCase().includes(filter.toLowerCase()),
      )
    : components

  const grouped = COMPONENT_CATEGORIES.map((cat) => ({
    ...cat,
    items: filtered.filter((c) => c.category === cat.key),
  })).filter((g) => g.items.length > 0)

  // ─── Preview view ─────────────────────────────────────────────────────

  if (preview) {
    return (
      <div className="flex flex-col h-full max-h-[60vh]">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40">
          <button
            onClick={() => setPreview(null)}
            className="p-1 rounded hover:bg-accent/10 text-muted-foreground hover:text-foreground"
          >
            <CaretRight className="h-3.5 w-3.5 rotate-180" />
          </button>
          <Cube className="h-3.5 w-3.5 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium">{preview.name}</p>
            <p className="text-[9px] text-muted-foreground font-mono truncate">{preview.file}</p>
          </div>
          <button
            onClick={() => copyImport({ name: preview.name, file: preview.file, category: '' })}
            className="px-2 py-1 rounded text-[9px] bg-primary/10 text-primary hover:bg-primary/20"
            title="Copy import statement"
          >
            <Copy className="h-3 w-3 inline mr-0.5" />
            import
          </button>
          <button
            onClick={() => copyJsx({ name: preview.name, file: preview.file, category: '' })}
            className="px-2 py-1 rounded text-[9px] bg-accent/20 text-foreground hover:bg-accent/30"
            title="Copy JSX tag"
          >
            <Code className="h-3 w-3 inline mr-0.5" />
            JSX
          </button>
        </div>
        <pre className="flex-1 p-3 text-[10px] font-mono leading-relaxed overflow-auto bg-background whitespace-pre">
          {preview.code}
        </pre>
      </div>
    )
  }

  // ─── Browser view ─────────────────────────────────────────────────────

  return (
    <div className="p-3 space-y-2">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Filter components…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full h-7 rounded-md border border-border/40 bg-card/40 pl-7 pr-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Stats */}
      <p className="text-[9px] text-muted-foreground">
        {loading ? 'Scanning…' : `${components.length} components in ${grouped.length} categories`}
      </p>

      {/* Categories */}
      <div className="space-y-1 max-h-[50vh] overflow-y-auto">
        {grouped.map((group) => (
          <div key={group.key}>
            <button
              onClick={() =>
                setExpandedCat((p) => (p === group.key ? null : group.key))
              }
              className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-left hover:bg-accent/10 transition-colors"
            >
              <CaretRight
                className={cn(
                  'h-3 w-3 text-muted-foreground transition-transform',
                  expandedCat === group.key && 'rotate-90',
                )}
              />
              <FolderOpen className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] font-medium flex-1">{group.label}</span>
              <span className="text-[9px] text-muted-foreground/60">{group.items.length}</span>
            </button>

            {expandedCat === group.key && (
              <div className="ml-4 mt-0.5 space-y-0.5">
                {group.items.map((comp) => (
                  <div
                    key={comp.file}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-accent/10 transition-colors group"
                  >
                    <Cube className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] flex-1 truncate">{comp.name}</span>
                    <button
                      onClick={() => loadPreview(comp)}
                      disabled={previewLoading}
                      className="p-0.5 rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
                      title="Preview source"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => copyImport(comp)}
                      className="p-0.5 rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
                      title="Copy import"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => copyJsx(comp)}
                      className="p-0.5 rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
                      title="Copy JSX"
                    >
                      <Code className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
