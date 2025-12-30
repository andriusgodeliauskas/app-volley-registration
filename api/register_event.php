<?php
/**
 * Volley Registration App - Event Registration API
 * 
 * Endpoints:
 * - POST: Register for an event (deducts balance)
 * - DELETE: Cancel registration (refunds balance)
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        handleRegister($currentUser);
        break;
    case 'DELETE':
        handleCancelRegistration($currentUser);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * POST - Register for an event
 * 
 * Request body:
 * - event_id: ID of the event to register for
 * - user_id: (optional) ID of user to register (for registering children)
 */
function handleRegister(array $currentUser): void
{
    $input = getJsonInput();
    
    if (!isset($input['event_id'])) {
        sendError('event_id is required', 400);
    }
    
    $eventId = (int)$input['event_id'];
    
    // Determine who is being registered (self or child)
    $registerUserId = isset($input['user_id']) ? (int)$input['user_id'] : $currentUser['id'];
    
    // If registering someone else, verify it's their child
    if ($registerUserId !== $currentUser['id']) {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND parent_id = ?");
        $stmt->execute([$registerUserId, $currentUser['id']]);
        
        if (!$stmt->fetch()) {
            sendError('You can only register yourself or your children', 403);
        }
    }
    
    $pdo = getDbConnection();
    
    try {
        // Start transaction
        $pdo->beginTransaction();
        
        // Fetch event details with lock
        $stmt = $pdo->prepare("
            SELECT 
                e.*,
                (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered') as registered_count
            FROM events e 
            WHERE e.id = ? 
            FOR UPDATE
        ");
        $stmt->execute([$eventId]);
        $event = $stmt->fetch();
        
        if (!$event) {
            $pdo->rollBack();
            sendError('Event not found', 404);
        }
        
        // Check if event is open for registration
        if ($event['status'] !== 'open') {
            $pdo->rollBack();
            sendError('Event is not open for registration', 400);
        }
        
        // Check if event is in the future
        if (strtotime($event['date_time']) <= time()) {
            $pdo->rollBack();
            sendError('Cannot register for past events', 400);
        }
        
        // Check if spots are available
        if ((int)$event['registered_count'] >= (int)$event['max_players']) {
            $pdo->rollBack();
            sendError('Event is full. No spots available.', 400);
        }
        
        // Fetch current user's balance (the person paying)
        $stmt = $pdo->prepare("SELECT balance FROM users WHERE id = ? FOR UPDATE");
        $stmt->execute([$currentUser['id']]);
        $userData = $stmt->fetch();
        $currentBalance = (float)$userData['balance'];
        $eventPrice = (float)$event['price_per_person'];

        // Check if already registered (or canceled)
        $stmt = $pdo->prepare("
            SELECT id, status FROM registrations 
            WHERE user_id = ? AND event_id = ?
        ");
        $stmt->execute([$registerUserId, $eventId]);
        $existingRegistration = $stmt->fetch();
        
        if ($existingRegistration) {
            if ($existingRegistration['status'] === 'registered') {
                $pdo->rollBack();
                sendError('Already registered for this event', 400);
            }
            
            // Re-register: Update status to registered
            $stmt = $pdo->prepare("
                UPDATE registrations 
                SET status = 'registered', registered_by = ?, created_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ");
            $stmt->execute([$currentUser['id'], $existingRegistration['id']]);
            $registrationId = $existingRegistration['id'];

        } else {
            // New registration: Insert
            $stmt = $pdo->prepare("
                INSERT INTO registrations (user_id, event_id, registered_by, status)
                VALUES (?, ?, ?, 'registered')
            ");
            $stmt->execute([$registerUserId, $eventId, $currentUser['id']]);
            $registrationId = $pdo->lastInsertId();
        }
        
        // Deduct balance
        if ($eventPrice > 0) {
            $newBalance = $currentBalance - $eventPrice;
            
            $stmt = $pdo->prepare("UPDATE users SET balance = ? WHERE id = ?");
            $stmt->execute([$newBalance, $currentUser['id']]);
            
            // Record transaction
            $stmt = $pdo->prepare("
                INSERT INTO transactions (user_id, amount, type, description, reference_id)
                VALUES (?, ?, 'payment', ?, ?)
            ");
            $stmt->execute([
                $currentUser['id'],
                -$eventPrice,
                "Registration for: {$event['title']}",
                $registrationId
            ]);
        }
        
        $pdo->commit();
        
        sendSuccess([
            'registration_id' => (int)$registrationId,
            'new_balance' => $newBalance ?? $currentBalance,
            'amount_paid' => $eventPrice
        ], 'Successfully registered for event', 201);
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to register for event', 500);
    }
}

/**
 * DELETE - Cancel registration
 * 
 * Query params:
 * - event_id: ID of the event
 * - user_id: (optional) ID of user to unregister (for children)
 */
function handleCancelRegistration(array $currentUser): void
{
    $eventId = isset($_GET['event_id']) ? (int)$_GET['event_id'] : null;
    
    if (!$eventId) {
        sendError('event_id is required', 400);
    }
    
    // Determine who to unregister
    $unregisterUserId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : $currentUser['id'];
    
    // If unregistering someone else, verify it's their child
    if ($unregisterUserId !== $currentUser['id']) {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND parent_id = ?");
        $stmt->execute([$unregisterUserId, $currentUser['id']]);
        
        if (!$stmt->fetch()) {
            sendError('You can only cancel registrations for yourself or your children', 403);
        }
    }
    
    $pdo = getDbConnection();
    
    try {
        $pdo->beginTransaction();
        
        // Fetch registration with event details
        $stmt = $pdo->prepare("
            SELECT r.id as registration_id, r.registered_by, e.title, e.price_per_person, e.date_time
            FROM registrations r
            JOIN events e ON r.event_id = e.id
            WHERE r.user_id = ? AND r.event_id = ? AND r.status = 'registered'
            FOR UPDATE
        ");
        $stmt->execute([$unregisterUserId, $eventId]);
        $registration = $stmt->fetch();
        
        if (!$registration) {
            $pdo->rollBack();
            sendError('Registration not found', 404);
        }
        
        // Check if event is in the future (allow cancellation up until event time)
        if (strtotime($registration['date_time']) <= time()) {
            $pdo->rollBack();
            sendError('Cannot cancel registration for past events', 400);
        }
        
        // Update registration status
        $stmt = $pdo->prepare("UPDATE registrations SET status = 'canceled' WHERE id = ?");
        $stmt->execute([$registration['registration_id']]);
        
        // Refund balance to the person who paid
        $payerId = (int)$registration['registered_by'];
        $refundAmount = (float)$registration['price_per_person'];
        
        if ($refundAmount > 0) {
            $stmt = $pdo->prepare("UPDATE users SET balance = balance + ? WHERE id = ?");
            $stmt->execute([$refundAmount, $payerId]);
            
            // Record refund transaction
            $stmt = $pdo->prepare("
                INSERT INTO transactions (user_id, amount, type, description, reference_id)
                VALUES (?, ?, 'refund', ?, ?)
            ");
            $stmt->execute([
                $payerId,
                $refundAmount,
                "Cancellation refund: {$registration['title']}",
                $registration['registration_id']
            ]);
            
            // Fetch updated balance if refund is for current user
            if ($payerId === $currentUser['id']) {
                $stmt = $pdo->prepare("SELECT balance FROM users WHERE id = ?");
                $stmt->execute([$currentUser['id']]);
                $newBalance = (float)$stmt->fetchColumn();
            }
        }
        
        $pdo->commit();
        
        sendSuccess([
            'refunded_amount' => $refundAmount,
            'new_balance' => $newBalance ?? null
        ], 'Registration cancelled successfully');
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to cancel registration', 500);
    }
}
