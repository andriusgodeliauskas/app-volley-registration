# Google OAuth API - Frontend Integration Guide

**Projektas:** Volleyball Registration System
**Sukurta:** 2026-01-18
**Backend API Version:** 1.0

---

## Turinys

1. [Apžvalga](#apžvalga)
2. [OAuth Flow](#oauth-flow)
3. [API Endpoints](#api-endpoints)
4. [Klaidos](#klaidos)
5. [Pavyzdžiai](#pavyzdžiai)

---

## Apžvalga

Google OAuth backend'as leidžia vartotojams prisijungti naudojant Google paskyrą. Sistema palaiko du scenarijus:

1. **Egzistuojantis vartotojas** - automatinis prisijungimas
2. **Naujas vartotojas** - registracija + slaptažodžio nustatymas

---

## OAuth Flow

### 1. Egzistuojantis Vartotojas (Greitasis Flow)

```
Frontend                          Google                         Backend
   |                                 |                              |
   |-- (1) Redirect to Google ------>|                              |
   |                                 |                              |
   |<-- (2) Return with code --------|                              |
   |                                                                |
   |-- (3) POST /api/google-auth.php (code, redirect_uri) -------->|
   |                                                                |
   |                                                   [Tikrins DB]|
   |                                                   [User exists]|
   |                                                                |
   |<-- (4) Response { requires_password: false, token, user } ----|
   |                                                                |
   [Saugoti token, redirect į dashboard]
```

### 2. Naujas Vartotojas (Su Slaptažodžio Nustatymu)

```
Frontend                          Google                         Backend
   |                                 |                              |
   |-- (1) Redirect to Google ------>|                              |
   |                                 |                              |
   |<-- (2) Return with code --------|                              |
   |                                                                |
   |-- (3) POST /api/google-auth.php (code, redirect_uri) -------->|
   |                                                                |
   |                                                   [Tikrins DB]|
   |                                                  [New user!!!]|
   |                                               [Create account]|
   |                                            [Generate temp_token]|
   |                                                                |
   |<-- (4) Response { requires_password: true, temp_token, user }-|
   |                                                                |
   [Rodyti password setup formą]                                   |
   |                                                                |
   |-- (5) POST /api/set-password.php (temp_token, password) ----->|
   |                                                                |
   |                                                  [Hash password]|
   |                                                [Activate account]|
   |                                                                |
   |<-- (6) Response { token, user } -------------------------------|
   |                                                                |
   [Saugoti token, redirect į dashboard]
```

---

## API Endpoints

### 1. GET /api/google-config.php

Grąžina Google OAuth konfigūraciją frontend'ui.

#### Request

```http
GET /api/google-config.php
```

#### Response

```json
{
  "success": true,
  "data": {
    "client_id": "123456789.apps.googleusercontent.com",
    "redirect_uri": "https://volley.godeliauskas.com"
  },
  "message": "Google OAuth konfigūracija"
}
```

#### React Pavyzdys

```javascript
const fetchGoogleConfig = async () => {
  try {
    const response = await fetch('https://volley.godeliauskas.com/api/google-config.php');
    const data = await response.json();

    if (data.success) {
      return data.data; // { client_id, redirect_uri }
    }
  } catch (error) {
    console.error('Failed to fetch Google config:', error);
  }
};
```

---

### 2. POST /api/google-auth.php

Priima Google authorization code ir atlieka autentifikaciją.

#### Request

```http
POST /api/google-auth.php
Content-Type: application/json

{
  "code": "4/0AfJohXkN...",
  "redirect_uri": "https://volley.godeliauskas.com"
}
```

#### Response 1: Egzistuojantis Vartotojas

```json
{
  "success": true,
  "data": {
    "requires_password": false,
    "token": "a1b2c3d4e5f6...",
    "user": {
      "id": 123,
      "name": "Jonas",
      "surname": "Jonaitis",
      "email": "jonas@gmail.com",
      "role": "user",
      "balance": "50.00",
      "parent_id": null,
      "avatar": "Midnight",
      "children": []
    }
  },
  "message": "Sėkmingai prisijungėte"
}
```

**Frontend Action:**
- Išsaugoti `token` į localStorage/state
- Cookie jau nustatytas automatiškai (httpOnly)
- Redirect į dashboard

#### Response 2: Naujas Vartotojas

```json
{
  "success": true,
  "data": {
    "requires_password": true,
    "temp_token": "x7y8z9a1b2c3...",
    "user": {
      "id": 456,
      "name": "Petras",
      "surname": "Petraitis",
      "email": "petras@gmail.com",
      "role": "user",
      "balance": "0.00",
      "parent_id": null,
      "avatar": "Midnight",
      "children": []
    }
  },
  "message": "Paskyra sukurta. Nustatykite slaptažodį."
}
```

**Frontend Action:**
- Išsaugoti `temp_token` (temporary, 10 min)
- Parodyti slaptažodžio nustatymo formą
- Perduoti `temp_token` į `/api/set-password.php`

#### React Pavyzdys

```javascript
const handleGoogleCallback = async (authorizationCode) => {
  try {
    const response = await fetch('https://volley.godeliauskas.com/api/google-auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: authorizationCode,
        redirect_uri: window.location.origin
      })
    });

    const data = await response.json();

    if (data.success) {
      if (data.data.requires_password) {
        // Naujas vartotojas - rodyti password formą
        setTempToken(data.data.temp_token);
        setShowPasswordSetup(true);
      } else {
        // Egzistuojantis vartotojas - prisijungti
        localStorage.setItem('auth_token', data.data.token);
        setUser(data.data.user);
        navigate('/dashboard');
      }
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Google auth failed:', error);
  }
};
```

---

### 3. POST /api/set-password.php

Nustato slaptažodį naujam OAuth vartotojui arba pakeičia esamą.

#### Request (su temp_token - naujas vartotojas)

```http
POST /api/set-password.php
Content-Type: application/json

{
  "temp_token": "x7y8z9a1b2c3...",
  "password": "SecurePassword123"
}
```

#### Request (su auth_token - prisijungęs vartotojas)

```http
POST /api/set-password.php
Content-Type: application/json

{
  "auth_token": "a1b2c3d4e5f6...",
  "password": "NewSecurePassword456"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "token": "new_auth_token_here...",
    "user": {
      "id": 456,
      "name": "Petras",
      "surname": "Petraitis",
      "email": "petras@gmail.com",
      "role": "user",
      "balance": "0.00",
      "parent_id": null,
      "avatar": "Midnight",
      "children": []
    }
  },
  "message": "Slaptažodis nustatytas sėkmingai"
}
```

**Frontend Action:**
- Išsaugoti naują `token`
- Cookie jau atnaujintas
- Redirect į dashboard

#### Slaptažodžio Reikalavimai

Frontend validacija PRIEŠ siunčiant į API:

- ✅ Minimalus ilgis: **12 simbolių**
- ✅ Bent viena **didžioji raidė** (A-Z)
- ✅ Bent viena **mažoji raidė** (a-z)
- ✅ Bent vienas **skaičius** (0-9)
- ✅ Maksimalus ilgis: **128 simboliai**

#### React Pavyzdys

```javascript
const handleSetPassword = async (password) => {
  // Frontend validacija
  if (password.length < 12) {
    alert('Slaptažodis turi būti bent 12 simbolių');
    return;
  }
  if (!/[A-Z]/.test(password)) {
    alert('Slaptažodis turi turėti bent vieną didžiąją raidę');
    return;
  }
  if (!/[a-z]/.test(password)) {
    alert('Slaptažodis turi turėti bent vieną mažąją raidę');
    return;
  }
  if (!/[0-9]/.test(password)) {
    alert('Slaptažodis turi turėti bent vieną skaičių');
    return;
  }

  try {
    const response = await fetch('https://volley.godeliauskas.com/api/set-password.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        temp_token: tempToken, // Iš google-auth.php response
        password: password
      })
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('auth_token', data.data.token);
      setUser(data.data.user);
      navigate('/dashboard');
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Set password failed:', error);
  }
};
```

---

## Klaidos

### HTTP Status Kodai

- **200** - Sėkminga operacija
- **400** - Neteisingi duomenys (validation error)
- **401** - Neautorizuotas (invalid/expired token)
- **403** - Draudžiama (account inactive)
- **429** - Per daug bandymų (rate limit)
- **500** - Serverio klaida

### Klaidos Response Formatas

```json
{
  "success": false,
  "message": "Klaidos pranešimas lietuviškai"
}
```

Su papildoma informacija:

```json
{
  "success": false,
  "message": "Slaptažodis neatitinka reikalavimų",
  "errors": {
    "validation_errors": [
      "Password must be at least 12 characters long",
      "Password must contain at least one uppercase letter"
    ]
  }
}
```

### Tipinės Klaidos

#### google-auth.php

| Klaida | Priežastis | Sprendimas |
|--------|-----------|------------|
| `Trūksta būtinų laukų: code, redirect_uri` | Neperduoti reikalingi laukai | Patikrinti request body |
| `Redirect URI turi būti HTTPS` | Production aplinkoje naudojamas HTTP | Naudoti HTTPS |
| `Too many attempts. Try again in X minute(s).` | Rate limit viršytas | Palaukti X minučių |
| `Neteisingas autorizacijos kodas` | Google grąžino klaidą arba code jau panaudotas | Gauti naują authorization code |
| `Paskyra laukia patvirtinimo` | `is_active = 0` | Laukti admin patvirtinimo |

#### set-password.php

| Klaida | Priežastis | Sprendimas |
|--------|-----------|------------|
| `Reikalingas temp_token arba auth_token` | Neperduotas token | Perduoti vieną iš token'ų |
| `Trūksta slaptažodžio` | Password laukas tuščias | Įvesti slaptažodį |
| `Slaptažodis neatitinka reikalavimų` | Silpnas slaptažodis | Sustiprinti slaptažodį (12+ char, A-Z, a-z, 0-9) |
| `Neteisingas arba pasibaigęs temp_token` | Token istekęs (10 min) arba neteisingas | Prisijungti iš naujo su Google |
| `Temp_token galiojimas pasibaigė` | Praėjo >10 min nuo registracijos | Prisijungti iš naujo |

---

## Pavyzdžiai

### Pilnas React + @react-oauth/google Pavyzdys

#### 1. Setup Google OAuth Provider

```jsx
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const [googleConfig, setGoogleConfig] = useState(null);

  useEffect(() => {
    // Gauti Google config
    fetch('https://volley.godeliauskas.com/api/google-config.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGoogleConfig(data.data);
        }
      });
  }, []);

  if (!googleConfig) return <div>Loading...</div>;

  return (
    <GoogleOAuthProvider clientId={googleConfig.client_id}>
      <YourAppComponents />
    </GoogleOAuthProvider>
  );
}
```

#### 2. Login Component

```jsx
import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';

function GoogleLoginButton() {
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [user, setUser] = useState(null);

  const handleGoogleSuccess = async (codeResponse) => {
    try {
      // Siųsti code į backend
      const response = await fetch('https://volley.godeliauskas.com/api/google-auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeResponse.code,
          redirect_uri: window.location.origin
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.data.requires_password) {
          // Naujas vartotojas - rodyti password formą
          setTempToken(data.data.temp_token);
          setUser(data.data.user);
          setShowPasswordSetup(true);
        } else {
          // Egzistuojantis vartotojas - prisijungti
          localStorage.setItem('auth_token', data.data.token);
          window.location.href = '/dashboard';
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Google login failed:', error);
      alert('Prisijungimas nepavyko');
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    flow: 'auth-code',
  });

  if (showPasswordSetup) {
    return <PasswordSetupForm tempToken={tempToken} user={user} />;
  }

  return (
    <button onClick={googleLogin} className="google-login-btn">
      <img src="/google-icon.svg" alt="Google" />
      Prisijungti su Google
    </button>
  );
}
```

#### 3. Password Setup Form

```jsx
function PasswordSetupForm({ tempToken, user }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState([]);

  const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < 12) errors.push('Bent 12 simbolių');
    if (!/[A-Z]/.test(pwd)) errors.push('Bent viena didžioji raidė');
    if (!/[a-z]/.test(pwd)) errors.push('Bent viena mažoji raidė');
    if (!/[0-9]/.test(pwd)) errors.push('Bent vienas skaičius');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validacija
    const validationErrors = validatePassword(password);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (password !== confirmPassword) {
      setErrors(['Slaptažodžiai nesutampa']);
      return;
    }

    try {
      const response = await fetch('https://volley.godeliauskas.com/api/set-password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temp_token: tempToken,
          password: password
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('auth_token', data.data.token);
        window.location.href = '/dashboard';
      } else {
        setErrors([data.message]);
      }
    } catch (error) {
      console.error('Set password failed:', error);
      setErrors(['Klaida nustatant slaptažodį']);
    }
  };

  return (
    <div className="password-setup">
      <h2>Sveiki, {user.name}!</h2>
      <p>Nustatykite slaptažodį savo paskyrai:</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Slaptažodis:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Pakartoti slaptažodį:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {errors.length > 0 && (
          <div className="errors">
            <ul>
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="password-requirements">
          <p>Slaptažodžio reikalavimai:</p>
          <ul>
            <li>Bent 12 simbolių</li>
            <li>Bent viena didžioji raidė (A-Z)</li>
            <li>Bent viena mažoji raidė (a-z)</li>
            <li>Bent vienas skaičius (0-9)</li>
          </ul>
        </div>

        <button type="submit" className="btn-primary">
          Nustatyti slaptažodį
        </button>
      </form>
    </div>
  );
}
```

---

## Rate Limiting

Visi endpoint'ai turi rate limiting:

| Endpoint | Limitas | Laikotarpis | Identifier |
|----------|---------|-------------|------------|
| `google-config.php` | 100 req | 1 min | IP adresas |
| `google-auth.php` | 10 req | 15 min | IP adresas |
| `set-password.php` | 5 req | 15 min | IP adresas |

Viršijus limitą, grąžinamas **429 Too Many Requests** su pranešimu:

```json
{
  "success": false,
  "message": "Too many attempts. Try again in 15 minute(s)."
}
```

---

## Security Notes

1. **HTTPS Only** - Production aplinkoje priimami tik HTTPS redirect URI
2. **httpOnly Cookies** - Auth token saugomas httpOnly cookie (XSS apsauga)
3. **SameSite=Strict** - CSRF apsauga
4. **Temp Token Expiry** - Temp token galioja tik 10 minučių
5. **Password Hashing** - Bcrypt su cost 12
6. **Rate Limiting** - Apsauga nuo brute force atakų

---

## Testing

### Development Environment

```javascript
// Test su localhost
const response = await fetch('http://localhost/api/google-auth.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'test_code_from_google',
    redirect_uri: 'http://localhost:5173'
  })
});
```

### Production Environment

```javascript
const response = await fetch('https://volley.godeliauskas.com/api/google-auth.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'real_code_from_google',
    redirect_uri: 'https://volley.godeliauskas.com'
  })
});
```

---

## Troubleshooting

### Problem: "Neteisingas autorizacijos kodas"

**Priežastis:** Authorization code jau panaudotas arba pasibaigęs (10 min)

**Sprendimas:** Authorization code galima panaudoti tik vieną kartą. Gauti naują code iš Google.

---

### Problem: "Temp_token galiojimas pasibaigė"

**Priežastis:** Vartotojas užtruko >10 min nuo registracijos iki slaptažodžio nustatymo

**Sprendimas:** Prisijungti iš naujo su Google. Sistema sukurs naują temp_token.

---

### Problem: Rate limit exceeded

**Priežastis:** Per daug bandymų per trumpą laiką

**Sprendimas:** Palaukti nurodytą laiką. Production aplinkoje, tai apsaugo nuo brute force.

---

## Support

Klausimams ar problemoms:
- GitHub Issues: [app-volley-registration/issues]
- Email: admin@volleyapp.com

---

**Last Updated:** 2026-01-18
**API Version:** 1.0
**Backend Language:** PHP 8.x
