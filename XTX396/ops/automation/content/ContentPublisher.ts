/**
 * B14-P7 — Confidence Builder Publishing Hooks
 *
 * Content publishing service for trust-building artifacts:
 * case studies, testimonials, capability briefs, compliance badges.
 *
 * All content goes through a review lifecycle before publishing.
 * Content hashes ensure integrity.
 */

import { createHash } from 'crypto';

// ── Types ───────────────────────────────────────────────────────

export type ContentType =
  | 'case_study'
  | 'testimonial'
  | 'capability_brief'
  | 'compliance_badge'
  | 'whitepaper';

export type ContentStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'archived';

export interface ContentRequest {
  type: ContentType;
  title: string;
  body: string;
  author: string;
  clientId?: string;
  tags?: string[];
}

export interface ContentRecord {
  contentId: string;
  type: ContentType;
  title: string;
  body: string;
  author: string;
  clientId?: string;
  tags: string[];
  status: ContentStatus;
  contentHash: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  publishedAt?: string;
  archivedAt?: string;
}

// ── Helpers ─────────────────────────────────────────────────────

function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `CB-${ts}-${rand}`;
}

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function hashContent(record: { contentId: string; title: string; body: string; createdAt: string }): string {
  return sha256(JSON.stringify({
    contentId: record.contentId,
    title: record.title,
    body: record.body,
    createdAt: record.createdAt,
  }));
}

// ── Request Validation ──────────────────────────────────────────

const VALID_TYPES: ContentType[] = [
  'case_study',
  'testimonial',
  'capability_brief',
  'compliance_badge',
  'whitepaper',
];

export function validateRequest(req: ContentRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!req.type || !VALID_TYPES.includes(req.type)) {
    errors.push(`Invalid content type: ${req.type}`);
  }
  if (!req.title || req.title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (!req.body || req.body.trim().length === 0) {
    errors.push('Body is required');
  }
  if (!req.author || req.author.trim().length === 0) {
    errors.push('Author is required');
  }

  return { valid: errors.length === 0, errors };
}

// ── Content Publishing Service ──────────────────────────────────

export class ContentPublisher {
  private records: Map<string, ContentRecord> = new Map();

  /**
   * Create a new content record in draft status.
   */
  create(req: ContentRequest): ContentRecord {
    const validation = validateRequest(req);
    if (!validation.valid) {
      throw new Error(`Invalid content request: ${validation.errors.join('; ')}`);
    }

    const contentId = generateId();
    const now = new Date().toISOString();

    const record: ContentRecord = {
      contentId,
      type: req.type,
      title: req.title,
      body: req.body,
      author: req.author,
      clientId: req.clientId,
      tags: req.tags ?? [],
      status: 'draft',
      contentHash: hashContent({ contentId, title: req.title, body: req.body, createdAt: now }),
      createdAt: now,
    };

    this.records.set(contentId, record);
    return record;
  }

  /**
   * Submit content for review.
   */
  submitForReview(contentId: string): ContentRecord {
    const record = this.getOrThrow(contentId);
    if (record.status !== 'draft') {
      throw new Error(`Cannot submit for review in status: ${record.status}`);
    }
    record.status = 'in_review';
    return record;
  }

  /**
   * Approve content after review.
   */
  approve(contentId: string, reviewer: string): ContentRecord {
    const record = this.getOrThrow(contentId);
    if (record.status !== 'in_review') {
      throw new Error(`Cannot approve in status: ${record.status}`);
    }
    if (!reviewer) {
      throw new Error('Reviewer identity is required');
    }
    record.status = 'approved';
    record.reviewedAt = new Date().toISOString();
    record.reviewedBy = reviewer;
    return record;
  }

  /**
   * Publish approved content.
   */
  publish(contentId: string): ContentRecord {
    const record = this.getOrThrow(contentId);
    if (record.status !== 'approved') {
      throw new Error('Content must be approved before publishing');
    }
    record.status = 'published';
    record.publishedAt = new Date().toISOString();
    return record;
  }

  /**
   * Archive content (remove from public display).
   */
  archive(contentId: string): ContentRecord {
    const record = this.getOrThrow(contentId);
    if (record.status !== 'published') {
      throw new Error('Only published content can be archived');
    }
    record.status = 'archived';
    record.archivedAt = new Date().toISOString();
    return record;
  }

  /**
   * Verify content integrity against stored hash.
   */
  verifyIntegrity(contentId: string): { valid: boolean; reason?: string } {
    const record = this.records.get(contentId);
    if (!record) return { valid: false, reason: 'Content not found' };

    const expected = hashContent({
      contentId: record.contentId,
      title: record.title,
      body: record.body,
      createdAt: record.createdAt,
    });

    if (record.contentHash !== expected) {
      return { valid: false, reason: 'Content hash mismatch' };
    }
    return { valid: true };
  }

  get(contentId: string): ContentRecord | undefined {
    return this.records.get(contentId);
  }

  list(filter?: {
    type?: ContentType;
    status?: ContentStatus;
    clientId?: string;
  }): ContentRecord[] {
    let results = Array.from(this.records.values());
    if (filter?.type) results = results.filter((r) => r.type === filter.type);
    if (filter?.status) results = results.filter((r) => r.status === filter.status);
    if (filter?.clientId) results = results.filter((r) => r.clientId === filter.clientId);
    return results;
  }

  private getOrThrow(contentId: string): ContentRecord {
    const record = this.records.get(contentId);
    if (!record) throw new Error(`Content not found: ${contentId}`);
    return record;
  }

  _reset(): void {
    this.records.clear();
  }
}
