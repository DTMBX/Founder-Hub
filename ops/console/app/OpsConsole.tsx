// B11 – Operations + Growth Automation Layer
// Ops Console — Mobile-first shell with bottom navigation

import { useState } from 'react';
import { OpsProvider, useOps } from './lib/OpsContext';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { LeadsPage } from '../pages/leads/LeadsPage';
import { ClientsPage } from '../pages/clients/ClientsPage';
import { AutomationsPage } from '../pages/automations/AutomationsPage';
import { ContentPage } from '../pages/content/ContentPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { AuditLogPage } from '../pages/audit/AuditLogPage';
import { CopilotPage } from '../pages/copilot/CopilotPage';
import { OpsLoginGate } from './OpsLoginGate';

type OpsRoute =
  | 'dashboard'
  | 'leads'
  | 'clients'
  | 'automations'
  | 'content'
  | 'settings'
  | 'audit'
  | 'copilot';

const NAV_ITEMS: { route: OpsRoute; label: string; icon: string }[] = [
  { route: 'dashboard', label: 'Home', icon: '📊' },
  { route: 'leads', label: 'Leads', icon: '📥' },
  { route: 'clients', label: 'Clients', icon: '👤' },
  { route: 'automations', label: 'Auto', icon: '⚡' },
  { route: 'content', label: 'Content', icon: '📝' },
];

function OpsShell() {
  const [route, setRoute] = useState<OpsRoute>('dashboard');
  const { safeMode, setSafeMode, user } = useOps();

  const renderPage = () => {
    switch (route) {
      case 'dashboard': return <DashboardPage />;
      case 'leads': return <LeadsPage />;
      case 'clients': return <ClientsPage />;
      case 'automations': return <AutomationsPage />;
      case 'content': return <ContentPage />;
      case 'settings': return <SettingsPage />;
      case 'audit': return <AuditLogPage />;
      case 'copilot': return <CopilotPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      maxWidth: '480px', margin: '0 auto', background: '#f8f9fa',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Top bar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: '#111827', color: '#fff',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <span style={{ fontWeight: 700, fontSize: '16px' }}>Ops Console</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setSafeMode(!safeMode)}
            style={{
              padding: '4px 10px', borderRadius: '12px', border: 'none',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              background: safeMode ? '#22c55e' : '#ef4444',
              color: '#fff',
            }}
            title={safeMode ? 'Safe Mode ON — external sends disabled' : 'Safe Mode OFF — live mode'}
          >
            {safeMode ? '🛡 SAFE' : '⚠ LIVE'}
          </button>
          <button
            onClick={() => setRoute('settings')}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px' }}
            title="Settings"
          >⚙</button>
          <button
            onClick={() => setRoute('copilot')}
            style={{ background: 'none', border: 'none', color: route === 'copilot' ? '#60a5fa' : '#9ca3af', cursor: 'pointer', fontSize: '18px' }}
            title="Co-Pilot"
            aria-label="Open Co-Pilot"
          >🤖</button>
          <button
            onClick={() => setRoute('audit')}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px' }}
            title="Audit Log"
          >📋</button>
        </div>
      </header>

      {/* Safe Mode banner */}
      {!safeMode && (
        <div style={{
          padding: '6px 16px', background: '#fef2f2', color: '#991b1b',
          fontSize: '12px', fontWeight: 600, textAlign: 'center',
        }}>
          LIVE MODE — External integrations active. Actions will have real effects.
        </div>
      )}

      {/* Page content */}
      <main style={{ flex: 1, padding: '16px', overflowY: 'auto', paddingBottom: '80px' }}>
        {renderPage()}
      </main>

      {/* Bottom nav — thumb-friendly */}
      <nav style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px',
        background: '#fff', borderTop: '1px solid #e5e7eb',
        padding: '8px 0', zIndex: 50,
      }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.route}
            onClick={() => setRoute(item.route)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '2px', background: 'none', border: 'none', cursor: 'pointer',
              color: route === item.route ? '#2563eb' : '#6b7280',
              fontSize: '10px', fontWeight: route === item.route ? 700 : 400,
              padding: '4px 12px', minWidth: '56px',
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/** Main Ops Console entry point. */
export function OpsConsole() {
  return (
    <OpsProvider>
      <OpsLoginGate>
        <OpsShell />
      </OpsLoginGate>
    </OpsProvider>
  );
}
