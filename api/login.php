<?php
/**
 * Volley Registration App - User Login Endpoint
 * 
 * POST /api/login.php
 * 
 * Request Body:
 * {
 *   "email": "john@example.com",
 *   "password": "securepassword"
 * }
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

// Only allow POST requests
requirePost();

// Get JSON input
$input = getJsonInput();

// Validate required fields
$missing = validateRequired($input, ['email', 'password']);
if (!empty($missing)) {
    sendError('Missing required fields: ' . implode(', ', $missing), 400, [
        'missing_fields' => $missing
    ]);
}

// Sanitize inputs
$email = trim(strtolower($input['email']));
$password = $input['password'];

// Validate email format
if (!isValidEmail($email)) {
    sendError('Invalid email format', 400);
}

// Rate limiting - 5 attempts per 15 minutes
checkRateLimit($email, 'login', 5, 15);

try {
    $pdo = getDbConnection();
    
    // Find user by email
    $stmt = $pdo->prepare("
        SELECT id, name, surname, email, password_hash, role, balance, is_active, parent_id, avatar
        FROM users 
        WHERE email = ?
    ");
    $stmt->execute([$email]);
    
    $user = $stmt->fetch();
    
    // Check if user exists
    if (!$user) {
        sendError('Invalid email or password', 401);
    }
    
    // Check if account is active
    if (!$user['is_active']) {
        sendError('Account pending approval. Please wait for administrator confirmation.', 403);
    }
    
    // Verify password
    if (!password_verify($password, $user['password_hash'])) {
        sendError('Invalid email or password', 401);
    }
    
    // Generate auth token
    $token = generateToken(32);
    $tokenExpiry = date('Y-m-d H:i:s', strtotime('+' . TOKEN_EXPIRY_HOURS . ' hours'));
    
    // First, ensure the token columns exist (for MVP, we'll add them if missing)
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS `auth_token` VARCHAR(64) NULL");
        $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS `token_expiry` DATETIME NULL");
        $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS `last_activity` DATETIME NULL");
    } catch (PDOException $e) {
        // Columns might already exist, that's fine
    }

    // Store token in database and set initial last_activity
    $stmt = $pdo->prepare("
        UPDATE users
        SET auth_token = ?, token_expiry = ?, last_activity = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$token, $tokenExpiry, $user['id']]);
    
    // Get children (sub-accounts) if any
    $children = [];
    $stmt = $pdo->prepare("
        SELECT id, name, email 
        FROM users 
        WHERE parent_id = ? AND is_active = 1
    ");
    $stmt->execute([$user['id']]);
    $children = $stmt->fetchAll();
    
    // Build response
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

    // Set httpOnly cookie for secure token storage (CSRF protection via SameSite=Strict)
    $cookieOptions = [
        'expires' => time() + (7 * 24 * 60 * 60), // 7 days
        'path' => '/',
        'domain' => '', // Works for both staging and production
        'secure' => true, // HTTPS only
        'httponly' => true, // Not accessible via JavaScript (XSS protection)
        'samesite' => 'Strict' // CSRF protection - browser won't send cookie in cross-site requests
    ];
    setcookie('auth_token', $token, $cookieOptions);

    // Reset rate limit after successful login
    resetRateLimit($email, 'login');

    sendSuccess([
        'user' => $userData,
        'token' => $token,
        'expires_at' => $tokenExpiry
    ], 'Login successful');
    
} catch (PDOException $e) {
    if (APP_ENV === 'development') {
        sendError('Database error: ' . $e->getMessage(), 500);
    } else {
        sendError('An error occurred during login', 500);
    }
}
