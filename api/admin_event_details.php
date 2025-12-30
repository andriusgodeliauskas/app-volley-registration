<?php
/**
 * Volley Registration App - Admin Get Event Details
 * 
 * GET /api/admin_event_details.php?event_id=X
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

// Only super_admin or group_admin can view details
if (!in_array($currentUser['role'], ['super_admin', 'group_admin'])) {
    sendError('Unauthorized access', 403);
}

requireGet();

$eventId = isset($_GET['event_id']) ? (int)$_GET['event_id'] : 0;

if (!$eventId) {
    sendError('Event ID is required', 400);
}

$pdo = getDbConnection();

try {
    $stmt = $pdo->prepare("
        SELECT 
            e.id, 
            e.group_id, 
            e.title, 
            e.description, 
            e.date_time, 
            e.location, 
            e.max_players, 
            e.court_count, 
            e.price_per_person, 
            e.status,
            g.name as group_name
        FROM events e
        LEFT JOIN groups g ON e.group_id = g.id
        WHERE e.id = ?
    ");
    $stmt->execute([$eventId]);
    $event = $stmt->fetch();

    if (!$event) {
        sendError('Event not found', 404);
    }

    // Format data
    $event['id'] = (int)$event['id'];
    $event['group_id'] = (int)$event['group_id'];
    $event['max_players'] = (int)$event['max_players'];
    $event['court_count'] = (int)$event['court_count'];
    $event['price_per_person'] = (float)$event['price_per_person'];

    sendSuccess(['event' => $event]);

} catch (PDOException $e) {
    if (APP_ENV === 'development') {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
    sendError('Failed to fetch event details', 500);
}
