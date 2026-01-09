<?php
/**
 * Volley Registration App - User Update API
 * 
 * Endpoints:
 * - POST: Update current user profile (name, surname, avatar)
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();
requirePost();

$input = getJsonInput();
$userId = $currentUser['id'];

// Validate and sanitize inputs
$name = trim($input['name'] ?? '');
$surname = trim($input['surname'] ?? '');
$avatar = trim($input['avatar'] ?? '');

// Validate name length (min 2, max 50 characters to prevent DoS)
if (strlen($name) < 2 || strlen($name) > 50) {
    sendError('Name must be between 2 and 50 characters', 400);
}
if (strlen($surname) < 2 || strlen($surname) > 50) {
    sendError('Surname must be between 2 and 50 characters', 400);
}

// Validate name format (only letters, spaces, hyphens, apostrophes)
if (!preg_match("/^[a-zA-ZÀ-ž\s'-]+$/u", $name)) {
    sendError('Name contains invalid characters', 400);
}
if (!preg_match("/^[a-zA-ZÀ-ž\s'-]+$/u", $surname)) {
    sendError('Surname contains invalid characters', 400);
}

// Validate avatar (max 20 characters, alphanumeric only)
if (!empty($avatar) && (strlen($avatar) > 20 || !preg_match("/^[a-zA-Z0-9_-]+$/", $avatar))) {
    sendError('Invalid avatar format', 400);
}

$pdo = getDbConnection();

try {
    // Update user
    $stmt = $pdo->prepare("UPDATE users SET name = ?, surname = ?, avatar = ? WHERE id = ?");
    $stmt->execute([$name, $surname, $avatar, $userId]);
    
    // Fetch updated user to return
    $stmt = $pdo->prepare("SELECT id, name, surname, email, role, balance, avatar, parent_id, is_active FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $updatedUser = $stmt->fetch();
    
    // Format types
    $updatedUser['id'] = (int)$updatedUser['id'];
    $updatedUser['balance'] = (float)$updatedUser['balance'];
    $updatedUser['parent_id'] = $updatedUser['parent_id'] ? (int)$updatedUser['parent_id'] : null;
    $updatedUser['is_active'] = (bool)$updatedUser['is_active'];

    sendSuccess(['user' => $updatedUser], 'Profile updated successfully');

} catch (PDOException $e) {
    if (APP_ENV === 'development') {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
    sendError('Failed to update profile', 500);
}
