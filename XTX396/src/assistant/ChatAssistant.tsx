/**
 * ChatAssistant UI — Governed AI Assistant
 *
 * Chat panel for the governed AI assistant:
 * - Message display with role indicators
 * - Proposal cards with approve/reject
 * - Tool call status tracking
 * - Audit log viewer
 *
 * SECURITY: Displays redacted content, shows governance status
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Send,
  Bot,
  User,
  Shield,
  Check,
  X,
  GitPullRequest,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Terminal,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  ChatMessage,
  ChatSession,
  ActionProposal,
  ToolCall,
  ProposalStatus,
} from './types'

// ─── Types ─────────────────────────────────────────────────

export interface ChatAssistantProps {
  session?: ChatSession
  onSendMessage?: (content: string) => void
  onApproveProposal?: (proposalId: string) => void
  onRejectProposal?: (proposalId: string, reason: string) => void
  onApproveToolCall?: (callId: string) => void
  onRejectToolCall?: (callId: string) => void
  isProcessing?: boolean
  className?: string
}

// ─── Status Colors ─────────────────────────────────────────

const PROPOSAL_STATUS_COLORS: Record<ProposalStatus, string> = {
  draft: 'bg-zinc-600',
  pending_review: 'bg-amber-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
  executed: 'bg-blue-500',
  cancelled: 'bg-zinc-500',
}

// ─── Main Component ────────────────────────────────────────

export function ChatAssistant({
  session,
  onSendMessage,
  onApproveProposal,
  onRejectProposal,
  onApproveToolCall,
  onRejectToolCall,
  isProcessing = false,
  className,
}: ChatAssistantProps) {
  const [input, setInput] = useState('')
  const [showAuditLog, setShowAuditLog] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages])

  const handleSend = useCallback(() => {
    if (!input.trim() || isProcessing) return

    onSendMessage?.(input.trim())
    setInput('')
  }, [input, isProcessing, onSendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-zinc-900 rounded-xl border border-zinc-800',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-100">AI Assistant</h3>
            <p className="text-xs text-zinc-500">Governed Mode</p>
          </div>
        </div>

        {/* Governance Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-md">
            <Shield className="h-3 w-3 text-emerald-500" />
            <span className="text-xs text-emerald-500">Protected</span>
          </div>

          <button
            onClick={() => setShowAuditLog(!showAuditLog)}
            className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
            aria-label="Toggle audit log"
          >
            <Eye className="h-4 w-4 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(!session || session.messages.length === 0) && (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-400 text-sm">
              Start a conversation with the governed assistant.
            </p>
            <p className="text-zinc-500 text-xs mt-2">
              All actions require PR workflow and human approval.
            </p>
          </div>
        )}

        {session?.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onApproveToolCall={onApproveToolCall}
            onRejectToolCall={onRejectToolCall}
          />
        ))}

        {/* Active Proposal */}
        {session?.context?.activeProposal && (
          <ProposalCard
            proposal={session.context.activeProposal}
            onApprove={onApproveProposal}
            onReject={onRejectProposal}
          />
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-zinc-400" role="status" aria-label="Processing message">
            <div className="flex gap-1" aria-hidden="true">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
              <span
                className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              />
              <span
                className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
            <span className="text-sm">Processing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Audit Log Panel */}
      {showAuditLog && (
        <div className="border-t border-zinc-800 p-4 max-h-48 overflow-y-auto bg-zinc-950">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="h-4 w-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-400">Audit Log</span>
          </div>
          <div className="space-y-1 font-mono text-xs text-zinc-500">
            {session?.auditLog && session.auditLog.length > 0 ? (
              session.auditLog.map((entry, i) => (
                <p key={i}>[{entry.level ?? 'INFO'}] {entry.message}</p>
              ))
            ) : (
              <>
                <p>[INFO] Session started</p>
                <p>[INFO] Governance mode: enabled</p>
                <p>[INFO] Direct commits to main: blocked</p>
                <p>[INFO] Secret redaction: active</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the assistant..."
            disabled={isProcessing}
            rows={1}
            className={cn(
              'flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2',
              'text-zinc-100 placeholder:text-zinc-500',
              'focus:outline-none focus:ring-2 focus:ring-amber-500/50',
              'disabled:opacity-50',
              'resize-none min-h-[40px] max-h-[120px] overflow-y-auto'
            )}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            aria-label="Send message"
            className={cn(
              'px-4 py-2 rounded-lg transition-colors self-end',
              'bg-amber-500 hover:bg-amber-600 text-black',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {/* Governance Notice */}
        <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
          <Lock className="h-3 w-3" />
          All changes require PR workflow and human approval
        </p>
      </div>
    </div>
  )
}

// ─── Message Bubble ────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage
  onApproveToolCall?: (callId: string) => void
  onRejectToolCall?: (callId: string) => void
}

function MessageBubble({
  message,
  onApproveToolCall,
  onRejectToolCall,
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          isUser
            ? 'bg-blue-500/10'
            : isSystem
            ? 'bg-amber-500/10'
            : 'bg-zinc-800'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-blue-500" />
        ) : isSystem ? (
          <Shield className="h-4 w-4 text-amber-500" />
        ) : (
          <Bot className="h-4 w-4 text-zinc-400" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'max-w-[80%] min-w-0',
          isUser && 'text-right ml-auto'
        )}
      >
        <div
          className={cn(
            'inline-block px-4 py-2 rounded-lg',
            isUser
              ? 'bg-blue-500/10 text-blue-100'
              : isSystem
              ? 'bg-amber-500/10 text-amber-100 border border-amber-500/20'
              : 'bg-zinc-800 text-zinc-100'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Tool Call */}
        {message.metadata?.toolCall && (
          <ToolCallCard
            toolCall={message.metadata.toolCall}
            onApprove={onApproveToolCall}
            onReject={onRejectToolCall}
          />
        )}

        {/* Timestamp */}
        <p className="mt-1 text-xs text-zinc-500">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}

// ─── Tool Call Card ────────────────────────────────────────

interface ToolCallCardProps {
  toolCall: ToolCall
  onApprove?: (callId: string) => void
  onReject?: (callId: string) => void
}

function ToolCallCard({ toolCall, onApprove, onReject }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isPending = toolCall.status === 'pending'

  return (
    <div className="mt-2 bg-zinc-800/50 border border-zinc-700 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-200">
            {toolCall.toolId}
          </span>
          <StatusBadge status={toolCall.status} />
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-3 py-2 border-t border-zinc-700">
          <p className="text-xs text-zinc-500 mb-2">Parameters:</p>
          <pre className="text-xs text-zinc-300 bg-zinc-900 p-2 rounded overflow-x-auto">
            {JSON.stringify(toolCall.parameters, null, 2)}
          </pre>

          {toolCall.result && (
            <div className="mt-2">
              <p className="text-xs text-zinc-500 mb-1">Result:</p>
              <pre
                className={cn(
                  'text-xs p-2 rounded overflow-x-auto',
                  toolCall.result.success
                    ? 'bg-emerald-950 text-emerald-300'
                    : 'bg-red-950 text-red-300'
                )}
              >
                {toolCall.result.output ?? toolCall.result.error ?? 'No output'}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Actions for pending */}
      {isPending && (
        <div className="flex border-t border-zinc-700">
          <button
            onClick={() => onApprove?.(toolCall.id)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-emerald-500 hover:bg-emerald-500/10 transition-colors"
          >
            <Check className="h-4 w-4" />
            <span className="text-sm">Approve</span>
          </button>
          <div className="w-px bg-zinc-700" />
          <button
            onClick={() => onReject?.(toolCall.id)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="text-sm">Reject</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Proposal Card ─────────────────────────────────────────

interface ProposalCardProps {
  proposal: ActionProposal
  onApprove?: (proposalId: string) => void
  onReject?: (proposalId: string, reason: string) => void
}

function ProposalCard({ proposal, onApprove, onReject }: ProposalCardProps) {
  const [expanded, setExpanded] = useState(true)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  const canApprove = proposal.status === 'pending_review'
  const allChecksPassed = proposal.checksRequired.every((c) =>
    proposal.checksPassed.includes(c)
  )

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50">
        <div className="flex items-center gap-3">
          <GitPullRequest className="h-5 w-5 text-amber-500" />
          <div>
            <h4 className="text-sm font-medium text-zinc-100">{proposal.title}</h4>
            <p className="text-xs text-zinc-500">
              {proposal.sourceBranch} → {proposal.targetBranch}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2 py-0.5 text-xs font-medium text-white rounded',
              PROPOSAL_STATUS_COLORS[proposal.status]
            )}
          >
            {proposal.status.replace('_', ' ')}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-zinc-700 rounded"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-zinc-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* Description */}
          <div className="px-4 py-3 border-t border-zinc-700">
            <p className="text-sm text-zinc-300">{proposal.description}</p>
          </div>

          {/* Changes */}
          <div className="px-4 py-3 border-t border-zinc-700">
            <p className="text-xs text-zinc-500 mb-2">
              Proposed Changes ({proposal.actions.length})
            </p>
            <div className="space-y-2">
              {proposal.actions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <FileText className="h-4 w-4 text-zinc-500" />
                  <span className="text-zinc-300">{action.target}</span>
                  <span className="text-zinc-500">- {action.reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Checks */}
          <div className="px-4 py-3 border-t border-zinc-700">
            <p className="text-xs text-zinc-500 mb-2">Required Checks</p>
            <div className="flex flex-wrap gap-2">
              {proposal.checksRequired.map((check) => {
                const passed = proposal.checksPassed.includes(check)
                const failed = proposal.checksFailed.includes(check)

                return (
                  <span
                    key={check}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 text-xs rounded',
                      passed
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : failed
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-zinc-700 text-zinc-400'
                    )}
                  >
                    {passed ? (
                      <Check className="h-3 w-3" />
                    ) : failed ? (
                      <X className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {check}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          {canApprove && (
            <div className="px-4 py-3 border-t border-zinc-700">
              {!allChecksPassed && (
                <div className="flex items-center gap-2 mb-3 text-amber-500 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Waiting for all checks to pass</span>
                </div>
              )}

              {showRejectInput ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-100"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!rejectReason.trim()) return
                        onReject?.(proposal.id, rejectReason.trim())
                        setShowRejectInput(false)
                        setRejectReason('')
                      }}
                      disabled={!rejectReason.trim()}
                      className={cn(
                        'flex-1 px-3 py-2 rounded transition-colors text-sm',
                        rejectReason.trim()
                          ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                          : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                      )}
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => setShowRejectInput(false)}
                      className="px-3 py-2 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => onApprove?.(proposal.id)}
                    disabled={!allChecksPassed}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded transition-colors text-sm',
                      allChecksPassed
                        ? 'bg-emerald-500 text-black hover:bg-emerald-600'
                        : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                    )}
                  >
                    <Check className="h-4 w-4" />
                    Approve & Merge
                  </button>
                  <button
                    onClick={() => setShowRejectInput(true)}
                    className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 transition-colors text-sm"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Status Badge ──────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-500',
    approved: 'bg-emerald-500/10 text-emerald-500',
    rejected: 'bg-red-500/10 text-red-500',
    executing: 'bg-blue-500/10 text-blue-500',
    completed: 'bg-emerald-500/10 text-emerald-500',
    failed: 'bg-red-500/10 text-red-500',
  }

  return (
    <span
      className={cn(
        'px-1.5 py-0.5 text-xs rounded',
        colors[status] ?? 'bg-zinc-700 text-zinc-400'
      )}
    >
      {status}
    </span>
  )
}

export default ChatAssistant
