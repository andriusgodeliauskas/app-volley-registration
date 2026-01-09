<?php
/**
 * Volley Registration App - Admin Events Occupancy API
 *
 * Endpoints:
 * - GET: Get all events with occupancy details and participant lists (admin only)
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
        handleGetEventsOccupancy($pdo, $currentUser);
        break;
    default:
        sendError('Method not allowed', 405);
}

function handleGetEventsOccupancy($pdo, $currentUser) {
    try {
        // Get all events with occupancy data
        $sql = "
            SELECT
                e.id,
                e.title,
                e.date_time,
                e.location,
                e.max_players,
                e.status,
                e.icon,
                g.name as group_name,
                (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered') as registered_count
            FROM events e
            LEFT JOIN groups g ON e.group_id = g.id
            WHERE 1=1
        ";

        $params = [];

        // RESTRICT BY USER GROUPS (Logic for user/group_admin)
        // Super Admin sees all events. Others see only events from their assigned groups.
        if ($currentUser['role'] !== 'super_admin') {
            $groupStmt = $pdo->prepare("SELECT group_id FROM user_groups WHERE user_id = ?");
            $groupStmt->execute([$currentUser['id']]);
            $userGroupIds = $groupStmt->fetchAll(PDO::FETCH_COLUMN);

            // If user has no groups, return empty immediately
            if (empty($userGroupIds)) {
                sendSuccess(['events' => []]);
                return;
            }

            // Add IN clause with unique named parameters
            $inParams = [];
            foreach ($userGroupIds as $idx => $gid) {
                $paramName = "gid_$idx";
                $inParams[] = ":$paramName";
                $params[$paramName] = $gid;
            }

            $sql .= " AND e.group_id IN (" . implode(',', $inParams) . ")";
        }

        // Order by date DESC (newest first, including future events)
        $sql .= " ORDER BY e.date_time DESC";

        $stmt = $pdo->prepare($sql);

        // Bind parameters
        foreach ($params as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }

        $stmt->execute();
        $events = $stmt->fetchAll();

        // For each event, get the participant list
        foreach ($events as &$event) {
            $event['id'] = (int)$event['id'];
            $event['max_players'] = (int)$event['max_players'];
            $event['registered_count'] = (int)$event['registered_count'];
            $event['available_spots'] = $event['max_players'] - $event['registered_count'];

            // Get participants for this event
            $participantsStmt = $pdo->prepare("
                SELECT
                    u.id,
                    u.name,
                    u.surname,
                    r.created_at as registration_date
                FROM registrations r
                JOIN users u ON r.user_id = u.id
                WHERE r.event_id = ? AND r.status = 'registered'
                ORDER BY r.created_at ASC
            ");
            $participantsStmt->execute([$event['id']]);
            $participants = $participantsStmt->fetchAll();

            // Add row number to each participant
            $participantsList = [];
            foreach ($participants as $index => $participant) {
                $participantsList[] = [
                    'number' => $index + 1,
                    'id' => (int)$participant['id'],
                    'name' => $participant['name'],
                    'surname' => $participant['surname'],
                    'registration_date' => $participant['registration_date']
                ];
            }

            $event['participants'] = $participantsList;

            // Get waitlist for this event
            $waitlistStmt = $pdo->prepare("
                SELECT
                    u.id,
                    u.name,
                    u.surname,
                    r.created_at as registration_date
                FROM registrations r
                JOIN users u ON r.user_id = u.id
                WHERE r.event_id = ? AND r.status = 'waitlist'
                ORDER BY r.created_at ASC
            ");
            $waitlistStmt->execute([$event['id']]);
            $waitlist = $waitlistStmt->fetchAll();

            // Add row number to each waitlist user (starting after max_players)
            $waitlistList = [];
            foreach ($waitlist as $index => $waitlistUser) {
                $waitlistList[] = [
                    'number' => $event['max_players'] + $index + 1,
                    'id' => (int)$waitlistUser['id'],
                    'name' => $waitlistUser['name'],
                    'surname' => $waitlistUser['surname'],
                    'registration_date' => $waitlistUser['registration_date']
                ];
            }

            $event['waitlist'] = $waitlistList;
        }

        sendSuccess(['events' => $events]);

    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to fetch events occupancy', 500);
    }
}
