// B11 – Operations + Growth Automation Layer
// Leads inbox page

import { useState } from 'react';
import { useOps } from '../../app/lib/OpsContext';

interface Lead {
  id: string;
  name: string;
  email: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  createdAt: string;
  tags: string[];
}

// Stub data — replaced by LeadRepo in B11-03
const STUB_LEADS: Lead[] = [
  { id: '1', name: 'Jane Doe', email: 'j***@example.com', source: 'website', status: 'new', createdAt: new Date().toISOString(), tags: ['urgent'] },
  { id: '2', name: 'John Smith', email: 'j***@company.co', source: 'referral', status: 'contacted', createdAt: new Date(Date.now() - 86400000).toISOString(), tags: [] },
  { id: '3', name: 'Acme Corp', email: 'info@acme.co', source: 'website', status: 'qualified', createdAt: new Date(Date.now() - 172800000).toISOString(), tags: ['enterprise'] },
];

export function LeadsPage() {
  const { can } = useOps();
  const [filter, setFilter] = useState<string>('all');
  const leads = STUB_LEADS;

  const filtered = filter === 'all' ? leads : leads.filter((l) => l.status === filter);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Leads</h2>
        {can('leads.create') && (
          <button style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            background: '#2563eb', color: '#fff', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer',
          }}>
            + New
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
        {['all', 'new', 'contacted', 'qualified', 'converted', 'closed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 12px', borderRadius: '16px', border: 'none',
              background: filter === f ? '#2563eb' : '#e5e7eb',
              color: filter === f ? '#fff' : '#374151',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Lead list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map((lead) => (
          <LeadCard key={lead.id} lead={lead} canUpdate={can('leads.update')} />
        ))}
        {filtered.length === 0 && (
          <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '24px' }}>
            No leads matching filter.
          </p>
        )}
      </div>
    </div>
  );
}

function LeadCard({ lead, canUpdate }: { lead: Lead; canUpdate: boolean }) {
  const statusColors: Record<string, string> = {
    new: '#2563eb', contacted: '#f59e0b', qualified: '#22c55e',
    converted: '#8b5cf6', closed: '#6b7280',
  };

  return (
    <div style={{
      background: '#fff', borderRadius: '12px', padding: '14px 16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>{lead.name}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>{lead.email} · {lead.source}</div>
        </div>
        <span style={{
          padding: '3px 8px', borderRadius: '10px', fontSize: '11px',
          fontWeight: 600, color: '#fff',
          background: statusColors[lead.status] ?? '#6b7280',
        }}>
          {lead.status}
        </span>
      </div>
      {lead.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
          {lead.tags.map((t) => (
            <span key={t} style={{
              padding: '2px 6px', borderRadius: '6px', fontSize: '10px',
              background: '#f3f4f6', color: '#374151',
            }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
