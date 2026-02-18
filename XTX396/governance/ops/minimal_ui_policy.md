# Minimal UI Policy — B11-08

## Purpose

This policy defines the constraints and allowlists governing what the Ops Console
may display, what actions it may surface, and how the user interface must behave
to preserve the integrity and professionalism of the system.

## Core Principles

1. **Restraint over expression.** The console exists to observe and manage — not
   to impress or persuade.
2. **Clarity over decoration.** Every element must serve an operational purpose.
3. **Fail closed.** If a policy check fails, deny the action and log it.
4. **Safe Mode default.** All external-facing features default to disabled.

## UI Allowlist

The Ops Console renders only the following pages:

| Page          | Route Key     | Permission Required   |
| ------------- | ------------- | --------------------- |
| Dashboard     | `dashboard`   | `dashboard.view`      |
| Leads         | `leads`       | `leads.view`          |
| Clients       | `clients`     | `clients.view`        |
| Automations   | `automations` | `automations.view`    |
| Content       | `content`     | `content.view`        |
| Settings      | `settings`    | `settings.view`       |
| Audit Log     | `audit`       | `audit.read`          |

No additional pages, modals, or overlays may be introduced without updating this
policy and the RBAC permission map.

## Forbidden UI Patterns

The following are explicitly prohibited in the Ops Console:

- Gamification (points, badges, leaderboards)
- Animations exceeding 150 ms transition duration
- Celebratory or congratulatory modals
- Marketing copy or promotional content
- Color schemes that convey urgency without cause
- Auto-playing media
- Third-party analytics or tracking scripts
- Inline advertisements

## Color Semantics

Colors carry meaning and must not be used decoratively:

| Color   | Hex       | Meaning                        |
| ------- | --------- | ------------------------------ |
| Green   | `#22c55e` | Safe / healthy / active        |
| Amber   | `#f59e0b` | Warning / mock mode / caution  |
| Red     | `#ef4444` | Error / live mode / danger     |
| Gray    | `#6b7280` | Neutral / informational        |
| Blue    | `#2563eb` | Primary action / selected      |

## Typography

- Body text: 13–14 px, system font stack
- Headers: 16–18 px, weight 700
- Monospace (IDs, hashes): 10–11 px
- No decorative fonts

## Layout Constraints

- Maximum content width: 480 px (mobile-first)
- Minimum touch target: 44 × 44 px
- Card border radius: 10–12 px
- Consistent vertical spacing: 8 / 12 / 16 / 20 px scale

## Accessibility Requirements

- WCAG 2.1 AA contrast ratios
- All interactive elements keyboard-accessible
- ARIA labels on icon-only buttons
- Respect `prefers-reduced-motion`
- Screen reader–compatible structure

## Safe Mode Visual Indicators

| State     | Header Badge | Banner              | Toggle Color |
| --------- | ------------ | -------------------- | ------------ |
| Safe ON   | Green "SAFE" | None                 | Green        |
| Safe OFF  | Red "LIVE"   | Red warning banner   | Red          |

## Policy Enforcement

This policy is enforced through:

1. **RBAC permissions** — page access denied without matching permission.
2. **Code review** — all UI changes must be reviewed against this policy.
3. **Audit logging** — every console action is recorded.
4. **CODEOWNERS** — `/ops/console/` requires designated reviewer approval.

## Modification

This policy may only be modified through a pull request that:

1. Updates this document.
2. Updates the RBAC permission map if new pages are added.
3. Includes a justification in the PR description.
4. Is approved by at least one designated reviewer.
