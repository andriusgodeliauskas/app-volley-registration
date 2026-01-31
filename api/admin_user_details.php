<?php
/**
 * Volley Registration App - Admin Get User Details
 * 
 * GET /api/admin_user_details.php?user_id=X
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

// Only super_admin or group_admin can view details
if (!in_array($currentUser['role'], ['super_admin', 'group_admin'])) {
    sendError('Unauthorized access', 403);
}

requireGet();

$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if (!$userId) {
    sendError('User ID is required', 400);
}

$pdo = getDbConnection();

try {
    $stmt = $pdo->prepare("
        SELECT id, name, surname, email, role, balance, is_active, created_at, parent_id, preferred_language
        FROM users
        WHERE id = ?
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        sendError('User not found', 404);
    }

    // Format data
    $user['id'] = (int)$user['id'];
    $user['balance'] = (float)$user['balance'];
    $user['is_active'] = (bool)$user['is_active'];
    $user['parent_id'] = $user['parent_id'] ? (int)$user['parent_id'] : null;
    $user['preferred_language'] = $user['preferred_language'] ?? 'lt';

    // Fetch user groups
    $groupStmt = $pdo->prepare("SELECT group_id FROM user_groups WHERE user_id = ?");
    $groupStmt->execute([$userId]);
    $user['group_ids'] = $groupStmt->fetchAll(PDO::FETCH_COLUMN);
    $user['group_ids'] = array_map('intval', $user['group_ids']);

    sendSuccess(['user' => $user]);

} catch (PDOException $e) {
    if (APP_ENV === 'development') {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
    sendError('Failed to fetch user details', 500);
}
