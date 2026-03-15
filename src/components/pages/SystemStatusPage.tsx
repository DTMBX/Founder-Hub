/**
 * SystemStatusPage — Ecosystem health dashboard.
 *
 * Displays real-time status of all Evident ecosystem services with
 * auto-refresh, sparkline history bars, uptime percentages, and
 * StatusPage JSON-LD structured data.
 *
 * Falls back to client-side HEAD checks if the /api/health
 * Cloudflare Worker is unreachable.
 */

import {
  ArrowClockwise,
  ArrowLeft,
  CheckCircle,
  Clock,
  Globe,
  Timer,
  Warning,
  XCircle,
} from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { GlassCard } from '@/components/ui/glass-card'
import { usePageMeta } from '@/hooks/use-page-meta'

// ─── Types ────────────────────────────────────────────────────

interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latencyMs: number
  message?: string
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down'
  timestamp: string
  checks: HealthCheck[]
  summary: { total: number; healthy: number; degraded: number; down: number }
}

interface CheckHistoryEntry {
  timestamp: number
  status: 'healthy' | 'degraded' | 'down'
}

interface ServiceHistory {
  [serviceName: string]: CheckHistoryEntry[]
}

interface SystemStatusPageProps {
  onBack: () => void
}

// ─── Constants ────────────────────────────────────────────────

const HISTORY_KEY = 'system-status-history'
const MAX_HISTORY = 90
const REFRESH_INTERVAL_S = 60

const STATUS_CONFIG = {
  healthy: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    label: 'Operational',
    barColor: 'bg-emerald-500',
  },
  degraded: {
    icon: Warning,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    label: 'Degraded',
    barColor: 'bg-amber-500',
  },
  down: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    label: 'Down',
    barColor: 'bg-red-500',
  },
}

const SATELLITES = [
  { name: 'Evident Main', url: 'https://www.xtx396.com' },
  { name: 'Founder Hub', url: 'https://devon-tyler.com' },
  { name: 'Tillerstead', url: 'https://tillerstead.com' },
  { name: 'Civics Hierarchy', url: 'https://civics.xtx396.com' },
  { name: 'Document Library', url: 'https://library.xtx396.com' },
  { name: 'Essential Goods', url: 'https://ledger.xtx396.com' },
  { name: 'Geneva Bible Study', url: 'https://bible.xtx396.com' },
  { name: 'Informed Consent', url: 'https://consent.xtx396.com' },
  { name: 'Contractor CC', url: 'https://contractor.xtx396.com' },
]

// ─── History helpers ──────────────────────────────────────────

function loadHistory(): ServiceHistory {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as ServiceHistory) : {}
  } catch {
    return {}
  }
}

function saveHistory(history: ServiceHistory): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    // Storage full — clear oldest entries
    const trimmed: ServiceHistory = {}
    for (const [key, entries] of Object.entries(history)) {
      trimmed[key] = entries.slice(-30)
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
  }
}

function appendToHistory(
  history: ServiceHistory,
  checks: HealthCheck[],
): ServiceHistory {
  const now = Date.now()
  const updated = { ...history }
  for (const check of checks) {
    const entries = [...(updated[check.name] || [])]
    entries.push({ timestamp: now, status: check.status })
    // Keep last MAX_HISTORY entries
    if (entries.length > MAX_HISTORY) entries.splice(0, entries.length - MAX_HISTORY)
    updated[check.name] = entries
  }
  return updated
}

function computeUptime(entries: CheckHistoryEntry[]): number {
  if (entries.length === 0) return 100
  const healthy = entries.filter(e => e.status === 'healthy').length
  return Math.round((healthy / entries.length) * 100)
}

// ─── Sparkline component ─────────────────────────────────────

function Sparkline({ entries }: { entries: CheckHistoryEntry[] }) {
  // Pad to MAX_HISTORY for consistent width
  const padded: (CheckHistoryEntry | null)[] = [
    ...Array<null>(Math.max(0, MAX_HISTORY - entries.length)).fill(null),
    ...entries.slice(-MAX_HISTORY),
  ]

  return (
    <div
      className="flex items-end gap-px h-4"
      role="img"
      aria-label={`Status history: ${entries.length} checks recorded`}
    >
      {padded.map((entry, i) => (
        <div
          key={i}
          className={`w-[2px] rounded-full transition-colors ${
            !entry
              ? 'bg-border/20 h-1'
              : `${STATUS_CONFIG[entry.status].barColor} h-full`
          }`}
          title={
            entry
              ? `${STATUS_CONFIG[entry.status].label} — ${new Date(entry.timestamp).toLocaleString()}`
              : undefined
          }
        />
      ))}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────

export default function SystemStatusPage({ onBack }: SystemStatusPageProps) {
  usePageMeta({
    title: 'System Status',
    description:
      'Real-time operational status and uptime history for the Evident ecosystem.',
    path: '/system-status',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'System Status — Devon Tyler Barber',
        description:
          'Real-time operational status and uptime history for the Evident ecosystem.',
        url: 'https://devon-tyler.com/#system-status',
        mainEntity: {
          '@type': 'WebApplication',
          name: 'Evident Ecosystem Status Dashboard',
          applicationCategory: 'Monitoring',
          operatingSystem: 'Web',
        },
      },
    ],
  })

  const [data, setData] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_S)
  const [history, setHistory] = useState<ServiceHistory>(loadHistory)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval>>(null)

  const runCheck = useCallback(async () => {
    setLoading(true)

    const healthUrl = import.meta.env.VITE_HEALTH_API_URL

    let checks: HealthCheck[] | null = null

    if (healthUrl) {
      try {
        const res = await fetch(healthUrl)
        if (res.ok) {
          const json = (await res.json()) as HealthResponse
          checks = json.checks
        }
      } catch {
        // Fall through to client-side
      }
    }

    if (!checks) {
      // Client-side fallback
      checks = await Promise.all(
        SATELLITES.map(async (sat) => {
          const start = Date.now()
          try {
            await fetch(sat.url, { method: 'HEAD', mode: 'no-cors' })
            const latencyMs = Date.now() - start
            return {
              name: sat.name,
              status: (latencyMs > 5000 ? 'degraded' : 'healthy') as
                | 'healthy'
                | 'degraded',
              latencyMs,
            }
          } catch {
            return {
              name: sat.name,
              status: 'down' as const,
              latencyMs: Date.now() - start,
              message: 'Unreachable',
            }
          }
        }),
      )
    }

    const hasDown = checks.some((c) => c.status === 'down')
    const hasDegraded = checks.some((c) => c.status === 'degraded')

    const response: HealthResponse = {
      status: hasDown ? 'down' : hasDegraded ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      checks,
      summary: {
        total: checks.length,
        healthy: checks.filter((c) => c.status === 'healthy').length,
        degraded: checks.filter((c) => c.status === 'degraded').length,
        down: checks.filter((c) => c.status === 'down').length,
      },
    }

    setData(response)
    setLastChecked(new Date())
    setLoading(false)

    // Update history
    const updated = appendToHistory(history, checks)
    setHistory(updated)
    saveHistory(updated)

    // Reset countdown
    setCountdown(REFRESH_INTERVAL_S)
  }, [history])

  // Initial check
  useEffect(() => {
    runCheck()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh interval
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      runCheck()
    }, REFRESH_INTERVAL_S * 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [runCheck])

  // Countdown timer
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL_S : c - 1))
    }, 1000)
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  const overall = data?.status || 'healthy'
  const overallConfig = STATUS_CONFIG[overall]
  const OverallIcon = overallConfig.icon

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/30">
        <div className="mx-auto max-w-4xl flex items-center gap-4 px-4 py-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="h-4 w-px bg-border/50" />
          <h1 className="text-sm font-semibold">System Status</h1>

          <div className="ml-auto flex items-center gap-4">
            {/* Countdown */}
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/60 tabular-nums">
              <Clock size={12} />
              {countdown}s
            </span>
            <button
              onClick={() => {
                runCheck()
                setCountdown(REFRESH_INTERVAL_S)
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
              aria-label="Refresh status checks"
            >
              <ArrowClockwise
                size={14}
                className={loading ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Overall status banner */}
        <GlassCard
          intensity="high"
          className={`p-6 mb-8 ${overallConfig.border}`}
        >
          <div className="flex items-center gap-4">
            <OverallIcon
              size={32}
              weight="fill"
              className={overallConfig.color}
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold">
                {overall === 'healthy'
                  ? 'All Systems Operational'
                  : overall === 'degraded'
                    ? 'Some Services Degraded'
                    : 'Service Disruption Detected'}
              </h2>
              {lastChecked && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last checked:{' '}
                  {lastChecked.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                  {' · '}Auto-refreshes every {REFRESH_INTERVAL_S}s
                </p>
              )}
            </div>
            {data && (
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums">
                  {data.summary.healthy}/{data.summary.total}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Services Up
                </p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Service rows */}
        {data && (
          <div className="space-y-3">
            {data.checks.map((check) => {
              const config = STATUS_CONFIG[check.status]
              const StatusIcon = config.icon
              const serviceHistory = history[check.name] || []
              const uptime = computeUptime(serviceHistory)

              return (
                <GlassCard key={check.name} intensity="low" className="p-4">
                  <div className="flex items-center gap-4">
                    <StatusIcon
                      size={18}
                      weight="fill"
                      className={config.color}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe
                          size={12}
                          className="text-muted-foreground shrink-0"
                        />
                        <p className="text-sm font-medium truncate">
                          {check.name}
                        </p>
                      </div>
                      {/* Sparkline */}
                      <Sparkline entries={serviceHistory} />
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      {/* Uptime percentage */}
                      <div className="hidden sm:block text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {uptime}%
                        </p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                          uptime
                        </p>
                      </div>
                      {/* Latency */}
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                        <Timer size={10} />
                        {check.latencyMs}ms
                      </span>
                      {/* Status badge */}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bg} ${config.border} border ${config.color}`}
                      >
                        {config.label}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              )
            })}
          </div>
        )}

        {/* Loading state */}
        {loading && !data && (
          <div className="text-center py-16 text-muted-foreground">
            <ArrowClockwise size={32} className="mx-auto mb-4 animate-spin" />
            <p className="text-sm">Checking services...</p>
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-[11px] text-muted-foreground/40 mt-12">
          Status checks run client-side via HEAD requests. Uptime
          percentages reflect checks recorded in this browser.
        </p>
      </div>
    </div>
  )
}
