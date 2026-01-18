# Production SQL Migracijos - Google OAuth ir Kitos Funkcijos

**Data:** 2026-01-18  
**Tikslas:** Paruošti duomenų bazę naujam funkcionalumui (Google OAuth, Rate Limiting, Remember Me)

---

## ⚠️ SVARBU PRIEŠ PRADEDANT

1. **Backup duomenų bazės:**
   ```bash
   mysqldump -u goskajss_volley -p goskajss_volley > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Patikrinti, ar turite privilegijas:**
   - ALTER TABLE
   - CREATE TABLE
   - CREATE INDEX

3. **Rekomenduojama paleisti ne peak hours** (ne 18:00-22:00)

---

## Migracijos Eiliškumas

Paleisti šias migracijas **būtent tokia tvarka**:

### 1️⃣ Rate Limiting Lentelė (Brute Force Apsauga)

**Failas:** `migrations/006_create_rate_limits_table.sql`

```sql
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
```

**Tikėtinas laikas:** < 1 sekundė  
**Downtime:** Nėra

---

### 2️⃣ Remember Me Funkcionalumas

**Failas:** `migrations/add_remember_me_tokens.sql`

```sql
-- Migration: Add Remember Me Token Support
-- Date: 2026-01-13
-- Description: Adds columns to support "Remember Me" functionality with long-lived tokens

-- Add remember_me_token and remember_me_expiry columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS remember_me_token VARCHAR(64) NULL,
ADD COLUMN IF NOT EXISTS remember_me_expiry DATETIME NULL;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_remember_me_token ON users(remember_me_token);
```

**Tikėtinas laikas:** 1-5 sekundės (priklauso nuo users lentelės dydžio)  
**Downtime:** Minimalus (< 5 sek)

---

### 3️⃣ Google OAuth Integracija

**Failas:** `google_oauth_migration.sql`

```sql
-- Migration: Add Google OAuth support
-- Date: 2026-01-18
-- Description: Adds Google OAuth columns to users table and creates temp tokens table

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
```

**Tikėtinas laikas:** 5-15 sekundžių  
**Downtime:** Minimalus (< 15 sek)

---

## Kaip Paleisti

### Variantas A: Per MySQL CLI (Rekomenduojama)

```bash
# Prisijungti prie duomenų bazės
mysql -u goskajss_volley -p goskajss_volley

# Paleisti kiekvieną migraciją po vieną
source migrations/006_create_rate_limits_table.sql;
source migrations/add_remember_me_tokens.sql;
source google_oauth_migration.sql;

# Patikrinti rezultatus
SHOW TABLES;
DESCRIBE users;
DESCRIBE rate_limits;
DESCRIBE oauth_temp_tokens;
```

### Variantas B: Per phpMyAdmin

1. Prisijungti prie phpMyAdmin
2. Pasirinkti `goskajss_volley` duomenų bazę
3. Eiti į "SQL" tab
4. Copy-paste kiekvienos migracijos turinį
5. Spauti "Go"

### Variantas C: Viena Komanda (Viskas iš karto)

```bash
cd /path/to/app-volley-registration

cat migrations/006_create_rate_limits_table.sql \
    migrations/add_remember_me_tokens.sql \
    google_oauth_migration.sql | \
    mysql -u goskajss_volley -p goskajss_volley
```

---

## Patikrinimas Po Migracijos

### 1. Patikrinti, ar visos lentelės sukurtos:

```sql
SHOW TABLES LIKE '%rate_limits%';
SHOW TABLES LIKE '%oauth_temp_tokens%';
```

Turėtų grąžinti:
- `rate_limits`
- `oauth_temp_tokens`

### 2. Patikrinti `users` lentelės struktūrą:

```sql
DESCRIBE users;
```

Turėtų būti šie nauji stulpeliai:
- `remember_me_token` (VARCHAR(64), NULL)
- `remember_me_expiry` (DATETIME, NULL)
- `oauth_provider` (ENUM('email','google'), DEFAULT 'email')
- `oauth_google_id` (VARCHAR(255), NULL)
- `password_required` (TINYINT(1), DEFAULT 1)
- `password_hash` (VARCHAR(255), NULL) ← **dabar gali būti NULL**

### 3. Patikrinti indeksus:

```sql
SHOW INDEX FROM users;
```

Turėtų būti:
- `idx_remember_me_token`
- `idx_oauth_google_id`
- `idx_oauth_provider`

### 4. Patikrinti esamus vartotojus:

```sql
SELECT COUNT(*) as total_users,
       SUM(CASE WHEN oauth_provider = 'email' THEN 1 ELSE 0 END) as email_users,
       SUM(CASE WHEN oauth_provider = 'google' THEN 1 ELSE 0 END) as google_users
FROM users;
```

Visi esami vartotojai turėtų būti `email_users`.

---

## Rollback (Jei Kas Nors Nepavyko)

### Atšaukti Google OAuth migraciją:

```sql
ALTER TABLE `users`
DROP COLUMN `oauth_provider`,
DROP COLUMN `oauth_google_id`,
DROP COLUMN `password_required`,
DROP INDEX `idx_oauth_google_id`,
DROP INDEX `idx_oauth_provider`;

ALTER TABLE `users`
MODIFY COLUMN `password_hash` VARCHAR(255) NOT NULL;

DROP TABLE IF EXISTS `oauth_temp_tokens`;
```

### Atšaukti Remember Me:

```sql
ALTER TABLE users 
DROP COLUMN remember_me_token,
DROP COLUMN remember_me_expiry,
DROP INDEX idx_remember_me_token;
```

### Atšaukti Rate Limits:

```sql
DROP TABLE IF EXISTS rate_limits;
```

---

## Po Migracijos - Kiti Žingsniai

### 1. Sukonfigūruoti Google OAuth Credentials

Redaguoti `api/secrets.php`:

```php
define('GOOGLE_CLIENT_ID', 'jūsų_tikras_client_id.apps.googleusercontent.com');
define('GOOGLE_CLIENT_SECRET', 'jūsų_tikras_client_secret');
```

### 2. Pridėti Cron Job (Temp Tokens Cleanup)

```bash
crontab -e
```

Pridėti:
```
0 * * * * php /path/to/api/cron/cleanup-temp-tokens.php >> /path/to/logs/cleanup.log 2>&1
```

### 3. Deploy Naują Frontend Build

```bash
cd frontend
npm run build
# Nukopijuoti dist/ į production serverį
```

---

## Pagalba

Jei kyla problemų:
1. Patikrinti MySQL error log: `/var/log/mysql/error.log`
2. Patikrinti, ar turite backup
3. Susisiekti su administratoriumi

---

**Status:** ✅ Paruošta production deployment'ui  
**Autorius:** Volleyball Registration System  
**Versija:** 1.0
