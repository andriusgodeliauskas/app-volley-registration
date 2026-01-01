# Deployment Workflow - Staging & Production

This document describes the complete deployment workflow for the Volley Registration App with **Staging** and **Production** environments.

## 🎯 Overview

We use a **two-stage deployment process**:
1. **Staging** (`staging.godeliauskas.com`) - Testing environment
2. **Production** (`volley.godeliauskas.com`) - Live environment

```
Code Changes → Staging Deploy → Testing → Production Deploy
```

---

## 🔄 Complete Deployment Flow

### Step 1: Make Code Changes
Make your changes to the codebase (frontend, API, database, etc.)

### Step 2: Build STAGING
Run the staging deployment script:

```powershell
./prepare-deploy-staging.ps1
```

This will:
- Build the frontend with production settings
- Clean the `deploy-staging/` directory
- Copy frontend build to `deploy-staging/`
- Copy API files to `deploy-staging/api/`
- **Replace** `config.php` with `config-staging.php` (staging environment)
- Remove all `.sql` files (security)
- Run security checks

**Output:** `deploy-staging/` folder ready for upload

### Step 3: Upload to STAGING
1. Open your FTP client (FileZilla, etc.)
2. Connect to `staging.godeliauskas.com`
3. Navigate to the public root directory (e.g., `public_html` or `www`)
4. Upload **all contents** from `deploy-staging/` folder

### Step 4: Test on STAGING
Access `https://staging.godeliauskas.com` and thoroughly test:

- ✅ User registration and login
- ✅ Event registration flow
- ✅ Payment/wallet functionality
- ✅ Admin features
- ✅ Group management
- ✅ Database operations
- ✅ API responses
- ✅ Frontend UI/UX

**If you find bugs:** Go back to Step 1, fix the issues, and repeat.

### Step 5: Build PRODUCTION
Once staging testing is complete and everything works:

```powershell
./prepare-deploy.ps1
```

This will:
- Build the frontend with production settings
- Clean the `deploy/` directory
- Copy frontend build to `deploy/`
- Copy API files to `deploy/api/`
- **Keep** `config.php` as production configuration
- Remove all `.sql` files (security)
- Run security checks

**Output:** `deploy/` folder ready for upload

### Step 6: Upload to PRODUCTION
1. Open your FTP client
2. Connect to `volley.godeliauskas.com`
3. Navigate to the public root directory
4. Upload **all contents** from `deploy/` folder

### Step 7: Verify PRODUCTION
Access `https://volley.godeliauskas.com` and verify:
- ✅ App loads correctly
- ✅ Critical flows work (login, registration)
- ✅ No errors in browser console

---

## 📂 Environment Comparison

| Aspect | Staging | Production |
|--------|---------|------------|
| **URL** | `staging.godeliauskas.com` | `volley.godeliauskas.com` |
| **Script** | `prepare-deploy-staging.ps1` | `prepare-deploy.ps1` |
| **Folder** | `deploy-staging/` | `deploy/` |
| **Config** | `config-staging.php` | `config.php` |
| **Database** | `goskajss_staging_volley_registration` | Production DB |
| **APP_ENV** | `'staging'` | `'production'` |
| **Purpose** | Testing, QA, Bug fixes | Live users |

---

## ⚡ Quick Reference Commands

```powershell
# Build Staging
./prepare-deploy-staging.ps1

# Build Production
./prepare-deploy.ps1
```

---

## ⚠️ Important Notes

### Database Changes
If you've made database schema changes:
1. **Import SQL changes to staging DB first** via phpMyAdmin/control panel
2. Test thoroughly on staging
3. **Only then** import to production DB
4. Deploy production code

### Never Skip Staging
**Always deploy to staging first**, even for "small" changes. This prevents production issues.

### Config Files Security
- ❌ **NEVER** commit `api/config-staging.php` to Git
- ❌ **NEVER** commit `api/secrets.php` to Git
- ✅ Only commit `.example.php` templates

### FTP Upload Best Practices
- Upload the **entire contents** of `deploy/` or `deploy-staging/` folder
- Don't upload the folder itself, upload what's **inside** it
- Ensure `.htaccess` files are uploaded (they're hidden files)

---

## 🐛 Troubleshooting

### Issue: API returns "Database connection failed"
- Check that `secrets.php` exists on the server
- Verify database credentials in staging/production config
- Ensure database server is running

### Issue: CORS errors in browser console
- Check `ALLOWED_ORIGINS` in `config.php` or `config-staging.php`
- Ensure the domain matches exactly (http vs https)

### Issue: White screen after deployment
- Check browser console for errors
- Verify all files uploaded correctly
- Check that `index.html` exists in root

### Issue: Changes not appearing after deployment
- Clear browser cache (Ctrl+F5)
- Check FTP upload completed successfully
- Verify you uploaded to the correct directory

---

## 📋 Deployment Checklist

**Before deploying to staging:**
- [ ] All code changes committed to Git
- [ ] Frontend builds without errors
- [ ] No console errors in local development

**Before deploying to production:**
- [ ] Staging fully tested
- [ ] All bugs fixed
- [ ] Database changes tested on staging
- [ ] Team/client approval received (if required)

**After deploying to production:**
- [ ] Verify app loads
- [ ] Test critical user flows
- [ ] Monitor for errors
- [ ] Notify users if needed (maintenance, new features)

---

## 🔗 Related Documentation

- [Staging Setup Guide](DEPLOYMENT-STAGING.md) - First-time staging setup
- [Production Deployment](DEPLOYMENT.md) - Production deployment details
- [README](README.md) - General project setup
