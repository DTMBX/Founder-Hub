# Rollback Runbook

> Version 1.0 | Last Updated: 2026-02-17
> 
> **Target Rollback Time: < 15 minutes**

This runbook provides step-by-step procedures for rolling back deployments
across all environments.

---

## Quick Reference

### Emergency Rollback (< 2 minutes)

```bash
# Netlify: Instant rollback to previous deploy
netlify rollback

# Or via CLI with specific deploy ID
netlify deploy --prod --deploy-id=<PREVIOUS_DEPLOY_ID>
```

### Standard Rollback Checklist
- [ ] Confirm incident severity
- [ ] Notify #incidents channel
- [ ] Execute rollback procedure
- [ ] Verify rollback success
- [ ] Update status page
- [ ] Document in incident log

---

## Rollback Procedures by Environment

### Production Rollback

#### Method 1: Netlify Dashboard (Fastest)
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select site → **Deploys**
3. Find last known good deploy
4. Click **⋮** → **Publish deploy**
5. Confirm publish

**Time: ~30 seconds**

#### Method 2: Netlify CLI
```bash
# List recent deploys
netlify deploy:list

# Rollback to specific deploy
netlify deploy --prod --deploy-id=<DEPLOY_ID>

# Or rollback to previous
netlify rollback
```

**Time: ~1 minute**

#### Method 3: Git Revert (If code fix needed)
```bash
# Create rollback branch
git checkout -b rollback/incident-<TICKET_ID>

# Revert the problematic commit(s)
git revert <COMMIT_SHA>

# Push and create emergency PR
git push origin rollback/incident-<TICKET_ID>

# Fast-track merge (requires 2 admin approvals)
```

**Time: ~5-10 minutes**

---

### Staging Rollback

```bash
# Via Netlify
netlify deploy --context=staging --deploy-id=<DEPLOY_ID>

# Via git (if needed)
git checkout staging
git reset --hard <KNOWN_GOOD_SHA>
git push --force-with-lease origin staging
```

---

### Preview Rollback

Preview deploys are per-PR and isolated. Options:
1. Close the PR (stops preview)
2. Push fix to the PR branch
3. No action needed (preview is isolated)

---

## Rollback Triggers

### Automatic Rollback Triggers
These conditions trigger automatic rollback investigation:

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Error rate spike | > 5% of requests | Alert + investigate |
| Response time | > 3s p95 | Alert + investigate |
| Health check fail | 3 consecutive | Auto-rollback |
| Memory/CPU spike | > 90% sustained | Alert + investigate |

### Manual Rollback Triggers
Initiate manual rollback for:
- User-reported critical bug
- Security vulnerability discovered
- Data corruption detected
- Payment processing failure
- Authentication broken

---

## Pre-Rollback Checklist

Before executing rollback:

- [ ] **Confirm the issue** - Is rollback the right action?
- [ ] **Identify scope** - What's affected?
- [ ] **Check data impact** - Will rollback cause data issues?
- [ ] **Notify stakeholders** - Alert team in #incidents
- [ ] **Prepare verification** - Know how to confirm fix

---

## Post-Rollback Checklist

After rollback completes:

- [ ] **Verify deployment** - Check site is serving old version
- [ ] **Test critical paths** - Login, key features work
- [ ] **Check monitoring** - Error rates returning to normal
- [ ] **Update status page** - Communicate resolution
- [ ] **Create incident ticket** - Document the event
- [ ] **Schedule post-mortem** - Within 48 hours

---

## Verification Steps

### Health Check
```bash
# Check site responds
curl -I https://xtx396.com

# Check health endpoint
curl https://xtx396.com/api/health

# Expected: 200 OK
```

### Smoke Tests
1. Homepage loads
2. Navigation works
3. Key features function:
   - Contact form submits
   - Dynamic content loads
   - API responses correct

### Monitoring Verification
- [ ] Error rate < 1%
- [ ] Response time < 500ms
- [ ] No new error signatures
- [ ] Uptime monitor green

---

## Rollback Communication

### Internal Notification Template
```
🚨 ROLLBACK INITIATED

Environment: [PRODUCTION/STAGING]
Time: [TIMESTAMP]
Reason: [BRIEF DESCRIPTION]
Rollback to: [DEPLOY_ID or VERSION]
Lead: [@HANDLE]

Status: [IN PROGRESS / COMPLETE]
ETA to resolution: [TIME]

Updates in #incidents
```

### External Status Update
```
We are currently experiencing issues with [FEATURE].
Our team is actively working on a fix.
Updates will be posted here.

[TIMESTAMP] - Issue identified
[TIMESTAMP] - Fix deployed
[TIMESTAMP] - Monitoring for stability
```

---

## Rollback Scenarios

### Scenario 1: UI/Display Bug
**Severity:** Medium  
**Action:** Standard rollback  
**Time:** < 5 minutes

```bash
netlify rollback
# Verify homepage renders correctly
curl -s https://xtx396.com | grep -q "expected content"
```

### Scenario 2: API Failure
**Severity:** High  
**Action:** Immediate rollback  
**Time:** < 2 minutes

```bash
# Immediate rollback
netlify rollback

# Verify API responds
curl https://xtx396.com/api/health
# Expected: {"status":"ok"}
```

### Scenario 3: Security Vulnerability
**Severity:** Critical  
**Action:** Immediate rollback + rotate secrets  
**Time:** < 5 minutes

```bash
# 1. Immediate rollback
netlify rollback

# 2. Rotate any exposed secrets
# (Via Netlify Dashboard / GitHub Secrets)

# 3. Force cache clear
netlify deploy:unlock
```

### Scenario 4: Database Migration Issue
**Severity:** Critical  
**Action:** Rollback + DB restore  
**Time:** 15-30 minutes

> ⚠️ Requires DBA involvement

1. Rollback application
2. Assess data state
3. Execute DB rollback if needed
4. Verify data integrity
5. Redeploy verified version

---

## Emergency Contacts

| Role | Contact | Escalation Time |
|------|---------|-----------------|
| On-Call Engineer | Check PagerDuty | Immediate |
| Tech Lead | @tech-lead | 5 minutes |
| Platform Admin | @admin | 10 minutes |
| Security Team | security@xtx396.com | 15 minutes |

---

## Testing Rollback

### Monthly Drill
1. Deploy to staging with intentional bug
2. Detect via monitoring
3. Execute rollback procedure
4. Document time to resolution
5. Review and improve process

### Drill Metrics
- **Detection time:** < 2 minutes
- **Decision time:** < 1 minute
- **Rollback execution:** < 2 minutes
- **Verification:** < 2 minutes
- **Total target:** < 10 minutes

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-17 | Initial release |
