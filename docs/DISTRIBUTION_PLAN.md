# Phase 4 — Distribution Plane

## Purpose

Separate the Founder Hub codebase into two editions:

1. **Sovereign Edition** — the operator's private live instance (devon-tyler.com)
2. **Starter Kit** — a distributable template other founders can bootstrap from

This boundary ensures that operator secrets, vault data, content, and hardened auth configurations never leak into the distributable package, while the Starter Kit inherits the full security architecture.

## Edition Matrix

| Capability | Sovereign | Starter Kit |
| ---------- | --------- | ----------- |
| AES-256-GCM encryption | Yes | Yes |
| PBKDF2 password hashing | Yes | Yes |
| HMAC session signing | Yes | Yes |
| TOTP 2FA | Yes | Yes |
| USB keyfile auth | Yes | Yes |
| Vault system | Yes | Yes |
| Recovery checkpoint | Yes | Yes |
| Audit ledger | Yes | Yes |
| GitHub PAT proxy (CF Worker) | Configured | Template only |
| Content data | Operator's live data | Sample/placeholder data |
| CNAME / domain | devon-tyler.com | Blank (user configures) |
| GitHub Actions deploy | Pre-configured | Template workflow |
| Admin credentials | Operator's real creds | First-run setup wizard |
| Vault secrets | Operator's secrets | Empty vault |
| `runtime.config.json` | Production values | Placeholder values |

## File Boundary

### Sovereign-Only (excluded from Starter Kit)

```
CNAME
runtime.config.json                 # Production endpoint config
workers/github-token-proxy.ts       # Operator's CF Worker (has secret refs)
public/data/*.json                  # Operator's content data
.github/workflows/deploy.yml        # Operator-specific deploy
governance/policy.json              # Live runtime policy
governance/runtime-policy.json      # Live runtime policy
docs/investor/                      # Confidential investor docs
docs/sales/                         # Confidential sales docs
contracts/                          # Legal templates with real terms
```

### Starter Kit — Included with Modification

```
runtime.config.json.example         # Annotated template
workers/github-token-proxy.ts.example
public/data/*.example.json          # Sample data demonstrating schema
.github/workflows/deploy.yml.example
CNAME.example                       # Instructions for custom domain
```

## Starter Kit Bootstrap Flow

1. `git clone` or "Use this template" on GitHub
2. `npm install`
3. `npm run setup` — interactive first-run script:
   - Prompts for admin email
   - Generates PBKDF2-hashed password
   - Creates initial user in localStorage seed file
   - Generates encryption salt
   - Optionally generates USB keyfile + backup codes + recovery phrase
   - Writes `runtime.config.json` from template
4. `npm run dev` — Vite dev server with auto-login enabled
5. Configure `CNAME`, deploy workflow, CF Worker for production

## Build Script: `scripts/build-starter-kit.ps1`

```powershell
# Conceptual — implemented in Phase 5

param(
    [string]$OutputDir = "./dist-starter-kit",
    [switch]$WhatIf
)

$ExcludePatterns = @(
    'CNAME',
    'runtime.config.json',
    'governance/policy.json',
    'governance/runtime-policy.json',
    'docs/investor/*',
    'docs/sales/*',
    'contracts/*',
    'public/data/*.json',
    '.env*'
)

# 1. Copy repo excluding sovereign-only files
# 2. Rename .example files → remove .example suffix
# 3. Replace operator-specific strings in README
# 4. Validate no secrets leaked (scan-secrets.mjs)
# 5. Generate fresh sample data
```

## Feature Flags

The app already uses `IS_DEV` and `AUTO_LOGIN` flags. The Starter Kit adds:

| Flag | Default (Sovereign) | Default (Starter) | Purpose |
| ---- | ------------------- | ------------------ | ------- |
| `VITE_EDITION` | `sovereign` | `starter` | Controls branding, help text |
| `VITE_FIRST_RUN` | `false` | `true` | Triggers setup wizard on first visit |
| `VITE_SAMPLE_DATA` | `false` | `true` | Seeds localStorage with demo content |

These are compile-time Vite env vars with no runtime cost.

## Security Guarantees

1. **No credential leakage**: `build-starter-kit.ps1` runs `scan-secrets.mjs` on the output directory before packaging. Any detection aborts the build.
2. **No content leakage**: All `public/data/*.json` files are excluded; sample data is generated fresh.
3. **No vault state**: Starter Kit ships with empty localStorage — no `vault:*` keys.
4. **Identical crypto**: Same `crypto.ts`, `auth.ts`, `secret-vault.ts` code — no security downgrade.

## Versioning

The Starter Kit follows the same version as the main app (`package.json` version). Each release tags both:

- `v{version}` — sovereign release
- `starter-v{version}` — starter kit release

The Starter Kit changelog is auto-generated from commits touching security or architecture files.
