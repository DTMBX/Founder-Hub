/**
 * B12-04 — Anthropic Provider Adapter
 *
 * Requires ANTHROPIC_API_KEY in environment (never stored in repo).
 * Uses the Messages API with structured output.
 */

import type { IProvider, ProviderRequest, ProviderResponse } from './IProvider';
import { getOpsAuditLogger } from '../../automation/audit/OpsAuditLogger';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

export class AnthropicProvider implements IProvider {
  readonly name = 'anthropic';
  readonly requiresApiKey = true;

  private getApiKey(): string | undefined {
    if (typeof process !== 'undefined' && process.env) {
      return process.env['ANTHROPIC_API_KEY'];
    }
    return undefined;
  }

  isAvailable(): boolean {
    return !!this.getApiKey();
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return this.fallbackResponse('Anthropic API key not configured.');
    }

    const systemPrompt = this.buildSystemPrompt(request);

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          max_tokens: request.maxTokens ?? 1024,
          system: systemPrompt,
          messages: request.messages.filter((m) => m.role !== 'system'),
        }),
      });

      if (!response.ok) {
        await this.auditError('Anthropic API error', response.status);
        return this.fallbackResponse(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json() as {
        content: { type: string; text: string }[];
        usage?: { input_tokens: number; output_tokens: number };
      };

      const content = data.content
        ?.filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('') ?? '';

      let parsed: unknown = null;
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch { /* not valid JSON */ }
      }

      await this.auditUsage(data.usage?.input_tokens ?? 0, data.usage?.output_tokens ?? 0);

      return {
        content,
        parsed,
        usage: data.usage ? {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
        } : undefined,
        provider: 'anthropic',
        model: DEFAULT_MODEL,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.auditError(msg, 0);
      return this.fallbackResponse(`Anthropic request failed: ${msg}`);
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
      provider: 'anthropic',
      model: DEFAULT_MODEL,
    };
  }

  private async auditUsage(inputTokens: number, outputTokens: number): Promise<void> {
    try {
      const auditLogger = getOpsAuditLogger();
      await auditLogger.log({
        category: 'console.action',
        severity: 'info',
        actor: 'system',
        description: 'Anthropic provider usage',
        payload: { provider: 'anthropic', inputTokens, outputTokens },
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
        description: 'Anthropic provider error',
        payload: { provider: 'anthropic', error, statusCode },
      });
    } catch { /* audit is best-effort */ }
  }
}
