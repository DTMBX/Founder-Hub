// B11 – Operations + Growth Automation Layer
// Dashboard page — today's status at a glance

import { useOps } from '../../app/lib/OpsContext';

export function DashboardPage() {
  const { safeMode } = useOps();

  // Stub data — replaced by B11-09 live hooks
  const stats = {
    newLeads: 3,
    pendingFollowUps: 2,
    activeClients: 12,
    automationsRunToday: 7,
    deployStatus: 'healthy',
    integrityStatus: 'verified',
    criticalIssues: 0,
  };

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
        Today's Status
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <StatusCard label="New Leads" value={stats.newLeads} color="#2563eb" />
        <StatusCard label="Follow-ups" value={stats.pendingFollowUps} color="#f59e0b" />
        <StatusCard label="Active Clients" value={stats.activeClients} color="#22c55e" />
        <StatusCard label="Automations" value={stats.automationsRunToday} color="#8b5cf6" />
      </div>

      <h3 style={{ fontSize: '14px', fontWeight: 600, marginTop: '24px', marginBottom: '12px', color: '#6b7280' }}>
        System Health
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <HealthRow label="Deploy" status={stats.deployStatus} />
        <HealthRow label="Integrity" status={stats.integrityStatus} />
        <HealthRow label="Critical Issues" status={stats.criticalIssues === 0 ? 'clear' : 'alert'} />
        <HealthRow label="Safe Mode" status={safeMode ? 'enabled' : 'disabled'} />
      </div>
    </div>
  );
}

function StatusCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '12px', padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontSize: '28px', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

function HealthRow({ label, status }: { label: string; status: string }) {
  const colors: Record<string, string> = {
    healthy: '#22c55e', verified: '#22c55e', clear: '#22c55e', enabled: '#22c55e',
    warning: '#f59e0b', degraded: '#f59e0b',
    alert: '#ef4444', failed: '#ef4444', disabled: '#9ca3af',
  };
  const dot = colors[status] ?? '#6b7280';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#fff', borderRadius: '8px', padding: '12px 16px',
    }}>
      <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
      <span style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '12px', fontWeight: 600, color: dot,
      }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%', background: dot,
        }} />
        {status}
      </span>
    </div>
  );
}
