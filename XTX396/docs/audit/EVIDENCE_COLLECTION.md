# Evidence Collection Automation

> B18-P2 | External Audit Preparation | Classification: Governance + Scripts
>
> **Purpose:** Define the automated evidence bundle generation process. An
> auditor or internal reviewer can reproduce the full evidence package from a
> single command.

---

## 1. Evidence Bundle Overview

The evidence bundle is a timestamped archive containing all artifacts an
external auditor needs to evaluate the control environment. It is generated
deterministically from the current repository state.

### Bundle Contents

| # | Artifact | Source | Format |
|---|---|---|---|
| 1 | Test Report | `npx vitest run --reporter=json` | `test-report.json` |
| 2 | Test Summary | Parsed from test report | `test-summary.txt` |
| 3 | Secret Scan | `scripts/security/workstation-hardening.ps1` (config section) | `secret-scan-result.txt` |
| 4 | Dependency Audit | `npm audit --json` | `dependency-audit.json` |
| 5 | Control Matrix | `docs/trust/CONTROL_MATRIX.md` | Markdown (copied) |
| 6 | Control Evidence Matrix | `docs/audit/CONTROL_EVIDENCE_MATRIX.md` | Markdown (copied) |
| 7 | Threat Model | `docs/trust/THREAT_MODEL.md` | Markdown (copied) |
| 8 | Audit Scope | `docs/audit/B18_SCOPE.md` | Markdown (copied) |
| 9 | Change Management Policy | `governance/change_management_policy.md` | Markdown (copied) |
| 10 | Patch Management Policy | `governance/security/patch_management_policy.md` | Markdown (copied) |
| 11 | Git History | `git log --oneline --since` (evaluation period) | `git-history.txt` |
| 12 | Branch Summary | `git branch -a` | `branch-summary.txt` |
| 13 | Bundle Manifest | Generated — lists every file with SHA-256 hash | `manifest.json` |

### Output Structure

```
audit_evidence_YYYYMMDD/
├── manifest.json
├── test-report.json
├── test-summary.txt
├── secret-scan-result.txt
├── dependency-audit.json
├── docs/
│   ├── CONTROL_MATRIX.md
│   ├── CONTROL_EVIDENCE_MATRIX.md
│   ├── THREAT_MODEL.md
│   └── B18_SCOPE.md
├── governance/
│   ├── change_management_policy.md
│   └── patch_management_policy.md
├── git-history.txt
└── branch-summary.txt
```

---

## 2. Generation Process

### Prerequisites

- Node.js and npm installed
- Repository cloned and dependencies installed (`npm ci`)
- PowerShell 7+ (for script execution)

### Execution

```powershell
# From repository root
.\scripts\audit\generate-evidence-bundle.ps1
```

### Process Steps

1. **Create output directory** — `audit_evidence_YYYYMMDD` (UTC date)
2. **Run test suite** — Execute all 4 test files, capture JSON report
3. **Parse test summary** — Extract pass/fail/skip counts
4. **Run dependency audit** — `npm audit --json`
5. **Copy governance documents** — All policy and control files
6. **Capture git history** — Last 90 days of commits
7. **Capture branch state** — All local and remote branches
8. **Generate manifest** — SHA-256 hash of every file in the bundle
9. **Compress** — Create `.zip` archive
10. **Verify** — Re-read manifest and validate all hashes

---

## 3. Manifest Format

```json
{
  "generated": "2025-01-15T00:00:00Z",
  "generator": "generate-evidence-bundle.ps1",
  "version": "1.0.0",
  "repositoryCommit": "abc1234",
  "fileCount": 13,
  "files": [
    {
      "path": "test-report.json",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "sizeBytes": 12345
    }
  ]
}
```

### Integrity Properties

- Every file in the bundle is listed in the manifest
- Every manifest entry includes a SHA-256 hash
- The manifest itself is the last file generated (it does not hash itself)
- Re-running the generation on the same commit produces the same hashes
  (excluding timestamps in the manifest metadata)

---

## 4. Reproducibility Guarantee

The bundle is reproducible if:

1. The repository is at the same commit (`repositoryCommit` in manifest)
2. Dependencies are installed from the same lockfile (`npm ci`)
3. The same Node.js major version is used
4. No external services are contacted during generation

All artifacts are derived from repository contents or deterministic
tool output. No network calls, no external APIs, no randomness.

---

## 5. Storage and Retention

- Evidence bundles should be stored in a secure, access-controlled location
- Bundles are NOT committed to the repository (added to `.gitignore`)
- Retention: minimum 2 years from generation date
- Access: limited to audit personnel, security team, and authorized counsel

---

## 6. Verification Process

An auditor can verify bundle integrity:

1. Extract the archive
2. Read `manifest.json`
3. For each file entry, compute SHA-256 and compare
4. Confirm `repositoryCommit` matches the expected evaluation commit
5. Optionally re-run the generation script at the same commit to
   produce an independent bundle for comparison

---

*B18-P2. Evidence collection process defined. Script follows.*
