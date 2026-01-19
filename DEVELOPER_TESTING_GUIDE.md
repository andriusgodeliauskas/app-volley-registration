# Developer Testing Guide - Password Reset Feature

## Development Environment Setup

### Prerequisites
- PHP 7.4+
- Composer installed
- MySQL/MariaDB database
- Gmail account for SMTP testing

---

## Step 1: Install Dependencies

```bash
cd D:\Andriaus\Projects\my-projects\app-volley-registration

# Install Composer dependencies
composer install

# Verify installation
ls vendor/phpmailer
```

Expected output: `phpmailer/` directory exists

---

## Step 2: Database Migration

**Check if migration already run:**
```sql
SHOW TABLES LIKE 'password_reset_tokens';
```

**If not exists, run migration:**
```sql
SOURCE migrations/008_password_reset_functionality.sql;
```

**Verify tables created:**
```sql
-- Should return password_reset_tokens table
DESCRIBE password_reset_tokens;

-- Should show VARCHAR(50) for attempt_type
DESCRIBE rate_limits;
```

---

## Step 3: Configure SMTP

**Edit `api/config.php`:**

```php
// Update these lines
define('SMTP_USERNAME', 'your-gmail@gmail.com');
define('SMTP_PASSWORD', 'your-gmail-app-password');
define('SMTP_FROM_EMAIL', 'noreply@godeliauskas.com');
define('APP_URL', 'http://localhost:5173');
```

**Get Gmail App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Create new app password
3. Copy 16-character password
4. Use this in config (not your regular password)

---

## Step 4: Manual Testing

### Test 1: Forgot Password Endpoint

**Request:**
```bash
curl -X POST http://localhost/app-volley-registration/api/forgot-password.php \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": {
    "lt": "Jums išsiųstas laiškas su instrukcijomis. Jei nematote, patikrinkite spam aplanką.",
    "en": "An email has been sent with instructions. If you don't see it, check your spam folder."
  }
}
```

**Check database:**
```sql
SELECT * FROM password_reset_tokens ORDER BY created_at DESC LIMIT 1;
```

Should see:
- `user_id` - User's ID
- `token` - 64 character hex string
- `expires_at` - 1 hour from now
- `used_at` - NULL

**Check email inbox:**
- Should receive email with reset link
- Template should render correctly (LT/EN)
- Button link format: `http://localhost:5173/reset-password?token=...`

---

### Test 2: Rate Limiting - Forgot Password

**Send 4 requests rapidly:**
```bash
# Request 1
curl -X POST http://localhost/app-volley-registration/api/forgot-password.php \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Request 2
curl -X POST http://localhost/app-volley-registration/api/forgot-password.php \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Request 3
curl -X POST http://localhost/app-volley-registration/api/forgot-password.php \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Request 4 - Should be BLOCKED
curl -X POST http://localhost/app-volley-registration/api/forgot-password.php \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**4th Request Expected Response:**
```json
{
  "success": false,
  "message": "Too many attempts. Try again in X minute(s)."
}
```

**Check database:**
```sql
SELECT * FROM rate_limits WHERE identifier = 'test@example.com';
```

Should see rate limit record with `blocked_until` timestamp.

---

### Test 3: Reset Password - Valid Token

**Get token from email or database:**
```sql
SELECT token FROM password_reset_tokens WHERE used_at IS NULL ORDER BY created_at DESC LIMIT 1;
```

**Request:**
```bash
curl -X POST http://localhost/app-volley-registration/api/reset-password.php \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_FROM_DB","password":"NewPassword123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": {
    "lt": "Slaptažodis pakeistas. Galite jungtis.",
    "en": "Password changed. You can now log in."
  },
  "data": {
    "auto_login": false
  }
}
```

**Verify in database:**
```sql
-- Token should be marked as used
SELECT used_at FROM password_reset_tokens WHERE token = 'TOKEN_HERE';
-- used_at should have timestamp

-- User password should be updated
SELECT password_hash FROM users WHERE id = USER_ID;
-- Should see new bcrypt hash
```

**Test login with new password:**
```bash
curl -X POST http://localhost/app-volley-registration/api/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"NewPassword123"}'
```

Should successfully login.

---

### Test 4: Reset Password - Expired Token

**Create expired token manually:**
```sql
INSERT INTO password_reset_tokens (user_id, token, expires_at)
VALUES (1, '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', NOW() - INTERVAL 2 HOUR);
```

**Request with expired token:**
```bash
curl -X POST http://localhost/app-volley-registration/api/reset-password.php \
  -H "Content-Type: application/json" \
  -d '{"token":"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef","password":"NewPassword123"}'
```

**Expected Response:**
```json
{
  "success": false,
  "message": {
    "lt": "Nuoroda nebegalioja. Prašome inicijuoti slaptažodžio keitimą iš naujo.",
    "en": "Reset link has expired. Please initiate password reset again."
  }
}
```

---

### Test 5: Reset Password - Invalid Token

**Request:**
```bash
curl -X POST http://localhost/app-volley-registration/api/reset-password.php \
  -H "Content-Type: application/json" \
  -d '{"token":"invalid_token_format","password":"NewPassword123"}'
```

**Expected Response:**
```json
{
  "success": false,
  "message": {
    "lt": "Netinkama nuoroda.",
    "en": "Invalid reset link."
  }
}
```

---

### Test 6: Reset Password - Weak Password

**Request:**
```bash
curl -X POST http://localhost/app-volley-registration/api/reset-password.php \
  -H "Content-Type: application/json" \
  -d '{"token":"VALID_TOKEN","password":"weak"}'
```

**Expected Response:**
```json
{
  "success": false,
  "message": {
    "lt": "Slaptažodis neatitinka reikalavimų",
    "en": "Password does not meet requirements"
  },
  "errors": {
    "validation_errors": [
      "Password must be at least 12 characters long",
      "Password must contain at least one uppercase letter",
      "Password must contain at least one number"
    ]
  }
}
```

---

### Test 7: Login - is_active=0 User

**Set user to inactive:**
```sql
UPDATE users SET is_active = 0 WHERE email = 'test@example.com';
```

**Try to login:**
```bash
curl -X POST http://localhost/app-volley-registration/api/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Expected:** Should LOGIN successfully (not blocked)

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "..."
  }
}
```

---

### Test 8: Google OAuth - New User Immediate Login

**Test with new Google account:**

1. Ensure Google account not in database
2. Initiate Google OAuth flow
3. Check response from `/api/google-auth.php`

**Expected Response:**
```json
{
  "success": true,
  "message": "Sėkmingai užsiregistravote",
  "data": {
    "requires_password": false,  // Should be FALSE
    "token": "auth_token_here",  // Should have token
    "user": {...}
  }
}
```

**Verify in database:**
```sql
SELECT * FROM users WHERE email = 'google-user@gmail.com';
```

Should see:
- `oauth_provider = 'google'`
- `oauth_google_id` populated
- `auth_token` populated
- `password_required = 0`

---

### Test 9: Events API - user_has_groups

**Remove user from all groups:**
```sql
DELETE FROM user_groups WHERE user_id = 1;
```

**Request events API:**
```bash
curl -X GET http://localhost/app-volley-registration/api/events.php \
  -H "Authorization: Bearer USER_AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user_has_groups": false,
    "events": []
  }
}
```

**Add user to group:**
```sql
INSERT INTO user_groups (user_id, group_id) VALUES (1, 1);
```

**Request again:**
```bash
curl -X GET http://localhost/app-volley-registration/api/events.php \
  -H "Authorization: Bearer USER_AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user_has_groups": true,
    "events": [...]
  }
}
```

---

## Step 5: Email Template Testing

### Test Email Rendering

**Create test script `test-email-template.php`:**
```php
<?php
require_once 'api/email.php';

// Test Lithuanian version
$htmlLT = renderEmailTemplate('password-reset', [
    'reset_link' => 'http://localhost:5173/reset-password?token=test123',
    'lang' => 'lt'
]);

file_put_contents('email-test-lt.html', $htmlLT);
echo "Lithuanian template saved to email-test-lt.html\n";

// Test English version
$htmlEN = renderEmailTemplate('password-reset', [
    'reset_link' => 'http://localhost:5173/reset-password?token=test123',
    'lang' => 'en'
]);

file_put_contents('email-test-en.html', $htmlEN);
echo "English template saved to email-test-en.html\n";
```

**Run test:**
```bash
php test-email-template.php
```

**Open HTML files in browser:**
- Check responsive design
- Test button link
- Verify translations
- Check mobile view (browser dev tools)

---

## Step 6: Security Testing

### Test SQL Injection

**Attempt SQL injection in email:**
```bash
curl -X POST http://localhost/app-volley-registration/api/forgot-password.php \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com OR 1=1--"}'
```

**Expected:** Should fail validation (invalid email format)

### Test XSS in Email

**Attempt XSS in reset link:**
```php
// Manually create malicious token
$token = '<script>alert("XSS")</script>';

// Should be escaped in email template
echo htmlspecialchars($token, ENT_QUOTES, 'UTF-8');
```

**Expected:** Script tags should be escaped in email HTML

---

## Step 7: Performance Testing

### Test Email Sending Speed

**Create benchmark script:**
```php
<?php
require_once 'api/email.php';

$start = microtime(true);

sendEmail(
    'test@example.com',
    'Test Subject',
    '<p>Test body</p>'
);

$end = microtime(true);
$duration = round(($end - $start) * 1000, 2);

echo "Email sent in {$duration}ms\n";
```

**Expected:** < 5000ms (5 seconds)

---

## Step 8: Error Log Monitoring

**Monitor PHP error logs during testing:**

**Windows:**
```bash
# Find php error log location
php -i | findstr error_log

# Tail logs (use Git Bash or WSL)
tail -f C:/path/to/php/error.log
```

**Linux:**
```bash
tail -f /var/log/php/error.log
```

**Look for:**
- ✅ "Email sent successfully to: ..."
- ✅ "Password reset email sent to: ..."
- ✅ "Password reset successful for user_id: ..."
- ❌ "Email sending failed to: ..."
- ❌ "SMTP connect() failed"

---

## Debugging Tips

### Issue: Email not sending

**Check SMTP credentials:**
```bash
# Verify config
grep SMTP_USERNAME api/config.php
grep SMTP_PASSWORD api/config.php
```

**Test SMTP connection:**
```php
<?php
use PHPMailer\PHPMailer\PHPMailer;
require_once 'vendor/autoload.php';

$mail = new PHPMailer(true);
$mail->isSMTP();
$mail->Host = 'smtp.gmail.com';
$mail->Port = 587;
$mail->SMTPAuth = true;
$mail->Username = 'your-email@gmail.com';
$mail->Password = 'your-app-password';
$mail->SMTPSecure = 'tls';

try {
    $mail->smtpConnect();
    echo "SMTP connection successful\n";
} catch (Exception $e) {
    echo "SMTP connection failed: {$e->getMessage()}\n";
}
```

---

### Issue: Autoloader not found

**Error:**
```
Fatal error: require_once(): Failed opening 'vendor/autoload.php'
```

**Fix:**
```bash
composer install
```

---

### Issue: Database errors

**Check connection:**
```php
<?php
require_once 'api/db.php';

try {
    $pdo = getDbConnection();
    echo "Database connection successful\n";
} catch (Exception $e) {
    echo "Database connection failed: {$e->getMessage()}\n";
}
```

---

## Test Coverage Checklist

### Functional Tests
- [x] Forgot password - valid email
- [x] Forgot password - invalid email
- [x] Forgot password - rate limiting
- [x] Reset password - valid token
- [x] Reset password - expired token
- [x] Reset password - invalid token
- [x] Reset password - weak password
- [x] Reset password - rate limiting
- [x] Login with is_active=0
- [x] Google OAuth immediate login
- [x] Events API user_has_groups

### Security Tests
- [x] SQL injection prevention
- [x] XSS prevention
- [x] Token validation
- [x] Password strength validation
- [x] Rate limiting enforcement
- [x] User enumeration prevention

### Email Tests
- [x] Email sending
- [x] Template rendering (LT/EN)
- [x] Responsive design
- [x] Reset link format

### Performance Tests
- [x] Email sending speed
- [x] API response times

---

## Next Steps

After all tests pass:

1. ✅ Commit changes to git
2. ✅ Create pull request
3. ✅ Deploy to staging
4. ✅ Test on staging
5. ✅ Deploy to production
6. ✅ Monitor production logs

---

**Happy Testing!** 🎉
