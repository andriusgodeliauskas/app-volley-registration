# Depozitų Funkcionalumo Deployment Instrukcijos

## Apžvalga

Šis dokumentas aprašo naują "Depozitas" funkcionalumą, leidžiantį vartotojams sumokėti 50 EUR depozitą už prioritetinę registraciją į renginius.

## Pagrindinės Funkcijos

### 1. **Vartotojo Puslapis** (`/deposit`)
- Vartotojai gali sumokėti 50 EUR depozitą iš savo piniginės
- Rodo depozitų istoriją (data, suma, būsena)
- Pop-up patvirtinimas prieš mokėjimą
- Vizualus indikatorius, ar vartotojas jau turi aktyvų depozitą

### 2. **Super Admin Puslapis** (`/admin/deposits`)
- Rodo visų vartotojų depozitus
- Statistika: bendras depozitų skaičius, aktyvūs depozitai
- Galimybė grąžinti aktyvius depozitus atgal vartotojui
- Vizualizuoja grąžinimo istoriją

### 3. **Prioriteto Logika Registracijose**
- Depozitininkai turi prioritetą registruojantis į pilnus renginius
- Kai depozitininkas registruojasi į pilną renginį, paskutinis vartotojas BE depozito perkeliamas į `waitlist`
- Automatinė logika veikia realiuoju laiku

---

## Deployment Žingsniai

### **1. Duomenų Bazė**

Įvykdykite SQL migraciją:

```bash
mysql -u [USERNAME] -p [DATABASE_NAME] < add_deposits_table.sql
```

Arba per phpMyAdmin/Adminer:
1. Atidarykite `add_deposits_table.sql`
2. Nukopijuokite turinį
3. Įvykdykite SQL kodu

**Sukuriama lentelė:**
- `deposits` - su `id`, `user_id`, `amount`, `status`, `created_at`, `refunded_at`, `refunded_by`

---

### **2. Backend API Failai**

Įkelkite šiuos naujus PHP failus į serverio `/api/` katalogą:

1. **`api/deposit_create.php`** - Vartotojo depozito mokėjimas
2. **`api/deposits.php`** - Vartotojo depozitų sąrašas
3. **`api/admin_deposits.php`** - Admin visų depozitų sąrašas
4. **`api/admin_deposit_refund.php`** - Admin depozito grąžinimas

**Modifikuotas failas:**
5. **`api/register_event.php`** - Pridėta prioriteto logika

---

### **3. Frontend Build**

Frontend kataloge (`frontend/`):

```bash
# Įdiekite dependencies (jei dar nepadaryta)
npm install

# Sukurkite production build
npm run build
```

**Nauji failai:**
- `frontend/src/pages/Deposit.jsx`
- `frontend/src/pages/AdminDeposits.jsx`

**Modifikuoti failai:**
- `frontend/src/App.jsx` - nauji route'ai
- `frontend/src/components/Navbar.jsx` - depozito nuoroda
- `frontend/src/components/AdminNavbar.jsx` - admin depozitų nuoroda
- `frontend/src/api/config.js` - nauji endpoint'ai
- `frontend/src/translations.js` - vertimai (LT/EN)

---

### **4. Deployment į Serverį**

#### **A. Backend deployment:**

```bash
# FTP arba SSH
scp api/deposit_create.php user@server:/path/to/api/
scp api/deposits.php user@server:/path/to/api/
scp api/admin_deposits.php user@server:/path/to/api/
scp api/admin_deposit_refund.php user@server:/path/to/api/
scp api/register_event.php user@server:/path/to/api/
```

#### **B. Frontend deployment:**

```bash
# Nukopijuokite dist/ katalogą į serverį
scp -r frontend/dist/* user@server:/path/to/public_html/
```

Arba per FTP:
1. Atidarykite FTP klientą (FileZilla, WinSCP)
2. Prisijunkite prie serverio
3. Nukopijuokite `frontend/dist/*` į `/public_html/` arba `/var/www/html/`

---

### **5. Testavimas**

#### **Vartotojo Testavimas:**

1. **Prisijunkite kaip vartotojas**
2. Eikite į `/deposit`
3. Patikrinkite, ar:
   - Rodo jūsų balansą
   - Rodo 50 EUR depozito sumą
   - Galite sumokėti depozitą (jei turite pakankamai lėšų)
   - Pop-up patvirtinimas veikia
   - Po mokėjimo depozitas atsiranda istorijoje su būsena "Aktyvus"

4. **Registracija į Pilną Renginį:**
   - Sukurkite renginį su `max_players=5`
   - Užregistruokite 5 vartotojus BE depozito
   - Užregistruokite save (su depozitu) kaip 6-tą
   - **Patikrinkite:** Paskutinis vartotojas be depozito turėtų būti perkeltas į `waitlist`
   - **Patikrinkite:** Jūs turėtumėte būti `registered` būsenoje

#### **Admin Testavimas:**

1. **Prisijunkite kaip super_admin**
2. Eikite į `/admin/deposits`
3. Patikrinkite, ar:
   - Rodo visų vartotojų depozitus
   - Rodo statistiką (total, active)
   - Galite grąžinti aktyvų depozitą
   - Pop-up patvirtinimas veikia
   - Po grąžinimo:
     - Vartotojo balansas padidėja +50 EUR
     - Depozito būsena → "Grąžinta"
     - Rodo, kas grąžino ir kada

#### **SQL Patikrinimas:**

```sql
-- Patikrinti depozitus
SELECT * FROM deposits;

-- Patikrinti transactions
SELECT * FROM transactions WHERE type IN ('deposit_payment', 'deposit_refund');

-- Patikrinti vartotojų balansus
SELECT id, name, surname, balance FROM users WHERE id IN (SELECT user_id FROM deposits);
```

---

## Saugumo Patikrinimas

- [ ] Visi API endpoint'ai reikalauja autentifikacijos
- [ ] Admin endpoint'ai reikalauja `super_admin` role
- [ ] Transakc jos naudoja `FOR UPDATE` locking
- [ ] Visi SQL query naudoja prepared statements
- [ ] Balanso validacija prieš mokėjimą
- [ ] Negative balance prevention

---

## Galimi Problemos ir Sprendimai

### **Problema 1: "Failed to fetch deposits"**
**Sprendimas:**
- Patikrinkite, ar `api/deposits.php` egzistuoja serveryje
- Patikrinkite `API_ENDPOINTS.DEPOSITS` konfigūraciją `frontend/src/api/config.js`
- Patikrinkite CORS nustatymus `api/config.php`

### **Problema 2: "Insufficient balance" net turint lėšų**
**Sprendimas:**
- Patikrinkite `users` lentelės `balance` stulpelį
- Patikrinkite, ar `balance` yra DECIMAL(10,2) formatu
- Konvertuokite `parseFloat()` frontend'e

### **Problema 3: Prioriteto logika neveikia**
**Sprendimas:**
- Patikrinkite, ar `deposits` lentelė sukurta
- Patikrinkite SQL query `register_event.php` 143-150 eilutėse
- Patikrinkite, ar `status='active'` tikrinimas veikia

### **Problema 4: Vertimai nerodo teisingai**
**Sprendimas:**
- Išvalykite browser cache
- Perkraukite puslapį (Ctrl+F5)
- Patikrinkite, ar `translations.js` teisingai įkeltas

---

## Rollback Instrukcijos

Jei reikia atšaukti deployment:

### **1. Duomenų Bazė:**
```sql
DROP TABLE deposits;
```

### **2. Backend:**
Ištrinkite naujus failus:
```bash
rm api/deposit_create.php
rm api/deposits.php
rm api/admin_deposits.php
rm api/admin_deposit_refund.php
```

Atkurkite seną `api/register_event.php` iš git:
```bash
git checkout HEAD -- api/register_event.php
```

### **3. Frontend:**
Atkurkite senąforecast build:
```bash
git checkout HEAD -- frontend/
npm run build
# Nukopijuokite seną dist/ į serverį
```

---

## Papildoma Informacija

### **Transakcijų Tipai:**
- `deposit_payment` - Vartotojas sumokėjo depozitą (-50 EUR)
- `deposit_refund` - Admin grąžino depozitą (+50 EUR)

### **Depozito Būsenos:**
- `active` - Aktyvus depozitas, vartotojas turi prioritetą
- `refunded` - Grąžintas depozitas, nebeturi prioriteto

### **Prioriteto Logika:**
1. Event pilnas (`registered_count >= max_players`)
2. Naujas vartotojas turi `deposits.status='active'`
3. Sistema ieško paskutinio registruoto vartotojo BE depozito
4. Jei randa → perkelia jį į `waitlist`, naujas vartotojas → `registered`
5. Jei neranda (visi turi depozitus) → naujas vartotojas → `waitlist`

---

## Kontaktai

Jei kyla klausimų ar problemų:
- **Developer:** Andrius Godeliauskas
- **Email:** andrius.godeliauskas@gmail.com
- **GitHub Issues:** https://github.com/your-repo/issues

---

**Deployment Data:** 2026-01-01
**Versija:** 1.0.0
**Status:** ✅ Paruošta deployment'ui
