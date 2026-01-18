<?php
/**
 * Google OAuth Authentication Endpoint
 *
 * Vykdo Google OAuth autentifikaciją ir vartotojo registraciją/prisijungimą.
 *
 * POST /api/google-auth.php
 *
 * Request Body:
 * {
 *   "code": "google_authorization_code",
 *   "redirect_uri": "https://volley.godeliauskas.com"
 * }
 *
 * Response (egzistuojantis vartotojas):
 * {
 *   "success": true,
 *   "data": {
 *     "requires_password": false,
 *     "token": "auth_token",
 *     "user": {...}
 *   }
 * }
 *
 * Response (naujas vartotojas):
 * {
 *   "success": true,
 *   "data": {
 *     "requires_password": true,
 *     "temp_token": "temporary_token",
 *     "user": {...}
 *   }
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

// Validate required fields
$missing = validateRequired($input, ['code', 'redirect_uri']);
if (!empty($missing)) {
    sendError('Trūksta būtinų laukų: ' . implode(', ', $missing), 400, [
        'missing_fields' => $missing
    ]);
}

// Sanitize inputs
$authCode = trim($input['code']);
$redirectUri = trim($input['redirect_uri']);

// Validate redirect_uri is HTTPS (production) or localhost (development)
if (APP_ENV === 'production' && !str_starts_with($redirectUri, 'https://')) {
    sendError('Redirect URI turi būti HTTPS', 400);
}

// Get client IP for rate limiting
$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

// Rate limiting - 10 attempts per 15 minutes per IP
checkRateLimit($clientIp, 'google_auth', 10, 15);

try {
    // =====================================================
    // Step 1: Exchange authorization code for access token
    // =====================================================

    $tokenEndpoint = 'https://oauth2.googleapis.com/token';

    $tokenParams = [
        'code' => $authCode,
        'client_id' => GOOGLE_CLIENT_ID,
        'client_secret' => GOOGLE_CLIENT_SECRET,
        'redirect_uri' => $redirectUri,
        'grant_type' => 'authorization_code'
    ];

    $ch = curl_init($tokenEndpoint);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenParams));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $tokenResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        $error = curl_error($ch);
        curl_close($ch);
        error_log("Google OAuth token exchange failed: $error");
        sendError('Nepavyko prisijungti su Google', 500);
    }

    curl_close($ch);

    if ($httpCode !== 200) {
        error_log("Google OAuth token exchange HTTP error: $httpCode - $tokenResponse");
        sendError('Neteisingas autorizacijos kodas', 400);
    }

    $tokenData = json_decode($tokenResponse, true);

    if (json_last_error() !== JSON_ERROR_NONE || !isset($tokenData['access_token'])) {
        error_log("Google OAuth invalid token response: $tokenResponse");
        sendError('Neteisingas Google atsakymas', 500);
    }

    $accessToken = $tokenData['access_token'];

    // =====================================================
    // Step 2: Get user info from Google
    // =====================================================

    $userInfoEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo';

    $ch = curl_init($userInfoEndpoint);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $userInfoResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        $error = curl_error($ch);
        curl_close($ch);
        error_log("Google OAuth user info request failed: $error");
        sendError('Nepavyko gauti vartotojo informacijos', 500);
    }

    curl_close($ch);

    if ($httpCode !== 200) {
        error_log("Google OAuth user info HTTP error: $httpCode - $userInfoResponse");
        sendError('Nepavyko gauti vartotojo informacijos', 500);
    }

    $googleUser = json_decode($userInfoResponse, true);

    if (json_last_error() !== JSON_ERROR_NONE || !isset($googleUser['email'])) {
        error_log("Google OAuth invalid user info response: $userInfoResponse");
        sendError('Neteisingas Google vartotojo atsakymas', 500);
    }

    // Extract user data
    $email = strtolower(trim($googleUser['email']));
    $googleId = $googleUser['id'];
    $firstName = $googleUser['given_name'] ?? '';
    $lastName = $googleUser['family_name'] ?? '';

    // Validate email
    if (!isValidEmail($email)) {
        sendError('Neteisingas el. pašto formatas', 400);
    }

    // =====================================================
    // Step 3: Check if user exists in database
    // =====================================================

    $pdo = getDbConnection();
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        SELECT id, name, surname, email, role, balance, is_active,
               oauth_google_id, password_required, parent_id, avatar
        FROM users
        WHERE email = ?
    ");
    $stmt->execute([$email]);
    $existingUser = $stmt->fetch();

    if ($existingUser) {
        // =====================================================
        // Existing user - update Google ID if needed
        // =====================================================

        if (!$existingUser['is_active']) {
            $pdo->rollBack();
            sendError('Paskyra laukia patvirtinimo. Susisiekite su administratoriumi.', 403);
        }

        // Update oauth_google_id if not set
        if (empty($existingUser['oauth_google_id'])) {
            $stmt = $pdo->prepare("
                UPDATE users
                SET oauth_google_id = ?, oauth_provider = 'google'
                WHERE id = ?
            ");
            $stmt->execute([$googleId, $existingUser['id']]);
        }

        // Generate auth token
        $token = generateToken(32);
        $tokenExpiry = date('Y-m-d H:i:s', strtotime('+' . TOKEN_EXPIRY_HOURS . ' hours'));

        $stmt = $pdo->prepare("
            UPDATE users
            SET auth_token = ?, token_expiry = ?, last_activity = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$token, $tokenExpiry, $existingUser['id']]);

        // Get children (sub-accounts) if any
        $stmt = $pdo->prepare("
            SELECT id, name, email
            FROM users
            WHERE parent_id = ? AND is_active = 1
        ");
        $stmt->execute([$existingUser['id']]);
        $children = $stmt->fetchAll();

        // Build user response
        $userData = [
            'id' => (int) $existingUser['id'],
            'name' => $existingUser['name'],
            'surname' => $existingUser['surname'] ?? '',
            'email' => $existingUser['email'],
            'role' => $existingUser['role'],
            'balance' => $existingUser['balance'],
            'parent_id' => $existingUser['parent_id'] ? (int) $existingUser['parent_id'] : null,
            'avatar' => $existingUser['avatar'] ?? 'Midnight',
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

        // Reset rate limit after successful authentication
        resetRateLimit($clientIp, 'google_auth');

        sendSuccess([
            'requires_password' => false,
            'token' => $token,
            'user' => $userData
        ], 'Sėkmingai prisijungėte');

    } else {
        // =====================================================
        // New user - create account and temp token
        // =====================================================

        // Create new user with OAuth provider
        $stmt = $pdo->prepare("
            INSERT INTO users (
                name, surname, email, password_hash, role, balance,
                is_active, oauth_provider, oauth_google_id, password_required
            ) VALUES (?, ?, ?, NULL, 'user', 0.00, 0, 'google', ?, 0)
        ");
        $stmt->execute([$firstName, $lastName, $email, $googleId]);

        $userId = (int) $pdo->lastInsertId();

        // Generate temporary token for password setup (10 min validity)
        $tempToken = generateToken(32);
        $expiresAt = date('Y-m-d H:i:s', strtotime('+10 minutes'));

        $stmt = $pdo->prepare("
            INSERT INTO oauth_temp_tokens (token, user_id, expires_at)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$tempToken, $userId, $expiresAt]);

        // Build new user response
        $userData = [
            'id' => $userId,
            'name' => $firstName,
            'surname' => $lastName,
            'email' => $email,
            'role' => 'user',
            'balance' => '0.00',
            'parent_id' => null,
            'avatar' => 'Midnight',
            'children' => []
        ];

        $pdo->commit();

        // Log new user registration
        error_log("New Google OAuth user registered: user_id=$userId, email=$email");

        // Reset rate limit after successful registration
        resetRateLimit($clientIp, 'google_auth');

        sendSuccess([
            'requires_password' => true,
            'temp_token' => $tempToken,
            'user' => $userData
        ], 'Paskyra sukurta. Nustatykite slaptažodį.');
    }

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Google OAuth database error: " . $e->getMessage());
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

    error_log("Google OAuth unexpected error: " . $e->getMessage());
    error_log($e->getTraceAsString());

    sendError('Nenumatyta klaida. Bandykite vėliau.', 500);
}
