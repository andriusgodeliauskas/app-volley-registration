<?php
/**
 * Volley Registration App - Users API
 * 
 * Endpoints:
 * - GET: List all users (Admins only)
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

// Only super_admin or group_admin can list users
if (!in_array($currentUser['role'], ['super_admin', 'group_admin'])) {
    sendError('Unauthorized access', 403);
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

switch ($method) {
    case 'GET':
        handleGetUsers($pdo);
        break;
    default:
        sendError('Method not allowed', 405);
}

function handleGetUsers($pdo) {
    try {
        // Fetch all users
        $stmt = $pdo->query("
            SELECT id, name, surname, email, role, balance, is_active, created_at, parent_id
            FROM users
            ORDER BY created_at DESC
        ");
        $users = $stmt->fetchAll();

        // Format data
        foreach ($users as &$user) {
            $user['id'] = (int)$user['id'];
            $user['balance'] = (float)$user['balance'];
            $user['is_active'] = (bool)$user['is_active'];
            $user['parent_id'] = $user['parent_id'] ? (int)$user['parent_id'] : null;
            // Maybe add parent name if parent_id exists? keeping it simple for now
        }

        sendSuccess(['users' => $users]);
    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to fetch users', 500);
    }
}
