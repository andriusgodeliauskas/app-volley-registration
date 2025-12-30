# PROJEKTO PALEIDIMAS SU FIREBASE

Jums nebereikia FTP serverio ar duomenų bazės. Viskas veiks per Google Firebase nemokamą planą.

## 1. Firebase Projekto Sukūrimas

1. Eikite į [Firebase Console](https://console.firebase.google.com/).
2. Spauskite **"Create a project"**.
3. Pavadinimas: pvz. "VolleyApp".
4. Google Analytics galite išjungti (nebūtina).
5. Spauskite **"Create Project"**.

## 2. Svetainės (Web App) Registravimas

1. Projekto apžvalgoje (Project Overview) paspauskite **Web** ikoną (kliausteliai `</>`).
2. App nickname: "VolleyWeb".
3. Uždėkite varnelę ant **"Also set up Firebase Hosting"**.
4. Spauskite **Register app**.
5. Jums parodys kodą (`const firebaseConfig = { ... }`).
6. **SVARBU:** Nukopijuokite tik tą dalį tarp `{` ir `}` ir atsinaujinkite failą `index.html` (apie 105 eilutę), pakeisdami ten esančius "PAKEISTI_MANE".

## 3. Autentifikacijos Įjungimas (Authentication)

1. Meniu kairėje pasirinkite **Build** -> **Authentication**.
2. Spauskite **Get Started**.
3. Pasirinkite **Google**.
4. Spauskite **Enable**.
5. Pasirinkite savo el. paštą "Project support email" laukelyje.
6. Spauskite **Save**.

## 4. Duomenų Bazės Sukūrimas (Firestore)

1. Meniu kairėje pasirinkite **Build** -> **Firestore Database**.
2. Spauskite **Create Database**.
3. Location: Pasirinkite `eur3` (Europe West) ar kitą artimą lokaciją.
4. Security Rules: Pasirinkite **Start in test mode** (kol kas paprasčiausia).
5. Spauskite **Create**.

## 5. Paleidimas (Deployment)

Kad svetainė būtų pasiekiama viešai:

1. Įsidiekite Firebase įrankius (jei neturite Node.js):
   - Atsisiųskite Node.js: https://nodejs.org/
   - Terminale: `npm install -g firebase-tools`

2. Prisijunkite:
   - Terminale: `firebase login`

3. Įkelkite svetainę:
   - Terminale (projekto aplanke): `firebase deploy`

Jums bus sugeneruota nuoroda (pvz., `https://volleyapp-123.web.app`), kuria galėsite dalintis su draugais!
