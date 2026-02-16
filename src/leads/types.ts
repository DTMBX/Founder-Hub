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
  | 'proposal_sent' // Proposal/quote sent
  | 'deposit_paid'  // Deposit received
  | 'converted'     // Became a client
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
