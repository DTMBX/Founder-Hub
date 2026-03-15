import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { useSite } from '@/lib/site-context'
import { useFeatureFlags } from '@/lib/feature-flags'
import { usePermissions } from '@/lib/route-guards'
import { useKV } from '@/lib/local-storage-kv'
import { hasGitHubToken } from '@/lib/github-sync'
import {
  Globe, Rocket, ShieldCheck, FolderOpen, Tray,
  ArrowRight, TrendUp, Clock, UserCircle, Article,
  Scales, CloudArrowUp, Warning, CheckCircle, Circle,
  CaretDown, CaretUp, Lightbulb, Keyboard, ShoppingBag, Envelope
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { POSTS } from '@/data/posts'

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
  const [checklistCollapsed, setChecklistCollapsed] = useState(false)

  // Onboarding checklist: read key data to detect setup progress
  const [settings] = useKV<Record<string, unknown> | null>('founder-hub-settings', null)
  const [about] = useKV<Record<string, unknown> | null>('founder-hub-about', null)
  const [profile] = useKV<Record<string, unknown> | null>('founder-hub-profile', null)
  const [sections] = useKV<unknown[] | null>('founder-hub-sections', null)
  const [gitConfigured, setGitConfigured] = useState(false)

  // Read real counts for stat cards
  const [blogPosts] = useKV<unknown[] | null>('founder-hub-blog-posts', null)
  const [projects] = useKV<unknown[] | null>('founder-hub-projects', null)
  const [offerings] = useKV<unknown[] | null>('founder-hub-offerings', null)
  const [submissionStates] = useKV<Record<string, { status: string }> | null>('founder-hub-submission-states', null)

  // Check GitHub token on mount
  useMemo(() => {
    hasGitHubToken().then(setGitConfigured)
  }, [])

  const checklistItems = useMemo(() => [
    {
      id: 'site-name',
      label: 'Set your site name',
      description: 'Go to Settings to name your site and configure branding',
      done: !!(settings && (settings as Record<string, unknown>).siteName),
      action: () => onNavigate('settings'),
    },
    {
      id: 'about',
      label: 'Write your About page',
      description: 'Tell visitors who you are and what you do',
      done: !!(about && Object.keys(about).length > 0),
      action: () => onNavigate('about'),
    },
    {
      id: 'profile',
      label: 'Add profile & contact info',
      description: 'Set up your name, email, and professional links',
      done: !!(profile && Object.keys(profile).length > 0),
      action: () => onNavigate('profile'),
    },
    {
      id: 'content',
      label: 'Create your first content section',
      description: 'Add a page section with text, images, or media',
      done: !!(sections && sections.length > 0),
      action: () => onNavigate('content'),
    },
    {
      id: 'github',
      label: 'Connect GitHub for publishing',
      description: 'Add your GitHub token to enable one-click deploys',
      done: gitConfigured,
      action: () => onNavigate('settings'),
    },
  ], [settings, about, profile, sections, gitConfigured, onNavigate])

  const completedCount = checklistItems.filter(i => i.done).length
  const allDone = completedCount === checklistItems.length

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const siteName = activeSatellite?.name || activeSite?.name || 'your site'

  // Compute real counts
  const sectionCount = sections?.length ?? 0
  const blogPostCount = Math.max(POSTS.length, blogPosts?.length ?? 0)
  const projectCount = projects?.length ?? 0
  const offeringCount = offerings?.length ?? 0
  const submissionCount = submissionStates ? Object.keys(submissionStates).length : 0
  const unreadSubmissions = submissionStates
    ? Object.values(submissionStates).filter(s => s.status === 'unread').length
    : 0

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

      {/* Onboarding Checklist — collapses when all done */}
      {!allDone && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" weight="duotone" />
                Getting Started
                <Badge variant="outline" className="text-[10px] ml-1">
                  {completedCount}/{checklistItems.length}
                </Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setChecklistCollapsed(c => !c)}
              >
                {checklistCollapsed ? <CaretDown className="h-3.5 w-3.5" /> : <CaretUp className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-muted mt-2">
              <div
                className="h-1.5 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(completedCount / checklistItems.length) * 100}%` }}
              />
            </div>
          </CardHeader>
          {!checklistCollapsed && (
            <CardContent className="space-y-1 pt-0">
              {checklistItems.map(item => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={cn(
                    'flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-colors',
                    item.done
                      ? 'opacity-60'
                      : 'hover:bg-primary/5'
                  )}
                >
                  {item.done ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" weight="fill" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className={cn('text-sm font-medium', item.done && 'line-through text-muted-foreground')}>
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                  {!item.done && (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 ml-auto" />
                  )}
                </button>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Keyboard tips — shown briefly, dismissible */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border/50 bg-muted/20 text-xs text-muted-foreground">
        <Keyboard className="h-4 w-4 shrink-0" />
        <span>
          <strong className="text-foreground">Tip:</strong>{' '}
          Press <kbd className="inline px-1 py-0.5 rounded border border-border bg-muted text-[10px] font-mono mx-0.5">Ctrl+S</kbd> to save,{' '}
          <kbd className="inline px-1 py-0.5 rounded border border-border bg-muted text-[10px] font-mono mx-0.5">Ctrl+Z</kbd> to undo,{' '}
          <kbd className="inline px-1 py-0.5 rounded border border-border bg-muted text-[10px] font-mono mx-0.5">?</kbd> for all shortcuts
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={Article}
          label="Sections"
          value={sectionCount}
          onClick={() => onNavigate('content')}
        />
        <StatCard
          icon={Article}
          label="Blog Posts"
          value={blogPostCount}
          onClick={() => onNavigate('blog')}
        />
        <StatCard
          icon={FolderOpen}
          label="Projects"
          value={projectCount}
          onClick={() => onNavigate('projects')}
        />
        <StatCard
          icon={ShoppingBag}
          label="Offerings"
          value={offeringCount}
          onClick={() => onNavigate('offerings')}
        />
        <StatCard
          icon={Envelope}
          label="Submissions"
          value={submissionCount}
          trend={unreadSubmissions > 0 ? `${unreadSubmissions} unread` : undefined}
          onClick={() => onNavigate('submissions')}
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
