# Deployment History

This document tracks all production deployments to https://volley.godeliauskas.com

---

## 2026-01-31 - Super Admin New User Registration Notification ✅

**Status:** READY FOR DEPLOYMENT
**Date:** 2026-01-31

### What Was Changed

#### New Feature: Email Notification for New User Registrations
When a new user registers in the system, all active Super Admins automatically receive an email notification.

**Key Features:**
- Sends email only to active Super Admins (`is_active = 1 AND role = 'super_admin'`)
- Inactive Super Admins do NOT receive notifications
- Email failures do NOT block the registration process (graceful failure)
- Email content in Lithuanian only (Super Admins don't need EN)
- Logged to `email_logs` table with type `new_user_registration`

**Email Content:**
```
Sveiki,
Naujas vartotojas užsiregistravo sistemoje:
{new_user_email}
[Prisijungti]
Linkėjimai,
AG Volley komanda
```

### Files Changed

| File | Change |
|------|--------|
| `api/email-templates/new-user-registered.php` | NEW - Email template for notification |
| `api/send-new-user-notification.php` | NEW - Helper function to send notifications to all active Super Admins |
| `api/register.php` | MODIFIED - Added notification call after successful registration (lines 124-130) |

### Security Review

**Status:** APPROVED (0 critical, 0 high priority issues)

| Check | Status |
|-------|--------|
| SQL Injection | PASS - Prepared statements used |
| XSS Prevention | PASS - htmlspecialchars with ENT_QUOTES |
| Error Handling | PASS - Email failures don't block registration |
| GDPR Compliance | PASS - Logged to email_logs table |

### Database Changes Required

**NONE** - No database migrations needed.

### Testing Checklist

- [ ] Register a new user
- [ ] Verify active Super Admins received email
- [ ] Verify inactive Super Admins did NOT receive email
- [ ] Check `email_logs` table for new entries
- [ ] Test when email server unavailable (registration should still succeed)

---

## 2026-01-31 - Email System, Date Filters & Google OAuth Fixes ✅

**Status:** DEPLOYED
**Date:** 2026-01-31

### What Was Changed

#### 1. Google OAuth CSRF Fix (Critical)
- **Problem:** CSRF validation error when logging in via Google, even though login succeeded
- **Root Cause:** `sessionStorage` doesn't persist across OAuth redirects
- **Solution:** Changed to `localStorage` for OAuth state token storage
- **Additional Fixes:**
  - Added `useRef` to prevent double callback execution
  - Added check if user already logged in
  - Added null checks for result.user
  - Improved error state handling

#### 2. Email System Bug Fixes
- **Fixed:** PHP scope issue in `send-email.php` - `$currentUser` was not accessible inside function
- **Fixed:** Missing closing brace in `send-negative-balance-email.php` causing syntax error
- **Improved:** Better error messages in Lithuanian for email sending failures:
  - "Vartotojas nerastas"
  - "Vartotojo balansas nėra pakankamai neigiamas"
  - "Nepavyko išsiųsti email"

#### 2. Password Reset Email Template
- **Removed:** Header "Slaptažodžio atkūrimas" from email
- **Updated:** Intro text to clearer Lithuanian
- **Changed:** Button text to "Sukurti naują slaptažodį"
- **Removed:** Gray background from expiry warning
- **Updated:** "not_requested" text

#### 3. Email Preview Improvements
- **Increased:** `body_preview` storage from 200 to 1000 characters
- **Fixed:** Removed excessive whitespace from preview (collapsed multiple spaces)
- **Improved:** Preview display in admin modal

#### 4. Date Filter for Email Logs (NEW FEATURE)
- **Backend:** Added `date_from` and `date_to` parameters to `email-logs.php`
- **Frontend:** Added date range filter inputs with "Filtruoti" button
- **Default:** Shows last 7 days of emails
- **Translations:** Added "Nuo"/"Iki" (LT) and "From"/"To" (EN)

#### 5. CLAUDE.md - Agent Workflow Documentation
- **Added:** Detailed agent workflow requirements
- **Added:** Agent table (volley-analysis-agent, php-backend-developer, ui-ux-designer, code-review-security)
- **Added:** Required workflow steps for every task
- **Added:** Development guidelines (14 rules total)

#### 6. Email Language Preference (NEW FEATURE)
- **User Profile:** Added dropdown to select email language (Lietuvių/English)
- **Admin Users:** Added email language dropdown to admin user edit page
- **Backend:** All user APIs now return `preferred_language` field
- **Default:** New users default to 'lt' (Lithuanian)
- **Translations:** Added "Email kalba"/"Email language" labels

### Files Changed

| File | Change |
|------|--------|
| `frontend/src/components/GoogleSignInButton.jsx` | Changed sessionStorage to localStorage |
| `frontend/src/pages/GoogleCallback.jsx` | Fixed CSRF validation, added double-execution prevention |
| `frontend/src/translations.js` | Added csrf_validation_failed translations, date filter translations |
| `api/admin/email-logs.php` | Added date_from/date_to filters |
| `api/admin/send-email.php` | Fixed $currentUser scope issue |
| `api/email-templates/password-reset.php` | Updated template text/layout |
| `api/email.php` | Increased body_preview, collapsed whitespace |
| `api/send-negative-balance-email.php` | Fixed syntax, improved error messages |
| `frontend/src/pages/admin/Messages.jsx` | Added date filter UI |
| `CLAUDE.md` | Added agent workflow documentation |
| `frontend/src/pages/Profile.jsx` | Added email language dropdown |
| `frontend/src/pages/AdminUserEdit.jsx` | Added email language dropdown |
| `api/user_update.php` | Added preferred_language validation and update |
| `api/admin_user_update.php` | Added preferred_language handling |
| `api/users.php`, `api/user.php`, `api/login.php`, `api/auth.php` | Added preferred_language to responses |
| `api/google-auth.php`, `api/register.php` | Set default preferred_language for new users |

### Database Changes Required

**NONE** - No database migrations needed for this deployment.

### Deployment Checklist

- [ ] Upload `deploy/` contents to production FTP
- [ ] Test email sending functionality
- [ ] Test date filter on Messages page
- [ ] Verify password reset email template
- [ ] Test email language preference in Profile
- [ ] Test admin can change user's email language

---

## 2026-01-09 - Security Phase 2 Production Deployment ✅

**Status:** SUCCESSFUL
**Deployment Time:** 2026-01-09
**Downtime:** 0 minutes (rolling deployment)
**Database:** goskajss_volley

### What Was Deployed

#### Database Changes
1. ✅ Added `last_activity` column to `users` table
   - Type: DATETIME NULL
   - Purpose: Track session activity for 30-minute timeout
   - Index: `idx_users_last_activity` created for performance
   - Initial data: 36 active sessions initialized with NOW()

2. ✅ Created `rate_limits` table (missing from previous deployment)
   - Purpose: Brute force protection for login/registration
   - Columns: identifier, attempt_type, attempts, last_attempt, blocked_until
   - Indexes: uk_identifier_type (unique), idx_blocked_until, idx_last_attempt

#### Security Enhancements
1. ✅ **Session Timeout - 30 Minutes**
   - Sessions expire after 30 minutes of inactivity
   - `last_activity` updated on every authenticated request
   - Automatic session invalidation in `api/auth.php`

2. ✅ **Security Headers** (`api/db.php`)
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: 1; mode=block
   - Strict-Transport-Security (production only)
   - Content-Security-Policy with self-src restrictions
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: geolocation(), microphone(), camera()
   - X-Robots-Tag: noindex, nofollow, noarchive, nosnippet

3. ✅ **Enhanced Input Validation**
   - Names: 2-50 characters, letters/spaces/hyphens/apostrophes only
   - Emails: max 100 characters
   - Avatars: max 20 characters, alphanumeric only
   - Password: 12+ chars, uppercase+lowercase+digit (special chars optional)

4. ✅ **SEO/Privacy - Search Engine Blocking (4 Layers)**
   - Layer 1: `robots.txt` - blocks all crawlers (Google, Bing, AI bots)
   - Layer 2: HTML meta tags - noindex, nofollow, noarchive, nosnippet
   - Layer 3: HTTP X-Robots-Tag headers - on all responses
   - Layer 4: User-Agent blocking - 403 Forbidden for known crawlers

#### Files Updated
- `api/db.php` - Security headers + X-Robots-Tag
- `api/auth.php` - Session timeout logic
- `api/login.php` - Set last_activity on login
- `api/logout.php` - Clear last_activity on logout
- `api/register.php` - Enhanced validation (names, email)
- `api/user_update.php` - Enhanced validation
- `api/secrets.php` - Updated with correct production DB credentials
- `frontend/index.html` - SEO blocking meta tags
- `frontend/public/robots.txt` - NEW - Search engine blocking
- `frontend/public/.htaccess` - User-agent blocking + X-Robots-Tag
- All frontend assets (index-*.js, index-*.css) - Rebuilt

### Deployment Process

#### Pre-Deployment
- ✅ Database backup completed: `backup_production_2026-01-09_BEFORE_PHASE2.sql`
- ✅ Frontend built: `npm run build` in frontend/
- ✅ Deployment package prepared: `/deploy` folder

#### Migration Steps
1. ✅ Database verification: `SELECT DATABASE()` → `goskajss_volley`
2. ✅ Added `last_activity` column using safe dynamic SQL
3. ✅ Created performance index on `last_activity`
4. ✅ Initialized active sessions (36 users)
5. ✅ Created missing `rate_limits` table
6. ✅ Verification query confirmed: 49 total users, 36 with last_activity, 45 with tokens

#### File Deployment
1. ✅ Fixed `api/secrets.php` with correct production credentials:
   - DB_NAME: goskajss_volley
   - DB_USER: goskajss_volley
   - DB_PASS: [correct production password]
2. ✅ Uploaded all files from `/deploy` to production FTP
3. ✅ Overwritten all existing files

### Post-Deployment Verification

#### Test Results ✅
1. ✅ **Site Loading** - Login page loads correctly
2. ✅ **Authentication** - Login/logout working
3. ✅ **Security Headers** - All headers present in API responses
4. ✅ **robots.txt** - Accessible at /robots.txt, blocking all crawlers
5. ✅ **Database Connection** - Events page loads data correctly
6. ✅ **Application Functionality** - All features working (Events, Admin, Wallet)

### Issues Encountered

#### Issue 1: Database Connection Failed
**Error:** `Database connection failed`
**Cause:** `api/secrets.php` had old staging DB credentials
**Fix:** Updated secrets.php with correct production credentials
**Resolution Time:** 5 minutes

#### Issue 2: Missing rate_limits Table
**Error:** `Table 'goskajss_volley.rate_limits' doesn't exist`
**Cause:** rate_limits table was created in Phase 1 but not migrated to production
**Fix:** Executed migration SQL to create table
**Resolution Time:** 2 minutes

### Monitoring Plan

#### First Hour (Completed)
- [x] No PHP errors in error logs
- [x] Login/logout tested successfully
- [x] Events page loading correctly
- [x] Security headers verified in DevTools
- [x] robots.txt accessible

#### First 24 Hours
- [ ] Check error logs every 4-6 hours
- [ ] Monitor user login activity
- [ ] Verify no session timeout complaints
- [ ] Test 30-minute timeout (manual DB update test)

#### First Week
- [ ] Daily error log review
- [ ] User feedback monitoring
- [ ] Google Search Console check (after 2-3 days):
  - Run: `site:volley.godeliauskas.com`
  - Expected: "No results found"

### Rollback Plan

If critical issues occur:

1. **Database Rollback:**
   ```sql
   ALTER TABLE users DROP COLUMN IF EXISTS last_activity;
   DROP INDEX IF EXISTS idx_users_last_activity ON users;
   ```
   OR restore from backup: `backup_production_2026-01-09_BEFORE_PHASE2.sql`

2. **File Rollback:**
   - Re-upload files from previous production version
   - OR contact hosting support for file restore

### Success Criteria

All criteria met ✅:
- [x] Database migration completed without errors
- [x] All files uploaded successfully
- [x] Site loads and login works
- [x] Security headers present in API responses
- [x] robots.txt accessible and blocking crawlers
- [x] No PHP errors in error logs
- [x] Users can access all features
- [x] Session timeout logic active

### Performance Impact

- **Database:** +1 column (last_activity), +1 index - minimal impact
- **API Response Time:** +1-2ms (security headers overhead) - negligible
- **Frontend Build Size:** 524.49 kB (no change from previous build)

### Security Improvements Summary

| Feature | Before | After |
|---------|--------|-------|
| Session Timeout | Never expires | 30 minutes inactivity |
| Security Headers | Basic CORS only | 10+ comprehensive headers |
| Input Validation | Basic email/password | Length limits + format checks |
| Search Engine Indexing | Potentially indexed | 4-layer blocking |
| Rate Limiting | 5 attempts/15min | ✓ (table now exists) |
| Password Strength | 12+ chars | 12+ chars (removed special char req) |

### Next Steps

1. **Monitor Logs** - Check for errors daily for 1 week
2. **User Feedback** - Watch for session timeout complaints
3. **SEO Verification** - Check Google in 2-3 days (should show 0 results)
4. **Session Timeout Test** - Manually test 30-minute timeout after 1 week
5. **Security Audit** - Review error logs for suspicious activity

---

## Previous Deployments

### 2026-01-08 - Security Phase 1 (Staging Only)
- httpOnly cookies with SameSite=Strict
- Rate limiting (5 attempts/15 min)
- Password strength validation (12+ chars)
- Note: Not fully deployed to production until 2026-01-09

---

**Deployment Owner:** Andrius Godeliauskas
**Environment:** Production (https://volley.godeliauskas.com)
**Database:** goskajss_volley
**Last Updated:** 2026-01-09
