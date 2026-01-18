-- Migration: Add Google OAuth support
-- Date: 2026-01-18
-- Description: Adds Google OAuth columns to users table and creates temp tokens table
-- Author: Volleyball Registration System

-- =====================================================
-- Step 1: Add OAuth columns to users table
-- =====================================================

ALTER TABLE `users`
ADD COLUMN `oauth_provider` ENUM('email', 'google') NULL DEFAULT 'email'
  COMMENT 'Authentication provider: email (traditional) or google (OAuth)',
ADD COLUMN `oauth_google_id` VARCHAR(255) NULL
  COMMENT 'Google user ID (sub claim from Google ID token)',
ADD COLUMN `password_required` TINYINT(1) NOT NULL DEFAULT 1
  COMMENT 'Whether password is required (0 for OAuth-only users temporarily)';

-- Add indexes for OAuth lookups
ALTER TABLE `users`
ADD INDEX `idx_oauth_google_id` (`oauth_google_id`),
ADD INDEX `idx_oauth_provider` (`oauth_provider`);

-- =====================================================
-- Step 2: Modify password_hash to allow NULL
-- (for OAuth users who haven't set password yet)
-- =====================================================

ALTER TABLE `users`
MODIFY COLUMN `password_hash` VARCHAR(255) NULL DEFAULT NULL;

-- =====================================================
-- Step 3: Create oauth_temp_tokens table
-- Used for temporary authentication during password setup
-- =====================================================

CREATE TABLE IF NOT EXISTS `oauth_temp_tokens` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(64) NOT NULL COMMENT 'Temporary token for password setup flow',
    `user_id` INT UNSIGNED NOT NULL COMMENT 'User who needs to set password',
    `expires_at` DATETIME NOT NULL COMMENT 'Token expiration (10 minutes from creation)',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_token` (`token`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_expires_at` (`expires_at`),

    CONSTRAINT `fk_oauth_temp_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Step 4: Update existing users
-- Set oauth_provider = 'email' for existing users
-- =====================================================

UPDATE `users` SET `oauth_provider` = 'email' WHERE `oauth_provider` IS NULL;


-- =====================================================
-- ROLLBACK SCRIPT (save separately if needed)
-- =====================================================
--
-- ALTER TABLE `users`
-- DROP COLUMN `oauth_provider`,
-- DROP COLUMN `oauth_google_id`,
-- DROP COLUMN `password_required`,
-- DROP INDEX `idx_oauth_google_id`,
-- DROP INDEX `idx_oauth_provider`;
--
-- ALTER TABLE `users`
-- MODIFY COLUMN `password_hash` VARCHAR(255) NOT NULL;
--
-- DROP TABLE IF EXISTS `oauth_temp_tokens`;
