<?php
/**
 * Volley Registration App - Event Details & Attendees Endpoint
 * 
 * GET /api/event_details.php?event_id=123
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "event": { ... },
 *     "attendees": [
 *       { "id": 1, "name": "John Doe", "registered_at": "2025-01-01 12:00:00" },
 *       ...
 *     ]
 *   }
 * }
 */

require_once __DIR__ . '/db.php';

// Allow GET requests
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
    
    // 1. Fetch Event Details and User Registration Status
    // We need user_id to check if they are registered
    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

    $stmt = $pdo->prepare("
        SELECT
            e.id,
            e.title,
            e.date_time,
            e.location,
            e.price_per_person,
            e.max_players,
            e.status,
            e.icon,
            e.registration_cutoff_hours,
            e.negative_balance_limit,
            g.name as group_name,
            (
                SELECT COUNT(*)
                FROM registrations r
                WHERE r.event_id = e.id AND r.status = 'registered'
            ) as registered_count,
            (
                SELECT COUNT(*)
                FROM registrations r
                WHERE r.event_id = e.id AND r.user_id = ? AND r.status = 'registered'
            ) > 0 as user_registered
        FROM events e
        LEFT JOIN groups g ON e.group_id = g.id
        WHERE e.id = ?
    ");
    $stmt->execute([$userId, $eventId]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);

    // Cast boolean-like fields
    if ($event) {
        $event['user_registered'] = (bool)$event['user_registered'];
    }

    if (!$event) {
        sendError('Event not found', 404);
    }

    // 2. Fetch Attendees (registered users)
    // Order by registration time (created_at)
    $stmt = $pdo->prepare("
        SELECT
            u.id,
            CONCAT_WS(' ', u.name, u.surname) as name,
            u.avatar,
            r.created_at as registered_at,
            r.registered_by,
            CONCAT_WS(' ', admin.name, admin.surname) as registered_by_name
        FROM registrations r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN users admin ON r.registered_by = admin.id
        WHERE r.event_id = ? AND r.status = 'registered'
        ORDER BY r.created_at ASC
    ");
    $stmt->execute([$eventId]);
    $attendees = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Add indices to attendees for display (1, 2, 3...)
    foreach ($attendees as $key => $attendee) {
        $attendees[$key]['index'] = $key + 1;
    }

    // 2b. Fetch Waitlist Users (status = 'waitlist')
    $stmt = $pdo->prepare("
        SELECT
            u.id,
            CONCAT_WS(' ', u.name, u.surname) as name,
            u.avatar,
            r.created_at as registered_at,
            r.registered_by,
            CONCAT_WS(' ', admin.name, admin.surname) as registered_by_name
        FROM registrations r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN users admin ON r.registered_by = admin.id
        WHERE r.event_id = ? AND r.status = 'waitlist'
        ORDER BY r.created_at ASC
    ");
    $stmt->execute([$eventId]);
    $waitlist = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Add indices to waitlist for display (starting after max_players)
    foreach ($waitlist as $key => $waitlistUser) {
        $waitlist[$key]['index'] = (int)$event['max_players'] + $key + 1;
    }

    // 3. Fetch Registration History (all statuses)
    // This includes registered, canceled, and waitlist users
    $stmt = $pdo->prepare("
        SELECT
            u.id,
            CONCAT_WS(' ', u.name, u.surname) as name,
            u.avatar,
            r.status,
            r.created_at as registered_at,
            r.updated_at as status_changed_at,
            r.registered_by,
            CONCAT_WS(' ', admin.name, admin.surname) as registered_by_name
        FROM registrations r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN users admin ON r.registered_by = admin.id
        WHERE r.event_id = ?
        ORDER BY r.created_at ASC
    ");
    $stmt->execute([$eventId]);
    $registrationHistory = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendSuccess([
        'event' => $event,
        'attendees' => $attendees,
        'waitlist' => $waitlist,
        'registration_history' => $registrationHistory
    ]);

} catch (PDOException $e) {
    if (APP_ENV === 'development') {
        sendError('Database error: ' . $e->getMessage(), 500);
    } else {
        sendError('An error occurred while fetching event details', 500);
    }
}
