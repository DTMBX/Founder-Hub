/**
 * Client Intake Packet
 *
 * Generates a comprehensive intake packet document containing:
 * - Lead information
 * - Qualification answers
 * - Proposal details
 * - Invoice/deposit status
 */

import type { Lead } from '@/leads/types'
import type { Invoice, Proposal } from '@/billing/types'
import { getLeadService } from '@/leads/service'
import { getInvoiceService, getProposalService } from '@/billing/service'

// ─── Types ───────────────────────────────────────────────────

export interface IntakePacket {
  lead: Lead
  activities: Array<{
    timestamp: string
    type: string
    description: string
  }>
  proposal?: Proposal
  invoices: Invoice[]
  generatedAt: string
}

// ─── Intake Service ──────────────────────────────────────────

export class IntakeService {
  /**
   * Generate an intake packet for a lead
   */
  async generatePacket(leadId: string): Promise<IntakePacket | null> {
    const leadService = getLeadService()
    const invoiceService = getInvoiceService()
    const proposalService = getProposalService()
    
    // Get lead
    const lead = await leadService.get(leadId)
    if (!lead) return null
    
    // Get activities
    const activities = await leadService.getActivities(leadId)
    
    // Get associated proposal
    const proposals = proposalService.list()
    const proposal = proposals.find((p) => p.leadId === leadId)
    
    // Get associated invoices
    const allInvoices = invoiceService.list()
    const invoices = allInvoices.filter((i) => i.leadId === leadId)
    
    return {
      lead,
      activities: activities.map((a) => ({
        timestamp: a.timestamp,
        type: a.type,
        description: a.description,
      })),
      proposal,
      invoices,
      generatedAt: new Date().toISOString(),
    }
  }
  
  /**
   * Generate HTML for intake packet
   */
  generateHTML(packet: IntakePacket): string {
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    
    const formatCurrency = (n: number) => `$${n.toFixed(2)}`
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Client Intake Packet - ${packet.lead.company || packet.lead.email}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; line-height: 1.6; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    h2 { font-size: 20px; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
    h3 { font-size: 16px; margin: 16px 0 8px; }
    .meta { color: #6b7280; margin-bottom: 24px; }
    .section { margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { }
    .field-label { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; }
    .field-value { font-size: 16px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; text-transform: uppercase; font-weight: 600; }
    .badge.new { background: #dbeafe; color: #1d4ed8; }
    .badge.qualified { background: #dcfce7; color: #16a34a; }
    .badge.unqualified { background: #fee2e2; color: #dc2626; }
    .badge.contacted { background: #fef3c7; color: #d97706; }
    .badge.proposal_sent { background: #e0e7ff; color: #4338ca; }
    .badge.deposit_paid { background: #dcfce7; color: #16a34a; }
    .badge.converted { background: #dcfce7; color: #16a34a; }
    .badge.lost { background: #f3f4f6; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { text-align: left; padding: 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .amount { text-align: right; }
    .timeline { list-style: none; }
    .timeline li { padding: 12px 0; border-left: 2px solid #e5e7eb; padding-left: 24px; position: relative; }
    .timeline li:before { content: ''; width: 10px; height: 10px; background: #e5e7eb; border-radius: 50%; position: absolute; left: -6px; top: 16px; }
    .timeline li.status_changed:before { background: #3b82f6; }
    .timeline li.created:before { background: #10b981; }
    .timeline li.payment_received:before { background: #10b981; }
    .timeline-time { font-size: 12px; color: #6b7280; }
    .timeline-desc { margin-top: 4px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>Client Intake Packet</h1>
  <p class="meta">Generated ${formatDate(packet.generatedAt)}</p>
  
  <h2>Contact Information</h2>
  <div class="section">
    <div class="grid">
      <div class="field">
        <div class="field-label">Name</div>
        <div class="field-value">${packet.lead.firstName || ''} ${packet.lead.lastName || ''}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value">${packet.lead.email}</div>
      </div>
      <div class="field">
        <div class="field-label">Company</div>
        <div class="field-value">${packet.lead.company || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Phone</div>
        <div class="field-value">${packet.lead.phone || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Website</div>
        <div class="field-value">${packet.lead.website || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Status</div>
        <div class="field-value"><span class="badge ${packet.lead.status}">${packet.lead.status.replace('_', ' ')}</span></div>
      </div>
    </div>
  </div>
  
  <h2>Lead Details</h2>
  <div class="section">
    <div class="grid">
      <div class="field">
        <div class="field-label">Source</div>
        <div class="field-value">${packet.lead.source.replace('_', ' ')}</div>
      </div>
      <div class="field">
        <div class="field-label">Vertical</div>
        <div class="field-value">${packet.lead.vertical || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Budget</div>
        <div class="field-value">${packet.lead.budget || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Timeline</div>
        <div class="field-value">${packet.lead.timeline || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Created</div>
        <div class="field-value">${formatDate(packet.lead.createdAt)}</div>
      </div>
      <div class="field">
        <div class="field-label">Last Updated</div>
        <div class="field-value">${formatDate(packet.lead.updatedAt)}</div>
      </div>
    </div>
    ${packet.lead.projectDescription ? `
      <div class="field" style="margin-top: 16px;">
        <div class="field-label">Project Description</div>
        <div class="field-value">${packet.lead.projectDescription}</div>
      </div>
    ` : ''}
  </div>
  
  ${packet.lead.utmSource || packet.lead.utmMedium || packet.lead.utmCampaign ? `
    <h2>Traffic Source</h2>
    <div class="section">
      <div class="grid">
        <div class="field">
          <div class="field-label">UTM Source</div>
          <div class="field-value">${packet.lead.utmSource || '—'}</div>
        </div>
        <div class="field">
          <div class="field-label">UTM Medium</div>
          <div class="field-value">${packet.lead.utmMedium || '—'}</div>
        </div>
        <div class="field">
          <div class="field-label">UTM Campaign</div>
          <div class="field-value">${packet.lead.utmCampaign || '—'}</div>
        </div>
        <div class="field">
          <div class="field-label">Landing Page</div>
          <div class="field-value">${packet.lead.landingPage || '—'}</div>
        </div>
      </div>
    </div>
  ` : ''}
  
  ${packet.proposal ? `
    <h2>Proposal</h2>
    <div class="section">
      <h3>${packet.proposal.title}</h3>
      <p>${packet.proposal.projectScope}</p>
      
      <h4 style="margin-top: 16px; margin-bottom: 8px;">Deliverables</h4>
      <ul>
        ${packet.proposal.deliverables.map((d) => `<li>${d}</li>`).join('')}
      </ul>
      
      <h4 style="margin-top: 16px; margin-bottom: 8px;">Timeline</h4>
      <p>${packet.proposal.timeline}</p>
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="amount">Qty</th>
            <th class="amount">Price</th>
            <th class="amount">Total</th>
          </tr>
        </thead>
        <tbody>
          ${packet.proposal.items.map((item) => `
            <tr>
              <td>${item.description}</td>
              <td class="amount">${item.quantity}</td>
              <td class="amount">${formatCurrency(item.unitPrice)}</td>
              <td class="amount">${formatCurrency(item.total)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3"><strong>Total</strong></td>
            <td class="amount"><strong>${formatCurrency(packet.proposal.total)}</strong></td>
          </tr>
          <tr>
            <td colspan="3">Deposit Required (${packet.proposal.depositPercentage}%)</td>
            <td class="amount">${formatCurrency(packet.proposal.depositAmount)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  ` : ''}
  
  ${packet.invoices.length > 0 ? `
    <h2>Invoices</h2>
    <div class="section">
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Status</th>
            <th class="amount">Total</th>
            <th class="amount">Paid</th>
            <th class="amount">Due</th>
          </tr>
        </thead>
        <tbody>
          ${packet.invoices.map((inv) => `
            <tr>
              <td>${inv.invoiceNumber}</td>
              <td>${formatDate(inv.issueDate)}</td>
              <td><span class="badge ${inv.status}">${inv.status}</span></td>
              <td class="amount">${formatCurrency(inv.total)}</td>
              <td class="amount">${formatCurrency(inv.amountPaid)}</td>
              <td class="amount">${formatCurrency(inv.amountDue)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : ''}
  
  ${packet.activities.length > 0 ? `
    <h2>Activity Timeline</h2>
    <div class="section">
      <ul class="timeline">
        ${packet.activities.map((act) => `
          <li class="${act.type}">
            <div class="timeline-time">${formatDate(act.timestamp)}</div>
            <div class="timeline-desc">${act.description}</div>
          </li>
        `).join('')}
      </ul>
    </div>
  ` : ''}
  
  ${packet.lead.notes ? `
    <h2>Internal Notes</h2>
    <div class="section">
      <p>${packet.lead.notes}</p>
    </div>
  ` : ''}
</body>
</html>
    `.trim()
  }
  
  /**
   * Download intake packet as HTML
   */
  downloadHTML(packet: IntakePacket): void {
    const html = this.generateHTML(packet)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const filename = `intake-${packet.lead.company || packet.lead.email.split('@')[0]}-${new Date().toISOString().split('T')[0]}.html`
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
  
  /**
   * Print intake packet
   */
  print(packet: IntakePacket): void {
    const html = this.generateHTML(packet)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.print()
    }
  }
  
  /**
   * Export packet as JSON
   */
  exportJSON(packet: IntakePacket): string {
    return JSON.stringify(packet, null, 2)
  }
  
  /**
   * Download packet as JSON
   */
  downloadJSON(packet: IntakePacket): void {
    const json = this.exportJSON(packet)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const filename = `intake-${packet.lead.company || packet.lead.email.split('@')[0]}-${new Date().toISOString().split('T')[0]}.json`
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}

// ─── Default Instance ────────────────────────────────────────

let intakeServiceInstance: IntakeService | null = null

export function getIntakeService(): IntakeService {
  if (!intakeServiceInstance) {
    intakeServiceInstance = new IntakeService()
  }
  return intakeServiceInstance
}
