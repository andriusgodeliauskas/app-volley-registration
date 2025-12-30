<?php
/**
 * Volley Registration App - Admin Stats API
 * 
 * Endpoints:
 * - GET: Get dashboard statistics (admin only)
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

switch ($method) {
    case 'GET':
        handleGetStats($pdo, $currentUser);
        break;
    default:
        sendError('Method not allowed', 405);
}

function handleGetStats($pdo, $currentUser) {
    try {
        $stats = [
            'total_users' => 0,
            'active_groups' => 0,
            'upcoming_events' => 0,
            'pending_topups' => 0 // Future feature
        ];

        // 1. Total Users
        // Count all registered users
        $stmt = $pdo->query("SELECT COUNT(*) FROM users");
        $stats['total_users'] = (int)$stmt->fetchColumn();

        // 2. Active Groups
        // Count active groups
        $stmt = $pdo->query("SELECT COUNT(*) FROM groups WHERE is_active = 1");
        $stats['active_groups'] = (int)$stmt->fetchColumn();

        // 3. Upcoming Events
        // Events in the future that are not canceled
        $stmt = $pdo->query("
            SELECT COUNT(*) 
            FROM events 
            WHERE date_time > NOW() AND status != 'canceled'
        ");
        $stats['upcoming_events'] = (int)$stmt->fetchColumn();

        // 4. Pending Top-ups (Placeholder)
        // Currently we don't have a top-up request table. 
        // Logic can be added here later.
        $stats['pending_topups'] = 0;

        sendSuccess(['stats' => $stats]);

    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to fetch stats', 500);
    }
}
