# Production Deployment Guide - Step by Step

**Date:** 2026-01-09
**Target:** volley.godeliauskas.com (Production)
**Package:** `/deploy` folder
**Database:** goskajss_volley_registration

---

## ⚠️ IMPORTANT - Read Before Starting

1. **Backup is MANDATORY** - Do not skip Step 1!
2. **Low-traffic time recommended** - Best time: 2-4 AM
3. **Estimated duration:** 10-15 minutes
4. **Expected downtime:** 0 (zero) - deployment is non-blocking

---

## 📋 Pre-Deployment Checklist

- [ ] Backup completed and verified
- [ ] Low-traffic time scheduled
- [ ] FTP credentials ready
- [ ] Database credentials ready
- [ ] `/deploy` folder ready on your computer

---

# STEP-BY-STEP DEPLOYMENT

---

## STEP 1: BACKUP DATABASE (MANDATORY) ⚠️

**CRITICAL: This step is NOT optional!**

### Option A: Via phpMyAdmin

1. Login to phpMyAdmin
2. Select database: `goskajss_volley_registration`
3. Click **Export** tab
4. Method: **Quick**
5. Format: **SQL**
6. Click **Go**
7. Save file as: `backup_production_2026-01-09_BEFORE_PHASE2.sql`

**Verify backup:**
- File size should be > 50 KB
- Open file and check first line starts with `-- phpMyAdmin SQL Dump`

### Option B: Via Command Line (SSH)

```bash
mysqldump -u YOUR_USERNAME -p goskajss_volley_registration > backup_production_2026-01-09_BEFORE_PHASE2.sql
```

**Replace `YOUR_USERNAME` with actual database username**

When prompted, enter database password.

**Verify backup:**
```bash
ls -lh backup_production_2026-01-09_BEFORE_PHASE2.sql
# Should show file size > 50 KB
```

### ✅ Backup Complete - Proceed to Step 2

---

## STEP 2: RUN DATABASE MIGRATION

**Database:** `goskajss_volley_registration`
**Migration File:** See SQL below

### SQL Query to Execute:

**Copy and paste this ENTIRE script into phpMyAdmin SQL tab:**

```sql
-- =====================================================
-- PRODUCTION MIGRATION: Add last_activity column
-- Date: 2026-01-09
-- Database: goskajss_volley_registration
-- Purpose: Session timeout tracking (30 min inactivity)
-- =====================================================

-- STEP 1: Check current database
SELECT DATABASE() AS current_database;
-- Expected result: goskajss_volley_registration

-- STEP 2: Add last_activity column (SAFE - checks if exists)
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'last_activity'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN last_activity DATETIME NULL COMMENT ''Last activity for 30min timeout'' AFTER token_expiry',
    'SELECT ''INFO: Column last_activity already exists - skipping'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- STEP 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity);

-- STEP 4: Initialize active sessions ONLY
UPDATE users
SET last_activity = NOW()
WHERE auth_token IS NOT NULL
  AND token_expiry IS NOT NULL
  AND token_expiry > NOW()
  AND last_activity IS NULL;

-- STEP 5: Verification (display results)
SELECT
    'Migration completed successfully' AS status,
    COUNT(*) AS total_users,
    SUM(CASE WHEN last_activity IS NOT NULL THEN 1 ELSE 0 END) AS users_with_last_activity,
    SUM(CASE WHEN auth_token IS NOT NULL THEN 1 ELSE 0 END) AS users_with_active_tokens
FROM users;

-- =====================================================
-- EXPECTED RESULTS:
-- - status: "Migration completed successfully"
-- - total_users: [your number of users]
-- - users_with_last_activity: should equal users_with_active_tokens
-- =====================================================
```

### Execute Migration:

1. **Open phpMyAdmin**
2. **Select database:** `goskajss_volley_registration`
3. **Click SQL tab**
4. **Copy-paste the ENTIRE script above**
5. **Click Go / Execute**

### ✅ Expected Results:

You should see at the bottom:

| status | total_users | users_with_last_activity | users_with_active_tokens |
|--------|-------------|--------------------------|--------------------------|
| Migration completed successfully | XX | YY | YY |

**Important:** `users_with_last_activity` should equal `users_with_active_tokens`

### ⚠️ If You See Errors:

**Error:** "Column 'last_activity' already exists"
- **Action:** This is OK! It means migration already ran. Continue to Step 3.

**Error:** "Table 'users' doesn't exist"
- **Action:** STOP! Wrong database selected. Check you selected `goskajss_volley_registration`

**Error:** Any other error
- **Action:** Take screenshot and ask for help. Do NOT proceed.

### ✅ Migration Complete - Proceed to Step 3

---

## STEP 3: VERIFY DATABASE CHANGES

**Run this verification query:**

```sql
-- Verify column was added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'last_activity';
```

### ✅ Expected Result:

| COLUMN_NAME | DATA_TYPE | IS_NULLABLE | COLUMN_COMMENT |
|-------------|-----------|-------------|----------------|
| last_activity | datetime | YES | Last activity for 30min timeout |

**If you see this row - migration was successful!** ✅

### Verify Index:

```sql
-- Verify index was created
SHOW INDEX FROM users WHERE Key_name = 'idx_users_last_activity';
```

### ✅ Expected Result:

You should see one row showing the index exists.

**If you see the index - everything is correct!** ✅

### ✅ Verification Complete - Proceed to Step 4

---

## STEP 4: UPLOAD FILES TO FTP

**Source:** `C:\Projects\my-apps\app-volley-registration\deploy`
**Destination:** `volley.godeliauskas.com` (FTP root)

### Files to Upload (OVERWRITE ALL):

```
deploy/
├── index.html              → volley.godeliauskas.com/index.html
├── robots.txt              → volley.godeliauskas.com/robots.txt
├── .htaccess               → volley.godeliauskas.com/.htaccess
├── assets/                 → volley.godeliauskas.com/assets/
│   ├── index-*.css
│   └── index-*.js
└── api/                    → volley.godeliauskas.com/api/
    ├── auth.php            (IMPORTANT - has session timeout)
    ├── db.php              (IMPORTANT - has security headers)
    ├── login.php           (IMPORTANT - sets last_activity)
    ├── logout.php          (IMPORTANT - clears last_activity)
    ├── register.php        (IMPORTANT - enhanced validation)
    ├── user_update.php     (IMPORTANT - enhanced validation)
    └── ... (all other PHP files)
```

### Upload Methods:

**Method 1: FileZilla / WinSCP**
1. Connect to FTP
2. Navigate to root directory
3. Select ALL files from `deploy/` folder
4. Drag & drop to server
5. **Overwrite all** when prompted

**Method 2: Hosting File Manager**
1. Login to hosting control panel
2. File Manager
3. Upload all files from `deploy/` folder
4. Overwrite existing files

### ⚠️ CRITICAL FILES (Double-check these uploaded correctly):

- ✅ `api/auth.php` - Session timeout logic
- ✅ `api/db.php` - Security headers
- ✅ `api/login.php` - last_activity tracking
- ✅ `robots.txt` - SEO blocking
- ✅ `.htaccess` - User-agent blocking

### ✅ Files Uploaded - Proceed to Step 5

---

## STEP 5: VERIFY DEPLOYMENT

### Test 1: Site Loads ✅

**URL:** `https://volley.godeliauskas.com`

**Expected:** Login page loads normally

**If broken:** Check FTP upload completed successfully

---

### Test 2: Login Works ✅

1. **Login with your credentials**
2. **Verify you can access Dashboard**

**Expected:** Login successful, Dashboard shows data

**If fails:** Check `api/login.php` uploaded correctly

---

### Test 3: Security Headers ✅

1. **F12 → Network tab**
2. **Refresh page**
3. **Click any API request** (e.g., `events.php`, `user.php`)
4. **Headers → Response Headers**

**Expected to see:**
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'...
X-Robots-Tag: noindex, nofollow, noarchive, nosnippet
```

**If missing:** Check `api/db.php` uploaded correctly

---

### Test 4: robots.txt ✅

**URL:** `https://volley.godeliauskas.com/robots.txt`

**Expected to see:**
```
User-agent: *
Disallow: /
```

**If 404:** Check `robots.txt` uploaded to root directory

---

### Test 5: Database Connection ✅

1. **Navigate to Events page**
2. **Verify events display**

**Expected:** Events load from database

**If fails:** Check database credentials in `api/secrets.php`

---

### Test 6: Session Timeout (Optional - can test later)

**NOTE:** This test requires waiting 30+ minutes or manually updating database.

**Quick test via SQL:**
```sql
-- Simulate 31 minutes of inactivity
UPDATE users
SET last_activity = DATE_SUB(NOW(), INTERVAL 31 MINUTE)
WHERE email = 'YOUR_EMAIL';
```

**Then:**
1. Refresh page in browser
2. Should be logged out automatically

**Restore:**
```sql
UPDATE users
SET last_activity = NOW()
WHERE email = 'YOUR_EMAIL';
```

---

### ✅ All Tests Passed - Deployment Complete!

---

## STEP 6: POST-DEPLOYMENT MONITORING

### First Hour:

**Check every 15 minutes:**

1. **PHP Error Logs** (via hosting control panel)
   - Look for errors in: `/logs/error.log`
   - Expected: No new errors related to auth, db, or session

2. **Test Login/Logout**
   - Login → should work
   - Logout → should work
   - Login again → should work

3. **Check Security Headers** (F12 → Network)
   - Should see all headers present

---

### First 24 Hours:

**Check every 4-6 hours:**

1. **Error logs** - Any PHP warnings or errors?
2. **User activity** - Can users login and use the app?
3. **Session timeout** - After 30+ min idle, are users logged out?

---

### First Week:

**Check daily:**

1. **Error logs** - Review for any unusual patterns
2. **User feedback** - Any complaints about login issues?
3. **Google search** (after 2-3 days):
   ```
   site:volley.godeliauskas.com
   ```
   Expected: "No results found" (SEO blocking working)

---

## 🔄 ROLLBACK PROCEDURE (Emergency Only)

**⚠️ ONLY IF DEPLOYMENT CAUSES CRITICAL ISSUES**

### When to Rollback:

- Application completely broken
- Users cannot login at all
- Database errors on every request
- Critical functionality lost

### How to Rollback:

1. **Restore Database Backup:**
   ```sql
   -- Drop last_activity column
   ALTER TABLE users DROP COLUMN IF EXISTS last_activity;
   DROP INDEX IF EXISTS idx_users_last_activity ON users;
   ```

   OR restore full backup via phpMyAdmin:
   - Import → Choose `backup_production_2026-01-09_BEFORE_PHASE2.sql`

2. **Revert Files:**
   - Re-upload old files from previous production version
   - OR contact hosting support to restore from their backup

3. **Verify Rollback:**
   - Test login works
   - Test events page loads
   - Check error logs

---

## 📊 SUCCESS CRITERIA

Deployment is considered successful when:

- [x] Database migration completed without errors
- [x] All files uploaded successfully
- [x] Site loads and login works
- [x] Security headers present in API responses
- [x] robots.txt accessible and blocking crawlers
- [x] No PHP errors in error logs
- [x] Users can access all features (events, wallet, admin panel)
- [x] Session timeout logic in place (will activate after 30 min idle)

---

## 📞 SUPPORT

**If you encounter issues:**

1. **Take screenshot of error**
2. **Check PHP error logs** (hosting control panel)
3. **Note which step failed**
4. **Do NOT proceed further** if critical error
5. **Contact support** with details

**Common Issues:**

**Issue:** "Column already exists"
- **Solution:** Already migrated, safe to continue

**Issue:** "File upload failed"
- **Solution:** Check FTP credentials, try again

**Issue:** "500 Internal Server Error"
- **Solution:** Check PHP error logs, likely syntax error in uploaded PHP file

**Issue:** "Database connection failed"
- **Solution:** Check `api/secrets.php` has correct credentials

---

## 📁 FILES OVERVIEW

**What Changed in This Deployment:**

### Security Enhancements:
- Session timeout (30 min inactivity)
- Security headers (CSP, X-Frame-Options, etc.)
- Enhanced input validation (names, emails)
- SEO blocking (robots.txt, meta tags, headers)

### Files Modified:
- `api/db.php` - Security headers + X-Robots-Tag
- `api/auth.php` - Session timeout logic
- `api/login.php` - last_activity tracking
- `api/logout.php` - last_activity cleanup
- `api/register.php` - Enhanced validation
- `api/user_update.php` - Enhanced validation
- `index.html` - Meta tags (noindex)
- `robots.txt` - NEW file - SEO blocking
- `.htaccess` - User-agent blocking

### Database Changes:
- Added column: `users.last_activity` (DATETIME NULL)
- Added index: `idx_users_last_activity`

---

## ✅ DEPLOYMENT CHECKLIST

### Pre-Deployment:
- [ ] Backup database completed
- [ ] Backup verified (file size > 50 KB)
- [ ] Low-traffic time scheduled
- [ ] FTP credentials ready
- [ ] `/deploy` folder ready

### Deployment:
- [ ] **STEP 1:** Database backup completed ✅
- [ ] **STEP 2:** SQL migration executed ✅
- [ ] **STEP 3:** Database changes verified ✅
- [ ] **STEP 4:** Files uploaded to FTP ✅
- [ ] **STEP 5:** All verification tests passed ✅
- [ ] **STEP 6:** Monitoring started ✅

### Post-Deployment:
- [ ] No errors in logs (1 hour check)
- [ ] Login/logout working (tested)
- [ ] Events page working (tested)
- [ ] Security headers present (verified)
- [ ] robots.txt accessible (verified)
- [ ] No user complaints (24 hour check)

---

**Last Updated:** 2026-01-09
**Deployment Package:** `/deploy` folder
**Target:** volley.godeliauskas.com (Production)
**Status:** Ready for Deployment ✅
