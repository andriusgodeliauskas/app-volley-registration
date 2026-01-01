-- =====================================================
-- Add Donations Table to Existing Database
-- Run this SQL to add the donations feature to your database
-- =====================================================

-- Create donations table
CREATE TABLE IF NOT EXISTS `donations` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL COMMENT 'User who made the donation',
    `amount` DECIMAL(10, 2) NOT NULL COMMENT 'Donation amount',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_donations_user_id` (`user_id`),
    KEY `idx_donations_created_at` (`created_at`),

    CONSTRAINT `fk_donations_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
