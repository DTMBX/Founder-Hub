# Phase Runner — File Map

All files created or modified by B13/B14/B15, organized by directory.

## /governance/security/ (B13)
| File | Phase | Type |
|------|-------|------|
| `critical_assets_inventory.md` | B13-P1 | New |
| `repo_criticality_map.json` | B13-P1 | New |
| `backup_policy.md` | B13-P2 | New |
| `restore_drill_policy.md` | B13-P3 | New |
| `artifact_escrow_policy.md` | B13-P4 | New |
| `break_glass_policy.md` | B13-P5 | New |
| `dependency_distribution_policy.md` | B13-P6 | New |
| `workstation_security_policy.md` | B13-P7 | New |
| `protected_paths_policy.md` | B13-P8 | New |
| `B13_CHANGELOG.md` | B13-P10 | New |

## /ops/backup/ (B13)
| File | Phase | Type |
|------|-------|------|
| `BackupService.ts` | B13-P2 | New |
| `RestoreService.ts` | B13-P3 | New |
| `providers/LocalProvider.ts` | B13-P2 | New |
| `providers/OffsiteProviderStub.ts` | B13-P2 | New |

## /ops/escrow/ (B13)
| File | Phase | Type |
|------|-------|------|
| `ArtifactEscrowService.ts` | B13-P4 | New |
| `escrow-manifest.schema.json` | B13-P4 | New |

## /ops/break-glass/ (B13)
| File | Phase | Type |
|------|-------|------|
| `BreakGlassPlaybook.md` | B13-P5 | New |
| `checklists/*.md` | B13-P5 | New |
| `runbook_templates/*.md` | B13-P5 | New |

## /scripts/security/ (B13)
| File | Phase | Type |
|------|-------|------|
| `backup.ps1` | B13-P2 | New |
| `backup-verify.ps1` | B13-P2 | New |
| `restore-drill.ps1` | B13-P3 | New |
| `break-glass.ps1` | B13-P5 | New |
| `windows-hardening.ps1` | B13-P7 | New |
| `windows-hardening-apply.ps1` | B13-P7 | New |
| `key-hygiene.ps1` | B13-P7 | New |
| `pre-push-guard.ps1` | B13-P8 | New |
| `pre-commit-guard.ps1` | B13-P8 | New |

## /docs/security/ (B13)
| File | Phase | Type |
|------|-------|------|
| `B13_OVERVIEW.md` | B13-P1 | New |
| `backups.md` | B13-P2 | New |
| `restore_drill.md` | B13-P3 | New |
| `artifact_escrow.md` | B13-P4 | New |
| `private_registry.md` | B13-P6 | New |
| `workstation_hardening_windows.md` | B13-P7 | New |
| `B13_VERIFICATION.md` | B13-P9 | New |
| `SECURITY_POSTURE_SUMMARY.md` | B13-P10 | New |

## /.github/workflows/ (B13)
| File | Phase | Type |
|------|-------|------|
| `artifact-escrow.yml` | B13-P4 | New |
| `b13-verify.yml` | B13-P9 | New |

## /ops/onboarding/ (B14)
| File | Phase | Type |
|------|-------|------|
| `intake/IntakeModel.ts` | B14-P1 | New |
| `intake/checklists/*.json` | B14-P1 | New |
| `proposals/ProposalService.ts` | B14-P3 | New |
| `proposals/templates/*.md` | B14-P3 | New |

## /ops/billing/ (B14)
| File | Phase | Type |
|------|-------|------|
| `models/Invoice.ts` | B14-P4 | New |
| `ledger/BillingLedger.ts` | B14-P4 | New |
| `adapters/PaymentAdapter.ts` | B14-P4 | New |
| `adapters/LocalManualAdapter.ts` | B14-P4 | New |

## /ops/portal/ (B14)
| File | Phase | Type |
|------|-------|------|
| `HandoffPackageService.ts` | B14-P5 | New |
| `package.schema.json` | B14-P5 | New |
| `storage/local/*.ts` | B14-P5 | New |

## /contracts/ (B14)
| File | Phase | Type |
|------|-------|------|
| `templates/MSA_template.md` | B14-P2 | New |
| `templates/SOW_template.md` | B14-P2 | New |
| `templates/NDA_lite_template.md` | B14-P2 | New |
| `policies/template_usage_policy.md` | B14-P2 | New |

## /apps/tooling/ (B15)
| File | Phase | Type |
|------|-------|------|
| `ToolManifest.schema.json` | B15-P1 | New |
| `toolkit.ts` | B15-P1 | New |
| `loadTools.ts` | B15-P1 | New |
| `generatePolicies.ts` | B15-P7 | New |
| `tests/*` | B15-P1 | New |

## /apps/toolhub/ (B15)
| File | Phase | Type |
|------|-------|------|
| `*` | B15-P2 | New |
| `profiles/evident.json` | B15-P3 | New |
| `profiles/xtx396.json` | B15-P3 | New |

## /docs/ (B14, B15)
| File | Phase | Type |
|------|-------|------|
| `onboarding/intake.md` | B14-P1 | New |
| `onboarding/contracts.md` | B14-P2 | New |
| `onboarding/proposals.md` | B14-P3 | New |
| `onboarding/billing.md` | B14-P4 | New |
| `onboarding/portal.md` | B14-P5 | New |
| `onboarding/retention.md` | B14-P6 | New |
| `onboarding/confidence_builders.md` | B14-P7 | New |
| `onboarding/PLAYBOOK.md` | B14-P8 | New |
| `tools/EXISTING_APPS_INVENTORY.md` | B15-P0 | New |
| `tools/SHELL_INTEGRATION.md` | B15-P6 | New |
| `tools/README.md` | B15-P8 | New |

## Modified Existing Files
| File | Phase | Change |
|------|-------|--------|
| `scripts/verify.ps1` | Step 0 | New (gate runner) |
