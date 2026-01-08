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

    // If registering someone else, verify it's their child OR current user is super_admin
    if ($registerUserId !== $currentUser['id']) {
        $pdo = getDbConnection();

        if ($currentUser['role'] !== 'super_admin') {
            // Regular users can only register their children
            $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND parent_id = ?");
            $stmt->execute([$registerUserId, $currentUser['id']]);

            if (!$stmt->fetch()) {
                sendError('You can only register yourself or your children', 403);
            }
        }
        // Super admin can register anyone - no check needed
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
        
        // Check if event is open for registration (skip for super admin)
        if ($currentUser['role'] !== 'super_admin' && $event['status'] !== 'open') {
            $pdo->rollBack();
            sendError('Event is not open for registration', 400);
        }

        // Check if event is in the future (skip for super admin)
        if ($currentUser['role'] !== 'super_admin' && strtotime($event['date_time']) <= time()) {
            $pdo->rollBack();
            sendError('Cannot register for past events', 400);
        }
        
        // Check if spots are available - REMOVED for waitlist feature
        // if ((int)$event['registered_count'] >= (int)$event['max_players']) {
        //     $pdo->rollBack();
        //     sendError('Event is full. No spots available.', 400);
        // }
        
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
            // Check if user has an active deposit
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as has_deposit
                FROM deposits
                WHERE user_id = ? AND status = 'active'
            ");
            $stmt->execute([$registerUserId]);
            $depositCheck = $stmt->fetch();
            $hasDeposit = (int)$depositCheck['has_deposit'] > 0;

            // Determine initial status based on capacity and deposit
            $registeredCount = (int)$event['registered_count'];
            $maxPlayers = (int)$event['max_players'];
            $status = 'registered';

            // If event is full
            if ($registeredCount >= $maxPlayers) {
                if ($hasDeposit) {
                    // Depositor has priority - find last registered user WITHOUT deposit and move to waitlist
                    $stmt = $pdo->prepare("
                        SELECT r.id, r.user_id
                        FROM registrations r
                        LEFT JOIN deposits d ON r.user_id = d.user_id AND d.status = 'active'
                        WHERE r.event_id = ? AND r.status = 'registered' AND d.id IS NULL
                        ORDER BY r.id DESC
                        LIMIT 1
                    ");
                    $stmt->execute([$eventId]);
                    $lastNonDepositor = $stmt->fetch();

                    if ($lastNonDepositor) {
                        // Move the last non-depositor to waitlist
                        $stmt = $pdo->prepare("
                            UPDATE registrations
                            SET status = 'waitlist'
                            WHERE id = ?
                        ");
                        $stmt->execute([$lastNonDepositor['id']]);

                        // Depositor gets 'registered' status
                        $status = 'registered';
                    } else {
                        // All registered users have deposits, so add to waitlist
                        $status = 'waitlist';
                    }
                } else {
                    // Non-depositor and event is full - waitlist
                    $status = 'waitlist';
                }
            }

            // New registration: Insert
            $stmt = $pdo->prepare("
                INSERT INTO registrations (user_id, event_id, registered_by, status)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$registerUserId, $eventId, $currentUser['id'], $status]);
            $registrationId = $pdo->lastInsertId();
        }
        
        // No immediate balance deduction
        
        $pdo->commit();
        
        sendSuccess([
            'registration_id' => (int)$registrationId
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
 * - user_id: (optional) ID of user to unregister (for children or admin cancellation)
 */
function handleCancelRegistration(array $currentUser): void
{
    $eventId = isset($_GET['event_id']) ? (int)$_GET['event_id'] : null;

    if (!$eventId) {
        sendError('event_id is required', 400);
    }

    // Determine who to unregister
    $unregisterUserId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : $currentUser['id'];

    // If unregistering someone else, verify it's their child OR current user is super_admin
    if ($unregisterUserId !== $currentUser['id']) {
        $pdo = getDbConnection();

        if ($currentUser['role'] !== 'super_admin') {
            // Regular users can only cancel registrations for their children
            $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND parent_id = ?");
            $stmt->execute([$unregisterUserId, $currentUser['id']]);

            if (!$stmt->fetch()) {
                sendError('You can only cancel registrations for yourself or your children', 403);
            }
        }
        // Super admin can cancel anyone's registration - no check needed
    }
    
    $pdo = getDbConnection();
    
    try {
        $pdo->beginTransaction();
        
        // Fetch registration with event details
        $stmt = $pdo->prepare("
            SELECT r.id as registration_id, r.registered_by, e.title, e.date_time
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
        
        $eventTime = strtotime($registration['date_time']);
        $now = time();

        // Check if event is in the past
        if ($eventTime <= $now) {
            $pdo->rollBack();
            sendError('Cannot cancel registration for past events', 400);
        }
        
        // Check if less than 1 hour before event
        if (($eventTime - $now) < 3600) {
            $pdo->rollBack();
            sendError('Cannot cancel registration less than 1 hour before the event', 400);
        }
        
        // Update registration status
        $stmt = $pdo->prepare("UPDATE registrations SET status = 'canceled' WHERE id = ?");
        $stmt->execute([$registration['registration_id']]);
        
        // No refund logic needed as no payment was taken upfront

        $pdo->commit();
        
        sendSuccess([], 'Registration cancelled successfully');
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to cancel registration', 500);
    }
}
