# Security Notes - Authentication System Changes

## Date: 2026-01-19
## Changes: Password Reset Functionality & Authentication Flow

---

## CRITICAL DECISION: `is_active` Field Behavior Change

### Previous Behavior:
- `is_active = 0` → User cannot log in (blocked at authentication)
- `is_active = 1` → User can log in and access all features

### New Behavior (2026-01-19):
- `is_active = 0` → User CAN log in but sees limited features
- `is_active = 1` → User can log in and access all features

---

## Rationale for Change

### Business Requirement:
New users (both email and Google OAuth registration) should be able to:
1. ✅ Log in immediately after registration
2. ✅ Access their profile
3. ✅ Manage their wallet/balance
4. ✅ View their children accounts
5. ❌ **Cannot see events** until administrator assigns them to a group

### Technical Implementation:
- `is_active` field NO LONGER blocks authentication
- Access control moved from authentication layer to feature layer
- Events visibility controlled by **group membership**, not `is_active` status
- If user is not assigned to any group → shows informational message in Events page

---

## Security Implications

### ⚠️ IMPORTANT: Account Deactivation

**Problem:** Removing `is_active` check means administrators cannot easily deactivate/suspend accounts.

**Current Workaround:**
1. Remove user from all groups → user cannot see events
2. Set balance to 0 → user cannot register for events
3. Document this as temporary solution

**Future Enhancement (Recommended):**
Add separate account status field:
```sql
ALTER TABLE users ADD COLUMN account_status ENUM('active', 'suspended', 'banned') DEFAULT 'active';
```

Then check `account_status` in authentication:
```php
if ($user['account_status'] !== 'active') {
    sendError('Account suspended. Contact administrator.', 403);
}
```

This separates:
- `is_active`: Used for internal flags (group assignment pending, etc.)
- `account_status`: Controls account access (suspended, banned)

---

## Access Control Matrix

| User Status | Can Login? | Can See Events? | Can Register for Events? | Can Use Wallet? |
|-------------|------------|-----------------|--------------------------|-----------------|
| `is_active=0`, no groups | ✅ Yes | ❌ No (shows message) | ❌ No | ✅ Yes |
| `is_active=0`, has groups | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| `is_active=1`, no groups | ✅ Yes | ❌ No (shows message) | ❌ No | ✅ Yes |
| `is_active=1`, has groups | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

**Key Insight:** Group membership is now the primary access control for events, not `is_active`.

---

## Password Reset Security

### Token Generation:
- **Algorithm:** `bin2hex(random_bytes(32))` - Cryptographically secure
- **Length:** 64 characters (256-bit entropy)
- **Expiry:** 1 hour from creation
- **Single-use:** Marked with `used_at` timestamp after use
- **Database:** `password_reset_tokens` table with unique constraint

### Rate Limiting:
- **Forgot Password:** 3 attempts per 60 minutes per email
- **Reset Password:** 5 attempts per 15 minutes per token
- Prevents brute force enumeration and abuse

### Information Disclosure Prevention:
- Forgot password endpoint **always returns success** (security best practice)
- Never reveals if email exists in database
- All token validation errors return generic message (prevents timing attacks)

### SMTP Security:
- Credentials stored in `secrets.php` (NOT version controlled)
- HTTPS-only reset links in production
- Email template uses `htmlspecialchars()` for XSS prevention

---

## Google OAuth Security

### State Parameter:
⚠️ **WARNING:** Current implementation logs state mismatch but continues anyway.

**Security Review Recommendation:** Enforce state validation to prevent CSRF:
```jsx
// In GoogleCallback.jsx
if (!state || !storedState || state !== storedState) {
    setError(t('error.csrf_validation_failed'));
    setLoading(false);
    return; // MUST stop execution
}
```

### New User Flow:
- Google OAuth new users are created with `is_active = 0`
- They receive **immediate auth_token** (no password setup required)
- Redirect directly to Dashboard (no SetPasswordModal)
- Same access control rules apply (group membership for events)

---

## Database Security

### Password Storage:
- **Algorithm:** bcrypt
- **Cost:** 12 (OWASP recommended)
- **Verification:** `password_verify()` used for login

### SQL Injection Prevention:
- ✅ All queries use prepared statements
- ✅ No string concatenation in SQL
- ✅ Input sanitization before database operations

### Foreign Keys:
- `password_reset_tokens.user_id` → `users.id` (CASCADE DELETE)
- GDPR compliant: tokens deleted when user deleted

---

## GDPR Compliance

### Data Retention:
- Password reset tokens: 1 hour expiry
- Recommendation: Auto-cleanup after 24 hours (cron job)

### Right to Erasure:
- ✅ Tokens cascade delete with user account
- ✅ No PII in logs
- ✅ Passwords never logged

### Data Minimization:
- ✅ Only necessary data collected
- ✅ Email addresses not in URLs (token used instead)

---

## Future Security Enhancements

### High Priority:
1. **Account Status Field:** Add `account_status` ENUM to properly handle suspended/banned accounts
2. **OAuth State Enforcement:** Fix state parameter validation in GoogleCallback.jsx
3. **Security Event Logging:** Log all failed authentication attempts, rate limit triggers

### Medium Priority:
4. **Email Verification:** Optional email verification for new accounts
5. **Two-Factor Authentication (2FA):** TOTP support (Google Authenticator)
6. **Password Strength Meter:** Visual feedback on password creation

### Low Priority:
7. **Session Fingerprinting:** Track user agent, IP for suspicious session detection
8. **Audit Trail:** Complete log of all password changes, login attempts

---

## Deployment Checklist

### Before Production Deployment:

#### Critical (MUST DO):
- [ ] Add SMTP credentials to production `secrets.php`
- [ ] Verify APP_URL is HTTPS in production
- [ ] Test forgot password email delivery
- [ ] Test reset password flow end-to-end
- [ ] Verify rate limiting works correctly
- [ ] Test Google OAuth new user flow (no password modal)

#### Important (SHOULD DO):
- [ ] Review and tighten CSP headers
- [ ] Add security event logging
- [ ] Document `is_active` field usage for team
- [ ] Create rollback plan if issues arise

#### Recommended (NICE TO HAVE):
- [ ] Set up monitoring for failed authentication attempts
- [ ] Configure email alerts for rate limit violations
- [ ] Schedule token cleanup cron job

---

## Rollback Plan

If critical issues arise after deployment:

### Step 1: Database Rollback
```sql
-- Rollback password_reset_tokens table
DROP TABLE IF EXISTS `password_reset_tokens`;

-- Rollback rate_limits column change
ALTER TABLE `rate_limits`
    MODIFY COLUMN `attempt_type` ENUM('login', 'registration', 'set_password') NOT NULL;
```

### Step 2: Code Rollback
```bash
git revert <commit-hash>
git push origin main
```

### Step 3: Re-enable is_active Check
Temporarily add back in `login.php` and `google-auth.php`:
```php
if (!$user['is_active']) {
    sendError('Account pending approval', 403);
}
```

---

## Contact & Support

**Security Concerns:** Report to security@godeliauskas.com
**Technical Issues:** Open issue in GitHub repository
**Documentation:** See `CLAUDE.md`, `PASSWORD_RESET_README.md`

---

## Change Log

| Date | Change | Author | Reason |
|------|--------|--------|--------|
| 2026-01-19 | Removed `is_active` authentication check | Dev Team | Allow new users immediate access |
| 2026-01-19 | Added password reset functionality | Dev Team | User request |
| 2026-01-19 | Changed Google OAuth flow (no password setup) | Dev Team | Better UX |

---

**Document Version:** 1.0
**Last Updated:** 2026-01-19
**Next Review:** 2026-02-19
