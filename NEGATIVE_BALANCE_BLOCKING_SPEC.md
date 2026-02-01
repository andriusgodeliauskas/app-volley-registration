# Specifikacija: Neigiamo Balanso Registracijos Blokavimas

## Tikslas
Neleisti vartotojams registruotis į renginius, jei jų balansas viršija nustatytą neigiamą limitą.

## Verslo Logika
1. **Super admin** → visada gali registruoti (aplenkia visus patikrinimus)
2. **Vartotojo limitas** → tikrinamas PIRMA (default: -12 EUR)
3. **Renginio limitas** → tikrinamas PO vartotojo limito
4. Jei `balansas < vartotojo_limitas` → ATMESTI
5. Jei `balansas < renginio_limitas` → ATMESTI

**Pavyzdžiai:**
- Balansas: -10, Vartotojo limitas: -12, Renginio limitas: -15 → **LEISTI**
- Balansas: -13, Vartotojo limitas: -12, Renginio limitas: -15 → **ATMESTI** (viršija vartotojo)
- Balansas: -16, Vartotojo limitas: -20, Renginio limitas: -15 → **ATMESTI** (viršija renginio)

---

## DARBŲ PLANAS

### DARBO 1: Duomenų Bazės Migracija ⏳
**Failas:** `migrations/010_add_negative_balance_limits.sql`

```sql
ALTER TABLE users ADD COLUMN negative_balance_limit DECIMAL(10,2) NOT NULL DEFAULT -12.00;
ALTER TABLE events ADD COLUMN negative_balance_limit DECIMAL(10,2) NOT NULL DEFAULT -12.00;
CREATE INDEX idx_users_negative_limit ON users(negative_balance_limit);
CREATE INDEX idx_events_negative_limit ON events(negative_balance_limit);
```

### DARBO 2: Backend - Registracijos Logika ⏳
**Failas:** `api/register_event.php`
- Pridėti balanso limito patikrinimą
- Super admin aplenkia patikrinimą

### DARBO 3: Backend - Admin User Update API ⏳
**Failas:** `api/admin_user_update.php`
- Priimti `negative_balance_limit` parametrą
- Validuoti (turi būti <= 0)

### DARBO 4: Backend - Admin User Details API ⏳
**Failas:** `api/admin_user_details.php`
- Grąžinti `negative_balance_limit` lauką

### DARBO 5: Backend - Admin Event Update API ⏳
**Failas:** `api/admin_event_update.php`
- Priimti `negative_balance_limit` parametrą

### DARBO 6: Backend - Admin Event Details API ⏳
**Failas:** `api/admin_event_details.php`
- Grąžinti `negative_balance_limit` lauką

### DARBO 7: Backend - Event Creation API ⏳
**Failas:** `api/events.php`
- Įtraukti `negative_balance_limit` į INSERT (default -12.00)

### DARBO 8: Frontend - Vertimai ⏳
**Failas:** `frontend/src/translations.js`
- LT/EN vertimai klaidoms ir laukeliams

### DARBO 9: Frontend - Admin User Edit ⏳
**Failas:** `frontend/src/pages/AdminUserEdit.jsx`
- Pridėti vartotojo limito input lauką

### DARBO 10: Frontend - Admin Event Edit ⏳
**Failas:** `frontend/src/pages/AdminEventEdit.jsx`
- Pridėti renginio limito input lauką

---

## Kritiniai Failai

| Failas | Tipas |
|--------|-------|
| `migrations/010_add_negative_balance_limits.sql` | NAUJAS |
| `api/register_event.php` | MODIFIKUOTI |
| `api/admin_user_update.php` | MODIFIKUOTI |
| `api/admin_user_details.php` | MODIFIKUOTI |
| `api/admin_event_update.php` | MODIFIKUOTI |
| `api/admin_event_details.php` | MODIFIKUOTI |
| `api/events.php` | MODIFIKUOTI |
| `frontend/src/translations.js` | MODIFIKUOTI |
| `frontend/src/pages/AdminUserEdit.jsx` | MODIFIKUOTI |
| `frontend/src/pages/AdminEventEdit.jsx` | MODIFIKUOTI |

---

## Testavimo Planas

- [ ] Paleisti migraciją staging DB
- [ ] Testuoti registraciją su įvairiais balansais
- [ ] Super admin gali registruoti nepaisant limito
- [ ] Admin gali keisti vartotojo/renginio limitą
- [ ] Vertimai rodosi teisingai LT/EN

---

**Sukurta:** 2026-02-01
**Statusas:** Vykdoma
