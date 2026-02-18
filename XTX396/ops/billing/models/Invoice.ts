/**
 * B14-P4 — Invoice Model
 *
 * Type-safe invoice data model with line items,
 * deterministic hash, and status lifecycle.
 */

import { createHash } from 'crypto';

// ── Types ───────────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'void' | 'disputed';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD';

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  invoiceId: string;
  clientId: string;
  clientName: string;
  status: InvoiceStatus;
  currency: Currency;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  issuedAt?: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  integrityHash: string;
  notes: string;
}

// ── Helpers ─────────────────────────────────────────────────────

export function generateInvoiceId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `INV-${ts}-${rand}`;
}

export function computeLineAmount(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export function computeSubtotal(lineItems: LineItem[]): number {
  return Math.round(lineItems.reduce((sum, li) => sum + li.amount, 0) * 100) / 100;
}

export function computeTotal(subtotal: number, tax: number): number {
  return Math.round((subtotal + tax) * 100) / 100;
}

export function hashInvoice(invoice: Omit<Invoice, 'integrityHash'>): string {
  const payload = JSON.stringify({
    invoiceId: invoice.invoiceId,
    clientId: invoice.clientId,
    lineItems: invoice.lineItems,
    currency: invoice.currency,
    total: invoice.total,
    createdAt: invoice.createdAt,
  });
  return createHash('sha256').update(payload).digest('hex');
}
