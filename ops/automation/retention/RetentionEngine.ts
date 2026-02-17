/**
 * B14-P6 — Retention & Referral Automation
 *
 * Rule-driven engine for post-engagement retention touchpoints
 * and referral tracking. Rules are loaded from JSON and evaluated
 * deterministically — no hidden inference.
 *
 * All rule firings and referral events are auditable.
 */

import { createHash } from 'crypto';

// ── Types ───────────────────────────────────────────────────────

export type RuleTrigger =
  | 'engagement_complete'
  | 'days_since_delivery'
  | 'referral_submitted'
  | 'invoice_paid';

export type RuleAction =
  | 'send_satisfaction_survey'
  | 'send_retention_email'
  | 'schedule_check_in'
  | 'create_referral_credit'
  | 'send_thank_you';

export interface RetentionRule {
  ruleId: string;
  trigger: RuleTrigger;
  condition?: { daysSince?: number; minEngagements?: number };
  action: RuleAction;
  templateId?: string;
  enabled: boolean;
}

export interface RetentionRuleSet {
  version: string;
  rules: RetentionRule[];
}

export interface RuleFiring {
  firingId: string;
  ruleId: string;
  clientId: string;
  trigger: RuleTrigger;
  action: RuleAction;
  firedAt: string;
  templateId?: string;
}

export type ReferralStatus = 'submitted' | 'verified' | 'credited' | 'expired';

export interface Referral {
  referralId: string;
  referrerId: string;
  referredName: string;
  referredEmail: string;
  status: ReferralStatus;
  submittedAt: string;
  verifiedAt?: string;
  creditedAt?: string;
  expiredAt?: string;
  creditAmount?: number;
  integrityHash: string;
}

// ── Helpers ─────────────────────────────────────────────────────

function generateId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${ts}-${rand}`;
}

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

// ── Retention Engine ────────────────────────────────────────────

export class RetentionEngine {
  private rules: RetentionRule[] = [];
  private firings: RuleFiring[] = [];

  loadRules(ruleSet: RetentionRuleSet): void {
    if (!ruleSet.version || !Array.isArray(ruleSet.rules)) {
      throw new Error('Invalid rule set: missing version or rules');
    }
    for (const rule of ruleSet.rules) {
      if (!rule.ruleId || !rule.trigger || !rule.action) {
        throw new Error(`Invalid rule: missing required fields (${rule.ruleId ?? 'unknown'})`);
      }
    }
    this.rules = [...ruleSet.rules];
  }

  getRules(): RetentionRule[] {
    return [...this.rules];
  }

  /**
   * Evaluate which rules fire for a given trigger context.
   * Returns fired rules — caller is responsible for executing actions.
   */
  evaluate(params: {
    clientId: string;
    trigger: RuleTrigger;
    daysSince?: number;
    engagementCount?: number;
  }): RuleFiring[] {
    const fired: RuleFiring[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      if (rule.trigger !== params.trigger) continue;

      // Check optional conditions
      if (rule.condition?.daysSince !== undefined) {
        if (params.daysSince === undefined || params.daysSince < rule.condition.daysSince) {
          continue;
        }
      }
      if (rule.condition?.minEngagements !== undefined) {
        if (
          params.engagementCount === undefined ||
          params.engagementCount < rule.condition.minEngagements
        ) {
          continue;
        }
      }

      const firing: RuleFiring = {
        firingId: generateId('RF'),
        ruleId: rule.ruleId,
        clientId: params.clientId,
        trigger: params.trigger,
        action: rule.action,
        firedAt: new Date().toISOString(),
        templateId: rule.templateId,
      };
      fired.push(firing);
      this.firings.push(firing);
    }

    return fired;
  }

  getFirings(clientId?: string): RuleFiring[] {
    if (clientId) return this.firings.filter((f) => f.clientId === clientId);
    return [...this.firings];
  }

  _reset(): void {
    this.rules = [];
    this.firings = [];
  }
}

// ── Referral Service ────────────────────────────────────────────

export class ReferralService {
  private referrals: Map<string, Referral> = new Map();

  submit(params: {
    referrerId: string;
    referredName: string;
    referredEmail: string;
  }): Referral {
    if (!params.referrerId || !params.referredName || !params.referredEmail) {
      throw new Error('Referral requires referrerId, referredName, and referredEmail');
    }

    const referralId = generateId('REF');
    const now = new Date().toISOString();
    const hashPayload = JSON.stringify({
      referralId,
      referrerId: params.referrerId,
      referredEmail: params.referredEmail,
      submittedAt: now,
    });

    const referral: Referral = {
      referralId,
      referrerId: params.referrerId,
      referredName: params.referredName,
      referredEmail: params.referredEmail,
      status: 'submitted',
      submittedAt: now,
      integrityHash: sha256(hashPayload),
    };

    this.referrals.set(referralId, referral);
    return referral;
  }

  verify(referralId: string): Referral {
    const ref = this.getOrThrow(referralId);
    if (ref.status !== 'submitted') {
      throw new Error(`Cannot verify referral in status: ${ref.status}`);
    }
    ref.status = 'verified';
    ref.verifiedAt = new Date().toISOString();
    return ref;
  }

  credit(referralId: string, amount: number): Referral {
    const ref = this.getOrThrow(referralId);
    if (ref.status !== 'verified') {
      throw new Error('Referral must be verified before crediting');
    }
    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }
    ref.status = 'credited';
    ref.creditedAt = new Date().toISOString();
    ref.creditAmount = amount;
    return ref;
  }

  expire(referralId: string): Referral {
    const ref = this.getOrThrow(referralId);
    if (ref.status === 'credited') {
      throw new Error('Cannot expire a credited referral');
    }
    ref.status = 'expired';
    ref.expiredAt = new Date().toISOString();
    return ref;
  }

  get(referralId: string): Referral | undefined {
    return this.referrals.get(referralId);
  }

  list(filter?: { referrerId?: string; status?: ReferralStatus }): Referral[] {
    let results = Array.from(this.referrals.values());
    if (filter?.referrerId) {
      results = results.filter((r) => r.referrerId === filter.referrerId);
    }
    if (filter?.status) {
      results = results.filter((r) => r.status === filter.status);
    }
    return results;
  }

  verifyIntegrity(referralId: string): { valid: boolean; reason?: string } {
    const ref = this.referrals.get(referralId);
    if (!ref) return { valid: false, reason: 'Referral not found' };

    const payload = JSON.stringify({
      referralId: ref.referralId,
      referrerId: ref.referrerId,
      referredEmail: ref.referredEmail,
      submittedAt: ref.submittedAt,
    });
    const expected = sha256(payload);
    if (ref.integrityHash !== expected) {
      return { valid: false, reason: 'Integrity hash mismatch' };
    }
    return { valid: true };
  }

  private getOrThrow(referralId: string): Referral {
    const ref = this.referrals.get(referralId);
    if (!ref) throw new Error(`Referral not found: ${referralId}`);
    return ref;
  }

  _reset(): void {
    this.referrals.clear();
  }
}
