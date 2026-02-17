/**
 * Lead Types
 *
 * Core types for the lead capture funnel.
 */

// ─── Lead Status ─────────────────────────────────────────────

export type LeadStatus =
  | 'new'           // Just captured, not qualified
  | 'qualified'     // Passed qualification criteria
  | 'contacted'     // Outreach made
  | 'estimating'    // Preparing estimate/quote
  | 'proposal_sent' // Proposal/quote sent
  | 'deposit_paid'  // Deposit received
  | 'converted'     // Became a client (won)
  | 'lost'          // Did not convert
  | 'unqualified'   // Failed qualification

// ─── Lead Source ─────────────────────────────────────────────

export type LeadSource =
  | 'website_form'       // Contact form
  | 'preview_generator'  // Generated a preview
  | 'booking'           // Booked a call
  | 'referral'          // Referred by existing client
  | 'organic'           // Direct traffic
  | 'paid'              // Paid advertising
  | 'import'            // Manual import

// ─── Lead Model ──────────────────────────────────────────────

export interface Lead {
  /** Unique lead ID */
  id: string
  /** Lead creation timestamp */
  createdAt: string
  /** Last update timestamp */
  updatedAt: string
  /** Current status */
  status: LeadStatus
  /** Source of the lead */
  source: LeadSource
  
  // Contact info
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  website?: string
  
  // Qualification data
  vertical?: string
  budget?: string
  timeline?: string
  projectDescription?: string
  
  // Tracking
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  landingPage?: string
  
  // Enrichment (from qualification or external)
  enrichment?: LeadEnrichment
  
  // Internal notes
  notes?: string
  assignedTo?: string
  
  // Linked entities
  proposalId?: string
  invoiceId?: string
  clientId?: string

  // Chain 1: Extended fields
  /** Last time lead was contacted */
  lastContactedAt?: string
  /** File attachments (photos/docs) */
  attachments?: LeadAttachment[]
  /** Project type/category */
  projectType?: string
}

// ─── Lead Attachment ─────────────────────────────────────────

export interface LeadAttachment {
  /** Unique attachment ID */
  id: string
  /** Original filename */
  filename: string
  /** MIME type */
  mimeType: string
  /** File size in bytes */
  size: number
  /** Storage URL or base64 data URI */
  url: string
  /** Upload timestamp */
  uploadedAt: string
  /** Uploader (lead email or admin) */
  uploadedBy: string
}

// ─── Lead Enrichment ─────────────────────────────────────────

export interface LeadEnrichment {
  /** Company size estimate */
  companySize?: 'solo' | 'small' | 'medium' | 'large'
  /** Industry/vertical */
  industry?: string
  /** LinkedIn profile */
  linkedInUrl?: string
  /** Social presence score (0-100) */
  socialScore?: number
  /** Website tech stack detected */
  techStack?: string[]
  /** Current website performance score */
  currentSiteScore?: number
  /** Enrichment source */
  enrichedBy?: string
  /** Enrichment timestamp */
  enrichedAt?: string
}

// ─── Lead Capture Input ──────────────────────────────────────

export interface LeadCaptureInput {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  website?: string
  vertical?: string
  projectDescription?: string
  source?: LeadSource
  referrer?: string
}

// ─── Lead Activity ───────────────────────────────────────────

export interface LeadActivity {
  id: string
  leadId: string
  timestamp: string
  type: LeadActivityType
  description: string
  metadata?: Record<string, unknown>
}

export type LeadActivityType =
  | 'created'
  | 'status_changed'
  | 'email_sent'
  | 'email_opened'
  | 'call_scheduled'
  | 'call_completed'
  | 'proposal_generated'
  | 'proposal_viewed'
  | 'deposit_requested'
  | 'payment_received'
  | 'note_added'
  | 'assigned'
  | 'attachment_added'
  | 'follow_up_scheduled'
  | 'follow_up_completed'
  | 'auto_reply_sent'

// ─── Lead List Query ─────────────────────────────────────────

export interface LeadListQuery {
  status?: LeadStatus | LeadStatus[]
  source?: LeadSource | LeadSource[]
  assignedTo?: string
  createdAfter?: string
  createdBefore?: string
  search?: string
  limit?: number
  offset?: number
  orderBy?: 'createdAt' | 'updatedAt' | 'company'
  orderDir?: 'asc' | 'desc'
}

export interface LeadListResult {
  leads: Lead[]
  total: number
  hasMore: boolean
}

// ─── Follow-Up Task ──────────────────────────────────────────

export type FollowUpTaskStatus = 'pending' | 'completed' | 'cancelled' | 'overdue'

export interface FollowUpTask {
  /** Unique task ID */
  id: string
  /** Linked lead ID */
  leadId: string
  /** Task title/description */
  title: string
  /** Due date (ISO 8601) */
  dueDate: string
  /** Current status */
  status: FollowUpTaskStatus
  /** Reminder sent flag */
  reminderSent: boolean
  /** Reminder timestamp if sent */
  reminderSentAt?: string
  /** Created timestamp */
  createdAt: string
  /** Completed timestamp */
  completedAt?: string
  /** Assigned user */
  assignedTo?: string
  /** Priority level */
  priority: 'low' | 'normal' | 'high' | 'urgent'
  /** Task type for categorization */
  taskType: FollowUpTaskType
  /** Notes */
  notes?: string
}

export type FollowUpTaskType =
  | 'initial_contact'
  | 'follow_up_call'
  | 'send_proposal'
  | 'check_in'
  | 'collect_deposit'
  | 'review_attachments'
  | 'custom'

// ─── Auto-Reply Template ─────────────────────────────────────

export interface AutoReplyTemplate {
  /** Template ID */
  id: string
  /** Template name */
  name: string
  /** Email subject */
  subject: string
  /** Email body (supports {{variables}}) */
  body: string
  /** When to use this template */
  trigger: 'lead_created' | 'follow_up_reminder' | 'proposal_sent' | 'custom'
  /** Is template active */
  active: boolean
}

// ─── Notification Config ─────────────────────────────────────

export interface NotificationConfig {
  /** Email notifications enabled */
  emailEnabled: boolean
  /** Email address for notifications */
  notifyEmail?: string
  /** SMS notifications enabled */
  smsEnabled: boolean
  /** Phone number for SMS */
  notifyPhone?: string
  /** Push notifications enabled (future PWA) */
  pushEnabled: boolean
  /** Push subscription endpoint */
  pushEndpoint?: string
}

// ─── Automation Event ────────────────────────────────────────

export interface AutomationEvent {
  /** Event ID */
  id: string
  /** Event type */
  type: 'lead_created' | 'follow_up_due' | 'status_changed' | 'reminder_triggered'
  /** Associated lead ID */
  leadId: string
  /** Event timestamp */
  timestamp: string
  /** Actions taken */
  actions: AutomationAction[]
  /** Success indicator */
  success: boolean
  /** Error message if failed */
  error?: string
}

export interface AutomationAction {
  /** Action type */
  type: 'auto_reply' | 'create_task' | 'notify_email' | 'notify_sms' | 'notify_push' | 'log_audit'
  /** Action result */
  result: 'success' | 'failed' | 'skipped'
  /** Details/error */
  details?: string
}
