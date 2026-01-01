# AI Assistant Deployment Guide

**This document is specifically for AI assistants** to understand how to deploy this project automatically.

---

## 🤖 Quick AI Reference

### Project Structure
```
app-volley-registration/
├── api/                          # PHP Backend
│   ├── config.php               # Production config (in Git)
│   ├── config-staging.php       # Staging config with real credentials (NOT in Git)
│   ├── config-staging.example.php  # Staging template (in Git)
│   ├── secrets.php              # DB credentials (NOT in Git)
│   └── secrets.example.php      # DB template (in Git)
├── frontend/                     # React Frontend
├── deploy/                       # Production build output (NOT in Git)
├── deploy-staging/              # Staging build output (NOT in Git)
├── prepare-deploy.ps1           # Production build script
└── prepare-deploy-staging.ps1   # Staging build script
```

---

## 🚀 Deployment Commands

### Build STAGING
```powershell
# From project root: D:\Andriaus\Projects\my-projects\app-volley-registration
powershell -ExecutionPolicy Bypass -File prepare-deploy-staging.ps1
```

**Output:** `deploy-staging/` folder with 41 files ready for FTP upload to `staging.godeliauskas.com`

### Build PRODUCTION
```powershell
# From project root: D:\Andriaus\Projects\my-projects\app-volley-registration
powershell -ExecutionPolicy Bypass -File prepare-deploy.ps1
```

**Output:** `deploy/` folder with 41 files ready for FTP upload to `volley.godeliauskas.com`

---

## 🎯 When User Asks to Deploy

### Scenario 1: "Deploy to staging"
```powershell
cd "D:\Andriaus\Projects\my-projects\app-volley-registration"
powershell -ExecutionPolicy Bypass -File prepare-deploy-staging.ps1
```
Then inform user to upload `deploy-staging/` to `staging.godeliauskas.com` FTP.

### Scenario 2: "Deploy to production"
**⚠️ ALWAYS ask first:** "Have you tested on staging?"

If yes:
```powershell
cd "D:\Andriaus\Projects\my-projects\app-volley-registration"
powershell -ExecutionPolicy Bypass -File prepare-deploy.ps1
```
Then inform user to upload `deploy/` to `volley.godeliauskas.com` FTP.

### Scenario 3: "Deploy both" or "Build everything"
```powershell
cd "D:\Andriaus\Projects\my-projects\app-volley-registration"
powershell -ExecutionPolicy Bypass -File prepare-deploy-staging.ps1
powershell -ExecutionPolicy Bypass -File prepare-deploy.ps1
```

---

## 📋 What Each Script Does

### `prepare-deploy-staging.ps1`
1. Builds React frontend (`npm run build`)
2. Cleans/creates `deploy-staging/` folder
3. Copies frontend build files
4. Copies API files
5. **Replaces `config.php` with `config-staging.php`** (automatic environment switch)
6. Removes all `.sql` files (security)
7. Runs security checks (.htaccess, dangerous functions)
8. Verifies staging config (APP_ENV='staging', CORS origins)

**Result:** `deploy-staging/api/config.php` will have `APP_ENV='staging'` and staging DB credentials.

### `prepare-deploy.ps1`
1. Builds React frontend (`npm run build`)
2. Cleans/creates `deploy/` folder
3. Copies frontend build files
4. Copies API files (keeps original `config.php`)
5. Removes all `.sql` files (security)
6. Runs security checks

**Result:** `deploy/api/config.php` will have `APP_ENV='production'` and production DB credentials.

---

## 🔐 Environment Configuration

### STAGING Environment
- **URL:** `staging.godeliauskas.com`
- **Config file:** `api/config-staging.php` (NOT in Git - contains real credentials)
- **Database:**
  - Name: `goskajss_staging_volley_registration`
  - User: `goskajss_staging_volley_registration`
  - Password: `AErKbgRRkbe63eCvGZPg`
- **APP_ENV:** `'staging'`
- **ALLOWED_ORIGINS:** `staging.godeliauskas.com`, `localhost:5173`

### PRODUCTION Environment
- **URL:** `volley.godeliauskas.com`
- **Config file:** `api/config.php` (in Git, but uses `secrets.php` for DB credentials)
- **Database:** Production database (credentials in `api/secrets.php`, NOT in Git)
- **APP_ENV:** `'production'`
- **ALLOWED_ORIGINS:** `volley.godeliauskas.com`

---

## ⚠️ IMPORTANT Security Rules

### NEVER commit to Git:
- ❌ `api/secrets.php` (production DB credentials)
- ❌ `api/config-staging.php` (staging DB credentials)
- ❌ `deploy/` folder
- ❌ `deploy-staging/` folder

### ALWAYS commit to Git:
- ✅ `api/config.php` (production config, uses secrets.php)
- ✅ `api/config-staging.example.php` (template only)
- ✅ `api/secrets.example.php` (template only)
- ✅ `prepare-deploy.ps1`
- ✅ `prepare-deploy-staging.ps1`
- ✅ All documentation (*.md files)

These rules are enforced in `.gitignore`.

---

## 🔍 Verification After Build

### Check Staging Build
```powershell
# Verify APP_ENV is 'staging'
Get-Content deploy-staging\api\config.php | Select-String 'APP_ENV'
# Should output: define('APP_ENV', 'staging');

# Verify staging CORS
Get-Content deploy-staging\api\config.php | Select-String 'staging.godeliauskas.com'
# Should find: 'https://staging.godeliauskas.com'

# Count files
Get-ChildItem deploy-staging -Recurse -File | Measure-Object
# Should be ~41 files
```

### Check Production Build
```powershell
# Verify APP_ENV is 'production'
Get-Content deploy\api\config.php | Select-String 'APP_ENV'
# Should output: define('APP_ENV', 'production');

# Verify production CORS
Get-Content deploy\api\config.php | Select-String 'volley.godeliauskas.com'
# Should find: 'https://volley.godeliauskas.com'

# Count files
Get-ChildItem deploy -Recurse -File | Measure-Object
# Should be ~41 files
```

---

## 🐛 Common Issues & Solutions

### Issue: `api/config-staging.php not found`
**Cause:** First-time setup, file doesn't exist.

**Solution:**
```powershell
Copy-Item api/config-staging.example.php api/config-staging.php
# Then verify credentials in api/config-staging.php match staging DB
```

### Issue: Frontend build fails
**Solution:**
```powershell
cd frontend
npm install
npm run build
cd ..
# Then re-run deployment script
```

### Issue: Script fails with "execution policy"
**Solution:** Already handled in commands with `-ExecutionPolicy Bypass`

### Issue: Warning about `exec` function in login.php
**This is expected.** The script scans for potentially dangerous functions. This is a reminder to review, not necessarily an error.

---

## 📝 Workflow for AI Assistants

When user requests deployment changes:

1. **Understand the request:**
   - Are they deploying to staging, production, or both?
   - Have they made code changes that need to be included?

2. **Build the packages:**
   - Always build staging first (even if they only ask for production)
   - Use the PowerShell commands above

3. **Verify builds:**
   - Check that files were created
   - Verify environment settings (APP_ENV)
   - Report any warnings

4. **Inform the user:**
   - Tell them which folder to upload (`deploy-staging/` or `deploy/`)
   - Tell them where to upload (FTP server)
   - Remind them to test staging before production

5. **Never:**
   - Don't commit `config-staging.php` or `secrets.php`
   - Don't skip staging when deploying to production
   - Don't modify the deployment scripts without user request

---

## 🎯 Example AI Responses

### User: "Deploy to staging"
```
I'll build the staging deployment package for you.

[Run: prepare-deploy-staging.ps1]

✅ Staging package built successfully:
- 41 files ready in deploy-staging/
- APP_ENV: 'staging'
- Database: goskajss_staging_volley_registration
- CORS: staging.godeliauskas.com

Next steps:
1. Upload all contents of deploy-staging/ to staging.godeliauskas.com via FTP
2. Test the application at https://staging.godeliauskas.com
```

### User: "Deploy to production"
```
⚠️ Before deploying to production, have you tested on staging?

If yes, I'll build the production package:
[Run: prepare-deploy.ps1]

✅ Production package built successfully:
- 41 files ready in deploy/
- APP_ENV: 'production'
- Database: Production DB
- CORS: volley.godeliauskas.com

Next steps:
1. Upload all contents of deploy/ to volley.godeliauskas.com via FTP
2. Verify the application at https://volley.godeliauskas.com
```

### User: "Build both staging and production"
```
I'll build both deployment packages.

[Run: prepare-deploy-staging.ps1]
✅ Staging package ready in deploy-staging/

[Run: prepare-deploy.ps1]
✅ Production package ready in deploy/

Both packages are ready. Upload instructions:
1. First: Upload deploy-staging/ → staging.godeliauskas.com
2. Test staging thoroughly
3. Then: Upload deploy/ → volley.godeliauskas.com
```

---

## 📚 Related Documentation for Users

- **[DEPLOYMENT-WORKFLOW.md](DEPLOYMENT-WORKFLOW.md)** - Complete staging → production workflow
- **[DEPLOYMENT-STAGING.md](DEPLOYMENT-STAGING.md)** - Staging environment setup
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[README.md](README.md)** - General project information

---

## 🔄 Typical Development Cycle

```
1. Developer makes code changes
   ↓
2. AI runs: prepare-deploy-staging.ps1
   ↓
3. Developer uploads deploy-staging/ to staging FTP
   ↓
4. Developer tests on staging.godeliauskas.com
   ↓
5. If bugs found → Go back to step 1
   ↓
6. If OK → AI runs: prepare-deploy.ps1
   ↓
7. Developer uploads deploy/ to production FTP
   ↓
8. Verify on volley.godeliauskas.com
```

---

## 💡 Quick Reference Card

| Task | Command | Output |
|------|---------|--------|
| Build staging | `prepare-deploy-staging.ps1` | `deploy-staging/` |
| Build production | `prepare-deploy.ps1` | `deploy/` |
| Upload staging | FTP client | `staging.godeliauskas.com` |
| Upload production | FTP client | `volley.godeliauskas.com` |
| Test staging | Browser | `https://staging.godeliauskas.com` |
| Test production | Browser | `https://volley.godeliauskas.com` |

---

**Last Updated:** 2026-01-01
**Project:** Volley Registration App
**Environments:** Staging + Production
**Build System:** PowerShell scripts
