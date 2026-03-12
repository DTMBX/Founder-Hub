# Admin Login & Client Account Guide

> **PRIVATE — DO NOT COMMIT TO PUBLIC REPO**
> Add `docs/ops/ADMIN-LOGIN-GUIDE.md` to `.gitignore` if not already excluded.

---

## 1. Founder / Owner Login

### First-Time Setup (Fresh Deploy)

1. Navigate to `https://devon-tyler.com/#admin`
2. If no account exists, the **First Run Setup** screen appears automatically
3. Enter your email and a password (minimum 12 characters)
4. Click **Create Account** — you're assigned the `owner` role
5. **Save your backup codes and recovery phrase** — they're shown once and stored as hashes only
6. A recovery checkpoint is created automatically after setup

### Logging In Locally (localhost / dev)

1. Run `npm run dev` (Vite dev server)
2. Go to `http://localhost:5173/#admin`
3. The **Credentials** tab is selected by default on localhost
4. Enter your email + password
5. If 2FA is enabled, enter your TOTP code when prompted
6. Session lasts 4 hours, auto-refreshes if less than 30 min remaining

### Logging In Remotely (production — devon-tyler.com)

1. Go to `https://devon-tyler.com/#admin`
2. The **GitHub** tab is selected by default on production
3. Paste a GitHub Personal Access Token (PAT) with `repo` scope for `DTMBX/Founder-Hub`
4. The system verifies the token has push access, then creates/reuses your owner session
5. The PAT is stored encrypted in the secret vault for future publishes

**To generate a GitHub PAT:**
- GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
- Repository access: `DTMBX/Founder-Hub` only
- Permissions: Contents (Read and write)

### Lockout Recovery

- **3 failed attempts** → 30-minute lockout
- **Backup codes**: Enter in the login form under "Alternative Methods" → "Backup Code"
- **Recovery phrase**: Enter under "Alternative Methods" → "Recovery Phrase"
- **USB keyfile**: If configured, plug in the USB and select the `.keyfile.json`

---

## 2. Creating Client Accounts (Paying Website Customers)

### Via the User Management Panel

1. Log in as `owner` (see above)
2. In the admin sidebar, go to **System & Security → User Management**
3. Click **Add User**
4. Fill in:
   - **Email**: Client's email address
   - **Password**: Generate a strong 12+ char password, share securely (Signal, encrypted email, etc.)
   - **Role**: Choose based on access level:

| Role | Access Level | Best For |
|------|-------------|----------|
| `editor` | Content editing only, no destructive actions | Standard website clients — they can update their own content |
| `support` | Read-only + ticket notes, no edits | View-only clients who just need to see their dashboard |
| `admin` | Operations + deploy to preview/staging | Trusted clients who manage their own deploys |
| `owner` | Full system access (DO NOT assign to clients) | You only |

5. Click **Create User**
6. The action is logged in the Audit Log automatically

### Recommended Workflow for Client Onboarding

1. **Create the account** with role `editor`
2. **Share credentials securely** — never over plaintext email:
   - Signal message (disappearing messages enabled)
   - In-person handoff
   - Encrypted email (ProtonMail → ProtonMail)
3. **Tell the client** to go to `https://devon-tyler.com/#admin` and log in with their credentials
4. Optionally have them enable 2FA from **Security** in the admin panel
5. If the client needs a dedicated site, set one up via **Client Sites** panel first

### Managing Client Accounts

From the **User Management** panel you can:
- **Change role**: Click the pencil icon next to any user → select new role → Save
- **Delete account**: Click the trash icon (cannot delete your own account)
- All changes are recorded in the **Audit Log**

### Client Role Restrictions

Clients with `editor` role can:
- Edit content, pages, about section, links
- Upload media to staging
- View their assigned site

Clients with `editor` role CANNOT:
- Access User Management, Secret Vault, Recovery, or Security panels
- Publish to production
- Delete other users' content
- Access the Audit Log

---

## 3. Security Reminders

- **Sessions expire in 4 hours** — no perpetual logins
- **Lockout after 3 failed attempts** — 30 minutes (incident logged automatically)
- **Device fingerprinting** is active — new devices are identified on login
- **All admin actions are audited** — check Audit Log regularly
- **Rotate your GitHub PAT** periodically via GitHub settings
- **Never store passwords in plaintext** — the system uses PBKDF2 with 100k iterations

---

## 4. Quick Reference

| Action | Where |
|--------|-------|
| Log in | `devon-tyler.com/#admin` |
| First-time setup | Automatic on first visit to `#admin` |
| Add client account | Admin → System & Security → User Management → Add User |
| Change client role | Admin → User Management → pencil icon |
| Remove client | Admin → User Management → trash icon |
| View login history | Admin → Audit Log |
| Manage secrets/keys | Admin → System & Security → Secret Vault |
| Security incidents | Admin → System & Security → Incidents |
| Recovery/backups | Admin → System & Security → Recovery & Backups |
