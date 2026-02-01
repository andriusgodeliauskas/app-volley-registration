<?php
/**
 * Volley Registration App - Events API
 * 
 * Endpoints:
 * - GET: Fetch upcoming events (with optional filters)
 * - POST: Create a new event (admin only)
 */

require_once __DIR__ . '/auth.php';

// Require authentication for all event operations
$currentUser = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetEvents($currentUser);
        break;
    case 'POST':
        handleCreateEvent($currentUser);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * GET - Fetch upcoming events
 * 
 * Query params:
 * - status: filter by status (default: 'open')
 * - upcoming: if true, only show events in the future (default: true)
 * - group_id: filter by group
 * - limit: max results (default: 50)
 */
function handleGetEvents(array $currentUser): void
{
    $pdo = getDbConnection();
    $userId = $currentUser['id'];

    // Check if user belongs to any group
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as group_count
        FROM user_groups
        WHERE user_id = ?
    ");
    $stmt->execute([$userId]);
    $groupCheck = $stmt->fetch();
    $userHasGroups = ($groupCheck['group_count'] > 0);

    if (!$userHasGroups) {
        // User doesn't belong to any group - return empty events
        sendSuccess([
            'user_has_groups' => false,
            'events' => []
        ]);
    }

    // Parse query parameters
    $status = $_GET['status'] ?? 'open';
    $upcoming = filter_var($_GET['upcoming'] ?? 'true', FILTER_VALIDATE_BOOLEAN);
    $groupId = isset($_GET['group_id']) ? (int)$_GET['group_id'] : null;
    $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 100) : 50;
    
    // Build query
    $sql = "
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
            e.rent_price,
            e.status,
            e.icon,
            e.registration_cutoff_hours,
            e.negative_balance_limit,
            e.created_at,
            g.name as group_name,
            (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered') as registered_count,
            (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.user_id = :user_id AND r.status = 'registered') as user_registered
        FROM events e
        JOIN groups g ON e.group_id = g.id
        WHERE 1=1
    ";
    
    $params = ['user_id' => $currentUser['id']];
    
    // Apply status filter
    if ($status !== 'all') {
        $sql .= " AND e.status = :status";
        $params['status'] = $status;
    }
    
    // Apply upcoming filter
    if ($upcoming) {
        $sql .= " AND e.date_time > NOW()";
    }
    
    // Apply group filter
    if ($groupId !== null) {
        $sql .= " AND e.group_id = :group_id";
        $params['group_id'] = $groupId;
    }
    
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
    
    $sql .= " ORDER BY e.date_time ASC LIMIT :limit";
    
    try {
        $stmt = $pdo->prepare($sql);
        
        // Bind parameters
        foreach ($params as $key => $value) {
            if ($key === 'limit') continue; // Skip limit, bind separately
            $stmt->bindValue(":$key", $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        
        $stmt->execute();
        $events = $stmt->fetchAll();
        
        // Format data
        foreach ($events as &$event) {
            $event['id'] = (int)$event['id'];
            $event['group_id'] = (int)$event['group_id'];
            $event['max_players'] = (int)$event['max_players'];
            $event['court_count'] = (int)$event['court_count'];
            $event['price_per_person'] = (float)$event['price_per_person'];
            $event['rent_price'] = (float)($event['rent_price'] ?? 0);
            $event['registration_cutoff_hours'] = $event['registration_cutoff_hours'] !== null ? (int)$event['registration_cutoff_hours'] : null;
            $event['negative_balance_limit'] = (float)($event['negative_balance_limit'] ?? -12.00);
            $event['registered_count'] = (int)$event['registered_count'];
            $event['user_registered'] = (int)$event['user_registered'] > 0;
            $event['spots_available'] = $event['max_players'] - $event['registered_count'];
        }

        sendSuccess([
            'user_has_groups' => true,
            'events' => $events
        ]);
        
    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to fetch events', 500);
    }
}

/**
 * POST - Create a new event (admin only)
 */
function handleCreateEvent(array $currentUser): void
{
    // Check admin permissions
    if (!in_array($currentUser['role'], ['super_admin', 'group_admin'])) {
        sendError('Access denied. Admin privileges required.', 403);
    }
    
    $input = getJsonInput();
    
    // Validate required fields
    $required = ['group_id', 'title', 'date_time', 'location'];
    $missing = validateRequired($input, $required);
    
    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 400);
    }
    
    $pdo = getDbConnection();
    
    // If group admin, verify they own the group
    if ($currentUser['role'] === 'group_admin') {
        $stmt = $pdo->prepare("SELECT id FROM groups WHERE id = ? AND owner_id = ?");
        $stmt->execute([(int)$input['group_id'], $currentUser['id']]);
        
        if (!$stmt->fetch()) {
            sendError('You can only create events for groups you own', 403);
        }
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO events (
                group_id, title, description, date_time, location,
                max_players, court_count, price_per_person, rent_price, status, icon, registration_cutoff_hours, negative_balance_limit
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $rentPrice = ($currentUser['role'] === 'super_admin') ? ($input['rent_price'] ?? 0.00) : 0.00;

        // Validate and set registration_cutoff_hours
        $cutoffHours = null;
        if (isset($input['registration_cutoff_hours'])) {
            $cutoffHours = filter_var($input['registration_cutoff_hours'], FILTER_VALIDATE_INT);
            if ($cutoffHours === false || $cutoffHours < 0) {
                sendError('registration_cutoff_hours must be a positive integer or null', 400);
            }
        }

        // Validate and set negative_balance_limit
        $negativeBalanceLimit = -12.00; // Default value
        if (isset($input['negative_balance_limit'])) {
            $negativeBalanceLimit = filter_var($input['negative_balance_limit'], FILTER_VALIDATE_FLOAT);
            if ($negativeBalanceLimit === false) {
                sendError('negative_balance_limit must be a valid number', 400);
            }
        }

        $stmt->execute([
            (int)$input['group_id'],
            trim($input['title']),
            $input['description'] ?? null,
            $input['date_time'],
            trim($input['location']),
            $input['max_players'] ?? 12,
            $input['court_count'] ?? 1,
            $input['price_per_person'] ?? 0.00,
            $rentPrice,
            $input['status'] ?? 'open',
            $input['icon'] ?? 'volleyball',
            $cutoffHours,
            $negativeBalanceLimit
        ]);

        $eventId = $pdo->lastInsertId();

        sendSuccess(['event_id' => (int)$eventId], 'Event created successfully', 201);

    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to create event', 500);
    }
}
