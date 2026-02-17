/**
 * B14-P3 — Proposal + SOW Generator
 *
 * Draft-first proposal generation with deterministic hashing and audit trail.
 * Templates are filled with engagement-specific values and hashed for integrity.
 *
 * This service produces DRAFT documents only — human review is mandatory
 * before any proposal is delivered to a client.
 */

import { createHash } from 'crypto';

// ── Types ───────────────────────────────────────────────────────

export type ProposalStatus = 'draft' | 'reviewed' | 'sent' | 'accepted' | 'declined' | 'expired';

export interface ProposalValues {
  [key: string]: string;
}

export interface ProposalRecord {
  proposalId: string;
  templateName: string;
  values: ProposalValues;
  renderedContent: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  contentHash: string;
  reviewedBy?: string;
  reviewedAt?: string;
  sentAt?: string;
}

export interface ProposalTemplate {
  name: string;
  content: string;
}

// ── Helpers ─────────────────────────────────────────────────────

function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `PROP-${ts}-${rand}`;
}

function hashContent(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}

// ── Template Engine (deterministic, no external deps) ───────────

/**
 * Fill a template string by replacing {{PLACEHOLDER}} with values.
 * Returns the rendered content and a list of unfilled placeholders.
 */
export function fillTemplate(
  template: string,
  values: ProposalValues,
): { rendered: string; unfilled: string[] } {
  const unfilled: string[] = [];
  const rendered = template.replace(/\{\{([A-Z_0-9]+)\}\}/g, (match, key: string) => {
    if (key in values) {
      return values[key];
    }
    unfilled.push(key);
    return match; // leave unfilled placeholders in place
  });
  return { rendered, unfilled };
}

// ── Proposal Service ────────────────────────────────────────────

export class ProposalService {
  private templates: Map<string, ProposalTemplate> = new Map();
  private proposals: Map<string, ProposalRecord> = new Map();

  /**
   * Register a template for use in proposal generation.
   */
  registerTemplate(template: ProposalTemplate): void {
    if (!template.name || !template.content) {
      throw new Error('Template must have name and content');
    }
    this.templates.set(template.name, template);
  }

  /**
   * Generate a draft proposal from a registered template.
   */
  generate(templateName: string, values: ProposalValues): ProposalRecord {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    const { rendered } = fillTemplate(template.content, values);
    const now = new Date().toISOString();

    const record: ProposalRecord = {
      proposalId: generateId(),
      templateName,
      values: { ...values },
      renderedContent: rendered,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      contentHash: hashContent(rendered),
    };

    this.proposals.set(record.proposalId, record);
    return record;
  }

  /**
   * Mark a proposal as reviewed.
   */
  markReviewed(proposalId: string, reviewedBy: string): ProposalRecord {
    const record = this.proposals.get(proposalId);
    if (!record) throw new Error(`Proposal not found: ${proposalId}`);
    if (record.status !== 'draft') {
      throw new Error(`Cannot review proposal in status: ${record.status}`);
    }

    record.status = 'reviewed';
    record.reviewedBy = reviewedBy;
    record.reviewedAt = new Date().toISOString();
    record.updatedAt = new Date().toISOString();
    return record;
  }

  /**
   * Mark a reviewed proposal as sent to client.
   */
  markSent(proposalId: string): ProposalRecord {
    const record = this.proposals.get(proposalId);
    if (!record) throw new Error(`Proposal not found: ${proposalId}`);
    if (record.status !== 'reviewed') {
      throw new Error('Proposal must be reviewed before sending');
    }

    record.status = 'sent';
    record.sentAt = new Date().toISOString();
    record.updatedAt = new Date().toISOString();
    return record;
  }

  /**
   * Record client decision.
   */
  recordDecision(
    proposalId: string,
    decision: 'accepted' | 'declined',
  ): ProposalRecord {
    const record = this.proposals.get(proposalId);
    if (!record) throw new Error(`Proposal not found: ${proposalId}`);
    if (record.status !== 'sent') {
      throw new Error('Decision can only be recorded for sent proposals');
    }

    record.status = decision;
    record.updatedAt = new Date().toISOString();
    return record;
  }

  /**
   * Verify content integrity.
   */
  verify(proposalId: string): { valid: boolean; reason?: string } {
    const record = this.proposals.get(proposalId);
    if (!record) return { valid: false, reason: 'Record not found' };

    const expected = hashContent(record.renderedContent);
    if (record.contentHash !== expected) {
      return { valid: false, reason: 'Content hash mismatch' };
    }
    return { valid: true };
  }

  get(proposalId: string): ProposalRecord | undefined {
    return this.proposals.get(proposalId);
  }

  list(filter?: { status?: ProposalStatus }): ProposalRecord[] {
    let results = Array.from(this.proposals.values());
    if (filter?.status) {
      results = results.filter((r) => r.status === filter.status);
    }
    return results;
  }

  /** Reset (for testing). */
  _reset(): void {
    this.proposals.clear();
  }
}
