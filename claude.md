# app-volley-registration - Volleyball Event Management System

## Overview
A full-stack web application for managing volleyball game registrations, groups, payments, and events. Features separate frontend (React) and backend (PHP) with a two-stage deployment workflow.

## Tech Stack
- **Frontend**: React + Vite (in `frontend/`)
- **Backend**: Native PHP (in `api/`)
- **Database**: MySQL
- **Deployment**: PowerShell scripts for staging/production

## Project Structure
```
app-volley-registration/
├── frontend/              # React application
│   ├── src/               # Source code
│   ├── dist/              # Production build
│   └── package.json
├── api/                   # PHP backend
│   ├── config.php         # Configuration
│   ├── secrets.php        # Database credentials (gitignored)
│   ├── db.php             # Database connection
│   ├── auth.php           # Authentication logic
│   ├── login.php          # Login endpoint
│   ├── register.php       # Registration endpoint
│   ├── events.php         # Events CRUD
│   ├── groups.php         # Groups management
│   ├── register_event.php # Event registration logic
│   └── admin_*.php        # Admin endpoints
├── database.sql           # Database schema
├── *.sql                  # Migration scripts
├── deploy/                # Production deployment package
├── deploy-staging/        # Staging deployment package
├── prepare-deploy.ps1     # Production deploy script
└── prepare-deploy-staging.ps1  # Staging deploy script
```

## Environments
- **Production**: volley.godeliauskas.com
- **Staging**: staging.godeliauskas.com

## Commands
```bash
# Frontend
cd frontend
npm install
npm run dev              # Development server
npm run build            # Build for production

# Deployment
./prepare-deploy-staging.ps1   # Deploy to staging
./prepare-deploy.ps1           # Deploy to production
```

## Key Features
- **User Management**: Registration, login, role-based access (Super Admin, Group Admin, User)
- **Google OAuth**: Sign in with Google - users can authenticate via Google and set password for dual login options
- **Event System**: Create events, manage registrations, waitlists
- **Wallet System**: Balance top-up, payment tracking, deposits
- **Group Management**: Create/join groups, group-specific events
- **Admin Panel**: User management, event finalization, statistics
- **Remember Me**: 30-day persistent login with secure tokens
- **Session Timeout**: 30-minute inactivity logout for security
- **Rate Limiting**: Brute force protection on login/registration

## Admin Features
- **Users List Filtering**: Filter users by status (All/Active/Inactive), with inactive users displayed first by default
- **Events Occupancy**: View event capacity and participant lists
- **Negative Balance Users**: Quick view of users with debt
- **Waitlist Management**: Automatic waitlist with deposit priority

## Setup
1. **Database**: Import `database.sql` into MySQL
2. **Backend**: Copy `api/secrets.example.php` to `api/secrets.php` and configure
3. **Frontend**: Run `npm install && npm run dev` in `frontend/`

## Development Notes
- Default admin: `admin@volleyapp.com` / `admin123` (change in production!)
- API uses JWT-like session tokens
- All admin endpoints prefixed with `admin_`
- Staging environment has separate config (`config-staging.php`)

## Google OAuth Setup

### Backend Files
- `api/google-auth.php` - Handles Google OAuth callback, user creation/login
- `api/set-password.php` - Allows Google users to set password for dual login
- `api/google-config.php` - Returns public OAuth config (client_id, redirect_uri)

### Frontend Files
- `frontend/src/components/GoogleSignInButton.jsx` - Google sign-in button
- `frontend/src/components/SetPasswordModal.jsx` - Password setup modal for new Google users
- `frontend/src/pages/GoogleCallback.jsx` - OAuth callback handler

### Database Migration
Run `google_oauth_migration.sql` to add:
- `oauth_provider` column (ENUM: 'email', 'google')
- `oauth_google_id` column
- `oauth_temp_tokens` table for password setup flow

### Configuration
1. **Google Cloud Console**: Add authorized redirect URIs:
   - `https://volley.godeliauskas.com/auth/google/callback`
   - `https://staging.godeliauskas.com/auth/google/callback`
   - `http://localhost:5173/auth/google/callback`

2. **secrets.php** (production) or **config-staging.php** (staging):
   ```php
   define('GOOGLE_CLIENT_ID', 'your_client_id.apps.googleusercontent.com');
   define('GOOGLE_CLIENT_SECRET', 'your_client_secret');
   ```

3. **rate_limits table**: Must support VARCHAR or extended ENUM for attempt_type:
   ```sql
   ALTER TABLE rate_limits MODIFY COLUMN attempt_type VARCHAR(50) NOT NULL;
   ```

### OAuth Flow
1. User clicks "Sign in with Google"
2. Redirected to Google OAuth consent
3. Google redirects back to `/auth/google/callback`
4. If new user: Show password setup modal → create account
5. If existing user: Login directly

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
