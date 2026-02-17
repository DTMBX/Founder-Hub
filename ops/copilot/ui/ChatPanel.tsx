/**
 * B12-05 — Copilot Chat Panel
 *
 * Chat interface for user ↔ copilot conversation.
 * Messages are local state only — no external persistence.
 */

import { useState, useRef, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatPanel({ messages, onSend, disabled, placeholder }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Message list */}
      <div
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        style={{
          flex: 1, overflowY: 'auto', padding: '12px',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', marginTop: '24px' }}>
            Ask a question or request an action. The copilot will propose commands
            for your review before anything executes.
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '8px 12px',
              borderRadius: '12px',
              fontSize: '13px',
              lineHeight: '1.5',
              wordBreak: 'break-word',
              background: msg.role === 'user' ? '#2563eb' : '#f3f4f6',
              color: msg.role === 'user' ? '#fff' : '#111827',
            }}
          >
            {msg.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex', gap: '8px', padding: '12px',
          borderTop: '1px solid #e5e7eb',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          placeholder={placeholder ?? 'Ask the copilot...'}
          aria-label="Chat input"
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '8px',
            border: '1px solid #d1d5db', fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          aria-label="Send message"
          style={{
            padding: '10px 16px', borderRadius: '8px', border: 'none',
            background: disabled || !input.trim() ? '#d1d5db' : '#2563eb',
            color: '#fff', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
