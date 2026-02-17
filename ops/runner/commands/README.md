# Command Registry (SSOT)

**Location:** `/ops/runner/commands/`  
**Branch:** `feature/b12-ai-copilot-scoped-exec`

## Purpose

The Command Registry is the **single source of truth** for every command the
AI Co-Pilot runner is permitted to execute. No command can run unless it
appears in `registry.json`.

## Files

| File | Purpose |
|---|---|
| `registry.json` | Authoritative list of allowed commands |
| `schema.json` | JSON Schema that validates registry structure |
| `validateRegistry.ts` | Programmatic validator (schema + semantic rules) |

## Command Entry Fields

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Stable dotted identifier (e.g. `repo.status`) |
| `description` | Yes | Human-readable purpose (5–200 chars) |
| `roles_allowed` | Yes | Array of `Admin`, `Operator`, `ReadOnly` |
| `safe_mode_behavior` | Yes | `{ allowed, reason }` — whether Safe Mode permits it |
| `args_schema` | Yes | JSON Schema for command arguments |
| `working_dir_policy` | Yes | `{ type: "fixed"\|"allowlisted", value }` |
| `env_allowlist` | Yes | Env var names the command may access (no values) |
| `command_template` | Yes | `{ executable, args[] }` — tokenized, no shell concat |
| `expected_outputs` | Yes | `["json"\|"text"\|"artifact_path"]` |
| `timeout_seconds` | Yes | 1–300 second execution limit |
| `side_effects` | Yes | `none\|read_only\|writes_repo\|deploys\|network_egress` |
| `output_limits` | No | `{ max_chars, max_lines }` — output truncation bounds |
| `path_allowlist` | No | Paths the command may read (relative to working dir) |

## Adding a Command

1. Add the entry to `registry.json`
2. Run `npx tsx ops/runner/commands/validateRegistry.ts`
3. Ensure the validator reports no errors
4. Add corresponding tests in `ops/__tests__/`
5. Update `B12_CHANGELOG.md`

## Security Invariants

- **No shell concatenation.** Commands use tokenized `argv` arrays.
- **No secrets in registry.** `env_allowlist` lists names, not values.
- **Side effects declared.** Every command classifies its mutation surface.
- **Safe Mode enforced.** Commands blocked under Safe Mode cannot bypass it.
- **Unique IDs.** No two commands may share an `id`.
- **Template safety.** `{{arg}}` placeholders must reference `args_schema` properties.
