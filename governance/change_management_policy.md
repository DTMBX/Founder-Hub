# Change Management Policy

> Governance | B17-P6 | Classification: Operational
>
> **Effective:** Upon merge of B17 chain.
>
> **Scope:** All code, configuration, governance, and infrastructure changes
> to the Evident Technologies platform.

---

## 1. Branch Protection Requirements

### Protected Branches

The following branches are subject to protection rules:

- `main` — production branch
- `master` — production branch (if used)
- `production` — deployment branch (if used)

### Required Protections

- Direct commits to protected branches are prohibited.
- All changes must arrive via pull request from a feature branch.
- Feature branches must follow the naming convention:
  `feature/{chain-id}-{descriptive-name}` (e.g., `feature/b17-external-trust-layer`).
- Force-push to protected branches is prohibited.

---

## 2. Phase Gating Requirement

### Phased Development

All non-trivial feature work must be structured as a phased chain:

- **Step 0:** Baseline validation — verify existing tests pass, create
  branch, document starting state.
- **Phases 1–N:** Incremental implementation with per-phase commits.
- **Final Phase:** Validation, documentation, and posture summary.

### Per-Phase Requirements

Each phase must:

1. Implement a discrete, testable unit of work.
2. Include tests for all new logic (where applicable).
3. Pass all existing tests before committing.
4. Be committed with a descriptive message: `B{chain}-P{phase}: {description}`.

---

## 3. Required Tests Before Merge

### Pre-Merge Gate

Before a feature branch is merged to a protected branch:

- All automated tests must pass (currently 401+ tests).
- Type checking must pass (`npx tsc --noEmit`).
- No new test failures introduced.
- Secret scanning must pass (no credentials in committed files).

### Test Execution

```sh
npx vitest run                    # Full test suite
npx tsc --noEmit                  # Type checking
npm run scan:secrets              # Secret scanning (if configured)
```

### Failure Policy

If any gate check fails, the merge is blocked until the failure is resolved.
"Fix forward" is not permitted for test failures on protected branches.

---

## 4. Required Documentation Before Feature Merge

### Documentation Gate

Every feature branch must include:

- Implementation documentation in `/docs/` appropriate to the feature scope.
- Governance policy updates in `/governance/` if the feature introduces new
  controls or modifies existing policies.
- Changelog entry documenting what was added, modified, or removed.

### Documentation Standards

- Documents must reference implemented artifacts (file paths, test suites).
- Documents must not contain speculative claims.
- Documents must be factual and maintain a professional tone.

---

## 5. Emergency Change Procedure

### When to Use

Emergency changes are permitted only when:

- A production incident is actively affecting service availability.
- A critical security vulnerability requires immediate remediation.
- Normal change management process would result in unacceptable delay.

### Procedure

1. **Authorization:** On-call engineer may initiate. A second engineer must
   review within 4 hours.
2. **Scope:** Minimize the change to the smallest fix that resolves the issue.
3. **Documentation:** Record the change, justification, and reviewer in the
   incident log.
4. **Testing:** Run available automated tests before deployment. If tests
   cannot be run, document the exception.
5. **Post-Emergency:** Within 24 hours, the change must be:
   - Reviewed through the standard pull request process.
   - Accompanied by appropriate tests.
   - Documented in the changelog.

### Restrictions

- Emergency changes must not introduce new features.
- Emergency changes must not modify governance policies.
- Emergency changes must not bypass secret scanning.

---

## 6. Rollback Procedure

### Pre-Deployment

Before deploying any change, verify:

- The previous deployment state is recoverable (backup or known-good commit).
- The deployment process supports rollback (revert to prior version).

### Rollback Trigger

Rollback is initiated when:

- Post-deployment monitoring detects SLO breach.
- Critical error rate exceeds defined thresholds.
- Evidence integrity is potentially compromised.

### Execution

1. Revert to the last known-good deployment.
2. Verify service restoration via health checks.
3. Notify affected stakeholders.
4. Investigate root cause before re-attempting deployment.

### Post-Rollback

- Record the rollback event in the incident log.
- Conduct root cause analysis.
- Re-run the full test suite before re-deployment.
- Update documentation if the rollback revealed a process gap.

---

*Established in B17-P6. Subject to review and amendment through the standard
change management process defined herein.*
