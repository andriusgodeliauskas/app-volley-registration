-- Migration: Create rate_limits table for brute force protection
-- Date: 2026-01-08
-- Description: Add rate limiting functionality to prevent brute force attacks on login and registration

CREATE TABLE IF NOT EXISTS rate_limits (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL COMMENT 'Email address or IP for tracking attempts',
    attempt_type ENUM('login', 'registration') NOT NULL COMMENT 'Type of operation being rate limited',
    attempts INT UNSIGNED DEFAULT 1 COMMENT 'Number of failed attempts',
    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Timestamp of last attempt',
    blocked_until TIMESTAMP NULL COMMENT 'When the block expires (NULL if not blocked)',
    UNIQUE KEY uk_identifier_type (identifier, attempt_type),
    INDEX idx_blocked_until (blocked_until),
    INDEX idx_last_attempt (last_attempt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
