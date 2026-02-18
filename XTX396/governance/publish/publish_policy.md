# Publish Target Policy

## Purpose

This policy governs the behavior of all publish targets within the Evident /
XTX396 platform. All publish actions must comply with these rules.

## Targets

| Target | ID | Default Enabled | Safe Mode |
|--------|----|-----------------|-----------|
| Hosted | `hosted` | Yes | Allowed |
| ZIP Export | `zip` | Yes | Allowed |
| GitHub PR | `github_pr` | No | Blocked |

## Rules

### 1. Safe Mode (Default: ON)

When Safe Mode is ON:
- Only `hosted` and `zip` targets are available.
- `github_pr` is blocked regardless of configuration.
- This is the default state for all tenants.

### 2. Tenant Restrictions

- `public-demo` tenants may use `hosted` and `zip` only.
- `public-demo` tenants may NEVER use `github_pr`.
- `trial` tenants follow Safe Mode rules.
- `suspended` tenants may not publish at all.

### 3. RBAC Requirements

| Target | Required Capability |
|--------|-------------------|
| hosted | `publish_site` |
| zip | `publish_site` |
| github_pr | `publish_site` + `manage_deployments` |

### 4. Audit Requirements

- Every publish action MUST emit audit events.
- Audit log is append-only — no deletion or mutation.
- Events: `publish_requested`, `publish_started`, `publish_succeeded`,
  `publish_failed`, `publish_blocked`
- Each event includes `correlationId`, `tenantId`, `actorId`, `siteId`.

### 5. Determinism

- Same inputs must produce the same manifest hash.
- Artifact bundles are immutable once stored.
- No version overwriting is permitted.

### 6. Secrets

- No secrets may be committed to source.
- No secrets may appear in audit logs, publish results, or error messages.
- GitHub App credentials are environment-only (never in config files).

### 7. Watermark Enforcement

- Demo mode publishes MUST include watermarks.
- Owner mode may remove watermarks if policy permits.

## Compliance

All publish target implementations must pass:
- Schema validation against `PublishTarget.schema.json`
- Unit tests for each rule above
- Secret scan (no tokens, keys, or credentials in source)
