# API Key Management Policy

> B16-P3 | Governance | Classification: Mandatory

## Scope

This policy governs the creation, usage, and revocation of API keys
within the platform.

## Requirements

### 1. Key Storage

- API keys are NEVER stored in plaintext.
- Only the SHA-256 hash of the key is persisted.
- The plain key is returned ONCE at creation and must be stored
  securely by the consumer.

### 2. Tenant Binding

- Every API key is bound to exactly one `tenant_id`.
- A key cannot access data or services belonging to another tenant.
- Cross-tenant key usage attempts are logged and denied.

### 3. Scoped Permissions

| Scope | Permissions |
|-------|-------------|
| `read_only` | Read access to permitted tools and data |
| `export` | Read + export operations |
| `admin` | Full access including configuration |

Scope hierarchy: `admin` > `export` > `read_only`.

### 4. Revocation

- Keys may be revoked at any time by an administrator.
- Revoked keys are immediately denied on all subsequent requests.
- Revocation is logged with timestamp.

### 5. Audit Events

The following events are logged:
- `key_created` — new key issued
- `key_revoked` — key revoked
- `revoked_key_attempt` — attempt to use a revoked key

All events include `keyId`, `tenantId`, and `timestamp`.

### 6. Rate Limiting

- Each key inherits the tenant's `rateLimitProfile`.
- Per-key request counts are tracked.

## Key Format

Keys follow the pattern: `evk_` followed by 64 hex characters.

Example: `evk_a1b2c3d4e5f6...`

## Rotation

To rotate a key:
1. Create a new key with the same scope
2. Update consumers to use the new key
3. Revoke the old key

Simultaneous validity of old and new keys is permitted during rotation.

---

*Effective with B16-P3 implementation.*
