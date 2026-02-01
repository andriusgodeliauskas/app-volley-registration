-- Migration: Family Management System
-- Date: 2026-02-01
-- Description: Šeimos valdymo sistema leidžianti vartotojams prašyti leidimų mokėti už kitus
--              Prideda leidimu valdymą, audit log ir family_transfer transakcijų tipą

-- ============================================
-- Table: family_permissions
-- Purpose: Vartotojų šeimos leidimai - kas gali mokėti už ką
-- ============================================

CREATE TABLE IF NOT EXISTS family_permissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    requester_id INT UNSIGNED NOT NULL COMMENT 'Vartotojas, kuris prašo leidimo',
    target_id INT UNSIGNED NOT NULL COMMENT 'Vartotojas, kuriam prašoma leisti mokėti',
    status ENUM('pending','accepted','rejected','canceled') DEFAULT 'pending' COMMENT 'Leidimo būsena',
    can_pay TINYINT(1) DEFAULT 1 COMMENT 'Ar gali mokėti už kitą vartotoją (1=taip, 0=ne)',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Kada buvo paprašyta leidimo',
    responded_at TIMESTAMP NULL COMMENT 'Kada buvo atsakyta į prašymą',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Unikalus constraint - vienas vartotojas gali turėti tik vieną aktyvų prašymą kitam
    UNIQUE KEY unique_permission (requester_id, target_id),

    -- Indeksai optimizavimui
    INDEX idx_requester_id (requester_id),
    INDEX idx_target_id (target_id),
    INDEX idx_status (status),
    INDEX idx_requester_target (requester_id, target_id),

    -- Foreign keys
    CONSTRAINT fk_family_requester
        FOREIGN KEY (requester_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_family_target
        FOREIGN KEY (target_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Šeimos leidimai - kas gali mokėti už ką';

-- ============================================
-- Table: family_audit_log
-- Purpose: Audit log visiems šeimos valdymo veiksmams
-- ============================================

CREATE TABLE IF NOT EXISTS family_audit_log (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    family_permission_id INT UNSIGNED NULL COMMENT 'Susijęs family_permissions įrašas (jei taikoma)',
    action ENUM(
        'request_sent',
        'accepted',
        'rejected',
        'canceled',
        'removed',
        'admin_added',
        'admin_removed'
    ) NOT NULL COMMENT 'Atliktas veiksmas',
    performed_by INT UNSIGNED NOT NULL COMMENT 'Vartotojas, kuris atliko veiksmą',
    target_user_id INT UNSIGNED NULL COMMENT 'Vartotojas, kuriam skirtas veiksmas (jei taikoma)',
    details TEXT NULL COMMENT 'Papildoma informacija JSON formatu',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indeksai
    INDEX idx_permission_id (family_permission_id),
    INDEX idx_action (action),
    INDEX idx_performed_by (performed_by),
    INDEX idx_target_user (target_user_id),
    INDEX idx_created_at (created_at),

    -- Foreign keys
    CONSTRAINT fk_audit_permission
        FOREIGN KEY (family_permission_id)
        REFERENCES family_permissions(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_audit_performer
        FOREIGN KEY (performed_by)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit log šeimos valdymo veiksmams';

-- ============================================
-- Modify transactions table - pridėti family_transfer tipą
-- ============================================

ALTER TABLE transactions
MODIFY COLUMN type
    ENUM('topup','payment','refund','adjustment','family_transfer') NOT NULL
COMMENT 'Transakcijos tipas (family_transfer = pinigų pervedimas šeimai)';

-- ============================================
-- Verification Queries
-- ============================================

-- Patikrinti, ar lentelės sukurtos
SHOW TABLES LIKE 'family_permissions';
SHOW TABLES LIKE 'family_audit_log';

-- Patikrinti lentelių struktūrą
DESCRIBE family_permissions;
DESCRIBE family_audit_log;

-- Patikrinti transactions ENUM modifikaciją
SHOW COLUMNS FROM transactions WHERE Field = 'type';

-- Pradinis duomenų skaičius (turėtų būti tuščia)
SELECT COUNT(*) as permissions_count FROM family_permissions;
SELECT COUNT(*) as audit_log_count FROM family_audit_log;

-- ============================================
-- Usage Examples
-- ============================================

-- Pavyzdys 1: Vartotojas prašo leidimo mokėti už kitą
-- INSERT INTO family_permissions (requester_id, target_id, status)
-- VALUES (123, 456, 'pending');

-- Pavyzdys 2: Patvirtinti leidimą
-- UPDATE family_permissions
-- SET status = 'accepted', responded_at = NOW()
-- WHERE id = 1;

-- Pavyzdys 3: Gauti visus aktyvius leidimus vartotojui
-- SELECT fp.*,
--        u1.name as requester_name,
--        u2.name as target_name
-- FROM family_permissions fp
-- JOIN users u1 ON fp.requester_id = u1.id
-- JOIN users u2 ON fp.target_id = u2.id
-- WHERE fp.status = 'accepted'
-- AND (fp.requester_id = ? OR fp.target_id = ?);

-- Pavyzdys 4: Įrašyti audit log įrašą
-- INSERT INTO family_audit_log (family_permission_id, action, performed_by, target_user_id, details)
-- VALUES (1, 'accepted', 456, 123, '{"accepted_at": "2026-02-01 14:30:00"}');

-- Pavyzdys 5: Gauti vartotojo šeimos audit istoriją
-- SELECT fal.*,
--        u.name as performed_by_name,
--        fp.status as permission_status
-- FROM family_audit_log fal
-- LEFT JOIN users u ON fal.performed_by = u.id
-- LEFT JOIN family_permissions fp ON fal.family_permission_id = fp.id
-- WHERE fal.performed_by = ? OR fal.target_user_id = ?
-- ORDER BY fal.created_at DESC
-- LIMIT 50;
