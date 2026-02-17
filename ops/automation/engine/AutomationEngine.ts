// B11 – Operations + Growth Automation Layer
// B11-05 — Follow-up Automations Engine

import type { Lead } from '../leads/LeadModel';
import { getOpsAuditLogger } from '../audit/OpsAuditLogger';

// ─── Rule Definition ─────────────────────────────────────────────

export type AutomationTrigger =
  | 'lead.created'
  | 'lead.status_changed'
  | 'schedule.daily'
  | 'schedule.hourly'
  | 'manual';

export type AutomationActionType =
  | 'send_email'
  | 'send_sms'
  | 'update_lead_status'
  | 'push_to_crm'
  | 'notify_operator'
  | 'custom';

export interface AutomationCondition {
  /** Field on the lead to evaluate. */
  field: keyof Lead;
  /** Comparison operator. */
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt';
  /** Value to compare against. */
  value: unknown;
}

export interface AutomationAction {
  type: AutomationActionType;
  /** Action-specific configuration. */
  config: Record<string, unknown>;
}

export interface AutomationRule {
  /** Unique rule ID. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** What event triggers this rule. */
  trigger: AutomationTrigger;
  /** Conditions that must all be true for the rule to fire. */
  conditions: AutomationCondition[];
  /** Actions to execute (in order) when triggered. */
  actions: AutomationAction[];
  /** Whether the rule is active. */
  enabled: boolean;
  /** Delay before executing (milliseconds, 0 = immediate). */
  delayMs: number;
  /** Maximum number of times this rule can fire per lead. */
  maxExecutionsPerLead: number;
  /** ISO 8601 — when the rule was created. */
  createdAt: string;
  /** ISO 8601 — last modification. */
  updatedAt: string;
}

export type AutomationRuleInput = Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>;

// ─── Execution Record ────────────────────────────────────────────

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface AutomationExecution {
  id: string;
  ruleId: string;
  leadId: string;
  status: ExecutionStatus;
  triggeredAt: string;
  completedAt?: string;
  results: Array<{
    actionType: AutomationActionType;
    success: boolean;
    detail?: string;
  }>;
  error?: string;
}

// ─── Condition Evaluator ─────────────────────────────────────────

export function evaluateConditions(lead: Lead, conditions: AutomationCondition[]): boolean {
  return conditions.every((cond) => {
    const fieldValue = lead[cond.field];

    switch (cond.operator) {
      case 'eq':
        return fieldValue === cond.value;
      case 'neq':
        return fieldValue !== cond.value;
      case 'contains':
        if (typeof fieldValue === 'string') return fieldValue.includes(String(cond.value));
        if (Array.isArray(fieldValue)) return fieldValue.includes(cond.value);
        return false;
      case 'gt':
        return typeof fieldValue === 'number' && fieldValue > Number(cond.value);
      case 'lt':
        return typeof fieldValue === 'number' && fieldValue < Number(cond.value);
      default:
        return false;
    }
  });
}

// ─── Action Executor (pluggable) ─────────────────────────────────

export type ActionHandler = (
  action: AutomationAction,
  lead: Lead,
  safeMode: boolean,
) => Promise<{ success: boolean; detail?: string }>;

const actionHandlers = new Map<AutomationActionType, ActionHandler>();

/** Register a handler for an action type. */
export function registerActionHandler(type: AutomationActionType, handler: ActionHandler): void {
  actionHandlers.set(type, handler);
}

/** Default stub handler — logs intent but takes no external action. */
async function stubHandler(
  action: AutomationAction,
  lead: Lead,
  safeMode: boolean,
): Promise<{ success: boolean; detail?: string }> {
  const detail = safeMode
    ? `[SAFE] Stub action ${action.type} for lead ${lead.id}`
    : `[LIVE] Stub action ${action.type} for lead ${lead.id}`;
  return { success: true, detail };
}

// ─── Automation Engine ───────────────────────────────────────────

export class AutomationEngine {
  private rules = new Map<string, AutomationRule>();
  private executions: AutomationExecution[] = [];
  private executionCounts = new Map<string, number>(); // key: `${ruleId}:${leadId}`
  private safeMode: boolean;

  constructor(safeMode = true) {
    this.safeMode = safeMode;
  }

  setSafeMode(enabled: boolean): void {
    this.safeMode = enabled;
  }

  // ── Rule management ──

  addRule(input: AutomationRuleInput): AutomationRule {
    const now = new Date().toISOString();
    const rule: AutomationRule = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.rules.set(rule.id, rule);

    getOpsAuditLogger().log({
      category: 'automation.rule_created',
      severity: 'info',
      actor: 'system',
      description: `Automation rule created: ${rule.name}`,
      payload: { ruleId: rule.id, trigger: rule.trigger },
    });

    return { ...rule };
  }

  updateRule(id: string, patch: Partial<AutomationRuleInput>): AutomationRule {
    const existing = this.rules.get(id);
    if (!existing) throw new Error(`Rule not found: ${id}`);

    const updated: AutomationRule = {
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.rules.set(id, updated);

    getOpsAuditLogger().log({
      category: 'automation.rule_updated',
      severity: 'info',
      actor: 'system',
      description: `Automation rule updated: ${updated.name}`,
      payload: { ruleId: id, changes: Object.keys(patch) },
    });

    return { ...updated };
  }

  toggleRule(id: string, enabled: boolean): AutomationRule {
    const rule = this.rules.get(id);
    if (!rule) throw new Error(`Rule not found: ${id}`);

    rule.enabled = enabled;
    rule.updatedAt = new Date().toISOString();

    getOpsAuditLogger().log({
      category: 'automation.rule_toggled',
      severity: 'info',
      actor: 'system',
      description: `Automation rule ${enabled ? 'enabled' : 'disabled'}: ${rule.name}`,
      payload: { ruleId: id, enabled },
    });

    return { ...rule };
  }

  getRules(): AutomationRule[] {
    return Array.from(this.rules.values()).map((r) => ({ ...r }));
  }

  getRule(id: string): AutomationRule | null {
    const rule = this.rules.get(id);
    return rule ? { ...rule } : null;
  }

  // ── Execution ──

  /**
   * Evaluate and execute all matching rules for a given trigger and lead.
   * Respects consent flags: skips send_email/send_sms if consentFollowUp is false.
   */
  async execute(trigger: AutomationTrigger, lead: Lead): Promise<AutomationExecution[]> {
    const results: AutomationExecution[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      if (rule.trigger !== trigger) continue;
      if (!evaluateConditions(lead, rule.conditions)) continue;

      // Max executions check
      const countKey = `${rule.id}:${lead.id}`;
      const currentCount = this.executionCounts.get(countKey) ?? 0;
      if (rule.maxExecutionsPerLead > 0 && currentCount >= rule.maxExecutionsPerLead) {
        continue;
      }

      const execution = await this.executeRule(rule, lead);
      results.push(execution);

      this.executionCounts.set(countKey, currentCount + 1);
    }

    return results;
  }

  private async executeRule(rule: AutomationRule, lead: Lead): Promise<AutomationExecution> {
    const execution: AutomationExecution = {
      id: crypto.randomUUID(),
      ruleId: rule.id,
      leadId: lead.id,
      status: 'running',
      triggeredAt: new Date().toISOString(),
      results: [],
    };

    await getOpsAuditLogger().log({
      category: 'automation.execution_started',
      severity: 'info',
      actor: 'system',
      description: `Automation started: ${rule.name} for lead ${lead.id}`,
      payload: { ruleId: rule.id, leadId: lead.id, executionId: execution.id },
    });

    try {
      for (const action of rule.actions) {
        // Consent check for messaging actions
        if (
          (action.type === 'send_email' || action.type === 'send_sms') &&
          !lead.consentFollowUp
        ) {
          execution.results.push({
            actionType: action.type,
            success: false,
            detail: 'Skipped: lead has not consented to follow-up.',
          });
          continue;
        }

        const handler = actionHandlers.get(action.type) ?? stubHandler;
        const result = await handler(action, lead, this.safeMode);
        execution.results.push({
          actionType: action.type,
          success: result.success,
          detail: result.detail,
        });

        if (!result.success) {
          execution.status = 'failed';
          execution.error = result.detail ?? 'Action failed.';
          break;
        }
      }

      if (execution.status !== 'failed') {
        execution.status = 'completed';
      }
    } catch (err) {
      execution.status = 'failed';
      execution.error = err instanceof Error ? err.message : 'Unknown error';
    }

    execution.completedAt = new Date().toISOString();
    this.executions.push(execution);

    await getOpsAuditLogger().log({
      category: execution.status === 'completed'
        ? 'automation.execution_completed'
        : 'automation.execution_failed',
      severity: execution.status === 'completed' ? 'info' : 'warn',
      actor: 'system',
      description: `Automation ${execution.status}: ${rule.name} for lead ${lead.id}`,
      payload: {
        ruleId: rule.id, leadId: lead.id,
        executionId: execution.id, status: execution.status,
        actionResults: execution.results.length,
      },
    });

    return execution;
  }

  getExecutions(filter?: { ruleId?: string; leadId?: string }): AutomationExecution[] {
    let results = [...this.executions];
    if (filter?.ruleId) results = results.filter((e) => e.ruleId === filter.ruleId);
    if (filter?.leadId) results = results.filter((e) => e.leadId === filter.leadId);
    return results.sort((a, b) =>
      new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime(),
    );
  }
}

// ─── Singleton ───────────────────────────────────────────────────

let _engine: AutomationEngine | null = null;

export function getAutomationEngine(safeMode = true): AutomationEngine {
  if (!_engine) {
    _engine = new AutomationEngine(safeMode);
  }
  return _engine;
}

export function resetAutomationEngine(): void {
  _engine = null;
}
