// B11 – Operations + Growth Automation Layer
// Dev-only login gate for Ops Console

import { useState } from 'react';
import { isDevAuthenticated, devLogin } from './lib/OpsContext';

export function OpsLoginGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(isDevAuthenticated());
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  if (authenticated) {
    return <>{children}</>;
  }

  const handleLogin = () => {
    if (devLogin(token)) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Invalid dev token');
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: '#111827', color: '#e5e7eb',
    }}>
      <div style={{
        width: '100%', maxWidth: '360px', padding: '32px',
        background: '#1f2937', borderRadius: '12px',
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>
          Ops Console
        </h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '24px' }}>
          Development access — enter dev token to continue.
        </p>

        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          placeholder="Dev token"
          style={{
            width: '100%', padding: '12px', borderRadius: '8px',
            border: '1px solid #374151', background: '#111827',
            color: '#fff', fontSize: '14px', marginBottom: '12px',
            boxSizing: 'border-box',
          }}
          autoFocus
        />

        {error && (
          <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px' }}>{error}</p>
        )}

        <button
          onClick={handleLogin}
          style={{
            width: '100%', padding: '12px', borderRadius: '8px',
            border: 'none', background: '#2563eb', color: '#fff',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Sign In
        </button>

        <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '16px', textAlign: 'center' }}>
          See /ops/console/README.md for dev token instructions.
        </p>
      </div>
    </div>
  );
}
