<?php
/**
 * Volley Registration App - Configuration
 * 
 * Production configuration for volley.godeliauskas.com
 */

// Prevent direct access
if (basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
    http_response_code(403);
    exit('Direct access forbidden');
}

// Database Configuration
if (file_exists(__DIR__ . '/secrets.php')) {
    require_once __DIR__ . '/secrets.php';
} else {
    // Fallback or Error if secrets are missing
    // For development, you might want to stop specific execution or use defaults only if safe
    // Ideally, force the use of secrets.php
    die('Database configuration missing. Please rename api/secrets.example.php to api/secrets.php and configure it.');
}

if (!defined('DB_CHARSET')) {
    define('DB_CHARSET', 'utf8mb4');
}

// Application Settings
define('APP_NAME', 'Volley Registration App');
define('APP_ENV', 'production'); // 'development' or 'production'

// CORS Settings - Allowed Origins
define('ALLOWED_ORIGINS', [
    'https://volley.godeliauskas.com',
    'http://volley.godeliauskas.com',
    'http://localhost:5173',    // For local development
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
]);

// Token Settings
define('TOKEN_EXPIRY_HOURS', 24 * 7); // 7 days
