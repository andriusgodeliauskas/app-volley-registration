-- =====================================================
-- Volley Registration App - MySQL Database Schema
-- Version: 1.1 (Detailed User Fields)
-- Created: 2025-12-30
-- Updated: 2026-01-01
-- =====================================================

-- Drop tables if they exist (for clean re-runs)
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `registrations`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `groups`;
DROP TABLE IF EXISTS `users`;

-- =====================================================
-- USERS TABLE
-- Stores all users: super admins, group admins, regular users, and children
-- =====================================================
CREATE TABLE `users` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL COMMENT 'First Name',
    `surname` VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'Last Name',
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('super_admin', 'group_admin', 'user') NOT NULL DEFAULT 'user',
    `balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `avatar` VARCHAR(100) NULL DEFAULT 'Midnight',
    `parent_id` INT UNSIGNED NULL DEFAULT NULL COMMENT 'For child/sub-accounts, references parent user',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `auth_token` VARCHAR(64) NULL DEFAULT NULL COMMENT 'Session auth token',
    `token_expiry` DATETIME NULL DEFAULT NULL COMMENT 'Token expiration timestamp',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_email` (`email`),
    KEY `idx_users_auth_token` (`auth_token`),
    KEY `idx_users_parent_id` (`parent_id`),
    KEY `idx_users_role` (`role`),
    KEY `idx_users_is_active` (`is_active`),
    
    CONSTRAINT `fk_users_parent` 
        FOREIGN KEY (`parent_id`) 
        REFERENCES `users` (`id`) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- GROUPS TABLE
-- Volleyball groups/clubs managed by group admins
-- =====================================================
CREATE TABLE `groups` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `owner_id` INT UNSIGNED NOT NULL COMMENT 'Group admin who owns this group',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_groups_owner_id` (`owner_id`),
    KEY `idx_groups_is_active` (`is_active`),
    
    CONSTRAINT `fk_groups_owner` 
        FOREIGN KEY (`owner_id`) 
        REFERENCES `users` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- EVENTS TABLE
-- Volleyball events/games within a group
-- =====================================================
CREATE TABLE `events` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `group_id` INT UNSIGNED NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `date_time` DATETIME NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `max_players` INT UNSIGNED NOT NULL DEFAULT 12,
    `court_count` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `price_per_person` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('draft', 'open', 'closed', 'canceled') NOT NULL DEFAULT 'open',
    `icon` VARCHAR(50) NOT NULL DEFAULT 'volleyball',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_events_group_id` (`group_id`),
    KEY `idx_events_date_time` (`date_time`),
    KEY `idx_events_status` (`status`),
    
    CONSTRAINT `fk_events_group` 
        FOREIGN KEY (`group_id`) 
        REFERENCES `groups` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- REGISTRATIONS TABLE
-- Links users to events they registered for
-- =====================================================
CREATE TABLE `registrations` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL COMMENT 'The user being registered (can be child)',
    `event_id` INT UNSIGNED NOT NULL,
    `registered_by` INT UNSIGNED NOT NULL COMMENT 'Who performed the registration (parent for children)',
    `status` ENUM('registered', 'canceled', 'waitlist') NOT NULL DEFAULT 'registered',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_registrations_user_event` (`user_id`, `event_id`),
    KEY `idx_registrations_event_id` (`event_id`),
    KEY `idx_registrations_registered_by` (`registered_by`),
    KEY `idx_registrations_status` (`status`),
    
    CONSTRAINT `fk_registrations_user` 
        FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT `fk_registrations_event` 
        FOREIGN KEY (`event_id`) 
        REFERENCES `events` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT `fk_registrations_registered_by` 
        FOREIGN KEY (`registered_by`) 
        REFERENCES `users` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TRANSACTIONS TABLE
-- Wallet transaction history (top-ups and payments)
-- =====================================================
CREATE TABLE `transactions` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL COMMENT 'Positive = top-up, Negative = payment/deduction',
    `type` ENUM('topup', 'payment', 'refund', 'adjustment') NOT NULL,
    `description` VARCHAR(500) NULL,
    `reference_id` INT UNSIGNED NULL COMMENT 'Optional: related registration or event ID',
    `created_by` INT UNSIGNED NULL COMMENT 'Admin who processed the transaction (for top-ups)',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_transactions_user_id` (`user_id`),
    KEY `idx_transactions_type` (`type`),
    KEY `idx_transactions_created_at` (`created_at`),
    KEY `idx_transactions_created_by` (`created_by`),
    
    CONSTRAINT `fk_transactions_user` 
        FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT `fk_transactions_created_by` 
        FOREIGN KEY (`created_by`) 
        REFERENCES `users` (`id`) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SEED DATA: Create default Super Admin
-- Password: 'admin123' (change immediately in production!)
-- Hash generated with: password_hash('admin123', PASSWORD_BCRYPT)
-- =====================================================
INSERT INTO `users` (`name`, `surname`, `email`, `password_hash`, `role`, `balance`, `is_active`) 
VALUES (
    'Super',
    'Admin',
    'admin@volleyapp.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'super_admin',
    0.00,
    1
);

-- =====================================================
-- END OF SCHEMA
-- =====================================================
