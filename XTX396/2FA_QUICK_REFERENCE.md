# 2FA Quick Reference Card

## Quick Access
**Location:** Admin Dashboard → Users & Security → Two-Factor Authentication card

---

## Setup (5 minutes)

1. **Click:** "Enable Two-Factor Authentication"
2. **Scan:** QR code with authenticator app
3. **Save:** 10 backup codes (copy & store securely)
4. **Verify:** Enter 6-digit code from app
5. **Done:** 2FA is now active

**Supported Apps:** Google Authenticator, Authy, Microsoft Authenticator, 1Password, Bitwarden

---

## Login with 2FA

1. Enter email + password
2. Click "Sign In"
3. Enter 6-digit code from authenticator app
4. Click "Sign In" again
5. ✅ Logged in

**Alternative:** Use backup code if you lose authenticator access

---

## Backup Codes

- **Count:** 10 codes
- **Format:** `XXXX-XXXX`
- **Usage:** Single-use only
- **When:** Lost authenticator, new device, emergency access
- **Storage:** Save in password manager or secure location
- **Regenerate:** Users & Security → "Regenerate Backup Codes"

⚠️ **Warning:** When you regenerate codes, all old codes become invalid!

---

## Common Actions

| Action | Steps |
|--------|-------|
| **Enable 2FA** | Users & Security → "Enable Two-Factor Authentication" |
| **Login with 2FA** | Password → 2FA Code → Sign In |
| **Use Backup Code** | Enter backup code instead of TOTP code |
| **Regenerate Codes** | Users & Security → "Regenerate Backup Codes" → Enter Password |
| **Disable 2FA** | Users & Security → "Disable 2FA" → Enter Password |
| **Check Remaining Codes** | Users & Security → "Backup Codes Remaining" |

---

## Security Features

✅ **TOTP Implementation**
- Time-based one-time passwords
- 30-second validity windows
- HMAC-SHA1 algorithm
- 6-digit codes

✅ **Rate Limiting**
- 5 failed attempts allowed
- 15-minute lockout after limit
- Applies to password and 2FA codes

✅ **Audit Logging**
- All 2FA events logged
- Login attempts tracked
- Backup code usage recorded

✅ **Session Management**
- 8-hour session duration
- Secure session storage
- Auto-expiration

---

## Troubleshooting

### "Invalid authentication code"
- ⏰ Check device time is synchronized
- 🔄 Wait for new code (30-second cycle)
- 📱 Verify correct account in authenticator app
- 🔑 Try a backup code instead

### "Account temporarily locked"
- ⏱️ Wait 15 minutes
- 🔒 5 failed attempts triggered lockout
- ✅ Time resets after lockout expires

### Lost authenticator access
- 🔑 Use backup code to login
- ⚙️ Go to Users & Security
- 🔄 Regenerate backup codes or disable/re-enable 2FA

### QR code won't scan
- 📋 Use "Manual Entry Key" instead
- ✏️ Copy secret and enter in authenticator app manually
- 📱 Try different authenticator app

---

## Best Practices

1. ✅ **Enable 2FA immediately** after first login
2. ✅ **Save backup codes** in encrypted password manager
3. ✅ **Never share** TOTP codes or backup codes
4. ✅ **Review audit logs** regularly for suspicious activity
5. ✅ **Regenerate codes** if running low (< 3 remaining)
6. ✅ **Use unique password** (12+ characters)
7. ✅ **Test backup code** at least once to verify it works
8. ✅ **Update backup codes** after regeneration in secure storage

---

## Emergency Recovery

### Lost Authenticator + No Backup Codes
⚠️ **Account recovery will require database access**

**Prevention:** Always save backup codes when enabling 2FA!

### Lost Backup Codes (but have authenticator)
✅ Login normally with authenticator → Regenerate codes → Save new codes

### Used Most Backup Codes
⚠️ **Warning appears at < 3 codes remaining**
✅ Login → Go to Users & Security → Regenerate Backup Codes

---

## Technical Specs

- **Algorithm:** TOTP (RFC 6238)
- **Hash:** HMAC-SHA1
- **Digits:** 6
- **Period:** 30 seconds
- **Window:** ±1 (90-second tolerance)
- **Secret Length:** 160 bits (20 bytes)
- **Encoding:** Base32
- **Backup Codes:** 10 per generation

---

## Audit Events

Check **Audit Log** in admin sidebar for:

- `2fa_enabled` - 2FA turned on
- `2fa_disabled` - 2FA turned off
- `login_2fa_required` - Password verified, awaiting 2FA
- `login_2fa_failed` - Invalid 2FA code attempt
- `backup_code_used` - Backup code consumed
- `backup_codes_regenerated` - New codes generated

---

## Status Indicators

### Security Features Card

✅ **Green Lock** = 2FA Enabled with TOTP
⚪ **Gray Lock** = Not configured

### Two-Factor Authentication Card

When **Enabled:**
- Shows green shield icon
- "Two-factor authentication is enabled"
- Displays backup codes remaining (X of 10)
- Buttons: "Regenerate Backup Codes" | "Disable 2FA"

When **Disabled:**
- Shows QR code icon
- Instructions and benefits
- Button: "Enable Two-Factor Authentication"

---

## Support

### Default Credentials
- **Email:** admin@xtx396.online
- **Password:** SecureAdmin2024!
- **Change immediately after first login!**

### Storage Keys (for debugging)
- `founder-hub-users` - User accounts
- `founder-hub-session` - Active session
- `founder-hub-login-attempts` - Rate limiting
- `founder-hub-pending-2fa` - Temp 2FA state
- `founder-hub-audit-log` - All events

---

## Quick Checklist ✅

Before going live:
- [ ] 2FA enabled
- [ ] Backup codes saved securely
- [ ] Default password changed
- [ ] Test login with 2FA
- [ ] Test backup code works
- [ ] Backup codes stored in password manager
- [ ] Audit log reviewed
- [ ] Know how to regenerate codes
- [ ] Understand lockout policy
- [ ] Emergency contact established

---

**Need Help?** Check the full test guide: `2FA_TEST_GUIDE.md`
