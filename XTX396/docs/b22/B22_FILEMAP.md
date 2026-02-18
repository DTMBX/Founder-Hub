# B22 — File Map

All new files for B22, organized by phase.

## P0 — Planning

- docs/b22/B22_PLAN.md
- docs/b22/B22_FILEMAP.md (this file)
- docs/b22/B22_GATES.md
- docs/b22/B22_BASELINE.md

## P1 — Publish Target Contract + Registry

- ops/publish/PublishTarget.schema.json
- ops/publish/targets/PublishTarget.ts
- ops/publish/targets/TargetRegistry.ts
- ops/publish/models/PublishRequest.ts
- ops/publish/models/PublishResult.ts
- governance/publish/publish_policy.md
- ops/publish/__tests__/publish-registry.test.ts

## P2 — Hosted Publish Target

- ops/publish/targets/HostedPublishTarget.ts
- ops/publish/storage/HostedStorage.ts
- docs/b22/hosted_publish.md
- ops/publish/__tests__/hosted-publish.test.ts

## P3 — ZIP Export Target

- ops/publish/targets/ZipExportTarget.ts
- ops/publish/export/zipBuilder.ts
- ops/publish/export/exportManifest.ts
- docs/b22/zip_export.md
- ops/publish/__tests__/zip-export.test.ts

## P4 — GitHub PR Publish Target

- ops/publish/targets/GitHubPrPublishTarget.ts
- ops/integrations/github/GitHubAppConfig.schema.json
- ops/integrations/github/GitHubIntegration.ts
- ops/integrations/github/RepoAllowlist.ts
- docs/b22/github_pr_publish.md
- docs/b22/github_app_setup.md
- ops/publish/__tests__/github-pr-publish.test.ts

## P5 — Admin Panel Publish UI

- ops/publish/ui/PublishPanelModels.ts
- docs/b22/operator_publish_flow.md
- ops/publish/__tests__/publish-panel.test.ts

## P6 — Domain Binding Hooks

- ops/publish/domains/DomainRequestModel.ts
- ops/publish/domains/DomainStatus.ts
- ops/publish/domains/DomainBinder.ts
- docs/b22/domain_binding.md
- ops/publish/__tests__/domain-binding.test.ts

## P7 — Abuse Controls + Rate Limits

- ops/publish/safety/PublishRateLimiter.ts
- ops/publish/safety/CircuitBreaker.ts
- docs/b22/publish_abuse_controls.md
- ops/publish/__tests__/publish-safety.test.ts

## P8 — Audit Bundle Updates

- ops/publish/audit/PublishAuditBundle.ts
- docs/b22/audit_evidence_publish_targets.md
- ops/publish/__tests__/publish-audit.test.ts

## P9 — Final Posture

- docs/b22/B22_FINAL_POSTURE.md
- governance/b22/B22_CHANGELOG.md
- docs/b22/DEMO_SCRIPT.md
