/**
 * Lead Service
 *
 * Service for managing leads with pluggable storage adapters.
 * Supports localStorage (demo), webhook, and email notifications.
 */

import {
  type Lead,
  type LeadCaptureInput,
  type LeadStatus,
  type LeadActivity,
  type LeadActivityType,
  type LeadListQuery,
  type LeadListResult,
} from './types'
import type { CsvColumn } from '@/lib/csv'

// ─── Adapter Interface ───────────────────────────────────────

export interface LeadStorageAdapter {
  /** Save a new lead */
  create(lead: Lead): Promise<Lead>
  /** Update an existing lead */
  update(id: string, updates: Partial<Lead>): Promise<Lead | null>
  /** Get a lead by ID */
  get(id: string): Promise<Lead | null>
  /** List leads with optional filtering */
  list(query?: LeadListQuery): Promise<LeadListResult>
  /** Delete a lead */
  delete(id: string): Promise<boolean>
  /** Add activity to a lead */
  addActivity(activity: LeadActivity): Promise<void>
  /** Get activities for a lead */
  getActivities(leadId: string): Promise<LeadActivity[]>
}

export interface LeadNotificationAdapter {
  /** Send notification when lead is captured */
  onLeadCaptured?(lead: Lead): Promise<void>
  /** Send notification when lead status changes */
  onStatusChange?(lead: Lead, previousStatus: LeadStatus): Promise<void>
  /** Send notification when deposit is received */
  onDepositReceived?(lead: Lead, amount: number): Promise<void>
}

// ─── LocalStorage Adapter ────────────────────────────────────

const LEADS_STORAGE_KEY = 'xtx_leads'
const ACTIVITIES_STORAGE_KEY = 'xtx_lead_activities'

export class LocalStorageAdapter implements LeadStorageAdapter {
  private getLeads(): Lead[] {
    try {
      const data = localStorage.getItem(LEADS_STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }
  
  private saveLeads(leads: Lead[]): void {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads))
  }
  
  private getActivitiesStore(): LeadActivity[] {
    try {
      const data = localStorage.getItem(ACTIVITIES_STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }
  
  private saveActivities(activities: LeadActivity[]): void {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities))
  }
  
  async create(lead: Lead): Promise<Lead> {
    const leads = this.getLeads()
    leads.push(lead)
    this.saveLeads(leads)
    return lead
  }
  
  async update(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    const leads = this.getLeads()
    const index = leads.findIndex((l) => l.id === id)
    if (index === -1) return null
    
    const updated = {
      ...leads[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    leads[index] = updated
    this.saveLeads(leads)
    return updated
  }
  
  async get(id: string): Promise<Lead | null> {
    const leads = this.getLeads()
    return leads.find((l) => l.id === id) ?? null
  }
  
  async list(query?: LeadListQuery): Promise<LeadListResult> {
    let leads = this.getLeads()
    
    // Apply filters
    if (query?.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status]
      leads = leads.filter((l) => statuses.includes(l.status))
    }
    
    if (query?.source) {
      const sources = Array.isArray(query.source) ? query.source : [query.source]
      leads = leads.filter((l) => sources.includes(l.source))
    }
    
    if (query?.assignedTo) {
      leads = leads.filter((l) => l.assignedTo === query.assignedTo)
    }
    
    if (query?.createdAfter) {
      leads = leads.filter((l) => l.createdAt >= query.createdAfter!)
    }
    
    if (query?.createdBefore) {
      leads = leads.filter((l) => l.createdAt <= query.createdBefore!)
    }
    
    if (query?.search) {
      const search = query.search.toLowerCase()
      leads = leads.filter(
        (l) =>
          l.email.toLowerCase().includes(search) ||
          l.firstName?.toLowerCase().includes(search) ||
          l.lastName?.toLowerCase().includes(search) ||
          l.company?.toLowerCase().includes(search)
      )
    }
    
    // Sort
    const orderBy = query?.orderBy ?? 'createdAt'
    const orderDir = query?.orderDir ?? 'desc'
    leads.sort((a, b) => {
      const aVal = a[orderBy] ?? ''
      const bVal = b[orderBy] ?? ''
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return orderDir === 'desc' ? -cmp : cmp
    })
    
    // Paginate
    const total = leads.length
    const offset = query?.offset ?? 0
    const limit = query?.limit ?? 50
    leads = leads.slice(offset, offset + limit)
    
    return {
      leads,
      total,
      hasMore: offset + leads.length < total,
    }
  }
  
  async delete(id: string): Promise<boolean> {
    const leads = this.getLeads()
    const index = leads.findIndex((l) => l.id === id)
    if (index === -1) return false
    
    leads.splice(index, 1)
    this.saveLeads(leads)
    return true
  }
  
  async addActivity(activity: LeadActivity): Promise<void> {
    const activities = this.getActivitiesStore()
    activities.push(activity)
    this.saveActivities(activities)
  }
  
  async getActivities(leadId: string): Promise<LeadActivity[]> {
    const activities = this.getActivitiesStore()
    return activities
      .filter((a) => a.leadId === leadId)
      .sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1))
  }
}

// ─── Webhook Adapter ─────────────────────────────────────────

export interface WebhookAdapterConfig {
  /** Webhook URL to POST leads to */
  url: string
  /** Authorization header value */
  authorization?: string
  /** Additional headers */
  headers?: Record<string, string>
}

export class WebhookNotificationAdapter implements LeadNotificationAdapter {
  constructor(private config: WebhookAdapterConfig) {}
  
  private async post(event: string, data: unknown): Promise<void> {
    try {
      await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.authorization
            ? { Authorization: this.config.authorization }
            : {}),
          ...this.config.headers,
        },
        body: JSON.stringify({ event, data, timestamp: new Date().toISOString() }),
      })
    } catch (error) {
      console.error('[WebhookAdapter] Failed to send webhook:', error)
    }
  }
  
  async onLeadCaptured(lead: Lead): Promise<void> {
    await this.post('lead.captured', lead)
  }
  
  async onStatusChange(lead: Lead, previousStatus: LeadStatus): Promise<void> {
    await this.post('lead.status_changed', { lead, previousStatus })
  }
  
  async onDepositReceived(lead: Lead, amount: number): Promise<void> {
    await this.post('lead.deposit_received', { lead, amount })
  }
}

// ─── Console Notification Adapter (for dev) ──────────────────

export class ConsoleNotificationAdapter implements LeadNotificationAdapter {
  async onLeadCaptured(lead: Lead): Promise<void> {
    if (import.meta.env.DEV) console.log('[Lead Captured]', lead.email, lead)
  }
  
  async onStatusChange(lead: Lead, previousStatus: LeadStatus): Promise<void> {
    if (import.meta.env.DEV) console.log('[Lead Status Changed]', lead.email, previousStatus, '->', lead.status)
  }
  
  async onDepositReceived(lead: Lead, amount: number): Promise<void> {
    if (import.meta.env.DEV) console.log('[Deposit Received]', lead.email, amount)
  }
}

// ─── Lead Service ────────────────────────────────────────────

export interface LeadServiceConfig {
  storage: LeadStorageAdapter
  notifications?: LeadNotificationAdapter[]
}

export class LeadService {
  private storage: LeadStorageAdapter
  private notifications: LeadNotificationAdapter[]
  
  constructor(config: LeadServiceConfig) {
    this.storage = config.storage
    this.notifications = config.notifications ?? []
  }
  
  /**
   * Capture a new lead from form submission
   */
  async capture(input: LeadCaptureInput): Promise<Lead> {
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    
    const lead: Lead = {
      id,
      createdAt: now,
      updatedAt: now,
      status: 'new',
      source: input.source ?? 'website_form',
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      company: input.company,
      website: input.website,
      vertical: input.vertical,
      projectDescription: input.projectDescription,
      referrer: input.referrer ?? (typeof document !== 'undefined' ? document.referrer : undefined),
      landingPage: typeof window !== 'undefined' ? window.location.pathname : undefined,
    }
    
    // Extract UTM params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      lead.utmSource = params.get('utm_source') ?? undefined
      lead.utmMedium = params.get('utm_medium') ?? undefined
      lead.utmCampaign = params.get('utm_campaign') ?? undefined
    }
    
    // Save lead
    const saved = await this.storage.create(lead)
    
    // Add creation activity
    await this.addActivity(saved.id, 'created', 'Lead captured from ' + (input.source ?? 'website_form'))
    
    // Notify adapters
    await Promise.all(
      this.notifications.map((n) => n.onLeadCaptured?.(saved))
    )
    
    return saved
  }
  
  /**
   * Update lead status
   */
  async updateStatus(id: string, status: LeadStatus, note?: string): Promise<Lead | null> {
    const existing = await this.storage.get(id)
    if (!existing) return null
    
    const previousStatus = existing.status
    const updated = await this.storage.update(id, { status })
    if (!updated) return null
    
    // Add status change activity
    await this.addActivity(
      id,
      'status_changed',
      `Status changed from ${previousStatus} to ${status}${note ? `: ${note}` : ''}`
    )
    
    // Notify adapters
    await Promise.all(
      this.notifications.map((n) => n.onStatusChange?.(updated, previousStatus))
    )
    
    return updated
  }
  
  /**
   * Update lead data
   */
  async update(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    return this.storage.update(id, updates)
  }
  
  /**
   * Get a lead by ID
   */
  async get(id: string): Promise<Lead | null> {
    return this.storage.get(id)
  }
  
  /**
   * Get a lead by email
   */
  async getByEmail(email: string): Promise<Lead | null> {
    const result = await this.storage.list({ search: email, limit: 1 })
    const match = result.leads.find((l) => l.email.toLowerCase() === email.toLowerCase())
    return match ?? null
  }
  
  /**
   * List leads
   */
  async list(query?: LeadListQuery): Promise<LeadListResult> {
    return this.storage.list(query)
  }
  
  /**
   * Add activity to a lead
   */
  async addActivity(
    leadId: string,
    type: LeadActivityType,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const activity: LeadActivity = {
      id: crypto.randomUUID(),
      leadId,
      timestamp: new Date().toISOString(),
      type,
      description,
      metadata,
    }
    await this.storage.addActivity(activity)
  }
  
  /**
   * Get activities for a lead
   */
  async getActivities(leadId: string): Promise<LeadActivity[]> {
    return this.storage.getActivities(leadId)
  }
  
  /**
   * Record deposit received
   */
  async recordDeposit(id: string, amount: number): Promise<Lead | null> {
    const lead = await this.updateStatus(id, 'deposit_paid', `Deposit of $${amount} received`)
    if (!lead) return null
    
    // Notify adapters
    await Promise.all(
      this.notifications.map((n) => n.onDepositReceived?.(lead, amount))
    )
    
    return lead
  }
  
  /**
   * Export leads to CSV string
   */
  async exportCsv(query?: LeadListQuery): Promise<string> {
    const { toCsv } = await import('@/lib/csv')
    
    // Get all leads matching query (no pagination)
    const result = await this.storage.list({ ...query, limit: 10000, offset: 0 })
    
    const columns: CsvColumn<Lead>[] = [
      { header: 'ID', accessor: 'id' },
      { header: 'Created', accessor: 'createdAt' },
      { header: 'Status', accessor: 'status' },
      { header: 'Source', accessor: 'source' },
      { header: 'Email', accessor: 'email' },
      { header: 'First Name', accessor: 'firstName' },
      { header: 'Last Name', accessor: 'lastName' },
      { header: 'Company', accessor: 'company' },
      { header: 'Phone', accessor: 'phone' },
      { header: 'Vertical', accessor: 'vertical' },
      { header: 'Budget', accessor: 'budget' },
      { header: 'Timeline', accessor: 'timeline' },
      { header: 'Landing Page', accessor: 'landingPage' },
      { header: 'UTM Source', accessor: 'utmSource' },
      { header: 'UTM Medium', accessor: 'utmMedium' },
      { header: 'UTM Campaign', accessor: 'utmCampaign' },
    ]
    
    return toCsv(result.leads, { columns })
  }
  
  /**
   * Download leads as CSV file
   */
  async downloadCsv(query?: LeadListQuery, filename = 'leads'): Promise<void> {
    const { downloadCsv } = await import('@/lib/csv')
    const csv = await this.exportCsv(query)
    const timestamp = new Date().toISOString().slice(0, 10)
    downloadCsv(csv, `${filename}-${timestamp}.csv`)
  }
}

// ─── Default Instance ────────────────────────────────────────

let defaultService: LeadService | null = null

export function getLeadService(): LeadService {
  if (!defaultService) {
    defaultService = new LeadService({
      storage: new LocalStorageAdapter(),
      notifications: [new ConsoleNotificationAdapter()],
    })
  }
  return defaultService
}

export function configureLeadService(config: LeadServiceConfig): void {
  defaultService = new LeadService(config)
}
