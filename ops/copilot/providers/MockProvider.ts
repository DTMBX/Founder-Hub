/**
 * B12-04 — Mock Provider (Default)
 *
 * Returns deterministic responses for local development and testing.
 * No API key required. Always available.
 */

import type { IProvider, ProviderRequest, ProviderResponse } from './IProvider';

// ---------------------------------------------------------------------------
// Intent → command mapping (deterministic pattern matching)
// ---------------------------------------------------------------------------

interface PatternMapping {
  patterns: RegExp[];
  commands: { command_id: string; args: Record<string, unknown> }[];
  summary: string;
}

const PATTERN_MAPPINGS: PatternMapping[] = [
  {
    patterns: [/\bstatus\b/i, /\bgit status\b/i, /\bworking (tree|dir)/i],
    commands: [{ command_id: 'repo.status', args: {} }],
    summary: 'Checking the repository working tree status.',
  },
  {
    patterns: [/\bbranch\b/i, /\bcurrent branch\b/i, /\bwhich branch\b/i],
    commands: [{ command_id: 'repo.branch', args: {} }],
    summary: 'Checking the current branch name.',
  },
  {
    patterns: [/\blast commit\b/i, /\brecent commit\b/i, /\bcommit log\b/i, /\blatest commit\b/i],
    commands: [{ command_id: 'repo.last_commit', args: {} }],
    summary: 'Showing the most recent commit details.',
  },
  {
    patterns: [/\bhealth\b/i, /\bsystem status\b/i, /\bhealth check\b/i, /\bops health\b/i],
    commands: [{ command_id: 'ops.health_snapshot', args: {} }],
    summary: 'Capturing an ops health snapshot.',
  },
  {
    patterns: [/\baudit\b.*\bverif/i, /\bverif.*\baudit\b/i, /\bcheck.*\baudit\b/i, /\baudit.*\bintegrity\b/i],
    commands: [{ command_id: 'audit.verify', args: {} }],
    summary: 'Verifying audit log integrity.',
  },
  {
    patterns: [/\bdry.?run\b/i, /\bpreview\b.*\bautomation\b/i, /\bautomation\b.*\bpreview\b/i],
    commands: [{ command_id: 'automation.dry_run', args: { ruleId: 'default' } }],
    summary: 'Running automation dry-run preview.',
  },
  {
    patterns: [/\bqueue\b.*\bstatus\b/i, /\bautomation\b.*\bqueue\b/i],
    commands: [{ command_id: 'automation.queue_status', args: {} }],
    summary: 'Checking the automation queue status.',
  },
  {
    patterns: [/\blead\b.*\bstat/i, /\bstat.*\blead/i, /\blead\b.*\bcount/i],
    commands: [{ command_id: 'leads.stats', args: {} }],
    summary: 'Fetching lead statistics.',
  },
  {
    patterns: [/\bcontent\b.*\bpending\b/i, /\bpending\b.*\bcontent\b/i, /\bcontent\b.*\brequest/i],
    commands: [{ command_id: 'contentops.pending_requests', args: {} }],
    summary: 'Listing pending content requests.',
  },
  {
    patterns: [/\bdiff\b/i, /\bchanges?\b.*\bsummar/i],
    commands: [{ command_id: 'repo.diff_summary', args: {} }],
    summary: 'Showing a diff summary of current changes.',
  },
  {
    patterns: [/\bsearch\b.*\brepo\b/i, /\bfind\b.*\bfile/i, /\brepo\b.*\bsearch\b/i],
    commands: [{ command_id: 'repo.search', args: { query: 'placeholder', path: 'src' } }],
    summary: 'Searching the repository.',
  },
];

export class MockProvider implements IProvider {
  readonly name = 'mock';
  readonly requiresApiKey = false;

  isAvailable(): boolean {
    return true;
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const userMessage = request.messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .pop() ?? '';

    // Match against known patterns
    for (const mapping of PATTERN_MAPPINGS) {
      if (mapping.patterns.some((p) => p.test(userMessage))) {
        // Filter to commands that exist in the catalog
        const validCommands = mapping.commands.filter((cmd) =>
          request.commandCatalog.some((cat) => cat.id === cmd.command_id),
        );

        return {
          content: mapping.summary,
          parsed: {
            proposed_commands: validCommands,
          },
          usage: { promptTokens: userMessage.length, completionTokens: mapping.summary.length },
          provider: 'mock',
          model: 'mock-v1',
        };
      }
    }

    // No match — return informational response with no commands
    return {
      content: 'I can help with repository status, branch info, commit history, ops health, audit verification, and automation dry-runs. What would you like to check?',
      parsed: { proposed_commands: [] },
      usage: { promptTokens: userMessage.length, completionTokens: 80 },
      provider: 'mock',
      model: 'mock-v1',
    };
  }
}
