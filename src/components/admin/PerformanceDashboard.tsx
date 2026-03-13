/**
 * PerformanceDashboard.tsx — Admin panel for Core Web Vitals & crash logs.
 *
 * Reads from localStorage keys populated by:
 *  - src/lib/web-vitals.ts  → 'founder-hub:web-vitals'
 *  - src/ErrorFallback.tsx   → 'founder-hub:crash-log'
 */

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Gauge, Bug, Trash, ArrowsClockwise, Clock, Warning,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

interface VitalEntry {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
}

interface CrashEntry {
  message: string
  stack?: string
  url: string
  timestamp: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const VITALS_KEY = 'founder-hub:web-vitals'
const CRASH_KEY = 'founder-hub:crash-log'

const ratingColors: Record<string, string> = {
  good: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  'needs-improvement': 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  poor: 'bg-red-500/15 text-red-600 border-red-500/30',
}

const metricUnits: Record<string, string> = {
  CLS: '',
  FCP: 'ms',
  LCP: 'ms',
  TTFB: 'ms',
  INP: 'ms',
}

function formatRelative(ts: number | string): string {
  const ms = typeof ts === 'string' ? Date.now() - new Date(ts).getTime() : Date.now() - ts
  if (ms < 60_000) return 'just now'
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`
  return `${Math.floor(ms / 86_400_000)}d ago`
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PerformanceDashboard() {
  const [vitals, setVitals] = useState<VitalEntry[]>([])
  const [crashes, setCrashes] = useState<CrashEntry[]>([])
  const [tab, setTab] = useState<'vitals' | 'crashes'>('vitals')

  const load = () => {
    try {
      setVitals(JSON.parse(localStorage.getItem(VITALS_KEY) || '[]'))
      setCrashes(JSON.parse(localStorage.getItem(CRASH_KEY) || '[]'))
    } catch { /* corrupt data */ }
  }

  useEffect(() => { load() }, [])

  // Compute latest value per metric
  const latestByMetric = vitals.reduce<Record<string, VitalEntry>>((acc, v) => {
    if (!acc[v.name] || v.timestamp > acc[v.name].timestamp) acc[v.name] = v
    return acc
  }, {})

  const clearVitals = () => {
    localStorage.removeItem(VITALS_KEY)
    setVitals([])
    toast.success('Web Vitals history cleared')
  }

  const clearCrashes = () => {
    localStorage.removeItem(CRASH_KEY)
    setCrashes([])
    toast.success('Crash log cleared')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Gauge className="h-5 w-5" /> Performance & Stability
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Core Web Vitals and crash reports from this browser
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={load}>
          <ArrowsClockwise className="h-4 w-4" />
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
        <button
          onClick={() => setTab('vitals')}
          className={cn(
            'flex-1 text-sm py-1.5 rounded-md transition-colors',
            tab === 'vitals' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Web Vitals ({vitals.length})
        </button>
        <button
          onClick={() => setTab('crashes')}
          className={cn(
            'flex-1 text-sm py-1.5 rounded-md transition-colors',
            tab === 'crashes' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Crashes ({crashes.length})
          {crashes.length > 0 && (
            <span className="ml-1 inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* ── Web Vitals Tab ─────────────────────────────────────────────── */}
      {tab === 'vitals' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          {Object.keys(latestByMetric).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {['LCP', 'FCP', 'CLS', 'INP', 'TTFB'].map((name) => {
                const entry = latestByMetric[name]
                if (!entry) return (
                  <div key={name} className="rounded-lg border border-dashed border-border/50 p-3 text-center">
                    <div className="text-xs text-muted-foreground">{name}</div>
                    <div className="text-lg font-mono text-muted-foreground/50">—</div>
                  </div>
                )
                return (
                  <div key={name} className={cn('rounded-lg border p-3 text-center', ratingColors[entry.rating])}>
                    <div className="text-xs font-medium opacity-80">{name}</div>
                    <div className="text-lg font-mono font-bold">
                      {name === 'CLS' ? entry.value.toFixed(3) : Math.round(entry.value)}
                      <span className="text-xs font-normal ml-0.5">{metricUnits[name]}</span>
                    </div>
                    <div className="text-[10px] opacity-60">{entry.rating}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No web vitals recorded yet. Browse the site to collect metrics.
            </div>
          )}

          {/* History */}
          {vitals.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">History ({vitals.length} entries)</h3>
                <Button variant="ghost" size="sm" onClick={clearVitals} className="text-xs h-7">
                  <Trash className="h-3 w-3 mr-1" /> Clear
                </Button>
              </div>
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {[...vitals].reverse().map((v, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-muted/50">
                      <Badge variant="outline" className={cn('text-[10px] py-0', ratingColors[v.rating])}>
                        {v.name}
                      </Badge>
                      <span className="font-mono">
                        {v.name === 'CLS' ? v.value.toFixed(3) : Math.round(v.value)}{metricUnits[v.name]}
                      </span>
                      <span className="text-muted-foreground ml-auto flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatRelative(v.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      )}

      {/* ── Crashes Tab ────────────────────────────────────────────────── */}
      {tab === 'crashes' && (
        <div className="space-y-4">
          {crashes.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-1.5">
                  <Warning className="h-4 w-4 text-red-500" /> {crashes.length} crash{crashes.length !== 1 && 'es'} recorded
                </h3>
                <Button variant="ghost" size="sm" onClick={clearCrashes} className="text-xs h-7">
                  <Trash className="h-3 w-3 mr-1" /> Clear
                </Button>
              </div>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {[...crashes].reverse().map((c, i) => (
                    <div key={i} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Bug className="h-4 w-4 text-red-500 shrink-0" />
                          <span className="text-sm font-medium text-red-600 line-clamp-1">{c.message}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatRelative(c.timestamp)}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">{c.url}</div>
                      {c.stack && (
                        <pre className="text-[10px] text-muted-foreground bg-muted/50 rounded p-2 overflow-auto max-h-20 font-mono">
                          {c.stack}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Bug className="h-8 w-8 mx-auto mb-2 opacity-20" />
              No crashes recorded. That&apos;s great!
            </div>
          )}
        </div>
      )}
    </div>
  )
}
