/**
 * StyleEditorManager
 * ─────────────────────────────────────────────────────────────
 * Visual + Plain-English CSS/Style editor for the Admin Dashboard.
 *
 * Capabilities
 *  1. Plain-English Command Bar  – type "make text bigger", "round corners",
 *     "darker background", etc. → mapped to CSS variable mutations
 *  2. Click-to-Inspect           – activate an element picker; click any
 *     element on the page to select it; then edit its inline styles via sliders
 *  3. CSS Variables Panel        – sliders/pickers for every design token
 *  4. Presets                    – one-click theme presets
 *  5. Custom CSS                 – raw <style> injection
 *
 * All changes are applied live to the document and can be exported as CSS.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  MagicWand,
  Cursor,
  Palette,
  Code,
  Lightning,
  X,
  Copy,
  ArrowCounterClockwise,
  DownloadSimple,
  CheckCircle,
  Eye,
  EyeSlash,
} from '@phosphor-icons/react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CSSVar {
  key: string
  label: string
  type: 'color' | 'size' | 'number'
  unit?: string
  min?: number
  max?: number
  step?: number
  group: string
}

interface Preset {
  name: string
  description: string
  vars: Record<string, string>
}

interface InspectedElement {
  el: HTMLElement
  tag: string
  classes: string
  computed: Partial<CSSStyleDeclaration>
  inline: Record<string, string>
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CSS_VARS: CSSVar[] = [
  // Colors
  { key: '--background',        label: 'Background',        type: 'color', group: 'Colors' },
  { key: '--foreground',        label: 'Foreground',        type: 'color', group: 'Colors' },
  { key: '--card',              label: 'Card',              type: 'color', group: 'Colors' },
  { key: '--primary',           label: 'Primary',           type: 'color', group: 'Colors' },
  { key: '--primary-foreground',label: 'Primary Text',      type: 'color', group: 'Colors' },
  { key: '--secondary',         label: 'Secondary',         type: 'color', group: 'Colors' },
  { key: '--muted',             label: 'Muted',             type: 'color', group: 'Colors' },
  { key: '--muted-foreground',  label: 'Muted Text',        type: 'color', group: 'Colors' },
  { key: '--accent',            label: 'Accent',            type: 'color', group: 'Colors' },
  { key: '--destructive',       label: 'Destructive',       type: 'color', group: 'Colors' },
  { key: '--border',            label: 'Border',            type: 'color', group: 'Colors' },
  { key: '--ring',              label: 'Ring / Focus',      type: 'color', group: 'Colors' },
  // Shape & Spacing
  { key: '--radius',    label: 'Border Radius',     type: 'size', unit: 'rem', min: 0, max: 2, step: 0.05, group: 'Shape' },
  // Typography (font-size is on body via class; these are custom vars if set)
  { key: '--font-size-base', label: 'Base Font Size', type: 'size', unit: 'px', min: 12, max: 24, step: 0.5, group: 'Typography' },
  // Sidebar
  { key: '--sidebar-width', label: 'Sidebar Width', type: 'size', unit: 'rem', min: 12, max: 24, step: 0.5, group: 'Layout' },
]

const PRESETS: Preset[] = [
  {
    name: 'Dark Navy',
    description: 'Deep blue-black with glowing blue accents',
    vars: {
      '--background':        'oklch(0.12 0.04 250)',
      '--foreground':        'oklch(0.97 0 0)',
      '--card':              'oklch(0.18 0.06 250)',
      '--primary':           'oklch(0.65 0.24 250)',
      '--accent':            'oklch(0.75 0.15 200)',
      '--border':            'oklch(0.28 0.05 250)',
      '--radius':            '0.75rem',
    },
  },
  {
    name: 'Midnight Slate',
    description: 'Neutral grey-black, professional and minimal',
    vars: {
      '--background':        'oklch(0.10 0.01 260)',
      '--foreground':        'oklch(0.95 0 0)',
      '--card':              'oklch(0.16 0.01 260)',
      '--primary':           'oklch(0.70 0.18 260)',
      '--accent':            'oklch(0.72 0.10 230)',
      '--border':            'oklch(0.24 0.02 260)',
      '--radius':            '0.5rem',
    },
  },
  {
    name: 'Obsidian Gold',
    description: 'Dark background with warm gold highlights',
    vars: {
      '--background':        'oklch(0.11 0.02 30)',
      '--foreground':        'oklch(0.96 0.02 80)',
      '--card':              'oklch(0.17 0.03 30)',
      '--primary':           'oklch(0.75 0.18 80)',
      '--accent':            'oklch(0.80 0.14 60)',
      '--border':            'oklch(0.26 0.03 40)',
      '--radius':            '0.625rem',
    },
  },
  {
    name: 'Cyber Green',
    description: 'Matrix-inspired dark with neon green accents',
    vars: {
      '--background':        'oklch(0.10 0.03 145)',
      '--foreground':        'oklch(0.95 0.05 145)',
      '--card':              'oklch(0.16 0.04 145)',
      '--primary':           'oklch(0.72 0.25 145)',
      '--accent':            'oklch(0.80 0.20 160)',
      '--border':            'oklch(0.26 0.05 145)',
      '--radius':            '0.25rem',
    },
  },
  {
    name: 'Clean Light',
    description: 'Crisp white with subtle shadows',
    vars: {
      '--background':        'oklch(0.98 0 0)',
      '--foreground':        'oklch(0.10 0 0)',
      '--card':              'oklch(1 0 0)',
      '--primary':           'oklch(0.55 0.22 250)',
      '--accent':            'oklch(0.60 0.18 200)',
      '--border':            'oklch(0.88 0 0)',
      '--radius':            '0.75rem',
    },
  },
]

// ─── Plain-English Command Parser ─────────────────────────────────────────────

type CommandResult = { applied: boolean; message: string }

function parseEnglishCommand(
  cmd: string,
  currentVars: Record<string, string>,
  setVar: (k: string, v: string) => void
): CommandResult {
  const c = cmd.toLowerCase().trim()

  // Helpers
  const shift = (varKey: string, lightnessDelta: number) => {
    const val = currentVars[varKey] || getComputedStyle(document.documentElement).getPropertyValue(varKey).trim()
    const match = val.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)
    if (match) {
      const [, l, c2, h] = match
      const newL = Math.min(1, Math.max(0, parseFloat(l) + lightnessDelta))
      setVar(varKey, `oklch(${newL.toFixed(3)} ${c2} ${h})`)
      return true
    }
    return false
  }

  const shiftRadius = (delta: number) => {
    const val = currentVars['--radius'] || getComputedStyle(document.documentElement).getPropertyValue('--radius').trim()
    const num = parseFloat(val) || 0.75
    setVar('--radius', `${Math.min(3, Math.max(0, num + delta)).toFixed(2)}rem`)
  }

  const shiftFontSize = (delta: number) => {
    const val = currentVars['--font-size-base'] || getComputedStyle(document.documentElement).getPropertyValue('--font-size-base').trim() || '16'
    const num = parseFloat(val) || 16
    const newSize = Math.min(24, Math.max(10, num + delta))
    setVar('--font-size-base', `${newSize}px`)
    document.documentElement.style.fontSize = `${newSize}px`
  }

  // ── Background
  if (/darker? background|background darker?/.test(c)) { shift('--background', -0.06); shift('--card', -0.06); return { applied: true, message: 'Background darkened' } }
  if (/lighter? background|background lighter?/.test(c)) { shift('--background', 0.06); shift('--card', 0.06); return { applied: true, message: 'Background lightened' } }

  // ── Text / Foreground
  if (/bigger? (text|font)|increase font|larger? (text|font)|font (size )?(up|bigger|larger)/.test(c)) { shiftFontSize(2); return { applied: true, message: 'Font size increased' } }
  if (/small(er)? (text|font)|decrease font|font (size )?(down|smaller)/.test(c)) { shiftFontSize(-2); return { applied: true, message: 'Font size decreased' } }

  // ── Corners / Radius
  if (/round(er)? corners?|more rounded|increase radius/.test(c)) { shiftRadius(0.2); return { applied: true, message: 'Border radius increased' } }
  if (/sharp(er)? corners?|less rounded|decrease radius|flat corners?|square corners?/.test(c)) { shiftRadius(-0.2); return { applied: true, message: 'Border radius decreased' } }
  if (/no corners?|sharp|zero radius|pill/.test(c)) {
    const isNone = /no corners?|sharp|zero radius/.test(c)
    setVar('--radius', isNone ? '0rem' : '9999rem')
    return { applied: true, message: isNone ? 'Corners set to square' : 'Pill shape applied' }
  }

  // ── Primary / Accent colors
  if (/primary.*(blue|indigo)/.test(c)) { setVar('--primary', 'oklch(0.65 0.22 250)'); return { applied: true, message: 'Primary set to blue' } }
  if (/primary.*(green|emerald)/.test(c)) { setVar('--primary', 'oklch(0.65 0.22 145)'); return { applied: true, message: 'Primary set to green' } }
  if (/primary.*(red|rose|crimson)/.test(c)) { setVar('--primary', 'oklch(0.65 0.22 20)'); return { applied: true, message: 'Primary set to red' } }
  if (/primary.*(purple|violet|mauve)/.test(c)) { setVar('--primary', 'oklch(0.65 0.22 300)'); return { applied: true, message: 'Primary set to purple' } }
  if (/primary.*(orange|amber)/.test(c)) { setVar('--primary', 'oklch(0.72 0.20 55)'); return { applied: true, message: 'Primary set to orange' } }
  if (/primary.*(gold|yellow)/.test(c)) { setVar('--primary', 'oklch(0.80 0.18 80)'); return { applied: true, message: 'Primary set to gold' } }
  if (/primary.*(teal|cyan)/.test(c)) { setVar('--primary', 'oklch(0.72 0.20 185)'); return { applied: true, message: 'Primary set to teal' } }
  if (/primary.*(pink|hot pink|fuchsia)/.test(c)) { setVar('--primary', 'oklch(0.72 0.24 340)'); return { applied: true, message: 'Primary set to pink' } }

  // ── Presets by name
  for (const preset of PRESETS) {
    if (c.includes(preset.name.toLowerCase())) {
      Object.entries(preset.vars).forEach(([k, v]) => setVar(k, v))
      return { applied: true, message: `Preset "${preset.name}" applied` }
    }
  }

  // ── Borders
  if (/no border|remove border|hide border/.test(c)) { setVar('--border', 'oklch(0 0 0 / 0)'); return { applied: true, message: 'Borders hidden' } }
  if (/show border|add border/.test(c)) { setVar('--border', 'oklch(0.30 0.05 250)'); return { applied: true, message: 'Borders shown' } }

  // ── Compact / Spacious
  if (/compact|dense|tight/.test(c)) {
    setVar('--radius', '0.375rem')
    shiftFontSize(-1)
    return { applied: true, message: 'Compact layout applied' }
  }
  if (/spacious|airy|loose/.test(c)) {
    setVar('--radius', '1rem')
    shiftFontSize(1)
    return { applied: true, message: 'Spacious layout applied' }
  }

  // ── Reset
  if (/reset( all)?|default styles?|undo all/.test(c)) {
    return { applied: false, message: 'Use the "Reset to Defaults" button to reset all styles' }
  }

  return { applied: false, message: `Didn't understand: "${cmd}". Try "darker background", "round corners", "primary blue", etc.` }
}

// ─── Inline Style Editor (for inspected element) ──────────────────────────────

const INLINE_EDITABLE: { prop: string; label: string; type: 'px' | 'color' | 'select' | 'text'; options?: string[] }[] = [
  { prop: 'fontSize',       label: 'Font Size',      type: 'px' },
  { prop: 'fontWeight',     label: 'Font Weight',    type: 'select', options: ['100','200','300','400','500','600','700','800','900'] },
  { prop: 'color',          label: 'Text Color',     type: 'color' },
  { prop: 'backgroundColor',label: 'Background',     type: 'color' },
  { prop: 'borderRadius',   label: 'Border Radius',  type: 'px' },
  { prop: 'padding',        label: 'Padding',        type: 'px' },
  { prop: 'margin',         label: 'Margin',         type: 'px' },
  { prop: 'opacity',        label: 'Opacity',        type: 'text' },
  { prop: 'letterSpacing',  label: 'Letter Spacing', type: 'px' },
  { prop: 'lineHeight',     label: 'Line Height',    type: 'text' },
  { prop: 'borderWidth',    label: 'Border Width',   type: 'px' },
  { prop: 'borderColor',    label: 'Border Color',   type: 'color' },
  { prop: 'boxShadow',      label: 'Box Shadow',     type: 'text' },
  { prop: 'textAlign',      label: 'Text Align',     type: 'select', options: ['left','center','right','justify'] },
  { prop: 'display',        label: 'Display',        type: 'select', options: ['block','flex','inline-flex','inline','grid','none'] },
  { prop: 'gap',            label: 'Gap',            type: 'px' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCurrentVarValue(key: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(key).trim() ||
    document.documentElement.style.getPropertyValue(key).trim()
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StyleEditorManager() {
  // CSS variable overrides  { '--key': 'value' }
  const [vars, setVars] = useState<Record<string, string>>({})
  // Command bar
  const [command, setCommand] = useState('')
  const [cmdHistory, setCmdHistory] = useState<{ text: string; ok: boolean }[]>([])
  const [cmdHistoryIdx, setCmdHistoryIdx] = useState(-1)
  // Custom CSS
  const [customCSS, setCustomCSS] = useState('')
  const customStyleRef = useRef<HTMLStyleElement | null>(null)
  // Inspector
  const [inspecting, setInspecting] = useState(false)
  const [inspected, setInspected] = useState<InspectedElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  // Preview toggle
  const [previewEnabled, setPreviewEnabled] = useState(true)

  // ── Apply CSS vars to :root
  const setVar = useCallback((key: string, value: string) => {
    setVars(prev => ({ ...prev, [key]: value }))
  }, [])

  useEffect(() => {
    if (!previewEnabled) return
    const root = document.documentElement
    Object.entries(vars).forEach(([k, v]) => {
      root.style.setProperty(k, v)
    })
  }, [vars, previewEnabled])

  // ── Custom CSS injection
  useEffect(() => {
    if (!customStyleRef.current) {
      const el = document.createElement('style')
      el.id = 'admin-style-editor-custom'
      document.head.appendChild(el)
      customStyleRef.current = el
    }
    customStyleRef.current.textContent = previewEnabled ? customCSS : ''
  }, [customCSS, previewEnabled])

  // ── Inspector: hover highlight
  useEffect(() => {
    if (!inspecting) {
      if (overlayRef.current) overlayRef.current.style.display = 'none'
      return
    }
    const handleMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      if (!el || el.closest('[data-style-editor]')) return
      if (overlayRef.current) {
        const r = el.getBoundingClientRect()
        overlayRef.current.style.display = 'block'
        overlayRef.current.style.top = `${r.top + window.scrollY}px`
        overlayRef.current.style.left = `${r.left + window.scrollX}px`
        overlayRef.current.style.width = `${r.width}px`
        overlayRef.current.style.height = `${r.height}px`
      }
    }
    const handleClick = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      if (!el || el.closest('[data-style-editor]')) return
      e.preventDefault()
      e.stopPropagation()
      const computed = getComputedStyle(el)
      const inlineStyles: Record<string, string> = {}
      for (const prop of INLINE_EDITABLE) {
        inlineStyles[prop.prop] = (el.style as CSSStyleDeclaration & Record<string, string>)[prop.prop] || ''
      }
      setInspected({
        el,
        tag: el.tagName.toLowerCase(),
        classes: el.className && typeof el.className === 'string' ? el.className : '',
        computed,
        inline: inlineStyles,
      })
      setInspecting(false)
      if (overlayRef.current) overlayRef.current.style.display = 'none'
    }
    document.addEventListener('mousemove', handleMove, true)
    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('mousemove', handleMove, true)
      document.removeEventListener('click', handleClick, true)
    }
  }, [inspecting])

  // ── Command submission
  const submitCommand = () => {
    const trimmed = command.trim()
    if (!trimmed) return
    const result = parseEnglishCommand(trimmed, vars, setVar)
    const entry = { text: trimmed, ok: result.applied }
    setCmdHistory(prev => [entry, ...prev].slice(0, 30))
    if (result.applied) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
    setCommand('')
    setCmdHistoryIdx(-1)
  }

  // ── Export CSS
  const exportCSS = () => {
    const varBlock = Object.entries(vars)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n')
    const full = `:root {\n${varBlock}\n}\n\n${customCSS}`
    navigator.clipboard.writeText(full)
    toast.success('CSS copied to clipboard')
  }

  // ── Reset all
  const resetAll = () => {
    const root = document.documentElement
    Object.keys(vars).forEach(k => root.style.removeProperty(k))
    if (customStyleRef.current) customStyleRef.current.textContent = ''
    setVars({})
    setCustomCSS('')
    setInspected(null)
    toast.success('All style overrides cleared')
  }

  // ── Save to localStorage
  const saveStylesheet = () => {
    localStorage.setItem('admin-style-editor-vars', JSON.stringify(vars))
    localStorage.setItem('admin-style-editor-css', customCSS)
    toast.success('Styles saved to local storage')
  }

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedVars = localStorage.getItem('admin-style-editor-vars')
      const savedCSS = localStorage.getItem('admin-style-editor-css')
      if (savedVars) setVars(JSON.parse(savedVars))
      if (savedCSS) setCustomCSS(savedCSS)
    } catch { /* ignore missing localStorage */ }
  }, [])

  // ── Apply preset
  const applyPreset = (preset: Preset) => {
    Object.entries(preset.vars).forEach(([k, v]) => setVar(k, v))
    toast.success(`Preset "${preset.name}" applied`)
  }

  // Keyboard arrow in command input
  const onCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { submitCommand(); return }
    const cmds = cmdHistory.map(h => h.text)
    if (e.key === 'ArrowUp') {
      const idx = Math.min(cmdHistoryIdx + 1, cmds.length - 1)
      setCmdHistoryIdx(idx)
      setCommand(cmds[idx] ?? '')
    }
    if (e.key === 'ArrowDown') {
      const idx = Math.max(cmdHistoryIdx - 1, -1)
      setCmdHistoryIdx(idx)
      setCommand(idx === -1 ? '' : cmds[idx] ?? '')
    }
  }

  // ── Inspected element inline style editor
  const setInlineStyle = (prop: string, value: string) => {
    if (!inspected) return
    ;(inspected.el.style as CSSStyleDeclaration & Record<string, string>)[prop] = value
    setInspected(prev => prev ? { ...prev, inline: { ...prev.inline, [prop]: value } } : prev)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" data-style-editor>
      {/* Hover overlay for inspector */}
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          border: '2px dashed oklch(0.65 0.24 250)',
          background: 'oklch(0.65 0.24 250 / 0.08)',
          display: 'none',
          zIndex: 9999,
          borderRadius: 4,
          transition: 'all 0.05s',
        }}
      />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Style Editor</h2>
          <p className="text-muted-foreground text-sm">
            Edit styles with plain English, click-to-inspect, visual controls, or raw CSS.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={previewEnabled ? 'default' : 'outline'}
            onClick={() => setPreviewEnabled(v => !v)}
            className="gap-2"
          >
            {previewEnabled ? <Eye className="h-4 w-4"/> : <EyeSlash className="h-4 w-4"/>}
            {previewEnabled ? 'Live Preview ON' : 'Preview OFF'}
          </Button>
          <Button size="sm" variant="outline" onClick={exportCSS} className="gap-2">
            <Copy className="h-4 w-4" /> Copy CSS
          </Button>
          <Button size="sm" variant="outline" onClick={saveStylesheet} className="gap-2">
            <DownloadSimple className="h-4 w-4" /> Save
          </Button>
          <Button size="sm" variant="outline" onClick={resetAll} className="gap-2 text-destructive border-destructive/30">
            <ArrowCounterClockwise className="h-4 w-4" /> Reset All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="command">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="command"  className="gap-1.5 text-xs"><MagicWand className="h-3.5 w-3.5"/>AI Commands</TabsTrigger>
          <TabsTrigger value="inspect"  className="gap-1.5 text-xs"><Cursor className="h-3.5 w-3.5"/>Inspect</TabsTrigger>
          <TabsTrigger value="vars"     className="gap-1.5 text-xs"><Palette className="h-3.5 w-3.5"/>Variables</TabsTrigger>
          <TabsTrigger value="presets"  className="gap-1.5 text-xs"><Lightning className="h-3.5 w-3.5"/>Presets</TabsTrigger>
          <TabsTrigger value="css"      className="gap-1.5 text-xs"><Code className="h-3.5 w-3.5"/>Custom CSS</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Plain-English Commands ─────────────────────────────── */}
        <TabsContent value="command" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Plain-English Style Commands</CardTitle>
              <CardDescription>
                Describe what you want in plain English. Press Enter or click Apply.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder='e.g. "make background darker", "round the corners", "primary green"'
                  value={command}
                  onChange={e => setCommand(e.target.value)}
                  onKeyDown={onCommandKeyDown}
                  className="flex-1 font-mono text-sm"
                />
                <Button onClick={submitCommand} className="gap-2">
                  <MagicWand className="h-4 w-4" /> Apply
                </Button>
              </div>

              {/* Suggestion chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  'darker background',
                  'lighter background',
                  'round corners',
                  'sharp corners',
                  'primary blue',
                  'primary gold',
                  'bigger text',
                  'smaller text',
                  'no borders',
                  'pill buttons',
                  'compact',
                  'spacious',
                ].map(ex => (
                  <button
                    key={ex}
                    onClick={() => { setCommand(ex); }}
                    className="text-xs px-2.5 py-1 rounded-full border border-border/60 bg-muted/30 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {ex}
                  </button>
                ))}
              </div>

              {/* Command history */}
              {cmdHistory.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">History</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {cmdHistory.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-muted/30 cursor-pointer" onClick={() => setCommand(h.text)}>
                        {h.ok
                          ? <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" weight="fill" />
                          : <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        }
                        <span className={cn('font-mono', !h.ok && 'text-muted-foreground')}>{h.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Reference */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Command Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {[
                  { group: 'Background', cmds: ['darker background', 'lighter background'] },
                  { group: 'Corners', cmds: ['round corners', 'sharp corners', 'pill buttons', 'no corners'] },
                  { group: 'Font', cmds: ['bigger text', 'smaller text', 'font size up', 'font size down'] },
                  { group: 'Primary Color', cmds: ['primary blue', 'primary green', 'primary red', 'primary purple', 'primary gold', 'primary teal', 'primary pink', 'primary orange'] },
                  { group: 'Layout', cmds: ['compact', 'spacious'] },
                  { group: 'Borders', cmds: ['no borders', 'show borders'] },
                ].map(({ group, cmds }) => (
                  <div key={group}>
                    <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">{group}</p>
                    <ul className="space-y-0.5">
                      {cmds.map(cmd => (
                        <li key={cmd} className="font-mono text-xs text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => setCommand(cmd)}>
                          "{cmd}"
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Click-to-Inspect ───────────────────────────────────── */}
        <TabsContent value="inspect" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Element Inspector</CardTitle>
              <CardDescription>
                Activate the picker, then click any element on the page to inspect and restyle it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant={inspecting ? 'destructive' : 'default'}
                onClick={() => setInspecting(v => !v)}
                className="gap-2"
              >
                <Cursor className="h-4 w-4" />
                {inspecting ? 'Cancel — click an element' : 'Activate Element Picker'}
              </Button>

              {inspecting && (
                <div className="text-sm text-muted-foreground border border-dashed border-primary/40 rounded-lg p-4 bg-primary/5">
                  Move your cursor over the page. The hovered element will be highlighted. Click to select it.
                </div>
              )}

              {inspected && (
                <div className="space-y-4">
                  {/* Element info */}
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-xs">{inspected.tag}</Badge>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs gap-1" onClick={() => setInspected(null)}>
                        <X className="h-3 w-3" /> Clear
                      </Button>
                    </div>
                    {inspected.classes && (
                      <p className="text-xs font-mono text-muted-foreground truncate">
                        .{inspected.classes.split(' ').filter(Boolean).join(' .')}
                      </p>
                    )}
                  </div>

                  {/* Inline style controls */}
                  <ScrollArea className="h-[520px] pr-2">
                    <div className="space-y-3">
                      {INLINE_EDITABLE.map(({ prop, label, type, options }) => (
                        <div key={prop} className="grid grid-cols-[140px_1fr] items-center gap-3">
                          <Label className="text-xs text-right text-muted-foreground">{label}</Label>
                          {type === 'select' ? (
                            <select
                              value={inspected.inline[prop] || ''}
                              onChange={e => setInlineStyle(prop, e.target.value)}
                              className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                            >
                              <option value="">— inherited —</option>
                              {options?.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : type === 'color' ? (
                            <div className="flex gap-2">
                              <input
                                type="color"
                                className="h-8 w-10 rounded border border-input cursor-pointer"
                                onChange={e => setInlineStyle(prop, e.target.value)}
                              />
                              <Input
                                value={inspected.inline[prop] || ''}
                                onChange={e => setInlineStyle(prop, e.target.value)}
                                className="h-8 font-mono text-xs flex-1"
                                placeholder="oklch( ) or #hex"
                              />
                            </div>
                          ) : type === 'px' ? (
                            <div className="flex gap-2 items-center">
                              <Input
                                value={inspected.inline[prop] || ''}
                                onChange={e => setInlineStyle(prop, e.target.value)}
                                className="h-8 font-mono text-xs"
                                placeholder="e.g. 16px or 1rem"
                              />
                            </div>
                          ) : (
                            <Input
                              value={inspected.inline[prop] || ''}
                              onChange={e => setInlineStyle(prop, e.target.value)}
                              className="h-8 font-mono text-xs"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <p className="text-xs text-muted-foreground">
                    Changes are applied as inline styles directly to the element. They will be lost on page reload unless you copy the CSS.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: CSS Variables ──────────────────────────────────────── */}
        <TabsContent value="vars" className="mt-4 space-y-4">
          {['Colors','Shape','Typography','Layout'].map(group => {
            const groupVars = CSS_VARS.filter(v => v.group === group)
            return (
              <Card key={group}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{group}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groupVars.map(cv => {
                    const current = vars[cv.key] || getCurrentVarValue(cv.key)
                    return (
                      <div key={cv.key} className="grid grid-cols-[150px_1fr] items-center gap-4">
                        <Label className="text-xs text-right text-muted-foreground">{cv.label}</Label>
                        {cv.type === 'color' ? (
                          <div className="flex gap-2 items-center">
                            <div
                              className="w-8 h-8 rounded border border-border flex-shrink-0"
                              style={{ background: current || 'transparent' }}
                            />
                            <Input
                              value={current}
                              onChange={e => setVar(cv.key, e.target.value)}
                              className="font-mono text-xs h-8 flex-1"
                              placeholder="oklch(…) or #hex"
                            />
                            <input
                              type="color"
                              className="h-8 w-10 rounded border border-input cursor-pointer"
                              onChange={e => setVar(cv.key, e.target.value)}
                            />
                          </div>
                        ) : cv.type === 'size' ? (
                          <div className="flex gap-3 items-center">
                            <Slider
                              min={cv.min ?? 0}
                              max={cv.max ?? 2}
                              step={cv.step ?? 0.05}
                              value={[parseFloat(current) || (cv.min ?? 0)]}
                              onValueChange={([v]) => setVar(cv.key, `${v}${cv.unit}`)}
                              className="flex-1"
                            />
                            <span className="text-xs font-mono text-muted-foreground w-16 text-right">
                              {parseFloat(current).toFixed(2)}{cv.unit}
                            </span>
                          </div>
                        ) : (
                          <Input
                            value={current}
                            onChange={e => setVar(cv.key, e.target.value)}
                            className="font-mono text-xs h-8"
                          />
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {/* ── Tab 4: Presets ────────────────────────────────────────────── */}
        <TabsContent value="presets" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {PRESETS.map(preset => (
              <Card
                key={preset.name}
                className="cursor-pointer hover:border-primary/60 transition-colors group"
                onClick={() => applyPreset(preset)}
              >
                <CardContent className="pt-4 pb-4">
                  {/* Swatch row */}
                  <div className="flex gap-1.5 mb-3">
                    {(['--background','--card','--primary','--accent','--border'] as const).map(k => (
                      <div
                        key={k}
                        className="h-6 w-6 rounded-full border border-white/10"
                        style={{ background: preset.vars[k] || 'transparent' }}
                        title={k}
                      />
                    ))}
                  </div>
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">{preset.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
                  <Button size="sm" variant="ghost" className="mt-3 h-7 text-xs w-full">
                    Apply Preset
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Tab 5: Custom CSS ─────────────────────────────────────────── */}
        <TabsContent value="css" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Custom CSS Injection</CardTitle>
              <CardDescription>
                Raw CSS is injected into the page in real time. Use CSS variables, selectors, animations — anything.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={customCSS}
                onChange={e => setCustomCSS(e.target.value)}
                className="font-mono text-xs h-96 resize-y"
                placeholder={`/* Example */\n.card { box-shadow: 0 4px 24px oklch(0 0 0 / 0.3); }\nbutton { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }\n\n/* Animate primary buttons */\n.btn-primary:hover { transform: translateY(-1px); }`}
                spellCheck={false}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setCustomCSS(''); toast.success('Custom CSS cleared') }}>
                  Clear
                </Button>
                <Button size="sm" onClick={() => { navigator.clipboard.writeText(customCSS); toast.success('Copied') }} className="gap-1.5">
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Active overrides summary */}
      {Object.keys(vars).length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-primary mb-2">{Object.keys(vars).length} active variable override{Object.keys(vars).length !== 1 ? 's' : ''}</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(vars).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1 text-[10px] font-mono bg-background border border-border/60 rounded px-1.5 py-0.5">
                  <span className="text-muted-foreground">{k}:</span>
                  <span className="truncate max-w-[120px]">{v}</span>
                  <button onClick={() => {
                    setVars(prev => { const n = { ...prev }; delete n[k]; return n })
                    document.documentElement.style.removeProperty(k)
                  }} className="ml-0.5 text-muted-foreground hover:text-destructive">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
