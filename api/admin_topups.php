<?php
/**
 * Volley Registration App - Admin Topups API
 * 
 * Endpoints:
 * - GET: Fetch list of top-up transactions (admin only)
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

// Only super_admin or group_admin can access
if (!in_array($currentUser['role'], ['super_admin', 'group_admin'])) {
    sendError('Unauthorized access', 403);
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

if ($method === 'GET') {
    handleGetTopups($pdo);
} else {
    sendError('Method not allowed', 405);
}

function handleGetTopups($pdo) {
    try {
        $sql = "
            SELECT 
                t.id,
                t.amount,
                t.created_at,
                t.created_by,
                u.name as user_name,
                u.surname as user_surname,
                u.email as user_email,
                creator.name as admin_name
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN users creator ON t.created_by = creator.id
            WHERE t.type = 'topup'
            ORDER BY t.created_at DESC
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $topups = $stmt->fetchAll();
        
        // Format data
        foreach ($topups as &$topup) {
            $topup['id'] = (int)$topup['id'];
            $topup['amount'] = (float)$topup['amount'];
            $topup['user_full_name'] = trim($topup['user_name'] . ' ' . $topup['user_surname']);
        }
        
        sendSuccess(['topups' => $topups]);
        
    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to fetch top-ups', 500);
    }
}
