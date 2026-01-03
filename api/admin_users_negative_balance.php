<?php
/**
 * Volley Registration App - Admin Users with Negative Balance API
 *
 * Endpoints:
 * - GET: Get users with negative balance and total debt (super_admin only)
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

// Only super_admin can access
if ($currentUser['role'] !== 'super_admin') {
    sendError('Unauthorized access', 403);
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

switch ($method) {
    case 'GET':
        handleGetNegativeBalanceUsers($pdo);
        break;
    default:
        sendError('Method not allowed', 405);
}

function handleGetNegativeBalanceUsers($pdo) {
    try {
        // Fetch all users with negative balance
        $stmt = $pdo->query("
            SELECT id, name, surname, email, balance, created_at
            FROM users
            WHERE balance < 0
            ORDER BY balance ASC
        ");
        $users = $stmt->fetchAll();

        // Calculate total negative balance
        $totalNegative = 0;
        foreach ($users as &$user) {
            $user['id'] = (int)$user['id'];
            $user['balance'] = (float)$user['balance'];
            $totalNegative += $user['balance'];
        }

        sendSuccess([
            'users' => $users,
            'total_negative' => (float)$totalNegative,
            'count' => count($users)
        ]);

    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to fetch users with negative balance', 500);
    }
}
