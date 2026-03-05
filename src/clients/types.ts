/**
 * Client & Project Types
 *
 * Data models for client retention and project management.
 */

// ─── Client ──────────────────────────────────────────────────

export interface Client {
  /** Unique client ID */
  id: string
  /** Client display name (person or business) */
  name: string
  /** Primary email */
  email: string
  /** Primary phone */
  phone?: string
  /** Company/business name */
  company?: string
  /** Tags for categorization */
  tags: string[]
  /** Portal access enabled */
  portalEnabled: boolean
  /** Portal access token (hashed) */
  portalToken?: string
  /** Portal token expiry */
  portalTokenExpiry?: string
  /** Last portal login */
  lastLogin?: string
  /** Created timestamp */
  createdAt: string
  /** Updated timestamp */
  updatedAt: string
  /** Notes (internal) */
  notes?: string
  /** Associated lead ID (if converted from lead) */
  leadId?: string
  /** Preferred contact method */
  preferredContact?: 'email' | 'phone' | 'text'
  /** Address */
  address?: ClientAddress
}

export interface ClientAddress {
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

// ─── Project Status ──────────────────────────────────────────

export type ProjectStatus = 'planned' | 'active' | 'review' | 'complete' | 'on-hold' | 'cancelled'

// ─── Project Update ──────────────────────────────────────────

export interface ProjectUpdate {
  /** Update ID */
  id: string
  /** Timestamp */
  timestamp: string
  /** Update type */
  type: 'status_change' | 'progress' | 'milestone' | 'note' | 'auto_weekly'
  /** Update title */
  title: string
  /** Update content */
  content: string
  /** Attached files */
  attachments?: ProjectFile[]
  /** Was this sent to client? */
  sentToClient: boolean
  /** Sent timestamp */
  sentAt?: string
  /** Author (admin user or 'system') */
  author: string
}

// ─── Project File ────────────────────────────────────────────

export interface ProjectFile {
  /** File ID */
  id: string
  /** Original filename */
  name: string
  /** MIME type */
  mimeType: string
  /** File size in bytes */
  size: number
  /** Storage URL or base64 (for small files) */
  url: string
  /** Upload timestamp */
  uploadedAt: string
  /** Uploaded by */
  uploadedBy: string
  /** Category */
  category?: 'deliverable' | 'reference' | 'contract' | 'other'
}

// ─── Project ─────────────────────────────────────────────────

export interface Project {
  /** Unique project ID */
  id: string
  /** Associated client ID */
  clientId: string
  /** Project name/title */
  name: string
  /** Project description */
  description?: string
  /** Current status */
  status: ProjectStatus
  /** Start date (ISO 8601) */
  startDate: string
  /** Estimated completion date */
  estimatedCompletion?: string
  /** Actual completion date */
  completedAt?: string
  /** Project updates/history */
  updates: ProjectUpdate[]
  /** Attached files */
  files: ProjectFile[]
  /** Created timestamp */
  createdAt: string
  /** Updated timestamp */
  updatedAt: string
  /** Project value/budget */
  budget?: number
  /** Hours tracked */
  hoursTracked?: number
  /** Associated proposal ID */
  proposalId?: string
  /** Associated invoice IDs */
  invoiceIds?: string[]
  /** Weekly update enabled */
  weeklyUpdateEnabled: boolean
  /** Last weekly update sent */
  lastWeeklyUpdate?: string
  /** Progress percentage (0-100) */
  progress: number
  /** Project type/vertical */
  projectType?: string
  /** Priority */
  priority: 'low' | 'normal' | 'high' | 'urgent'
  /** Tags */
  tags: string[]
}

// ─── Site Subscription (Website Maintenance Plans) ───────────

export type SubscriptionPlanTier =
  | 'basic'       // Basic hosting/maintenance
  | 'standard'    // Standard with updates
  | 'premium'     // Premium with priority support
  | 'enterprise'  // Custom enterprise plan

export type SubscriptionStatus =
  | 'active'      // Active subscription
  | 'past_due'    // Payment past due
  | 'cancelled'   // Cancelled by user
  | 'paused'      // Temporarily paused
  | 'expired'     // Expired (not renewed)

export interface SiteSubscription {
  /** Subscription ID */
  id: string
  /** Site/domain ID */
  siteId: string
  /** Site domain/name */
  siteName: string
  /** Associated client ID */
  clientId: string
  /** Plan tier */
  planTier: SubscriptionPlanTier
  /** Current status */
  status: SubscriptionStatus
  /** Monthly price */
  monthlyPrice: number
  /** Billing cycle */
  billingCycle: 'monthly' | 'quarterly' | 'annual'
  /** Current period start */
  currentPeriodStart: string
  /** Current period end */
  currentPeriodEnd: string
  /** Next renewal date */
  renewalDate: string
  /** Days until renewal (computed) */
  daysUntilRenewal?: number
  /** Is past due */
  isPastDue?: boolean
  /** Stripe subscription ID */
  stripeSubscriptionId?: string
  /** Stripe customer ID */
  stripeCustomerId?: string
  /** Created timestamp */
  createdAt: string
  /** Updated timestamp */
  updatedAt: string
  /** Cancellation date (if cancelled) */
  cancelledAt?: string
  /** Cancellation reason */
  cancellationReason?: string
  /** Services included */
  services: IncludedService[]
  /** Auto-renew enabled */
  autoRenew: boolean
  /** Payment method on file */
  hasPaymentMethod: boolean
}

export interface IncludedService {
  /** Service name */
  name: string
  /** Service description */
  description?: string
  /** Is included in plan */
  included: boolean
  /** Usage limit (if applicable) */
  limit?: number
  /** Current usage */
  usage?: number
}

// ─── Client Portal Auth ──────────────────────────────────────

export interface PortalSession {
  /** Session ID */
  id: string
  /** Client ID */
  clientId: string
  /** Client email */
  email: string
  /** Client name */
  name: string
  /** Session created */
  createdAt: string
  /** Session expires */
  expiresAt: string
  /** Is valid */
  isValid: boolean
}

// ─── Weekly Update Config ────────────────────────────────────

export interface WeeklyUpdateConfig {
  /** Is enabled globally */
  enabled: boolean
  /** Day of week (0=Sunday, 1=Monday, etc.) */
  dayOfWeek: number
  /** Hour to send (0-23) */
  hourToSend: number
  /** Email template ID */
  templateId?: string
  /** CC admin on updates */
  ccAdmin: boolean
  /** Admin email for CC */
  adminEmail?: string
}

// ─── Query Types ─────────────────────────────────────────────

export interface ClientListQuery {
  search?: string
  tags?: string[]
  portalEnabled?: boolean
  limit?: number
  offset?: number
}

export interface ClientListResult {
  clients: Client[]
  total: number
  hasMore: boolean
}

export interface ProjectListQuery {
  clientId?: string
  status?: ProjectStatus | ProjectStatus[]
  search?: string
  limit?: number
  offset?: number
}

export interface ProjectListResult {
  projects: Project[]
  total: number
  hasMore: boolean
}

export interface SubscriptionListQuery {
  clientId?: string
  siteId?: string
  status?: SubscriptionStatus | SubscriptionStatus[]
  planTier?: SubscriptionPlanTier
  pastDue?: boolean
  limit?: number
  offset?: number
}

export interface SubscriptionListResult {
  subscriptions: SiteSubscription[]
  total: number
  hasMore: boolean
}
