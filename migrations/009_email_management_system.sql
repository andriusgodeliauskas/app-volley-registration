-- Migration: Email Management System
-- Created: 2026-01-19
-- Description: Add email logging and negative balance notification tracking
-- FIXED: Removed foreign key constraints for compatibility

-- ============================================
-- Table: email_logs
-- Purpose: Track all sent emails for admin review
-- ============================================

CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email_type VARCHAR(50) NOT NULL COMMENT 'password_reset, account_activation, negative_balance',
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_preview TEXT COMMENT 'First 200 chars of email body',
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('sent', 'failed') DEFAULT 'sent',
    error_message TEXT NULL,
    sent_by_admin_id INT NULL COMMENT 'If manually sent by admin',
    
    INDEX idx_user_id (user_id),
    INDEX idx_email_type (email_type),
    INDEX idx_sent_at (sent_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Email sending history for admin monitoring';

-- ============================================
-- Table: negative_balance_notifications
-- Purpose: Track negative balance email notifications to prevent spam
-- ============================================

CREATE TABLE IF NOT EXISTS negative_balance_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    balance_amount DECIMAL(10,2) NOT NULL,
    notification_sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_sent_at (notification_sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Track negative balance notifications to prevent duplicate emails';

-- ============================================
-- Verification Queries
-- ============================================

-- Verify tables created
SHOW TABLES LIKE 'email_logs';
SHOW TABLES LIKE 'negative_balance_notifications';

-- Check table structure
DESCRIBE email_logs;
DESCRIBE negative_balance_notifications;

-- Show sample data (should be empty initially)
SELECT COUNT(*) as email_logs_count FROM email_logs;
SELECT COUNT(*) as notifications_count FROM negative_balance_notifications;
