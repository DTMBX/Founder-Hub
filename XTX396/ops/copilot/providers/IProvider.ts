/**
 * B12-04 — AI Provider Interface
 *
 * All AI providers must implement this interface.
 * The copilot is provider-agnostic — swap providers without changing policy logic.
 */

import type { CommandRegistry } from '../../runner/commands/validateRegistry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderRequest {
  system: string;
  messages: ProviderMessage[];
  commandCatalog: CommandCatalogEntry[];
  maxTokens?: number;
}

export interface CommandCatalogEntry {
  id: string;
  description: string;
  args_schema: Record<string, unknown>;
  side_effects: string;
}

export interface ProviderResponse {
  content: string;
  parsed: unknown | null;
  usage?: { promptTokens: number; completionTokens: number };
  provider: string;
  model: string;
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IProvider {
  readonly name: string;
  readonly requiresApiKey: boolean;

  /**
   * Send a request to the AI provider and return the response.
   * Must not throw for recoverable errors — return a safe fallback response.
   */
  complete(request: ProviderRequest): Promise<ProviderResponse>;

  /**
   * Check if the provider is available (has required config/keys).
   */
  isAvailable(): boolean;
}

// ---------------------------------------------------------------------------
// Helper: build command catalog from registry
// ---------------------------------------------------------------------------

export function buildCommandCatalog(registry: CommandRegistry): CommandCatalogEntry[] {
  return registry.commands.map((cmd) => ({
    id: cmd.id,
    description: cmd.description,
    args_schema: cmd.args_schema,
    side_effects: cmd.side_effects,
  }));
}
