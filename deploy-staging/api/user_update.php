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

// Validate
$name = trim($input['name'] ?? '');
$surname = trim($input['surname'] ?? '');
$avatar = trim($input['avatar'] ?? '');

if (empty($name)) {
    sendError('Name is required');
}
if (empty($surname)) {
    sendError('Surname is required');
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
