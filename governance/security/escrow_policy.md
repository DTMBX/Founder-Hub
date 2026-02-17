# Artifact Escrow Policy — B13-P4

**Effective:** 2025-01-01
**Owner:** Engineering / Security
**Classification:** Internal

---

## 1. Purpose

This policy governs the cryptographic escrow of build artifacts and critical
files to ensure recoverability, integrity verification, and chain of custody.

## 2. What Gets Escrowed

| Artifact Type | Required | Retention |
|---------------|----------|-----------|
| Production build outputs | Yes | 90 days |
| CI/CD pipeline configs | Yes | 180 days |
| Database migration scripts | Yes | 1 year |
| Security-critical configs | Yes | 1 year |
| Package lock files | Yes | 90 days |
| Source snapshots (tagged releases) | Recommended | 1 year |

## 3. Escrow Requirements

### 3.1 Integrity

- Every escrowed artifact must have a SHA-256 hash computed at escrow time
- Hash must be stored alongside the artifact metadata
- Hash must be verified before any release

### 3.2 Chain of Custody

Each escrow record must contain:

- Unique escrow identifier
- Artifact path
- Repository and commit hash
- Creator identity
- Creation timestamp
- Expiration policy (if applicable)

### 3.3 Immutability

- Escrow records are append-only
- An escrowed artifact cannot be modified; only released or expired
- Release requires written justification

## 4. Release Protocol

To release an artifact from escrow:

1. Provide written justification
2. Identity of releasing party must be recorded
3. Release event must be logged as an audit event
4. Original hash must still match post-release

## 5. Expiration

- Artifacts with expiry policies are automatically marked as expired
- Expired artifacts remain in the manifest for audit purposes
- Expiration checks should run daily

## 6. Audit Trail

All escrow operations emit audit events:

| Operation | Severity |
|-----------|----------|
| Artifact escrowed | info |
| Artifact released | warning |
| Artifact expired | info |
| Verification failure | error |

## 7. Manifest Schema

Escrow manifests conform to the JSON schema at
`governance/security/escrow_manifest_schema.json`.
