<?php
/**
 * Volley Registration App - STAGING Configuration Template
 *
 * INSTRUCTIONS:
 * 1. Copy this file to config-staging.php
 * 2. Fill in your staging database credentials
 * 3. This file is used by prepare-deploy-staging.ps1 to build staging deployment
 *
 * IMPORTANT: config-staging.php is git-ignored and should NEVER be committed!
 */

// Prevent direct access
if (basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
    http_response_code(403);
    exit('Direct access forbidden');
}

// =====================================================
// STAGING DATABASE CONFIGURATION
// =====================================================

// Option 1: Use secrets.php (recommended if you have multiple environments)
// Uncomment the line below and create api/secrets-staging.php
// if (file_exists(__DIR__ . '/secrets-staging.php')) {
//     require_once __DIR__ . '/secrets-staging.php';
// }

// Option 2: Define credentials directly here
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_staging_database_name');
define('DB_USER', 'your_staging_database_user');
define('DB_PASS', 'your_staging_database_password');

if (!defined('DB_CHARSET')) {
    define('DB_CHARSET', 'utf8mb4');
}

// =====================================================
// APPLICATION SETTINGS
// =====================================================

define('APP_NAME', 'Volley Registration App');
define('APP_ENV', 'staging'); // IMPORTANT: Must be 'staging' for staging environment

// =====================================================
// CORS SETTINGS - Allowed Origins
// =====================================================

define('ALLOWED_ORIGINS', [
    'https://staging.godeliauskas.com',
    'http://staging.godeliauskas.com',
    'http://localhost:5173',    // For local development
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
]);

// =====================================================
// TOKEN SETTINGS
// =====================================================

define('TOKEN_EXPIRY_HOURS', 24 * 7); // 7 days
