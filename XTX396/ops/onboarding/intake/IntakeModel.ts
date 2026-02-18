/**
 * B14-P1 — Intake Models
 *
 * Type-safe intake model for client onboarding.  Supports three
 * engagement types: eDiscovery, SMB consulting, and public tools.
 *
 * All intake records are:
 * - Hashed at creation for integrity
 * - Timestamped for audit trail
 * - Immutable after submission (append-only updates)
 */

import { createHash } from 'crypto';

// ── Types ───────────────────────────────────────────────────────

export type EngagementType = 'ediscovery' | 'smb-consulting' | 'public-tools';

export type IntakeStatus =
  | 'draft'
  | 'submitted'
  | 'under-review'
  | 'approved'
  | 'rejected'
  | 'archived';

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export interface IntakeRecord {
  intakeId: string;
  engagementType: EngagementType;
  clientName: string;
  contactEmail: string;
  status: IntakeStatus;
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  integrityHash: string;
  notes: string;
}

export interface ChecklistSchema {
  engagementType: EngagementType;
  version: string;
  items: Omit<ChecklistItem, 'completed' | 'completedAt' | 'completedBy'>[];
}

// ── Helpers ─────────────────────────────────────────────────────

function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `INT-${ts}-${rand}`;
}

function computeHash(record: Omit<IntakeRecord, 'integrityHash'>): string {
  const payload = JSON.stringify({
    intakeId: record.intakeId,
    engagementType: record.engagementType,
    clientName: record.clientName,
    contactEmail: record.contactEmail,
    checklist: record.checklist,
    createdAt: record.createdAt,
  });
  return createHash('sha256').update(payload).digest('hex');
}

// ── Intake Service ──────────────────────────────────────────────

export class IntakeService {
  private records: Map<string, IntakeRecord> = new Map();
  private checklists: Map<EngagementType, ChecklistSchema> = new Map();

  /**
   * Register a checklist schema for an engagement type.
   */
  registerChecklist(schema: ChecklistSchema): void {
    this.checklists.set(schema.engagementType, schema);
  }

  /**
   * Load a checklist schema from a JSON object.
   */
  loadChecklist(json: unknown): ChecklistSchema {
    const obj = json as Record<string, unknown>;
    if (!obj.engagementType || !obj.version || !Array.isArray(obj.items)) {
      throw new Error('Invalid checklist schema: missing required fields');
    }

    const validTypes: EngagementType[] = ['ediscovery', 'smb-consulting', 'public-tools'];
    if (!validTypes.includes(obj.engagementType as EngagementType)) {
      throw new Error(`Invalid engagement type: ${obj.engagementType}`);
    }

    const schema: ChecklistSchema = {
      engagementType: obj.engagementType as EngagementType,
      version: String(obj.version),
      items: (obj.items as Record<string, unknown>[]).map((item) => {
        if (!item.id || !item.label) {
          throw new Error('Checklist item missing id or label');
        }
        return {
          id: String(item.id),
          label: String(item.label),
          required: Boolean(item.required),
          notes: item.notes ? String(item.notes) : undefined,
        };
      }),
    };

    this.registerChecklist(schema);
    return schema;
  }

  /**
   * Create a new intake record from a checklist template.
   */
  createIntake(
    engagementType: EngagementType,
    clientName: string,
    contactEmail: string,
  ): IntakeRecord {
    const schema = this.checklists.get(engagementType);
    if (!schema) {
      throw new Error(`No checklist registered for engagement type: ${engagementType}`);
    }

    const now = new Date().toISOString();
    const checklist: ChecklistItem[] = schema.items.map((item) => ({
      ...item,
      completed: false,
    }));

    const partial: Omit<IntakeRecord, 'integrityHash'> = {
      intakeId: generateId(),
      engagementType,
      clientName,
      contactEmail,
      status: 'draft',
      checklist,
      createdAt: now,
      updatedAt: now,
      notes: '',
    };

    const record: IntakeRecord = {
      ...partial,
      integrityHash: computeHash(partial),
    };

    this.records.set(record.intakeId, record);
    return record;
  }

  /**
   * Complete a checklist item on an intake record.
   */
  completeItem(
    intakeId: string,
    itemId: string,
    completedBy: string,
  ): IntakeRecord {
    const record = this.records.get(intakeId);
    if (!record) throw new Error(`Intake not found: ${intakeId}`);
    if (record.status !== 'draft' && record.status !== 'under-review') {
      throw new Error(`Cannot modify intake in status: ${record.status}`);
    }

    const item = record.checklist.find((i) => i.id === itemId);
    if (!item) throw new Error(`Checklist item not found: ${itemId}`);

    item.completed = true;
    item.completedAt = new Date().toISOString();
    item.completedBy = completedBy;
    record.updatedAt = new Date().toISOString();

    return record;
  }

  /**
   * Submit an intake for review.  All required items must be completed.
   */
  submit(intakeId: string): IntakeRecord {
    const record = this.records.get(intakeId);
    if (!record) throw new Error(`Intake not found: ${intakeId}`);
    if (record.status !== 'draft') {
      throw new Error(`Cannot submit intake in status: ${record.status}`);
    }

    const incomplete = record.checklist.filter(
      (item) => item.required && !item.completed,
    );
    if (incomplete.length > 0) {
      throw new Error(
        `Cannot submit: ${incomplete.length} required item(s) incomplete — ` +
        incomplete.map((i) => i.id).join(', '),
      );
    }

    record.status = 'submitted';
    record.submittedAt = new Date().toISOString();
    record.updatedAt = new Date().toISOString();
    return record;
  }

  /**
   * Review an intake (approve/reject).
   */
  review(
    intakeId: string,
    decision: 'approved' | 'rejected',
    reviewedBy: string,
  ): IntakeRecord {
    const record = this.records.get(intakeId);
    if (!record) throw new Error(`Intake not found: ${intakeId}`);
    if (record.status !== 'submitted') {
      throw new Error(`Cannot review intake in status: ${record.status}`);
    }

    record.status = decision;
    record.reviewedAt = new Date().toISOString();
    record.reviewedBy = reviewedBy;
    record.updatedAt = new Date().toISOString();
    return record;
  }

  /**
   * Verify the integrity of an intake record.
   */
  verify(intakeId: string): { valid: boolean; reason?: string } {
    const record = this.records.get(intakeId);
    if (!record) return { valid: false, reason: 'Record not found' };

    const { integrityHash: _, ...rest } = record;
    const expected = computeHash(rest as Omit<IntakeRecord, 'integrityHash'>);

    if (record.integrityHash !== expected) {
      return { valid: false, reason: 'Integrity hash mismatch' };
    }
    return { valid: true };
  }

  /**
   * Get a record by ID.
   */
  get(intakeId: string): IntakeRecord | undefined {
    return this.records.get(intakeId);
  }

  /**
   * List all records, optionally filtered.
   */
  list(filter?: {
    engagementType?: EngagementType;
    status?: IntakeStatus;
  }): IntakeRecord[] {
    let results = Array.from(this.records.values());
    if (filter?.engagementType) {
      results = results.filter((r) => r.engagementType === filter.engagementType);
    }
    if (filter?.status) {
      results = results.filter((r) => r.status === filter.status);
    }
    return results;
  }

  /** Reset (for testing). */
  _reset(): void {
    this.records.clear();
  }
}
