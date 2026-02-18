/**
 * Invoice Types
 *
 * Types for invoices, proposals, and payments.
 */

// ─── Invoice Status ──────────────────────────────────────────

export type InvoiceStatus =
  | 'draft'       // Not yet sent
  | 'sent'        // Sent to client
  | 'viewed'      // Client viewed the invoice
  | 'paid'        // Fully paid
  | 'partial'     // Partially paid
  | 'overdue'     // Past due date
  | 'cancelled'   // Cancelled/voided

// ─── Invoice Line Item ───────────────────────────────────────

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

// ─── Invoice Model ───────────────────────────────────────────

export interface Invoice {
  id: string
  invoiceNumber: string
  createdAt: string
  updatedAt: string
  status: InvoiceStatus
  
  // Client info
  clientName: string
  clientEmail: string
  clientCompany?: string
  clientAddress?: string
  
  // Invoice details
  items: InvoiceLineItem[]
  subtotal: number
  tax: number
  taxRate: number
  total: number
  amountPaid: number
  amountDue: number
  
  // Dates
  issueDate: string
  dueDate: string
  paidDate?: string
  
  // Reference
  leadId?: string
  proposalId?: string
  projectDescription?: string
  
  // Terms
  notes?: string
  terms?: string
  
  // Payment info
  paymentMethod?: string
  paymentReference?: string
}

// ─── Proposal Status ─────────────────────────────────────────

export type ProposalStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'expired'

// ─── Proposal Model ──────────────────────────────────────────

export interface Proposal {
  id: string
  createdAt: string
  updatedAt: string
  status: ProposalStatus
  
  // Client info
  clientName: string
  clientEmail: string
  clientCompany?: string
  
  // Proposal details
  title: string
  introduction?: string
  projectScope: string
  deliverables: string[]
  timeline: string
  
  // Pricing
  items: InvoiceLineItem[]
  subtotal: number
  depositAmount: number
  depositPercentage: number
  total: number
  
  // Dates
  validUntil: string
  
  // Reference
  leadId?: string
  
  // Terms
  terms?: string
  signatureRequired?: boolean
  signedAt?: string
  signedBy?: string
}

// ─── Create Invoice Input ────────────────────────────────────

export interface CreateInvoiceInput {
  clientName: string
  clientEmail: string
  clientCompany?: string
  clientAddress?: string
  items: Omit<InvoiceLineItem, 'id' | 'total'>[]
  dueDate?: string
  taxRate?: number
  notes?: string
  terms?: string
  leadId?: string
  proposalId?: string
  projectDescription?: string
}

// ─── Create Proposal Input ───────────────────────────────────

export interface CreateProposalInput {
  clientName: string
  clientEmail: string
  clientCompany?: string
  title: string
  introduction?: string
  projectScope: string
  deliverables: string[]
  timeline: string
  items: Omit<InvoiceLineItem, 'id' | 'total'>[]
  depositPercentage?: number
  validDays?: number
  terms?: string
  leadId?: string
}
