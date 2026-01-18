# SQL Užklausos - Paleidimo Instrukcijos

## PRIEŠ PRADEDANT

```bash
# 1. Padaryk backup
mysqldump -u goskajss_volley -p goskajss_volley > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## PALEISTI ŠIĄ EILĘ:

### 1. Rate Limiting Lentelė

```bash
mysql -u goskajss_volley -p goskajss_volley < migrations/006_create_rate_limits_table.sql
```

### 2. Remember Me Funkcionalumas

```bash
mysql -u goskajss_volley -p goskajss_volley < migrations/add_remember_me_tokens.sql
```

### 3. Google OAuth Integracija

```bash
mysql -u goskajss_volley -p goskajss_volley < google_oauth_migration.sql
```

---

## ARBA VISKAS VIENU KARTU:

```bash
cd d:\Andriaus\Projects\my-projects\app-volley-registration

mysql -u goskajss_volley -p goskajss_volley < migrations/006_create_rate_limits_table.sql
mysql -u goskajss_volley -p goskajss_volley < migrations/add_remember_me_tokens.sql
mysql -u goskajss_volley -p goskajss_volley < google_oauth_migration.sql
```

---

## PATIKRINIMAS

```sql
-- Prisijungti prie DB
mysql -u goskajss_volley -p goskajss_volley

-- Patikrinti lenteles
SHOW TABLES;

-- Patikrinti users stulpelius
DESCRIBE users;

-- Turi matyti:
-- - remember_me_token
-- - remember_me_expiry
-- - oauth_provider
-- - oauth_google_id
-- - password_required
```

---

**SVARBU:** Paleisti būtent tokia tvarka: 1 → 2 → 3
