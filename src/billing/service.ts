/**
 * Invoice Service
 *
 * Service for creating invoices and generating simple PDF documents.
 * Uses HTML-to-PDF generation for basic invoice creation.
 */

import {
  type Invoice,
  type InvoiceStatus,
  type InvoiceLineItem,
  type CreateInvoiceInput,
  type Proposal,
  type CreateProposalInput,
} from './types'

// ─── Invoice Number Generator ────────────────────────────────

let invoiceCounter = 0

function generateInvoiceNumber(): string {
  invoiceCounter++
  const year = new Date().getFullYear()
  const number = invoiceCounter.toString().padStart(4, '0')
  return `INV-${year}-${number}`
}

function generateProposalNumber(): string {
  const id = crypto.randomUUID().split('-')[0].toUpperCase()
  return `PROP-${id}`
}

// ─── Storage ─────────────────────────────────────────────────

const INVOICES_KEY = 'xtx_invoices'
const PROPOSALS_KEY = 'xtx_proposals'

function getStoredInvoices(): Invoice[] {
  try {
    const data = localStorage.getItem(INVOICES_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveInvoices(invoices: Invoice[]): void {
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices))
}

function getStoredProposals(): Proposal[] {
  try {
    const data = localStorage.getItem(PROPOSALS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveProposals(proposals: Proposal[]): void {
  localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals))
}

// ─── Invoice Service ─────────────────────────────────────────

export class InvoiceService {
  /**
   * Create a new invoice
   */
  create(input: CreateInvoiceInput): Invoice {
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    
    // Calculate line item totals
    const items: InvoiceLineItem[] = input.items.map((item) => ({
      id: crypto.randomUUID(),
      ...item,
      total: item.quantity * item.unitPrice,
    }))
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const taxRate = input.taxRate ?? 0
    const tax = subtotal * (taxRate / 100)
    const total = subtotal + tax
    
    // Default due date: 14 days from now
    const dueDate = input.dueDate ?? (() => {
      const d = new Date()
      d.setDate(d.getDate() + 14)
      return d.toISOString().split('T')[0]
    })()
    
    const invoice: Invoice = {
      id,
      invoiceNumber: generateInvoiceNumber(),
      createdAt: now,
      updatedAt: now,
      status: 'draft',
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      clientCompany: input.clientCompany,
      clientAddress: input.clientAddress,
      items,
      subtotal,
      tax,
      taxRate,
      total,
      amountPaid: 0,
      amountDue: total,
      issueDate: now.split('T')[0],
      dueDate,
      notes: input.notes,
      terms: input.terms ?? 'Payment due within 14 days of invoice date.',
      leadId: input.leadId,
      proposalId: input.proposalId,
      projectDescription: input.projectDescription,
    }
    
    // Save
    const invoices = getStoredInvoices()
    invoices.push(invoice)
    saveInvoices(invoices)
    
    return invoice
  }
  
  /**
   * Get an invoice by ID
   */
  get(id: string): Invoice | null {
    const invoices = getStoredInvoices()
    return invoices.find((i) => i.id === id) ?? null
  }
  
  /**
   * List all invoices
   */
  list(): Invoice[] {
    return getStoredInvoices()
  }
  
  /**
   * Update invoice status
   */
  updateStatus(id: string, status: InvoiceStatus): Invoice | null {
    const invoices = getStoredInvoices()
    const index = invoices.findIndex((i) => i.id === id)
    if (index === -1) return null
    
    invoices[index] = {
      ...invoices[index],
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'paid' ? { paidDate: new Date().toISOString() } : {}),
    }
    
    saveInvoices(invoices)
    return invoices[index]
  }
  
  /**
   * Record payment
   */
  recordPayment(id: string, amount: number, reference?: string): Invoice | null {
    const invoices = getStoredInvoices()
    const index = invoices.findIndex((i) => i.id === id)
    if (index === -1) return null
    
    const invoice = invoices[index]
    const newAmountPaid = invoice.amountPaid + amount
    const newAmountDue = invoice.total - newAmountPaid
    const newStatus: InvoiceStatus = newAmountDue <= 0 ? 'paid' : 'partial'
    
    invoices[index] = {
      ...invoice,
      amountPaid: newAmountPaid,
      amountDue: Math.max(0, newAmountDue),
      status: newStatus,
      updatedAt: new Date().toISOString(),
      paymentReference: reference,
      ...(newStatus === 'paid' ? { paidDate: new Date().toISOString() } : {}),
    }
    
    saveInvoices(invoices)
    return invoices[index]
  }
  
  /**
   * Generate HTML for invoice (for printing/PDF)
   */
  generateHTML(invoice: Invoice): string {
    const formatCurrency = (n: number) => `$${n.toFixed(2)}`
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .company { font-size: 24px; font-weight: bold; }
    .invoice-title { font-size: 32px; font-weight: bold; color: #666; }
    .invoice-number { color: #666; margin-top: 8px; }
    .addresses { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .address h3 { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px; }
    .address p { line-height: 1.5; }
    .meta { margin-bottom: 40px; }
    .meta-row { display: flex; margin-bottom: 8px; }
    .meta-label { width: 120px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; padding: 12px; border-bottom: 2px solid #000; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    .amount { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-row.final { font-size: 20px; font-weight: bold; border-top: 2px solid #000; padding-top: 16px; }
    .notes { margin-top: 40px; padding: 20px; background: #f9f9f9; border-radius: 4px; }
    .notes h3 { font-size: 14px; margin-bottom: 8px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; text-transform: uppercase; font-weight: 600; }
    .status.draft { background: #f3f4f6; color: #6b7280; }
    .status.sent { background: #dbeafe; color: #1d4ed8; }
    .status.paid { background: #dcfce7; color: #16a34a; }
    .status.overdue { background: #fee2e2; color: #dc2626; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">Founder-Hub</div>
      <span class="status ${invoice.status}">${invoice.status}</span>
    </div>
    <div style="text-align: right;">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">${invoice.invoiceNumber}</div>
    </div>
  </div>
  
  <div class="addresses">
    <div class="address">
      <h3>Bill To</h3>
      <p>
        <strong>${invoice.clientName}</strong><br>
        ${invoice.clientCompany ? `${invoice.clientCompany}<br>` : ''}
        ${invoice.clientEmail}${invoice.clientAddress ? `<br>${invoice.clientAddress}` : ''}
      </p>
    </div>
    <div class="address" style="text-align: right;">
      <h3>Invoice Details</h3>
      <p>
        <strong>Issue Date:</strong> ${formatDate(invoice.issueDate)}<br>
        <strong>Due Date:</strong> ${formatDate(invoice.dueDate)}
        ${invoice.paidDate ? `<br><strong>Paid:</strong> ${formatDate(invoice.paidDate)}` : ''}
      </p>
    </div>
  </div>
  
  ${invoice.projectDescription ? `<p style="margin-bottom: 24px;"><strong>Project:</strong> ${invoice.projectDescription}</p>` : ''}
  
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="amount">Qty</th>
        <th class="amount">Unit Price</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td class="amount">${item.quantity}</td>
          <td class="amount">${formatCurrency(item.unitPrice)}</td>
          <td class="amount">${formatCurrency(item.total)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>${formatCurrency(invoice.subtotal)}</span>
    </div>
    ${invoice.tax > 0 ? `
      <div class="total-row">
        <span>Tax (${invoice.taxRate}%)</span>
        <span>${formatCurrency(invoice.tax)}</span>
      </div>
    ` : ''}
    <div class="total-row final">
      <span>Total</span>
      <span>${formatCurrency(invoice.total)}</span>
    </div>
    ${invoice.amountPaid > 0 ? `
      <div class="total-row">
        <span>Amount Paid</span>
        <span>-${formatCurrency(invoice.amountPaid)}</span>
      </div>
      <div class="total-row" style="font-weight: bold;">
        <span>Amount Due</span>
        <span>${formatCurrency(invoice.amountDue)}</span>
      </div>
    ` : ''}
  </div>
  
  ${invoice.notes ? `
    <div class="notes">
      <h3>Notes</h3>
      <p>${invoice.notes}</p>
    </div>
  ` : ''}
  
  ${invoice.terms ? `
    <div class="notes" style="background: transparent; padding-left: 0;">
      <h3>Terms</h3>
      <p style="color: #666; font-size: 14px;">${invoice.terms}</p>
    </div>
  ` : ''}
</body>
</html>
    `.trim()
  }
  
  /**
   * Open invoice in new window for printing
   */
  print(invoice: Invoice): void {
    const html = this.generateHTML(invoice)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.print()
    }
  }
  
  /**
   * Download invoice as HTML file
   */
  downloadHTML(invoice: Invoice): void {
    const html = this.generateHTML(invoice)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoice.invoiceNumber}.html`
    a.click()
    URL.revokeObjectURL(url)
  }
}

// ─── Proposal Service ────────────────────────────────────────

export class ProposalService {
  /**
   * Create a new proposal
   */
  create(input: CreateProposalInput): Proposal {
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    
    // Calculate line item totals
    const items: InvoiceLineItem[] = input.items.map((item) => ({
      id: crypto.randomUUID(),
      ...item,
      total: item.quantity * item.unitPrice,
    }))
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const depositPercentage = input.depositPercentage ?? 50
    const depositAmount = subtotal * (depositPercentage / 100)
    
    // Valid until date
    const validDays = input.validDays ?? 14
    const validUntil = (() => {
      const d = new Date()
      d.setDate(d.getDate() + validDays)
      return d.toISOString().split('T')[0]
    })()
    
    const proposal: Proposal = {
      id,
      createdAt: now,
      updatedAt: now,
      status: 'draft',
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      clientCompany: input.clientCompany,
      title: input.title,
      introduction: input.introduction,
      projectScope: input.projectScope,
      deliverables: input.deliverables,
      timeline: input.timeline,
      items,
      subtotal,
      depositAmount,
      depositPercentage,
      total: subtotal,
      validUntil,
      terms: input.terms,
      leadId: input.leadId,
    }
    
    // Save
    const proposals = getStoredProposals()
    proposals.push(proposal)
    saveProposals(proposals)
    
    return proposal
  }
  
  /**
   * Get a proposal by ID
   */
  get(id: string): Proposal | null {
    const proposals = getStoredProposals()
    return proposals.find((p) => p.id === id) ?? null
  }
  
  /**
   * List all proposals
   */
  list(): Proposal[] {
    return getStoredProposals()
  }
  
  /**
   * Convert proposal to deposit invoice
   */
  createDepositInvoice(proposalId: string): Invoice | null {
    const proposal = this.get(proposalId)
    if (!proposal) return null
    
    const invoiceService = getInvoiceService()
    
    return invoiceService.create({
      clientName: proposal.clientName,
      clientEmail: proposal.clientEmail,
      clientCompany: proposal.clientCompany,
      items: [
        {
          description: `Deposit for: ${proposal.title}`,
          quantity: 1,
          unitPrice: proposal.depositAmount,
        },
      ],
      proposalId: proposal.id,
      leadId: proposal.leadId,
      projectDescription: proposal.title,
      notes: `This is a ${proposal.depositPercentage}% deposit. Remaining balance of $${(proposal.total - proposal.depositAmount).toFixed(2)} due upon project completion.`,
    })
  }
}

// ─── Default Instances ───────────────────────────────────────

let invoiceServiceInstance: InvoiceService | null = null
let proposalServiceInstance: ProposalService | null = null

export function getInvoiceService(): InvoiceService {
  if (!invoiceServiceInstance) {
    invoiceServiceInstance = new InvoiceService()
  }
  return invoiceServiceInstance
}

export function getProposalService(): ProposalService {
  if (!proposalServiceInstance) {
    proposalServiceInstance = new ProposalService()
  }
  return proposalServiceInstance
}
