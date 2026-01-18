<?php
/**
 * Google OAuth Configuration Endpoint
 *
 * Grąžina public Google OAuth konfigūraciją frontend'ui.
 * SVARBU: NIEKADA negrąžinti client_secret!
 *
 * GET /api/google-config.php
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "client_id": "your_client_id.apps.googleusercontent.com",
 *     "redirect_uri": "https://volley.godeliauskas.com"
 *   }
 * }
 *
 * @package Volley\API\Config
 * @author Coding Agent
 * @version 1.0
 */

require_once __DIR__ . '/db.php';

// Only allow GET requests
requireGet();

// Get client IP for rate limiting
$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

// Rate limiting - 100 requests per minute per IP (generous for public endpoint)
checkRateLimit($clientIp, 'google_config', 100, 1);

try {
    // Determine redirect URI based on environment
    // Must include /auth/google/callback path for OAuth flow
    $redirectUri = match (APP_ENV) {
        'production' => 'https://volley.godeliauskas.com/auth/google/callback',
        'staging' => 'https://staging.godeliauskas.com/auth/google/callback',
        default => 'http://localhost:5173/auth/google/callback'
    };

    // SECURITY: Only return client_id, NEVER client_secret
    $config = [
        'client_id' => GOOGLE_CLIENT_ID,
        'redirect_uri' => $redirectUri
    ];

    sendSuccess($config, 'Google OAuth konfigūracija');

} catch (Exception $e) {
    error_log("Google config error: " . $e->getMessage());

    if (APP_ENV === 'development') {
        sendError('Klaida: ' . $e->getMessage(), 500);
    } else {
        sendError('Sistemos klaida', 500);
    }
}
