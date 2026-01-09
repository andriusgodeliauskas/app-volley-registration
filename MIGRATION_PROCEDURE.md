# Safe Database Migration Procedure

## Migration: Add last_activity column
**File:** `migration_add_last_activity_SAFE.sql`
**Date:** 2026-01-09
**Risk Level:** **LOW** (only adds new column, no data modification except NULL -> NOW() for active sessions)

---

## Pre-Migration Checklist

### 1. **BACKUP DATABASE (MANDATORY)**

**Staging:**
```sql
-- Export entire database
mysqldump -u [username] -p goskajss_staging_volley_registration > backup_staging_2026-01-09_pre_migration.sql
```

**Production (when ready):**
```sql
-- Export entire database
mysqldump -u [username] -p goskajss_volley_registration > backup_production_2026-01-09_pre_migration.sql
```

**Verify backup:**
- Check file size is not 0
- Open file and verify it contains CREATE TABLE statements
- Store backup in safe location

### 2. **Verify Current Schema**

Run this query to see current `users` table structure:
```sql
DESCRIBE users;
```

Expected columns (before migration):
- id, name, surname, email, password_hash, role, balance, is_active, parent_id, avatar, auth_token, token_expiry, created_at, updated_at

**If `last_activity` already exists, STOP - migration not needed!**

### 3. **Check Active Users**

```sql
SELECT COUNT(*) AS active_sessions
FROM users
WHERE auth_token IS NOT NULL AND token_expiry > NOW();
```

Note this number - all these users should have `last_activity` set after migration.

---

## Migration Execution

### STAGING FIRST (Always test on staging before production!)

1. **Connect to staging database:**
   - Use phpMyAdmin or MySQL client
   - Database: `goskajss_staging_volley_registration`

2. **Copy and paste the ENTIRE content of `migration_add_last_activity_SAFE.sql`**

3. **Click "Execute" or "Run"**

4. **Check for errors:**
   - ✅ "Migration completed successfully" message appears
   - ✅ No red error messages
   - ⚠️ Warnings are OK (e.g., "index already exists")

5. **Verify results:**
   ```sql
   -- Check column exists
   DESCRIBE users;

   -- Check active users have last_activity
   SELECT id, name, auth_token IS NOT NULL AS has_token, last_activity
   FROM users
   WHERE auth_token IS NOT NULL
   LIMIT 10;
   ```

6. **Test the application:**
   - Login to staging site
   - Browse around (trigger authenticated requests)
   - Check database - your `last_activity` should update
   - Wait 31+ minutes idle, try to access - should logout automatically

---

## Post-Migration Verification

### Staging Verification Checklist:

- [ ] Column `last_activity` exists in `users` table
- [ ] Index `idx_users_last_activity` exists
- [ ] Active sessions have `last_activity` set to NOW()
- [ ] Can login successfully
- [ ] `last_activity` updates on each request
- [ ] Session expires after 30 minutes of inactivity
- [ ] No errors in PHP error logs
- [ ] No JavaScript console errors
- [ ] All existing functionality works (events, wallet, admin panel)

### SQL Queries for Verification:

```sql
-- 1. Check column structure
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'last_activity';

-- Expected result:
-- COLUMN_NAME: last_activity
-- DATA_TYPE: datetime
-- IS_NULLABLE: YES
-- COLUMN_COMMENT: Last activity timestamp for 30min session timeout

-- 2. Check index
SHOW INDEX FROM users WHERE Key_name = 'idx_users_last_activity';

-- Expected result: One row showing the index exists

-- 3. Check data
SELECT
    COUNT(*) AS total_users,
    SUM(CASE WHEN last_activity IS NOT NULL THEN 1 ELSE 0 END) AS with_last_activity,
    SUM(CASE WHEN auth_token IS NOT NULL THEN 1 ELSE 0 END) AS with_active_token
FROM users;

-- Expected: with_last_activity should equal with_active_token
```

---

## Production Migration (Only after staging success)

### When to run:
- ✅ Staging migration successful
- ✅ Staging tested for at least 24 hours
- ✅ No errors reported
- ✅ Session timeout working correctly
- ✅ Backup completed

### Timing:
- **Recommended:** Low traffic hours (e.g., 2-4 AM local time)
- **Duration:** Less than 1 second (just adds column + index)
- **Downtime:** None (migration is non-blocking)

### Steps:
1. **BACKUP PRODUCTION DATABASE** (see step 1 above)
2. **Verify backup is complete**
3. **Connect to production database:** `goskajss_volley_registration`
4. **Run `migration_add_last_activity_SAFE.sql`**
5. **Verify results** (same as staging)
6. **Monitor for 1 hour:**
   - Check PHP error logs
   - Check user login activity
   - Check database queries
7. **Monitor for 24 hours:**
   - User complaints?
   - Error logs?
   - Session timeouts working?

---

## Rollback Procedure (Emergency Only)

**⚠️ WARNING: Only run if migration causes critical issues**

### When to rollback:
- Application completely broken
- Cannot login at all
- Database errors on every request

### How to rollback:

```sql
-- 1. Remove index
DROP INDEX IF EXISTS idx_users_last_activity ON users;

-- 2. Remove column (THIS DELETES ALL last_activity DATA)
ALTER TABLE users DROP COLUMN IF EXISTS last_activity;

-- 3. Verify
SELECT 'Rollback completed' AS status;
DESCRIBE users;  -- Should NOT show last_activity
```

### After rollback:
1. **Redeploy previous code version** (without session timeout feature)
2. **Investigate issue**
3. **Fix code**
4. **Re-test on staging**
5. **Try migration again**

---

## What Could Go Wrong? (Risk Assessment)

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Column already exists | Low | None | Migration checks and skips |
| Index creation fails | Very Low | Minor | App still works, just slower queries |
| Syntax error | Very Low | None | Safe migration script tested |
| App breaks after migration | Very Low | High | Code handles NULL last_activity gracefully |
| Data loss | **ZERO** | N/A | Only ADDS column, never deletes data |
| Downtime | **ZERO** | N/A | ALTER TABLE is non-blocking for this operation |

---

## Success Criteria

Migration is considered successful when:

1. ✅ Column `last_activity` exists
2. ✅ Index created
3. ✅ Active sessions have `last_activity` populated
4. ✅ Users can login
5. ✅ `last_activity` updates on each request
6. ✅ Sessions expire after 30 min inactivity
7. ✅ No PHP errors
8. ✅ No user complaints
9. ✅ All existing features work

---

## Contact & Support

If issues arise:
1. Check PHP error logs: `/path/to/error.log`
2. Check database query logs
3. Review `api/auth.php` lines 69-94 (session timeout logic)
4. Consider rollback if critical
5. Contact: andrius.godeliauskas@...

---

## Post-Migration Monitoring

### First Hour:
- [ ] Check error logs every 15 minutes
- [ ] Test login/logout manually
- [ ] Verify `last_activity` updates in database

### First 24 Hours:
- [ ] Check error logs every 4 hours
- [ ] Monitor user activity
- [ ] Check for support requests

### First Week:
- [ ] Daily error log review
- [ ] Monitor session timeout behavior
- [ ] Gather user feedback

---

**Last Updated:** 2026-01-09
**Approved By:** [Your Name]
**Migration Status:** Ready for Staging
