<?php
/**
 * Volley Registration App - Admin Rent API
 * 
 * Endpoints:
 * - GET: Fetch list of events with rent costs (admin only)
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

// Only super_admin or group_admin can access
if ($currentUser['role'] !== 'super_admin') {
    sendError('Unauthorized access. Super Admin only.', 403);
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

if ($method === 'GET') {
    handleGetRent($pdo);
} else {
    sendError('Method not allowed', 405);
}

function handleGetRent($pdo) {
    try {
        // Fetch events that have ended (date in past) or are explicitly closed
        // We order by date descending (newest first)
        $sql = "
            SELECT 
                e.id,
                e.title,
                e.date_time,
                e.location,
                e.status,
                e.rent_price,
                g.name as group_name
            FROM events e
            JOIN groups g ON e.group_id = g.id
            WHERE e.date_time < NOW() OR e.status = 'closed'
            ORDER BY e.date_time DESC
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $events = $stmt->fetchAll();
        
        // Format data
        foreach ($events as &$event) {
            $event['id'] = (int)$event['id'];
            $event['rent_price'] = (float)($event['rent_price'] ?? 0);
        }
        
        sendSuccess(['rent_events' => $events]);
        
    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to fetch rent data', 500);
    }
}
