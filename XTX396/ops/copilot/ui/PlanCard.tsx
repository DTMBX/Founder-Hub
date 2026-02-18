/**
 * B12-05 — Plan Card
 *
 * Displays proposed commands, risk flags, and side-effect classification.
 * User must explicitly approve before execution.
 */

import type { Plan } from '../policy/PolicyEngine';

interface PlanCardProps {
  plan: Plan;
  safeModeOn: boolean;
  onApprove: () => void;
  onReject: () => void;
  canApprove: boolean;
  executing?: boolean;
}

const SIDE_EFFECT_LABELS: Record<string, { label: string; color: string }> = {
  none: { label: 'None', color: '#22c55e' },
  read_only: { label: 'Read-Only', color: '#3b82f6' },
  writes_repo: { label: 'Writes Repo', color: '#f59e0b' },
  deploys: { label: 'Deploys', color: '#ef4444' },
  network_egress: { label: 'Network Egress', color: '#ef4444' },
};

export function PlanCard({ plan, safeModeOn, onApprove, onReject, canApprove, executing }: PlanCardProps) {
  if (plan.proposed_commands.length === 0) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Execution plan"
      style={{
        border: '1px solid #e5e7eb', borderRadius: '12px',
        padding: '12px', margin: '8px 0', background: '#fff',
      }}
    >
      <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: '#111827' }}>
        Proposed Plan
      </h3>

      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px' }}>
        {plan.summary}
      </p>

      {/* Commands list */}
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
        {plan.proposed_commands.map((cmd, i) => (
          <li
            key={`${cmd.command_id}-${i}`}
            style={{
              padding: '8px 10px', marginBottom: '4px',
              background: '#f9fafb', borderRadius: '8px',
              fontSize: '12px', fontFamily: 'monospace',
            }}
          >
            <span style={{ fontWeight: 600 }}>{cmd.command_id}</span>
            {Object.keys(cmd.args).length > 0 && (
              <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                {JSON.stringify(cmd.args)}
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* Risk flags */}
      {plan.risk_flags.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {plan.risk_flags.map((flag) => {
            const sideEffect = flag.startsWith('side_effect:') ? flag.split(':')[1] : null;
            const style_info = sideEffect ? SIDE_EFFECT_LABELS[sideEffect] : null;

            return (
              <span
                key={flag}
                style={{
                  padding: '2px 8px', borderRadius: '10px', fontSize: '10px',
                  fontWeight: 600,
                  background: style_info ? `${style_info.color}20` : '#fef2f2',
                  color: style_info?.color ?? '#991b1b',
                }}
              >
                {style_info?.label ?? flag}
              </span>
            );
          })}
        </div>
      )}

      {/* Safe Mode banner */}
      {safeModeOn && (
        <div style={{
          padding: '6px 10px', borderRadius: '8px', marginBottom: '12px',
          background: '#f0fdf4', color: '#166534', fontSize: '11px', fontWeight: 600,
        }}>
          Safe Mode ON — only read-only commands will execute.
        </div>
      )}

      {/* Confirmation requirement */}
      {plan.requires_confirmation && (
        <div style={{
          padding: '6px 10px', borderRadius: '8px', marginBottom: '12px',
          background: '#fffbeb', color: '#92400e', fontSize: '11px', fontWeight: 600,
        }}>
          This plan contains mutating commands and requires your explicit approval.
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onApprove}
          disabled={!canApprove || executing}
          aria-label="Approve and execute plan"
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
            background: canApprove && !executing ? '#2563eb' : '#d1d5db',
            color: '#fff', fontWeight: 600, cursor: canApprove && !executing ? 'pointer' : 'not-allowed',
            fontSize: '13px',
          }}
        >
          {executing ? 'Executing...' : 'Approve'}
        </button>
        <button
          onClick={onReject}
          disabled={executing}
          aria-label="Reject plan"
          style={{
            padding: '10px 16px', borderRadius: '8px',
            border: '1px solid #d1d5db', background: '#fff',
            color: '#374151', fontWeight: 600, cursor: executing ? 'not-allowed' : 'pointer',
            fontSize: '13px',
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
