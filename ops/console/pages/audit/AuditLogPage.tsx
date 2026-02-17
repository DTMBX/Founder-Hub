// B11 – Operations + Growth Automation Layer
// Audit Log page — read from append-only audit store, display events

import { useState, useEffect, useCallback } from 'react';
import { useOps } from '../../app/lib/OpsContext';
import type { OpsAuditEvent, OpsEventCategory } from '../../../automation/audit/events';
import { getOpsAuditLogger } from '../../../automation/audit/OpsAuditLogger';

const CATEGORY_GROUPS: Record<string, OpsEventCategory[]> = {
  Lead: ['lead.created', 'lead.updated', 'lead.deleted', 'lead.status_changed', 'lead.exported'],
  Client: ['client.created', 'client.updated', 'client.archived'],
  Auto: [
    'automation.rule_created', 'automation.rule_updated', 'automation.rule_toggled',
    'automation.execution_started', 'automation.execution_completed', 'automation.execution_failed',
  ],
  Message: ['message.email_queued', 'message.email_sent', 'message.sms_queued', 'message.sms_sent', 'message.send_blocked'],
  Content: ['content.request_created', 'content.publish_triggered'],
  Console: ['console.login', 'console.logout', 'console.safe_mode_toggled'],
  System: ['system.startup', 'system.error', 'system.config_changed'],
};

const ALL_GROUPS = Object.keys(CATEGORY_GROUPS);

function severityColor(s: OpsAuditEvent['severity']): string {
  if (s === 'critical') return '#dc2626';
  if (s === 'warn') return '#f59e0b';
  return '#6b7280';
}

function formatTs(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function AuditLogPage() {
  const { can } = useOps();
  const [events, setEvents] = useState<OpsAuditEvent[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    if (!can('audit.read')) return;
    setLoading(true);
    try {
      const logger = getOpsAuditLogger();
      const all = await logger.readAll();
      setEvents(all.reverse());
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [can]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const filtered = filter === 'all'
    ? events
    : events.filter((e) => {
        const cats = CATEGORY_GROUPS[filter];
        return cats && (cats as string[]).includes(e.category);
      });

  if (!can('audit.read')) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px' }}>
        <p style={{ fontSize: '14px', color: '#9ca3af' }}>Insufficient permissions to view audit log.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Audit Log</h2>
        <button
          onClick={loadEvents}
          aria-label="Refresh audit log"
          style={{
            padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb',
            background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#374151',
          }}
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px',
      }}>
        {['all', ...ALL_GROUPS].map((g) => (
          <button
            key={g}
            onClick={() => setFilter(g)}
            style={{
              padding: '6px 12px', borderRadius: '16px', border: 'none', whiteSpace: 'nowrap',
              background: filter === g ? '#2563eb' : '#f3f4f6',
              color: filter === g ? '#fff' : '#6b7280',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            {g === 'all' ? 'All' : g}
          </button>
        ))}
      </div>

      {/* Events */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', padding: '40px 0' }}>
          Loading…
        </p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', padding: '40px 0' }}>
          No events found.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map((ev) => (
            <div key={ev.id} style={{
              background: '#fff', borderRadius: '10px', padding: '12px 14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 600, color: severityColor(ev.severity),
                  textTransform: 'uppercase',
                }}>
                  {ev.severity}
                </span>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {formatTs(ev.timestamp)}
                </span>
              </div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginTop: '4px' }}>
                {ev.category}
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                {ev.description}
              </p>
              <p style={{ fontSize: '10px', color: '#d1d5db', marginTop: '4px', fontFamily: 'monospace' }}>
                {ev.id}
              </p>
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: '16px', padding: '10px', borderRadius: '8px',
        background: '#f9fafb', border: '1px solid #e5e7eb',
      }}>
        <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
          Audit log is append-only. Entries cannot be modified or deleted.
        </p>
      </div>
    </div>
  );
}
