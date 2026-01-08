<?php
/**
 * Volley Registration App - Admin User Transactions API
 * 
 * Endpoints:
 * - GET: Fetch transactions for a specific user
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

// Only Admins
if (!in_array($currentUser['role'], ['super_admin', 'group_admin'])) {
    sendError('Unauthorized access', 403);
}

$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if (!$userId) {
    sendError('User ID is required', 400);
}

$pdo = getDbConnection();

try {
    $stmt = $pdo->prepare("
        SELECT t.*, u.name as created_by_name 
        FROM transactions t 
        LEFT JOIN users u ON t.created_by = u.id 
        WHERE t.user_id = ? 
        ORDER BY t.created_at DESC
        LIMIT 100
    ");
    $stmt->execute([$userId]);
    $transactions = $stmt->fetchAll();

    sendSuccess(['transactions' => $transactions]);
} catch (PDOException $e) {
    if (APP_ENV === 'development') {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
    sendError('Failed to fetch transactions', 500);
}
