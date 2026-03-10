/**
 * DevCustomizer — Integrated element-selecting, content-editing,
 * style-tweaking overlay for localhost development.
 *
 * Modes:
 *  1. Navigate  – quick links to admin panels (original DevToolbar)
 *  2. Inspect   – click any element → see computed styles, section, source hints
 *  3. Content   – click a content section/card → inline data editor
 *  4. Style     – CSS vars + presets from the public site view
 *  5. Workspace – cross-repo launcher for the Evident monolith
 */

import { useState, useEffect, useRef, useCallback, lazy, Suspense, useMemo } from 'react'
import { isLocalhost } from '@/lib/local-storage-kv'
import { cn } from '@/lib/utils'
import {
  Wrench, X, Pencil, ShoppingBag, FolderOpen, UserCircle,
  Scales, Newspaper, PaperPlaneRight, TrendUp, Gear, Export,
  ArrowSquareOut, Crosshair, Stack, Eye,
  Code, CursorClick, ArrowsOutCardinal, Palette, Lightning,
  CaretLeft, CaretRight, Browsers, Copy, ArrowCounterClockwise,
  ChatCircle, NotePencil, Cube, Monitor, ListBullets, SlidersHorizontal,
  Rows, ClockCounterClockwise, ShieldCheck, Command, UserSwitch, Lock,
} from '@phosphor-icons/react'
import { useStudioPermissions, type StudioAction } from '@/lib/studio-permissions'
import type { UserRole } from '@/lib/types'
import type { AuditReport } from '@/lib/validation-audit'
import { toast } from 'sonner'

const EditorPanel = lazy(() => import('./dev/EditorPanel'))
const ChatPanel = lazy(() => import('./dev/ChatPanel'))
const ComponentPalette = lazy(() => import('./dev/ComponentPalette'))
const PreviewPanel = lazy(() => import('./dev/PreviewPanel'))
const StructurePanel = lazy(() => import('./dev/StructurePanel'))
const InspectorPanel = lazy(() => import('./dev/InspectorPanel'))
const CollectionPanel = lazy(() => import('./dev/CollectionPanel'))
const HistoryPanel = lazy(() => import('./dev/HistoryPanel'))
const AuditPanel = lazy(() => import('./dev/AuditPanel'))
const CommandPalette = lazy(() => import('./dev/CommandPalette'))

// ─── Types ──────────────────────────────────────────────────────────────────

type CustomizerMode = 'navigate' | 'inspect' | 'content' | 'style' | 'workspace' | 'editor' | 'chat' | 'components' | 'preview' | 'structure' | 'inspector' | 'collection' | 'history' | 'audit'

interface InspectedElement {
  tagName: string
  id?: string
  className?: string
  section?: string
  kvKey?: string
  adminTab?: string
  contentType?: string
  contentId?: string
  contentTitle?: string
  rect: DOMRect
  computedStyles: Record<string, string>
}

interface QuickLink {
  label: string
  icon: React.ElementType
  adminTab: string
  jsonFile?: string
}

interface WorkspaceApp {
  name: string
  path: string
  port?: number
  url?: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

const QUICK_LINKS: QuickLink[] = [
  { label: 'Services / Offerings', icon: ShoppingBag, adminTab: 'offerings', jsonFile: 'offerings.json' },
  { label: 'Projects', icon: FolderOpen, adminTab: 'projects', jsonFile: 'projects.json' },
  { label: 'About / Updates', icon: UserCircle, adminTab: 'about', jsonFile: 'about.json' },
  { label: 'Court Cases', icon: Scales, adminTab: 'court', jsonFile: 'court-cases.json' },
  { label: 'Proof & Press', icon: Newspaper, adminTab: 'links', jsonFile: 'links.json' },
  { label: 'Contact Links', icon: PaperPlaneRight, adminTab: 'profile', jsonFile: 'contact-links.json' },
  { label: 'Investor Section', icon: TrendUp, adminTab: 'investor', jsonFile: 'investor.json' },
  { label: 'Section Order', icon: Pencil, adminTab: 'content', jsonFile: 'sections.json' },
  { label: 'Site Settings', icon: Gear, adminTab: 'settings', jsonFile: 'settings.json' },
]

const CSS_VARS: { key: string; label: string; type: 'color' | 'size' }[] = [
  { key: '--background', label: 'Background', type: 'color' },
  { key: '--foreground', label: 'Foreground', type: 'color' },
  { key: '--card', label: 'Card', type: 'color' },
  { key: '--primary', label: 'Primary', type: 'color' },
  { key: '--accent', label: 'Accent', type: 'color' },
  { key: '--muted', label: 'Muted', type: 'color' },
  { key: '--border', label: 'Border', type: 'color' },
  { key: '--radius', label: 'Radius', type: 'size' },
]

const THEME_PRESETS: { name: string; vars: Record<string, string> }[] = [
  {
    name: 'Dark Navy',
    vars: { '--background': '222 47% 8%', '--foreground': '210 40% 96%', '--primary': '217 91% 60%', '--accent': '199 89% 48%' },
  },
  {
    name: 'Midnight Slate',
    vars: { '--background': '224 71% 4%', '--foreground': '210 20% 95%', '--primary': '263 70% 55%', '--accent': '270 80% 65%' },
  },
  {
    name: 'Obsidian Gold',
    vars: { '--background': '0 0% 5%', '--foreground': '0 0% 95%', '--primary': '45 93% 47%', '--accent': '36 100% 50%' },
  },
  {
    name: 'Cyber Green',
    vars: { '--background': '150 20% 4%', '--foreground': '150 20% 96%', '--primary': '142 71% 45%', '--accent': '160 84% 39%' },
  },
  {
    name: 'Clean Light',
    vars: { '--background': '0 0% 100%', '--foreground': '222 47% 11%', '--primary': '222 47% 25%', '--accent': '199 89% 48%' },
  },
]

const WORKSPACE_APPS: WorkspaceApp[] = [
  { name: 'Founder-Hub', path: 'Founder-Hub', port: 5173, url: 'http://localhost:5173' },
  { name: 'Tillerstead', path: 'ventures/Tillerstead' },
  { name: 'Civics Hierarchy', path: 'ventures/Civics Hierarchy' },
  { name: 'DOJ Library', path: 'ventures/DOJ Document Library Tool' },
  { name: 'Essential Goods', path: 'ventures/Essential Goods Ledger' },
  { name: 'Geneva Bible', path: 'ventures/Geneve Bible Study' },
  { name: 'Informed Consent', path: 'ventures/Informed Consent Companion' },
  { name: 'Contractor CC', path: 'ventures/Contractor Command Center' },
  { name: 'Sweat Equity', path: 'ventures/Sweat Equity Insurance' },
  { name: 'Approve Pad', path: 'Approve Pad' },
  { name: 'Evident', path: 'Evident' },
]

const INSPECTED_STYLES = [
  'fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderRadius',
  'padding', 'margin', 'lineHeight', 'letterSpacing', 'opacity',
  'border', 'boxShadow', 'display', 'gap',
] as const

// ─── Component ──────────────────────────────────────────────────────────────

export default function DevCustomizer() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<CustomizerMode>('navigate')
  const [inspecting, setInspecting] = useState(false)
  const [inspected, setInspected] = useState<InspectedElement | null>(null)
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null)
  const [hoverLabel, setHoverLabel] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [cssOverrides, setCssOverrides] = useState<Record<string, string>>({})
  const [customCSS, setCustomCSS] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)
  const styleRef = useRef<HTMLStyleElement | null>(null)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null)
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false)
  const isDev = isLocalhost()
  const perms = useStudioPermissions()

  // ─── Navigate helpers ───────────────────────────────────────────────────

  const goToAdmin = (tab: string) => {
    window.location.hash = 'admin'
    sessionStorage.setItem('dev-admin-tab', tab)
    window.location.reload()
  }

  // ─── Inspect mode ──────────────────────────────────────────────────────

  const startInspect = useCallback(() => {
    setInspecting(true)
    setInspected(null)
    document.body.style.cursor = 'crosshair'
  }, [])

  const stopInspect = useCallback(() => {
    setInspecting(false)
    setHoverRect(null)
    setHoverLabel('')
    document.body.style.cursor = ''
  }, [])

  const findContentAncestor = (el: HTMLElement) => {
    let node: HTMLElement | null = el
    while (node) {
      if (node.dataset.contentSection || node.dataset.contentType) return node
      node = node.parentElement
    }
    return null
  }

  const buildLabel = (el: HTMLElement): string => {
    const parts: string[] = []
    if (el.dataset.contentSection) parts.push(`Section: ${el.dataset.contentSection}`)
    if (el.dataset.contentType) parts.push(`${el.dataset.contentType}: ${el.dataset.contentTitle || el.dataset.contentId || ''}`)
    if (parts.length === 0) {
      const tag = el.tagName.toLowerCase()
      const id = el.id ? `#${el.id}` : ''
      const cls = el.className && typeof el.className === 'string'
        ? '.' + el.className.split(' ').slice(0, 2).join('.')
        : ''
      parts.push(`${tag}${id}${cls}`)
    }
    return parts.join(' | ')
  }

  const getInspectedElement = useCallback((el: HTMLElement): InspectedElement => {
    const computed = window.getComputedStyle(el)
    const styles: Record<string, string> = {}
    for (const prop of INSPECTED_STYLES) {
      styles[prop] = computed.getPropertyValue(
        prop.replace(/([A-Z])/g, '-$1').toLowerCase()
      )
    }
    const contentAncestor = findContentAncestor(el)
    return {
      tagName: el.tagName.toLowerCase(),
      id: el.id || undefined,
      className: typeof el.className === 'string' ? el.className : undefined,
      section: contentAncestor?.dataset.contentSection,
      kvKey: contentAncestor?.dataset.kvKey,
      adminTab: contentAncestor?.dataset.adminTab,
      contentType: el.dataset.contentType || contentAncestor?.dataset.contentType,
      contentId: el.dataset.contentId || contentAncestor?.dataset.contentId,
      contentTitle: el.dataset.contentTitle || contentAncestor?.dataset.contentTitle,
      rect: el.getBoundingClientRect(),
      computedStyles: styles,
    }
  }, [])

  useEffect(() => {
    if (!inspecting) return

    const handleMouseMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      if (!el || overlayRef.current?.contains(el)) {
        setHoverRect(null)
        return
      }
      // Prefer content-aware ancestor if present
      const target = findContentAncestor(el) || el
      setHoverRect(target.getBoundingClientRect())
      setHoverLabel(buildLabel(target))
    }

    const handleClick = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      if (!el || overlayRef.current?.contains(el)) return
      const target = findContentAncestor(el) || el
      setInspected(getInspectedElement(target))
      stopInspect()
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stopInspect()
    }

    document.addEventListener('mousemove', handleMouseMove, true)
    document.addEventListener('click', handleClick, true)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true)
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [inspecting, stopInspect, getInspectedElement])

  // ─── Style injection ──────────────────────────────────────────────────

  useEffect(() => {
    // Load saved overrides
    try {
      const saved = localStorage.getItem('dev-customizer-css-vars')
      if (saved) setCssOverrides(JSON.parse(saved))
      const savedCSS = localStorage.getItem('dev-customizer-custom-css')
      if (savedCSS) setCustomCSS(savedCSS)
    } catch { /* ignore corrupted localStorage */ }
  }, [])

  useEffect(() => {
    // Apply CSS variable overrides
    const root = document.documentElement
    for (const [key, val] of Object.entries(cssOverrides)) {
      root.style.setProperty(key, val)
    }
    localStorage.setItem('dev-customizer-css-vars', JSON.stringify(cssOverrides))
  }, [cssOverrides])

  useEffect(() => {
    // Inject custom CSS
    if (!styleRef.current) {
      const s = document.createElement('style')
      s.id = 'dev-customizer-css'
      document.head.appendChild(s)
      styleRef.current = s
    }
    styleRef.current.textContent = customCSS
    localStorage.setItem('dev-customizer-custom-css', customCSS)
  }, [customCSS])

  const setVar = (key: string, value: string) => {
    setCssOverrides(prev => ({ ...prev, [key]: value }))
  }

  const resetVars = () => {
    const root = document.documentElement
    for (const key of Object.keys(cssOverrides)) {
      root.style.removeProperty(key)
    }
    setCssOverrides({})
    localStorage.removeItem('dev-customizer-css-vars')
    toast.success('CSS variables reset')
  }

  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setCssOverrides(prev => ({ ...prev, ...preset.vars }))
    toast.success(`Applied "${preset.name}" preset`)
  }

  const exportCSS = () => {
    const lines: string[] = [':root {']
    for (const [k, v] of Object.entries(cssOverrides)) {
      lines.push(`  ${k}: ${v};`)
    }
    lines.push('}')
    if (customCSS.trim()) {
      lines.push('')
      lines.push('/* Custom CSS */')
      lines.push(customCSS)
    }
    const text = lines.join('\n')
    navigator.clipboard.writeText(text)
    toast.success('CSS copied to clipboard')
  }

  // ─── Keyboard shortcut ────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Shift+D toggles panel
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        setIsOpen(p => !p)
      }
      // Ctrl+Shift+I starts inspect
      if (e.ctrlKey && e.shiftKey && e.key === 'I' && isOpen) {
        e.preventDefault()
        if (inspecting) stopInspect()
        else { setMode('inspect'); startInspect() }
      }
      // Ctrl+K opens command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && isOpen) {
        e.preventDefault()
        setCommandPaletteOpen(p => !p)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, inspecting, startInspect, stopInspect])

  // ─── Mode tabs ────────────────────────────────────────────────────────

  const allModes: { key: CustomizerMode; label: string; icon: React.ElementType }[] = [
    { key: 'navigate', label: 'Nav', icon: ArrowsOutCardinal },
    { key: 'inspect', label: 'Inspect', icon: Crosshair },
    { key: 'content', label: 'Content', icon: Pencil },
    { key: 'style', label: 'Style', icon: Palette },
    { key: 'editor', label: 'Editor', icon: NotePencil },
    { key: 'chat', label: 'Chat', icon: ChatCircle },
    { key: 'components', label: 'Parts', icon: Cube },
    { key: 'structure', label: 'Sections', icon: ListBullets },
    { key: 'inspector', label: 'Props', icon: SlidersHorizontal },
    { key: 'collection', label: 'Items', icon: Rows },
    { key: 'history', label: 'History', icon: ClockCounterClockwise },
    { key: 'audit', label: 'Audit', icon: ShieldCheck },
    { key: 'preview', label: 'Preview', icon: Monitor },
    { key: 'workspace', label: 'Repos', icon: Stack },
  ]

  // Filter modes by permission — inaccessible modes are hidden
  const modes = useMemo(
    () => allModes.filter(m => perms.canAccessMode(m.key)),
    [perms.effectiveRole], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const ROLE_OPTIONS: UserRole[] = ['owner', 'admin', 'editor', 'support']

  // ─── Render ───────────────────────────────────────────────────────────

  // Only render on localhost — guard placed after all hooks
  if (!isDev) return null

  return (
    <>
      {/* Hover highlight overlay */}
      {inspecting && hoverRect && (
        <div
          className="fixed pointer-events-none z-[10001] border-2 border-blue-500 bg-blue-500/10 transition-all duration-75"
          style={{
            top: hoverRect.top,
            left: hoverRect.left,
            width: hoverRect.width,
            height: hoverRect.height,
          }}
        >
          <span className="absolute -top-6 left-0 text-xs bg-blue-600 text-white px-2 py-0.5 rounded whitespace-nowrap max-w-80 truncate">
            {hoverLabel}
          </span>
        </div>
      )}

      {/* Inspected element highlight */}
      {inspected && (
        <div
          className="fixed pointer-events-none z-[10001] border-2 border-emerald-500 bg-emerald-500/10"
          style={{
            top: inspected.rect.top,
            left: inspected.rect.left,
            width: inspected.rect.width,
            height: inspected.rect.height,
          }}
        />
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(p => !p)}
        className={cn(
          'fixed bottom-4 right-4 z-[10002] p-3 rounded-full shadow-lg transition-all duration-200',
          'bg-primary text-primary-foreground hover:scale-105 active:scale-95',
          isOpen && 'rotate-90'
        )}
        aria-label="Developer customizer (Ctrl+Shift+D)"
        title="Dev Customizer — Ctrl+Shift+D"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
      </button>

      {/* Main panel */}
      {isOpen && (
        <div
          ref={overlayRef}
          className={cn(
            'fixed bottom-16 right-4 z-[10000] rounded-xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-200',
            collapsed ? 'w-12' : (mode === 'editor' || mode === 'chat' || mode === 'components' || mode === 'collection') ? 'w-[480px]' : mode === 'preview' ? 'w-[640px]' : 'w-80'
          )}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="w-full py-4 flex justify-center text-muted-foreground hover:text-foreground"
            >
              <CaretLeft className="h-4 w-4" />
            </button>
          ) : (
            <>
              {/* Header */}
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Dev Customizer</p>
                  <p className="text-[10px] text-muted-foreground">
                  localhost only • {perms.effectiveRole}{perms.isSimulated ? ' (sim)' : ''}
                </p>
                </div>
                <div className="flex items-center gap-1">
                  {/* Role simulation switcher (dev only) */}
                  <div className="relative">
                    <button
                      onClick={() => setShowRoleSwitcher(p => !p)}
                      className={cn(
                        'text-muted-foreground hover:text-foreground p-1 flex items-center gap-1',
                        perms.isSimulated && 'text-amber-400 hover:text-amber-300',
                      )}
                      title={perms.isSimulated ? `Simulating: ${perms.effectiveRole} (click to change)` : 'Simulate role (dev only)'}
                    >
                      <UserSwitch className="h-3 w-3" />
                      <span className="text-[9px]">{perms.effectiveRole.charAt(0).toUpperCase()}</span>
                    </button>
                    {showRoleSwitcher && (
                      <div className="absolute top-full right-0 mt-1 w-36 rounded-lg border border-border bg-background/95 backdrop-blur-lg shadow-lg overflow-hidden z-20">
                        <div className="px-2 py-1.5 border-b border-border/50">
                          <p className="text-[9px] text-amber-400 font-medium">DEV ROLE SIM</p>
                          <p className="text-[8px] text-muted-foreground">Client-side only</p>
                        </div>
                        <button
                          onClick={() => { perms.setSimulatedRole(null); setShowRoleSwitcher(false) }}
                          className={cn(
                            'w-full text-left px-3 py-1.5 text-xs transition-colors',
                            !perms.isSimulated ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent/10',
                          )}
                        >
                          Real role
                        </button>
                        {ROLE_OPTIONS.map(role => (
                          <button
                            key={role}
                            onClick={() => { perms.setSimulatedRole(role); setShowRoleSwitcher(false) }}
                            className={cn(
                              'w-full text-left px-3 py-1.5 text-xs transition-colors',
                              perms.isSimulated && perms.effectiveRole === role
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-accent/10',
                            )}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setCommandPaletteOpen(true)}
                    className="text-muted-foreground hover:text-foreground p-1 flex items-center gap-1"
                    title="Command Palette (Ctrl+K)"
                  >
                    <Command className="h-3 w-3" />
                    <span className="text-[9px]">K</span>
                  </button>
                  <button onClick={() => setCollapsed(true)} className="text-muted-foreground hover:text-foreground p-1">
                    <CaretRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Mode tabs */}
              <div className="flex border-b border-border">
                {modes.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setMode(key)
                      if (key === 'inspect') startInspect()
                      else stopInspect()
                    }}
                    className={cn(
                      'flex-1 py-2 text-[10px] font-medium flex flex-col items-center gap-0.5 transition-colors',
                      mode === key
                        ? 'text-primary bg-primary/10 border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Panel content */}
              <div className={mode === 'preview' ? 'h-[60vh] overflow-hidden' : 'max-h-[60vh] overflow-y-auto'}>
                {mode === 'navigate' && <NavigatePanel goToAdmin={goToAdmin} />}
                {mode === 'inspect' && (
                  <InspectPanel
                    inspecting={inspecting}
                    inspected={inspected}
                    onStartInspect={startInspect}
                    onStopInspect={stopInspect}
                    onGoToAdmin={goToAdmin}
                  />
                )}
                {mode === 'content' && (
                  <ContentPanel
                    inspected={inspected}
                    onStartInspect={() => { setMode('inspect'); startInspect() }}
                    onGoToAdmin={goToAdmin}
                  />
                )}
                {mode === 'style' && (
                  <StylePanel
                    cssOverrides={cssOverrides}
                    customCSS={customCSS}
                    onSetVar={setVar}
                    onResetVars={resetVars}
                    onApplyPreset={applyPreset}
                    onExportCSS={exportCSS}
                    onCustomCSSChange={setCustomCSS}
                  />
                )}
                {mode === 'workspace' && <WorkspacePanel />}
                {mode === 'editor' && (
                  <Suspense fallback={<div className="p-4 text-xs text-muted-foreground animate-pulse">Loading editor…</div>}>
                    <EditorPanel />
                  </Suspense>
                )}
                {mode === 'chat' && (
                  <Suspense fallback={<div className="p-4 text-xs text-muted-foreground animate-pulse">Loading chat…</div>}>
                    <ChatPanel />
                  </Suspense>
                )}
                {mode === 'components' && (
                  <Suspense fallback={<div className="p-4 text-xs text-muted-foreground animate-pulse">Scanning components…</div>}>
                    <ComponentPalette />
                  </Suspense>
                )}
                {mode === 'structure' && (
                  <Suspense fallback={<div className="p-4 text-xs text-muted-foreground animate-pulse">Loading sections…</div>}>
                    <StructurePanel />
                  </Suspense>
                )}
                {mode === 'inspector' && (
                  <Suspense fallback={<div className="p-4 text-xs text-muted-foreground animate-pulse">Loading inspector…</div>}>
                    <InspectorPanel />
                  </Suspense>
                )}
                {mode === 'collection' && (
                  <Suspense fallback={<div className="p-4 text-xs text-muted-foreground animate-pulse">Loading collection…</div>}>
                    <CollectionPanel />
                  </Suspense>
                )}
                {mode === 'history' && (
                  <Suspense fallback={<div className="p-4 text-xs text-muted-foreground animate-pulse">Loading history…</div>}>
                    <HistoryPanel />
                  </Suspense>
                )}
                {mode === 'audit' && (
                  <Suspense fallback={<div className="p-4 text-xs text-muted-foreground animate-pulse">Loading audit…</div>}>
                    <AuditPanel initialReport={auditReport} />
                  </Suspense>
                )}
                {mode === 'preview' && (
                  <Suspense fallback={<div className="p-4 text-xs text-muted-foreground animate-pulse">Loading preview…</div>}>
                    <PreviewPanel />
                  </Suspense>
                )}
              </div>
            </>
          )}
        </div>
      )}
      {/* Command Palette */}
      {commandPaletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette
            open={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
            onAuditReport={(report) => {
              setAuditReport(report)
              setMode('audit')
            }}
          />
        </Suspense>
      )}
    </>
  )
}

// ─── Sub-panels ─────────────────────────────────────────────────────────────

function NavigatePanel({ goToAdmin }: { goToAdmin: (tab: string) => void }) {
  return (
    <div className="p-2">
      {QUICK_LINKS.map(link => {
        const Icon = link.icon
        return (
          <button
            key={link.adminTab}
            onClick={() => goToAdmin(link.adminTab)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left text-sm hover:bg-accent/10 transition-colors group"
          >
            <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
            <span className="flex-1 truncate">{link.label}</span>
            {link.jsonFile && (
              <span className="text-[10px] text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                {link.jsonFile}
              </span>
            )}
          </button>
        )
      })}
      <div className="mt-2 p-2 border-t border-border space-y-1">
        <button
          onClick={() => goToAdmin('content')}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <ArrowSquareOut className="h-4 w-4" />
          Open Full Admin Dashboard
        </button>
        <button
          onClick={() => {
            import('@/lib/local-storage-kv').then(mod => mod.downloadDataFiles())
          }}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent/10 transition-colors"
        >
          <Export className="h-4 w-4" />
          Export Data for Commit
        </button>
      </div>
    </div>
  )
}

function InspectPanel({
  inspecting,
  inspected,
  onStartInspect,
  onStopInspect,
  onGoToAdmin,
}: {
  inspecting: boolean
  inspected: InspectedElement | null
  onStartInspect: () => void
  onStopInspect: () => void
  onGoToAdmin: (tab: string) => void
}) {
  return (
    <div className="p-3 space-y-3">
      <button
        onClick={inspecting ? onStopInspect : onStartInspect}
        className={cn(
          'w-full py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors',
          inspecting
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-primary/10 text-primary hover:bg-primary/20'
        )}
      >
        <Crosshair className="h-4 w-4" />
        {inspecting ? 'Click any element… (Esc to cancel)' : 'Start Element Picker'}
      </button>

      {inspected && (
        <div className="space-y-2">
          <div className="rounded-lg bg-card/60 border border-border/40 p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">
              &lt;{inspected.tagName}{inspected.id ? ` id="${inspected.id}"` : ''}&gt;
            </p>

            {inspected.section && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                  Section: {inspected.section}
                </span>
                {inspected.adminTab && (
                  <button
                    onClick={() => onGoToAdmin(inspected.adminTab!)}
                    className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded hover:bg-emerald-500/30 transition-colors"
                  >
                    Edit in Admin →
                  </button>
                )}
              </div>
            )}

            {inspected.contentType && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
                  {inspected.contentType}: {inspected.contentTitle || inspected.contentId}
                </span>
              </div>
            )}

            {inspected.kvKey && (
              <p className="text-[10px] text-muted-foreground font-mono">
                KV: {inspected.kvKey}
              </p>
            )}
          </div>

          {/* Computed styles */}
          <details open className="group">
            <summary className="text-xs font-medium cursor-pointer flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <Eye className="h-3 w-3" /> Computed Styles
            </summary>
            <div className="mt-1 rounded-lg bg-card/40 border border-border/30 p-2 text-[11px] font-mono space-y-0.5 max-h-48 overflow-y-auto">
              {Object.entries(inspected.computedStyles).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k.replace(/([A-Z])/g, '-$1').toLowerCase()}</span>
                  <span className="text-foreground truncate ml-2 max-w-[140px]">{v}</span>
                </div>
              ))}
            </div>
          </details>

          {/* Source hint */}
          <div className="text-[10px] text-muted-foreground bg-card/30 rounded p-2 border border-border/20">
            <p className="font-medium text-foreground mb-1">Source Hints</p>
            {inspected.section && (
              <p>
                <code className="text-blue-400">src/components/sections/{inspected.section.charAt(0).toUpperCase() + inspected.section.slice(1)}Section.tsx</code>
              </p>
            )}
            {inspected.contentType === 'offering' && (
              <p>
                <code className="text-purple-400">src/components/offerings/OfferingCard.tsx</code>
              </p>
            )}
            <p className="mt-1 text-muted-foreground/60">
              Ctrl+click a file in VS Code terminal to open
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function ContentPanel({
  inspected,
  onStartInspect,
  onGoToAdmin,
}: {
  inspected: InspectedElement | null
  onStartInspect: () => void
  onGoToAdmin: (tab: string) => void
}) {
  // Map section IDs to readable descriptions
  const sectionInfo: Record<string, { label: string; description: string; adminTab: string }> = {
    hero: { label: 'Hero Section', description: 'Headline, tagline, CTA buttons', adminTab: 'content' },
    about: { label: 'About Section', description: 'Bio, timeline, updates', adminTab: 'about' },
    services: { label: 'Offerings', description: 'Products, services, pricing', adminTab: 'offerings' },
    projects: { label: 'Projects', description: 'Portfolio, case studies', adminTab: 'projects' },
    court: { label: 'Court Cases', description: 'Legal filings, documents', adminTab: 'court' },
    governance: { label: 'Governance', description: 'Framework narrative', adminTab: 'content' },
    investor: { label: 'Investor', description: 'Metrics, tiers, pitch', adminTab: 'investor' },
    contact: { label: 'Contact', description: 'Email, social links', adminTab: 'profile' },
    proof: { label: 'Press & Proof', description: 'Media, press links', adminTab: 'links' },
  }

  return (
    <div className="p-3 space-y-3">
      <p className="text-xs text-muted-foreground">
        Click a section or card to see its content source, then jump to the admin editor.
      </p>

      {!inspected?.section && !inspected?.contentType ? (
        <>
          <button
            onClick={onStartInspect}
            className="w-full py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <CursorClick className="h-4 w-4" />
            Select an Element
          </button>

          {/* Quick section directory */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">All Sections</p>
            {Object.entries(sectionInfo).map(([key, info]) => (
              <button
                key={key}
                onClick={() => onGoToAdmin(info.adminTab)}
                className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-left text-xs hover:bg-accent/10 transition-colors group"
              >
                <span>
                  <span className="font-medium text-foreground">{info.label}</span>
                  <span className="text-muted-foreground ml-1.5">— {info.description}</span>
                </span>
                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          {inspected?.section && sectionInfo[inspected.section] && (
            <div className="rounded-lg bg-card/60 border border-border/40 p-3">
              <p className="text-sm font-semibold">{sectionInfo[inspected.section].label}</p>
              <p className="text-xs text-muted-foreground mb-2">{sectionInfo[inspected.section].description}</p>
              {inspected.kvKey && (
                <p className="text-[10px] text-muted-foreground font-mono mb-2">
                  Data: {inspected.kvKey.split(',').map(k => k.replace('founder-hub-', '')).join(', ')}
                </p>
              )}
              <button
                onClick={() => onGoToAdmin(sectionInfo[inspected.section!].adminTab)}
                className="w-full py-2 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Pencil className="h-3 w-3" />
                Edit "{sectionInfo[inspected.section].label}" in Admin
              </button>
            </div>
          )}

          {inspected?.contentType === 'offering' && (
            <div className="rounded-lg bg-card/60 border border-border/40 p-3">
              <p className="text-sm font-semibold">Offering: {inspected.contentTitle}</p>
              <p className="text-[10px] text-muted-foreground font-mono mb-2">ID: {inspected.contentId}</p>
              <button
                onClick={() => onGoToAdmin('offerings')}
                className="w-full py-2 rounded-lg text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Pencil className="h-3 w-3" />
                Edit This Offering in Admin
              </button>
            </div>
          )}

          <button
            onClick={onStartInspect}
            className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Select a different element…
          </button>
        </div>
      )}
    </div>
  )
}

function StylePanel({
  cssOverrides,
  customCSS,
  onSetVar,
  onResetVars,
  onApplyPreset,
  onExportCSS,
  onCustomCSSChange,
}: {
  cssOverrides: Record<string, string>
  customCSS: string
  onSetVar: (key: string, value: string) => void
  onResetVars: () => void
  onApplyPreset: (preset: typeof THEME_PRESETS[0]) => void
  onExportCSS: () => void
  onCustomCSSChange: (css: string) => void
}) {
  const [styleTab, setStyleTab] = useState<'vars' | 'presets' | 'css'>('vars')
  const activeCount = Object.keys(cssOverrides).length + (customCSS.trim() ? 1 : 0)

  return (
    <div className="p-3 space-y-3">
      {/* Style sub-tabs */}
      <div className="flex gap-1">
        {(['vars', 'presets', 'css'] as const).map(t => (
          <button
            key={t}
            onClick={() => setStyleTab(t)}
            className={cn(
              'flex-1 py-1.5 text-[10px] font-medium rounded-md transition-colors',
              styleTab === t
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
            )}
          >
            {t === 'vars' ? 'Variables' : t === 'presets' ? 'Presets' : 'Custom CSS'}
          </button>
        ))}
      </div>

      {styleTab === 'vars' && (
        <div className="space-y-2">
          {CSS_VARS.map(v => (
            <div key={v.key} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-20 shrink-0">{v.label}</span>
              {v.type === 'color' ? (
                <input
                  type="text"
                  placeholder="e.g. 222 47% 8%"
                  value={cssOverrides[v.key] || ''}
                  onChange={e => onSetVar(v.key, e.target.value)}
                  className="flex-1 h-7 rounded-md border border-border/40 bg-card/40 px-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <input
                  type="text"
                  placeholder="e.g. 0.75rem"
                  value={cssOverrides[v.key] || ''}
                  onChange={e => onSetVar(v.key, e.target.value)}
                  className="flex-1 h-7 rounded-md border border-border/40 bg-card/40 px-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
            </div>
          ))}
          <div className="flex gap-1 pt-1">
            <button onClick={onResetVars} className="flex-1 py-1.5 text-[10px] rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center gap-1">
              <ArrowCounterClockwise className="h-3 w-3" /> Reset
            </button>
            <button onClick={onExportCSS} className="flex-1 py-1.5 text-[10px] rounded-md bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center gap-1">
              <Copy className="h-3 w-3" /> Copy CSS
            </button>
          </div>
        </div>
      )}

      {styleTab === 'presets' && (
        <div className="space-y-1.5">
          {THEME_PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => onApplyPreset(preset)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left text-xs hover:bg-accent/10 transition-colors group"
            >
              <div className="flex gap-1">
                {Object.values(preset.vars).slice(0, 4).map((v, i) => {
                  // Try to parse HSL for swatch
                  const parts = v.split(' ')
                  const hsl = parts.length === 3 ? `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})` : v
                  return (
                    <div
                      key={i}
                      className="h-4 w-4 rounded-full border border-border/40"
                      style={{ backgroundColor: hsl }}
                    />
                  )
                })}
              </div>
              <span className="font-medium">{preset.name}</span>
              <Lightning className="h-3 w-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}

      {styleTab === 'css' && (
        <div className="space-y-2">
          <textarea
            value={customCSS}
            onChange={e => onCustomCSSChange(e.target.value)}
            placeholder="/* Custom CSS — applied live */&#10;.glass-card { opacity: 0.9; }"
            className="w-full h-32 rounded-md border border-border/40 bg-card/40 p-2 text-[10px] font-mono resize-y focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={onExportCSS}
            className="w-full py-1.5 text-[10px] rounded-md bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center gap-1"
          >
            <Copy className="h-3 w-3" /> Copy All CSS
          </button>
        </div>
      )}

      {activeCount > 0 && (
        <p className="text-[10px] text-muted-foreground text-center">
          {activeCount} override{activeCount > 1 ? 's' : ''} active
        </p>
      )}
    </div>
  )
}

function WorkspacePanel() {
  const openInVSCode = (path: string) => {
    // This works when VS Code is available and registered as protocol handler
    const fullPath = `C:/Users/Devon Tyler/Desktop/${path.includes('/') ? path : `Ventures/${path}`}`
    window.open(`vscode://file/${fullPath}`, '_blank')
  }

  return (
    <div className="p-3 space-y-3">
      <p className="text-xs text-muted-foreground">
        Evident ecosystem — open repos in VS Code or browse running apps.
      </p>

      {WORKSPACE_APPS.map(app => (
        <div
          key={app.name}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/30 hover:border-border/60 transition-colors group"
        >
          <Browsers className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{app.name}</p>
            <p className="text-[10px] text-muted-foreground font-mono truncate">{app.path}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            {app.url && (
              <button
                onClick={() => window.open(app.url, '_blank')}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
                title={`Open ${app.url}`}
              >
                <ArrowSquareOut className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={() => openInVSCode(app.path)}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
              title="Open in VS Code"
            >
              <Code className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
