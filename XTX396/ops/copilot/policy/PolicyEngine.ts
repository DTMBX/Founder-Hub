/**
 * B12-03 — Copilot Policy Engine
 *
 * Converts user intent into a validated execution Plan.
 * Enforces: RBAC, Safe Mode, side-effect gating, confirmation requirements.
 *
 * The Policy Engine does NOT execute commands — it produces a Plan that the
 * RunnerService can execute after user confirmation.
 */

import type { OpsRole } from '../../console/app/lib/rbac';
import type { CommandEntry, CommandRegistry } from '../../runner/commands/validateRegistry';
import { getCommand } from '../../runner/commands/validateRegistry';
import { SafeMode } from '../../core/SafeMode';
import { generateCorrelationId } from '../../core/correlation';
import { getOpsAuditLogger } from '../../automation/audit/OpsAuditLogger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CopilotIntent {
  user_message: string;
  role: OpsRole;
  safe_mode: boolean;
  session_id: string;
  conversation_history?: { role: 'user' | 'assistant' | 'system'; content: string }[];
}

export interface ProposedCommand {
  command_id: string;
  args: Record<string, unknown>;
}

export interface Plan {
  summary: string;
  proposed_commands: ProposedCommand[];
  risk_flags: string[];
  requires_confirmation: boolean;
  reason: string;
  correlationId: string;
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
  risk_flags: string[];
  requires_confirmation: boolean;
}

// ---------------------------------------------------------------------------
// Side-effect classification
// ---------------------------------------------------------------------------

const MUTATING_SIDE_EFFECTS = new Set(['writes_repo', 'deploys', 'network_egress']);
const CONFIRMATION_REQUIRED_SIDE_EFFECTS = new Set(['writes_repo', 'deploys', 'network_egress']);

// ---------------------------------------------------------------------------
// Policy Engine
// ---------------------------------------------------------------------------

export class PolicyEngine {
  private readonly registry: CommandRegistry;

  constructor(registry: CommandRegistry) {
    this.registry = registry;
  }

  /**
   * Evaluate a set of proposed commands against all policy rules.
   * Returns a Plan object indicating what is allowed and what requires confirmation.
   */
  evaluatePlan(
    intent: CopilotIntent,
    proposedCommands: ProposedCommand[],
  ): Plan {
    const correlationId = generateCorrelationId();
    const riskFlags: string[] = [];
    const allowedCommands: ProposedCommand[] = [];
    let requiresConfirmation = false;
    const reasons: string[] = [];

    for (const proposed of proposedCommands) {
      const decision = this.evaluateCommand(proposed, intent);

      if (!decision.allowed) {
        riskFlags.push(...decision.risk_flags);
        reasons.push(decision.reason);
        continue;
      }

      if (decision.requires_confirmation) {
        requiresConfirmation = true;
      }

      riskFlags.push(...decision.risk_flags);
      allowedCommands.push(proposed);
    }

    const summary = allowedCommands.length > 0
      ? `Plan: ${allowedCommands.length} command(s) proposed.`
      : reasons.length > 0
        ? `Blocked: ${reasons.join('; ')}`
        : 'No commands proposed.';

    return {
      summary,
      proposed_commands: allowedCommands,
      risk_flags: [...new Set(riskFlags)],
      requires_confirmation: requiresConfirmation,
      reason: reasons.length > 0 ? reasons.join('; ') : 'All commands permitted.',
      correlationId,
    };
  }

  /**
   * Evaluate a single proposed command against policy rules.
   */
  evaluateCommand(
    proposed: ProposedCommand,
    intent: CopilotIntent,
  ): PolicyDecision {
    const riskFlags: string[] = [];

    // 1. Registry lookup
    const command = getCommand(this.registry, proposed.command_id);
    if (!command) {
      return {
        allowed: false,
        reason: `Command "${proposed.command_id}" is not in the registry.`,
        risk_flags: ['unknown_command'],
        requires_confirmation: false,
      };
    }

    // 2. RBAC enforcement
    if (!command.roles_allowed.includes(intent.role)) {
      return {
        allowed: false,
        reason: `Role "${intent.role}" is not permitted to execute "${proposed.command_id}".`,
        risk_flags: ['role_denied'],
        requires_confirmation: false,
      };
    }

    // 3. ReadOnly role restricted to read_only side effects
    if (intent.role === 'ReadOnly' && command.side_effects !== 'read_only' && command.side_effects !== 'none') {
      return {
        allowed: false,
        reason: `ReadOnly role can only execute read_only commands. "${proposed.command_id}" has side_effects="${command.side_effects}".`,
        risk_flags: ['readonly_violation'],
        requires_confirmation: false,
      };
    }

    // 4. Safe Mode enforcement
    if (intent.safe_mode && !command.safe_mode_behavior.allowed) {
      return {
        allowed: false,
        reason: `Safe Mode blocks "${proposed.command_id}": ${command.safe_mode_behavior.reason}`,
        risk_flags: ['safe_mode_blocked'],
        requires_confirmation: false,
      };
    }

    // 5. Mutating side effects require confirmation
    if (CONFIRMATION_REQUIRED_SIDE_EFFECTS.has(command.side_effects)) {
      riskFlags.push(`side_effect:${command.side_effects}`);
    }

    // 6. Check for secret access attempts
    if (this.detectsSecretAccess(proposed)) {
      return {
        allowed: false,
        reason: 'Command appears to access secrets or private key material.',
        risk_flags: ['secret_access_attempt'],
        requires_confirmation: false,
      };
    }

    const requiresConfirmation = CONFIRMATION_REQUIRED_SIDE_EFFECTS.has(command.side_effects);

    return {
      allowed: true,
      reason: 'Command permitted.',
      risk_flags: riskFlags,
      requires_confirmation: requiresConfirmation,
    };
  }

  /**
   * Build a Plan from raw AI provider output.
   * Wraps evaluatePlan with parsing and fallback handling.
   */
  async buildPlanFromProviderOutput(
    intent: CopilotIntent,
    providerOutput: unknown,
  ): Promise<Plan> {
    const auditLogger = getOpsAuditLogger();
    const correlationId = generateCorrelationId();

    // Attempt to parse provider output as Plan
    const parsed = this.parseProviderOutput(providerOutput);

    if (!parsed) {
      // Safe fallback — no commands, ask user to rephrase
      await auditLogger.log({
        category: 'console.action',
        severity: 'warn',
        actor: intent.session_id,
        description: 'Copilot: provider output could not be parsed into a plan.',
        payload: { session_id: intent.session_id },
        correlationId,
      });

      return {
        summary: 'I was unable to determine which commands to propose. Could you rephrase your request?',
        proposed_commands: [],
        risk_flags: ['parse_failure'],
        requires_confirmation: false,
        reason: 'Provider output did not match expected plan schema.',
        correlationId,
      };
    }

    // Evaluate parsed commands against policy
    const plan = this.evaluatePlan(intent, parsed);

    // Audit the plan
    await auditLogger.log({
      category: 'console.action',
      severity: 'info',
      actor: intent.session_id,
      description: `Copilot plan: ${plan.proposed_commands.length} command(s), confirmation=${plan.requires_confirmation}`,
      payload: {
        commandIds: plan.proposed_commands.map((c) => c.command_id),
        riskFlags: plan.risk_flags,
        requiresConfirmation: plan.requires_confirmation,
      },
      correlationId: plan.correlationId,
    });

    return plan;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private parseProviderOutput(output: unknown): ProposedCommand[] | null {
    if (!output || typeof output !== 'object') return null;

    // Accept { proposed_commands: [...] } format
    const obj = output as Record<string, unknown>;

    if (Array.isArray(obj.proposed_commands)) {
      const commands: ProposedCommand[] = [];
      for (const item of obj.proposed_commands) {
        if (
          item &&
          typeof item === 'object' &&
          typeof (item as Record<string, unknown>).command_id === 'string'
        ) {
          commands.push({
            command_id: (item as Record<string, unknown>).command_id as string,
            args: (item as Record<string, unknown>).args as Record<string, unknown> ?? {},
          });
        }
      }
      return commands.length > 0 ? commands : null;
    }

    return null;
  }

  private detectsSecretAccess(proposed: ProposedCommand): boolean {
    const secretPatterns = [
      /\.env$/i, /\.pem$/i, /\.key$/i, /id_rsa/i,
      /secrets?\//i, /credentials?/i, /token/i,
      /ssh\//i, /\.ssh\//i, /private/i,
    ];

    const argsStr = JSON.stringify(proposed.args).toLowerCase();
    return secretPatterns.some((p) => p.test(argsStr));
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

let _instance: PolicyEngine | undefined;

export function getPolicyEngine(registry: CommandRegistry): PolicyEngine {
  if (!_instance) {
    _instance = new PolicyEngine(registry);
  }
  return _instance;
}

export function resetPolicyEngine(): void {
  _instance = undefined;
}
