# ==========================================
# Volley App STAGING Deployment Script
# ==========================================

$ErrorActionPreference = "Stop"

Write-Host "Starting STAGING deployment preparation..." -ForegroundColor Cyan

# 1. Build Frontend for STAGING
Write-Host "Building Frontend for STAGING..." -ForegroundColor Yellow
Set-Location frontend
$env:VITE_API_URL = '/api'
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend build failed!"
}
Set-Location ..

# 2. Prepare Deploy-Staging Directory
Write-Host "Cleaning deploy-staging directory..." -ForegroundColor Yellow
if (Test-Path "deploy-staging") {
    Remove-Item "deploy-staging" -Recurse -Force
}
New-Item -ItemType Directory -Path "deploy-staging" | Out-Null
New-Item -ItemType Directory -Path "deploy-staging/api" | Out-Null

# 3. Copy Files
Write-Host "Copying files..." -ForegroundColor Yellow

# Copy Frontend
Copy-Item "frontend/dist/*" "deploy-staging/" -Recurse -Force

# Copy API
Get-ChildItem "api" -Exclude "*.git*", "*.swp" | Copy-Item -Destination "deploy-staging/api" -Recurse -Force

# 4. Replace config.php with config-staging.php
Write-Host "Configuring STAGING environment..." -ForegroundColor Yellow
if (Test-Path "api/config-staging.php") {
    Copy-Item "api/config-staging.php" "deploy-staging/api/config.php" -Force
    Write-Host "Staging config applied." -ForegroundColor Green
} else {
    Write-Warning "api/config-staging.php not found! Using default config.php"
    Write-Warning "Please create api/config-staging.php from api/config-staging.example.php"
}

# 4.1. Replace secrets.php with secrets-staging.php
if (Test-Path "api/secrets-staging.php") {
    Copy-Item "api/secrets-staging.php" "deploy-staging/api/secrets.php" -Force
    Write-Host "Staging secrets applied (DB, Google OAuth, Paysera, SMTP)." -ForegroundColor Green
} else {
    Write-Warning "api/secrets-staging.php not found! Using production secrets.php"
    Write-Warning "Please create api/secrets-staging.php with staging credentials"
}

# 4.2. Copy vendor/ directory (Composer dependencies)
Write-Host "Checking Composer dependencies..." -ForegroundColor Yellow
if (Test-Path "vendor") {
    Copy-Item "vendor" "deploy-staging/" -Recurse -Force
    Write-Host "Vendor directory copied (PHPMailer dependencies)." -ForegroundColor Green
} else {
    Write-Warning "vendor/ directory not found!"
    Write-Warning "Run 'composer install' locally OR on the server after deployment"
    Write-Warning "See COMPOSER_SETUP.md for instructions"
}

# 5. Remove Database Files (Requirement: No SQL files)
Write-Host "Removing .sql files..." -ForegroundColor Yellow
Get-ChildItem "deploy-staging" -Include "*.sql" -Recurse | Remove-Item -Force

# 6. Security Checks
Write-Host "Running security checks..." -ForegroundColor Yellow

$apiPath = "deploy-staging/api"
$htaccess = Join-Path $apiPath ".htaccess"
$config = Join-Path $apiPath "config.php"

# Check 6.1: .htaccess existence
if (-not (Test-Path $htaccess)) {
    Write-Warning "MISSING .htaccess in API folder! This is critical for security."
} else {
    # Check content of .htaccess for protected files
    $htaccessContent = Get-Content $htaccess -Raw
    if ($htaccessContent -notmatch "FilesMatch.*config") {
        Write-Warning ".htaccess does not seem to protect config files!"
    } else {
        Write-Host ".htaccess found and rules check passed." -ForegroundColor Green
    }
}

# Check 6.2: Scan for dangerous functions
$dangerousFunctions = @("eval", "exec", "shell_exec", "system", "passthru")
$phpFiles = Get-ChildItem "$apiPath/*.php" -Recurse

foreach ($file in $phpFiles) {
    $content = Get-Content $file.FullName
    foreach ($func in $dangerousFunctions) {
        if ($content | Select-String -Pattern "$func\(") {
             Write-Warning "Possible dangerous function $func found in $($file.Name). Please review."
        }
    }
}

# 7. Verify STAGING config
Write-Host "Verifying STAGING configuration..." -ForegroundColor Yellow
$configContent = Get-Content $config -Raw
if ($configContent -match "APP_ENV.*staging") {
    Write-Host "APP_ENV set to 'staging' - OK" -ForegroundColor Green
} else {
    Write-Warning "APP_ENV is not 'staging'! Please verify config-staging.php"
}

if ($configContent -match "staging\.godeliauskas\.com") {
    Write-Host "ALLOWED_ORIGINS includes staging.godeliauskas.com - OK" -ForegroundColor Green
} else {
    Write-Warning "ALLOWED_ORIGINS does not include staging.godeliauskas.com!"
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "STAGING deployment package ready in /deploy-staging" -ForegroundColor Green
Write-Host "Upload contents of deploy-staging folder to staging.godeliauskas.com FTP" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
