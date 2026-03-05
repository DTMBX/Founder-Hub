/**
 * Subscription Admin Dashboard
 *
 * Admin panel for managing site subscriptions:
 * - View all subscriptions
 * - Past due flagging
 * - MRR overview
 * - Renewal tracking
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  getSubscriptionService,
  getClientService,
  PLAN_PRICING,
} from './index'
import type {
  SiteSubscription,
  SubscriptionStatus,
  SubscriptionPlanTier,
  Client,
} from './types'

// ─── Status Colors ───────────────────────────────────────────

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-red-100 text-red-700',
  paused: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-slate-100 text-slate-700',
  expired: 'bg-slate-100 text-slate-700',
}

const TIER_COLORS: Record<SubscriptionPlanTier, string> = {
  basic: 'bg-slate-100 text-slate-700',
  standard: 'bg-blue-100 text-blue-700',
  premium: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
}

// ─── Stats Card ──────────────────────────────────────────────

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  variant?: 'default' | 'warning' | 'success'
}

function StatsCard({ title, value, description, variant = 'default' }: StatsCardProps) {
  const valueColors = {
    default: 'text-slate-900',
    warning: 'text-red-600',
    success: 'text-green-600',
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${valueColors[variant]}`}>{value}</p>
        {description && (
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Subscription Row ────────────────────────────────────────

interface SubscriptionRowProps {
  subscription: SiteSubscription
  client?: Client | null
  onAction: (action: 'view' | 'pause' | 'resume' | 'cancel' | 'renew', sub: SiteSubscription) => void
}

function SubscriptionRow({ subscription, client, onAction }: SubscriptionRowProps) {
  const statusLabel = subscription.status.replace('_', ' ')
  const tierLabel = subscription.planTier.charAt(0).toUpperCase() + subscription.planTier.slice(1)

  return (
    <TableRow className={subscription.isPastDue ? 'bg-red-50' : ''}>
      <TableCell>
        <div>
          <p className="font-medium">{subscription.siteName}</p>
          <p className="text-sm text-slate-500">{client?.name ?? 'Unknown Client'}</p>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={TIER_COLORS[subscription.planTier]}>
          {tierLabel}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={STATUS_COLORS[subscription.status]}>
          {statusLabel}
        </Badge>
        {subscription.isPastDue && (
          <span className="ml-2 text-red-600 text-xs">⚠️</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        ${subscription.monthlyPrice}/mo
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <p>{new Date(subscription.renewalDate).toLocaleDateString()}</p>
          {subscription.daysUntilRenewal !== undefined && subscription.daysUntilRenewal > 0 && (
            <p className="text-slate-500">{subscription.daysUntilRenewal} days</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAction('view', subscription)}
          >
            View
          </Button>
          {subscription.status === 'active' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction('pause', subscription)}
            >
              Pause
            </Button>
          )}
          {subscription.status === 'paused' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction('resume', subscription)}
            >
              Resume
            </Button>
          )}
          {subscription.status === 'past_due' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction('renew', subscription)}
            >
              Renew
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────

export function SubscriptionDashboard() {
  const [subscriptions, setSubscriptions] = React.useState<SiteSubscription[]>([])
  const [clients, setClients] = React.useState<Map<string, Client>>(new Map())
  const [stats, setStats] = React.useState<{
    total: number
    active: number
    pastDue: number
    mrr: number
    byTier: Record<SubscriptionPlanTier, number>
  } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<{
    status: SubscriptionStatus | 'all'
    search: string
  }>({ status: 'all', search: '' })
  const [selectedSub, setSelectedSub] = React.useState<SiteSubscription | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogAction, setDialogAction] = React.useState<string | null>(null)

  // Load data
  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const subscriptionService = getSubscriptionService()
      const clientService = getClientService()

      const [subResult, subStats] = await Promise.all([
        subscriptionService.list(),
        subscriptionService.getStats(),
      ])

      setSubscriptions(subResult.subscriptions)
      setStats(subStats)

      // Load clients for each subscription
      const clientMap = new Map<string, Client>()
      for (const sub of subResult.subscriptions) {
        if (!clientMap.has(sub.clientId)) {
          const client = await clientService.get(sub.clientId)
          if (client) clientMap.set(sub.clientId, client)
        }
      }
      setClients(clientMap)
    } catch (error) {
      console.error('Failed to load subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter subscriptions
  const filteredSubscriptions = React.useMemo(() => {
    return subscriptions.filter((sub) => {
      if (filter.status !== 'all' && sub.status !== filter.status) return false
      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        const client = clients.get(sub.clientId)
        const matchesSite = sub.siteName.toLowerCase().includes(searchLower)
        const matchesClient = client?.name.toLowerCase().includes(searchLower) ?? false
        if (!matchesSite && !matchesClient) return false
      }
      return true
    })
  }, [subscriptions, filter, clients])

  // Handle actions
  const handleAction = (action: string, sub: SiteSubscription) => {
    setSelectedSub(sub)
    setDialogAction(action)
    setDialogOpen(true)
  }

  const executeAction = async () => {
    if (!selectedSub || !dialogAction) return

    const subscriptionService = getSubscriptionService()

    try {
      switch (dialogAction) {
        case 'pause':
          await subscriptionService.changeStatus(selectedSub.id, 'paused')
          break
        case 'resume':
          await subscriptionService.changeStatus(selectedSub.id, 'active')
          break
        case 'cancel':
          await subscriptionService.changeStatus(selectedSub.id, 'cancelled', 'Admin cancelled')
          break
        case 'renew':
          await subscriptionService.renew(selectedSub.id)
          break
      }
      await loadData()
    } catch (error) {
      console.error('Action failed:', error)
    }

    setDialogOpen(false)
    setSelectedSub(null)
    setDialogAction(null)
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Loading subscriptions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-slate-500">Manage website maintenance plans</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Monthly Recurring Revenue"
            value={`$${stats.mrr.toLocaleString()}`}
            variant="success"
          />
          <StatsCard
            title="Active Subscriptions"
            value={stats.active}
            description={`of ${stats.total} total`}
          />
          <StatsCard
            title="Past Due"
            value={stats.pastDue}
            variant={stats.pastDue > 0 ? 'warning' : 'default'}
          />
          <StatsCard
            title="Premium/Enterprise"
            value={stats.byTier.premium + stats.byTier.enterprise}
            description="High-tier clients"
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by site or client name..."
                value={filter.search}
                onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
            <Select
              value={filter.status}
              onValueChange={(value) =>
                setFilter((f) => ({ ...f, status: value as SubscriptionStatus | 'all' }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredSubscriptions.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No subscriptions found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site / Client</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Renewal</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((sub) => (
                  <SubscriptionRow
                    key={sub.id}
                    subscription={sub}
                    client={clients.get(sub.clientId)}
                    onAction={handleAction}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Past Due Alert */}
      {stats && stats.pastDue > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">⚠️ Past Due Subscriptions</CardTitle>
            <CardDescription className="text-red-600">
              {stats.pastDue} subscription{stats.pastDue > 1 ? 's' : ''} require{stats.pastDue === 1 ? 's' : ''} attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => setFilter((f) => ({ ...f, status: 'past_due' }))}
            >
              View Past Due
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === 'view' && 'Subscription Details'}
              {dialogAction === 'pause' && 'Pause Subscription'}
              {dialogAction === 'resume' && 'Resume Subscription'}
              {dialogAction === 'cancel' && 'Cancel Subscription'}
              {dialogAction === 'renew' && 'Renew Subscription'}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === 'view' && selectedSub && (
                <div className="space-y-2 text-left mt-4">
                  <p><strong>Site:</strong> {selectedSub.siteName}</p>
                  <p><strong>Plan:</strong> {selectedSub.planTier}</p>
                  <p><strong>Status:</strong> {selectedSub.status}</p>
                  <p><strong>Price:</strong> ${selectedSub.monthlyPrice}/month</p>
                  <p><strong>Billing:</strong> {selectedSub.billingCycle}</p>
                  <p><strong>Renewal:</strong> {new Date(selectedSub.renewalDate).toLocaleDateString()}</p>
                  {selectedSub.stripeSubscriptionId && (
                    <p><strong>Stripe ID:</strong> {selectedSub.stripeSubscriptionId}</p>
                  )}
                </div>
              )}
              {dialogAction === 'pause' && 'Pausing will stop billing but keep the subscription active.'}
              {dialogAction === 'resume' && 'Resuming will reactivate billing for this subscription.'}
              {dialogAction === 'cancel' && 'Cancelling cannot be undone. The client will lose access.'}
              {dialogAction === 'renew' && 'This will extend the subscription period and mark it as active.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {dialogAction === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {dialogAction !== 'view' && (
              <Button
                variant={dialogAction === 'cancel' ? 'destructive' : 'default'}
                onClick={executeAction}
              >
                Confirm
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Subscription Badge Component ────────────────────────────

interface SubscriptionBadgeProps {
  subscription: SiteSubscription | null
  compact?: boolean
}

export function SubscriptionBadge({ subscription, compact = false }: SubscriptionBadgeProps) {
  if (!subscription) {
    return (
      <Badge variant="outline" className="text-slate-500">
        No Plan
      </Badge>
    )
  }

  const tierLabel = subscription.planTier.charAt(0).toUpperCase() + subscription.planTier.slice(1)

  if (compact) {
    return (
      <Badge className={TIER_COLORS[subscription.planTier]}>
        {tierLabel}
        {subscription.isPastDue && ' ⚠️'}
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={TIER_COLORS[subscription.planTier]}>
        {tierLabel}
      </Badge>
      <Badge className={STATUS_COLORS[subscription.status]}>
        {subscription.status.replace('_', ' ')}
      </Badge>
      {subscription.isPastDue && (
        <span className="text-red-600 text-sm">⚠️ Past due</span>
      )}
    </div>
  )
}

export default SubscriptionDashboard
