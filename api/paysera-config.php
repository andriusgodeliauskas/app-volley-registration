<?php
/**
 * Paysera Payment Gateway Configuration
 * 
 * This file contains Paysera-specific settings for automatic wallet top-ups.
 * Credentials are loaded from secrets.php (gitignored).
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/secrets.php';

// Paysera Project Configuration
// These constants should be defined in secrets.php:
// - PAYSERA_PROJECT_ID_SECRET
// - PAYSERA_PROJECT_PASSWORD_SECRET

if (!defined('PAYSERA_PROJECT_ID_SECRET') || !defined('PAYSERA_PROJECT_PASSWORD_SECRET')) {
    throw new Exception('Paysera credentials not configured. Please add PAYSERA_PROJECT_ID_SECRET and PAYSERA_PROJECT_PASSWORD_SECRET to secrets.php');
}

define('PAYSERA_PROJECT_ID', PAYSERA_PROJECT_ID_SECRET);
define('PAYSERA_PROJECT_PASSWORD', PAYSERA_PROJECT_PASSWORD_SECRET);

// Test mode (1 = test environment, 0 = production)
// Automatically set based on APP_ENV
define('PAYSERA_TEST_MODE', APP_ENV === 'production' ? 0 : 1);

// Payment settings
define('PAYSERA_CURRENCY', 'EUR');
define('PAYSERA_COUNTRY', 'LT');

// Minimum and maximum top-up amounts
define('PAYSERA_MIN_AMOUNT', 1);
define('PAYSERA_MAX_AMOUNT', 1000);

/**
 * Get Paysera callback URLs based on environment
 * 
 * @return array Associative array with accepturl, cancelurl, callbackurl
 */
function getPayseraCallbackUrls(): array
{
    $baseUrl = APP_ENV === 'production' 
        ? 'https://volley.godeliauskas.com' 
        : 'https://staging.godeliauskas.com';
    
    return [
        'accepturl' => $baseUrl . '/api/paysera_accept.php',
        'cancelurl' => $baseUrl . '/api/paysera_cancel.php',
        'callbackurl' => $baseUrl . '/api/paysera_callback.php',
    ];
}

/**
 * Get frontend URL for redirects
 * 
 * @return string Frontend base URL
 */
function getFrontendUrl(): string
{
    return APP_ENV === 'production'
        ? 'https://volley.godeliauskas.com'
        : 'https://staging.godeliauskas.com';
}
