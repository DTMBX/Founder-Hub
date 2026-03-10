/**
 * ai-service.ts — Unified AI client for the DevCustomizer.
 *
 * Prioritizes local Ollama (offline-first), falls back to browser-side
 * heuristics when AI is unavailable. All calls go through the Vite
 * dev-server proxy at /__ai/ to avoid CORS.
 *
 * Features:
 *  - Chat completions (streaming)
 *  - Code completions (inline suggestions)
 *  - Code explanation / refactoring
 *  - Status detection (is Ollama running?)
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiCompletionOptions {
  messages: AiMessage[]
  /** Model to use — defaults to qwen2.5-coder:7b */
  model?: string
  /** Max tokens to generate */
  maxTokens?: number
  /** Temperature (0-1, lower = more deterministic) */
  temperature?: number
  /** Abort signal for cancellation */
  signal?: AbortSignal
}

export interface AiStreamChunk {
  content: string
  done: boolean
}

export interface AiStatus {
  available: boolean
  model: string | null
  models: string[]
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_MODEL = 'qwen2.5-coder:7b'

const SYSTEM_PROMPT = `You are an expert coding assistant embedded in a local development environment for the Evident ecosystem — a network of web apps (Founder-Hub, Tillerstead, Civics-Hierarchy, etc.) built with React 19, TypeScript, Tailwind CSS 4, shadcn/ui, and Vite.

You help with:
- Editing files across workspace repos
- Explaining code, debugging, refactoring
- Generating new components, hooks, styles
- Content management (sections, offerings, navigation)

Be concise and direct. Respond with code when appropriate. Use markdown formatting.
When suggesting edits, use the format: \`/edit replace "old" with "new"\` so the user can apply them through the chat commands.`

// ─── Status check ───────────────────────────────────────────────────────────

let cachedStatus: AiStatus | null = null
let statusCheckedAt = 0

export async function getAiStatus(force = false): Promise<AiStatus> {
  const now = Date.now()
  if (!force && cachedStatus && now - statusCheckedAt < 30_000) {
    return cachedStatus
  }

  try {
    const res = await fetch('/__ai/tags', { signal: AbortSignal.timeout(3000) })
    if (!res.ok) throw new Error('Ollama not reachable')

    const data = await res.json()
    const models: string[] = (data.models || []).map(
      (m: { name: string }) => m.name,
    )
    const preferred =
      models.find((m) => m.startsWith('qwen2.5-coder')) ||
      models.find((m) => m.includes('coder')) ||
      models[0] ||
      null

    cachedStatus = { available: true, model: preferred, models }
    statusCheckedAt = now
    return cachedStatus
  } catch {
    cachedStatus = { available: false, model: null, models: [] }
    statusCheckedAt = now
    return cachedStatus
  }
}

// ─── Chat completion (non-streaming) ────────────────────────────────────────

export async function chatComplete(
  opts: AiCompletionOptions,
): Promise<string> {
  const status = await getAiStatus()
  if (!status.available || !status.model) {
    throw new Error(
      'AI unavailable — ensure Ollama is running (`ollama serve`)',
    )
  }

  const res = await fetch('/__ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: opts.signal,
    body: JSON.stringify({
      model: opts.model || status.model || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...opts.messages,
      ],
      stream: false,
      options: {
        num_predict: opts.maxTokens || 2048,
        temperature: opts.temperature ?? 0.3,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AI error (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.message?.content || ''
}

// ─── Streaming chat completion ──────────────────────────────────────────────

export async function* chatStream(
  opts: AiCompletionOptions,
): AsyncGenerator<AiStreamChunk> {
  const status = await getAiStatus()
  if (!status.available || !status.model) {
    throw new Error('AI unavailable — ensure Ollama is running')
  }

  const res = await fetch('/__ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: opts.signal,
    body: JSON.stringify({
      model: opts.model || status.model || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...opts.messages,
      ],
      stream: true,
      options: {
        num_predict: opts.maxTokens || 2048,
        temperature: opts.temperature ?? 0.3,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AI error (${res.status}): ${text}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const json = JSON.parse(line)
        yield {
          content: json.message?.content || '',
          done: json.done || false,
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  // Process remaining buffer
  if (buffer.trim()) {
    try {
      const json = JSON.parse(buffer)
      yield {
        content: json.message?.content || '',
        done: json.done || false,
      }
    } catch {
      // skip
    }
  }
}

// ─── Code completion (for editor inline suggestions) ────────────────────────

export async function codeComplete(
  prefix: string,
  suffix: string,
  language: string,
  signal?: AbortSignal,
): Promise<string> {
  const status = await getAiStatus()
  if (!status.available || !status.model) return ''

  try {
    const res = await fetch('/__ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: signal || AbortSignal.timeout(10000),
      body: JSON.stringify({
        model: status.model || DEFAULT_MODEL,
        prompt: `<|fim_prefix|>${prefix}<|fim_suffix|>${suffix}<|fim_middle|>`,
        stream: false,
        options: {
          num_predict: 256,
          temperature: 0.2,
          stop: ['\n\n', '<|fim_', '<|end'],
        },
      }),
    })

    if (!res.ok) return ''
    const data = await res.json()
    return data.response || ''
  } catch {
    return ''
  }
}

// ─── Convenience helpers ────────────────────────────────────────────────────

export async function explainCode(
  code: string,
  language: string,
  signal?: AbortSignal,
): Promise<string> {
  return chatComplete({
    messages: [
      {
        role: 'user',
        content: `Explain this ${language} code concisely:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      },
    ],
    temperature: 0.3,
    signal,
  })
}

export async function refactorCode(
  code: string,
  instruction: string,
  language: string,
  signal?: AbortSignal,
): Promise<string> {
  return chatComplete({
    messages: [
      {
        role: 'user',
        content: `Refactor this ${language} code. Instruction: ${instruction}\n\nReturn ONLY the refactored code, no explanation.\n\n\`\`\`${language}\n${code}\n\`\`\``,
      },
    ],
    temperature: 0.2,
    signal,
  })
}

export async function generateCode(
  prompt: string,
  language: string,
  signal?: AbortSignal,
): Promise<string> {
  return chatComplete({
    messages: [
      {
        role: 'user',
        content: `Generate ${language} code for: ${prompt}\n\nReturn ONLY the code, no explanation.`,
      },
    ],
    temperature: 0.3,
    signal,
  })
}
