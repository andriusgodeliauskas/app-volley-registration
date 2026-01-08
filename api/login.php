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
    
    // First, ensure the token column exists (for MVP, we'll add it if missing)
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS `auth_token` VARCHAR(64) NULL");
        $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS `token_expiry` DATETIME NULL");
    } catch (PDOException $e) {
        // Column might already exist, that's fine
    }
    
    // Store token in database
    $stmt = $pdo->prepare("
        UPDATE users 
        SET auth_token = ?, token_expiry = ?
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
