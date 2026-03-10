import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { useSite } from '@/lib/site-context'
import { useFeatureFlags } from '@/lib/feature-flags'
import { usePermissions } from '@/lib/route-guards'
import {
  Globe, Rocket, ShieldCheck, FolderOpen, Tray,
  ArrowRight, TrendUp, Clock, UserCircle, Article,
  Scales, CloudArrowUp, Warning
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface DashboardOverviewProps {
  onNavigate: (tabId: string) => void
}

function StatCard({ icon: Icon, label, value, trend, onClick }: {
  icon: React.ComponentType<{ className?: string; weight?: string }>
  label: string
  value: string | number
  trend?: string
  onClick?: () => void
}) {
  return (
    <Card
      className={cn(
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:border-primary/30 hover:shadow-md'
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {trend && (
              <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                <TrendUp className="h-3 w-3" weight="bold" />
                {trend}
              </p>
            )}
          </div>
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" weight="duotone" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickLink({ icon: Icon, label, description, onClick }: {
  icon: React.ComponentType<{ className?: string; weight?: string }>
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-accent/5 transition-all duration-200 text-left w-full group"
    >
      <div className="p-2.5 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" weight="duotone" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
    </button>
  )
}

export default function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const { currentUser } = useAuth()
  const { activeSite, activeSatellite } = useSite()
  const { flags } = useFeatureFlags()
  const permissions = usePermissions()

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const siteName = activeSatellite?.name || activeSite?.name || 'your site'

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}{currentUser?.email ? `, ${currentUser.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">
          Managing <span className="font-medium text-foreground">{siteName}</span>
          {' '}&middot;{' '}
          <Badge variant={permissions.isFounderMode ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 align-middle">
            {permissions.isFounderMode ? 'Founder' : 'Operations'}
          </Badge>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Article}
          label="Content"
          value="—"
          onClick={() => onNavigate('content')}
        />
        <StatCard
          icon={FolderOpen}
          label="Projects"
          value="—"
          onClick={() => onNavigate('projects')}
        />
        <StatCard
          icon={Tray}
          label="Inbox"
          value="—"
          onClick={() => onNavigate('inbox')}
        />
        <StatCard
          icon={Scales}
          label="Cases"
          value="—"
          onClick={() => onNavigate('court')}
        />
      </div>

      {/* Quick actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" weight="duotone" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickLink
              icon={Article}
              label="Edit Content"
              description="Update pages, sections, and site copy"
              onClick={() => onNavigate('content')}
            />
            <QuickLink
              icon={CloudArrowUp}
              label="Upload Files"
              description="Add documents, images, and media"
              onClick={() => onNavigate('upload')}
            />
            <QuickLink
              icon={Globe}
              label="Manage Sites"
              description="View and configure connected sites"
              onClick={() => onNavigate('sites')}
            />
            <QuickLink
              icon={UserCircle}
              label="Update Profile"
              description="Edit contact info and branding"
              onClick={() => onNavigate('profile')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" weight="duotone" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm">Security</span>
                </div>
                <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                  Secure
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm">Deployments</span>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onNavigate('deployments')}>
                  View <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm">Audit Trail</span>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onNavigate('audit')}>
                  View <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>

            {flags.dangerousActions && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
                <Warning className="h-4 w-4 shrink-0" weight="fill" />
                Dangerous actions enabled
              </div>
            )}

            <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Session started {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
