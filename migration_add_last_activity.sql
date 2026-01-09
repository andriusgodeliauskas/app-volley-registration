-- =====================================================
-- Migration: Add last_activity column for session timeout tracking
-- Date: 2026-01-09
-- Purpose: Implement 30-minute inactivity timeout for enhanced security
-- =====================================================
-- NOTE: This version uses IF NOT EXISTS which may not work on older MySQL/MariaDB
-- If you get syntax errors, use migration_add_last_activity_SAFE.sql instead!
-- =====================================================

-- Add last_activity column to track user session activity
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_activity DATETIME NULL AFTER token_expiry;

-- Create index for performance (checking expired sessions)
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity);

-- Update existing active sessions to current time
UPDATE users
SET last_activity = NOW()
WHERE auth_token IS NOT NULL AND token_expiry > NOW();

-- Add comment to document the column purpose (optional, may fail on some MySQL versions)
ALTER TABLE users
MODIFY COLUMN last_activity DATETIME NULL
COMMENT 'Last activity timestamp for session timeout (30 min inactivity = logout)';
