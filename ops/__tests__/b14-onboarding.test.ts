/**
 * B14 — Client Onboarding + Billing Ops Tests
 *
 * Covers:
 *   P1: IntakeModel + checklist validation
 *   P3: ProposalService (added in P3)
 *   P4: BillingLedger (added in P4)
 *   P5: HandoffPackageService (added in P5)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  IntakeService,
  type ChecklistSchema,
  type EngagementType,
} from '../onboarding/intake/IntakeModel';

// ── Test checklist schema ───────────────────────────────────────

const testChecklist: ChecklistSchema = {
  engagementType: 'ediscovery',
  version: '1.0.0',
  items: [
    { id: 'req-1', label: 'Required item 1', required: true },
    { id: 'req-2', label: 'Required item 2', required: true },
    { id: 'opt-1', label: 'Optional item 1', required: false },
  ],
};

const smbChecklist: ChecklistSchema = {
  engagementType: 'smb-consulting',
  version: '1.0.0',
  items: [
    { id: 's-1', label: 'Scope', required: true },
  ],
};

// ── B14-P1: Intake Model ───────────────────────────────────────

describe('B14-P1 — IntakeService.loadChecklist', () => {
  let svc: IntakeService;

  beforeEach(() => {
    svc = new IntakeService();
  });

  it('loads a valid checklist schema', () => {
    const schema = svc.loadChecklist(testChecklist);
    expect(schema.engagementType).toBe('ediscovery');
    expect(schema.items).toHaveLength(3);
  });

  it('rejects incomplete schema', () => {
    expect(() => svc.loadChecklist({ engagementType: 'ediscovery' })).toThrow(
      'missing required fields',
    );
  });

  it('rejects invalid engagement type', () => {
    expect(() =>
      svc.loadChecklist({
        engagementType: 'invalid-type',
        version: '1.0.0',
        items: [],
      }),
    ).toThrow('Invalid engagement type');
  });

  it('rejects items without id or label', () => {
    expect(() =>
      svc.loadChecklist({
        engagementType: 'ediscovery',
        version: '1.0.0',
        items: [{ required: true }],
      }),
    ).toThrow('missing id or label');
  });
});

describe('B14-P1 — IntakeService.createIntake', () => {
  let svc: IntakeService;

  beforeEach(() => {
    svc = new IntakeService();
    svc.registerChecklist(testChecklist);
    svc.registerChecklist(smbChecklist);
  });

  it('creates an intake with correct fields', () => {
    const record = svc.createIntake('ediscovery', 'Acme Corp', 'legal@acme.com');
    expect(record.intakeId).toMatch(/^INT-/);
    expect(record.engagementType).toBe('ediscovery');
    expect(record.clientName).toBe('Acme Corp');
    expect(record.contactEmail).toBe('legal@acme.com');
    expect(record.status).toBe('draft');
    expect(record.checklist).toHaveLength(3);
    expect(record.integrityHash).toBeTruthy();
  });

  it('initialises all checklist items as incomplete', () => {
    const record = svc.createIntake('ediscovery', 'Acme', 'a@b.com');
    expect(record.checklist.every((i) => !i.completed)).toBe(true);
  });

  it('errors if no checklist registered', () => {
    const fresh = new IntakeService();
    expect(() =>
      fresh.createIntake('ediscovery', 'X', 'x@y.com'),
    ).toThrow('No checklist registered');
  });
});

describe('B14-P1 — IntakeService.completeItem', () => {
  let svc: IntakeService;

  beforeEach(() => {
    svc = new IntakeService();
    svc.registerChecklist(testChecklist);
  });

  it('marks an item as completed', () => {
    const record = svc.createIntake('ediscovery', 'X', 'x@y.com');
    const updated = svc.completeItem(record.intakeId, 'req-1', 'user1');
    const item = updated.checklist.find((i) => i.id === 'req-1')!;
    expect(item.completed).toBe(true);
    expect(item.completedBy).toBe('user1');
    expect(item.completedAt).toBeTruthy();
  });

  it('errors on unknown intake', () => {
    expect(() => svc.completeItem('nope', 'req-1', 'user1')).toThrow(
      'Intake not found',
    );
  });

  it('errors on unknown item', () => {
    const record = svc.createIntake('ediscovery', 'X', 'x@y.com');
    expect(() =>
      svc.completeItem(record.intakeId, 'bad-id', 'user1'),
    ).toThrow('Checklist item not found');
  });
});

describe('B14-P1 — IntakeService.submit', () => {
  let svc: IntakeService;

  beforeEach(() => {
    svc = new IntakeService();
    svc.registerChecklist(testChecklist);
  });

  it('submits when all required items are complete', () => {
    const record = svc.createIntake('ediscovery', 'X', 'x@y.com');
    svc.completeItem(record.intakeId, 'req-1', 'u');
    svc.completeItem(record.intakeId, 'req-2', 'u');
    const submitted = svc.submit(record.intakeId);
    expect(submitted.status).toBe('submitted');
    expect(submitted.submittedAt).toBeTruthy();
  });

  it('rejects when required items are incomplete', () => {
    const record = svc.createIntake('ediscovery', 'X', 'x@y.com');
    svc.completeItem(record.intakeId, 'req-1', 'u');
    // req-2 not completed
    expect(() => svc.submit(record.intakeId)).toThrow('required item(s) incomplete');
  });

  it('allows submit with optional items incomplete', () => {
    const record = svc.createIntake('ediscovery', 'X', 'x@y.com');
    svc.completeItem(record.intakeId, 'req-1', 'u');
    svc.completeItem(record.intakeId, 'req-2', 'u');
    // opt-1 not completed — should still work
    expect(() => svc.submit(record.intakeId)).not.toThrow();
  });
});

describe('B14-P1 — IntakeService.review', () => {
  let svc: IntakeService;
  let intakeId: string;

  beforeEach(() => {
    svc = new IntakeService();
    svc.registerChecklist(testChecklist);
    const record = svc.createIntake('ediscovery', 'X', 'x@y.com');
    svc.completeItem(record.intakeId, 'req-1', 'u');
    svc.completeItem(record.intakeId, 'req-2', 'u');
    svc.submit(record.intakeId);
    intakeId = record.intakeId;
  });

  it('approves a submitted intake', () => {
    const reviewed = svc.review(intakeId, 'approved', 'reviewer@co.com');
    expect(reviewed.status).toBe('approved');
    expect(reviewed.reviewedBy).toBe('reviewer@co.com');
  });

  it('rejects a submitted intake', () => {
    const reviewed = svc.review(intakeId, 'rejected', 'reviewer@co.com');
    expect(reviewed.status).toBe('rejected');
  });

  it('errors if not in submitted status', () => {
    svc.review(intakeId, 'approved', 'r');
    expect(() => svc.review(intakeId, 'rejected', 'r')).toThrow(
      'Cannot review intake in status: approved',
    );
  });
});

describe('B14-P1 — IntakeService.verify', () => {
  let svc: IntakeService;

  beforeEach(() => {
    svc = new IntakeService();
    svc.registerChecklist(testChecklist);
  });

  it('validates an unmodified record', () => {
    const record = svc.createIntake('ediscovery', 'X', 'x@y.com');
    expect(svc.verify(record.intakeId).valid).toBe(true);
  });

  it('returns invalid for non-existent record', () => {
    const result = svc.verify('nope');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Record not found');
  });
});

describe('B14-P1 — IntakeService.list', () => {
  let svc: IntakeService;

  beforeEach(() => {
    svc = new IntakeService();
    svc.registerChecklist(testChecklist);
    svc.registerChecklist(smbChecklist);
  });

  it('lists all records', () => {
    svc.createIntake('ediscovery', 'A', 'a@b.com');
    svc.createIntake('smb-consulting', 'B', 'b@c.com');
    expect(svc.list()).toHaveLength(2);
  });

  it('filters by engagement type', () => {
    svc.createIntake('ediscovery', 'A', 'a@b.com');
    svc.createIntake('smb-consulting', 'B', 'b@c.com');
    expect(svc.list({ engagementType: 'ediscovery' })).toHaveLength(1);
  });

  it('filters by status', () => {
    const r = svc.createIntake('ediscovery', 'A', 'a@b.com');
    svc.createIntake('ediscovery', 'B', 'b@c.com');
    svc.completeItem(r.intakeId, 'req-1', 'u');
    svc.completeItem(r.intakeId, 'req-2', 'u');
    svc.submit(r.intakeId);
    expect(svc.list({ status: 'submitted' })).toHaveLength(1);
    expect(svc.list({ status: 'draft' })).toHaveLength(1);
  });
});

describe('B14-P1 — Checklist JSON schema validation', () => {
  it('ediscovery checklist has required fields', async () => {
    const json = await import(
      '../onboarding/intake/checklists/ediscovery.json'
    );
    expect(json.engagementType).toBe('ediscovery');
    expect(json.version).toBe('1.0.0');
    expect(Array.isArray(json.items)).toBe(true);
    expect(json.items.length).toBeGreaterThan(0);
    for (const item of json.items) {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(typeof item.required).toBe('boolean');
    }
  });

  it('smb-consulting checklist has required fields', async () => {
    const json = await import(
      '../onboarding/intake/checklists/smb-consulting.json'
    );
    expect(json.engagementType).toBe('smb-consulting');
    expect(Array.isArray(json.items)).toBe(true);
  });

  it('public-tools checklist has required fields', async () => {
    const json = await import(
      '../onboarding/intake/checklists/public-tools.json'
    );
    expect(json.engagementType).toBe('public-tools');
    expect(Array.isArray(json.items)).toBe(true);
  });
});

// ── B14-P2: Contract Template Placeholder Linter ────────────────

import { readFileSync } from 'fs';
import { resolve } from 'path';

function readTemplate(name: string): string {
  return readFileSync(
    resolve(__dirname, '../../contracts/templates', name),
    'utf-8',
  );
}

function extractPlaceholders(content: string): string[] {
  const matches = content.match(/\{\{[A-Z_0-9]+\}\}/g) ?? [];
  return [...new Set(matches)];
}

describe('B14-P2 — Contract template placeholder linter', () => {
  const templates = [
    'MSA_template.md',
    'SOW_template.md',
    'NDA_lite_template.md',
  ];

  for (const tpl of templates) {
    it(`${tpl} uses valid UPPER_SNAKE_CASE placeholders`, () => {
      const content = readTemplate(tpl);
      const placeholders = extractPlaceholders(content);
      expect(placeholders.length).toBeGreaterThan(0);
      for (const ph of placeholders) {
        expect(ph).toMatch(/^\{\{[A-Z][A-Z_0-9]*\}\}$/);
      }
    });

    it(`${tpl} contains no empty placeholders {{}}`, () => {
      const content = readTemplate(tpl);
      expect(content).not.toContain('{{}}');
    });

    it(`${tpl} includes the legal review warning`, () => {
      const content = readTemplate(tpl);
      expect(content.toLowerCase()).toContain('legal review');
    });
  }
});

// ── B14-P3: Proposal + SOW Generator ────────────────────────────

import {
  ProposalService,
  fillTemplate,
} from '../onboarding/proposals/ProposalService';

describe('B14-P3 — fillTemplate', () => {
  it('fills known placeholders', () => {
    const { rendered, unfilled } = fillTemplate(
      'Hello {{NAME}}, your project is {{PROJECT}}.',
      { NAME: 'Acme', PROJECT: 'Alpha' },
    );
    expect(rendered).toBe('Hello Acme, your project is Alpha.');
    expect(unfilled).toHaveLength(0);
  });

  it('reports unfilled placeholders', () => {
    const { rendered, unfilled } = fillTemplate(
      '{{A}} and {{B}}',
      { A: 'yes' },
    );
    expect(rendered).toBe('yes and {{B}}');
    expect(unfilled).toEqual(['B']);
  });

  it('handles template with no placeholders', () => {
    const { rendered, unfilled } = fillTemplate('plain text', {});
    expect(rendered).toBe('plain text');
    expect(unfilled).toHaveLength(0);
  });
});

describe('B14-P3 — ProposalService', () => {
  let svc: ProposalService;

  beforeEach(() => {
    svc = new ProposalService();
    svc.registerTemplate({
      name: 'test',
      content: 'For {{CLIENT}}: {{DESCRIPTION}}',
    });
  });

  it('generates a draft proposal', () => {
    const p = svc.generate('test', { CLIENT: 'Acme', DESCRIPTION: 'Work' });
    expect(p.proposalId).toMatch(/^PROP-/);
    expect(p.status).toBe('draft');
    expect(p.renderedContent).toBe('For Acme: Work');
    expect(p.contentHash).toBeTruthy();
  });

  it('errors on unknown template', () => {
    expect(() => svc.generate('nope', {})).toThrow('Template not found');
  });

  it('rejects template without name or content', () => {
    expect(() => svc.registerTemplate({ name: '', content: 'x' })).toThrow();
  });

  it('marks proposal as reviewed', () => {
    const p = svc.generate('test', { CLIENT: 'X', DESCRIPTION: 'Y' });
    const reviewed = svc.markReviewed(p.proposalId, 'reviewer@co.com');
    expect(reviewed.status).toBe('reviewed');
    expect(reviewed.reviewedBy).toBe('reviewer@co.com');
  });

  it('marks reviewed proposal as sent', () => {
    const p = svc.generate('test', { CLIENT: 'X', DESCRIPTION: 'Y' });
    svc.markReviewed(p.proposalId, 'r');
    const sent = svc.markSent(p.proposalId);
    expect(sent.status).toBe('sent');
    expect(sent.sentAt).toBeTruthy();
  });

  it('rejects sending unreviewed proposal', () => {
    const p = svc.generate('test', { CLIENT: 'X', DESCRIPTION: 'Y' });
    expect(() => svc.markSent(p.proposalId)).toThrow('must be reviewed');
  });

  it('records client decision', () => {
    const p = svc.generate('test', { CLIENT: 'X', DESCRIPTION: 'Y' });
    svc.markReviewed(p.proposalId, 'r');
    svc.markSent(p.proposalId);
    const accepted = svc.recordDecision(p.proposalId, 'accepted');
    expect(accepted.status).toBe('accepted');
  });

  it('verifies content integrity', () => {
    const p = svc.generate('test', { CLIENT: 'X', DESCRIPTION: 'Y' });
    expect(svc.verify(p.proposalId).valid).toBe(true);
  });

  it('returns invalid for unknown proposal verify', () => {
    expect(svc.verify('nope').valid).toBe(false);
  });

  it('deterministic hash — same input → same hash', () => {
    const a = svc.generate('test', { CLIENT: 'X', DESCRIPTION: 'Y' });
    const b = svc.generate('test', { CLIENT: 'X', DESCRIPTION: 'Y' });
    expect(a.contentHash).toBe(b.contentHash);
  });

  it('lists proposals with status filter', () => {
    svc.generate('test', { CLIENT: 'A', DESCRIPTION: 'a' });
    const p = svc.generate('test', { CLIENT: 'B', DESCRIPTION: 'b' });
    svc.markReviewed(p.proposalId, 'r');
    expect(svc.list({ status: 'draft' })).toHaveLength(1);
    expect(svc.list({ status: 'reviewed' })).toHaveLength(1);
  });
});

// ── B14-P4: Billing Core ────────────────────────────────────────

import {
  computeLineAmount,
  computeSubtotal,
  computeTotal,
  hashInvoice,
} from '../billing/models/Invoice';
import { BillingLedger } from '../billing/ledger/BillingLedger';
import { LocalManualAdapter } from '../billing/adapters/LocalManualAdapter';

describe('B14-P4 — Invoice model helpers', () => {
  it('computes line amount', () => {
    expect(computeLineAmount(2, 150)).toBe(300);
    expect(computeLineAmount(3, 33.33)).toBe(99.99);
  });

  it('computes subtotal from line items', () => {
    const items = [
      { description: 'A', quantity: 1, unitPrice: 100, amount: 100 },
      { description: 'B', quantity: 2, unitPrice: 50, amount: 100 },
    ];
    expect(computeSubtotal(items)).toBe(200);
  });

  it('computes total with tax', () => {
    expect(computeTotal(200, 20)).toBe(220);
  });
});

describe('B14-P4 — BillingLedger', () => {
  let ledger: BillingLedger;

  beforeEach(() => {
    ledger = new BillingLedger();
  });

  it('creates an invoice in draft status', () => {
    const inv = ledger.createInvoice({
      clientId: 'c1',
      clientName: 'Acme',
      lineItems: [{ description: 'Service', quantity: 10, unitPrice: 150 }],
    });
    expect(inv.invoiceId).toMatch(/^INV-/);
    expect(inv.status).toBe('draft');
    expect(inv.subtotal).toBe(1500);
    expect(inv.total).toBe(1500);
    expect(inv.integrityHash).toBeTruthy();
  });

  it('applies tax rate', () => {
    const inv = ledger.createInvoice({
      clientId: 'c1',
      clientName: 'Acme',
      lineItems: [{ description: 'S', quantity: 1, unitPrice: 1000 }],
      taxRate: 0.1,
    });
    expect(inv.tax).toBe(100);
    expect(inv.total).toBe(1100);
  });

  it('issues a draft invoice', () => {
    const inv = ledger.createInvoice({
      clientId: 'c1',
      clientName: 'Acme',
      lineItems: [{ description: 'S', quantity: 1, unitPrice: 100 }],
    });
    const issued = ledger.issue(inv.invoiceId, 'user', '2026-03-01');
    expect(issued.status).toBe('issued');
    expect(issued.dueDate).toBe('2026-03-01');
  });

  it('records payment', () => {
    const inv = ledger.createInvoice({
      clientId: 'c1',
      clientName: 'Acme',
      lineItems: [{ description: 'S', quantity: 1, unitPrice: 100 }],
    });
    ledger.issue(inv.invoiceId, 'u', '2026-03-01');
    const paid = ledger.recordPayment(inv.invoiceId, 'u');
    expect(paid.status).toBe('paid');
    expect(paid.paidAt).toBeTruthy();
  });

  it('rejects payment on draft', () => {
    const inv = ledger.createInvoice({
      clientId: 'c1',
      clientName: 'Acme',
      lineItems: [{ description: 'S', quantity: 1, unitPrice: 100 }],
    });
    expect(() => ledger.recordPayment(inv.invoiceId, 'u')).toThrow();
  });

  it('voids an invoice with reason', () => {
    const inv = ledger.createInvoice({
      clientId: 'c1',
      clientName: 'Acme',
      lineItems: [{ description: 'S', quantity: 1, unitPrice: 100 }],
    });
    ledger.issue(inv.invoiceId, 'u', '2026-03-01');
    const voided = ledger.void(inv.invoiceId, 'u', 'Client cancelled');
    expect(voided.status).toBe('void');
  });

  it('rejects voiding a paid invoice', () => {
    const inv = ledger.createInvoice({
      clientId: 'c1',
      clientName: 'Acme',
      lineItems: [{ description: 'S', quantity: 1, unitPrice: 100 }],
    });
    ledger.issue(inv.invoiceId, 'u', '2026-03-01');
    ledger.recordPayment(inv.invoiceId, 'u');
    expect(() => ledger.void(inv.invoiceId, 'u', 'reason')).toThrow();
  });

  it('disputes an issued invoice', () => {
    const inv = ledger.createInvoice({
      clientId: 'c1',
      clientName: 'Acme',
      lineItems: [{ description: 'S', quantity: 1, unitPrice: 100 }],
    });
    ledger.issue(inv.invoiceId, 'u', '2026-03-01');
    const disputed = ledger.dispute(inv.invoiceId, 'u', 'Incorrect amount');
    expect(disputed.status).toBe('disputed');
  });

  it('maintains append-only ledger entries', () => {
    const inv = ledger.createInvoice({
      clientId: 'c1',
      clientName: 'Acme',
      lineItems: [{ description: 'S', quantity: 1, unitPrice: 100 }],
    });
    ledger.issue(inv.invoiceId, 'u', '2026-03-01');
    ledger.recordPayment(inv.invoiceId, 'u');

    const entries = ledger.getEntries(inv.invoiceId);
    expect(entries).toHaveLength(3);
    expect(entries[0].action).toBe('invoice.created');
    expect(entries[1].action).toBe('invoice.issued');
    expect(entries[2].action).toBe('invoice.paid');
  });

  it('verifies ledger integrity', () => {
    ledger.createInvoice({
      clientId: 'c1',
      clientName: 'Acme',
      lineItems: [{ description: 'S', quantity: 1, unitPrice: 100 }],
    });
    const result = ledger.verifyLedger();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('lists invoices with filters', () => {
    ledger.createInvoice({
      clientId: 'c1',
      clientName: 'A',
      lineItems: [{ description: 'S', quantity: 1, unitPrice: 100 }],
    });
    const inv2 = ledger.createInvoice({
      clientId: 'c2',
      clientName: 'B',
      lineItems: [{ description: 'S', quantity: 1, unitPrice: 200 }],
    });
    ledger.issue(inv2.invoiceId, 'u', '2026-03-01');

    expect(ledger.list({ status: 'draft' })).toHaveLength(1);
    expect(ledger.list({ clientId: 'c2' })).toHaveLength(1);
  });
});

describe('B14-P4 — LocalManualAdapter', () => {
  it('processes a payment', async () => {
    const adapter = new LocalManualAdapter();
    const result = await adapter.processPayment({
      invoiceId: 'INV-test',
      amount: 500,
      currency: 'USD',
      method: 'check',
    });
    expect(result.success).toBe(true);
    expect(result.transactionId).toMatch(/^TXN-/);
    expect(result.amount).toBe(500);
  });

  it('reports healthy', async () => {
    const adapter = new LocalManualAdapter();
    const health = await adapter.healthCheck();
    expect(health.healthy).toBe(true);
  });

  it('records transactions', async () => {
    const adapter = new LocalManualAdapter();
    await adapter.processPayment({
      invoiceId: 'INV-1',
      amount: 100,
      currency: 'USD',
      method: 'manual',
    });
    expect(adapter.getTransactions()).toHaveLength(1);
  });
});
