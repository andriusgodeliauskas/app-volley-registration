<?php
/**
 * Volley Registration App - Admin Update User
 * 
 * POST /api/admin_user_update.php
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

// Only super_admin or group_admin can update users
if (!in_array($currentUser['role'], ['super_admin', 'group_admin'])) {
    sendError('Unauthorized access', 403);
}

requirePost();

$input = getJsonInput();

if (!isset($input['user_id'])) {
    sendError('User ID is required', 400);
}

$id = (int)$input['user_id'];
$name = isset($input['name']) ? trim($input['name']) : null;
$surname = isset($input['surname']) ? trim($input['surname']) : null;
$email = isset($input['email']) ? trim($input['email']) : null;
$role = isset($input['role']) ? $input['role'] : null;
$balance = isset($input['balance']) ? (float)$input['balance'] : null;
$isValidActive = isset($input['is_active']);
$isActive = $isValidActive ? (int)$input['is_active'] : null;

// Validation
if ($name && strlen($name) < 2) {
    sendError('Name must be at least 2 characters', 400);
}
if ($surname && strlen($surname) < 2) {
    sendError('Surname must be at least 2 characters', 400);
}
if ($email && !isValidEmail($email)) {
    sendError('Invalid email format', 400);
}
if ($role && !in_array($role, ['user', 'group_admin', 'super_admin'])) {
    sendError('Invalid role', 400);
}

// Restriction: Only super_admin can change roles to/from admins or edit other admins
if ($currentUser['role'] !== 'super_admin' && $role === 'super_admin') {
    sendError('Only Super Admin can assign Super Admin role', 403);
}

$pdo = getDbConnection();

try {
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id, role FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $existingUser = $stmt->fetch();

    if (!$existingUser) {
        sendError('User not found', 404);
    }

    if ($currentUser['role'] !== 'super_admin' && $existingUser['role'] === 'super_admin') {
        sendError('Cannot modify Super Admin accounts', 403);
    }

    // Build update query dynamically
    $fields = [];
    $params = [];

    if ($name !== null) {
        $fields[] = 'name = ?';
        $params[] = $name;
    }
    if ($surname !== null) {
        $fields[] = 'surname = ?';
        $params[] = $surname;
    }
    if ($email !== null) {
        // Check email uniqueness if changed
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $stmt->execute([$email, $id]);
        if ($stmt->fetch()) {
            sendError('Email already in use', 409);
        }
        $fields[] = 'email = ?';
        $params[] = $email;
    }
    if ($role !== null) {
        $fields[] = 'role = ?';
        $params[] = $role;
    }
    if ($balance !== null) {
        $fields[] = 'balance = ?';
        $params[] = $balance;
    }
    if ($isActive !== null) {
        $fields[] = 'is_active = ?';
        $params[] = $isActive;
    }

    if (empty($fields)) {
        sendSuccess([], 'No changes made');
    }

    $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
    $params[] = $id;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Update User Groups if provided
    if (isset($input['group_ids']) && is_array($input['group_ids'])) {
        $groupIds = array_map('intval', $input['group_ids']);
        
        // Remove existing groups
        $deleteStmt = $pdo->prepare("DELETE FROM user_groups WHERE user_id = ?");
        $deleteStmt->execute([$id]);
        
        // Insert new groups
        if (!empty($groupIds)) {
            $insertSql = "INSERT INTO user_groups (user_id, group_id) VALUES ";
            $insertParams = [];
            $placeholders = [];
            
            foreach ($groupIds as $gid) {
                $placeholders[] = "(?, ?)";
                $insertParams[] = $id;
                $insertParams[] = $gid;
            }
            
            $insertSql .= implode(", ", $placeholders);
            $insertStmt = $pdo->prepare($insertSql);
            $insertStmt->execute($insertParams);
        }
    }

    sendSuccess([], 'User updated successfully');

} catch (PDOException $e) {
    if (APP_ENV === 'development') {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
    sendError('Failed to update user', 500);
}
