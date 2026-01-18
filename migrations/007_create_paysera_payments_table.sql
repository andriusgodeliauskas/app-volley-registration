-- Migration 007: Create Paysera Payments Table
-- Purpose: Track automatic wallet top-up payments via Paysera gateway
-- Date: 2026-01-18

CREATE TABLE IF NOT EXISTS paysera_payments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    order_id VARCHAR(255) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    status ENUM('pending', 'completed', 'cancelled', 'failed') NOT NULL DEFAULT 'pending',
    paysera_request_id VARCHAR(255) NULL,
    paysera_response TEXT NULL,
    transaction_id INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_order_id (order_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
