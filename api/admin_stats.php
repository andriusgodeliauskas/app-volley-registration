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

        // 4. Total Top Ups Amount
        $stmt = $pdo->query("SELECT SUM(amount) FROM transactions WHERE type = 'topup'");
        $stats['total_topups_amount'] = (float)$stmt->fetchColumn() ?: 0.00;

        // 5. Total Rent Amount
        // Sum rent_price for events that have ended
        $stmt = $pdo->query("SELECT SUM(rent_price) FROM events WHERE date_time < NOW() OR status = 'closed'");
        $stats['total_rent_amount'] = (float)$stmt->fetchColumn() ?: 0.00;
        
        // 6. Total Revenue (Transactions type='payment' are negative, so we simulate abs)
        $stmt = $pdo->query("SELECT SUM(amount) FROM transactions WHERE type = 'payment'");
        $total_revenue = abs((float)$stmt->fetchColumn() ?: 0.00);

        // 7. Total Earnings (Revenue - Rent)
        $stats['total_earnings'] = $total_revenue - $stats['total_rent_amount'];
        
        // Remove pending topups (deprecated)
        unset($stats['pending_topups']);

        sendSuccess(['stats' => $stats]);

    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to fetch stats', 500);
    }
}
