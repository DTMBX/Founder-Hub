/**
 * Billing Module — Public API
 *
 * Invoice and proposal management:
 * - Invoice creation and management
 * - Proposal creation
 * - HTML generation for printing/PDF
 * - Deposit invoice generation
 */

// Types
export type {
  Invoice,
  InvoiceStatus,
  InvoiceLineItem,
  CreateInvoiceInput,
  Proposal,
  ProposalStatus,
  CreateProposalInput,
} from './types'

// Services
export {
  InvoiceService,
  ProposalService,
  getInvoiceService,
  getProposalService,
} from './service'
