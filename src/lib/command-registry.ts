/**
 * command-registry.ts — Typed command layer for the Site Studio.
 *
 * Every action the command palette can execute is registered here as
 * an explicit, typed command. Commands never bypass canonical hooks —
 * they always route through use-section-structure, use-section-inspector,
 * use-collection-editor, snapshot-system, or validation-audit.
 *
 * No freeform text execution. No eval. No stringly-typed dispatch.
 */

// ─── Command Types ──────────────────────────────────────────────────────────

export type CommandCategory =
  | 'sections'
  | 'collections'
  | 'snapshot'
  | 'audit'
  | 'bulk'
  | 'ai'
  | 'navigation'

export interface CommandDefinition {
  /** Unique command ID (kebab-case) */
  id: string
  /** Human-readable label for the palette */
  label: string
  /** Category for grouping */
  category: CommandCategory
  /** Short description */
  description: string
  /** Whether this command needs a selected section */
  requiresSelection?: boolean
  /** Whether this command needs collection context */
  requiresCollection?: boolean
  /** Keyboard shortcut hint (display only, not binding) */
  shortcut?: string
}

export interface CommandResult {
  success: boolean
  message: string
}

// ─── Command Registry ───────────────────────────────────────────────────────

export const COMMANDS: CommandDefinition[] = [
  // ── Sections ──
  {
    id: 'section-add',
    label: 'Add Section…',
    category: 'sections',
    description: 'Add a new section to the page',
  },
  {
    id: 'section-remove',
    label: 'Remove Section',
    category: 'sections',
    description: 'Remove the selected section',
    requiresSelection: true,
  },
  {
    id: 'section-duplicate',
    label: 'Duplicate Section',
    category: 'sections',
    description: 'Duplicate the selected section',
    requiresSelection: true,
  },
  {
    id: 'section-move-top',
    label: 'Move Section to Top',
    category: 'sections',
    description: 'Move the selected section to position 1 (after hero)',
    requiresSelection: true,
  },
  {
    id: 'section-move-bottom',
    label: 'Move Section to Bottom',
    category: 'sections',
    description: 'Move the selected section to the last position',
    requiresSelection: true,
  },

  // ── Collections ──
  {
    id: 'collection-add-item',
    label: 'Add Collection Item',
    category: 'collections',
    description: 'Add a new item to the current collection',
    requiresCollection: true,
  },

  // ── Snapshot ──
  {
    id: 'snapshot-export',
    label: 'Export Snapshot',
    category: 'snapshot',
    description: 'Download all content as a JSON snapshot',
  },
  {
    id: 'snapshot-import',
    label: 'Import Snapshot…',
    category: 'snapshot',
    description: 'Restore content from a snapshot file',
  },

  // ── Audit ──
  {
    id: 'audit-run',
    label: 'Run Validation Audit',
    category: 'audit',
    description: 'Validate all KV-backed content against schemas',
  },

  // ── Navigation ──
  {
    id: 'nav-clear-selection',
    label: 'Clear Selection',
    category: 'navigation',
    description: 'Deselect the current section',
    shortcut: 'Esc',
  },

  // ── Bulk Operations ──
  {
    id: 'bulk-enable-all-sections',
    label: 'Enable All Sections',
    category: 'bulk',
    description: 'Enable every section',
  },
  {
    id: 'bulk-disable-non-essential',
    label: 'Disable Non-Essential Sections',
    category: 'bulk',
    description: 'Disable all sections except hero, about, and contact',
  },
  {
    id: 'bulk-sort-sections-alpha',
    label: 'Sort Sections Alphabetically',
    category: 'bulk',
    description: 'Reorder sections by title (A–Z), hero stays first',
  },
  {
    id: 'bulk-normalize-project-titles',
    label: 'Normalize Project Titles',
    category: 'bulk',
    description: 'Trim whitespace and title-case all project names',
  },

  // ── AI (stubs) ──
  {
    id: 'ai-improve-description',
    label: 'AI: Improve Description',
    category: 'ai',
    description: 'Suggest improved description text (requires AI backend)',
    requiresSelection: true,
  },
  {
    id: 'ai-suggest-tags',
    label: 'AI: Suggest Tags',
    category: 'ai',
    description: 'Suggest relevant tags for the selected item (requires AI backend)',
    requiresCollection: true,
  },
]

/** Lookup a command by ID. */
export function getCommand(id: string): CommandDefinition | undefined {
  return COMMANDS.find(c => c.id === id)
}

/** Get commands filtered by category. */
export function getCommandsByCategory(category: CommandCategory): CommandDefinition[] {
  return COMMANDS.filter(c => c.category === category)
}

/** Filter commands by search query (matches label or description). */
export function filterCommands(query: string): CommandDefinition[] {
  const q = query.toLowerCase().trim()
  if (!q) return COMMANDS
  return COMMANDS.filter(
    c => c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
  )
}
