# Deployment Guide

This document describes the deployment process for the Volley Registration App.

## 🚀 Quick Deploy

To prepare the files for deployment, run the automated script in PowerShell:

```powershell
./prepare-deploy.ps1
```

This script will:
1.  **Build the Frontend** (React) with production settings (`/api` base URL).
2.  **Clean** the `deploy/` directory to ensure no old files remain.
3.  **Copy** the frontend build and API files to `deploy/`.
4.  **Remove** any SQL database files (security requirement).
5.  **Run Security Checks**:
    *   Verifies `.htaccess` exists and protects config files.
    *   Scans PHP files for dangerous functions (like `eval`, `exec`).

## 📂 Uploading to Server

1.  Run the script above.
2.  Open your FTP client (FileZilla, etc.).
3.  Navigate to the `deploy` folder on your local machine.
4.  Upload **ALL** contents of `deploy/` to your server's `public_html` (or subdomain root).

## 🔒 Security Measures

The deployment script enforces the following policies:
*   **No SQL Files**: Database dumps are stripped to prevent accidental exposure of schema/data.
*   **API Protection**: The `api/.htaccess` file must exist to block direct access to `config.php` and prevent directory listing.
*   **Code Scanning**: Basic scan for execution functions is performed.

## ⚠️ Database Changes

If you have made changes to the database schema:
1.  **Do NOT upload `database.sql` to public folders.**
2.  Import `database.sql` manually via **phpMyAdmin** or your hosting control panel.
