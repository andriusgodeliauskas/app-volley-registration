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

// Validate name length
if (strlen($first_name) < 2 || strlen($last_name) < 2) {
    sendError('Name and Surname must be at least 2 characters', 400);
}

// Validate email format
if (!isValidEmail($email)) {
    sendError('Invalid email format', 400);
}

// Validate password strength
if (strlen($password) < 6) {
    sendError('Password must be at least 6 characters long', 400);
}

try {
    $pdo = getDbConnection();
    
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        sendError('Email is already registered', 409);
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
    
    // Return success response
    sendSuccess([
        'user' => [
            'id' => $userId,
            'name' => $first_name,
            'surname' => $last_name,
            'email' => $email,
            'role' => 'user'
        ]
    ], 'Registration successful', 201);
    
} catch (PDOException $e) {
    if (APP_ENV === 'development') {
        sendError('Database error: ' . $e->getMessage(), 500);
    } else {
        sendError('An error occurred during registration', 500);
    }
}
