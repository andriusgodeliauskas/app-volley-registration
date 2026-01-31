<?php
/**
 * Volley Registration App - User Registration Endpoint
 * 
 * POST /api/register.php
 * 
 * Request Body:
 * {
 *   "first_name": "John",
 *   "last_name": "Doe",
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
$missing = validateRequired($input, ['first_name', 'last_name', 'email', 'password']);
if (!empty($missing)) {
    sendError('Missing required fields: ' . implode(', ', $missing), 400, [
        'missing_fields' => $missing
    ]);
}

// Sanitize inputs
$first_name = trim($input['first_name']);
$last_name = trim($input['last_name']);
$email = trim(strtolower($input['email']));
$password = $input['password'];

// Validate name length (min 2, max 50 characters to prevent DoS)
if (strlen($first_name) < 2 || strlen($first_name) > 50) {
    sendError('First name must be between 2 and 50 characters', 400);
}
if (strlen($last_name) < 2 || strlen($last_name) > 50) {
    sendError('Last name must be between 2 and 50 characters', 400);
}

// Validate name format (only letters, spaces, hyphens, apostrophes)
if (!preg_match("/^[a-zA-ZÀ-ž\s'-]+$/u", $first_name)) {
    sendError('First name contains invalid characters', 400);
}
if (!preg_match("/^[a-zA-ZÀ-ž\s'-]+$/u", $last_name)) {
    sendError('Last name contains invalid characters', 400);
}

// Validate email length (max 100 characters to prevent DoS)
if (strlen($email) > 100) {
    sendError('Email must not exceed 100 characters', 400);
}

// Validate email format
if (!isValidEmail($email)) {
    sendError('Invalid email format', 400);
}

// Validate password strength
$passwordErrors = validatePasswordStrength($password);
if (!empty($passwordErrors)) {
    sendError(implode('. ', $passwordErrors), 400);
}

// Rate limiting - 3 attempts per 60 minutes
checkRateLimit($email, 'registration', 3, 60);

try {
    $pdo = getDbConnection();
    
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);

    if ($stmt->fetch()) {
        sendError('Email already exists', 409);
    }
    
    // Hash password
    $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    
    // Insert new user
    // Assuming 'name' column is First Name and 'surname' column is Last Name
    $stmt = $pdo->prepare("
        INSERT INTO users (name, surname, email, password_hash, role, balance, is_active, created_at)
        VALUES (?, ?, ?, ?, 'user', 0.00, 0, NOW())
    ");
    
    $stmt->execute([$first_name, $last_name, $email, $passwordHash]);


    $userId = (int) $pdo->lastInsertId();

    // Generate auth token for immediate login (same as Google OAuth)
    $token = generateToken(32);
    $tokenExpiry = date('Y-m-d H:i:s', strtotime('+' . TOKEN_EXPIRY_HOURS . ' hours'));

    $stmt = $pdo->prepare("
        UPDATE users
        SET auth_token = ?, token_expiry = ?, last_activity = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$token, $tokenExpiry, $userId]);

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

    // Reset rate limit after successful registration
    resetRateLimit($email, 'registration');

    // Notify Super Admins about new user registration
    require_once __DIR__ . '/send-new-user-notification.php';
    try {
        sendNewUserRegistrationNotification($email, $pdo);
    } catch (Exception $e) {
        error_log("Failed to send new user notifications: " . $e->getMessage());
    }

    // Return success response with token for immediate login
    sendSuccess([
        'token' => $token,
        'user' => [
            'id' => $userId,
            'name' => $first_name,
            'surname' => $last_name,
            'email' => $email,
            'role' => 'user',
            'balance' => '0.00',
            'parent_id' => null,
            'avatar' => 'Midnight',
            'preferred_language' => 'lt',
            'children' => []
        ]
    ], 'Registration successful', 201);
    
} catch (PDOException $e) {
    if (APP_ENV === 'development') {
        sendError('Database error: ' . $e->getMessage(), 500);
    } else {
        sendError('An error occurred during registration', 500);
    }
}
