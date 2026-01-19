# Deployment Checklist - Password Reset Feature

## Pre-Deployment

### 1. Verify Local Changes
- [ ] All files committed to git
- [ ] Code reviewed
- [ ] No console.log or debug code left
- [ ] Documentation complete

### 2. Database Migration Status
- [ ] Check if `migrations/008_password_reset_functionality.sql` already run
  ```sql
  -- On production database
  SHOW TABLES LIKE 'password_reset_tokens';
  -- Should return 1 row if already migrated
  ```

- [ ] Check rate_limits.attempt_type column type
  ```sql
  DESCRIBE rate_limits;
  -- attempt_type should be VARCHAR(50)
  ```

---

## Production Deployment

### Step 1: Install Composer Dependencies

**On your local machine (before deployment):**
```bash
cd D:\Andriaus\Projects\my-projects\app-volley-registration
composer install --no-dev --optimize-autoloader
```

**Include vendor/ in deployment:**
- Add `vendor/` directory to deployment package
- OR install Composer on production server and run `composer install`

### Step 2: Update Configuration Files

**Edit `api/secrets.php` on production server:**

```php
// Add these lines if not present
define('SMTP_USERNAME', 'your-production-email@gmail.com');
define('SMTP_PASSWORD', 'your-gmail-app-password');
```

**Gmail Setup:**
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Generate App Password: https://myaccount.google.com/apppasswords
4. Use this App Password (not your regular password)

### Step 3: Deploy Files

**Using PowerShell script:**
```powershell
.\prepare-deploy.ps1
```

**Manually upload these files to production:**
```
composer.json
vendor/
api/email.php
api/email-templates/password-reset.php
api/forgot-password.php
api/reset-password.php
api/config.php (updated)
api/login.php (updated)
api/auth.php (updated)
api/google-auth.php (updated)
api/events.php (updated)
```

### Step 4: Set Permissions

**On production server:**
```bash
# Set proper permissions
chmod 644 api/*.php
chmod 644 api/email-templates/*.php
chmod 755 api/email-templates/

# Ensure vendor/ is readable
chmod -R 755 vendor/
```

### Step 5: Test Email Sending

**Test SMTP connection:**

Create temporary test file `api/test-email.php`:
```php
<?php
require_once __DIR__ . '/email.php';

$testEmail = 'your-test-email@example.com';
$result = sendEmail(
    $testEmail,
    'Test Email from Volley Registration',
    '<h1>Test</h1><p>If you see this, email works!</p>',
    'Test - If you see this, email works!'
);

echo $result ? 'Email sent successfully' : 'Email failed';
```

**Run test:**
```bash
php api/test-email.php
```

**Delete test file after:**
```bash
rm api/test-email.php
```

### Step 6: Test API Endpoints

**Test 1: Forgot Password**
```bash
curl -X POST https://volley.godeliauskas.com/api/forgot-password.php \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@example.com"}'
```

Expected response:
```json
{
  "success": true,
  "message": {
    "lt": "Jums išsiųstas laiškas su instrukcijomis..."
  }
}
```

**Check email inbox** - should receive password reset email

**Test 2: Reset Password**

Get token from email → Test reset endpoint:
```bash
curl -X POST https://volley.godeliauskas.com/api/reset-password.php \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_FROM_EMAIL","password":"NewPassword123"}'
```

Expected response:
```json
{
  "success": true,
  "message": {
    "lt": "Slaptažodis pakeistas. Galite jungtis."
  }
}
```

**Test 3: Login with is_active=0**

1. Set a test user to `is_active = 0` in database
2. Try to login with their credentials
3. Should succeed (not blocked)

**Test 4: Events API - user_has_groups**

1. Remove user from all groups
2. Call `/api/events.php`
3. Should return: `{"user_has_groups": false, "events": []}`

**Test 5: Google OAuth - Immediate Login**

1. Use a NEW Google account (never registered)
2. Sign in with Google
3. Should login immediately (no password setup modal)
4. Check response: `requires_password: false` and `token` present

### Step 7: Monitor Logs

**Check PHP error logs:**
```bash
tail -f /path/to/php/error_log
```

**Look for:**
- Email sent successfully messages
- No SMTP errors
- No fatal errors

### Step 8: Verify Database

**Check password_reset_tokens table:**
```sql
SELECT * FROM password_reset_tokens ORDER BY created_at DESC LIMIT 5;
```

Should see recent tokens created.

**Check rate_limits table:**
```sql
SELECT * FROM rate_limits WHERE attempt_type IN ('forgot_password', 'reset_password');
```

Should see rate limit records.

---

## Staging Deployment

### Step 1: Update config-staging.php

**Edit `api/config-staging.php` on staging server:**

```php
// Add these if not present
define('SMTP_USERNAME', 'staging-email@gmail.com');
define('SMTP_PASSWORD', 'staging-gmail-app-password');
```

### Step 2: Deploy to Staging

```powershell
.\prepare-deploy-staging.ps1
```

### Step 3: Test on Staging

Run all tests from Step 6 above, but use staging URL:
```
https://staging.godeliauskas.com/api/...
```

---

## Post-Deployment Verification

### Production

- [ ] Forgot password endpoint works
- [ ] Reset password endpoint works
- [ ] Email sending works
- [ ] Rate limiting works
- [ ] is_active=0 users can login
- [ ] Google OAuth new users login immediately
- [ ] Events API returns user_has_groups flag
- [ ] No errors in logs
- [ ] Database tables populated correctly

### Staging

- [ ] All production tests pass on staging
- [ ] Separate SMTP credentials used

---

## Rollback Plan (If Issues)

### Quick Rollback

**1. Restore previous code:**
```bash
git checkout HEAD~1
.\prepare-deploy.ps1
```

**2. If database was migrated:**
- Password reset feature will stop working
- But existing functionality NOT affected (migration is additive)

**3. If emails failing:**
- Check SMTP credentials
- Verify port 587 open
- Check error logs

### Database Rollback (NOT RECOMMENDED)

Only if absolutely necessary:
```sql
DROP TABLE password_reset_tokens;

ALTER TABLE rate_limits
MODIFY COLUMN attempt_type ENUM('login', 'registration', 'google_auth') NOT NULL;
```

---

## Troubleshooting

### Issue: Email not sending

**Check:**
1. SMTP credentials correct?
   ```bash
   grep SMTP_USERNAME api/secrets.php
   ```

2. Port 587 open?
   ```bash
   telnet smtp.gmail.com 587
   ```

3. Gmail App Password used (not regular password)?

4. Error logs?
   ```bash
   tail -50 /path/to/php/error_log | grep -i email
   ```

**Fix:**
- Update SMTP credentials
- Open firewall for port 587
- Generate new Gmail App Password

---

### Issue: Composer autoloader not found

**Error:**
```
Fatal error: require_once(): Failed opening 'vendor/autoload.php'
```

**Fix:**
```bash
cd /path/to/project
composer install --no-dev --optimize-autoloader
```

---

### Issue: Rate limiting too strict

**Symptoms:**
- Users blocked after few attempts

**Fix:**
Edit endpoint files:
```php
// In forgot-password.php
checkRateLimit($email, 'forgot_password', 5, 60); // Increase to 5 attempts

// In reset-password.php
checkRateLimit($token, 'reset_password', 10, 15); // Increase to 10 attempts
```

---

### Issue: Token expired message appearing immediately

**Cause:** Server timezone misconfiguration

**Check:**
```php
<?php
echo date('Y-m-d H:i:s');
echo '<br>';
echo date_default_timezone_get();
```

**Fix:**
Add to `api/config.php`:
```php
date_default_timezone_set('Europe/Vilnius');
```

---

## Monitoring

### Daily Checks (First Week)

**1. Email sending rate:**
```sql
SELECT COUNT(*) as emails_sent, DATE(created_at) as date
FROM password_reset_tokens
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**2. Password reset success rate:**
```sql
SELECT
    COUNT(*) as total_tokens,
    SUM(CASE WHEN used_at IS NOT NULL THEN 1 ELSE 0 END) as used_tokens,
    ROUND(SUM(CASE WHEN used_at IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as success_rate
FROM password_reset_tokens
WHERE created_at > NOW() - INTERVAL 7 DAY;
```

**3. Rate limit violations:**
```sql
SELECT COUNT(*) as blocked_attempts, attempt_type
FROM rate_limits
WHERE blocked_until > NOW()
GROUP BY attempt_type;
```

**4. Error logs:**
```bash
grep -i "email.*fail\|smtp.*error" /path/to/php/error_log | tail -20
```

---

## Success Criteria

### All Tests Pass
- ✅ Email sending works
- ✅ Password reset flow complete
- ✅ Rate limiting enforces limits
- ✅ Security validations work
- ✅ No errors in logs
- ✅ Database tables populated

### No User Complaints
- ✅ Users receive reset emails
- ✅ Reset links work
- ✅ Password change successful
- ✅ is_active=0 users can login
- ✅ Google OAuth works smoothly

### Performance OK
- ✅ Email sends < 5 seconds
- ✅ API response times normal
- ✅ No database bottlenecks

---

## Contact Information

**If issues arise:**

1. Check this checklist first
2. Review logs
3. Check `PASSWORD_RESET_README.md`
4. Contact system administrator

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Status:** [ ] Success [ ] Issues [ ] Rolled Back
**Notes:** _________________________________

---

## Sign-off

**Developer:** _________________ Date: _______
**Tester:** _________________ Date: _______
**Product Owner:** _________________ Date: _______
