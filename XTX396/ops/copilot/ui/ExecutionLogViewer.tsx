/**
 * B12-05 — Execution Log Viewer
 *
 * Displays execution results: stdout, stderr, exit code, duration, artifacts.
 * Links to audit trail via correlationId.
 */

import type { RunnerResult } from '../../runner/RunnerService';

interface ExecutionLogViewerProps {
  results: RunnerResult[];
  onViewAuditTrail?: (correlationId: string) => void;
}

export function ExecutionLogViewer({ results, onViewAuditTrail }: ExecutionLogViewerProps) {
  if (results.length === 0) return null;

  return (
    <div role="region" aria-label="Execution results">
      {results.map((result, i) => (
        <div
          key={`${result.correlationId}-${i}`}
          style={{
            border: '1px solid #e5e7eb', borderRadius: '12px',
            padding: '12px', margin: '8px 0', background: '#fff',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '8px',
          }}>
            <span style={{
              fontFamily: 'monospace', fontSize: '12px', fontWeight: 600,
              color: result.ok ? '#166534' : '#991b1b',
            }}>
              {result.commandId} — {result.ok ? 'OK' : 'FAILED'}
            </span>
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>
              {result.durationMs}ms · exit {result.exitCode}
            </span>
          </div>

          {/* Stdout */}
          {result.stdout && (
            <pre style={{
              background: '#f9fafb', padding: '8px', borderRadius: '6px',
              fontSize: '11px', fontFamily: 'monospace', overflow: 'auto',
              maxHeight: '200px', margin: '0 0 8px', whiteSpace: 'pre-wrap',
              wordBreak: 'break-word', color: '#111827',
            }}>
              {result.stdout}
            </pre>
          )}

          {/* Stderr */}
          {result.stderr && (
            <pre style={{
              background: '#fef2f2', padding: '8px', borderRadius: '6px',
              fontSize: '11px', fontFamily: 'monospace', overflow: 'auto',
              maxHeight: '100px', margin: '0 0 8px', whiteSpace: 'pre-wrap',
              wordBreak: 'break-word', color: '#991b1b',
            }}>
              {result.stderr}
            </pre>
          )}

          {/* Truncation notice */}
          {result.truncated && (
            <p style={{ fontSize: '10px', color: '#b45309', margin: '0 0 8px', fontWeight: 600 }}>
              Output was truncated to configured limits.
            </p>
          )}

          {/* Artifacts */}
          {result.artifacts.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>
                Artifacts:
              </span>
              <ul style={{ margin: '4px 0 0', padding: '0 0 0 16px', fontSize: '11px' }}>
                {result.artifacts.map((a, j) => (
                  <li key={j} style={{ fontFamily: 'monospace', color: '#4b5563' }}>
                    {a.path} <span style={{ color: '#9ca3af' }}>({a.hash.slice(0, 12)}...)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Correlation ID + audit link */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontFamily: 'monospace', fontSize: '10px', color: '#9ca3af',
              maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {result.correlationId}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(result.correlationId);
                }}
                aria-label="Copy correlation ID"
                style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                  border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                Copy ID
              </button>
              {onViewAuditTrail && (
                <button
                  onClick={() => onViewAuditTrail(result.correlationId)}
                  aria-label="View audit trail"
                  style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                    border: '1px solid #2563eb', background: '#eff6ff', cursor: 'pointer',
                    color: '#2563eb', fontWeight: 600,
                  }}
                >
                  Audit Trail
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
