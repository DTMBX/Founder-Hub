# Public Demo Mode — Technical Reference

> B16-P2 | Deployment Documentation

## Overview

Public Demo Mode is a hardened operating mode for publicly accessible
tool deployments. It enforces strict output bounding, rate limiting,
and feature restrictions to prevent abuse.

## Activation

Demo mode is active by default for the `public-demo` tenant.
The `DemoGuard` class controls enforcement:

```ts
import { DemoGuard, PUBLIC_DEMO_CONFIG } from '../../ops/demo/DemoGuard';

const guard = new DemoGuard(PUBLIC_DEMO_CONFIG, true);

// Check before returning query results
const rowCheck = guard.checkRowLimit(rowCount, tenantId);
if (!rowCheck.allowed) {
  return { error: rowCheck.reason };
}
```

## Checks Available

| Method | Purpose |
|--------|---------|
| `checkRowLimit()` | Rejects queries exceeding max rows |
| `checkExportSize()` | Rejects exports exceeding max bytes |
| `checkFileUpload()` | Blocks file uploads in demo |
| `checkExternalApi()` | Blocks external API calls |
| `checkBilling()` | Blocks billing operations |
| `checkMessaging()` | Blocks messaging adapters |
| `checkIpRate()` | Per-IP rate limiting |
| `truncatePreview()` | Truncates long text with marker |

## Configuration

Default configuration (`PUBLIC_DEMO_CONFIG`):

```json
{
  "maxRows": 100,
  "maxExportBytes": 5242880,
  "maxPreviewChars": 10000,
  "allowFileUpload": false,
  "allowExternalApis": false,
  "allowBilling": false,
  "allowMessaging": false
}
```

## Policy

See `governance/security/public_demo_policy.md`.
