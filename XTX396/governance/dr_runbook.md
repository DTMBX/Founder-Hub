# Disaster Recovery Runbook

> Version 1.0 | Last Updated: 2026-02-17 | Chain B5
>
> **Emergency Contact:** @DTMBX
> **Backup Location:** See [Backup Policy](./backup_policy.md)

This runbook provides step-by-step procedures for recovering from disasters
affecting the XTX396 repository and related infrastructure.

---

## Quick Reference

### Emergency Restore (< 15 minutes)

```bash
# 1. Download latest backup
scripts/restore-rehearsal.ps1 -Download -Latest

# 2. Decrypt and extract
scripts/restore-rehearsal.ps1 -Decrypt -Archive backup-latest.tar.gz.enc

# 3. Verify integrity
scripts/restore-rehearsal.ps1 -Verify

# 4. Restore to target
scripts/restore-rehearsal.ps1 -Restore -Target ./restored
```

### DR Activation Checklist

- [ ] Confirm disaster scope
- [ ] Notify stakeholders
- [ ] Activate backup access
- [ ] Execute restore procedure
- [ ] Verify restoration
- [ ] Update DNS/routing (if needed)
- [ ] Document incident

---

## Disaster Scenarios

### Scenario 1: Repository Corruption

**Cause:** Force push error, merge corruption, bad rebases

**Impact:** Code history damaged, builds fail

**Recovery:**
1. Identify corruption scope (which commits affected)
2. Download last known good backup
3. Compare and selectively restore

```bash
# Clone from backup instead of origin
git clone ./restored/XTX396.git XTX396-recovered

# Compare with corrupted
git diff origin/main..backup/main

# Force push recovery (requires admin)
git push --force origin main
```

**Time to Recover:** 15-30 minutes

---

### Scenario 2: Accidental Deletion

**Cause:** Repository deleted, branch deleted, files deleted

**Impact:** Code unavailable, deployment blocked

**Recovery:**
1. Confirm deletion is not recoverable via GitHub UI
2. Restore from nightly backup
3. Recreate repository settings if needed

```bash
# If repo deleted, create new repo first
gh repo create DTMBX/XTX396 --private

# Push from backup
cd restored/XTX396
git remote add origin https://github.com/DTMBX/XTX396.git
git push --all origin
git push --tags origin
```

**Time to Recover:** 30-60 minutes

---

### Scenario 3: Security Compromise

**Cause:** Stolen credentials, malicious commits, supply chain attack

**Impact:** Code integrity unknown, secrets exposed

**Recovery:**
1. **IMMEDIATELY** revoke all tokens and credentials
2. Audit commit history for malicious changes
3. Restore from last verified backup
4. Rotate ALL secrets (GitHub, Netlify, storage)
5. Enable enhanced monitoring

```bash
# Revoke GitHub App
gh api -X DELETE /app/installations/<ID>

# List and revoke PATs
gh auth token --list
gh auth logout

# Rotate Netlify token
netlify logout
netlify login

# Restore from VERIFIED backup (check provenance)
scripts/restore-rehearsal.ps1 -Restore -VerifyProvenance
```

**Time to Recover:** 1-4 hours

---

### Scenario 4: GitHub Outage

**Cause:** GitHub service disruption

**Impact:** Cannot push, pull, or deploy

**Recovery:**
1. Check [GitHub Status](https://githubstatus.com)
2. If extended outage, work from local clones
3. Deploy from local build if critical

```bash
# Build locally
npm run build

# Deploy directly to Netlify
netlify deploy --prod --dir=dist

# Document in incident log
```

**Time to Recover:** Depends on GitHub (typically < 4 hours)

---

### Scenario 5: Complete Infrastructure Loss

**Cause:** Provider failure, account termination, catastrophic event

**Impact:** Everything unavailable

**Recovery:**
1. Activate DR site/account
2. Restore all repositories from backup
3. Reconfigure CI/CD pipelines
4. Update DNS to new infrastructure
5. Notify all stakeholders

**Time to Recover:** 4-24 hours

---

## Restore Procedures

### Step 1: Access Backup Storage

```bash
# Configure AWS CLI with backup credentials
aws configure --profile xtx396-backup

# List available backups
aws s3 ls s3://xtx396-backups-primary/daily/ --profile xtx396-backup
```

### Step 2: Download Backup

```bash
# Download latest
aws s3 cp s3://xtx396-backups-primary/daily/backup-latest.tar.gz.enc . \
  --profile xtx396-backup

# Or specific date
aws s3 cp s3://xtx396-backups-primary/daily/backup-20260217-0200.tar.gz.enc . \
  --profile xtx396-backup
```

### Step 3: Decrypt Backup

```bash
# Using the restore script (recommended)
scripts/restore-rehearsal.ps1 -Decrypt -Archive backup-latest.tar.gz.enc

# Manual decryption (if script unavailable)
openssl enc -d -aes-256-gcm \
  -in backup-latest.tar.gz.enc \
  -out backup-latest.tar.gz \
  -pass file:$BACKUP_KEY_FILE
```

### Step 4: Extract and Verify

```bash
# Extract
tar -xzf backup-latest.tar.gz

# Verify checksums
sha256sum -c backup-manifest.sha256

# Verify provenance (if available)
cat backup-manifest.json | jq '.provenance'
```

### Step 5: Restore Repository

```bash
# Clone from backup bundle
git clone backup/XTX396.bundle restored-XTX396

# Verify branches and tags
cd restored-XTX396
git branch -a
git tag

# Test build
npm ci && npm run build && npm test
```

---

## Quarterly Restore Drill

### Purpose

Verify backup integrity and team readiness through simulated disaster recovery.

### Schedule

- **Q1:** January 15th
- **Q2:** April 15th
- **Q3:** July 15th
- **Q4:** October 15th

### Drill Checklist

#### Pre-Drill (Day Before)

- [ ] Notify team of scheduled drill
- [ ] Verify backup storage access
- [ ] Prepare isolated test environment
- [ ] Review this runbook for updates

#### Drill Execution

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Download backup from storage | File downloaded successfully | |
| 2 | Verify checksum | SHA256 matches manifest | |
| 3 | Decrypt archive | Archive decrypts without error | |
| 4 | Extract contents | All files extracted | |
| 5 | Clone repository from backup | Valid git repository | |
| 6 | Verify commit history | All commits present | |
| 7 | Verify branches | All branches present | |
| 8 | Verify tags | All tags present | |
| 9 | Install dependencies | `npm ci` succeeds | |
| 10 | Run tests | All tests pass | |
| 11 | Build project | Build completes successfully | |
| 12 | Verify provenance | Provenance record valid (if applicable) | |

#### Post-Drill

- [ ] Document drill results
- [ ] File issues for any failures
- [ ] Update runbook if procedures changed
- [ ] Report drill completion to stakeholders
- [ ] Schedule next drill

### Drill Report Template

```markdown
# DR Drill Report - Q[N] YYYY

**Date:** YYYY-MM-DD
**Participants:** @user1, @user2
**Duration:** X hours

## Summary
[Pass/Partial/Fail] - [Brief description]

## Steps Completed
1. [x] Download backup - 2 min
2. [x] Verify checksum - 1 min
...

## Issues Found
- Issue 1: [Description]
- Issue 2: [Description]

## Actions Taken
- [ ] Action 1
- [ ] Action 2

## Recommendations
- [Any process improvements]

## Next Drill
Scheduled for: YYYY-MM-DD
```

---

## Communication Plan

### During Disaster

| Stakeholder | Channel | Update Frequency |
|-------------|---------|------------------|
| Engineering | Slack #incidents | Every 15 min |
| Leadership | Email | Every 30 min |
| Customers (if affected) | Status page | Hourly |

### Templates

#### Initial Alert
```
⚠️ DR ACTIVATED: [Brief description]
Time: [UTC timestamp]
Impact: [Scope]
Current Status: [Action being taken]
ETA: [If known]
Next Update: [Time]
```

#### Resolution
```
✅ DR RESOLVED: [Brief description]
Duration: [Total time]
Root Cause: [If known]
Impact: [What was affected]
Follow-up: [Post-mortem scheduled]
```

---

## Post-Incident

### Immediate (First Hour)

- [ ] Verify all systems operational
- [ ] Confirm data integrity
- [ ] Check for any lingering issues
- [ ] Send resolution notification

### Same Day

- [ ] Create incident ticket
- [ ] Collect logs and evidence
- [ ] Initial timeline document
- [ ] Schedule post-mortem

### Within 48 Hours

- [ ] Conduct post-mortem meeting
- [ ] Document root cause
- [ ] Identify action items
- [ ] Update runbooks as needed

---

## Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Primary On-Call | @DTMBX | 24/7 |
| Backup Storage Admin | [TBD] | Business hours |
| GitHub Support | support@github.com | 24/7 (Enterprise) |
| Netlify Support | support@netlify.com | 24/7 |

---

## Related Documents

- [Backup Policy](./backup_policy.md)
- [Rollback Runbook](./rollback_runbook.md)
- [Release Process](./release_process.md)
- [Security Incident Response](./security_incident_response.md)

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-02-17 | 1.0 | System | Initial runbook (Chain B5) |
