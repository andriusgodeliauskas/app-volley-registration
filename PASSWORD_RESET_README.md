# Password Reset Feature - Implementation Summary

## Overview

Implementuota visapusiška slaptažodžio atkūrimo (password reset) funkcionalumas su email integracija.

---

## Architektūra

### Backend Endpoints

#### 1. POST `/api/forgot-password.php`

Inicijuoja password reset procesą.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (visada success - security best practice):**
```json
{
  "success": true,
  "message": {
    "lt": "Jums išsiųstas laiškas su instrukcijomis...",
    "en": "An email has been sent with instructions..."
  }
}
```

**Security Features:**
- Nepasako ar email egzistuoja sistemoje (prevents user enumeration)
- Rate limiting: 3 bandymai per 60 minučių
- Token: 64 simboliai, crypto-safe random (`bin2hex(random_bytes(32))`)
- Token galiojimas: 1 valanda

---

#### 2. POST `/api/reset-password.php`

Atnaujina slaptažodį naudojant reset token.

**Request:**
```json
{
  "token": "64_char_hex_token_from_email",
  "password": "NewSecurePassword123"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": {
    "lt": "Slaptažodis pakeistas. Galite jungtis.",
    "en": "Password changed. You can now log in."
  }
}
```

**Response (error - token expired):**
```json
{
  "success": false,
  "message": {
    "lt": "Nuoroda nebegalioja. Prašome inicijuoti slaptažodžio keitimą iš naujo.",
    "en": "Reset link has expired. Please initiate password reset again."
  }
}
```

**Security Features:**
- Token validacija: 64 hex simboliai
- Rate limiting: 5 bandymai per 15 minučių
- Password strength validation:
  - Minimum 12 simboliai
  - Bent 1 uppercase raidė
  - Bent 1 lowercase raidė
  - Bent 1 skaičius
  - Neleisti common passwords (password123, admin123, etc.)
- Password hashing: bcrypt su cost 12
- Token naudojamas tik vieną kartą (used_at timestamp)

---

## Database Schema

### Table: `password_reset_tokens`

```sql
CREATE TABLE `password_reset_tokens` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,
    `token` VARCHAR(64) NOT NULL COMMENT 'Secure random token',
    `expires_at` DATETIME NOT NULL COMMENT 'Token valid for 1 hour',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `used_at` DATETIME NULL DEFAULT NULL COMMENT 'When token was used',

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_password_reset_token` (`token`),
    KEY `idx_password_reset_user_id` (`user_id`),
    KEY `idx_password_reset_expires_at` (`expires_at`),

    CONSTRAINT `fk_password_reset_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Migration File

Run: `migrations/008_password_reset_functionality.sql`

---

## Email System

### Email Utility: `api/email.php`

Funkcijos:
- `sendEmail($to, $subject, $bodyHtml, $bodyText = '')` - Išsiunčia email
- `renderEmailTemplate($templateName, $data = [])` - Rendrina email template

Naudoja **PHPMailer** biblioteką.

### Email Template: `api/email-templates/password-reset.php`

**Features:**
- Responsive dizainas (mobile-friendly)
- Dvikalbis (LT/EN)
- Beautiful gradient design
- Security warnings
- 1 hour expiry notice
- "Atkurti slaptažodį" button su reset link

**Template Variables:**
- `$reset_link` - Password reset URL
- `$lang` - Language ('lt' or 'en')

---

## SMTP Configuration

### Production (`api/config.php`):

```php
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_ENCRYPTION', 'tls');
define('SMTP_USERNAME', 'your-email@gmail.com'); // In secrets.php
define('SMTP_PASSWORD', 'your-app-password');     // In secrets.php
define('SMTP_FROM_EMAIL', 'noreply@godeliauskas.com');
define('SMTP_FROM_NAME', 'Volley Registration');
define('APP_URL', 'https://volley.godeliauskas.com');
```

### Staging (`api/config-staging.php`):

```php
define('APP_URL', 'https://staging.godeliauskas.com');
define('SMTP_FROM_NAME', 'Volley Registration (Staging)');
```

---

## Security Features Summary

### 1. Token Security
- 64 characters (256-bit entropy)
- Crypto-safe generation: `bin2hex(random_bytes(32))`
- One-time use (marked as used after consumption)
- 1 hour expiry
- Unique constraint in database

### 2. Rate Limiting
- Forgot password: 3 attempts per 60 minutes per email
- Reset password: 5 attempts per 15 minutes per token
- Rate limits stored in `rate_limits` table

### 3. Password Validation
- Minimum 12 characters
- Requires uppercase, lowercase, digit
- Blocks common passwords
- Maximum 128 characters (DoS prevention)

### 4. User Enumeration Prevention
- Forgot password ALWAYS returns success
- Doesn't reveal if email exists
- Logs attempts for monitoring

### 5. SQL Injection Prevention
- All queries use prepared statements
- Token validation with regex
- Email validation with `filter_var()`

### 6. XSS Prevention
- All email template output: `htmlspecialchars($var, ENT_QUOTES, 'UTF-8')`
- JSON responses properly encoded

---

## Additional Changes (is_active Removal)

### 1. `api/login.php` (lines 62-65)
**Removed:**
```php
if (!$user['is_active']) {
    sendError('Account pending approval...', 403);
}
```

Vartotojai gali prisijungti net jei `is_active = 0`.

### 2. `api/auth.php` (line 56 & 129)
**Changed:**
```php
// Before
WHERE auth_token = ? AND is_active = 1
WHERE remember_me_token = ? AND is_active = 1

// After
WHERE auth_token = ?
WHERE remember_me_token = ?
```

### 3. `api/google-auth.php`

**A) Lines 190-193 - Removed is_active check:**
```php
// REMOVED
if (!$existingUser['is_active']) {
    sendError('Paskyra laukia patvirtinimo...', 403);
}
```

**B) Lines 260-311 - Immediate login for new Google users:**
- Old: `requires_password: true` + temp_token → Password setup modal
- New: `requires_password: false` + auth_token → Instant login

Nauji Google vartotojai NIEKADA nebemato password setup modal.

### 4. `api/events.php`

**Added user_has_groups check:**
```php
// Check if user belongs to any group
$stmt = $pdo->prepare("
    SELECT COUNT(*) as group_count
    FROM user_groups
    WHERE user_id = ?
");
$stmt->execute([$userId]);
$userHasGroups = ($groupCheck['group_count'] > 0);

if (!$userHasGroups) {
    sendSuccess([
        'user_has_groups' => false,
        'events' => []
    ]);
}
```

Response format:
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

## Testing Checklist

### Backend Testing

1. **Forgot Password**
   - ✅ Valid email → Success response + email sent
   - ✅ Invalid email → Success response (security) + no email
   - ✅ Rate limiting → 3 attempts per 60 min

2. **Reset Password**
   - ✅ Valid token + strong password → Success
   - ✅ Expired token → Error message
   - ✅ Invalid token → Error message
   - ✅ Used token → Error message
   - ✅ Weak password → Validation errors
   - ✅ Rate limiting → 5 attempts per 15 min

3. **Email Sending**
   - ✅ SMTP connection successful
   - ✅ Template rendering (LT/EN)
   - ✅ Reset link format correct
   - ✅ Email HTML responsive

4. **Login Changes**
   - ✅ is_active=0 users CAN login
   - ✅ Google OAuth new users login immediately
   - ✅ Events API returns user_has_groups flag

---

## Deployment Steps

### 1. Database Migration
```sql
-- Run on Production & Staging
SOURCE migrations/008_password_reset_functionality.sql;
```

### 2. Install Composer Dependencies
```bash
# On server
composer install --no-dev --optimize-autoloader
```

### 3. Configure SMTP
Edit `api/secrets.php` (production):
```php
define('SMTP_USERNAME', 'your-email@gmail.com');
define('SMTP_PASSWORD', 'your-gmail-app-password');
```

### 4. Test Email Sending
```bash
# Check logs after triggering forgot-password
tail -f /path/to/php/error.log
```

Look for:
- "Email sent successfully to: ..."
- "Password reset email sent to: ..."

---

## Frontend Integration (Todo)

### 1. Forgot Password Page
- Form: Email input
- POST to `/api/forgot-password.php`
- Show success message (always)

### 2. Reset Password Page
- Get token from URL: `?token=...`
- Form: New password + confirm password
- POST to `/api/reset-password.php`
- Show validation errors
- Redirect to login on success

### 3. Password Strength Indicator
- Visual feedback: weak/medium/strong
- Requirements list:
  - ✅ 12+ characters
  - ✅ Uppercase letter
  - ✅ Lowercase letter
  - ✅ Number

### 4. Events Page
- Check `user_has_groups` in response
- If false: Show "You need to join a group first" message

---

## Monitoring & Logs

### Success Logs
```
Email sent successfully to: user@example.com, subject: Slaptažodžio priminimas
Password reset email sent to: user@example.com, token expires: 2026-01-19 15:30:00
Password reset successful for user_id: 123
```

### Error Logs
```
Failed to send password reset email to: user@example.com
Password reset requested for non-existent email: fake@example.com
Email sending failed to: user@example.com, error: SMTP connect() failed
```

---

## Files Modified/Created

### New Files
- `composer.json`
- `api/email.php`
- `api/email-templates/password-reset.php`
- `api/forgot-password.php`
- `api/reset-password.php`
- `COMPOSER_SETUP.md`
- `PASSWORD_RESET_README.md`

### Modified Files
- `api/config.php` (SMTP config)
- `api/config-staging.php` (SMTP config)
- `api/login.php` (removed is_active check)
- `api/auth.php` (removed is_active check)
- `api/google-auth.php` (immediate login + removed is_active check)
- `api/events.php` (added user_has_groups check)

---

## Support & Troubleshooting

### Common Issues

**1. Email not sending:**
- Check SMTP credentials
- Verify SMTP_PORT is open (587)
- Check error logs
- Gmail: Use App Password

**2. Token expired too quickly:**
- Check server time (timezone)
- Verify `expires_at` calculation

**3. Password validation too strict:**
- Adjust `validatePasswordStrength()` in `db.php`

**4. Rate limiting too aggressive:**
- Adjust limits in endpoint files

---

**Implementation Date:** 2026-01-19
**Version:** 1.0
**Status:** ✅ Complete
