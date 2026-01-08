# ==========================================
# Volley App Deployment Script
# ==========================================

$ErrorActionPreference = "Stop"

Write-Host "Starting deployment preparation..." -ForegroundColor Cyan

# 1. Build Frontend
Write-Host "Building Frontend..." -ForegroundColor Yellow
Set-Location frontend
$env:VITE_API_URL = '/api'
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend build failed!"
}
Set-Location ..

# 2. Prepare Deploy Directory
Write-Host "Cleaning deploy directory..." -ForegroundColor Yellow
if (Test-Path "deploy") {
    Remove-Item "deploy" -Recurse -Force
}
New-Item -ItemType Directory -Path "deploy" | Out-Null
New-Item -ItemType Directory -Path "deploy/api" | Out-Null

# 3. Copy Files
Write-Host "Copying files..." -ForegroundColor Yellow

# Copy Frontend
Copy-Item "frontend/dist/*" "deploy/" -Recurse -Force

# Copy API
# Exclude sensitive dev files or git files if any
Get-ChildItem "api" -Exclude "*.git*", "*.swp" | Copy-Item -Destination "deploy/api" -Recurse -Force

# 4. Remove Database Files (Requirement: No SQL files)
Write-Host "Removing .sql files..." -ForegroundColor Yellow
Get-ChildItem "deploy" -Include "*.sql" -Recurse | Remove-Item -Force

# 5. Security Checks
Write-Host "Running security checks..." -ForegroundColor Yellow

$apiPath = "deploy/api"
$htaccess = Join-Path $apiPath ".htaccess"
$config = Join-Path $apiPath "config.php"

# Check 5.1: .htaccess existence
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

# Check 5.2: Scan for dangerous functions
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

Write-Host "Deployment package ready in /deploy" -ForegroundColor Green
Write-Host "Upload contents of deploy folder to your FTP server." -ForegroundColor Cyan
