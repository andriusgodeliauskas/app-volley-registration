-- Migration: Add password reset functionality
-- Date: 2026-01-19
-- Description: Add password_reset_tokens table and update rate_limits for forgot password feature

-- =====================================================
-- Create password_reset_tokens table
-- =====================================================
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,
    `token` VARCHAR(64) NOT NULL COMMENT 'Secure random token',
    `expires_at` DATETIME NOT NULL COMMENT 'Token valid for 1 hour',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `used_at` DATETIME NULL DEFAULT NULL COMMENT 'When token was used (NULL if unused)',

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_password_reset_token` (`token`),
    KEY `idx_password_reset_user_id` (`user_id`),
    KEY `idx_password_reset_expires_at` (`expires_at`),
    KEY `idx_password_reset_cleanup` (`expires_at`, `used_at`),

    CONSTRAINT `fk_password_reset_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Password reset tokens with 1 hour expiry';

-- =====================================================
-- Update rate_limits table to support new attempt types
-- =====================================================
-- Change attempt_type from ENUM to VARCHAR to support 'forgot_password', 'reset_password', 'google_auth'
ALTER TABLE `rate_limits`
    MODIFY COLUMN `attempt_type` VARCHAR(50) NOT NULL COMMENT 'Type of operation being rate limited';

-- =====================================================
-- Add indexes for performance (if not exists)
-- =====================================================
-- These may already exist, but we add them to ensure optimal performance
CREATE INDEX IF NOT EXISTS `idx_users_email` ON `users` (`email`);
CREATE INDEX IF NOT EXISTS `idx_user_groups_user_id` ON `user_groups` (`user_id`);
