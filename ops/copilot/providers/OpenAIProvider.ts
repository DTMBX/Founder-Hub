/**
 * B12-04 — OpenAI Provider Adapter
 *
 * Requires OPENAI_API_KEY in environment (never stored in repo).
 * Uses the chat completions API with structured output.
 */

import type { IProvider, ProviderRequest, ProviderResponse } from './IProvider';
import { getOpsAuditLogger } from '../../automation/audit/OpsAuditLogger';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o';

export class OpenAIProvider implements IProvider {
  readonly name = 'openai';
  readonly requiresApiKey = true;

  private getApiKey(): string | undefined {
    if (typeof process !== 'undefined' && process.env) {
      return process.env['OPENAI_API_KEY'];
    }
    return undefined;
  }

  isAvailable(): boolean {
    return !!this.getApiKey();
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return this.fallbackResponse('OpenAI API key not configured.');
    }

    const systemPrompt = this.buildSystemPrompt(request);
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...request.messages,
    ];

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages,
          max_tokens: request.maxTokens ?? 1024,
          temperature: 0,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        await this.auditError('OpenAI API error', response.status);
        return this.fallbackResponse(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json() as {
        choices: { message: { content: string } }[];
        usage?: { prompt_tokens: number; completion_tokens: number };
      };

      const content = data.choices?.[0]?.message?.content ?? '';
      let parsed: unknown = null;

      try {
        parsed = JSON.parse(content);
      } catch {
        // Content is not valid JSON — return as text
      }

      // Audit usage metadata (no prompt content)
      await this.auditUsage(data.usage?.prompt_tokens ?? 0, data.usage?.completion_tokens ?? 0);

      return {
        content,
        parsed,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
        } : undefined,
        provider: 'openai',
        model: DEFAULT_MODEL,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.auditError(msg, 0);
      return this.fallbackResponse(`OpenAI request failed: ${msg}`);
    }
  }

  private buildSystemPrompt(request: ProviderRequest): string {
    const catalogText = request.commandCatalog
      .map((c) => `- ${c.id}: ${c.description} (side_effects: ${c.side_effects})`)
      .join('\n');

    return `${request.system}

Available commands:
${catalogText}

Respond with a JSON object containing:
{
  "proposed_commands": [{ "command_id": "...", "args": {...} }]
}

Only propose commands from the list above. If the user's request does not match any command, return an empty proposed_commands array.`;
  }

  private fallbackResponse(reason: string): ProviderResponse {
    return {
      content: reason,
      parsed: { proposed_commands: [] },
      provider: 'openai',
      model: DEFAULT_MODEL,
    };
  }

  private async auditUsage(promptTokens: number, completionTokens: number): Promise<void> {
    try {
      const auditLogger = getOpsAuditLogger();
      await auditLogger.log({
        category: 'console.action',
        severity: 'info',
        actor: 'system',
        description: 'OpenAI provider usage',
        payload: { provider: 'openai', promptTokens, completionTokens },
      });
    } catch { /* audit is best-effort */ }
  }

  private async auditError(error: string, statusCode: number): Promise<void> {
    try {
      const auditLogger = getOpsAuditLogger();
      await auditLogger.log({
        category: 'system.error',
        severity: 'error',
        actor: 'system',
        description: 'OpenAI provider error',
        payload: { provider: 'openai', error, statusCode },
      });
    } catch { /* audit is best-effort */ }
  }
}
