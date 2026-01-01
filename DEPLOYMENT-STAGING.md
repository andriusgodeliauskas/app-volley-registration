# Staging Environment Setup & Deployment

This guide covers the **first-time setup** and ongoing deployment process for the **Staging** environment.

---

## 🎯 What is Staging?

Staging (`staging.godeliauskas.com`) is a **testing environment** that mirrors production. It allows you to:
- Test new features before going live
- Catch bugs without affecting real users
- Verify database changes safely
- Train new team members

---

## 🆕 First-Time Setup

### Prerequisites
- Git repository cloned
- Node.js and npm installed
- Access to staging FTP server
- Access to staging database (phpMyAdmin or control panel)

### 1. Create Staging Configuration

Copy the template to create your staging config:

**Windows PowerShell:**
```powershell
Copy-Item api/config-staging.example.php api/config-staging.php
```

**Mac/Linux:**
```bash
cp api/config-staging.example.php api/config-staging.php
```

### 2. Configure Staging Database

Open `api/config-staging.php` and verify the credentials:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'goskajss_staging_volley_registration');
define('DB_USER', 'goskajss_staging_volley_registration');
define('DB_PASS', 'AErKbgRRkbe63eCvGZPg');
```

**IMPORTANT:** This file is git-ignored. Never commit it to the repository!

### 3. Verify Environment Settings

Ensure the following settings are correct in `api/config-staging.php`:

```php
define('APP_ENV', 'staging');

define('ALLOWED_ORIGINS', [
    'https://staging.godeliauskas.com',
    'http://staging.godeliauskas.com',
    'http://localhost:5173',    // For local development
]);
```

### 4. Setup Staging Database

1. Access your hosting control panel (cPanel, DirectAdmin, etc.)
2. Open **phpMyAdmin**
3. Select the staging database: `goskajss_staging_volley_registration`
4. Import the database schema:
   - Click **Import**
   - Choose `database.sql` from your project
   - Click **Go**

### 5. Create Secrets File (Optional)

If your API uses `secrets.php`, create it:

```powershell
Copy-Item api/secrets.example.php api/secrets.php
```

Edit `api/secrets.php` with staging database credentials.

---

## 🚀 Deploy to Staging

### Step 1: Build Staging Package

Run the deployment script:

```powershell
./prepare-deploy-staging.ps1
```

**What it does:**
- Builds React frontend (`npm run build`)
- Creates/cleans `deploy-staging/` folder
- Copies frontend files
- Copies API files
- **Replaces `config.php` with `config-staging.php`** (automatic environment switch)
- Removes `.sql` files for security
- Runs security checks
- Verifies staging configuration

**Output:**
```
✓ Frontend built successfully
✓ deploy-staging/ folder created
✓ Files copied
✓ Staging config applied
✓ Security checks passed
✓ APP_ENV set to 'staging'
✓ ALLOWED_ORIGINS includes staging.godeliauskas.com

STAGING deployment package ready in /deploy-staging
Upload contents of deploy-staging folder to staging.godeliauskas.com FTP
```

### Step 2: Upload to Server

1. **Open FTP Client** (FileZilla, WinSCP, Cyberduck, etc.)

2. **Connect to Staging Server:**
   - Host: `staging.godeliauskas.com` (or your hosting FTP address)
   - Port: `21` (or `22` for SFTP)
   - Username: Your FTP username
   - Password: Your FTP password

3. **Navigate to Public Directory:**
   - Usually: `public_html`, `www`, or `htdocs`
   - If using subdomain, might be: `public_html/staging` or `staging.godeliauskas.com/public_html`

4. **Upload Files:**
   - Select **all contents** inside `deploy-staging/` folder
   - **Drag and drop** to the server public directory
   - **Important:** Upload the *contents*, not the folder itself
   - Ensure hidden files (`.htaccess`) are uploaded

### Step 3: Verify Deployment

1. **Open Browser:**
   - Navigate to `https://staging.godeliauskas.com`

2. **Check App Loads:**
   - You should see the Volley Registration App login page

3. **Test Basic Functions:**
   - Try logging in (use staging database test account)
   - Navigate through the app
   - Check browser console for errors (F12 → Console)

4. **Verify API Connection:**
   - If API calls fail, check:
     - `api/config.php` exists on server
     - `api/secrets.php` exists on server (if used)
     - Database credentials are correct
     - `.htaccess` files uploaded correctly

---

## 🔄 Regular Staging Deployment

For ongoing development, follow this simplified process:

1. **Make code changes** in your local environment
2. **Build staging:**
   ```powershell
   ./prepare-deploy-staging.ps1
   ```
3. **Upload `deploy-staging/` to FTP**
4. **Test on `staging.godeliauskas.com`**
5. **If all good** → Deploy to production (see [DEPLOYMENT-WORKFLOW.md](DEPLOYMENT-WORKFLOW.md))

---

## 📋 Staging Environment Details

| Setting | Value |
|---------|-------|
| **URL** | `staging.godeliauskas.com` |
| **Database Name** | `goskajss_staging_volley_registration` |
| **Database User** | `goskajss_staging_volley_registration` |
| **Database Password** | `AErKbgRRkbe63eCvGZPg` |
| **APP_ENV** | `'staging'` |
| **Deployment Folder** | `deploy-staging/` |
| **Deployment Script** | `prepare-deploy-staging.ps1` |

---

## ⚠️ Important Security Notes

### Never Commit Credentials
The following files contain sensitive data and are git-ignored:
- ❌ `api/config-staging.php`
- ❌ `api/secrets.php`
- ❌ `deploy-staging/` folder

### Only Commit Templates
These template files are safe to commit:
- ✅ `api/config-staging.example.php`
- ✅ `api/secrets.example.php`

### Database Backups
- Always backup staging database before major changes
- Use phpMyAdmin → Export to create backups

### FTP Security
- Use SFTP (port 22) instead of FTP (port 21) when possible
- Never share FTP credentials in Git commits or public channels

---

## 🐛 Troubleshooting

### Issue: Script fails with "Frontend build failed"
**Solution:**
```powershell
cd frontend
npm install
npm run build
cd ..
./prepare-deploy-staging.ps1
```

### Issue: "config-staging.php not found" warning
**Solution:**
```powershell
Copy-Item api/config-staging.example.php api/config-staging.php
# Edit api/config-staging.php with correct credentials
./prepare-deploy-staging.ps1
```

### Issue: API returns 500 error on staging
**Possible causes:**
1. Database credentials wrong in `config-staging.php`
2. `secrets.php` missing on server
3. Database not imported
4. `.htaccess` not uploaded

**Check:**
- Browser console (F12) for error messages
- Server error logs via hosting control panel

### Issue: CORS errors in browser
**Solution:**
Check that `ALLOWED_ORIGINS` in `api/config-staging.php` includes:
```php
'https://staging.godeliauskas.com',
'http://staging.godeliauskas.com',
```

### Issue: Changes don't appear after upload
**Solution:**
- Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
- Check you uploaded to the correct FTP directory
- Verify files uploaded successfully (check file dates/sizes)

---

## 📚 Next Steps

After staging is set up and working:
- Read [DEPLOYMENT-WORKFLOW.md](DEPLOYMENT-WORKFLOW.md) for the full deployment process
- Read [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Bookmark `staging.godeliauskas.com` for testing

---

## 🔗 Related Documentation

- [Full Deployment Workflow](DEPLOYMENT-WORKFLOW.md) - Staging → Production process
- [Production Deployment](DEPLOYMENT.md) - Production-specific guide
- [README](README.md) - General project setup
