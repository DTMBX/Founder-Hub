import {
ArrowsClockwise, CaretDown, CaretUp, CheckCircle,
  Clock,   Envelope, EnvelopeOpen, Eye, FunnelSimple, Warning
} from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo,useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useKV } from '@/lib/local-storage-kv'
import { cn } from '@/lib/utils'

interface Submission {
  id: string
  name: string
  email: string
  message: string
  formType?: string
  submitted_at: string
  source?: string
}

type SubmissionStatus = 'unread' | 'read' | 'resolved'

interface SubmissionState {
  status: SubmissionStatus
  note?: string
}

const FORM_TYPES = ['all', 'general', 'tillerstead', 'evident', 'investor'] as const

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  unread: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  read: 'bg-muted text-muted-foreground border-border/50',
  resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

export default function FormSubmissionsViewer() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<(typeof FORM_TYPES)[number]>('all')
  const [filterStatus, setFilterStatus] = useState<SubmissionStatus | 'all'>('all')

  // KV-backed submission states (read/resolved tracking persists in localStorage)
  const [states, setStates] = useKV<Record<string, SubmissionState>>('founder-hub-submission-states', {})

  const apiUrl = import.meta.env.VITE_SUBMISSIONS_API_URL as string | undefined
  const adminToken = import.meta.env.VITE_ADMIN_TOKEN as string | undefined

  const fetchSubmissions = useCallback(async () => {
    if (!apiUrl || !adminToken) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { ok: boolean; submissions: Submission[] }
      if (data.ok) {
        setSubmissions(data.submissions)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [apiUrl, adminToken])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const getStatus = useCallback(
    (id: string): SubmissionStatus => states[id]?.status ?? 'unread',
    [states],
  )

  const setSubmissionStatus = (id: string, status: SubmissionStatus) => {
    setStates(prev => ({ ...prev, [id]: { ...prev[id], status } }))
  }

  const filtered = useMemo(() => {
    return submissions.filter(s => {
      if (filterType !== 'all' && (s.formType ?? 'general') !== filterType) return false
      if (filterStatus !== 'all' && getStatus(s.id) !== filterStatus) return false
      return true
    })
  }, [submissions, filterType, filterStatus, getStatus])

  const unreadCount = useMemo(
    () => submissions.filter(s => getStatus(s.id) === 'unread').length,
    [submissions, getStatus],
  )

  if (!apiUrl || !adminToken) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Form Submissions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Contact form submissions from all sites
          </p>
        </div>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Warning className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" weight="fill" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Configuration Required</p>
                <p className="text-xs text-muted-foreground">
                  Set the following environment variables to enable submission viewing:
                </p>
                <div className="font-mono text-xs space-y-1 mt-2">
                  <p><code className="px-1.5 py-0.5 rounded bg-muted">VITE_SUBMISSIONS_API_URL</code> — Worker endpoint URL</p>
                  <p><code className="px-1.5 py-0.5 rounded bg-muted">VITE_ADMIN_TOKEN</code> — Bearer token for authentication</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            Form Submissions
            {unreadCount > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-blue-500/20 text-blue-400 border-blue-500/30">
                {unreadCount} new
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {submissions.length} total &middot; read-only inbox
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSubmissions}
          disabled={loading}
          className="gap-2"
        >
          <ArrowsClockwise className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FunnelSimple className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Type:</span>
          {FORM_TYPES.map(type => (
            <Button
              key={type}
              variant={filterType === type ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs capitalize"
              onClick={() => setFilterType(type)}
            >
              {type}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Status:</span>
          {(['all', 'unread', 'read', 'resolved'] as const).map(s => (
            <Button
              key={s}
              variant={filterStatus === s ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs capitalize"
              onClick={() => setFilterStatus(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Warning className="h-4 w-4 text-red-400" weight="fill" />
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Submissions list */}
      {filtered.length === 0 && !loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Envelope className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" weight="duotone" />
            <p className="text-sm text-muted-foreground">
              {submissions.length === 0 ? 'No submissions yet' : 'No submissions match filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(sub => {
            const status = getStatus(sub.id)
            const isExpanded = expandedId === sub.id
            return (
              <Card
                key={sub.id}
                className={cn(
                  'transition-all duration-200',
                  status === 'unread' && 'border-blue-500/20 bg-blue-500/[0.02]',
                  status === 'resolved' && 'opacity-70',
                )}
              >
                <button
                  className="w-full text-left"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : sub.id)
                    if (status === 'unread') setSubmissionStatus(sub.id, 'read')
                  }}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {status === 'unread' ? (
                          <Envelope className="h-4 w-4 text-blue-400 shrink-0" weight="fill" />
                        ) : (
                          <EnvelopeOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className={cn(
                            'text-sm truncate',
                            status === 'unread' ? 'font-semibold' : 'font-medium',
                          )}>
                            {sub.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{sub.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={cn('text-[10px] capitalize', STATUS_COLORS[status])}>
                          {status}
                        </Badge>
                        {sub.formType && sub.formType !== 'general' && (
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {sub.formType}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(sub.submitted_at).toLocaleDateString()}
                        </span>
                        {isExpanded ? (
                          <CaretUp className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <CaretDown className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    {!isExpanded && (
                      <p className="text-xs text-muted-foreground truncate mt-1 pl-7">
                        {sub.message}
                      </p>
                    )}
                  </CardHeader>
                </button>

                {isExpanded && (
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="pl-7 space-y-3">
                      <div className="text-sm whitespace-pre-wrap break-words rounded-lg bg-muted/30 p-3">
                        {sub.message}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{new Date(sub.submitted_at).toLocaleString()}</span>
                        {sub.source && (
                          <>
                            <span>&middot;</span>
                            <span>Source: {sub.source}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        {status !== 'read' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5"
                            onClick={() => setSubmissionStatus(sub.id, 'read')}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Mark Read
                          </Button>
                        )}
                        {status !== 'resolved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5 text-emerald-400 hover:text-emerald-300"
                            onClick={() => setSubmissionStatus(sub.id, 'resolved')}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Mark Resolved
                          </Button>
                        )}
                        {status === 'resolved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5"
                            onClick={() => setSubmissionStatus(sub.id, 'read')}
                          >
                            Reopen
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
