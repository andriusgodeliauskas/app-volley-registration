# VolleyApp - Greito Paleidimo Gidas

## 🚀 3 Žingsniai iki Veikiančios Aplikacijos

### 1️⃣ Duomenų Bazė (5 min)

```sql
-- Sukurkite duomenų bazę
CREATE DATABASE volley_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Importuokite database.sql failą per phpMyAdmin arba:
mysql -u your_username -p volley_db < database.sql

-- Pridėkite pirmąjį renginį (PAKEISKITE DATĄ!)
INSERT INTO events (event_date, is_active) VALUES ('2025-01-04', TRUE);
```

### 2️⃣ Konfigūracija (2 min)

**api.php** - Eilutės 15-18:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'volley_db');
define('DB_USER', 'jūsų_vartotojas');
define('DB_PASS', 'jūsų_slaptažodis');
```

**index.html** - Eilutės 135 ir 240:
```javascript
data-client_id="JŪSŲ_GOOGLE_CLIENT_ID"
const GOOGLE_CLIENT_ID = 'JŪSŲ_GOOGLE_CLIENT_ID';
```

### 3️⃣ Įkėlimas (3 min)

1. Prisijunkite per FTP
2. Sukurkite `/volley/` katalogą
3. Įkelkite:
   - `index.html`
   - `api.php`
   - `.htaccess` (pasirinktinai)

## ✅ Testavimas

Atidarykite: `http://godeliauskas.com/volley/`

Turėtumėte matyti:
- ✅ Renginio datą
- ✅ Google prisijungimo mygtuką
- ✅ Tuščią žaidėjų sąrašą

## 🔑 Google OAuth Setup

1. Eikite į: https://console.cloud.google.com/
2. Sukurkite projektą
3. APIs & Services → Credentials → Create OAuth Client ID
4. Web application
5. Authorized JavaScript origins:
   - `http://godeliauskas.com`
6. Nukopijuokite Client ID

## 🐛 Dažniausios Problemos

**"Database connection failed"**
→ Patikrinkite DB kredencialus `api.php`

**Google login neveikia**
→ Patikrinkite Client ID ir authorized origins

**"No active events"**
→ Įdėkite renginį į `events` lentelę

## 📁 Failų Sąrašas

```
/volley/
├── index.html          ← Frontend
├── api.php            ← Backend API
└── .htaccess          ← Security (optional)
```

## 🎯 Po Įdiegimo

1. **Testuokite visas funkcijas**:
   - Prisijungimas
   - Registracija
   - Atsiregistravimas
   - Gyvai atsinaujinantis sąrašas

2. **Saugumas produkcijai**:
   ```php
   // api.php - eilutės 11-12
   error_reporting(0);
   ini_set('display_errors', 0);
   ```

3. **Admin vartotojas**:
   ```sql
   UPDATE users SET is_admin = TRUE 
   WHERE email = 'admin@example.com';
   ```

4. **Pridėkite daugiau renginių**:
   ```sql
   INSERT INTO events (event_date, is_active) VALUES
   ('2025-01-11', TRUE),
   ('2025-01-18', TRUE),
   ('2025-01-25', TRUE);
   ```

## 📞 Pagalba

Jei kyla problemų:
1. Patikrinkite PHP error logs
2. Atidarykite Browser Console (F12)
3. Peržiūrėkite `README.md` troubleshooting sekciją

---

**Sėkmės! 🏐**
