-- =====================================================
-- SAFE MIGRATION: Add last_activity column
-- Date: 2026-01-09
-- Purpose: Session timeout tracking (30 min inactivity)
-- =====================================================
-- SAFETY FEATURES:
-- 1. Checks if column exists before adding
-- 2. No data loss - only adds new column
-- 3. Preserves all existing data
-- 4. Can be run multiple times safely
-- =====================================================

-- STEP 1: Add last_activity column (SAFE - checks if exists)
-- =====================================================
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

-- STEP 2: Create index for performance (SAFE - ignores if exists in newer MySQL/MariaDB)
-- =====================================================
-- Note: Older versions may give warning if index exists - this is safe to ignore
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity);

-- Alternative for older MySQL versions (if above fails):
-- SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
--     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_last_activity');
-- SET @sql = IF(@index_exists = 0,
--     'CREATE INDEX idx_users_last_activity ON users(last_activity)',
--     'SELECT ''INFO: Index already exists - skipping'' AS message');
-- PREPARE stmt FROM @sql;
-- EXECUTE stmt;
-- DEALLOCATE PREPARE stmt;

-- STEP 3: Initialize last_activity for active sessions ONLY
-- =====================================================
-- SAFETY: Only updates users with active tokens (WHERE clause prevents touching inactive users)
UPDATE users
SET last_activity = NOW()
WHERE auth_token IS NOT NULL
  AND token_expiry IS NOT NULL
  AND token_expiry > NOW()
  AND last_activity IS NULL;  -- Only update if not already set

-- STEP 4: Verification (display results)
-- =====================================================
SELECT
    'Migration completed successfully' AS status,
    COUNT(*) AS total_users,
    SUM(CASE WHEN last_activity IS NOT NULL THEN 1 ELSE 0 END) AS users_with_last_activity,
    SUM(CASE WHEN auth_token IS NOT NULL THEN 1 ELSE 0 END) AS users_with_active_tokens
FROM users;

-- =====================================================
-- VERIFICATION QUERIES (run these to check results)
-- =====================================================
-- Check column was added:
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'last_activity';

-- Check index was created:
-- SHOW INDEX FROM users WHERE Key_name = 'idx_users_last_activity';

-- Check active users have last_activity set:
-- SELECT id, name, email, auth_token IS NOT NULL AS has_token, last_activity
-- FROM users WHERE auth_token IS NOT NULL LIMIT 10;

-- =====================================================
-- ROLLBACK (if needed - RUN ONLY IF YOU NEED TO UNDO)
-- =====================================================
-- WARNING: This will remove the column and all data in it
-- ONLY run this if you need to completely undo the migration

-- -- Remove index
-- DROP INDEX IF EXISTS idx_users_last_activity ON users;
--
-- -- Remove column
-- ALTER TABLE users DROP COLUMN IF EXISTS last_activity;
--
-- SELECT 'Rollback completed - last_activity column removed' AS status;
