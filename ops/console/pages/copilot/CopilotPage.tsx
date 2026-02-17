/**
 * B12-05 — Copilot Page
 *
 * Main page for the AI Co-Pilot in the Ops Console.
 * Orchestrates: ChatPanel → Provider → PolicyEngine → PlanCard → RunnerService → ExecutionLogViewer
 *
 * Critical invariant: Copilot NEVER executes automatically.
 * User must explicitly click Approve.
 */

import { useState, useCallback } from 'react';
import { useOps } from '../../console/app/lib/OpsContext';
import { ChatPanel, type ChatMessage } from '../../copilot/ui/ChatPanel';
import { PlanCard } from '../../copilot/ui/PlanCard';
import { ExecutionLogViewer } from '../../copilot/ui/ExecutionLogViewer';
import { PolicyEngine, type Plan, type CopilotIntent } from '../../copilot/policy/PolicyEngine';
import { MockProvider } from '../../copilot/providers/MockProvider';
import { buildCommandCatalog, type IProvider } from '../../copilot/providers/IProvider';
import { RunnerService, type RunnerResult } from '../../runner/RunnerService';
import type { CommandRegistry } from '../../runner/commands/validateRegistry';
import { generateCorrelationId } from '../../core/correlation';

// ---------------------------------------------------------------------------
// Registry — loaded inline (browser context, no fs)
// ---------------------------------------------------------------------------

const REGISTRY: CommandRegistry = {
  version: '1.0.0',
  commands: [
    {
      id: 'repo.status',
      description: 'Show current repository working tree status (porcelain format).',
      roles_allowed: ['Admin', 'Operator', 'ReadOnly'],
      safe_mode_behavior: { allowed: true, reason: 'Read-only git query, no side effects.' },
      args_schema: { type: 'object', properties: {}, additionalProperties: false },
      working_dir_policy: { type: 'fixed', value: '.' },
      env_allowlist: [],
      command_template: { executable: 'git', args: ['status', '--porcelain'] },
      expected_outputs: ['text'],
      timeout_seconds: 15,
      side_effects: 'read_only',
      output_limits: { max_chars: 8192, max_lines: 200 },
    },
    {
      id: 'repo.branch',
      description: 'Show the current branch name.',
      roles_allowed: ['Admin', 'Operator', 'ReadOnly'],
      safe_mode_behavior: { allowed: true, reason: 'Read-only git query, no side effects.' },
      args_schema: { type: 'object', properties: {}, additionalProperties: false },
      working_dir_policy: { type: 'fixed', value: '.' },
      env_allowlist: [],
      command_template: { executable: 'git', args: ['rev-parse', '--abbrev-ref', 'HEAD'] },
      expected_outputs: ['text'],
      timeout_seconds: 10,
      side_effects: 'read_only',
    },
    {
      id: 'repo.last_commit',
      description: 'Show the most recent commit with full author and date details.',
      roles_allowed: ['Admin', 'Operator', 'ReadOnly'],
      safe_mode_behavior: { allowed: true, reason: 'Read-only git query, no side effects.' },
      args_schema: { type: 'object', properties: {}, additionalProperties: false },
      working_dir_policy: { type: 'fixed', value: '.' },
      env_allowlist: [],
      command_template: { executable: 'git', args: ['log', '-1', '--pretty=fuller'] },
      expected_outputs: ['text'],
      timeout_seconds: 10,
      side_effects: 'read_only',
    },
    {
      id: 'ops.health_snapshot',
      description: 'Capture a point-in-time health snapshot of all ops subsystems.',
      roles_allowed: ['Admin', 'Operator', 'ReadOnly'],
      safe_mode_behavior: { allowed: true, reason: 'Read-only health check, no external effects.' },
      args_schema: { type: 'object', properties: {}, additionalProperties: false },
      working_dir_policy: { type: 'fixed', value: '.' },
      env_allowlist: [],
      command_template: { executable: '__internal__', args: ['ops_health_snapshot'] },
      expected_outputs: ['json'],
      timeout_seconds: 15,
      side_effects: 'read_only',
    },
    {
      id: 'audit.verify',
      description: 'Verify the integrity of the ops audit log (check payload hashes).',
      roles_allowed: ['Admin', 'Operator'],
      safe_mode_behavior: { allowed: true, reason: 'Read-only audit verification, no modifications.' },
      args_schema: { type: 'object', properties: {}, additionalProperties: false },
      working_dir_policy: { type: 'fixed', value: '.' },
      env_allowlist: [],
      command_template: { executable: '__internal__', args: ['audit_verify'] },
      expected_outputs: ['json'],
      timeout_seconds: 30,
      side_effects: 'read_only',
    },
    {
      id: 'automation.dry_run',
      description: 'Preview planned automation actions without executing them.',
      roles_allowed: ['Admin', 'Operator'],
      safe_mode_behavior: { allowed: true, reason: 'Dry run only — no sends, no mutations.' },
      args_schema: {
        type: 'object',
        properties: { ruleId: { type: 'string', minLength: 1 } },
        required: ['ruleId'],
        additionalProperties: false,
      },
      working_dir_policy: { type: 'fixed', value: '.' },
      env_allowlist: [],
      command_template: { executable: '__internal__', args: ['automation_dry_run', '{{ruleId}}'] },
      expected_outputs: ['json'],
      timeout_seconds: 30,
      side_effects: 'read_only',
    },
    {
      id: 'automation.queue_status',
      description: 'Show current automation queue depth, pending items, and processing rate.',
      roles_allowed: ['Admin', 'Operator', 'ReadOnly'],
      safe_mode_behavior: { allowed: true, reason: 'Read-only queue inspection, no side effects.' },
      args_schema: { type: 'object', properties: {}, additionalProperties: false },
      working_dir_policy: { type: 'fixed', value: '.' },
      env_allowlist: [],
      command_template: { executable: '__internal__', args: ['automation_queue_status'] },
      expected_outputs: ['json'],
      timeout_seconds: 15,
      side_effects: 'read_only',
    },
    {
      id: 'leads.stats',
      description: 'Return aggregate lead statistics: total, by status, recent additions.',
      roles_allowed: ['Admin', 'Operator', 'ReadOnly'],
      safe_mode_behavior: { allowed: true, reason: 'Read-only aggregate statistics.' },
      args_schema: { type: 'object', properties: {}, additionalProperties: false },
      working_dir_policy: { type: 'fixed', value: '.' },
      env_allowlist: [],
      command_template: { executable: '__internal__', args: ['leads_stats'] },
      expected_outputs: ['json'],
      timeout_seconds: 15,
      side_effects: 'read_only',
    },
    {
      id: 'contentops.pending_requests',
      description: 'List pending content operations requests (count and summaries only).',
      roles_allowed: ['Admin', 'Operator', 'ReadOnly'],
      safe_mode_behavior: { allowed: true, reason: 'Read-only content queue inspection.' },
      args_schema: { type: 'object', properties: {}, additionalProperties: false },
      working_dir_policy: { type: 'fixed', value: '.' },
      env_allowlist: [],
      command_template: { executable: '__internal__', args: ['contentops_pending_requests'] },
      expected_outputs: ['json'],
      timeout_seconds: 15,
      side_effects: 'read_only',
    },
    {
      id: 'repo.diff_summary',
      description: 'Show a summary of uncommitted changes.',
      roles_allowed: ['Admin', 'Operator', 'ReadOnly'],
      safe_mode_behavior: { allowed: true, reason: 'Read-only git diff statistics.' },
      args_schema: { type: 'object', properties: {}, additionalProperties: false },
      working_dir_policy: { type: 'fixed', value: '.' },
      env_allowlist: [],
      command_template: { executable: 'git', args: ['diff', '--stat'] },
      expected_outputs: ['text'],
      timeout_seconds: 15,
      side_effects: 'read_only',
      output_limits: { max_chars: 8192, max_lines: 200 },
    },
    {
      id: 'repo.search',
      description: 'Search for a pattern in tracked files (bounded output).',
      roles_allowed: ['Admin', 'Operator'],
      safe_mode_behavior: { allowed: true, reason: 'Read-only code search.' },
      args_schema: {
        type: 'object',
        properties: { pattern: { type: 'string', minLength: 2 } },
        required: ['pattern'],
        additionalProperties: false,
      },
      working_dir_policy: { type: 'fixed', value: '.' },
      env_allowlist: [],
      command_template: { executable: 'git', args: ['grep', '-n', '--count', '{{pattern}}'] },
      expected_outputs: ['text'],
      timeout_seconds: 30,
      side_effects: 'read_only',
      output_limits: { max_chars: 16384, max_lines: 500 },
    },
  ],
};

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an Ops Co-Pilot. You help administrators monitor and manage their operations platform.

Rules:
- You may ONLY propose commands from the available command catalog.
- NEVER propose arbitrary shell commands or code execution.
- NEVER access secrets, private keys, or sensitive credentials.
- If the user asks for something outside the catalog, explain what is available.
- All proposed commands will be reviewed by the user before execution.
- Be concise and factual. No hype, no speculation.`;

// ---------------------------------------------------------------------------
// Copilot Page Component
// ---------------------------------------------------------------------------

export function CopilotPage() {
  const { user, safeMode, can, auditLog } = useOps();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [results, setResults] = useState<RunnerResult[]>([]);
  const [executing, setExecuting] = useState(false);
  const [sessionId] = useState(() => generateCorrelationId());

  const provider: IProvider = new MockProvider();
  const policyEngine = new PolicyEngine(REGISTRY);
  const runner = new RunnerService(REGISTRY, '.');

  // ── Send message ──────────────────────────────────────────
  const handleSend = useCallback(async (text: string) => {
    // Add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setCurrentPlan(null);

    // Build conversation for provider
    const conversationHistory = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Call provider
    const response = await provider.complete({
      system: SYSTEM_PROMPT,
      messages: [...conversationHistory, { role: 'user', content: text }],
      commandCatalog: buildCommandCatalog(REGISTRY),
    });

    // Build intent
    const intent: CopilotIntent = {
      user_message: text,
      role: user.role,
      safe_mode: safeMode,
      session_id: sessionId,
    };

    // Run through policy engine
    const plan = await policyEngine.buildPlanFromProviderOutput(intent, response.parsed);

    // Add assistant message
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: plan.proposed_commands.length > 0
        ? response.content
        : response.content || plan.summary,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMsg]);

    // Show plan if commands are proposed
    if (plan.proposed_commands.length > 0) {
      setCurrentPlan(plan);
    }
  }, [messages, user.role, safeMode, sessionId, provider, policyEngine]);

  // ── Approve plan ──────────────────────────────────────────
  const handleApprove = useCallback(async () => {
    if (!currentPlan || executing) return;

    setExecuting(true);
    const planResults: RunnerResult[] = [];

    await auditLog(
      'console.action',
      `Copilot: user approved plan with ${currentPlan.proposed_commands.length} command(s)`,
      { correlationId: currentPlan.correlationId, commandIds: currentPlan.proposed_commands.map((c: { command_id: string }) => c.command_id) },
    );

    for (const cmd of currentPlan.proposed_commands) {
      try {
        const result = await runner.execute({
          commandId: cmd.command_id,
          args: cmd.args,
          role: user.role,
          actor: user.username,
          correlationId: currentPlan.correlationId,
        });
        planResults.push(result);
      } catch (err) {
        planResults.push({
          ok: false,
          stdout: '',
          stderr: err instanceof Error ? err.message : String(err),
          exitCode: -1,
          artifacts: [],
          durationMs: 0,
          correlationId: currentPlan.correlationId,
          commandId: cmd.command_id,
        });
      }
    }

    setResults((prev) => [...planResults, ...prev]);
    setCurrentPlan(null);
    setExecuting(false);

    // Add result summary as assistant message
    const successCount = planResults.filter((r) => r.ok).length;
    const resultMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Executed ${planResults.length} command(s). ${successCount}/${planResults.length} succeeded.`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, resultMsg]);
  }, [currentPlan, executing, user, auditLog, runner]);

  // ── Reject plan ───────────────────────────────────────────
  const handleReject = useCallback(() => {
    if (currentPlan) {
      auditLog(
        'console.action',
        'Copilot: user rejected plan',
        { correlationId: currentPlan.correlationId },
      );
    }
    setCurrentPlan(null);

    const rejectMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Plan rejected. No commands were executed.',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, rejectMsg]);
  }, [currentPlan, auditLog]);

  // ── View audit trail ──────────────────────────────────────
  const handleViewAuditTrail = useCallback((correlationId: string) => {
    // In a real implementation, this would navigate to the audit log page
    // with a correlationId filter. For now, copy to clipboard.
    navigator.clipboard?.writeText(correlationId);
  }, []);

  const canApprove = can('automations.run') || can('settings.update') || user.role === 'Admin';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>
      {/* Header */}
      <div style={{
        padding: '12px 0', borderBottom: '1px solid #e5e7eb',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>
          Co-Pilot
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 600,
            background: safeMode ? '#dcfce7' : '#fef2f2',
            color: safeMode ? '#166534' : '#991b1b',
          }}>
            {safeMode ? 'SAFE MODE' : 'LIVE MODE'}
          </span>
          <span style={{
            padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 600,
            background: '#eff6ff', color: '#1e40af',
          }}>
            {user.role}
          </span>
        </div>
      </div>

      {/* Safe Mode banner */}
      {safeMode && (
        <div style={{
          padding: '8px 12px', background: '#f0fdf4', color: '#166534',
          fontSize: '11px', fontWeight: 600, borderBottom: '1px solid #bbf7d0',
        }}>
          Safe Mode ON — only read-only commands are permitted. Mutations are blocked.
        </div>
      )}

      {/* Chat */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ChatPanel
          messages={messages}
          onSend={handleSend}
          disabled={executing}
          placeholder={safeMode ? 'Ask about repo status, health, or audit...' : 'Ask the copilot...'}
        />
      </div>

      {/* Plan card (overlay-style at bottom) */}
      {currentPlan && (
        <PlanCard
          plan={currentPlan}
          safeModeOn={safeMode}
          onApprove={handleApprove}
          onReject={handleReject}
          canApprove={canApprove}
          executing={executing}
        />
      )}

      {/* Execution results */}
      {results.length > 0 && (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <ExecutionLogViewer
            results={results}
            onViewAuditTrail={handleViewAuditTrail}
          />
        </div>
      )}
    </div>
  );
}
