<?php
/**
 * Volley Registration App - Admin Users for Event Endpoint
 *
 * GET /api/admin_users_for_event.php?event_id=123
 *
 * Returns all users that can be registered for an event (excluding already registered)
 * Super admin only
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

// Only super_admin can access
if ($currentUser['role'] !== 'super_admin') {
    sendError('Unauthorized access', 403);
}

// Allow GET requests only
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

// Get event_id
$eventId = isset($_GET['event_id']) ? (int)$_GET['event_id'] : 0;
if ($eventId <= 0) {
    sendError('Invalid or missing event ID', 400);
}

try {
    $pdo = getDbConnection();

    // Fetch all users who are NOT currently registered for this event
    $stmt = $pdo->prepare("
        SELECT
            u.id,
            u.name,
            u.surname,
            u.email,
            u.avatar,
            u.balance
        FROM users u
        WHERE u.id NOT IN (
            SELECT r.user_id
            FROM registrations r
            WHERE r.event_id = ? AND r.status = 'registered'
        )
        AND u.role != 'super_admin'
        ORDER BY u.surname ASC, u.name ASC
    ");
    $stmt->execute([$eventId]);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Cast types
    foreach ($users as &$user) {
        $user['id'] = (int)$user['id'];
        $user['balance'] = (float)$user['balance'];
    }

    sendSuccess([
        'users' => $users,
        'count' => count($users)
    ]);

} catch (PDOException $e) {
    if (APP_ENV === 'development') {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
    sendError('Failed to fetch users', 500);
}
