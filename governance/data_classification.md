# Data Classification Policy

> Version 1.0 | Last Updated: 2026-02-17

This document defines data classification levels and handling requirements
for all data processed, stored, or transmitted by XTX396 systems.

---

## Classification Levels

### 🔴 CRITICAL (Level 4)
Data that, if exposed, would cause severe harm to the organization or individuals.

**Examples:**
- Authentication credentials (passwords, API keys, tokens)
- Encryption keys and certificates
- Payment card data (PCI DSS scope)
- Social security numbers
- Healthcare records (HIPAA scope)

**Handling Requirements:**
- ✅ Encryption at rest (AES-256)
- ✅ Encryption in transit (TLS 1.3)
- ✅ Access logging required
- ✅ MFA required for access
- ✅ No logging of values
- ✅ Immediate notification on exposure
- ❌ Never in source code
- ❌ Never in logs
- ❌ Never in error messages

---

### 🟠 CONFIDENTIAL (Level 3)
Data that is sensitive and restricted to authorized personnel.

**Examples:**
- User personal information (PII)
- Email addresses
- Phone numbers
- IP addresses
- Session data
- Internal business metrics
- Customer lists

**Handling Requirements:**
- ✅ Encryption at rest
- ✅ Encryption in transit
- ✅ Access controls enforced
- ✅ Audit logging
- ⚠️ Anonymize in non-prod environments
- ⚠️ Redact in logs where possible
- ❌ No external sharing without approval

---

### 🟡 INTERNAL (Level 2)
Data intended for internal use but not highly sensitive.

**Examples:**
- Internal documentation
- Non-sensitive configuration
- Development notes
- Sprint/project plans
- Internal communications

**Handling Requirements:**
- ✅ Access limited to employees/contractors
- ✅ Basic access controls
- ⚠️ No public sharing
- ✅ May appear in internal logs

---

### 🟢 PUBLIC (Level 1)
Data intended for public consumption.

**Examples:**
- Marketing content
- Public documentation
- Open source code
- Published blog posts
- Public API schemas

**Handling Requirements:**
- ✅ Can be shared publicly
- ✅ No access restrictions required
- ⚠️ Review before publication

---

## Data Inventory

### Source Code Repository

| Data Type | Classification | Location | Notes |
|-----------|---------------|----------|-------|
| Application code | Internal | `src/` | Open source consideration |
| Test data | Internal | `tests/` | No real PII |
| Configuration | Internal | `*.config.*` | No secrets |
| Secrets | 🔴 CRITICAL | GitHub Secrets | Never in code |
| API keys | 🔴 CRITICAL | Environment vars | Never committed |
| User data schemas | Confidential | `src/types/` | Structure only |

### Runtime Environment

| Data Type | Classification | Location | Notes |
|-----------|---------------|----------|-------|
| Environment variables | 🔴 CRITICAL | Runtime only | Netlify/Vercel secrets |
| User sessions | Confidential | Memory/Redis | Encrypted, TTL enforced |
| Audit logs | Confidential | Append-only store | Retained 7 years |
| Application logs | Internal | Log aggregator | Redacted output |
| Analytics | Internal | Analytics platform | Anonymized |

---

## Handling Procedures

### Development
1. **Never commit secrets** - Use environment variables
2. **Use test data** - Never use production data in development
3. **Redact in logs** - Use redaction engine for all output
4. **Review before commit** - Check for accidental secret inclusion

### Code Review
1. **Check for hardcoded secrets**
2. **Verify data classification in comments**
3. **Ensure proper encryption for sensitive data**
4. **Validate logging doesn't expose sensitive data**

### Deployment
1. **Secrets via secure channels only** (GitHub Secrets, Netlify env)
2. **Never log deployment credentials**
3. **Verify environment isolation**
4. **Audit access to production secrets**

### Incident Response
1. **Classify exposed data immediately**
2. **Critical data exposure = immediate escalation**
3. **Rotate all potentially compromised credentials**
4. **Notify affected parties per legal requirements**

---

## Secret Detection

### Automated Scanning
- GitHub Secret Scanning: **ENABLED**
- Push Protection: **ENABLED**
- Pre-commit hooks: **RECOMMENDED**

### Patterns Detected
```regex
# API Keys
(?i)(api[_-]?key|apikey)[=:\s]["']?([a-zA-Z0-9_\-]{16,})

# AWS
(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}
aws[_-]?secret[_-]?key[=:\s]["']?([a-zA-Z0-9/+=]{40})

# GitHub
gh[ps]_[a-zA-Z0-9]{36,}

# Stripe
sk_(live|test)_[a-zA-Z0-9]{24,}

# Database URLs
(postgres|mysql|mongodb):\/\/[^:]+:[^@]+@

# Private Keys
-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----

# Generic Secrets
(?i)(password|passwd|pwd|secret)[=:\s]["']?([^"'\s]{8,})
```

---

## Compliance Requirements

### Regulatory
- **PCI DSS** - Payment card data handling
- **GDPR** - EU personal data protection
- **CCPA** - California consumer privacy
- **SOC 2** - Security controls

### Internal
- **Access reviews** - Quarterly
- **Classification review** - Annual
- **Training** - Required for all developers
- **Incident reporting** - Within 24 hours

---

## Violation Response

### Severity Levels

| Violation | Severity | Response |
|-----------|----------|----------|
| Secret committed to repo | Critical | Immediate rotation, incident review |
| PII in logs | High | Remove logs, review access, notify |
| Unencrypted sensitive data | High | Encrypt immediately, assess exposure |
| Missing access controls | Medium | Implement controls, audit access |
| Classification mislabeling | Low | Correct classification, train team |

### Escalation Path
1. **Developer** - Immediate fix
2. **Tech Lead** - Review and verify
3. **Security Team** - Assess exposure
4. **Legal/Compliance** - Regulatory notification

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-17 | Initial release |
