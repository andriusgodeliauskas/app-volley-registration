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
$preferredLanguage = trim($input['preferred_language'] ?? '');
$payForFamilyMembers = isset($input['pay_for_family_members']) ? $input['pay_for_family_members'] : null;

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

// Validate preferred_language (only 'lt' or 'en' allowed)
if (!empty($preferredLanguage) && !in_array($preferredLanguage, ['lt', 'en'])) {
    sendError('Invalid language. Only "lt" or "en" allowed', 400);
}

// Validate pay_for_family_members (must be boolean 0 or 1)
if ($payForFamilyMembers !== null) {
    // Accept boolean, int, or string representation
    if (!in_array($payForFamilyMembers, [0, 1, '0', '1', true, false], true)) {
        sendError('Invalid pay_for_family_members value. Must be 0 or 1', 400);
    }
    // Normalize to integer
    $payForFamilyMembers = (int)$payForFamilyMembers;
}

$pdo = getDbConnection();

try {
    // Build dynamic UPDATE query based on provided fields
    $updateFields = ['name = ?', 'surname = ?', 'avatar = ?'];
    $params = [$name, $surname, $avatar];

    if (!empty($preferredLanguage)) {
        $updateFields[] = 'preferred_language = ?';
        $params[] = $preferredLanguage;
    }

    if ($payForFamilyMembers !== null) {
        $updateFields[] = 'pay_for_family_members = ?';
        $params[] = $payForFamilyMembers;
    }

    $params[] = $userId; // WHERE condition

    $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Fetch updated user to return
    $stmt = $pdo->prepare("SELECT id, name, surname, email, role, balance, avatar, parent_id, is_active, preferred_language, pay_for_family_members FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $updatedUser = $stmt->fetch();

    // Format types
    $updatedUser['id'] = (int)$updatedUser['id'];
    $updatedUser['balance'] = (float)$updatedUser['balance'];
    $updatedUser['parent_id'] = $updatedUser['parent_id'] ? (int)$updatedUser['parent_id'] : null;
    $updatedUser['is_active'] = (bool)$updatedUser['is_active'];
    $updatedUser['preferred_language'] = $updatedUser['preferred_language'] ?? 'lt';
    $updatedUser['pay_for_family_members'] = (bool)$updatedUser['pay_for_family_members'];

    sendSuccess(['user' => $updatedUser], 'Profile updated successfully');

} catch (PDOException $e) {
    if (APP_ENV === 'development') {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
    sendError('Failed to update profile', 500);
}
