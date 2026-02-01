-- Migration: Add negative balance limits for users and events
-- Date: 2026-02-01
-- Description: Adds configurable negative balance limits to control registration eligibility
--              Users cannot register for events if their balance is below the limit
--              Both user-level and event-level limits can be configured

-- ============================================
-- Add negative_balance_limit to users table
-- ============================================

ALTER TABLE users
ADD COLUMN negative_balance_limit DECIMAL(10,2) NOT NULL DEFAULT -12.00
COMMENT 'Maximum negative balance allowed for this user (negative value)';

-- Create index for efficient queries when checking balance eligibility
CREATE INDEX idx_users_negative_limit ON users(negative_balance_limit);

-- ============================================
-- Add negative_balance_limit to events table
-- ============================================

ALTER TABLE events
ADD COLUMN negative_balance_limit DECIMAL(10,2) NOT NULL DEFAULT -12.00
COMMENT 'Maximum negative balance allowed to register for this event (negative value)';

-- Create index for efficient queries when filtering events by balance requirements
CREATE INDEX idx_events_negative_limit ON events(negative_balance_limit);

-- ============================================
-- Verification Queries
-- ============================================

-- Verify columns were added successfully
SHOW COLUMNS FROM users LIKE 'negative_balance_limit';
SHOW COLUMNS FROM events LIKE 'negative_balance_limit';

-- Verify indexes were created
SHOW INDEX FROM users WHERE Key_name = 'idx_users_negative_limit';
SHOW INDEX FROM events WHERE Key_name = 'idx_events_negative_limit';

-- Show sample data (all users should have -12.00 default)
SELECT
    id,
    name,
    surname,
    balance,
    negative_balance_limit,
    CASE
        WHEN balance >= negative_balance_limit THEN 'Eligible'
        ELSE 'Not Eligible'
    END as registration_status
FROM users
LIMIT 5;

-- Show sample events with limit
SELECT
    id,
    title,
    date_time,
    negative_balance_limit
FROM events
ORDER BY date_time DESC
LIMIT 5;

-- Count users who would be blocked with default -12.00 limit
SELECT
    COUNT(*) as users_below_limit,
    MIN(balance) as lowest_balance
FROM users
WHERE balance < -12.00 AND is_active = 1;

-- ============================================
-- Usage Examples
-- ============================================

-- Example 1: Set stricter limit for a specific user (no negative balance allowed)
-- UPDATE users SET negative_balance_limit = 0.00 WHERE id = 123;

-- Example 2: Set more lenient limit for a VIP user
-- UPDATE users SET negative_balance_limit = -50.00 WHERE id = 456;

-- Example 3: Set stricter limit for expensive events
-- UPDATE events SET negative_balance_limit = -5.00 WHERE price_per_person > 20.00;

-- Example 4: Check eligibility before registration
-- SELECT
--     u.id,
--     u.name,
--     u.balance,
--     u.negative_balance_limit as user_limit,
--     e.negative_balance_limit as event_limit,
--     LEAST(u.negative_balance_limit, e.negative_balance_limit) as effective_limit,
--     CASE
--         WHEN u.balance >= LEAST(u.negative_balance_limit, e.negative_balance_limit)
--         THEN 'Can Register'
--         ELSE 'Blocked - Insufficient Balance'
--     END as status
-- FROM users u
-- CROSS JOIN events e
-- WHERE u.id = ? AND e.id = ?;
