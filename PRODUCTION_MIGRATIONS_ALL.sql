-- ============================================================
-- PRODUCTION SQL MIGRACIJOS - PALEISTI IŠ EILĖS
-- Data: 2026-01-18
-- ============================================================

-- ============================================================
-- 1. RATE LIMITING LENTELĖ
-- ============================================================

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

-- ============================================================
-- 2. REMEMBER ME FUNKCIONALUMAS
-- ============================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS remember_me_token VARCHAR(64) NULL,
ADD COLUMN IF NOT EXISTS remember_me_expiry DATETIME NULL;

CREATE INDEX IF NOT EXISTS idx_remember_me_token ON users(remember_me_token);

-- ============================================================
-- 3. GOOGLE OAUTH INTEGRACIJA
-- ============================================================

-- 3.1 Pridėti OAuth stulpelius į users lentelę
ALTER TABLE `users`
ADD COLUMN `oauth_provider` ENUM('email', 'google') NULL DEFAULT 'email'
  COMMENT 'Authentication provider: email (traditional) or google (OAuth)',
ADD COLUMN `oauth_google_id` VARCHAR(255) NULL
  COMMENT 'Google user ID (sub claim from Google ID token)',
ADD COLUMN `password_required` TINYINT(1) NOT NULL DEFAULT 1
  COMMENT 'Whether password is required (0 for OAuth-only users temporarily)';

-- 3.2 Pridėti indeksus OAuth paieškai
ALTER TABLE `users`
ADD INDEX `idx_oauth_google_id` (`oauth_google_id`),
ADD INDEX `idx_oauth_provider` (`oauth_provider`);

-- 3.3 Leisti password_hash būti NULL (OAuth vartotojams)
ALTER TABLE `users`
MODIFY COLUMN `password_hash` VARCHAR(255) NULL DEFAULT NULL;

-- 3.4 Sukurti oauth_temp_tokens lentelę
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

-- 3.5 Atnaujinti esamus vartotojus
UPDATE `users` SET `oauth_provider` = 'email' WHERE `oauth_provider` IS NULL;

-- ============================================================
-- PATIKRINIMAS
-- ============================================================

-- Patikrinti, ar visos lentelės sukurtos
SELECT 'TABLES CHECK:' as '';
SHOW TABLES LIKE '%rate_limits%';
SHOW TABLES LIKE '%oauth_temp_tokens%';

-- Patikrinti users lentelės struktūrą
SELECT 'USERS TABLE STRUCTURE:' as '';
DESCRIBE users;

-- Patikrinti vartotojų skaičių
SELECT 'USERS COUNT:' as '';
SELECT COUNT(*) as total_users,
       SUM(CASE WHEN oauth_provider = 'email' THEN 1 ELSE 0 END) as email_users,
       SUM(CASE WHEN oauth_provider = 'google' THEN 1 ELSE 0 END) as google_users
FROM users;

-- ============================================================
-- BAIGTA! ✅
-- ============================================================
