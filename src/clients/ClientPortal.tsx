/**
 * Client Portal
 *
 * Mobile-friendly portal for clients to view:
 * - Project status and updates
 * - Files and deliverables
 * - Subscription status
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  getClientService,
  getProjectService,
  getSubscriptionService,
} from './index'
import type {
  Client,
  Project,
  ProjectUpdate,
  SiteSubscription,
  PortalSession,
} from './types'

// ─── Status Colors ───────────────────────────────────────────

const PROJECT_STATUS_COLORS: Record<string, string> = {
  planned: 'bg-slate-100 text-slate-700',
  active: 'bg-blue-100 text-blue-700',
  review: 'bg-amber-100 text-amber-700',
  complete: 'bg-green-100 text-green-700',
  'on-hold': 'bg-orange-100 text-orange-700',
  cancelled: 'bg-red-100 text-red-700',
}

const SUBSCRIPTION_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-red-100 text-red-700',
  paused: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-slate-100 text-slate-700',
  expired: 'bg-slate-100 text-slate-700',
}

// ─── Login Form ──────────────────────────────────────────────

interface PortalLoginProps {
  onLogin: (session: PortalSession) => void
  error?: string
}

export function PortalLogin({ onLogin, error }: PortalLoginProps) {
  const [token, setToken] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [localError, setLocalError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) return

    setLoading(true)
    setLocalError(null)

    try {
      const clientService = getClientService()
      const session = await clientService.validatePortalToken(token.trim())

      if (session && session.isValid) {
        onLogin(session)
      } else {
        setLocalError('Invalid or expired access token')
      }
    } catch {
      setLocalError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Client Portal</CardTitle>
          <CardDescription>
            Enter your access token to view your projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Access Token</Label>
              <Input
                id="token"
                type="text"
                placeholder="Enter your access token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={loading}
                autoComplete="off"
              />
            </div>

            {(error || localError) && (
              <p className="text-sm text-red-600">{error || localError}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading || !token.trim()}>
              {loading ? 'Verifying...' : 'Access Portal'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            Don't have a token? Contact your account manager.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Project Card ────────────────────────────────────────────

interface ProjectCardProps {
  project: Project
  onClick?: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const statusLabel = project.status.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight">{project.name}</CardTitle>
          <Badge className={PROJECT_STATUS_COLORS[project.status]}>
            {statusLabel}
          </Badge>
        </div>
        {project.description && (
          <CardDescription className="line-clamp-2">
            {project.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>

          {project.estimatedCompletion && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Est. Completion</span>
              <span>{new Date(project.estimatedCompletion).toLocaleDateString()}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Last Update</span>
            <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Project Detail ──────────────────────────────────────────

interface ProjectDetailProps {
  project: Project
  onBack: () => void
}

export function ProjectDetail({ project, onBack }: ProjectDetailProps) {
  const statusLabel = project.status.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back
        </Button>
      </div>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle>{project.name}</CardTitle>
            <Badge className={PROJECT_STATUS_COLORS[project.status]}>
              {statusLabel}
            </Badge>
          </div>
          {project.description && (
            <CardDescription>{project.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-3" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-600">Started</span>
              <p className="font-medium">{new Date(project.startDate).toLocaleDateString()}</p>
            </div>
            {project.estimatedCompletion && (
              <div>
                <span className="text-slate-600">Est. Completion</span>
                <p className="font-medium">
                  {new Date(project.estimatedCompletion).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Updates and Files */}
      <Tabs defaultValue="updates">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="updates" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {project.updates.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No updates yet</p>
              ) : (
                project.updates.map((update) => (
                  <UpdateCard key={update.id} update={update} />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="files" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {project.files.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No files yet</p>
              ) : (
                project.files.map((file) => (
                  <Card key={file.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-slate-500">
                          {(file.size / 1024).toFixed(1)} KB •{' '}
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Update Card ─────────────────────────────────────────────

function UpdateCard({ update }: { update: ProjectUpdate }) {
  const typeIcons: Record<string, string> = {
    status_change: '📊',
    progress: '📈',
    milestone: '🎯',
    note: '📝',
    auto_weekly: '📬',
  }

  return (
    <Card className="p-3">
      <div className="flex gap-3">
        <span className="text-xl">{typeIcons[update.type] ?? '📌'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm truncate">{update.title}</p>
            <span className="text-xs text-slate-500 shrink-0">
              {new Date(update.timestamp).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">{update.content}</p>
        </div>
      </div>
    </Card>
  )
}

// ─── Subscription Card ───────────────────────────────────────

interface SubscriptionCardProps {
  subscription: SiteSubscription
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const statusLabel = subscription.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{subscription.siteName}</CardTitle>
          <Badge className={SUBSCRIPTION_STATUS_COLORS[subscription.status]}>
            {statusLabel}
          </Badge>
        </div>
        <CardDescription>
          {subscription.planTier.charAt(0).toUpperCase() + subscription.planTier.slice(1)} Plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Billing</span>
            <span className="capitalize">{subscription.billingCycle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Renewal Date</span>
            <span>{new Date(subscription.renewalDate).toLocaleDateString()}</span>
          </div>
          {subscription.isPastDue && (
            <p className="text-red-600 font-medium">⚠️ Payment past due</p>
          )}
        </div>

        {subscription.services.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Included Services</p>
            <ul className="text-sm text-slate-600 space-y-1">
              {subscription.services
                .filter((s) => s.included)
                .map((service) => (
                  <li key={service.name}>✓ {service.name}</li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Portal Component ───────────────────────────────────

interface ClientPortalProps {
  initialToken?: string
}

export function ClientPortal({ initialToken }: ClientPortalProps) {
  const [session, setSession] = React.useState<PortalSession | null>(null)
  const [client, setClient] = React.useState<Client | null>(null)
  const [projects, setProjects] = React.useState<Project[]>([])
  const [subscriptions, setSubscriptions] = React.useState<SiteSubscription[]>([])
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)
  const [loading, setLoading] = React.useState(!!initialToken)
  const [error, setError] = React.useState<string | null>(null)

  // Auto-login with initial token
  React.useEffect(() => {
    if (initialToken) {
      const autoLogin = async () => {
        try {
          const clientService = getClientService()
          const portalSession = await clientService.validatePortalToken(initialToken)
          if (portalSession?.isValid) {
            handleLogin(portalSession)
          } else {
            setError('Invalid or expired access token')
            setLoading(false)
          }
        } catch {
          setError('An error occurred')
          setLoading(false)
        }
      }
      autoLogin()
    }
  }, [initialToken])

  const handleLogin = async (portalSession: PortalSession) => {
    setSession(portalSession)
    setLoading(true)

    try {
      const clientService = getClientService()
      const projectService = getProjectService()
      const subscriptionService = getSubscriptionService()

      const clientData = await clientService.get(portalSession.clientId)
      setClient(clientData)

      const projectResult = await projectService.list({ clientId: portalSession.clientId })
      setProjects(projectResult.projects)

      const subResult = await subscriptionService.list({ clientId: portalSession.clientId })
      setSubscriptions(subResult.subscriptions)
    } catch {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setSession(null)
    setClient(null)
    setProjects([])
    setSubscriptions([])
    setSelectedProject(null)
    setError(null)
  }

  // Show login if no session
  if (!session) {
    return <PortalLogin onLogin={handleLogin} error={error ?? undefined} />
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading your portal...</p>
      </div>
    )
  }

  // Project detail view
  if (selectedProject) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-2xl mx-auto">
          <ProjectDetail
            project={selectedProject}
            onBack={() => setSelectedProject(null)}
          />
        </div>
      </div>
    )
  }

  // Main portal view
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-semibold">Welcome, {client?.name?.split(' ')[0]}</h1>
            <p className="text-sm text-slate-500">{client?.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto p-4">
        <Tabs defaultValue="projects">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects">
              Projects ({projects.length})
            </TabsTrigger>
            <TabsTrigger value="subscriptions">
              Subscriptions ({subscriptions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-4">
            {projects.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-slate-500">
                  No projects found
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => setSelectedProject(project)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-4">
            {subscriptions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-slate-500">
                  No subscriptions found
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <SubscriptionCard key={subscription.id} subscription={subscription} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default ClientPortal
