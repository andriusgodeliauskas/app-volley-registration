<?php
/**
 * Volley Registration App - Admin Update Event
 * 
 * POST /api/admin_event_update.php
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

// Only super_admin or group_admin can update events
if (!in_array($currentUser['role'], ['super_admin', 'group_admin'])) {
    sendError('Unauthorized access', 403);
}

requirePost();

$input = getJsonInput();

if (!isset($input['event_id'])) {
    sendError('Event ID is required', 400);
}

$id = (int)$input['event_id'];
$groupId = isset($input['group_id']) ? (int)$input['group_id'] : null;
$title = isset($input['title']) ? trim($input['title']) : null;
$description = isset($input['description']) ? trim($input['description']) : null;
$dateTime = isset($input['date_time']) ? trim($input['date_time']) : null;
$location = isset($input['location']) ? trim($input['location']) : null;
$maxPlayers = isset($input['max_players']) ? (int)$input['max_players'] : null;
$courtCount = isset($input['court_count']) ? (int)$input['court_count'] : null;
$price = isset($input['price_per_person']) ? (float)$input['price_per_person'] : null;
$price = isset($input['price_per_person']) ? (float)$input['price_per_person'] : null;
$rentPrice = isset($input['rent_price']) ? (float)$input['rent_price'] : null;
$status = isset($input['status']) ? trim($input['status']) : null;
$icon = isset($input['icon']) ? trim($input['icon']) : null;

// Validation
if ($title && strlen($title) < 3) {
    sendError('Title must be at least 3 characters', 400);
}
if ($status && !in_array($status, ['open', 'closed', 'canceled'])) {
    sendError('Invalid status', 400);
}

$pdo = getDbConnection();

try {
    // Check if event exists
    $stmt = $pdo->prepare("SELECT id FROM events WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        sendError('Event not found', 404);
    }

    // Build update query dynamically
    $fields = [];
    $params = [];

    if ($groupId !== null) {
        $fields[] = 'group_id = ?';
        $params[] = $groupId;
    }
    if ($title !== null) {
        $fields[] = 'title = ?';
        $params[] = $title;
    }
    if ($description !== null) {
        $fields[] = 'description = ?';
        $params[] = $description;
    }
    if ($dateTime !== null) {
        $fields[] = 'date_time = ?';
        $params[] = $dateTime;
    }
    if ($location !== null) {
        $fields[] = 'location = ?';
        $params[] = $location;
    }
    if ($maxPlayers !== null) {
        $fields[] = 'max_players = ?';
        $params[] = $maxPlayers;
    }
    if ($courtCount !== null) {
        $fields[] = 'court_count = ?';
        $params[] = $courtCount;
    }
    if ($price !== null) {
        $fields[] = 'price_per_person = ?';
        $params[] = $price;
    }
    if ($rentPrice !== null) {
        if ($currentUser['role'] === 'super_admin') {
            $fields[] = 'rent_price = ?';
            $params[] = $rentPrice;
        }
    }
    if ($status !== null) {
        $fields[] = 'status = ?';
        $params[] = $status;
    }
    if ($icon !== null) {
        $fields[] = 'icon = ?';
        $params[] = $icon;
    }

    if (empty($fields)) {
        sendSuccess([], 'No changes made');
    }

    $sql = "UPDATE events SET " . implode(', ', $fields) . " WHERE id = ?";
    $params[] = $id;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    sendSuccess([], 'Event updated successfully');

} catch (PDOException $e) {
    if (APP_ENV === 'development') {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
    sendError('Failed to update event', 500);
}
