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
$rentPrice = isset($input['rent_price']) ? (float)$input['rent_price'] : null;
$status = isset($input['status']) ? trim($input['status']) : null;
$icon = isset($input['icon']) ? trim($input['icon']) : null;

// Validate and set registration_cutoff_hours
$cutoffHours = null;
if (array_key_exists('registration_cutoff_hours', $input)) {
    if ($input['registration_cutoff_hours'] !== null) {
        $cutoffHours = filter_var($input['registration_cutoff_hours'], FILTER_VALIDATE_INT);
        if ($cutoffHours === false || $cutoffHours < 0) {
            sendError('registration_cutoff_hours must be a positive integer or null', 400);
        }
    }
    // If it's explicitly null, we'll handle it below
}

// Validation
if ($title && strlen($title) < 3) {
    sendError('Title must be at least 3 characters', 400);
}
if ($status && !in_array($status, ['open', 'closed', 'canceled'])) {
    sendError('Invalid status', 400);
}

$pdo = getDbConnection();

try {
    // Check if event exists and get current max_players
    $stmt = $pdo->prepare("SELECT id, max_players FROM events WHERE id = ?");
    $stmt->execute([$id]);
    $event = $stmt->fetch();
    if (!$event) {
        sendError('Event not found', 404);
    }

    $oldMaxPlayers = (int)$event['max_players'];

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
    if (array_key_exists('registration_cutoff_hours', $input)) {
        $fields[] = 'registration_cutoff_hours = ?';
        $params[] = $cutoffHours; // Can be null
    }

    if (empty($fields)) {
        sendSuccess([], 'No changes made');
    }

    $sql = "UPDATE events SET " . implode(', ', $fields) . " WHERE id = ?";
    $params[] = $id;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // AUTOMATIC WAITLIST MANAGEMENT: Handle max_players changes
    if ($maxPlayers !== null && $maxPlayers !== $oldMaxPlayers) {
        // Get current registration counts
        $stmt = $pdo->prepare("
            SELECT
                (SELECT COUNT(*) FROM registrations WHERE event_id = ? AND status = 'registered') AS confirmed_count,
                (SELECT COUNT(*) FROM registrations WHERE event_id = ? AND status = 'waitlist') AS waiting_count
        ");
        $stmt->execute([$id, $id]);
        $counts = $stmt->fetch();

        $confirmedCount = (int)$counts['confirmed_count'];
        $waitingCount = (int)$counts['waiting_count'];

        // CASE 1: max_players INCREASED - Promote from waitlist (DEPOSIT PRIORITY)
        if ($maxPlayers > $oldMaxPlayers) {
            $availableSlots = $maxPlayers - $confirmedCount;

            // If there are available slots and people waiting, promote them
            if ($availableSlots > 0 && $waitingCount > 0) {
                $promotionLimit = min($availableSlots, $waitingCount);

                // PRIORITY 1: Promote waitlist users WITH active deposits (oldest first)
                $stmt = $pdo->prepare("
                    UPDATE registrations r
                    INNER JOIN deposits d ON r.user_id = d.user_id AND d.status = 'active'
                    SET r.status = 'registered'
                    WHERE r.event_id = ? AND r.status = 'waitlist'
                    ORDER BY r.created_at ASC
                    LIMIT ?
                ");
                $stmt->execute([$id, $promotionLimit]);
                $promotedWithDeposit = $stmt->rowCount();

                $remainingSlots = $promotionLimit - $promotedWithDeposit;

                // PRIORITY 2: If slots remain, promote waitlist users WITHOUT deposits (oldest first)
                if ($remainingSlots > 0) {
                    $stmt = $pdo->prepare("
                        UPDATE registrations r
                        LEFT JOIN deposits d ON r.user_id = d.user_id AND d.status = 'active'
                        SET r.status = 'registered'
                        WHERE r.event_id = ? AND r.status = 'waitlist' AND d.id IS NULL
                        ORDER BY r.created_at ASC
                        LIMIT ?
                    ");
                    $stmt->execute([$id, $remainingSlots]);
                }

                $totalPromoted = $promotedWithDeposit + $stmt->rowCount();

                if ($totalPromoted > 0) {
                    $message = "Event updated successfully. {$totalPromoted} user(s) promoted from waitlist";
                    if ($promotedWithDeposit > 0) {
                        $message .= " ({$promotedWithDeposit} with deposit priority)";
                    }
                    sendSuccess([
                        'promoted_from_waitlist' => $totalPromoted,
                        'promoted_with_deposit' => $promotedWithDeposit
                    ], $message . ".");
                }
            }
        }
        // CASE 2: max_players DECREASED - Demote to waitlist (NON-DEPOSIT PRIORITY)
        elseif ($maxPlayers < $oldMaxPlayers) {
            // If confirmed count exceeds new limit, move excess to waitlist
            if ($confirmedCount > $maxPlayers) {
                $excessCount = $confirmedCount - $maxPlayers;

                // PRIORITY 1: Demote users WITHOUT deposits first (newest first - LIFO)
                $stmt = $pdo->prepare("
                    UPDATE registrations r
                    LEFT JOIN deposits d ON r.user_id = d.user_id AND d.status = 'active'
                    SET r.status = 'waitlist'
                    WHERE r.event_id = ? AND r.status = 'registered' AND d.id IS NULL
                    ORDER BY r.created_at DESC
                    LIMIT ?
                ");
                $stmt->execute([$id, $excessCount]);
                $demotedWithoutDeposit = $stmt->rowCount();

                $remainingToDemote = $excessCount - $demotedWithoutDeposit;

                // PRIORITY 2: If still need to demote, demote users WITH deposits (newest first)
                if ($remainingToDemote > 0) {
                    $stmt = $pdo->prepare("
                        UPDATE registrations r
                        INNER JOIN deposits d ON r.user_id = d.user_id AND d.status = 'active'
                        SET r.status = 'waitlist'
                        WHERE r.event_id = ? AND r.status = 'registered'
                        ORDER BY r.created_at DESC
                        LIMIT ?
                    ");
                    $stmt->execute([$id, $remainingToDemote]);
                }

                $totalDemoted = $demotedWithoutDeposit + $stmt->rowCount();

                if ($totalDemoted > 0) {
                    $message = "Event updated successfully. {$totalDemoted} user(s) moved to waitlist due to reduced capacity";
                    if ($demotedWithoutDeposit > 0) {
                        $message .= " (non-depositors moved first)";
                    }
                    sendSuccess([
                        'demoted_to_waitlist' => $totalDemoted,
                        'demoted_without_deposit' => $demotedWithoutDeposit
                    ], $message . ".");
                }
            }
        }
    }

    sendSuccess([], 'Event updated successfully');

} catch (PDOException $e) {
    if (APP_ENV === 'development') {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
    sendError('Failed to update event', 500);
}
