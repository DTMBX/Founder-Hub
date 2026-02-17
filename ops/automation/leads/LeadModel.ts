// B11 – Operations + Growth Automation Layer
// B11-03 — Lead Model & Repository

import { getOpsAuditLogger } from '../audit/OpsAuditLogger';

// ─── Lead Model ──────────────────────────────────────────────────

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'converted'
  | 'closed';

export type LeadSource =
  | 'website'
  | 'referral'
  | 'organic'
  | 'paid'
  | 'manual'
  | 'api';

export interface Lead {
  /** Unique lead ID (UUID v4). */
  id: string;
  /** Full name of the contact. */
  name: string;
  /** Email address (optional — at least one of email/phone required). */
  email?: string;
  /** Phone number (optional — at least one of email/phone required). */
  phone?: string;
  /** Acquisition source. */
  source: LeadSource;
  /** Free-form message from the lead. */
  message?: string;
  /** Tags for categorization. */
  tags: string[];
  /** Current pipeline status. */
  status: LeadStatus;
  /** ISO 8601 UTC timestamp — when the lead was created. */
  createdAt: string;
  /** ISO 8601 UTC timestamp — last modification. */
  updatedAt: string;
  /** Whether the lead consented to follow-up communications. */
  consentFollowUp: boolean;
  /** Whether the lead consented to data storage. */
  consentDataStorage: boolean;
  /** Optional notes added by operators. */
  notes?: string;
}

export type LeadCreateInput = Omit<Lead, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'tags'> & {
  tags?: string[];
};

export type LeadUpdateInput = Partial<Pick<Lead, 'name' | 'email' | 'phone' | 'source' | 'message' | 'tags' | 'status' | 'consentFollowUp' | 'consentDataStorage' | 'notes'>>;

// ─── Validation ──────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-()]{7,20}$/;

export function validateLeadInput(input: LeadCreateInput): ValidationResult {
  const errors: string[] = [];

  if (!input.name || input.name.trim().length < 1) {
    errors.push('Name is required.');
  }
  if (!input.email && !input.phone) {
    errors.push('At least one of email or phone is required.');
  }
  if (input.email && !EMAIL_RE.test(input.email)) {
    errors.push('Invalid email address format.');
  }
  if (input.phone && !PHONE_RE.test(input.phone)) {
    errors.push('Invalid phone number format.');
  }
  if (!input.consentDataStorage) {
    errors.push('Consent to data storage is required.');
  }

  return { valid: errors.length === 0, errors };
}

// ─── Repository Interface ────────────────────────────────────────

export interface ILeadRepository {
  create(input: LeadCreateInput, actor: string): Promise<Lead>;
  getById(id: string): Promise<Lead | null>;
  getAll(filter?: Partial<Pick<Lead, 'status' | 'source'>>): Promise<Lead[]>;
  update(id: string, patch: LeadUpdateInput, actor: string): Promise<Lead>;
  delete(id: string, actor: string): Promise<void>;
}

// ─── In-Memory Repository ────────────────────────────────────────

export class InMemoryLeadRepository implements ILeadRepository {
  private store = new Map<string, Lead>();

  async create(input: LeadCreateInput, actor: string): Promise<Lead> {
    const validation = validateLeadInput(input);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }

    const now = new Date().toISOString();
    const lead: Lead = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      email: input.email?.trim(),
      phone: input.phone?.trim(),
      source: input.source,
      message: input.message?.trim(),
      tags: input.tags ?? [],
      status: 'new',
      createdAt: now,
      updatedAt: now,
      consentFollowUp: input.consentFollowUp,
      consentDataStorage: input.consentDataStorage,
      notes: input.notes?.trim(),
    };

    this.store.set(lead.id, lead);

    await getOpsAuditLogger().log({
      category: 'lead.created',
      severity: 'info',
      actor,
      description: `Lead created: ${lead.name}`,
      payload: { leadId: lead.id, source: lead.source },
    });

    return { ...lead };
  }

  async getById(id: string): Promise<Lead | null> {
    const lead = this.store.get(id);
    return lead ? { ...lead } : null;
  }

  async getAll(filter?: Partial<Pick<Lead, 'status' | 'source'>>): Promise<Lead[]> {
    let results = Array.from(this.store.values());

    if (filter?.status) {
      results = results.filter((l) => l.status === filter.status);
    }
    if (filter?.source) {
      results = results.filter((l) => l.source === filter.source);
    }

    return results
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((l) => ({ ...l }));
  }

  async update(id: string, patch: LeadUpdateInput, actor: string): Promise<Lead> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Lead not found: ${id}`);

    const oldStatus = existing.status;
    const updated: Lead = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    this.store.set(id, updated);

    const category = patch.status && patch.status !== oldStatus
      ? 'lead.status_changed' as const
      : 'lead.updated' as const;

    await getOpsAuditLogger().log({
      category,
      severity: 'info',
      actor,
      description: `Lead updated: ${updated.name}`,
      payload: {
        leadId: id,
        changes: Object.keys(patch),
        ...(patch.status ? { oldStatus, newStatus: patch.status } : {}),
      },
    });

    return { ...updated };
  }

  async delete(id: string, actor: string): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Lead not found: ${id}`);

    this.store.delete(id);

    await getOpsAuditLogger().log({
      category: 'lead.deleted',
      severity: 'warn',
      actor,
      description: `Lead deleted: ${existing.name}`,
      payload: { leadId: id },
    });
  }
}

// ─── File-based Repository (JSON) ────────────────────────────────

export class JsonFileLeadRepository implements ILeadRepository {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  private async readStore(): Promise<Lead[]> {
    const fs = await import('fs');
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private async writeStore(leads: Lead[]): Promise<void> {
    const fs = await import('fs');
    fs.writeFileSync(this.filePath, JSON.stringify(leads, null, 2), 'utf-8');
  }

  async create(input: LeadCreateInput, actor: string): Promise<Lead> {
    const validation = validateLeadInput(input);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }

    const now = new Date().toISOString();
    const lead: Lead = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      email: input.email?.trim(),
      phone: input.phone?.trim(),
      source: input.source,
      message: input.message?.trim(),
      tags: input.tags ?? [],
      status: 'new',
      createdAt: now,
      updatedAt: now,
      consentFollowUp: input.consentFollowUp,
      consentDataStorage: input.consentDataStorage,
      notes: input.notes?.trim(),
    };

    const store = await this.readStore();
    store.push(lead);
    await this.writeStore(store);

    await getOpsAuditLogger().log({
      category: 'lead.created',
      severity: 'info',
      actor,
      description: `Lead created: ${lead.name}`,
      payload: { leadId: lead.id, source: lead.source },
    });

    return { ...lead };
  }

  async getById(id: string): Promise<Lead | null> {
    const store = await this.readStore();
    const lead = store.find((l) => l.id === id);
    return lead ? { ...lead } : null;
  }

  async getAll(filter?: Partial<Pick<Lead, 'status' | 'source'>>): Promise<Lead[]> {
    let results = await this.readStore();

    if (filter?.status) {
      results = results.filter((l) => l.status === filter.status);
    }
    if (filter?.source) {
      results = results.filter((l) => l.source === filter.source);
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async update(id: string, patch: LeadUpdateInput, actor: string): Promise<Lead> {
    const store = await this.readStore();
    const idx = store.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error(`Lead not found: ${id}`);

    const oldStatus = store[idx].status;
    store[idx] = {
      ...store[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    await this.writeStore(store);

    const category = patch.status && patch.status !== oldStatus
      ? 'lead.status_changed' as const
      : 'lead.updated' as const;

    await getOpsAuditLogger().log({
      category,
      severity: 'info',
      actor,
      description: `Lead updated: ${store[idx].name}`,
      payload: {
        leadId: id,
        changes: Object.keys(patch),
        ...(patch.status ? { oldStatus, newStatus: patch.status } : {}),
      },
    });

    return { ...store[idx] };
  }

  async delete(id: string, actor: string): Promise<void> {
    const store = await this.readStore();
    const idx = store.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error(`Lead not found: ${id}`);

    const name = store[idx].name;
    store.splice(idx, 1);
    await this.writeStore(store);

    await getOpsAuditLogger().log({
      category: 'lead.deleted',
      severity: 'warn',
      actor,
      description: `Lead deleted: ${name}`,
      payload: { leadId: id },
    });
  }
}

// ─── Singleton ───────────────────────────────────────────────────

let _repo: ILeadRepository | null = null;

/** Get the singleton lead repository (defaults to InMemoryLeadRepository). */
export function getLeadRepository(): ILeadRepository {
  if (!_repo) {
    _repo = new InMemoryLeadRepository();
  }
  return _repo;
}

/** Replace the singleton lead repository (use for testing or config-driven switching). */
export function setLeadRepository(repo: ILeadRepository): void {
  _repo = repo;
}
