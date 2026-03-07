import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { GlassCard } from '@/components/ui/glass-card'
import { useKV } from '@/lib/local-storage-kv'
import { useSite } from '@/lib/site-context'
import { toast } from 'sonner'
import {
  Globe, GithubLogo, ArrowSquareOut, Lightning,
  CheckCircle, Warning, TreeStructure, Copy,
  Shield, Certificate, Pulse, Gear,
  CircleNotch, Eye, Lock, Code
} from '@phosphor-icons/react'

// ─── Types ──────────────────────────────────────────────────

interface SatelliteStatus {
  id: string
  name: string
  slug: string
  description: string
  liveUrl: string
  repoPath: string
  basePath: string
  accentColor: string
  techNotes: string
  status: 'live' | 'building' | 'error' | 'disabled'
}

interface EvidentConfig {
  domain: string
  enforceHttps: boolean
  lastDeploy: string | null
  lastBuildStatus: 'success' | 'failure' | 'pending' | null
  autoDeployOnPush: boolean
  workflowUrl: string
  repoUrl: string
  notes: string
}

const EVIDENT_CONFIG_KEY = 'xtx396-evident-config'

const defaultConfig: EvidentConfig = {
  domain: 'evident.icu',
  enforceHttps: true,
  lastDeploy: null,
  lastBuildStatus: null,
  autoDeployOnPush: true,
  workflowUrl: 'https://github.com/DTMBX/EVIDENT/actions/workflows/pages.yml',
  repoUrl: 'https://github.com/DTMBX/EVIDENT',
  notes: ''
}

const satellites: SatelliteStatus[] = [
  {
    id: 'civics-hierarchy',
    name: 'Civics Hierarchy',
    slug: 'civics-hierarchy',
    description: 'Constitutional law reference — 13 navigable views mapping the hierarchy of legal authority.',
    liveUrl: 'https://civics.evident.icu/',
    repoPath: 'apps/civics-hierarchy',
    basePath: '/',
    accentColor: 'blue',
    techNotes: 'React 18 · Vite · Hash Routing · Tailwind CSS',
    status: 'live'
  },
  {
    id: 'epstein-library',
    name: 'Document Library',
    slug: 'epstein-library',
    description: 'DOJ evidence analysis — three processing engines, source verification scoring.',
    liveUrl: 'https://library.evident.icu/',
    repoPath: 'apps/epstein-library-evid',
    basePath: '/',
    accentColor: 'amber',
    techNotes: 'React 18 · Vite · Radix UI · Phosphor Icons',
    status: 'live'
  },
  {
    id: 'essential-goods',
    name: 'Essential Goods Ledger',
    slug: 'essential-goods',
    description: 'Economic analysis — commodity pricing, supply chain metrics, cost-of-living indicators.',
    liveUrl: 'https://ledger.evident.icu/',
    repoPath: 'apps/essential-goods-ledg',
    basePath: '/',
    accentColor: 'teal',
    techNotes: 'React 18 · Vite · Recharts · Radix UI',
    status: 'live'
  },
  {
    id: 'geneva-bible-study',
    name: 'Geneva Bible Study',
    slug: 'geneva-bible-study',
    description: 'Offline-capable Scripture study — full-text search, marginal notes, reading plans.',
    liveUrl: 'https://bible.evident.icu/',
    repoPath: 'apps/geneva-bible-study-t',
    basePath: '/',
    accentColor: 'amber',
    techNotes: 'React 18 · Vite · Capacitor · IndexedDB',
    status: 'live'
  },
  {
    id: 'informed-consent',
    name: 'Informed Consent Companion',
    slug: 'informed-consent',
    description: 'Medical informed consent reference with procedure information and patient rights.',
    liveUrl: 'https://consent.evident.icu/',
    repoPath: 'apps/informed-consent-com',
    basePath: '/',
    accentColor: 'emerald',
    techNotes: 'React 18 · Vite · Tailwind CSS',
    status: 'live'
  },
  {
    id: 'contractor-command',
    name: 'Contractor Command Center',
    slug: 'contractor-command',
    description: 'Project management and estimating tools for construction contractors.',
    liveUrl: 'https://contractor.evident.icu/',
    repoPath: 'apps/contractor-command-c',
    basePath: '/',
    accentColor: 'teal',
    techNotes: 'React 18 · Vite · PWA · Tailwind CSS',
    status: 'live'
  }
]

const accentMap: Record<string, string> = {
  blue: 'border-blue-500/40 bg-blue-500/5',
  amber: 'border-amber-500/40 bg-amber-500/5',
  teal: 'border-teal-500/40 bg-teal-500/5',
  emerald: 'border-emerald-500/40 bg-emerald-500/5',
}

const accentBadge: Record<string, string> = {
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  teal: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

function StatusIndicator({ status }: { status: SatelliteStatus['status'] }) {
  const config: Record<string, { icon: typeof CheckCircle; label: string; className: string }> = {
    live: { icon: CheckCircle, label: 'Live', className: 'text-emerald-400' },
    building: { icon: CircleNotch, label: 'Building', className: 'text-amber-400 animate-spin' },
    error: { icon: Warning, label: 'Error', className: 'text-red-400' },
    disabled: { icon: Lock, label: 'Disabled', className: 'text-muted-foreground' },
  }
  const { icon: Icon, label, className } = config[status]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}>
      <Icon className="h-3.5 w-3.5" weight="fill" />
      {label}
    </span>
  )
}

// ─── Component ──────────────────────────────────────────────

export default function EvidentManager() {
  const [config, setConfig] = useKV<EvidentConfig>(EVIDENT_CONFIG_KEY, defaultConfig)
  const { activeSite } = useSite()
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
    toast.success(`Copied ${label}`)
  }

  const openExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Evident Platform</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Multi-app deployment management for evident.icu — Eleventy landing site + 4 satellite apps.
        </p>
      </div>

      {/* Domain & Infrastructure Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mb-1">Domain</p>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-400" weight="duotone" />
                <span className="font-mono text-sm font-semibold">
                  {config?.domain || 'evident.icu'}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => copyToClipboard(`https://${config?.domain || 'evident.icu'}`, 'domain')}
            >
              {copied === 'domain' ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {config?.enforceHttps && (
              <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                <Shield className="h-2.5 w-2.5" weight="fill" /> HTTPS
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] gap-1">
              <Certificate className="h-2.5 w-2.5" /> GitHub Pages
            </Badge>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mb-1">Repository</p>
              <span className="font-mono text-sm">DTMBX/EVIDENT</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => openExternal(config?.repoUrl || defaultConfig.repoUrl)}
            >
              <GithubLogo className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-[10px] gap-1">
              <Code className="h-2.5 w-2.5" /> Eleventy 3 + Vite
            </Badge>
            <Badge variant="outline" className="text-[10px] gap-1">
              npm workspaces
            </Badge>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mb-1">Deploy Pipeline</p>
              <span className="text-sm">GitHub Actions → Pages</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => openExternal(config?.workflowUrl || defaultConfig.workflowUrl)}
            >
              <ArrowSquareOut className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              <Lightning className="h-2.5 w-2.5" weight="fill" /> Parallel Builds
            </Badge>
            {config?.autoDeployOnPush && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Pulse className="h-2.5 w-2.5" /> Auto-deploy
              </Badge>
            )}
          </div>
        </GlassCard>
      </div>

      <Separator />

      {/* Satellite Apps Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">Satellite Apps</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              6 Vite/React apps deployed under /apps/ on evident.icu
            </p>
          </div>
          <Badge variant="outline" className="gap-1 text-xs">
            <TreeStructure className="h-3 w-3" />
            {satellites.filter(s => s.status === 'live').length} / {satellites.length} Live
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {satellites.map((app) => (
            <Card
              key={app.id}
              className={`border ${accentMap[app.accentColor] || 'border-border/50'} transition-colors`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">{app.name}</CardTitle>
                    <CardDescription className="text-xs mt-0.5 line-clamp-2">{app.description}</CardDescription>
                  </div>
                  <StatusIndicator status={app.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Route info */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Base path</span>
                  <code className="font-mono text-[11px] bg-muted/50 px-1.5 py-0.5 rounded">{app.basePath}</code>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Repo path</span>
                  <code className="font-mono text-[11px] bg-muted/50 px-1.5 py-0.5 rounded">{app.repoPath}</code>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Stack</span>
                  <span className="text-[11px] text-muted-foreground/80">{app.techNotes}</span>
                </div>

                <Separator className="opacity-50" />

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs h-8"
                    onClick={() => openExternal(app.liveUrl)}
                  >
                    <Eye className="h-3 w-3" />
                    View Live
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                    onClick={() => openExternal(`${config?.repoUrl || defaultConfig.repoUrl}/tree/main/${app.repoPath}`)}
                  >
                    <GithubLogo className="h-3 w-3" />
                    Source
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Build Architecture */}
      <section>
        <h3 className="text-base font-semibold mb-4">Build Architecture</h3>
        <GlassCard className="p-5">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-primary">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">Workspace Install</p>
                <p className="text-xs text-muted-foreground">
                  Single <code className="text-[11px] bg-muted/50 px-1 rounded">npm ci</code> at repo root — npm workspaces resolves all 4 satellite app dependencies in one deterministic pass.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-primary">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">Eleventy Build</p>
                <p className="text-xs text-muted-foreground">
                  Landing site compiled from Nunjucks templates → <code className="text-[11px] bg-muted/50 px-1 rounded">_site/</code>. Includes SEO meta, schema.org, CNAME passthrough.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-primary">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">Parallel Satellite Builds</p>
                <p className="text-xs text-muted-foreground">
                  All 6 Vite apps built concurrently via bash background processes + <code className="text-[11px] bg-muted/50 px-1 rounded">wait</code>. Output copied to <code className="text-[11px] bg-muted/50 px-1 rounded">_site/apps/&lt;slug&gt;/</code>.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-primary">4</span>
              </div>
              <div>
                <p className="text-sm font-medium">Verify &amp; Deploy</p>
                <p className="text-xs text-muted-foreground">
                  <code className="text-[11px] bg-muted/50 px-1 rounded">pages-verify.js</code> checks CNAME, app outputs, no localhost refs. Then <code className="text-[11px] bg-muted/50 px-1 rounded">actions/deploy-pages@v4</code> publishes to GitHub Pages.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      <Separator />

      {/* Quick Actions */}
      <section>
        <h3 className="text-base font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="h-auto py-3 px-4 flex flex-col items-start gap-1 text-left"
            onClick={() => openExternal(config?.workflowUrl || defaultConfig.workflowUrl)}
          >
            <div className="flex items-center gap-2">
              <Pulse className="h-4 w-4 text-primary" weight="duotone" />
              <span className="text-sm font-medium">View Workflows</span>
            </div>
            <span className="text-[10px] text-muted-foreground">GitHub Actions runs</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-3 px-4 flex flex-col items-start gap-1 text-left"
            onClick={() => openExternal(`${config?.repoUrl || defaultConfig.repoUrl}/settings/pages`)}
          >
            <div className="flex items-center gap-2">
              <Gear className="h-4 w-4 text-primary" weight="duotone" />
              <span className="text-sm font-medium">Pages Settings</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Domain, source, HTTPS</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-3 px-4 flex flex-col items-start gap-1 text-left"
            onClick={() => openExternal(`https://${config?.domain || 'evident.icu'}`)}
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-400" weight="duotone" />
              <span className="text-sm font-medium">Visit evident.icu</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Production site</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-3 px-4 flex flex-col items-start gap-1 text-left"
            onClick={() => openExternal(`${config?.repoUrl || defaultConfig.repoUrl}/pulls`)}
          >
            <div className="flex items-center gap-2">
              <GithubLogo className="h-4 w-4 text-primary" weight="duotone" />
              <span className="text-sm font-medium">Pull Requests</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Open PRs &amp; reviews</span>
          </Button>
        </div>
      </section>

      <Separator />

      {/* DNS Reference */}
      <section>
        <h3 className="text-base font-semibold mb-4">DNS Configuration Reference</h3>
        <GlassCard className="p-5">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">A Records (Apex Domain)</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'].map(ip => (
                  <button
                    key={ip}
                    onClick={() => copyToClipboard(ip, ip)}
                    className="font-mono text-xs bg-muted/30 border border-border/50 rounded px-2.5 py-1.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    {copied === ip ? (
                      <span className="text-emerald-400">Copied</span>
                    ) : (
                      ip
                    )}
                  </button>
                ))}
              </div>
            </div>
            <Separator className="opacity-30" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">CNAME Record (www)</p>
              <button
                onClick={() => copyToClipboard('DTMBX.github.io', 'cname')}
                className="font-mono text-xs bg-muted/30 border border-border/50 rounded px-2.5 py-1.5 hover:bg-muted/50 transition-colors"
              >
                {copied === 'cname' ? (
                  <span className="text-emerald-400">Copied</span>
                ) : (
                  <>www → DTMBX.github.io</>
                )}
              </button>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Notes */}
      <section>
        <h3 className="text-base font-semibold mb-3">Admin Notes</h3>
        <Card>
          <CardContent className="pt-4">
            <textarea
              className="w-full min-h-[80px] bg-transparent text-sm resize-y border border-border/50 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
              placeholder="Internal notes about the Evident deployment, pending changes, or reminders..."
              value={config?.notes || ''}
              onChange={(e) => setConfig({ ...config!, notes: e.target.value })}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
