/**
 * B14-P4 — Billing Ledger
 *
 * Append-only billing ledger for invoice lifecycle management.
 * All state transitions are recorded as immutable ledger entries.
 */

import { createHash } from 'crypto';
import {
  type Invoice,
  type InvoiceStatus,
  type LineItem,
  type Currency,
  generateInvoiceId,
  computeLineAmount,
  computeSubtotal,
  computeTotal,
  hashInvoice,
} from '../models/Invoice';

// ── Ledger Entry ────────────────────────────────────────────────

export type LedgerAction =
  | 'invoice.created'
  | 'invoice.issued'
  | 'invoice.paid'
  | 'invoice.voided'
  | 'invoice.disputed'
  | 'invoice.overdue';

export interface LedgerEntry {
  entryId: string;
  invoiceId: string;
  action: LedgerAction;
  timestamp: string;
  actor: string;
  previousStatus?: InvoiceStatus;
  newStatus: InvoiceStatus;
  metadata?: Record<string, unknown>;
  entryHash: string;
}

// ── Billing Ledger ──────────────────────────────────────────────

export class BillingLedger {
  private invoices: Map<string, Invoice> = new Map();
  private entries: LedgerEntry[] = []; // append-only

  /**
   * Create a new invoice in draft status.
   */
  createInvoice(params: {
    clientId: string;
    clientName: string;
    currency?: Currency;
    lineItems: Omit<LineItem, 'amount'>[];
    taxRate?: number;
    notes?: string;
  }): Invoice {
    const currency = params.currency ?? 'USD';
    const lineItems: LineItem[] = params.lineItems.map((li) => ({
      ...li,
      amount: computeLineAmount(li.quantity, li.unitPrice),
    }));

    const subtotal = computeSubtotal(lineItems);
    const tax = params.taxRate
      ? Math.round(subtotal * params.taxRate * 100) / 100
      : 0;
    const total = computeTotal(subtotal, tax);
    const now = new Date().toISOString();

    const partial: Omit<Invoice, 'integrityHash'> = {
      invoiceId: generateInvoiceId(),
      clientId: params.clientId,
      clientName: params.clientName,
      status: 'draft',
      currency,
      lineItems,
      subtotal,
      tax,
      total,
      createdAt: now,
      updatedAt: now,
      notes: params.notes ?? '',
    };

    const invoice: Invoice = {
      ...partial,
      integrityHash: hashInvoice(partial),
    };

    this.invoices.set(invoice.invoiceId, invoice);
    this.appendEntry(invoice.invoiceId, 'invoice.created', 'draft', 'system');
    return invoice;
  }

  /**
   * Issue an invoice (draft → issued).
   */
  issue(invoiceId: string, actor: string, dueDate: string): Invoice {
    const invoice = this.getOrThrow(invoiceId);
    this.assertStatus(invoice, 'draft');

    invoice.status = 'issued';
    invoice.issuedAt = new Date().toISOString();
    invoice.dueDate = dueDate;
    invoice.updatedAt = new Date().toISOString();

    this.appendEntry(invoiceId, 'invoice.issued', 'issued', actor, {
      previousStatus: 'draft',
    });
    return invoice;
  }

  /**
   * Record payment (issued or overdue → paid).
   */
  recordPayment(invoiceId: string, actor: string): Invoice {
    const invoice = this.getOrThrow(invoiceId);
    if (invoice.status !== 'issued' && invoice.status !== 'overdue') {
      throw new Error(`Cannot record payment for invoice in status: ${invoice.status}`);
    }

    const prev = invoice.status;
    invoice.status = 'paid';
    invoice.paidAt = new Date().toISOString();
    invoice.updatedAt = new Date().toISOString();

    this.appendEntry(invoiceId, 'invoice.paid', 'paid', actor, {
      previousStatus: prev,
    });
    return invoice;
  }

  /**
   * Void an invoice.
   */
  void(invoiceId: string, actor: string, reason: string): Invoice {
    const invoice = this.getOrThrow(invoiceId);
    if (invoice.status === 'paid' || invoice.status === 'void') {
      throw new Error(`Cannot void invoice in status: ${invoice.status}`);
    }

    const prev = invoice.status;
    invoice.status = 'void';
    invoice.updatedAt = new Date().toISOString();

    this.appendEntry(invoiceId, 'invoice.voided', 'void', actor, {
      previousStatus: prev,
      reason,
    });
    return invoice;
  }

  /**
   * Mark as disputed.
   */
  dispute(invoiceId: string, actor: string, reason: string): Invoice {
    const invoice = this.getOrThrow(invoiceId);
    if (invoice.status !== 'issued' && invoice.status !== 'overdue') {
      throw new Error(`Cannot dispute invoice in status: ${invoice.status}`);
    }

    const prev = invoice.status;
    invoice.status = 'disputed';
    invoice.updatedAt = new Date().toISOString();

    this.appendEntry(invoiceId, 'invoice.disputed', 'disputed', actor, {
      previousStatus: prev,
      reason,
    });
    return invoice;
  }

  /**
   * Get an invoice by ID.
   */
  get(invoiceId: string): Invoice | undefined {
    return this.invoices.get(invoiceId);
  }

  /**
   * Get the append-only ledger entries.
   */
  getEntries(invoiceId?: string): readonly LedgerEntry[] {
    if (invoiceId) {
      return this.entries.filter((e) => e.invoiceId === invoiceId);
    }
    return [...this.entries];
  }

  /**
   * Verify ledger integrity (entries are append-only, hashes valid).
   */
  verifyLedger(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const entry of this.entries) {
      const expected = this.computeEntryHash(entry);
      if (entry.entryHash !== expected) {
        errors.push(`Entry ${entry.entryId}: hash mismatch`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  /** List all invoices. */
  list(filter?: { status?: InvoiceStatus; clientId?: string }): Invoice[] {
    let results = Array.from(this.invoices.values());
    if (filter?.status) {
      results = results.filter((i) => i.status === filter.status);
    }
    if (filter?.clientId) {
      results = results.filter((i) => i.clientId === filter.clientId);
    }
    return results;
  }

  /** Reset (for testing). */
  _reset(): void {
    this.invoices.clear();
    this.entries.length = 0;
  }

  // ── Private ─────────────────────────────────────────────────

  private getOrThrow(invoiceId: string): Invoice {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);
    return invoice;
  }

  private assertStatus(invoice: Invoice, expected: InvoiceStatus): void {
    if (invoice.status !== expected) {
      throw new Error(
        `Expected status '${expected}', got '${invoice.status}'`,
      );
    }
  }

  private appendEntry(
    invoiceId: string,
    action: LedgerAction,
    newStatus: InvoiceStatus,
    actor: string,
    metadata?: Record<string, unknown>,
  ): void {
    const entry: Omit<LedgerEntry, 'entryHash'> = {
      entryId: `LE-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      invoiceId,
      action,
      timestamp: new Date().toISOString(),
      actor,
      newStatus,
      previousStatus: metadata?.previousStatus as InvoiceStatus | undefined,
      metadata,
    };

    const full: LedgerEntry = {
      ...entry,
      entryHash: this.computeEntryHash(entry as LedgerEntry),
    };

    this.entries.push(full);
  }

  private computeEntryHash(entry: Omit<LedgerEntry, 'entryHash'> | LedgerEntry): string {
    const payload = JSON.stringify({
      entryId: entry.entryId,
      invoiceId: entry.invoiceId,
      action: entry.action,
      timestamp: entry.timestamp,
      actor: entry.actor,
      newStatus: entry.newStatus,
    });
    return createHash('sha256').update(payload).digest('hex');
  }
}
