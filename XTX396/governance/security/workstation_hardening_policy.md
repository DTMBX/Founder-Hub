# Workstation Hardening Policy — B13-P7

**Effective:** 2025-01-01
**Owner:** Engineering / Security
**Classification:** Internal

---

## 1. Purpose

Defines baseline security requirements for developer workstations accessing
Evident Technologies source code and infrastructure.

## 2. Required Controls

### 2.1 Mandatory

| Control | Requirement | Verification |
|---------|-------------|-------------|
| Credential storage | Non-plaintext helper (e.g., `manager`, `osxkeychain`) | `git config credential.helper` |
| Disk encryption | Full-disk encryption enabled (BitLocker, FileVault) | OS settings |
| Firewall | OS firewall enabled | OS settings |
| No secrets in configs | Shell configs free of API keys, tokens, passwords | Script scan |

### 2.2 Recommended

| Control | Requirement | Verification |
|---------|-------------|-------------|
| Commit signing | GPG or SSH signing enabled | `git config commit.gpgsign` |
| SSH key type | Ed25519 preferred | `~/.ssh/` inspection |
| Global gitignore | `.env` excluded globally | `git config core.excludesFile` |
| Git hooks | Global hooks directory configured | `git config core.hooksPath` |

## 3. Verification

Run the workstation hardening audit script:

```powershell
.\scripts\security\workstation-hardening.ps1
.\scripts\security\workstation-hardening.ps1 -Fix  # Auto-fix where possible
```

## 4. Frequency

- **Onboarding:** Run on first day
- **Monthly:** Automated check via CI or local script
- **After incident:** Re-verify all workstations

## 5. Exceptions

Exceptions require Engineering Lead approval and must be documented with:

- Reason for exception
- Compensating controls
- Expiration date (maximum 90 days)

## 6. Non-Compliance

Workstations failing mandatory controls must be remediated within 48 hours.
Continued non-compliance may result in access suspension.
