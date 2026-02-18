# Hosted Publish Target

## Overview

The Hosted publish target is the default option available to all operators. It
stores generated site artifacts in a versioned namespace and sets an active
pointer for serving.

## Storage Namespace

```
hosted_sites/{tenantId}/{siteId}/{version}/{artifact_path}
```

Active pointer:
```
hosted_sites/{tenantId}/{siteId}/active → version
```

## URL Format

```
/sites/{tenantId}-{siteId}/
```

## Behavior

1. Resolve artifact bundle from `artifactRef`
2. Check watermark enforcement (demo mode)
3. Generate deterministic version from `manifestHash` + `timestamp`
4. Store all artifacts under versioned keys (immutable — no overwrites)
5. Set active pointer to new version
6. Return hosted URL

## Demo vs Owner Mode

| Property | Demo | Owner |
|----------|------|-------|
| Watermark | Required | Optional (policy-controlled) |
| TTL | Optional | Persistent |
| Active pointer | Standard | Standard |

## Immutability

Once a version is stored, its keys cannot be overwritten. Re-publishing the same
manifest hash with the same timestamp returns an error. This ensures
deterministic builds remain verifiable.

## Audit Events

All publish operations emit `publish_requested`, `publish_started`,
`publish_succeeded` or `publish_failed` events through the TargetRegistry.
