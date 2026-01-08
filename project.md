# Volley Registration App

Tai yra tinklinio registracijos sistema. Projektas susideda iš PHP (API) ir frontend dalies.

## Svarbi konfigūracija (Saugumas)

Šiame projekte naudojami jautrūs prisijungimo duomenys prie duomenų bazės. Šie failai yra **ignoruojami** (`.gitignore`) ir neturi patekti į versijų kontrolės sistemą.

### Kaip sukonfigūruoti aplinką:

1.  **Production Aplinka:**
    *   Nueikite į `api/` katalogą.
    *   Nukopijuokite `secrets.example.php` į `secrets.php`.
    *   Atsidarykite `api/secrets.php` ir įveskite savo **Production** duomenų bazės prisijungimus.

2.  **Staging Aplinka:**
    *   Nueikite į `api/` katalogą.
    *   Nukopijuokite `config-staging.example.php` į `config-staging.php`.
    *   Atsidarykite `api/config-staging.php` ir įveskite savo **Staging** duomenų bazės prisijungimus.

**PASTABA:** Failai `api/secrets.php` ir `api/config-staging.php` yra įtraukti į `.gitignore`, todėl jie nebus siunčiami į GitHub. Tai užtikrina saugumą.

## GitHub Saugykla

Projekto failai siunčiami į: [https://github.com/andriusgodeliauskas/app-volley-registration](https://github.com/andriusgodeliauskas/app-volley-registration)

### Failų siuntimas (komandos)

```bash
# Pridėti visus pakeitimus
git add .

# Užfiksuoti pakeitimus
git commit -m "Atnaujintas projektas su saugumo instrukcijomis"

# Išsiųsti į GitHub
git push origin main
```
