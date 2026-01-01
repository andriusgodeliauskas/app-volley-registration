# Support Organizator Feature - Deployment Guide

## Kas buvo sukurta

### 1. Frontend (React)
- ✅ Naujas puslapis: `frontend/src/pages/Support.jsx`
- ✅ Pridėtas meniu punktas "Support" / "Parama" į navigaciją
- ✅ Pridėtas route `/support` į App.jsx
- ✅ Vertimų pridėjimas lietuvių ir anglų kalboms

### 2. Backend (PHP API)
- ✅ `api/donations.php` - gauti visų donacijų sąrašą
- ✅ `api/donation_create.php` - sukurti naują donaciją (nuskaičiuoti iš user balance)

### 3. Duomenų bazė
- ✅ Nauja lentelė `donations` - saugo visas donacijas
- ✅ SQL failas `add_donations_table.sql` - lengvam pridėjimui į esamą DB

## Funkcionalumas

### Vartotojo perspektyva:
1. **Support puslapis** su aprašymu apie organizatoriaus darbą
2. **Parinkti sumą**: greiti mygtukai 1€, 5€, 20€ arba įrašyti custom sumą
3. **Mokėjimo patvirtinimas**: Pop-up su klausimu "Ar tikrai norite paremti?"
4. **Donacijų istorija**: viešas sąrašas kas ir kiek paaukojo (vardas, data, suma)

### Techninis veikimas:
- User gali paaukoti tik iš savo balance
- Sistema tikrina ar pakanka lėšų
- Sukuria įrašą `donations` lentelėje
- Sukuria `transaction` įrašą su tipu "payment"
- Atnaujina user balance (atima donacijos sumą)

## Deployment instrukcijos

### 1. Duomenų bazės atnaujinimas

Pirmiausiai, prijunkite prie savo MySQL/MariaDB duomenų bazės ir įvykdykite SQL:

```bash
mysql -u your_username -p your_database_name < add_donations_table.sql
```

Arba per phpMyAdmin:
1. Atidarykite phpMyAdmin
2. Pasirinkite savo duomenų bazę
3. Spauskite "SQL" tab
4. Įklijuokite turinį iš `add_donations_table.sql`
5. Spauskite "Go"

### 2. FTP Upload

Visas deployment failas yra `deploy/` kataloge:

```
deploy/
├── index.html              (React app)
├── assets/                 (CSS, JS failai)
│   ├── index-*.css
│   └── index-*.js
└── api/                    (PHP backend)
    ├── donations.php       (NAUJAS)
    ├── donation_create.php (NAUJAS)
    ├── ... (kiti API failai)
```

**Upload per FTP:**
1. Atsidarykit FTP klientą (FileZilla, WinSCP, etc.)
2. Prisijunkite prie savo serverio
3. Upload visą `deploy/` katalogo turinį į jūsų public_html arba domain root
4. Užtikrinkite, kad failai yra teisingose vietose:
   - `index.html` ir `assets/` root kataloge
   - `api/` kataloge visi PHP failai

### 3. Patikrinkite permisijas

Užtikrinkite, kad API failai turi tinkamas permisijas:
```bash
chmod 644 api/donations.php
chmod 644 api/donation_create.php
```

### 4. Testuokite

1. Atidarykite svetainę naršyklėje
2. Prisijunkite kaip user
3. Eikite į "Support" / "Parama" puslapį
4. Išbandykite donaciją su mažu sumu (pvz. 1€)
5. Patikrinkite ar:
   - Balance sumažėjo
   - Donacija pasirodė istorijoje
   - Transaction buvo sukurta (Wallet puslapyje)

## SQL Schema

Donations lentelė:

```sql
CREATE TABLE `donations` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL COMMENT 'User who made the donation',
    `amount` DECIMAL(10, 2) NOT NULL COMMENT 'Donation amount',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_donations_user_id` (`user_id`),
    KEY `idx_donations_created_at` (`created_at`),
    CONSTRAINT `fk_donations_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
```

## API Endpoints

### GET /api/donations.php
Grąžina visų donacijų sąrašą

**Response:**
```json
{
  "success": true,
  "donations": [
    {
      "id": 1,
      "user_id": 5,
      "amount": "5.00",
      "created_at": "2025-01-01 15:30:00",
      "user_name": "Jonas",
      "user_surname": "Jonaitis"
    }
  ]
}
```

### POST /api/donation_create.php
Sukuria naują donaciją

**Request:**
```json
{
  "amount": 5.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Donation successful",
  "new_balance": 15.50
}
```

## Troubleshooting

### Problema: "Failed to fetch donations"
- Patikrinkite ar donations lentelė egzistuoja duomenų bazėje
- Patikrinkite API endpoint URL config.js faile
- Patikrinkite PHP error logs

### Problema: "Donation failed"
- Patikrinkite ar user turi pakankamai balance
- Patikrinkite ar donations lentelė turi teisingas foreign keys
- Patikrinkite PHP error logs

### Problema: Balance neatsinaujina
- Perkraukite puslapį (F5)
- Sistemoje yra `window.location.reload()` po sėkmingos donacijos

## Kiti failai

- `database.sql` - atnaujintas su donations lentele (full schema)
- `add_donations_table.sql` - tik donations lentelė (lengvam pridėjimui)

## Kontaktai

Jei kyla klausimų ar problemų, peržiūrėkite:
- Frontend kodą: `frontend/src/pages/Support.jsx`
- Backend kodą: `api/donations.php`, `api/donation_create.php`
- Vertimus: `frontend/src/translations.js`
