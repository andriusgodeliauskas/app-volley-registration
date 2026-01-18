# Google OAuth Integration - Implementation Summary

**Sukurta:** 2026-01-18
**Autorius:** Coding Agent
**Projektas:** Volleyball Registration System

---

## Sukurti Failai

### Backend API Endpoints

1. **`api/google-auth.php`** (365 eilutės)
   - Google OAuth authorization code į access token keitimas
   - Vartotojo informacijos gavimas iš Google
   - Automatinis prisijungimas egzistuojantiems vartotojams
   - Naujo vartotojo sukūrimas su temporary token

2. **`api/set-password.php`** (243 eilutės)
   - Slaptažodžio nustatymas naujiems OAuth vartotojams
   - Slaptažodžio keitimas prisijungusiems vartotojams
   - Slaptažodžio stiprumo validacija (12+ char, A-Z, a-z, 0-9)
   - Bcrypt hashing su cost 12

3. **`api/google-config.php`** (61 eilutė)
   - Public endpoint - grąžina Google OAuth konfigūraciją
   - Tik client_id (NIEKADA ne client_secret)
   - Rate limiting: 100 req/min

4. **`api/cron/cleanup-temp-tokens.php`** (75 eilutės)
   - CLI script pasibaigusių temp token'ų valymui
   - Paleisti kas valandą per cron
   - Logging į stdout ir error_log

### Konfigūracijos Failai

5. **`api/secrets.example.php`** (atnaujintas)
   - Pridėti `GOOGLE_CLIENT_ID` ir `GOOGLE_CLIENT_SECRET`
   - Pavyzdys naujiems deployment'ams

6. **`api/secrets.php`** (atnaujintas)
   - Production credentials (TODO: užpildyti tikrais)
   - ⚠️ NEVER COMMIT TO GIT

### Dokumentacija

7. **`GOOGLE_OAUTH_SECURITY_CHECKLIST.md`** (417 eilučių)
   - Išsamus saugumo auditas
   - SQL injection apsaugos patikrinimas
   - Rate limiting, HTTPS, password hashing
   - Deployment instrukcijos

8. **`GOOGLE_OAUTH_API_DOCUMENTATION.md`** (566 eilutės)
   - Frontend integracija su pavyzdžiais
   - API endpoint'ų aprašymai
   - React + @react-oauth/google pavyzdžiai
   - Klaidos ir troubleshooting

9. **`GOOGLE_OAUTH_README.md`** (šis failas)
   - Trumpa apžvalga ir quick start guide

---

## Duomenų Bazės Migracijos

Egzistuojanti migracija:

10. **`google_oauth_migration.sql`** (jau buvo sukurta anksčiau)
    - Prideda `oauth_provider`, `oauth_google_id`, `password_required` stulpelius į `users`
    - Sukuria `oauth_temp_tokens` lentelę
    - Modifikuoja `password_hash` stulpelį (NULL allowed)

---

## Quick Start

### 1. Paleisti Migraciją

```bash
cd /path/to/app-volley-registration
mysql -u goskajss_volley -p goskajss_volley < google_oauth_migration.sql
```

### 2. Sukonfigūruoti Google OAuth Console

1. Eiti į https://console.cloud.google.com/
2. Sukurti OAuth 2.0 Client ID
3. Pridėti Authorized Redirect URIs:
   - `https://volley.godeliauskas.com`
   - `https://staging.godeliauskas.com`
   - `http://localhost:5173` (development)

### 3. Atnaujinti Credentials

Redaguoti `api/secrets.php`:

```php
define('GOOGLE_CLIENT_ID', 'jūsų_tikras_client_id.apps.googleusercontent.com');
define('GOOGLE_CLIENT_SECRET', 'jūsų_tikras_client_secret');
```

### 4. Sukonfigūruoti Cron Job

```bash
crontab -e
```

Pridėti:

```
0 * * * * php /path/to/api/cron/cleanup-temp-tokens.php >> /path/to/logs/cleanup.log 2>&1
```

### 5. Testuoti Endpoint'us

#### Gauti Config

```bash
curl https://volley.godeliauskas.com/api/google-config.php
```

#### Test Auth (su tikru Google code)

```bash
curl -X POST https://volley.godeliauskas.com/api/google-auth.php \
  -H "Content-Type: application/json" \
  -d '{
    "code": "4/0AfJohXk...",
    "redirect_uri": "https://volley.godeliauskas.com"
  }'
```

---

## OAuth Flow Santrauka

### Egzistuojantis Vartotojas

```
1. Frontend redirect į Google OAuth
2. Google grąžina authorization code
3. Frontend → POST /api/google-auth.php (code, redirect_uri)
4. Backend ← { requires_password: false, token, user }
5. Frontend: saugoti token, redirect į dashboard
```

### Naujas Vartotojas

```
1. Frontend redirect į Google OAuth
2. Google grąžina authorization code
3. Frontend → POST /api/google-auth.php (code, redirect_uri)
4. Backend ← { requires_password: true, temp_token, user }
5. Frontend: rodyti password setup formą
6. Frontend → POST /api/set-password.php (temp_token, password)
7. Backend ← { token, user }
8. Frontend: saugoti token, redirect į dashboard
```

---

## Saugumo Funkcijos

- ✅ **SQL Injection** - 100% prepared statements
- ✅ **XSS** - JSON responses, no HTML output
- ✅ **CSRF** - httpOnly cookies su SameSite=Strict
- ✅ **Rate Limiting** - visose endpoint'uose
- ✅ **Password Hashing** - Bcrypt cost 12
- ✅ **HTTPS Only** - Production aplinkoje
- ✅ **Token Expiry** - 10 min temp tokens, 7 dienų auth tokens
- ✅ **Input Validation** - Visas user input validuotas
- ✅ **Error Handling** - Comprehensive su transaction rollback

---

## Frontend Integration

Naudoti `@react-oauth/google` biblioteką:

```bash
npm install @react-oauth/google
```

Žr. `GOOGLE_OAUTH_API_DOCUMENTATION.md` išsamiems pavyzdžiams.

---

## Failų Struktūra

```
app-volley-registration/
├── api/
│   ├── google-auth.php          # ← Naujas
│   ├── set-password.php         # ← Naujas
│   ├── google-config.php        # ← Naujas
│   ├── cron/
│   │   └── cleanup-temp-tokens.php  # ← Naujas
│   ├── secrets.php              # ← Atnaujintas (TODO: credentials)
│   └── secrets.example.php      # ← Atnaujintas
├── google_oauth_migration.sql   # Egzistuoja
├── GOOGLE_OAUTH_SECURITY_CHECKLIST.md  # ← Naujas
├── GOOGLE_OAUTH_API_DOCUMENTATION.md   # ← Naujas
└── GOOGLE_OAUTH_README.md              # ← Naujas (šis failas)
```

---

## TODO Deployment'ui

- [ ] Paleisti `google_oauth_migration.sql`
- [ ] Užpildyti `api/secrets.php` su tikrais Google credentials
- [ ] Sukonfigūruoti Google OAuth Console
- [ ] Pridėti cron job
- [ ] Testuoti production aplinkoje
- [ ] Atnaujinti frontend su OAuth integracija

---

## Pagalba ir Palaikymas

Dokumentacija:
- **API Dokumentacija:** `GOOGLE_OAUTH_API_DOCUMENTATION.md`
- **Saugumo Auditas:** `GOOGLE_OAUTH_SECURITY_CHECKLIST.md`

Klausimai:
- GitHub Issues
- Email: admin@volleyapp.com

---

**Status:** ✅ Backend API paruoštas production deployment'ui
**Next Steps:** Frontend integracija su React

---

**Sukurta su ❤️ ir griežčiausiomis saugumo praktikomis**
