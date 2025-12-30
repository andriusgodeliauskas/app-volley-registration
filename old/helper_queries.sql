-- VolleyApp - Helpful SQL Queries
-- Common database operations for managing the volleyball registration system

-- ============================================
-- ADDING EVENTS
-- ============================================

-- Add a single event (replace date with next Saturday)
INSERT INTO events (event_date, is_active) 
VALUES ('2025-01-04', TRUE);

-- Add multiple future Saturdays at once
INSERT INTO events (event_date, is_active) VALUES
('2025-01-04', TRUE),
('2025-01-11', TRUE),
('2025-01-18', TRUE),
('2025-01-25', TRUE),
('2025-02-01', TRUE);

-- ============================================
-- VIEWING DATA
-- ============================================

-- View all events
SELECT * FROM events ORDER BY event_date DESC;

-- View all active future events
SELECT * FROM events 
WHERE is_active = TRUE AND event_date >= CURDATE() 
ORDER BY event_date ASC;

-- View all users
SELECT id, full_name, email, is_admin, created_at 
FROM users 
ORDER BY created_at DESC;

-- View registrations for a specific event (replace event_id)
SELECT 
    e.event_date,
    u.full_name,
    u.email,
    r.registered_at
FROM registrations r
INNER JOIN users u ON r.user_id = u.id
INNER JOIN events e ON r.event_id = e.id
WHERE e.id = 1
ORDER BY r.registered_at ASC;

-- View all registrations with event dates
SELECT 
    e.event_date,
    u.full_name,
    u.email,
    r.registered_at
FROM registrations r
INNER JOIN users u ON r.user_id = u.id
INNER JOIN events e ON r.event_id = e.id
ORDER BY e.event_date DESC, r.registered_at ASC;

-- Count registrations per event
SELECT 
    e.event_date,
    COUNT(r.id) as player_count,
    e.is_active
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
GROUP BY e.id
ORDER BY e.event_date DESC;

-- ============================================
-- USER MANAGEMENT
-- ============================================

-- Make a user an admin (replace email)
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'your-admin-email@gmail.com';

-- Remove admin rights
UPDATE users 
SET is_admin = FALSE 
WHERE email = 'user-email@gmail.com';

-- View all admins
SELECT id, full_name, email, created_at 
FROM users 
WHERE is_admin = TRUE;

-- Delete a user (this will also delete their registrations due to CASCADE)
DELETE FROM users WHERE email = 'user-to-delete@gmail.com';

-- ============================================
-- EVENT MANAGEMENT
-- ============================================

-- Deactivate an event (hide it from the app)
UPDATE events 
SET is_active = FALSE 
WHERE event_date = '2025-01-04';

-- Reactivate an event
UPDATE events 
SET is_active = TRUE 
WHERE event_date = '2025-01-04';

-- Delete an event (this will also delete all registrations for it)
DELETE FROM events WHERE event_date = '2025-01-04';

-- Set maximum players for an event (for future use)
UPDATE events 
SET max_players = 12 
WHERE event_date = '2025-01-04';

-- ============================================
-- REGISTRATION MANAGEMENT
-- ============================================

-- Manually register a user to an event
INSERT INTO registrations (event_id, user_id) 
VALUES (1, 1);

-- Manually unregister a user from an event
DELETE FROM registrations 
WHERE event_id = 1 AND user_id = 1;

-- View a specific user's registrations
SELECT 
    u.full_name,
    e.event_date,
    r.registered_at
FROM registrations r
INNER JOIN users u ON r.user_id = u.id
INNER JOIN events e ON r.event_id = e.id
WHERE u.email = 'user@gmail.com'
ORDER BY e.event_date DESC;

-- ============================================
-- STATISTICS
-- ============================================

-- Total number of users
SELECT COUNT(*) as total_users FROM users;

-- Total number of events
SELECT COUNT(*) as total_events FROM events;

-- Total number of registrations
SELECT COUNT(*) as total_registrations FROM registrations;

-- Most active users (by registration count)
SELECT 
    u.full_name,
    u.email,
    COUNT(r.id) as registration_count
FROM users u
LEFT JOIN registrations r ON u.id = r.user_id
GROUP BY u.id
ORDER BY registration_count DESC
LIMIT 10;

-- Average players per event
SELECT AVG(player_count) as avg_players
FROM (
    SELECT COUNT(r.id) as player_count
    FROM events e
    LEFT JOIN registrations r ON e.id = r.event_id
    GROUP BY e.id
) as counts;

-- Events with most registrations
SELECT 
    e.event_date,
    COUNT(r.id) as player_count
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
GROUP BY e.id
ORDER BY player_count DESC
LIMIT 10;

-- ============================================
-- MAINTENANCE
-- ============================================

-- Clean up old events (older than 3 months)
-- WARNING: This will delete events and their registrations!
DELETE FROM events 
WHERE event_date < DATE_SUB(CURDATE(), INTERVAL 3 MONTH);

-- Archive old events instead of deleting (deactivate them)
UPDATE events 
SET is_active = FALSE 
WHERE event_date < DATE_SUB(CURDATE(), INTERVAL 1 MONTH);

-- Find duplicate registrations (should not exist due to unique constraint)
SELECT event_id, user_id, COUNT(*) as count
FROM registrations
GROUP BY event_id, user_id
HAVING count > 1;

-- ============================================
-- BACKUP
-- ============================================

-- Export all data (run from command line)
-- mysqldump -u your_username -p volley_db > backup_$(date +%Y%m%d).sql

-- Restore from backup (run from command line)
-- mysql -u your_username -p volley_db < backup_20250104.sql

-- ============================================
-- TESTING
-- ============================================

-- Create a test user (for development only)
INSERT INTO users (google_id, full_name, email) 
VALUES ('test_google_id_123', 'Test User', 'test@example.com');

-- Create a test event
INSERT INTO events (event_date, is_active) 
VALUES (DATE_ADD(CURDATE(), INTERVAL 7 DAY), TRUE);

-- Clear all registrations (for testing)
-- WARNING: This deletes all registrations!
-- TRUNCATE TABLE registrations;

-- Reset auto-increment counters (after clearing tables)
-- ALTER TABLE users AUTO_INCREMENT = 1;
-- ALTER TABLE events AUTO_INCREMENT = 1;
-- ALTER TABLE registrations AUTO_INCREMENT = 1;
