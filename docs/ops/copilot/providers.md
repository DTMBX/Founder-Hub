# Co-Pilot Provider Configuration

## Overview

The Co-Pilot supports pluggable AI providers via the `IProvider` interface.
The system ships with three providers:

| Provider   | Model                  | API Key Env Var       | Default |
|------------|------------------------|-----------------------|---------|
| Mock       | mock-v1                | (none)                | Yes     |
| OpenAI     | gpt-4o                 | `OPENAI_API_KEY`      | No      |
| Anthropic  | claude-sonnet-4-20250514   | `ANTHROPIC_API_KEY`   | No      |

## Mock Provider (Default)

The Mock Provider uses deterministic pattern matching to respond to common
queries. It requires no API key and is always available. It maps user input
patterns to command proposals from the registry.

Suitable for: local development, testing, demos, offline environments.

## OpenAI Provider

Connects to the OpenAI Chat Completions API using `gpt-4o`.

Configuration:
```
OPENAI_API_KEY=sk-your-key-here
```

The provider:
- Sends the command catalog as part of the system prompt
- Requests JSON response format
- Logs usage metadata (token counts) to the audit trail
- Never logs prompt content to prevent data leakage

## Anthropic Provider

Connects to the Anthropic Messages API using `claude-sonnet-4-20250514`.

Configuration:
```
ANTHROPIC_API_KEY=your-key-here
```

The provider:
- Sends the command catalog as part of the system prompt
- Extracts JSON from the response content via regex
- Logs usage metadata to the audit trail
- Never logs prompt content

## Adding a Custom Provider

Implement the `IProvider` interface:

```typescript
import type { IProvider, ProviderRequest, ProviderResponse } from './IProvider';

export class MyProvider implements IProvider {
  readonly name = 'my-provider';
  readonly requiresApiKey = true;

  isAvailable(): boolean {
    return Boolean(process.env.MY_PROVIDER_KEY);
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    // Call your API...
    return {
      content: 'Response text',
      parsed: { proposed_commands: [] },
      provider: this.name,
      model: 'my-model-v1',
    };
  }
}
```

The `parsed` field must include a `proposed_commands` array. Each entry must
reference a valid command from the registry by `command_id`.

## Security Notes

- API keys are read from `process.env` only — never hardcoded.
- Prompt content is never logged to the audit trail.
- Provider errors are logged with `system.error` severity.
- All provider output is validated through the PolicyEngine before execution.
