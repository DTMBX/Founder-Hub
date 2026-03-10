/**
 * ChatPanel — Copilot-style natural language interface for the DevCustomizer.
 *
 * Features:
 *  - Chat history with user/assistant messages
 *  - File context awareness (mention @file to set context)
 *  - Quick commands: /edit, /search, /open, /diff
 *  - Integrates with workspace API to read/write files
 *  - Generates diffs and applies edits on confirmation
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { workspaceApi, type SearchHit } from '@/lib/workspace-api'
import { useKV, isLocalhost } from '@/lib/local-storage-kv'
import type { Section } from '@/lib/types'
import {
  PaperPlaneRight,
  Trash,
  Robot,
  User,
  FileText,
  Lightning,
  CheckCircle,
  XCircle,
  ArrowCounterClockwise,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  getAiStatus,
  chatStream,
  type AiMessage,
  type AiStatus,
} from '@/lib/ai-service'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  fileContext?: string
  action?: ChatAction
}

interface ChatAction {
  type: 'show-file' | 'search-results' | 'diff' | 'applied' | 'error'
  file?: string
  content?: string
  original?: string
  results?: SearchHit[]
}

// ─── Command parser ─────────────────────────────────────────────────────────

interface ParsedCommand {
  command: string
  args: string
  file?: string
}

function parseCommand(input: string): ParsedCommand | null {
  const trim = input.trim()

  // /command args
  if (trim.startsWith('/')) {
    const spaceIdx = trim.indexOf(' ')
    if (spaceIdx === -1) return { command: trim.slice(1), args: '' }
    return {
      command: trim.slice(1, spaceIdx),
      args: trim.slice(spaceIdx + 1).trim(),
    }
  }

  // @file context reference
  const fileMatch = trim.match(/@([\w\-./]+)/)
  if (fileMatch) {
    return {
      command: 'context',
      args: trim.replace(/@[\w\-./]+/, '').trim(),
      file: fileMatch[1],
    }
  }

  return null
}

// ─── Quick-action command definitions ───────────────────────────────────────

const QUICK_COMMANDS = [
  { cmd: '/open', desc: 'Open a file', example: '/open Founder-Hub/src/App.tsx' },
  { cmd: '/search', desc: 'Search across repo', example: '/search useKV' },
  { cmd: '/edit', desc: 'Edit current file', example: '/edit replace "old" with "new"' },
  { cmd: '/diff', desc: 'Show unsaved changes', example: '/diff' },
  { cmd: '/save', desc: 'Save current file', example: '/save' },
  { cmd: '/list', desc: 'List directory', example: '/list Founder-Hub/src/components' },
  { cmd: '/ask', desc: 'Ask AI a question', example: '/ask how do I add a new section?' },
  { cmd: '/sections', desc: 'List all content sections', example: '/sections' },
  { cmd: '/toggle', desc: 'Toggle section visibility/investor', example: '/toggle about enabled' },
  { cmd: '/publish', desc: 'Save sections to disk', example: '/publish' },
]

// ─── Component ──────────────────────────────────────────────────────────────

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('dev-chat-history')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [input, setInput] = useState('')
  const [contextFile, setContextFile] = useState<string | null>(null)
  const [contextContent, setContextContent] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [showCommands, setShowCommands] = useState(false)
  const [aiStatus, setAiStatus] = useState<AiStatus>({ available: false, model: null, models: [] })
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Check AI status on mount
  useEffect(() => {
    getAiStatus().then(setAiStatus)
  }, [])

  // Content management integration — shared KV store with ContentManager
  const [sections, setSections] = useKV<Section[]>('founder-hub-sections', [])

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Save history to session
  useEffect(() => {
    sessionStorage.setItem(
      'dev-chat-history',
      JSON.stringify(messages.slice(-50)),
    )
  }, [messages])

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  const addMessage = useCallback(
    (role: ChatMessage['role'], content: string, action?: ChatAction) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role,
          content,
          timestamp: Date.now(),
          fileContext: contextFile || undefined,
          action,
        },
      ])
    },
    [contextFile],
  )

  // ─── Command handlers ─────────────────────────────────────────────────

  const handleOpen = async (filePath: string) => {
    try {
      const { content } = await workspaceApi.read(filePath)
      setContextFile(filePath)
      setContextContent(content)
      const lines = content.split('\n').length
      addMessage('assistant', `Opened **${filePath}** (${lines} lines)`, {
        type: 'show-file',
        file: filePath,
        content:
          content.split('\n').slice(0, 30).join('\n') +
          (lines > 30 ? `\n... (${lines - 30} more lines)` : ''),
      })
    } catch (e: unknown) {
      addMessage('assistant', `Failed to open: ${errMsg(e)}`, {
        type: 'error',
      })
    }
  }

  const handleSearch = async (query: string) => {
    const repo = contextFile?.split('/')[0] || 'Founder-Hub'
    try {
      const { results, capped } = await workspaceApi.search(query, repo)
      const summary =
        results.length === 0
          ? `No results for "${query}" in ${repo}`
          : `Found ${results.length}${capped ? '+' : ''} matches for "${query}" in ${repo}`
      addMessage('assistant', summary, {
        type: 'search-results',
        results,
      })
    } catch (e: unknown) {
      addMessage('assistant', `Search failed: ${errMsg(e)}`, {
        type: 'error',
      })
    }
  }

  const handleEdit = async (instruction: string) => {
    if (!contextFile || !contextContent) {
      addMessage(
        'assistant',
        'No file in context. Use `/open <path>` first.',
        { type: 'error' },
      )
      return
    }

    // Parse simple edit instructions
    const replaceMatch = instruction.match(
      /replace\s+["'](.+?)["']\s+with\s+["'](.+?)["']/i,
    )
    if (replaceMatch) {
      const [, oldText, newText] = replaceMatch
      if (!contextContent.includes(oldText)) {
        addMessage(
          'assistant',
          `Could not find "${oldText}" in ${contextFile}`,
          { type: 'error' },
        )
        return
      }
      const newContent = contextContent.replace(oldText, newText)
      setContextContent(newContent)
      addMessage(
        'assistant',
        `Replaced "${oldText}" → "${newText}" in ${contextFile}\n\nUse \`/save\` to write to disk or \`/diff\` to review.`,
        {
          type: 'diff',
          file: contextFile,
          original: contextContent,
          content: newContent,
        },
      )
      return
    }

    // Insert instruction
    const insertMatch = instruction.match(
      /insert\s+["'](.+?)["']\s+(before|after)\s+["'](.+?)["']/i,
    )
    if (insertMatch) {
      const [, text, position, anchor] = insertMatch
      if (!contextContent.includes(anchor)) {
        addMessage(
          'assistant',
          `Could not find "${anchor}" in ${contextFile}`,
          { type: 'error' },
        )
        return
      }
      const newContent =
        position === 'before'
          ? contextContent.replace(anchor, `${text}\n${anchor}`)
          : contextContent.replace(anchor, `${anchor}\n${text}`)
      setContextContent(newContent)
      addMessage(
        'assistant',
        `Inserted text ${position} "${anchor}"\n\nUse \`/save\` to write or \`/diff\` to review.`,
        {
          type: 'diff',
          file: contextFile,
          original: contextContent,
          content: newContent,
        },
      )
      return
    }

    // Delete instruction
    const deleteMatch = instruction.match(/delete\s+["'](.+?)["']/i)
    if (deleteMatch) {
      const [, text] = deleteMatch
      if (!contextContent.includes(text)) {
        addMessage(
          'assistant',
          `Could not find "${text}" in ${contextFile}`,
          { type: 'error' },
        )
        return
      }
      const newContent = contextContent.replace(text, '')
      setContextContent(newContent)
      addMessage(
        'assistant',
        `Deleted "${text}" from ${contextFile}\n\nUse \`/save\` to write or \`/diff\` to review.`,
        {
          type: 'diff',
          file: contextFile,
          original: contextContent,
          content: newContent,
        },
      )
      return
    }

    addMessage(
      'assistant',
      'Edit format not recognized. Try:\n' +
        '- `/edit replace "old text" with "new text"`\n' +
        '- `/edit insert "new line" before "anchor text"`\n' +
        '- `/edit delete "text to remove"`',
      { type: 'error' },
    )
  }

  const handleDiff = () => {
    if (!contextFile || !contextContent) {
      addMessage('assistant', 'No file in context.', { type: 'error' })
      return
    }
    addMessage(
      'assistant',
      `Current in-memory state of ${contextFile} — use \`/save\` to persist.`,
      {
        type: 'show-file',
        file: contextFile,
        content: contextContent.split('\n').slice(0, 50).join('\n'),
      },
    )
  }

  const handleSave = async () => {
    if (!contextFile || !contextContent) {
      addMessage('assistant', 'No file in context.', { type: 'error' })
      return
    }
    try {
      await workspaceApi.write(contextFile, contextContent)
      addMessage('assistant', `Saved **${contextFile}** to disk.`, {
        type: 'applied',
        file: contextFile,
      })
    } catch (e: unknown) {
      addMessage('assistant', `Save failed: ${errMsg(e)}`, { type: 'error' })
    }
  }

  const handleList = async (dirPath: string) => {
    try {
      const entries = await workspaceApi.list(dirPath)
      const listing = entries
        .map((e) => `${e.isDir ? '\u{1F4C1}' : '\u{1F4C4}'} ${e.name}`)
        .join('\n')
      addMessage('assistant', `**${dirPath}**\n\n${listing || '(empty)'}`)
    } catch (e: unknown) {
      addMessage('assistant', `List failed: ${errMsg(e)}`, { type: 'error' })
    }
  }

  // ─── Content management commands ────────────────────────────────────

  const handleSections = () => {
    const sorted = [...(sections || [])].sort((a, b) => a.order - b.order)
    if (sorted.length === 0) {
      addMessage('assistant', 'No sections found. Open the Content Management panel to add sections.')
      return
    }
    const listing = sorted.map((s, i) => {
      const vis = s.enabled ? '\u2705' : '\u274C'
      const inv = s.investorRelevant ? ' \u{1F4B0}' : ''
      return `${i + 1}. **${s.title}** (${s.type}) — ${vis}${inv}`
    }).join('\n')
    addMessage('assistant', `**Content Sections** (${sorted.length})\n\n${listing}\n\nUse \`/toggle <type> enabled\` or \`/toggle <type> investor\` to change.`)
  }

  const handleToggle = (args: string) => {
    const parts = args.trim().split(/\s+/)
    if (parts.length < 2) {
      addMessage('assistant', 'Usage: `/toggle <section-type-or-id> <enabled|investor>`\n\nExamples:\n- `/toggle about enabled`\n- `/toggle projects investor`', { type: 'error' })
      return
    }
    const [target, field] = parts
    const section = (sections || []).find(s => s.id === target || s.type === target)
    if (!section) {
      addMessage('assistant', `Section "${target}" not found. Use \`/sections\` to list them.`, { type: 'error' })
      return
    }
    if (field === 'enabled') {
      const newVal = !section.enabled
      setSections(prev => (prev || []).map(s => s.id === section.id ? { ...s, enabled: newVal } : s))
      addMessage('assistant', `**${section.title}** visibility toggled to **${newVal ? 'ON' : 'OFF'}**.\nUse \`/publish\` to save to disk.`, { type: 'applied' })
    } else if (field === 'investor') {
      const newVal = !section.investorRelevant
      setSections(prev => (prev || []).map(s => s.id === section.id ? { ...s, investorRelevant: newVal } : s))
      addMessage('assistant', `**${section.title}** investor relevance toggled to **${newVal ? 'ON' : 'OFF'}**.\nUse \`/publish\` to save to disk.`, { type: 'applied' })
    } else {
      addMessage('assistant', `Unknown field "${field}". Use \`enabled\` or \`investor\`.`, { type: 'error' })
    }
  }

  const handlePublishSections = async () => {
    if (!isLocalhost()) {
      addMessage('assistant', 'Disk save only available in dev mode (localhost).', { type: 'error' })
      return
    }
    try {
      const json = JSON.stringify(sections, null, 2)
      await workspaceApi.write('Founder-Hub/public/data/sections.json', json)
      addMessage('assistant', `Saved **sections.json** to disk (${(sections || []).length} sections).`, { type: 'applied' })
    } catch (e: unknown) {
      addMessage('assistant', `Publish failed: ${errMsg(e)}`, { type: 'error' })
    }
  }

  // ─── AI Chat handler (streaming) ──────────────────────────────────────

  const handleAiChat = async (userText: string) => {
    const status = await getAiStatus()
    setAiStatus(status)

    if (!status.available || !status.model) {
      addMessage(
        'assistant',
        `**AI Offline** — Ollama not detected.\n\nTo enable AI:\n1. Run \`ollama serve\` in a terminal\n2. Pull a model: \`ollama pull qwen2.5-coder:7b\`\n\nMeanwhile, here are my commands:\n\n` +
          QUICK_COMMANDS.map((c) => `**${c.cmd}** — ${c.desc}`).join('\n'),
        { type: 'error' },
      )
      return
    }

    // Build conversation context for AI
    const aiMessages: AiMessage[] = []

    // Add file context if available
    if (contextFile && contextContent) {
      aiMessages.push({
        role: 'user',
        content: `Current file context: ${contextFile}\n\n\`\`\`\n${contextContent.slice(0, 8000)}\n\`\`\``,
      })
      aiMessages.push({
        role: 'assistant',
        content: `I have ${contextFile} loaded (${contextContent.split('\n').length} lines). How can I help?`,
      })
    }

    // Add recent conversation history for context
    const recentMsgs = messages.slice(-10)
    for (const msg of recentMsgs) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        aiMessages.push({ role: msg.role, content: msg.content })
      }
    }

    // Add the current user message
    aiMessages.push({ role: 'user', content: userText })

    // Create a placeholder message for streaming
    const responseId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      {
        id: responseId,
        role: 'assistant' as const,
        content: '',
        timestamp: Date.now(),
        fileContext: contextFile || undefined,
      },
    ])
    setStreamingId(responseId)

    // Abort any previous stream
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      let accumulated = ''
      for await (const chunk of chatStream({
        messages: aiMessages,
        signal: controller.signal,
      })) {
        accumulated += chunk.content
        setMessages((prev) =>
          prev.map((m) =>
            m.id === responseId ? { ...m, content: accumulated } : m,
          ),
        )
      }
    } catch (e: unknown) {
      if ((e as Error).name === 'AbortError') return
      setMessages((prev) =>
        prev.map((m) =>
          m.id === responseId
            ? { ...m, content: m.content || `AI error: ${errMsg(e)}`, action: { type: 'error' } }
            : m,
        ),
      )
    } finally {
      setStreamingId(null)
      abortRef.current = null
    }
  }

  // ─── Submit handler ───────────────────────────────────────────────────

  const handleSubmit = async () => {
    const trim = input.trim()
    if (!trim) return

    addMessage('user', trim)
    setInput('')
    setProcessing(true)

    try {
      const parsed = parseCommand(trim)

      if (parsed) {
        switch (parsed.command) {
          case 'open':
            await handleOpen(parsed.args)
            break
          case 'search':
            await handleSearch(parsed.args)
            break
          case 'edit':
            await handleEdit(parsed.args)
            break
          case 'diff':
            handleDiff()
            break
          case 'save':
            await handleSave()
            break
          case 'list':
            await handleList(parsed.args)
            break
          case 'sections':
            handleSections()
            break
          case 'toggle':
            handleToggle(parsed.args)
            break
          case 'publish':
            await handlePublishSections()
            break
          case 'context':
            if (parsed.file) await handleOpen(parsed.file)
            if (parsed.args) {
              addMessage(
                'assistant',
                `Context set to ${parsed.file}. "${parsed.args}" — use /edit to modify or /search to find.`,
              )
            }
            break
          case 'ask':
            await handleAiChat(parsed.args)
            break
          default:
            // Unknown slash command — try AI as fallback
            await handleAiChat(`/${parsed.command} ${parsed.args}`.trim())
        }
      } else {
        // Free-form text — route through AI if available
        await handleAiChat(trim)
      }
    } catch (e: unknown) {
      addMessage('assistant', `Error: ${errMsg(e)}`, { type: 'error' })
    } finally {
      setProcessing(false)
    }
  }

  const clearHistory = () => {
    setMessages([])
    setContextFile(null)
    setContextContent(null)
    sessionStorage.removeItem('dev-chat-history')
  }

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full max-h-[60vh]">
      {/* Header with context */}
      <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2">
        <Robot className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium flex items-center gap-1.5">
            Workspace Chat
            <span className={cn(
              'inline-block h-1.5 w-1.5 rounded-full',
              aiStatus.available ? 'bg-emerald-400' : 'bg-muted-foreground/40',
            )} title={aiStatus.available ? `AI: ${aiStatus.model}` : 'AI offline — run `ollama serve`'} />
            {aiStatus.available && (
              <span className="text-[8px] text-emerald-400/70 font-mono">{aiStatus.model?.split(':')[0]}</span>
            )}
          </p>
          {contextFile ? (
            <p className="text-[9px] text-muted-foreground font-mono truncate flex items-center gap-1">
              <FileText className="h-2.5 w-2.5 inline" /> {contextFile}
              <button
                onClick={() => {
                  setContextFile(null)
                  setContextContent(null)
                }}
                className="ml-1 text-muted-foreground/50 hover:text-foreground"
              >
                <XCircle className="h-2.5 w-2.5" />
              </button>
            </p>
          ) : (
            <p className="text-[9px] text-muted-foreground">
              No file context — use /open
            </p>
          )}
        </div>
        <button
          onClick={clearHistory}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent/10"
          title="Clear chat"
        >
          <Trash className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.length === 0 && (
          <div className="py-6 text-center space-y-3">
            <Robot className="h-8 w-8 mx-auto text-muted-foreground/30" />
            <p className="text-[10px] text-muted-foreground">
              {aiStatus.available
                ? 'AI-powered workspace editor. Ask anything or use commands.'
                : 'Edit files with commands. Start `ollama serve` for AI chat.'}
            </p>
            <div className="space-y-1">
              {QUICK_COMMANDS.slice(0, 4).map((c) => (
                <button
                  key={c.cmd}
                  onClick={() => {
                    setInput(c.example)
                    inputRef.current?.focus()
                  }}
                  className="block mx-auto text-[10px] font-mono text-primary/60 hover:text-primary"
                >
                  {c.example}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex gap-2', msg.role === 'user' && 'justify-end')}
          >
            {msg.role !== 'user' && (
              <div
                className={cn(
                  'shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[9px]',
                  msg.role === 'assistant'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <Robot className="h-3 w-3" />
              </div>
            )}

            <div
              className={cn(
                'max-w-[85%] rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary/15 text-foreground'
                  : 'bg-card/50 border border-border/30 text-foreground',
              )}
            >
              {/* Message text — render basic markdown bold */}
              <div className="whitespace-pre-wrap break-words">
                {msg.content.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                  part.startsWith('**') && part.endsWith('**') ? (
                    <strong key={i}>{part.slice(2, -2)}</strong>
                  ) : (
                    <span key={i}>{part}</span>
                  ),
                )}
              </div>

              {/* Action attachments */}
              {msg.action?.type === 'show-file' && msg.action.content && (
                <pre className="mt-2 p-2 rounded bg-background/80 border border-border/20 text-[9px] font-mono overflow-x-auto max-h-40 overflow-y-auto whitespace-pre">
                  {msg.action.content}
                </pre>
              )}

              {msg.action?.type === 'search-results' &&
                msg.action.results && (
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {msg.action.results.slice(0, 10).map((hit, i) => (
                      <button
                        key={i}
                        onClick={() => handleOpen(hit.file)}
                        className="block w-full text-left px-1.5 py-1 rounded hover:bg-accent/10 text-[9px]"
                      >
                        <span className="font-mono text-blue-400">
                          {hit.file}:{hit.line}
                        </span>
                        <span className="block text-muted-foreground truncate">
                          {hit.text}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

              {msg.action?.type === 'diff' && (
                <div className="mt-2 flex gap-1">
                  <button
                    onClick={handleSave}
                    className="px-2 py-1 rounded text-[9px] font-medium bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                  >
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    Apply & Save
                  </button>
                  <button
                    onClick={() => {
                      if (msg.action?.original) {
                        setContextContent(msg.action.original)
                        toast('Reverted changes')
                      }
                    }}
                    className="px-2 py-1 rounded text-[9px] font-medium bg-destructive/20 text-destructive hover:bg-destructive/30"
                  >
                    <ArrowCounterClockwise className="h-3 w-3 inline mr-1" />
                    Revert
                  </button>
                </div>
              )}

              {msg.action?.type === 'applied' && (
                <div className="mt-1 flex items-center gap-1 text-emerald-400 text-[9px]">
                  <CheckCircle className="h-3 w-3" /> Written to disk
                </div>
              )}

              {msg.action?.type === 'error' && (
                <div className="mt-1 flex items-center gap-1 text-destructive text-[9px]">
                  <XCircle className="h-3 w-3" /> Error
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="shrink-0 h-5 w-5 rounded-full flex items-center justify-center bg-accent/20 text-accent text-[9px]">
                <User className="h-3 w-3" />
              </div>
            )}
          </div>
        ))}

        {(processing || streamingId) && !streamingId && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Robot className="h-4 w-4 animate-pulse text-primary" />
            Processing…
          </div>
        )}
        {streamingId && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Robot className="h-4 w-4 animate-pulse text-primary" />
            <span>Generating…</span>
            <button
              onClick={() => abortRef.current?.abort()}
              className="text-[9px] text-destructive hover:underline"
            >
              Stop
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-2 py-2 border-t border-border/40">
        {showCommands && (
          <div className="mb-2 p-2 rounded-lg bg-card/40 border border-border/30 space-y-1">
            {QUICK_COMMANDS.map((c) => (
              <button
                key={c.cmd}
                onClick={() => {
                  setInput(c.cmd + ' ')
                  setShowCommands(false)
                  inputRef.current?.focus()
                }}
                className="flex items-center gap-2 w-full px-2 py-1 rounded text-[10px] hover:bg-accent/10 text-left"
              >
                <Lightning className="h-3 w-3 text-primary shrink-0" />
                <span className="font-mono font-medium">{c.cmd}</span>
                <span className="text-muted-foreground flex-1">
                  {c.desc}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-1">
          <button
            onClick={() => setShowCommands((p) => !p)}
            className={cn(
              'p-1.5 rounded-md shrink-0 transition-colors',
              showCommands
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/10',
            )}
            title="Show commands"
          >
            <Lightning className="h-3.5 w-3.5" />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder="/open Founder-Hub/src/App.tsx"
            rows={1}
            className="flex-1 min-h-[28px] max-h-20 rounded-md border border-border/40 bg-card/40 px-2 py-1.5 text-[11px] resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || processing}
            className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-30 shrink-0"
          >
            <PaperPlaneRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
