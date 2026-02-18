// B11.1 – Gap-Fill Hardening
// D6 — ConfirmActionSheet: requires typed confirmation for high-risk actions
//
// Usage: wrap any destructive/external-effect action with this component.
// The user must type the exact `confirmPhrase` before the action button enables.

import { useState, useId, type ReactNode } from 'react';

export interface ConfirmActionSheetProps {
  /** Human-readable label for the action being confirmed. */
  title: string;
  /** Explanation of what will happen. Keep factual. */
  description: string;
  /** Exact phrase the user must type. Case-insensitive. */
  confirmPhrase: string;
  /** Label for the confirm button. */
  actionLabel: string;
  /** Callback when the user confirms. */
  onConfirm: () => void;
  /** Callback to dismiss without action. */
  onCancel: () => void;
  /** Optional: mark as loading/processing. */
  processing?: boolean;
  /** Optional RBAC guard — if false, the sheet explains the user lacks permission. */
  permitted?: boolean;
  /** Optional children rendered between description and input. */
  children?: ReactNode;
}

export function ConfirmActionSheet({
  title,
  description,
  confirmPhrase,
  actionLabel,
  onConfirm,
  onCancel,
  processing = false,
  permitted = true,
  children,
}: ConfirmActionSheetProps) {
  const [input, setInput] = useState('');
  const inputId = useId();
  const confirmed = input.trim().toLowerCase() === confirmPhrase.trim().toLowerCase();

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`${inputId}-title`}
      aria-describedby={`${inputId}-desc`}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          maxWidth: '420px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
        }}
      >
        {/* Title */}
        <h2
          id={`${inputId}-title`}
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#991b1b',
            marginBottom: '8px',
          }}
        >
          {title}
        </h2>

        {/* Description */}
        <p
          id={`${inputId}-desc`}
          style={{ fontSize: '13px', color: '#4b5563', marginBottom: '16px', lineHeight: '1.5' }}
        >
          {description}
        </p>

        {children}

        {!permitted ? (
          <p style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600, marginBottom: '12px' }}>
            You do not have permission to perform this action.
          </p>
        ) : (
          <>
            {/* Typed confirmation */}
            <label htmlFor={inputId} style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
              Type <strong style={{ color: '#dc2626' }}>{confirmPhrase}</strong> to confirm
            </label>
            <input
              id={inputId}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              disabled={processing}
              style={{
                display: 'block',
                width: '100%',
                marginTop: '6px',
                marginBottom: '16px',
                padding: '10px 12px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: '#fff',
              color: '#374151',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmed || processing || !permitted}
            aria-disabled={!confirmed || processing || !permitted}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: confirmed && permitted ? '#dc2626' : '#e5e7eb',
              color: confirmed && permitted ? '#fff' : '#9ca3af',
              fontSize: '13px',
              fontWeight: 600,
              cursor: confirmed && permitted ? 'pointer' : 'not-allowed',
              transition: 'background 150ms',
            }}
          >
            {processing ? 'Processing…' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
