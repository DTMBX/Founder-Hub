/**
 * HealthPage — Ecosystem status dashboard.
 *
 * Fetches /api/health from the Cloudflare Worker and displays
 * per-service status, latency, and overall health.
 * Falls back to client-side domain checking if no worker is configured.
 */

import {
  ArrowClockwise,
  ArrowLeft,
  CheckCircle,
  Globe,
  Timer,
  Warning,
  XCircle,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

import { GlassCard } from '@/components/ui/glass-card'
import { usePageMeta } from '@/hooks/use-page-meta'

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

interface HealthPageProps {
  onBack: () => void
}

const STATUS_CONFIG = {
  healthy: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Operational' },
  degraded: { icon: Warning, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Degraded' },
  down: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Down' },
}

/** Fallback satellites for client-side checking */
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

export default function HealthPage({ onBack }: HealthPageProps) {
  usePageMeta({
    title: 'System Status',
    description: 'Real-time operational status of the Evident ecosystem.',
    path: '/health',
  })

  const [data, setData] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  async function runCheck() {
    setLoading(true)

    const healthUrl = import.meta.env.VITE_HEALTH_API_URL

    if (healthUrl) {
      try {
        const res = await fetch(healthUrl)
        if (res.ok) {
          const json = await res.json() as HealthResponse
          setData(json)
          setLastChecked(new Date())
          setLoading(false)
          return
        }
      } catch {
        // Fall through to client-side check
      }
    }

    // Client-side fallback: simple HEAD requests with opaque responses
    const checks: HealthCheck[] = await Promise.all(
      SATELLITES.map(async (sat) => {
        const start = Date.now()
        try {
          await fetch(sat.url, { method: 'HEAD', mode: 'no-cors' })
          const latencyMs = Date.now() - start
          return {
            name: sat.name,
            status: (latencyMs > 5000 ? 'degraded' : 'healthy') as 'healthy' | 'degraded',
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
      })
    )

    const hasDown = checks.some(c => c.status === 'down')
    const hasDegraded = checks.some(c => c.status === 'degraded')

    setData({
      status: hasDown ? 'down' : hasDegraded ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      checks,
      summary: {
        total: checks.length,
        healthy: checks.filter(c => c.status === 'healthy').length,
        degraded: checks.filter(c => c.status === 'degraded').length,
        down: checks.filter(c => c.status === 'down').length,
      },
    })
    setLastChecked(new Date())
    setLoading(false)
  }

  useEffect(() => { runCheck() }, [])

  const overall = data?.status || 'healthy'
  const overallConfig = STATUS_CONFIG[overall]
  const OverallIcon = overallConfig.icon

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Back bar */}
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
          <button
            onClick={runCheck}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
            aria-label="Refresh status"
          >
            <ArrowClockwise size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Overall status */}
        <GlassCard intensity="high" className={`p-6 mb-8 ${overallConfig.border}`}>
          <div className="flex items-center gap-4">
            <OverallIcon size={32} weight="fill" className={overallConfig.color} />
            <div>
              <h2 className="text-xl font-bold">
                {overall === 'healthy' ? 'All Systems Operational'
                  : overall === 'degraded' ? 'Some Services Degraded'
                  : 'Service Disruption Detected'}
              </h2>
              {lastChecked && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last checked: {lastChecked.toLocaleTimeString()}
                </p>
              )}
            </div>
            {data && (
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold tabular-nums">{data.summary.healthy}/{data.summary.total}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Services Up</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Individual checks */}
        {data && (
          <div className="space-y-3">
            {data.checks.map(check => {
              const config = STATUS_CONFIG[check.status]
              const StatusIcon = config.icon
              return (
                <GlassCard key={check.name} intensity="low" className="p-4">
                  <div className="flex items-center gap-4">
                    <StatusIcon size={18} weight="fill" className={config.color} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Globe size={12} className="text-muted-foreground" />
                        <p className="text-sm font-medium">{check.name}</p>
                      </div>
                      {check.message && (
                        <p className="text-xs text-muted-foreground mt-0.5">{check.message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Timer size={10} />
                        {check.latencyMs}ms
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bg} ${config.border} border ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              )
            })}
          </div>
        )}

        {loading && !data && (
          <div className="text-center py-16 text-muted-foreground">
            <ArrowClockwise size={32} className="mx-auto mb-4 animate-spin" />
            <p className="text-sm">Checking services...</p>
          </div>
        )}
      </div>
    </div>
  )
}
