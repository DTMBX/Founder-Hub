# Security Policy

## Founder Hub — Security Architecture

Single-operator sovereign admin platform. All data lives client-side in localStorage, encrypted at rest with AES-256-GCM. No server-side database, no third-party auth providers.

## Encryption

| Layer | Algorithm | Parameters |
| ----- | --------- | ---------- |
| Password hashing | PBKDF2-SHA-256 | 100 000 iterations, 16-byte random salt |
| Field encryption | AES-256-GCM | 12-byte random IV, per-field |
| Vault secrets | AES-256-GCM | Per-secret + per-metadata encryption, SHA-256 checksums |
| Session signing | HMAC-SHA-256 | Derived from app entropy via PBKDF2 |
| 2FA backup codes | SHA-256 | Stored as one-way hashes with `2fa-backup:` prefix |
| Login attempt data | AES-256-GCM | Encrypted at rest, transparent read/write |

Key derivation uses a static app entropy string combined with a random 32-byte salt stored at `founder-hub-e2e-salt`. The HMAC signing key uses a separate derivation path (`entropy + ':hmac'`).

Legacy SHA-256 password hashes are auto-migrated to PBKDF2 on next successful login.

## Authentication

### Login Paths

1. **Email + password** — PBKDF2 verification
2. **Email + password + TOTP** — Time-based one-time password (RFC 6238)
3. **Email + password + USB keyfile** — Hardware-bound second factor
4. **GitHub PAT** — Personal access token, stored encrypted in vault
5. **Auto-login** — Development only (`IS_DEV && VITE_AUTO_LOGIN !== 'false'`)

### Rate Limiting

- **Max attempts**: 3 per email address
- **Lockout duration**: 30 minutes
- **Storage**: Encrypted at rest (AES-256-GCM)
- **Scope**: Per-email counters with timestamps

### Session Management

- **Duration**: 4 hours from login
- **Integrity**: HMAC-SHA-256 signature verified on every load
- **Tamper detection**: Modified sessions (role escalation, expiry extension) are rejected and cleared
- **Refresh**: Re-signed on each authenticated action

### Two-Factor Authentication

- **TOTP**: Full implementation with encrypted secret storage
- **Backup codes**: 8 codes generated with `crypto.getRandomValues`, stored as SHA-256 hashes
- **Recovery phrase**: Mnemonic-based account recovery
- **USB keyfile**: Hardware-bound key generation and verification

## Vault System

The secret vault (`src/lib/secret-vault.ts`) provides:

- Per-secret AES-256-GCM encryption (value + label + metadata each encrypted separately)
- SHA-256 integrity checksums on encrypted blobs
- Encrypted index at `vault:__index`
- Secret rotation with audit trail
- Typed secret categories: `github-pat`, `api-key`, `credential`, `certificate`, `other`

GitHub PATs are automatically migrated from plaintext localStorage to the encrypted vault on app load.

## Audit Ledger

Hash-chained tamper-evident audit log (`src/lib/audit-ledger.ts`):

- SHA-256 chain linking each entry to its predecessor
- Auto-checkpoints every 100 entries
- Logged events: login success/failure, 2FA challenges, password changes, secret access, content modifications
- Each entry includes: userId, email, action, detail, category, entityId, timestamp, hash

## Role-Based Access Control

| Role | Capabilities |
| ---- | ------------ |
| **Owner** | Full access — users, secrets, vault, audit, content, settings |
| **Editor** | Content and theme management |
| **Viewer** | Read-only access |

## Infrastructure

- **Hosting**: GitHub Pages (static SPA)
- **TLS**: Enforced by GitHub Pages + Cloudflare
- **Token proxy**: Cloudflare Worker with RS256 JWT signing for GitHub App installation tokens
- **CORS**: Origin-restricted on the worker (`devon-tyler.com` only)
- **CSP**: Configured via deployment headers

## Known Limitations

1. **Client-side storage**: All data in localStorage — physical device access = data access (mitigated by AES-256-GCM encryption)
2. **No server-side enforcement**: Rate limiting and session validation are client-side only — a determined attacker with DevTools access can clear lockouts (mitigated by encrypting attempt data)
3. **Single operator**: No multi-user session revocation or centralized auth server
4. **No email-based password reset**: Recovery requires backup codes, recovery phrase, or USB keyfile

## Reporting Security Issues

**Do not** open a public GitHub issue for security vulnerabilities.

Email: <devon@devon-tyler.com>

Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

## Deployment Checklist

- [x] PBKDF2 password hashing with auto-migration
- [x] AES-256-GCM encryption for secrets, vault, login attempts
- [x] HMAC-SHA256 session signing
- [x] TOTP 2FA with hashed backup codes
- [x] USB keyfile support
- [x] Hash-chained audit ledger
- [x] Rate limiting (3 attempts / 30-minute lockout)
- [x] Auto-login restricted to development builds
- [x] GitHub PAT vault migration
- [ ] Configure CSP headers on hosting platform
- [ ] Enable HSTS preload
- [ ] Set up external audit log export
- [ ] Regular backup schedule

## Updates & Maintenance

Review this document after any authentication, encryption, or vault changes.

**Last Updated**: 2025-06
**Version**: 2.0.0
