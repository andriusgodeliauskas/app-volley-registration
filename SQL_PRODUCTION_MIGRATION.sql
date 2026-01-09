-- =====================================================
-- PRODUCTION MIGRATION: Security Phase 2
-- Date: 2026-01-09
-- Database: goskajss_volley_registration
-- Purpose: Add last_activity column for 30-minute session timeout
-- =====================================================
-- INSTRUCTIONS:
-- 1. Backup database FIRST (mandatory!)
-- 2. Copy this ENTIRE file
-- 3. Paste into phpMyAdmin SQL tab
-- 4. Click "Go" / "Execute"
-- =====================================================

-- STEP 1: Verify you're on the correct database
SELECT DATABASE() AS current_database;
-- Expected: goskajss_volley_registration
-- If different, STOP and select correct database!

-- STEP 2: Add last_activity column (SAFE - checks if exists first)
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'last_activity'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN last_activity DATETIME NULL COMMENT ''Last activity timestamp for 30min session timeout'' AFTER token_expiry',
    'SELECT ''INFO: Column last_activity already exists - skipping'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- STEP 3: Create index for performance (improves session timeout queries)
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity);

-- STEP 4: Initialize last_activity for currently active sessions
UPDATE users
SET last_activity = NOW()
WHERE auth_token IS NOT NULL
  AND token_expiry IS NOT NULL
  AND token_expiry > NOW()
  AND last_activity IS NULL;

-- STEP 5: Verification - Display migration results
SELECT
    'Migration completed successfully' AS status,
    COUNT(*) AS total_users,
    SUM(CASE WHEN last_activity IS NOT NULL THEN 1 ELSE 0 END) AS users_with_last_activity,
    SUM(CASE WHEN auth_token IS NOT NULL THEN 1 ELSE 0 END) AS users_with_active_tokens
FROM users;

-- =====================================================
-- VERIFICATION QUERIES (Run these to confirm success)
-- =====================================================

-- Verify column structure
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'last_activity';
-- Expected: One row showing last_activity, datetime, YES

-- Verify index exists
SHOW INDEX FROM users WHERE Key_name = 'idx_users_last_activity';
-- Expected: One row showing the index

-- Check sample data
SELECT id, name, email, last_activity, auth_token IS NOT NULL AS has_token
FROM users
WHERE auth_token IS NOT NULL
LIMIT 5;
-- Expected: Users with active tokens should have last_activity populated

-- =====================================================
-- ROLLBACK (ONLY IF NEEDED - Emergency use only!)
-- =====================================================
-- WARNING: This will delete all last_activity data
-- Only run if deployment failed and you need to undo changes

-- DROP INDEX IF EXISTS idx_users_last_activity ON users;
-- ALTER TABLE users DROP COLUMN IF EXISTS last_activity;
-- SELECT 'Rollback completed - last_activity removed' AS status;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
