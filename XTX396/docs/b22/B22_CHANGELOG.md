# B22 Changelog

All notable changes for the B22 Publish Targets System.

## [B22] — 2025-07-15

### Added

#### P1 — Publish Target Contract + Registry
- `PublishTarget.schema.json` — JSON Schema for target registration
- `PublishTarget.ts` — Target interface (canPublish, publish)
- `PublishRequest.ts` — Request model with fail-closed factory
- `PublishResult.ts` — Result model and audit event types
- `TargetRegistry.ts` — Central registry with preflight chain
- `publish_policy.md` — Governance policy document

#### P2 — Hosted Publish Target
- `HostedStorage.ts` — Immutable artifact storage adapter
- `HostedPublishTarget.ts` — Hosted publish with versioned storage

#### P3 — ZIP Export Target
- `exportManifest.ts` — Deterministic export manifest builder
- `zipBuilder.ts` — ZIP package builder with demo disclaimers
- `ZipExportTarget.ts` — ZIP export target implementation

#### P4 — GitHub PR Publish Target
- `GitHubAppConfig.schema.json` — Config schema (env var names only)
- `RepoAllowlist.ts` — Fail-closed repo allowlist
- `GitHubIntegration.ts` — Adapter interface, mock, redaction
- `GitHubPrPublishTarget.ts` — PR-based publish target

#### P5 — Admin Panel Publish UI
- `PublishPanelModels.ts` — Button state resolution and history builder

#### P6 — Domain Binding Hooks
- `DomainRequestModel.ts` — Domain request model and validation
- `DomainStatus.ts` — Verification state machine (terminal states)
- `DomainBinder.ts` — Domain binding adapter interface

#### P7 — Abuse Controls
- `PublishRateLimiter.ts` — Token-bucket rate limiter
- `CircuitBreaker.ts` — Three-state circuit breaker

#### P8 — Audit Bundle
- `PublishAuditBundle.ts` — Aggregated audit bundle with integrity hash

#### P9 — Final Posture
- `B22_FINAL_POSTURE.md` — Architecture and security summary
- `B22_CHANGELOG.md` — This changelog
- `DEMO_SCRIPT.md` — Demo walkthrough

### Security
- No secrets stored in code — env var names only
- Safe Mode ON by default for all publish requests
- Append-only audit logs across all subsystems
- PR body redaction for PATs, tokens, and private keys
- Rate limiting and circuit breaking for abuse prevention
- Integrity hashing on audit bundles

### Tests
- 212 new tests across 8 test suites, all passing
