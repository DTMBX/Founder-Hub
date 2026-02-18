# Security Policy

## xTx396 Founder Hub - Security Documentation

This document outlines the security features, best practices, and security considerations for the xTx396 Founder Hub application.

## Security Features

### Authentication & Authorization

#### Password Security
- **Hashing Algorithm**: SHA-256 cryptographic hash function
- **Minimum Length**: 12 characters required
- **Complexity Requirements**: Recommended mix of uppercase, lowercase, numbers, and special characters
- **Default Credentials**: 
  - Email: `admin@xtx396.online`
  - Password: `SecureAdmin2024!`
  - **⚠️ CRITICAL**: Change the default password immediately after first login

#### Rate Limiting
- **Failed Login Attempts**: Maximum 5 attempts per email address
- **Lockout Duration**: 15 minutes after exceeding attempt limit
- **Lockout Reset**: Automatic after timeout period expires
- **Tracking**: Per-email address attempt counters with timestamps

#### Session Management
- **Session Duration**: 8 hours from login
- **Automatic Expiration**: Sessions expire and require re-authentication
- **Session Storage**: Secure browser key-value storage
- **Session Validation**: Checked on every protected route access

### Role-Based Access Control (RBAC)

Three user roles are supported:
- **Owner**: Full access to all features and settings
- **Editor**: Content and theme management access
- **Viewer**: Read-only access (future implementation)

### Audit Logging

All security-relevant events are logged:
- Successful logins
- Failed login attempts
- Password changes
- Password change failures
- Logout events
- All content modifications

Audit logs include:
- User ID and email
- Action type
- Timestamp
- Entity affected
- Additional metadata

### Data Protection

- **Password Storage**: Never stored in plain text; only hashed values
- **Session Data**: Stored in secure KV storage
- **Visibility Controls**: Three-tier system for documents (Public/Unlisted/Private)
- **Secure Share Links**: Generated tokens for unlisted content

## Security Best Practices

### For Administrators

1. **Change Default Password**
   - Change immediately after first login
   - Use a strong, unique password
   - Do not reuse passwords from other sites

2. **Regular Password Updates**
   - Change password every 90 days
   - Update if breach suspected

3. **Session Management**
   - Log out when finished
   - Never share credentials
   - Clear sessions on shared computers

4. **Audit Log Monitoring**
   - Review audit logs regularly
   - Investigate suspicious activity
   - Watch for failed login attempts

5. **Content Visibility**
   - Carefully set document visibility levels
   - Review visibility before publishing
   - Use Private for sensitive materials

### For Developers

1. **Environment Security**
   - Never commit passwords or secrets to version control
   - Use environment variables for configuration
   - Keep dependencies updated

2. **Code Security**
   - Validate all user inputs
   - Sanitize data before display
   - Follow secure coding practices

3. **Session Security**
   - Implement proper session timeout
   - Validate session on every request
   - Clear expired sessions

## Known Limitations

### Current Implementation

1. **Password Hashing**: Uses SHA-256 which is better than plaintext but not ideal for passwords
   - **Recommendation for Production**: Implement bcrypt, scrypt, or Argon2
   - **Why**: These algorithms are specifically designed for password hashing with salt and work factor

2. **Session Storage**: Sessions stored in KV without additional encryption
   - **Recommendation for Production**: Implement session encryption or use secure session tokens

3. **Two-Factor Authentication**: UI placeholder exists but not fully implemented
   - **Future Enhancement**: Implement TOTP-based 2FA

4. **Password Reset**: No password reset flow via email
   - **Current Workaround**: Admin must manually update user passwords via KV
   - **Future Enhancement**: Implement secure password reset flow

5. **HTTPS**: No enforced HTTPS in application code
   - **Recommendation**: Deploy behind HTTPS reverse proxy (Cloudflare, nginx, etc.)

### Security Considerations

1. **Browser-Based Storage**: All data stored client-side in browser storage
   - Suitable for personal sites and demos
   - Consider server-side database for sensitive production data

2. **Client-Side Hashing**: Password hashing happens in browser
   - Prevents plaintext passwords in network traffic
   - Still recommend HTTPS for all traffic

3. **No Rate Limiting Infrastructure**: Rate limiting implemented in application code
   - Can be bypassed by clearing browser storage
   - Consider infrastructure-level rate limiting (Cloudflare, WAF) for production

## Reporting Security Issues

If you discover a security vulnerability in this application:

1. **Do not** open a public GitHub issue
2. Email security concerns to: devon@xtx396.online
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

## Security Checklist for Deployment

- [ ] Change default admin password
- [ ] Enable HTTPS on hosting platform
- [ ] Configure CSP headers
- [ ] Enable audit logging
- [ ] Review document visibility settings
- [ ] Set up regular backups
- [ ] Configure domain security (HSTS, etc.)
- [ ] Test authentication and authorization
- [ ] Review audit logs after deployment
- [ ] Set up monitoring for failed login attempts

## Compliance & Privacy

- **Data Storage**: All data stored locally in browser storage
- **Analytics**: Privacy-friendly, minimal analytics (can be disabled)
- **Third-Party Services**: No third-party tracking by default
- **Document Visibility**: Admin-controlled three-tier visibility system
- **Audit Trail**: Complete logging of security events

## Updates & Maintenance

This security documentation should be reviewed and updated:
- After any authentication/authorization changes
- When new security features are added
- After security audits or penetration tests
- At minimum, quarterly

**Last Updated**: 2024
**Version**: 1.0.0
