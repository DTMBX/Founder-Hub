# GitHub PR Publish Target

## Overview

The GitHub PR publish target creates a pull request in an allowlisted repository
containing the generated site artifacts. This target is optional and disabled by
default.

## Prerequisites

1. GitHub App configured with appropriate permissions
2. Installation token available via environment variable
3. Target repository in the explicit allowlist
4. Safe Mode OFF
5. Actor has `publish_site` + `manage_deployments` capabilities
6. Tenant is not `public-demo`, `trial`, or `suspended`

## Branch Naming

```
b22/site-{siteId}-{timestamp}
```

## PR Contents

- `sites/{siteId}/*.html` — generated site pages
- `sites/{siteId}/manifest.json` — manifest with hashes

## PR Body

Includes a table with:
- Site ID, Blueprint, Manifest Hash, Correlation ID, Tenant, Actor, Mode

All PR bodies are redacted before submission to prevent secret leaks.

## Security

- No secrets committed to the repository
- No tokens logged or printed
- Repository must be explicitly allowlisted (fail-closed)
- Blocked for demo tenants and Safe Mode
- PR body is redacted for common secret patterns
