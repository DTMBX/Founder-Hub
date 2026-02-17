// B11 – Operations + Growth Automation Layer
// Automations page — toggle + run history

import { useState } from 'react';
import { useOps } from '../../app/lib/OpsContext';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  lastRun: string | null;
  runCount: number;
}

const STUB_RULES: AutomationRule[] = [
  { id: 'r1', name: 'New Lead Follow-up', description: 'Create follow-up task 15 min after new lead', enabled: true, lastRun: '2026-02-17T10:30:00Z', runCount: 14 },
  { id: 'r2', name: '24h Escalation', description: 'Escalate if lead not contacted within 24h', enabled: true, lastRun: '2026-02-17T06:00:00Z', runCount: 5 },
  { id: 'r3', name: 'Review Request', description: 'Request review 7 days after job completion', enabled: false, lastRun: null, runCount: 0 },
  { id: 'r4', name: '90-day Check-in', description: 'Draft check-in message for inactive clients', enabled: true, lastRun: '2026-02-15T06:00:00Z', runCount: 3 },
];

export function AutomationsPage() {
  const { can, safeMode, auditLog } = useOps();
  const [rules, setRules] = useState(STUB_RULES);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleRule = async (id: string) => {
    if (!can('automations.toggle')) return;
    setRules((prev) =>
      prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r)
    );
    const rule = rules.find((r) => r.id === id);
    await auditLog('automation.rule_triggered', `Toggled rule "${rule?.name}" ${rule?.enabled ? 'off' : 'on'}`, { ruleId: id });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Automations</h2>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb',
            background: '#fff', fontSize: '12px', color: '#6b7280', cursor: 'pointer',
          }}
        >
          {showAdvanced ? 'Simple' : 'Advanced'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {rules.map((rule) => (
          <div key={rule.id} style={{
            background: '#fff', borderRadius: '12px', padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            opacity: rule.enabled ? 1 : 0.6,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{rule.name}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{rule.description}</div>
              </div>
              {can('automations.toggle') && (
                <button
                  onClick={() => toggleRule(rule.id)}
                  style={{
                    width: '44px', height: '24px', borderRadius: '12px', border: 'none',
                    background: rule.enabled ? '#22c55e' : '#d1d5db', cursor: 'pointer',
                    position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: '2px',
                    left: rule.enabled ? '22px' : '2px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                  }} />
                </button>
              )}
            </div>

            {showAdvanced && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>
                Runs: {rule.runCount} · Last: {rule.lastRun ? new Date(rule.lastRun).toLocaleString() : 'Never'}
              </div>
            )}
          </div>
        ))}
      </div>

      {safeMode && (
        <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '16px', textAlign: 'center' }}>
          Safe Mode active — automations run in draft-only mode.
        </p>
      )}
    </div>
  );
}
