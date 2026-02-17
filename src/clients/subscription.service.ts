/**
 * Site Subscription Service
 *
 * Manages website maintenance/hosting subscriptions with:
 * - CRUD operations
 * - Renewal tracking
 * - Past due detection
 * - Stripe integration (stubs)
 */

import type {
  SiteSubscription,
  SubscriptionPlanTier,
  SubscriptionStatus,
  SubscriptionService as SubscriptionServiceType,
  SubscriptionListQuery,
  SubscriptionListResult,
} from './types'
import type { StorageAdapter } from '@/lib/storage-adapter'
import { createStorageAdapter } from '@/lib/storage-adapter'

// ─── Storage Keys ────────────────────────────────────────────

const KEYS = {
  SUBSCRIPTIONS_INDEX: 'xtx_subscriptions',
  SUBSCRIPTION: (id: string) => `xtx_subscription_${id}`,
  CLIENT_SUBSCRIPTIONS: (clientId: string) => `xtx_client_subs_${clientId}`,
  SITE_SUBSCRIPTION: (siteId: string) => `xtx_site_sub_${siteId}`,
}

// ─── Plan Pricing ────────────────────────────────────────────

export const PLAN_PRICING: Record<SubscriptionPlanTier, { monthly: number; name: string; services: string[] }> = {
  basic: {
    monthly: 49,
    name: 'Basic',
    services: ['Hosting', 'SSL Certificate', 'Basic Support'],
  },
  standard: {
    monthly: 99,
    name: 'Standard',
    services: ['Hosting', 'SSL Certificate', 'Monthly Updates', 'Security Monitoring', 'Email Support'],
  },
  premium: {
    monthly: 199,
    name: 'Premium',
    services: ['Hosting', 'SSL Certificate', 'Weekly Updates', 'Security Monitoring', 'Priority Support', 'Performance Optimization', 'Backup & Recovery'],
  },
  enterprise: {
    monthly: 499,
    name: 'Enterprise',
    services: ['Dedicated Hosting', 'SSL Certificate', 'Unlimited Updates', '24/7 Monitoring', 'Dedicated Support', 'Custom Development', 'SLA Guarantee'],
  },
}

// ─── Service ─────────────────────────────────────────────────

export interface CreateSubscriptionInput {
  siteId: string
  siteName: string
  clientId: string
  planTier: SubscriptionPlanTier
  billingCycle?: SiteSubscription['billingCycle']
  stripeSubscriptionId?: string
  stripeCustomerId?: string
}

export interface UpdateSubscriptionInput {
  planTier?: SubscriptionPlanTier
  billingCycle?: SiteSubscription['billingCycle']
  autoRenew?: boolean
  stripeSubscriptionId?: string
  stripeCustomerId?: string
}

export class SubscriptionService {
  constructor(private adapter: StorageAdapter) {}

  /**
   * Create a new subscription
   */
  async create(input: CreateSubscriptionInput): Promise<SiteSubscription> {
    const now = new Date()
    const nowStr = now.toISOString()
    
    const billingCycle = input.billingCycle ?? 'monthly'
    const cycleDays = billingCycle === 'monthly' ? 30 : billingCycle === 'quarterly' ? 90 : 365
    
    const periodEnd = new Date(now.getTime() + cycleDays * 24 * 60 * 60 * 1000)
    const planInfo = PLAN_PRICING[input.planTier]

    const subscription: SiteSubscription = {
      id: crypto.randomUUID(),
      siteId: input.siteId,
      siteName: input.siteName,
      clientId: input.clientId,
      planTier: input.planTier,
      status: 'active',
      monthlyPrice: planInfo.monthly,
      billingCycle,
      currentPeriodStart: nowStr,
      currentPeriodEnd: periodEnd.toISOString(),
      renewalDate: periodEnd.toISOString(),
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeCustomerId: input.stripeCustomerId,
      createdAt: nowStr,
      updatedAt: nowStr,
      services: planInfo.services.map((name) => ({
        name,
        included: true,
      })),
      autoRenew: true,
      hasPaymentMethod: !!input.stripeCustomerId,
    }

    await this.adapter.set(KEYS.SUBSCRIPTION(subscription.id), subscription)

    // Add to global index
    const allIds = (await this.adapter.get<string[]>(KEYS.SUBSCRIPTIONS_INDEX)) ?? []
    allIds.unshift(subscription.id)
    await this.adapter.set(KEYS.SUBSCRIPTIONS_INDEX, allIds)

    // Add to client's subscriptions
    const clientSubIds =
      (await this.adapter.get<string[]>(KEYS.CLIENT_SUBSCRIPTIONS(input.clientId))) ?? []
    clientSubIds.unshift(subscription.id)
    await this.adapter.set(KEYS.CLIENT_SUBSCRIPTIONS(input.clientId), clientSubIds)

    // Map site to subscription
    await this.adapter.set(KEYS.SITE_SUBSCRIPTION(input.siteId), subscription.id)

    console.log(`[Subscription Created] ${subscription.siteName}`, subscription.id)
    return subscription
  }

  /**
   * Get subscription by ID
   */
  async get(id: string): Promise<SiteSubscription | null> {
    const subscription = await this.adapter.get<SiteSubscription>(KEYS.SUBSCRIPTION(id))
    if (!subscription) return null

    // Compute derived fields
    return this.enrichSubscription(subscription)
  }

  /**
   * Get subscription by site ID
   */
  async getBySiteId(siteId: string): Promise<SiteSubscription | null> {
    const subId = await this.adapter.get<string>(KEYS.SITE_SUBSCRIPTION(siteId))
    if (!subId) return null
    return this.get(subId)
  }

  /**
   * Enrich subscription with computed fields
   */
  private enrichSubscription(sub: SiteSubscription): SiteSubscription {
    const now = new Date()
    const renewalDate = new Date(sub.renewalDate)
    const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

    return {
      ...sub,
      daysUntilRenewal,
      isPastDue: sub.status === 'past_due' || (sub.status === 'active' && daysUntilRenewal < 0),
    }
  }

  /**
   * Update subscription
   */
  async update(id: string, input: UpdateSubscriptionInput): Promise<SiteSubscription | null> {
    const subscription = await this.adapter.get<SiteSubscription>(KEYS.SUBSCRIPTION(id))
    if (!subscription) return null

    // Update plan pricing if tier changed
    let monthlyPrice = subscription.monthlyPrice
    let services = subscription.services
    if (input.planTier && input.planTier !== subscription.planTier) {
      const planInfo = PLAN_PRICING[input.planTier]
      monthlyPrice = planInfo.monthly
      services = planInfo.services.map((name) => ({
        name,
        included: true,
      }))
    }

    const updated: SiteSubscription = {
      ...subscription,
      ...input,
      monthlyPrice,
      services,
      id: subscription.id,
      siteId: subscription.siteId,
      clientId: subscription.clientId,
      createdAt: subscription.createdAt,
      updatedAt: new Date().toISOString(),
    }

    await this.adapter.set(KEYS.SUBSCRIPTION(id), updated)
    return this.enrichSubscription(updated)
  }

  /**
   * Change subscription status
   */
  async changeStatus(
    id: string,
    status: SubscriptionStatus,
    reason?: string,
  ): Promise<SiteSubscription | null> {
    const subscription = await this.adapter.get<SiteSubscription>(KEYS.SUBSCRIPTION(id))
    if (!subscription) return null

    subscription.status = status
    subscription.updatedAt = new Date().toISOString()

    if (status === 'cancelled') {
      subscription.cancelledAt = subscription.updatedAt
      subscription.cancellationReason = reason
    }

    await this.adapter.set(KEYS.SUBSCRIPTION(id), subscription)
    return this.enrichSubscription(subscription)
  }

  /**
   * Renew subscription (extend period)
   */
  async renew(id: string): Promise<SiteSubscription | null> {
    const subscription = await this.adapter.get<SiteSubscription>(KEYS.SUBSCRIPTION(id))
    if (!subscription) return null

    const now = new Date()
    const cycleDays =
      subscription.billingCycle === 'monthly' ? 30 :
      subscription.billingCycle === 'quarterly' ? 90 : 365

    const newPeriodStart = now.toISOString()
    const newPeriodEnd = new Date(now.getTime() + cycleDays * 24 * 60 * 60 * 1000)

    subscription.currentPeriodStart = newPeriodStart
    subscription.currentPeriodEnd = newPeriodEnd.toISOString()
    subscription.renewalDate = newPeriodEnd.toISOString()
    subscription.status = 'active'
    subscription.updatedAt = newPeriodStart

    await this.adapter.set(KEYS.SUBSCRIPTION(id), subscription)
    return this.enrichSubscription(subscription)
  }

  /**
   * List subscriptions with filtering
   */
  async list(query?: SubscriptionListQuery): Promise<SubscriptionListResult> {
    let subscriptionIds: string[]

    if (query?.clientId) {
      subscriptionIds =
        (await this.adapter.get<string[]>(KEYS.CLIENT_SUBSCRIPTIONS(query.clientId))) ?? []
    } else {
      subscriptionIds = (await this.adapter.get<string[]>(KEYS.SUBSCRIPTIONS_INDEX)) ?? []
    }

    let subscriptions: SiteSubscription[] = []

    // Load all subscriptions
    for (const id of subscriptionIds) {
      const sub = await this.get(id)
      if (sub) subscriptions.push(sub)
    }

    // Apply filters
    if (query?.siteId) {
      subscriptions = subscriptions.filter((s) => s.siteId === query.siteId)
    }

    if (query?.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status]
      subscriptions = subscriptions.filter((s) => statuses.includes(s.status))
    }

    if (query?.planTier) {
      subscriptions = subscriptions.filter((s) => s.planTier === query.planTier)
    }

    if (query?.pastDue === true) {
      subscriptions = subscriptions.filter((s) => s.isPastDue)
    }

    // Sort by status (past_due first), then renewal date
    const statusOrder: Record<SubscriptionStatus, number> = {
      past_due: 0,
      active: 1,
      paused: 2,
      expired: 3,
      cancelled: 4,
    }
    subscriptions.sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status]
      if (statusDiff !== 0) return statusDiff
      return a.renewalDate.localeCompare(b.renewalDate)
    })

    const total = subscriptions.length
    const offset = query?.offset ?? 0
    const limit = query?.limit ?? 50
    const paginated = subscriptions.slice(offset, offset + limit)

    return {
      subscriptions: paginated,
      total,
      hasMore: offset + paginated.length < total,
    }
  }

  /**
   * Get past due subscriptions
   */
  async getPastDue(): Promise<SiteSubscription[]> {
    const allIds = (await this.adapter.get<string[]>(KEYS.SUBSCRIPTIONS_INDEX)) ?? []
    const pastDue: SiteSubscription[] = []

    for (const id of allIds) {
      const sub = await this.get(id)
      if (sub?.isPastDue) {
        pastDue.push(sub)
      }
    }

    return pastDue
  }

  /**
   * Get subscriptions renewing soon
   */
  async getRenewingSoon(days: number = 7): Promise<SiteSubscription[]> {
    const allIds = (await this.adapter.get<string[]>(KEYS.SUBSCRIPTIONS_INDEX)) ?? []
    const renewingSoon: SiteSubscription[] = []

    for (const id of allIds) {
      const sub = await this.get(id)
      if (!sub || sub.status !== 'active') continue
      if (sub.daysUntilRenewal !== undefined && sub.daysUntilRenewal <= days && sub.daysUntilRenewal > 0) {
        renewingSoon.push(sub)
      }
    }

    return renewingSoon
  }

  /**
   * Get subscription statistics
   */
  async getStats(): Promise<{
    total: number
    active: number
    pastDue: number
    mrr: number  // Monthly Recurring Revenue
    byTier: Record<SubscriptionPlanTier, number>
  }> {
    const allIds = (await this.adapter.get<string[]>(KEYS.SUBSCRIPTIONS_INDEX)) ?? []
    
    const byTier: Record<SubscriptionPlanTier, number> = {
      basic: 0,
      standard: 0,
      premium: 0,
      enterprise: 0,
    }

    let active = 0
    let pastDue = 0
    let mrr = 0

    for (const id of allIds) {
      const sub = await this.get(id)
      if (!sub) continue

      byTier[sub.planTier]++

      if (sub.status === 'active') {
        active++
        mrr += sub.monthlyPrice
      }

      if (sub.isPastDue) {
        pastDue++
      }
    }

    return {
      total: allIds.length,
      active,
      pastDue,
      mrr,
      byTier,
    }
  }

  /**
   * Delete subscription
   */
  async delete(id: string): Promise<boolean> {
    const subscription = await this.adapter.get<SiteSubscription>(KEYS.SUBSCRIPTION(id))
    if (!subscription) return false

    // Remove from global index
    const allIds = (await this.adapter.get<string[]>(KEYS.SUBSCRIPTIONS_INDEX)) ?? []
    const newIds = allIds.filter((i) => i !== id)
    await this.adapter.set(KEYS.SUBSCRIPTIONS_INDEX, newIds)

    // Remove from client's subscriptions
    const clientSubIds =
      (await this.adapter.get<string[]>(KEYS.CLIENT_SUBSCRIPTIONS(subscription.clientId))) ?? []
    const newClientIds = clientSubIds.filter((i) => i !== id)
    await this.adapter.set(KEYS.CLIENT_SUBSCRIPTIONS(subscription.clientId), newClientIds)

    // Remove site mapping
    await this.adapter.del(KEYS.SITE_SUBSCRIPTION(subscription.siteId))

    // Remove subscription data
    await this.adapter.del(KEYS.SUBSCRIPTION(id))

    return true
  }
}

// ─── Singleton ───────────────────────────────────────────────

let _subscriptionService: SubscriptionService | null = null

export function getSubscriptionService(adapter?: StorageAdapter): SubscriptionService {
  if (!_subscriptionService) {
    _subscriptionService = new SubscriptionService(adapter ?? createStorageAdapter())
  }
  return _subscriptionService
}
