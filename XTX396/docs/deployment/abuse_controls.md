# Abuse Protection Controls — Technical Reference

> B16-P5 | Deployment Documentation

## Overview

The abuse protection layer provides WAF-like request filtering
with adaptive rate limiting, burst detection, and soft ban support.

## Components

| Component | Purpose |
|-----------|---------|
| Per-IP rate limiter | Sliding window request counting |
| Burst detector | Short-window spike detection |
| Soft ban | Temporary IP blocking |
| Exponential backoff | Graduated retry delays |
| Audit log | Append-only event recording |

## Usage

```ts
import { AbuseProtection } from '../../ops/security/AbuseProtection';

const protection = new AbuseProtection();

const result = protection.check('192.168.1.1');
switch (result.action) {
  case 'allowed':   proceed(); break;
  case 'throttled': respond429(result.retryAfterMs); break;
  case 'blocked':   respond429(result.retryAfterMs); break;
  case 'banned':    respond403(result.retryAfterMs); break;
}
```

## Configuration

```ts
const config = {
  maxRequestsPerWindow: 60,   // per IP
  windowMs: 60_000,           // 1 minute
  burstThreshold: 15,         // in burstWindowMs
  burstWindowMs: 5_000,       // 5 seconds
  softBanDurationMs: 600_000, // 10 minutes
  baseBackoffMs: 1_000,       // 1 second
  maxBackoffMs: 60_000,       // 1 minute
};
```

## Policy

See `governance/security/abuse_prevention_policy.md`.
