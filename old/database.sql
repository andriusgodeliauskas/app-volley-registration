-- ============================================
-- VOLLEY APP - MySQL Database Schema
-- ============================================
-- Šis failas sukuria visas reikalingas lenteles
-- tinklinio žaidimų registracijos sistemai
-- ============================================

-- Sukuriame users lentelę
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    google_id VARCHAR(255) UNIQUE NOT NULL COMMENT 'Unikalus Google vartotojo ID',
    full_name VARCHAR(255) NOT NULL COMMENT 'Vartotojo vardas ir pavardė',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT 'Vartotojo el. paštas',
    is_admin BOOLEAN DEFAULT FALSE COMMENT 'Ar vartotojas yra administratorius',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_google_id (google_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sukuriame events lentelę
CREATE TABLE IF NOT EXISTS events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_date DATE UNIQUE NOT NULL COMMENT 'Renginio data (šeštadienis)',
    max_players INT DEFAULT 0 COMMENT 'Maksimalus žaidėjų skaičius',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Ar renginys aktyvus ir rodomas',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_event_date (event_date),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sukuriame registrations lentelę
CREATE TABLE IF NOT EXISTS registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_registration (event_id, user_id) COMMENT 'Vartotojas negali du kartus registruotis tam pačiam renginiui',
    INDEX idx_event_id (event_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PRADINIAI DUOMENYS
-- ============================================
-- Įdedame artimiausią šeštadienį kaip pirmą renginį
-- PASTABA: Pakeiskite datą į artimiausią šeštadienį nuo dabartinės datos
-- ============================================

-- Pavyzdys: 2025-12-27 (šeštadienis)
-- Pakeiskite šią datą į artimiausią šeštadienį
INSERT INTO events (event_date, max_players, is_active) 
VALUES ('2025-12-27', 24, TRUE)
ON DUPLICATE KEY UPDATE max_players = 24, is_active = TRUE;

-- Galite pridėti daugiau būsimų šeštadienių:
INSERT INTO events (event_date, max_players, is_active) 
VALUES 
    ('2026-01-03', 24, TRUE),
    ('2026-01-10', 24, TRUE),
    ('2026-01-17', 24, TRUE)
ON DUPLICATE KEY UPDATE max_players = 24, is_active = TRUE;

-- ============================================
-- PABAIGA
-- ============================================
-- Duomenų bazė sukurta sėkmingai!
-- Dabar galite naudoti api.php failą su šia schema
-- ============================================
