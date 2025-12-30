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
define('DB_HOST', 'localhost');
define('DB_NAME', 'goskajss_volley');
define('DB_USER', 'goskajss_volley');
define('DB_PASS', 'hPbd5YsARQ9f32E7g4bQ');
define('DB_CHARSET', 'utf8mb4');

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
