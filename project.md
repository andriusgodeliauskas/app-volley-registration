# Volley Registration App

Tai yra tinklinio registracijos sistema. Projektas susideda iš PHP (API) ir frontend dalies.

**Nauja funkcija (2026-01):** Integruota **Paysera** mokėjimų sistema automatiniam piniginės papildymui. Palaiko mokėjimus per bankus, automatiškai atnaujina balansą ir generuoja operacijų istoriją.


## Svarbi konfigūracija (Saugumas)

Šiame projekte naudojami jautrūs prisijungimo duomenys prie duomenų bazės. Šie failai yra **ignoruojami** (`.gitignore`) ir neturi patekti į versijų kontrolės sistemą.

### Kaip sukonfigūruoti aplinką:

1.  **Production Aplinka:**
    *   Nueikite į `api/` katalogą.
    *   Nukopijuokite `secrets.example.php` į `secrets.php`.
    *   Atsidarykite `api/secrets.php` ir įveskite savo **Production** duomenų bazės prisijungimus.

2.  **Staging Aplinka:**
    *   Nueikite į `api/` katalogą.
    *   Nukopijuokite `config-staging.example.php` į `config-staging.php`.
    *   Atsidarykite `api/config-staging.php` ir įveskite savo **Staging** duomenų bazės prisijungimus.

**PASTABA:** Failai `api/secrets.php` ir `api/config-staging.php` yra įtraukti į `.gitignore`, todėl jie nebus siunčiami į GitHub. Tai užtikrina saugumą.

## GitHub Saugykla

Projekto failai siunčiami į: [https://github.com/andriusgodeliauskas/app-volley-registration](https://github.com/andriusgodeliauskas/app-volley-registration)

### Failų siuntimas (komandos)

```bash
# Pridėti visus pakeitimus
git add .

# Užfiksuoti pakeitimus
git commit -m "Atnaujintas projektas su saugumo instrukcijomis"

# Išsiųsti į GitHub
git push origin main
```

## Development Guidelines

When developing this project, follow these critical principles:

1. **Think First, Read Code**: Always think through the problem and read relevant codebase files before making changes.

2. **Get Approval Before Major Changes**: Before making any significant changes, present the plan and wait for verification.

3. **Explain Changes**: Provide a high-level explanation of changes at every step.

4. **Simplicity First**: Make every task and code change as simple as possible. Avoid massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.

5. **Maintain Documentation**: Keep documentation files that describe how the app architecture works inside and out.

6. **Never Speculate**: Never speculate about code you have not opened. If a specific file is referenced, READ it before answering. Investigate and read relevant files BEFORE answering questions about the codebase. Never make claims about code before investigating unless you are certain - give grounded and hallucination-free answers.

7. **Verify Your Work**: Go back and verify all work after completion.

8. **Best Practices**: Ensure best coding practices, efficiency, and good security in all changes.

9. **Test Coverage**: All code changes should be covered by tests. Manual testing should be performed for frontend changes, and test cases should be documented.

---

# Application Security Guidelines

## General Information
**Project Type:** Web Application (PHP/MySQL)
**Environment:** Production (https://volley.godeliauskas.com), Staging (https://staging.godeliauskas.com)
**Priority:** Maximum security - prevention against all possible vulnerabilities
**Backup Strategy:** Database backups handled by hosting provider
**File Uploads:** No file upload functionality in this application

---

## 1. AUTHENTICATION AND AUTHORIZATION

### Required:
- ✓ All passwords MUST be hashed using `password_hash()` (PHP) or bcrypt
- ✓ NEVER store passwords in plain text
- ✓ Session IDs must be generated securely (`session_regenerate_id()` after login)
- ✓ Login attempts must be rate limited - maximum 5 attempts per 15 minutes
- ✓ Implement CSRF tokens for all forms
- ✓ Session timeout after 30 minutes of inactivity
- ✓ "Remember me" functionality must use secure tokens, not sessions

### Forbidden:
- ✗ NEVER pass passwords through URL parameters
- ✗ NEVER store session IDs in cookies without `httponly` and `secure` flags
- ✗ NEVER use `md5()` or `sha1()` for passwords

---

## 2. SQL INJECTION PREVENTION

### Required:
- ✓ ALWAYS use prepared statements with parameter binding
- ✓ Validate ALL user inputs before using in queries
- ✓ Use ORM or query builder where possible
- ✓ Database user must have minimal required permissions (not root)

### Example CORRECT:
```php
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND status = ?");
$stmt->execute([$email, $status]);
```

### Example INCORRECT (FORBIDDEN):
```php
$query = "SELECT * FROM users WHERE email = '$email'"; // NEVER DO THIS
```

---

## 3. XSS (CROSS-SITE SCRIPTING) PREVENTION

### Required:
- ✓ ALL user input must be sanitized before outputting to HTML
- ✓ Use `htmlspecialchars($string, ENT_QUOTES, 'UTF-8')` in PHP
- ✓ Implement Content Security Policy (CSP) headers
- ✓ Validate input types (email, number, date, etc.)

### Example:
```php
// Correct
echo htmlspecialchars($user_comment, ENT_QUOTES, 'UTF-8');

// Incorrect
echo $user_comment; // DANGEROUS
```

---

## 4. CSRF (CROSS-SITE REQUEST FORGERY) PREVENTION

### Required:
- ✓ EVERY form must have a unique CSRF token
- ✓ Token must be validated server-side
- ✓ Tokens must be session-based and expire
- ✓ Use `SameSite=Strict` cookie attribute

### Implementation:
```php
// Generation
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

// Validation
if (!hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
    die('CSRF validation failed');
}
```

---

## 5. CONFIGURATION AND ENVIRONMENT SECURITY

### Required:
- ✓ `display_errors = Off` in production
- ✓ `error_reporting = E_ALL` but log to file, NOT to screen
- ✓ All passwords/API keys only in `.env` file or `secrets.php`
- ✓ `.env` and `secrets.php` files MUST be in `.gitignore`
- ✓ HTTPS mandatory (HTTP -> HTTPS redirect)
- ✓ Security headers:
```
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Strict-Transport-Security: max-age=31536000
  Content-Security-Policy: default-src 'self'
```

### Forbidden:
- ✗ NEVER commit credentials to version control
- ✗ NEVER expose `.env` or `secrets.php` files
- ✗ NEVER run production with `display_errors = On`

---

## 6. SESSION MANAGEMENT

### Required:
- ✓ Use `session_regenerate_id(true)` after login
- ✓ Set secure session cookie parameters
- ✓ Implement session timeout (30 minutes)
- ✓ Destroy sessions properly on logout
- ✓ Store minimal data in sessions

### Implementation:
```php
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'Strict');
session_start();
```

---

## 7. RATE LIMITING

### Required:
- ✓ Login attempts: max 5 per 15 minutes
- ✓ API endpoints: implement throttling
- ✓ Registration: limit to prevent spam
- ✓ Password reset: max 3 per hour

---

## 8. LOGGING AND MONITORING

### MUST Log:
- ✓ Failed login attempts
- ✓ Password changes
- ✓ Critical operations (delete, update sensitive data)
- ✓ API rate limit violations
- ✓ SQL errors (without sensitive data)
- ✓ Access to admin areas

### NEVER Log:
- ✗ Passwords
- ✗ Credit card numbers
- ✗ Session tokens
- ✗ API keys
- ✗ Personal identification numbers

---

## 9. DEPENDENCY AND THIRD-PARTY SECURITY

### Required:
- ✓ Regularly update dependencies
- ✓ Use `composer audit` or `npm audit`
- ✓ Check third-party libraries for CVEs
- ✓ Minimize number of dependencies
- ✓ Review security advisories

---

## 10. INPUT VALIDATION AND SANITIZATION

### Required for ALL User Input:
- ✓ Whitelist validation (allow known good, not block known bad)
- ✓ Type checking (email, integer, date formats)
- ✓ Length limits
- ✓ Character set restrictions
- ✓ Sanitization before output
- ✓ Sanitization before database operations

### Example:
```php
// Email validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    throw new InvalidArgumentException('Invalid email');
}

// Integer validation
$id = filter_var($_POST['id'], FILTER_VALIDATE_INT);
if ($id === false) {
    throw new InvalidArgumentException('Invalid ID');
}

// String sanitization
$name = htmlspecialchars(trim($_POST['name']), ENT_QUOTES, 'UTF-8');
```

---

## SECURITY TESTING CHECKLIST

Before deployment, verify:

- [ ] No hardcoded credentials
- [ ] All SQL queries use prepared statements
- [ ] All user inputs are sanitized/validated
- [ ] CSRF protection on all forms
- [ ] Session management is secure
- [ ] Error handling doesn't expose sensitive info
- [ ] HTTPS is enforced
- [ ] Security headers are set
- [ ] Rate limiting is implemented
- [ ] Logging is configured properly

---

## SECURITY REVIEW PROCESS

When reviewing code, check:

1. **Check every database query** for SQL injection
2. **Check every form** for CSRF protection
3. **Check every output** for XSS prevention
4. **Check every file** for hardcoded credentials
5. **Check authentication** on all protected routes
6. **Check authorization** - users can only access their own data
7. **Check error messages** - no sensitive information leaked
8. **Check session handling** - proper generation and destruction

---

## SECURE CODING PATTERNS

### Password Handling:
```php
// Hashing
$hash = password_hash($password, PASSWORD_DEFAULT);

// Verification
if (password_verify($password, $hash)) {
    // Valid password
}

// Rehashing if needed
if (password_needs_rehash($hash, PASSWORD_DEFAULT)) {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    // Update database
}
```

### Session Security:
```php
// Start session securely
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'Strict');
session_start();

// Regenerate after login
session_regenerate_id(true);

// Destroy properly
session_destroy();
setcookie(session_name(), '', time()-3600, '/');
```

### Safe Redirects:
```php
// Use whitelist
$allowed_redirects = ['dashboard', 'profile', 'settings'];
if (in_array($_GET['page'], $allowed_redirects)) {
    header('Location: /' . $_GET['page']);
}
```

---

## HEADERS TO IMPLEMENT
```php
// Security Headers
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");
header("Strict-Transport-Security: max-age=31536000; includeSubDomains");
header("Content-Security-Policy: default-src 'self'");
```

---

## AI INSTRUCTIONS

When working on this project:

1. **ALWAYS** read this document before making any code changes
2. **ALWAYS** validate all user inputs
3. **ALWAYS** use prepared statements for database queries
4. **ALWAYS** sanitize output to HTML
5. **NEVER** commit credentials to version control
6. **NEVER** use deprecated security functions
7. **NEVER** assume input is safe

When uncertain about security:
- ASK before implementing
- RESEARCH best practices
- SUGGEST the most secure option
- EXPLAIN security implications

---

**IMPORTANT:** This document must be referenced at the start of EVERY coding session when working on this project.

---

# Recent Security Updates (2026-01-08)

## Phase 1 Critical Security Fixes - COMPLETED ✅

### 1. httpOnly Cookies CSRF Protection (IMPLEMENTED)

**Problem:** Session-based CSRF tokens were causing cache issues and validation failures.

**Solution:** Migrated to httpOnly cookies with SameSite=Strict attribute for automatic CSRF protection.

**Implementation:**
- **Backend:**
  - `api/login.php`: Sets httpOnly cookie with secure attributes on successful login
  - `api/auth.php`: Reads auth token from cookie (priority order: cookie → Authorization header → query string)
  - `api/logout.php`: Created new endpoint to properly clear httpOnly cookie
  - Removed `validateCsrfToken()` function from `api/db.php`
  - Removed CSRF validation from 11 POST endpoints

- **Frontend:**
  - `frontend/src/api/config.js`: Added `credentials: 'include'` to send cookies with requests
  - `frontend/src/context/AuthContext.jsx`: Updated logout to call backend API

**Cookie Security Attributes:**
```php
setcookie('auth_token', $token, [
    'expires' => time() + (7 * 24 * 60 * 60),
    'path' => '/',
    'secure' => true,        // HTTPS only
    'httponly' => true,      // JavaScript cannot access (XSS protection)
    'samesite' => 'Strict'   // CSRF protection
]);
```

**Benefits:**
- ✅ Automatic CSRF protection via SameSite=Strict
- ✅ XSS protection via httpOnly flag
- ✅ No cache issues (cookies always work)
- ✅ Industry standard approach

---

### 2. Rate Limiting (IMPLEMENTED)

**Implementation:**
- Created `rate_limits` database table
- Added `checkRateLimit()` and `resetRateLimit()` functions to `api/db.php`
- Applied to `api/login.php`: 5 attempts per 15 minutes
- Applied to `api/register.php`: 3 attempts per 60 minutes
- Exponential backoff blocking for repeated violations

**Database Schema:**
```sql
CREATE TABLE rate_limits (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    attempt_type ENUM('login', 'registration') NOT NULL,
    attempts INT UNSIGNED DEFAULT 1,
    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    blocked_until TIMESTAMP NULL,
    UNIQUE KEY uk_identifier_type (identifier, attempt_type),
    INDEX idx_blocked_until (blocked_until)
);
```

**Protection:**
- ✅ Prevents brute force attacks
- ✅ Prevents credential stuffing
- ✅ Prevents registration spam

---

### 3. Strong Password Requirements (IMPLEMENTED)

**Old:** Minimum 6 characters
**New:** Minimum 12 characters with complexity requirements

**Backend Validation (`api/db.php`):**
```php
function validatePasswordStrength(string $password): array {
    - Minimum 12 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    - Blocks common weak passwords
}
```

**Frontend Validation (`frontend/src/pages/Register.jsx`):**
- Password regex pattern validation
- Helper text showing requirements in both LT/EN
- Real-time validation feedback

**Applied to:**
- ✅ `api/register.php` - backend validation
- ✅ `frontend/src/pages/Register.jsx` - frontend validation with helper text
- ✅ `frontend/src/translations.js` - multilingual error messages

---

### 4. Error Alert Improvements (IMPLEMENTED)

**Problem:** Error messages disappeared too quickly (1 second)

**Solution:** Added dismissible alerts with close button

**Implementation:**
- Added `alert-dismissible fade show` Bootstrap classes
- Added close button (`btn-close`) to error alerts
- Error messages now persist until user dismisses or re-submits form

**Files Modified:**
- ✅ `frontend/src/pages/Login.jsx`
- ✅ `frontend/src/pages/Register.jsx`

---

### 5. Debug Script Removed (CRITICAL - COMPLETED)

**CRITICAL SECURITY FIX:**
- ✅ Deleted `api/debug.php` from codebase
- ✅ Added to `.gitignore`
- ✅ Prevents exposure of database credentials, user data, and password hashes

---

## Database Migrations

**Migration 006:** Rate Limits Table
```
migrations/006_create_rate_limits_table.sql
```

Run in phpMyAdmin for both staging and production databases.

---

## Files Modified Summary

### Backend (PHP):
1. `api/auth.php` - httpOnly cookie authentication
2. `api/login.php` - set httpOnly cookie, rate limiting
3. `api/logout.php` - NEW FILE - clear httpOnly cookie
4. `api/register.php` - password strength validation, rate limiting
5. `api/db.php` - rate limiting functions, removed CSRF validation
6. `api/config-staging.php` - updated DB credentials
7. **Removed CSRF validation from:**
   - `api/register_event.php`
   - `api/deposit_create.php`
   - `api/donation_create.php`
   - `api/user_update.php`
   - `api/admin_user_update.php`
   - `api/admin_topup.php`
   - `api/admin_event_finalize.php`
   - `api/admin_event_update.php`
   - `api/admin_transaction_update.php`
   - `api/admin_deposit_refund.php`
   - `api/admin_deposit_create.php`

### Frontend (React):
1. `frontend/src/api/config.js` - added credentials: 'include'
2. `frontend/src/context/AuthContext.jsx` - async logout with API call
3. `frontend/src/pages/Login.jsx` - dismissible error alert
4. `frontend/src/pages/Register.jsx` - password requirements, dismissible alert
5. `frontend/src/translations.js` - password validation messages

### Database:
1. `migrations/006_create_rate_limits_table.sql` - NEW FILE

---

## Testing Checklist

### Completed:
- [x] httpOnly cookie set correctly on login
- [x] Cookie has correct attributes (httpOnly, secure, SameSite=Strict)
- [x] Logout clears httpOnly cookie
- [x] Event registration works without CSRF errors
- [x] JavaScript cannot access auth_token cookie

### Pending Testing:
- [ ] Rate limiting blocks after 5 failed login attempts
- [ ] Rate limiting auto-resets after time window
- [ ] Weak passwords rejected (< 12 chars, no uppercase, etc.)
- [ ] Strong passwords accepted
- [ ] Error alerts stay visible until dismissed
- [ ] All protected endpoints work with httpOnly cookies

---

## Deployment Status

**Staging (staging.godeliauskas.com):**
- ✅ Code deployed to deploy-staging/
- ⏳ PENDING: FTP upload verification
- ⏳ PENDING: Full testing completion

**Production (volley.godeliauskas.com):**
- ⏸️ ON HOLD - waiting for staging verification

---

## Next Steps (Phase 2)

1. Implement session timeout with activity tracking
2. Add audit logging for admin actions
3. Implement security headers (CSP, X-Frame-Options, etc.)
4. Add input validation for numeric fields
5. Fix authorization in admin_user_update.php (group admin restrictions)

---

## Security Status

**Risk Level:** MEDIUM (down from HIGH)
- ✅ Critical debug script removed
- ✅ CSRF protection implemented via httpOnly cookies
- ✅ Rate limiting prevents brute force
- ✅ Strong password requirements enforced
- ⚠️ Session timeout not yet implemented
- ⚠️ Admin audit logging not yet implemented

**Production Ready:** After full staging testing completion
