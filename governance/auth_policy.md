# Authentication & Session Policy

**Chain B7** — Identity + Session Hardening  
**Effective Date:** 2026-02-17  
**Version:** 1.0.0

---

## Purpose

This policy establishes authentication, session management, and device trust
requirements for XTX396 systems. These controls protect privileged operations
and provide auditability for all identity-related events.

---

## 1. Authentication Requirements

### 1.1 Multi-Factor Authentication (MFA)

| Role           | MFA Required | Enforcement       |
|----------------|--------------|-------------------|
| Owner          | **Yes**      | Mandatory         |
| Admin          | **Yes**      | Mandatory         |
| Editor         | Recommended  | Prompted on login |
| Support        | Recommended  | Prompted on login |
| Viewer         | Optional     | User choice       |

**Acceptable MFA Methods:**
- Hardware security keys (WebAuthn/FIDO2) — **Preferred**
- Time-based One-Time Passwords (TOTP)
- Push notifications via authenticator apps

**Prohibited Methods:**
- SMS-based OTP (susceptible to SIM swapping)
- Email-based codes as sole factor

### 1.2 Password Requirements

- Minimum 12 characters
- No reuse of last 12 passwords
- Must not appear in known breach databases
- Changed immediately upon suspected compromise

### 1.3 Step-Up Authentication

Privileged actions require re-authentication even within an active session:

| Action                     | Re-auth Required | Max Age      |
|----------------------------|------------------|--------------|
| Publish to production      | Yes              | 5 minutes    |
| Modify security settings   | Yes              | 5 minutes    |
| Add/remove team members    | Yes              | 5 minutes    |
| Revoke sessions            | Yes              | 5 minutes    |
| Access secrets/keys        | Yes              | 5 minutes    |
| Approve new device         | Yes              | Immediate    |
| Change email/password      | Yes              | Immediate    |
| Export audit logs          | Yes              | 15 minutes   |
| Delete data                | Yes              | Immediate    |

---

## 2. Session Management

### 2.1 Session Lifetimes

| Session Type        | Idle Timeout | Absolute Timeout |
|---------------------|--------------|------------------|
| Standard            | 30 minutes   | 8 hours          |
| Remember Me         | 7 days       | 30 days          |
| Deploy-Capable      | 15 minutes   | 2 hours          |
| Read-Only           | 2 hours      | 24 hours         |

### 2.2 Session Scopes

Sessions operate under least-privilege principles:

| Scope           | Permissions                                      |
|-----------------|--------------------------------------------------|
| `read`          | View content, browse admin, export reports       |
| `write`         | Edit content, manage assets, update settings     |
| `deploy`        | Publish to production, manage deployments        |
| `admin`         | User management, security settings, audit access |
| `owner`         | Full system access, billing, critical operations |

**Scope Elevation:**
- Users must explicitly request elevated scopes
- Elevated scopes require step-up authentication
- Elevated scopes have reduced timeouts

### 2.3 Session Termination

Sessions are terminated immediately upon:
- Explicit logout
- Password change
- MFA device change
- Administrator revocation
- Suspected compromise
- Role demotion

### 2.4 Concurrent Sessions

| Role    | Max Concurrent Sessions |
|---------|-------------------------|
| Owner   | 3                       |
| Admin   | 5                       |
| Editor  | 10                      |
| Support | 10                      |
| Viewer  | Unlimited               |

Oldest sessions are terminated when limit exceeded.

---

## 3. Device Trust

### 3.1 Device Registration

- First login from a new device triggers alert
- New devices require explicit approval for privileged roles
- Device fingerprinting includes: browser, OS, IP geolocation

### 3.2 Trusted Device List

Users may designate up to **10 trusted devices** which:
- Skip new-device alerts
- Have extended session timeouts
- Are logged in audit trail

### 3.3 Device Approval Flow

1. User attempts login from unknown device
2. System generates device fingerprint
3. Notification sent to user's registered email/authenticator
4. User must approve within 15 minutes
5. Approval logged to audit trail
6. Device added to trusted list (optional)

### 3.4 Device Revocation

- Users can revoke any device at any time
- Administrators can revoke all user devices
- Revocation terminates all sessions from that device
- Revocation event logged with reason

---

## 4. Audit Requirements

### 4.1 Logged Events

All identity events are logged to the tamper-evident audit ledger:

| Event                  | Severity | Retention |
|------------------------|----------|-----------|
| Login success          | Info     | 90 days   |
| Login failure          | Warning  | 90 days   |
| Logout                 | Info     | 90 days   |
| MFA enrollment         | Info     | 1 year    |
| MFA failure            | Warning  | 90 days   |
| Password change        | Info     | 1 year    |
| Role change            | Warning  | 1 year    |
| Session revocation     | Warning  | 90 days   |
| Device approval        | Info     | 1 year    |
| Device revocation      | Warning  | 1 year    |
| Step-up auth success   | Info     | 90 days   |
| Step-up auth failure   | Warning  | 90 days   |
| Suspicious activity    | Critical | 2 years   |

### 4.2 Alert Triggers

Immediate alerts are generated for:
- 5+ failed login attempts in 15 minutes
- Login from new country
- Login from Tor/VPN (configurable)
- Simultaneous logins from different geolocations
- Role escalation
- Bulk session revocation

---

## 5. Account Recovery

### 5.1 Recovery Methods

1. **Primary:** Recovery codes (generated at MFA enrollment)
2. **Secondary:** Administrator-assisted recovery
3. **Tertiary:** Identity verification process

### 5.2 Recovery Restrictions

- Recovery disables account for 24 hours for critical roles
- All sessions terminated upon recovery
- All devices untrusted upon recovery
- Event logged as security incident

---

## 6. Implementation References

| Component                    | Location                              |
|-----------------------------|---------------------------------------|
| Session Manager              | `src/lib/session-manager.ts`         |
| Device Trust                 | `src/lib/device-trust.ts`            |
| Step-Up Auth                 | `src/lib/step-up-auth.ts`            |
| Security Settings UI         | `src/components/admin/SecuritySettings.tsx` |
| Audit Integration            | `src/lib/audit-ledger.ts`            |

---

## 7. Compliance

This policy supports compliance with:
- SOC 2 Type II (Access Control)
- ISO 27001 (A.9.4)
- NIST 800-53 (IA, AC families)

---

## Revision History

| Version | Date       | Author         | Changes                          |
|---------|------------|----------------|----------------------------------|
| 1.0.0   | 2026-02-17 | XTX396 System  | Initial policy                   |
