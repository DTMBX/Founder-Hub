# Two-Factor Authentication Test Guide

## Overview
This guide walks through testing the complete 2FA implementation for the xTx396 Founder Hub admin portal.

## Prerequisites
- Access to the admin dashboard
- A TOTP authenticator app installed on your mobile device:
  - **Google Authenticator** (iOS/Android)
  - **Authy** (iOS/Android/Desktop)
  - **Microsoft Authenticator** (iOS/Android)
  - **1Password** (iOS/Android/Desktop)
  - **Bitwarden** (iOS/Android/Desktop)

## Test Scenario 1: Enable Two-Factor Authentication

### Step 1: Login to Admin Portal
1. Navigate to `#admin` or click the admin link
2. Login with credentials:
   - Email: `admin@xtx396.online`
   - Password: `SecureAdmin2024!`
3. You should successfully reach the admin dashboard

### Step 2: Navigate to Security Settings
1. In the admin dashboard sidebar, click **"Users & Security"**
2. You should see the Security & Access page
3. Locate the **"Two-Factor Authentication"** card

### Step 3: Start 2FA Setup
1. Click **"Enable Two-Factor Authentication"** button
2. A setup dialog will appear with:
   - QR code for scanning
   - Manual entry key (base32 encoded secret)
   - 10 backup codes displayed in a grid
   - Verification code input field

### Step 4: Scan QR Code
1. Open your authenticator app
2. Choose "Add account" or "Scan QR code"
3. Scan the QR code displayed in the dialog
4. The app should add an account labeled: **"xTx396 Hub (admin@xtx396.online)"**

**Alternative - Manual Entry:**
1. If QR scanning doesn't work, click the copy button next to "Manual Entry Key"
2. In your authenticator app, choose "Enter key manually"
3. Account name: `xTx396 Hub`
4. Email: `admin@xtx396.online`
5. Key: Paste the copied secret
6. Time-based: Yes
7. Algorithm: SHA1
8. Digits: 6
9. Period: 30 seconds

### Step 5: Save Backup Codes
1. Click **"Copy All Backup Codes"** button
2. Save the codes in a secure location (password manager, encrypted file, physical safe)
3. **Important:** You'll need these if you lose access to your authenticator app
4. Each code can be used only once
5. Format: `XXXX-XXXX` (8 characters with hyphen)

### Step 6: Verify and Enable
1. Wait for your authenticator app to generate a 6-digit code
2. Enter the code in the "Verification Code" field
3. Click **"Enable 2FA"**
4. If successful, you'll see:
   - Success toast: "Two-factor authentication enabled successfully"
   - Dialog closes
   - The 2FA card now shows "Two-factor authentication is enabled"

### Step 7: Verify Status
1. Check the **"Security Features"** card
2. "Two-Factor Authentication" should show a green lock icon
3. Status should read: "Enabled with TOTP"
4. The **"Two-Factor Authentication"** card should show:
   - Green shield icon
   - "Two-factor authentication is enabled" alert
   - "Backup Codes Remaining: 10 of 10 codes available"
   - Two buttons: "Regenerate Backup Codes" and "Disable 2FA"

---

## Test Scenario 2: Login with 2FA Enabled

### Step 1: Logout
1. Click your profile or logout button in the admin dashboard
2. Confirm you've been logged out and returned to login screen

### Step 2: Enter Credentials
1. Enter email: `admin@xtx396.online`
2. Enter password: `SecureAdmin2024!`
3. Click **"Sign In"**

### Step 3: Enter 2FA Code
1. After password verification, you'll see:
   - Info toast: "Please enter your authentication code"
   - Email and password fields become disabled
   - New field appears: "Authentication Code"
2. Open your authenticator app
3. Find the "xTx396 Hub" entry
4. Enter the current 6-digit code
5. Click **"Sign In"** again

### Step 4: Successful Login
1. If the code is valid, you'll be logged in
2. You should reach the admin dashboard
3. Check the Audit Log (sidebar) for the login event

---

## Test Scenario 3: Test Backup Code Login

### Step 1: Logout Again
1. Logout from the admin dashboard

### Step 2: Login with Backup Code
1. Enter email and password
2. Click **"Sign In"**
3. When prompted for authentication code, enter one of your backup codes
4. Format: `XXXX-XXXX` (with or without the hyphen)
5. Click **"Sign In"**

### Step 3: Verify Backup Code Usage
1. You should successfully login
2. Go to **"Users & Security"**
3. Check "Backup Codes Remaining" - it should now show **"9 of 10"**
4. Check Audit Log for "backup_code_used" event

**Important:** Each backup code can only be used once!

---

## Test Scenario 4: Regenerate Backup Codes

### Step 1: Navigate to Security
1. Go to **"Users & Security"** in the admin dashboard

### Step 2: Start Regeneration
1. In the 2FA card, click **"Regenerate Backup Codes"**
2. A dialog will appear

### Step 3: Confirm with Password
1. Enter your password: `SecureAdmin2024!`
2. Click **"Regenerate Codes"**

### Step 4: Save New Codes
1. The dialog will show 10 new backup codes
2. Click **"Copy All Backup Codes"**
3. Save them securely (replacing your old codes)
4. **Important:** Old codes are now invalid!
5. Click **"Done"**

### Step 5: Verify
1. Check "Backup Codes Remaining" - should show **"10 of 10"** again
2. Old codes will no longer work

---

## Test Scenario 5: Failed Login Attempts

### Step 1: Test Invalid 2FA Code
1. Logout and attempt to login
2. Enter correct email and password
3. When prompted for 2FA code, enter: `000000` (invalid)
4. Click **"Sign In"**
5. You should see error: "Invalid authentication code"
6. Try again with correct code to login

### Step 2: Test Rate Limiting
1. Logout
2. Attempt to login with wrong password 5 times
3. On the 6th attempt, you should see:
   - Error: "Account temporarily locked. Try again in X minutes."
4. Wait 15 minutes or use browser dev tools to check `founder-hub-login-attempts` in KV storage

---

## Test Scenario 6: Disable Two-Factor Authentication

### Step 1: Navigate to Security
1. Login to admin dashboard (with 2FA)
2. Go to **"Users & Security"**

### Step 2: Start Disable Process
1. In the 2FA card, click **"Disable 2FA"** button (red)
2. A warning dialog will appear

### Step 3: Read Warning
1. Alert shows: "⚠️ Disabling 2FA will reduce your account security. Your backup codes will be deleted."

### Step 4: Confirm with Password
1. Enter your password: `SecureAdmin2024!`
2. Click **"Disable 2FA"**

### Step 5: Verify Disabled
1. Success toast: "Two-factor authentication disabled"
2. The 2FA card now shows:
   - "Enable two-factor authentication for enhanced security"
   - Green button: "Enable Two-Factor Authentication"
3. Security Features card shows 2FA with gray icon: "Not configured"

### Step 6: Test Login Without 2FA
1. Logout
2. Login with email and password only
3. No 2FA code should be required
4. Login should succeed immediately after password

---

## Test Scenario 7: Verify Audit Logging

### Step 1: Check Audit Log
1. Login to admin dashboard
2. Click **"Audit Log"** in sidebar

### Step 2: Verify Events
Look for these audit events (most recent first):
- ✅ `login` - User logged in successfully
- ✅ `2fa_enabled` - Two-factor authentication enabled
- ✅ `login_2fa_required` - Password verified, awaiting 2FA
- ✅ `login_2fa_failed` - Invalid 2FA code (if you tested failures)
- ✅ `backup_code_used` - Backup code used (if you tested backup codes)
- ✅ `backup_codes_regenerated` - Backup codes regenerated
- ✅ `2fa_disabled` - Two-factor authentication disabled

Each event should show:
- Timestamp
- User email
- Action type
- Details
- Entity type/ID

---

## Security Features Verified

After completing all tests, you've verified:

### ✅ TOTP Implementation
- ✅ Base32 encoding/decoding
- ✅ HMAC-SHA1 signing
- ✅ Time-based counter (30-second windows)
- ✅ 6-digit code generation
- ✅ Time drift tolerance (±1 window)

### ✅ QR Code Generation
- ✅ QR code with proper otpauth:// URI
- ✅ Manual entry key display
- ✅ Compatible with standard authenticator apps

### ✅ Backup Codes
- ✅ 10 unique codes generated
- ✅ Single-use enforcement
- ✅ Copy to clipboard functionality
- ✅ Regeneration with password confirmation
- ✅ Count tracking

### ✅ Login Flow
- ✅ Two-stage authentication (password → 2FA)
- ✅ 2FA code validation
- ✅ Backup code validation
- ✅ Failed attempt handling
- ✅ Clear user feedback

### ✅ Security Controls
- ✅ Rate limiting (5 attempts per 15 minutes)
- ✅ Password hashing (SHA-256)
- ✅ Session management (8-hour expiry)
- ✅ Audit logging for all actions
- ✅ Password confirmation for sensitive operations

### ✅ User Experience
- ✅ Clear setup instructions
- ✅ Visual feedback (toasts, alerts)
- ✅ Responsive dialogs
- ✅ Error messages with guidance
- ✅ Backup code warnings

---

## Common Issues and Solutions

### Issue: QR Code Won't Scan
**Solution:** Use manual entry with the secret key. Copy the key and enter it manually in your authenticator app.

### Issue: Code Always Invalid
**Solution:** Check your device's time settings. TOTP requires accurate time synchronization. Enable automatic time sync.

### Issue: Lost Authenticator Access
**Solution:** Use one of your backup codes to login, then disable and re-enable 2FA with a new device.

### Issue: No Backup Codes
**Solution:** If you've lost your backup codes and can still login, regenerate them immediately.

### Issue: Account Locked
**Solution:** Wait 15 minutes for the lockout to expire, or contact system administrator.

---

## Expected Behavior Summary

| Action | Expected Result |
|--------|----------------|
| Enable 2FA | QR code shown, 10 backup codes generated |
| Scan QR | Authenticator adds account successfully |
| Enter valid code | 2FA enabled, success message |
| Login without 2FA code | Prompted for 2FA code |
| Enter valid TOTP code | Login succeeds |
| Enter backup code | Login succeeds, code consumed |
| Use same backup code twice | Second attempt fails |
| Enter invalid code 5 times | Account locked for 15 minutes |
| Regenerate codes | New set of 10 codes, old codes invalid |
| Disable 2FA | 2FA removed, backup codes deleted |
| Change password | Password updated, 2FA remains active |

---

## Security Recommendations

After testing, ensure:
1. ✅ Change default admin password immediately
2. ✅ Enable 2FA for maximum security
3. ✅ Store backup codes in a secure, encrypted location
4. ✅ Review audit logs regularly
5. ✅ Never share TOTP codes or backup codes
6. ✅ Use a unique, strong password (12+ characters)
7. ✅ Regenerate backup codes if running low

---

## Test Checklist

Use this checklist to track your testing:

- [ ] Successfully enabled 2FA with QR code scan
- [ ] Successfully enabled 2FA with manual key entry
- [ ] Backup codes copied and saved securely
- [ ] Verification code accepted during setup
- [ ] 2FA status shows "Enabled with TOTP"
- [ ] Logged out and logged back in with 2FA
- [ ] TOTP code from authenticator app works
- [ ] Backup code works for login
- [ ] Backup code count decreases after use
- [ ] Invalid code shows error message
- [ ] Rate limiting activates after 5 failed attempts
- [ ] Regenerated backup codes successfully
- [ ] Old backup codes invalid after regeneration
- [ ] Disabled 2FA successfully
- [ ] Login works without 2FA after disabling
- [ ] All audit events logged correctly
- [ ] Password change preserves 2FA setting
- [ ] Mobile responsive layout works
- [ ] Copy to clipboard functions work
- [ ] All error messages are clear and helpful

---

## Technical Details

### TOTP Algorithm
- **Algorithm:** HMAC-SHA1
- **Digits:** 6
- **Period:** 30 seconds
- **Window:** ±1 (90-second total window)

### Secret Generation
- **Length:** 20 bytes (160 bits)
- **Encoding:** Base32
- **Randomness:** `crypto.getRandomValues()`

### Backup Codes
- **Count:** 10 per generation
- **Format:** `XXXX-XXXX`
- **Characters:** Alphanumeric uppercase
- **Single-use:** Yes

### Storage
- **Users:** `founder-hub-users` KV key
- **Sessions:** `founder-hub-session` KV key
- **Login attempts:** `founder-hub-login-attempts` KV key
- **Audit log:** `founder-hub-audit-log` KV key
- **Pending 2FA:** `founder-hub-pending-2fa` KV key

### Audit Events
- `2fa_enabled`
- `2fa_disabled`
- `login_2fa_required`
- `login_2fa_failed`
- `backup_code_used`
- `backup_codes_regenerated`

---

## Test Complete ✅

Once you've completed all test scenarios and the checklist, your two-factor authentication system is verified and production-ready!

**Next Steps:**
1. Keep backup codes in a secure location
2. Test recovery scenarios periodically
3. Monitor audit logs for suspicious activity
4. Consider enabling 2FA for additional admin users (when multi-user support is added)
