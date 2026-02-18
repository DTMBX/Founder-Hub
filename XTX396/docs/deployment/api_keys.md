# API Keys — Technical Reference

> B16-P3 | Deployment Documentation

## Overview

API keys provide tenant-scoped, permission-controlled access to
platform services. Keys are hashed on storage and bound to a
single tenant.

## Key Lifecycle

```
create() → plain key returned ONCE
  ↓
validate(plainKey) → tenant + scope resolved
  ↓
revoke(keyId) → key permanently denied
```

## Scopes

| Scope | Includes |
|-------|----------|
| `read_only` | Read access only |
| `export` | Read + export |
| `admin` | Read + export + admin |

Admin scope includes all lower scopes.

## Usage

```ts
import { ApiKeyManager } from '../../ops/auth/ApiKeyManager';

const mgr = new ApiKeyManager();

// Create a key
const { plainKey, keyId } = mgr.create('tenant-uuid', 'export');

// Validate on request
const result = mgr.validate(plainKey);
if (result.valid) {
  // result.tenantId, result.scope available
}

// Check scope
mgr.checkScope('export', 'read_only'); // true
mgr.checkScope('read_only', 'export'); // false

// Revoke
mgr.revoke(keyId);
```

## Security

- Plain keys are never logged or persisted.
- Key hashes use SHA-256.
- Revoked key usage attempts are audit-logged.

## Policy

See `governance/security/api_key_policy.md`.
