// B11 – Operations + Growth Automation Layer
// Settings page — integration status, safe mode config (no secrets displayed)
// B11.1 — Hardened: panic button, typed confirmation for Danger Zone

import { useState } from 'react';
import { useOps } from '../../app/lib/OpsContext';
import { ConfirmActionSheet } from '../../app/components/ConfirmActionSheet';

interface IntegrationRow {
  name: string;
  status: 'connected' | 'mock' | 'disabled';
  description: string;
}

const INTEGRATIONS: IntegrationRow[] = [
  { name: 'CRM Adapter', status: 'mock', description: 'Local JSON store — no external CRM connected' },
  { name: 'Email Provider', status: 'mock', description: 'Mock mode — no external sends' },
  { name: 'SMS Provider', status: 'disabled', description: 'Not configured' },
  { name: 'Webhook Relay', status: 'disabled', description: 'Not configured' },
];

function statusColor(s: IntegrationRow['status']): string {
  if (s === 'connected') return '#22c55e';
  if (s === 'mock') return '#f59e0b';
  return '#9ca3af';
}

function statusLabel(s: IntegrationRow['status']): string {
  if (s === 'connected') return 'Connected';
  if (s === 'mock') return 'Mock';
  return 'Disabled';
}

export function SettingsPage() {
  const { user, safeMode, setSafeMode, panic, can } = useOps();
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Settings</h2>

      {/* Safe Mode */}
      <div style={{
        background: safeMode ? '#f0fdf4' : '#fef2f2',
        borderRadius: '12px', padding: '16px', marginBottom: '16px',
        border: `1px solid ${safeMode ? '#86efac' : '#fca5a5'}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: '14px', color: safeMode ? '#166534' : '#991b1b' }}>
              Safe Mode {safeMode ? 'ON' : 'OFF'}
            </p>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              {safeMode
                ? 'All external sends disabled. Mock adapters active.'
                : 'Live mode: external sends enabled. Exercise caution.'}
            </p>
          </div>
          <button
            onClick={() => {
              if (safeMode) {
                // B11.1 — Disabling Safe Mode requires typed confirmation (D6)
                setShowDisableConfirm(true);
              } else {
                setSafeMode(true);
              }
            }}
            disabled={!can('settings.toggle_safe_mode')}
            aria-label={safeMode ? 'Disable safe mode' : 'Enable safe mode'}
            style={{
              width: '52px', height: '28px', borderRadius: '14px', border: 'none',
              background: safeMode ? '#22c55e' : '#ef4444', position: 'relative',
              cursor: can('settings.toggle_safe_mode') ? 'pointer' : 'not-allowed',
              transition: 'background 150ms',
            }}
          >
            <span style={{
              display: 'block', width: '22px', height: '22px', borderRadius: '50%',
              background: '#fff', position: 'absolute', top: '3px',
              left: safeMode ? '27px' : '3px', transition: 'left 150ms',
            }} />
          </button>
        </div>
      </div>

      {/* Current User */}
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
          Current User
        </h3>
        <p style={{ fontSize: '14px', fontWeight: 600 }}>{user?.name ?? '—'}</p>
        <p style={{ fontSize: '12px', color: '#9ca3af' }}>Role: {user?.role ?? '—'}</p>
      </div>

      {/* Integration Status */}
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
        Integrations
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {INTEGRATIONS.map((i) => (
          <div key={i.name} style={{
            background: '#fff', borderRadius: '12px', padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600 }}>{i.name}</p>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{i.description}</p>
            </div>
            <span style={{
              fontSize: '11px', fontWeight: 600, color: statusColor(i.status),
              padding: '2px 8px', borderRadius: '8px',
              background:
                i.status === 'connected' ? '#dcfce7'
                : i.status === 'mock' ? '#fef3c7'
                : '#f3f4f6',
            }}>
              {statusLabel(i.status)}
            </span>
          </div>
        ))}
      </div>

      {/* Security notice */}
      <div style={{
        marginTop: '20px', padding: '12px', borderRadius: '8px',
        background: '#f9fafb', border: '1px solid #e5e7eb',
      }}>
        <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
          No secrets or credentials are displayed in this console. All adapter configurations are loaded from
          environment variables or server-side config.
        </p>
      </div>

      {/* B11.1 — Panic Button (D6) */}
      <div style={{
        marginTop: '16px', padding: '16px', borderRadius: '12px',
        background: '#fef2f2', border: '1px solid #fca5a5',
      }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b', marginBottom: '8px' }}>
          Emergency Controls
        </p>
        <button
          onClick={panic}
          style={{
            padding: '10px 20px', borderRadius: '8px', border: 'none',
            background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '13px',
            cursor: 'pointer', width: '100%',
          }}
          aria-label="Activate panic mode: force safe mode on with lockout"
        >
          PANIC — Force Safe Mode + Lock
        </button>
        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
          Immediately enables Safe Mode and locks it on. Requires admin clearance to unlock.
        </p>
      </div>

      {/* B11.1 — Typed confirmation for disabling Safe Mode (D6) */}
      {showDisableConfirm && (
        <ConfirmActionSheet
          title="Disable Safe Mode"
          description="Disabling Safe Mode will allow external sends (CRM, email, webhooks). This action should only be performed when the system is ready for live operation."
          confirmPhrase="DISABLE SAFE MODE"
          actionLabel="Disable Safe Mode"
          permitted={can('settings.toggle_safe_mode')}
          onConfirm={() => {
            setSafeMode(false);
            setShowDisableConfirm(false);
          }}
          onCancel={() => setShowDisableConfirm(false)}
        />
      )}
    </div>
  );
}
