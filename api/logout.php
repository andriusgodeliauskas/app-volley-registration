<?php
/**
 * Volley Registration App - Logout Endpoint
 *
 * POST /api/logout.php
 * Invalidates user token and clears httpOnly cookie
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

// Only allow POST requests
requirePost();

// Get current user (if authenticated)
$currentUser = getAuthUser();

// If user is authenticated, invalidate their token
if ($currentUser !== null) {
    try {
        $pdo = getDbConnection();

        // Invalidate token in database and clear last_activity
        $stmt = $pdo->prepare("
            UPDATE users
            SET auth_token = NULL,
                token_expiry = NULL,
                last_activity = NULL
            WHERE id = ?
        ");
        $stmt->execute([$currentUser['id']]);

    } catch (PDOException $e) {
        // Log error but don't fail logout
        error_log('Logout DB error: ' . $e->getMessage());
    }
}

// Clear httpOnly cookie (most important - always do this)
$cookieOptions = [
    'expires' => time() - 3600, // Expire in the past
    'path' => '/',
    'domain' => '',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Strict'
];
setcookie('auth_token', '', $cookieOptions);

// Clear session if using PHP sessions
if (session_status() === PHP_SESSION_ACTIVE) {
    session_destroy();
}

sendSuccess(null, 'Logged out successfully');
