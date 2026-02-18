// B11 – Operations + Growth Automation Layer
// Clients list page

import { useOps } from '../../app/lib/OpsContext';

interface Client {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'archived';
  lastContact: string;
  tags: string[];
}

const STUB_CLIENTS: Client[] = [
  { id: 'c1', name: 'Acme Corp', status: 'active', lastContact: '2026-02-15', tags: ['enterprise'] },
  { id: 'c2', name: 'Smith & Associates', status: 'active', lastContact: '2026-02-10', tags: [] },
  { id: 'c3', name: 'Metro Legal Group', status: 'inactive', lastContact: '2025-11-20', tags: ['review-pending'] },
];

export function ClientsPage() {
  const { can } = useOps();

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Clients</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {STUB_CLIENTS.map((client) => (
          <div key={client.id} style={{
            background: '#fff', borderRadius: '12px', padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{client.name}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Last contact: {client.lastContact}</div>
              </div>
              <span style={{
                padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                color: '#fff',
                background: client.status === 'active' ? '#22c55e' : client.status === 'inactive' ? '#f59e0b' : '#9ca3af',
              }}>
                {client.status}
              </span>
            </div>
            {client.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                {client.tags.map((t) => (
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
        ))}
      </div>
    </div>
  );
}
