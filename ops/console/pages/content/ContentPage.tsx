// B11 – Operations + Growth Automation Layer
// Content ops page — site generation triggers + previews

import { useState } from 'react';
import { useOps } from '../../app/lib/OpsContext';

export function ContentPage() {
  const { can, safeMode, auditLog } = useOps();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleGenerate = async () => {
    if (!can('content.trigger')) return;
    if (safeMode) {
      await auditLog('content.request_created', 'Content generation request (safe mode — local only)', {
        target: 'local', mode: 'safe',
      });
      setConfirmOpen(false);
      return;
    }
    setConfirmOpen(true);
  };

  const confirmGenerate = async () => {
    await auditLog('content.publish_triggered', 'Content generation triggered (live)', {
      target: 'github', mode: 'live',
    });
    setConfirmOpen(false);
  };

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Content Ops</h2>

      {/* Primary action */}
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '20px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '12px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
          Generate content request for review.
        </p>
        <button
          onClick={handleGenerate}
          disabled={!can('content.trigger')}
          style={{
            padding: '12px 24px', borderRadius: '10px', border: 'none',
            background: can('content.trigger') ? '#2563eb' : '#d1d5db',
            color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Generate Content
        </button>
      </div>

      {/* Confirmation dialog */}
      {confirmOpen && (
        <div style={{
          background: '#fef2f2', borderRadius: '12px', padding: '16px',
          border: '1px solid #fca5a5', marginBottom: '12px',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#991b1b', marginBottom: '8px' }}>
            Confirm: This will trigger an external workflow.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={confirmGenerate}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px',
                border: '1px solid #d1d5db', background: '#fff',
                color: '#374151', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Recent requests stub */}
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
        Recent Requests
      </h3>
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>
          No content requests yet.
        </p>
      </div>

      {showAdvanced && (
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
            Advanced
          </h3>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>
            Workflow dispatch, preview generation, and PR creation controls will appear here when enabled.
          </p>
        </div>
      )}

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
          marginTop: '12px', padding: '8px', width: '100%',
          borderRadius: '8px', border: '1px solid #e5e7eb',
          background: '#fff', fontSize: '12px', color: '#6b7280', cursor: 'pointer',
        }}
      >
        {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
      </button>
    </div>
  );
}
