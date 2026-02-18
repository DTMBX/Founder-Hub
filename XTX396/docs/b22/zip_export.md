# ZIP Export Target

## Overview

The ZIP export target allows operators to download a complete, hashed site
package. Always available regardless of Safe Mode or GitHub configuration.

## ZIP Contents

| File | Description |
|------|-------------|
| `*.html` | Generated site pages |
| `manifest.json` | Per-file SHA-256 hashes + manifest hash |
| `generation.meta.json` | Sanitized metadata (no secrets) |
| `DEMO_DISCLAIMER.txt` | Demo-only disclaimer (if demo mode) |

## Manifest Structure

```json
{
  "version": "1.0.0",
  "siteId": "site-1",
  "blueprintId": "law_firm",
  "generatedAt": "2026-01-01T00:00:00.000Z",
  "exportedAt": "2026-01-01T00:01:00.000Z",
  "correlationId": "cor-abc",
  "manifestHash": "a1b2c3d4",
  "watermarked": true,
  "demoMode": true,
  "entries": [
    { "path": "index.html", "sha256": "...", "size": 1234 }
  ]
}
```

## Demo vs Owner Mode

| Property | Demo | Owner |
|----------|------|-------|
| Watermark | Required in artifacts | Optional (policy-controlled) |
| Disclaimer | Included in ZIP | Not included |
| Generation meta | Included | Included |

## Size Limit

ZIP packages are bounded to 50 MB by default. Exceeding this limit returns an
error.

## Determinism

Same artifact set produces the same manifest hash. Entries are sorted by path
before hash computation.
