<?php
/**
 * Set Password Endpoint
 *
 * Leidžia nustatyti slaptažodį naujiems OAuth vartotojams arba pakeisti esamą.
 *
 * POST /api/set-password.php
 *
 * Request Body (naujas vartotojas su temp_token):
 * {
 *   "temp_token": "temporary_token_from_google_auth",
 *   "password": "secure_password"
 * }
 *
 * Request Body (prisijungęs vartotojas):
 * {
 *   "auth_token": "current_auth_token",
 *   "password": "new_password"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "token": "new_auth_token",
 *     "user": {...}
 *   },
 *   "message": "Slaptažodis nustatytas sėkmingai"
 * }
 *
 * @package Volley\API\Auth
 * @author Coding Agent
 * @version 1.0
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

// Only allow POST requests
requirePost();

// Get JSON input
$input = getJsonInput();

// Validate required fields - either temp_token or auth_token required
if (empty($input['temp_token']) && empty($input['auth_token'])) {
    sendError('Reikalingas temp_token arba auth_token', 400);
}

if (empty($input['password'])) {
    sendError('Trūksta slaptažodžio', 400);
}

// Sanitize inputs
$tempToken = isset($input['temp_token']) ? trim($input['temp_token']) : null;
$authToken = isset($input['auth_token']) ? trim($input['auth_token']) : null;
$password = $input['password'];

// Get client IP for rate limiting
$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

// Rate limiting - 5 attempts per 15 minutes per IP
checkRateLimit($clientIp, 'set_password', 5, 15);

// =====================================================
// Validate password strength
// =====================================================

$passwordErrors = validatePasswordStrength($password);
if (!empty($passwordErrors)) {
    sendError('Slaptažodis neatitinka reikalavimų', 400, [
        'validation_errors' => $passwordErrors
    ]);
}

try {
    $pdo = getDbConnection();
    $pdo->beginTransaction();

    $userId = null;
    $user = null;

    // =====================================================
    // Scenario 1: Using temp_token (new OAuth user)
    // =====================================================

    if ($tempToken) {
        // Find temp token
        $stmt = $pdo->prepare("
            SELECT id, user_id, expires_at
            FROM oauth_temp_tokens
            WHERE token = ?
        ");
        $stmt->execute([$tempToken]);
        $tokenRecord = $stmt->fetch();

        if (!$tokenRecord) {
            $pdo->rollBack();
            sendError('Neteisingas arba pasibaigęs temp_token', 401);
        }

        // Check expiration (10 minutes)
        if (strtotime($tokenRecord['expires_at']) < time()) {
            // Delete expired token
            $stmt = $pdo->prepare("DELETE FROM oauth_temp_tokens WHERE id = ?");
            $stmt->execute([$tokenRecord['id']]);

            $pdo->rollBack();
            sendError('Temp_token galiojimas pasibaigė. Prisijunkite iš naujo.', 401);
        }

        $userId = (int) $tokenRecord['user_id'];

        // Get user data
        $stmt = $pdo->prepare("
            SELECT id, name, surname, email, role, balance, is_active, parent_id, avatar
            FROM users
            WHERE id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            $pdo->rollBack();
            sendError('Vartotojas nerastas', 404);
        }

        // Delete used temp token
        $stmt = $pdo->prepare("DELETE FROM oauth_temp_tokens WHERE id = ?");
        $stmt->execute([$tokenRecord['id']]);
    }

    // =====================================================
    // Scenario 2: Using auth_token (logged in user changing password)
    // =====================================================

    if ($authToken && !$userId) {
        $stmt = $pdo->prepare("
            SELECT id, name, surname, email, role, balance, is_active, parent_id, avatar,
                   token_expiry, last_activity
            FROM users
            WHERE auth_token = ? AND is_active = 1
        ");
        $stmt->execute([$authToken]);
        $user = $stmt->fetch();

        if (!$user) {
            $pdo->rollBack();
            sendError('Neteisingas auth_token', 401);
        }

        // Check token expiration
        if ($user['token_expiry'] && strtotime($user['token_expiry']) < time()) {
            $pdo->rollBack();
            sendError('Auth_token galiojimas pasibaigė', 401);
        }

        // Check inactivity timeout (30 minutes)
        if ($user['last_activity']) {
            $lastActivity = strtotime($user['last_activity']);
            $inactivityTimeout = 30 * 60;

            if ((time() - $lastActivity) > $inactivityTimeout) {
                $pdo->rollBack();
                sendError('Sesija pasibaigė dėl neaktyvumo', 401);
            }
        }

        $userId = (int) $user['id'];
    }

    if (!$userId || !$user) {
        $pdo->rollBack();
        sendError('Nepavyko identifikuoti vartotojo', 400);
    }

    // =====================================================
    // Hash and save password
    // =====================================================

    // Hash password with bcrypt cost 12 (high security)
    $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

    if ($passwordHash === false) {
        $pdo->rollBack();
        error_log("Password hashing failed for user_id=$userId");
        sendError('Nepavyko užšifruoti slaptažodžio', 500);
    }

    // Update user with password and set password_required = 1
    $stmt = $pdo->prepare("
        UPDATE users
        SET password_hash = ?, password_required = 1
        WHERE id = ?
    ");
    $stmt->execute([$passwordHash, $userId]);

    // =====================================================
    // Generate new auth token
    // =====================================================

    $token = generateToken(32);
    $tokenExpiry = date('Y-m-d H:i:s', strtotime('+' . TOKEN_EXPIRY_HOURS . ' hours'));

    $stmt = $pdo->prepare("
        UPDATE users
        SET auth_token = ?, token_expiry = ?, last_activity = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$token, $tokenExpiry, $userId]);

    // Get children (sub-accounts) if any
    $stmt = $pdo->prepare("
        SELECT id, name, email
        FROM users
        WHERE parent_id = ? AND is_active = 1
    ");
    $stmt->execute([$userId]);
    $children = $stmt->fetchAll();

    // Build user response
    $userData = [
        'id' => (int) $user['id'],
        'name' => $user['name'],
        'surname' => $user['surname'] ?? '',
        'email' => $user['email'],
        'role' => $user['role'],
        'balance' => $user['balance'],
        'parent_id' => $user['parent_id'] ? (int) $user['parent_id'] : null,
        'avatar' => $user['avatar'] ?? 'Midnight',
        'children' => $children
    ];

    // Set httpOnly cookie for secure token storage
    $cookieOptions = [
        'expires' => 0, // Session cookie
        'path' => '/',
        'domain' => '',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict'
    ];
    setcookie('auth_token', $token, $cookieOptions);

    $pdo->commit();

    // Log password set event
    error_log("Password set successfully: user_id=$userId, email={$user['email']}");

    // Reset rate limit after successful password set
    resetRateLimit($clientIp, 'set_password');

    sendSuccess([
        'token' => $token,
        'user' => $userData
    ], 'Slaptažodis nustatytas sėkmingai');

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Set password database error: " . $e->getMessage());
    error_log($e->getTraceAsString());

    if (APP_ENV === 'development') {
        sendError('Duomenų bazės klaida: ' . $e->getMessage(), 500);
    } else {
        sendError('Sistemos klaida. Bandykite vėliau.', 500);
    }
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Set password unexpected error: " . $e->getMessage());
    error_log($e->getTraceAsString());

    sendError('Nenumatyta klaida. Bandykite vėliau.', 500);
}
