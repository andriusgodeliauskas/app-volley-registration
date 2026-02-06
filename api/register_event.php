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

    // If registering someone else, verify permission via family_permissions OR current user is super_admin
    if ($registerUserId !== $currentUser['id']) {
        $pdo = getDbConnection();

        if ($currentUser['role'] !== 'super_admin') {
            // Regular users can only register users they have permission for
            // ONE-WAY permission: only requester can register target (not vice versa)
            $stmt = $pdo->prepare("
                SELECT fp.id
                FROM family_permissions fp
                WHERE fp.requester_id = ?
                AND fp.target_id = ?
                AND fp.status = 'accepted'
            ");
            $stmt->execute([$currentUser['id'], $registerUserId]);

            if (!$stmt->fetch()) {
                sendError('You do not have permission to register this user', 403);
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
                e.negative_balance_limit,
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

        // Check registration cutoff (skip for super admin)
        if ($currentUser['role'] !== 'super_admin') {
            $eventTime = strtotime($event['date_time']);
            $now = time();
            $cutoffHours = $event['registration_cutoff_hours'] ?? 1; // Default to 1 hour if NULL
            $cutoffSeconds = $cutoffHours * 3600;

            if (($eventTime - $now) < $cutoffSeconds) {
                $pdo->rollBack();
                sendError("Registration is closed {$cutoffHours} hours before the event", 400);
            }
        }

        // Check negative balance limits (skip for super admin)
        if ($currentUser['role'] !== 'super_admin') {
            // Fetch user's current balance and negative balance limit
            $stmt = $pdo->prepare("
                SELECT balance, negative_balance_limit
                FROM users
                WHERE id = ?
            ");
            $stmt->execute([$registerUserId]);
            $user = $stmt->fetch();

            if (!$user) {
                $pdo->rollBack();
                sendError('User not found', 404);
            }

            $userBalance = (float)$user['balance'];
            $userNegativeLimit = (float)$user['negative_balance_limit'];
            $eventNegativeLimit = (float)$event['negative_balance_limit'];

            // Check if user's balance is below their personal limit
            if ($userBalance < $userNegativeLimit) {
                $pdo->rollBack();
                sendError('balance_exceeds_user_limit', 400);
            }

            // Check if user's balance is below event's limit
            if ($userBalance < $eventNegativeLimit) {
                $pdo->rollBack();
                sendError('balance_exceeds_event_limit', 400);
            }
        }

        // Check if spots are available - REMOVED for waitlist feature
        // if ((int)$event['registered_count'] >= (int)$event['max_players']) {
        //     $pdo->rollBack();
        //     sendError('Event is full. No spots available.', 400);
        // }
        
        // Check if user has an active deposit (check BEFORE registration logic)
        $stmt = $pdo->prepare("
            SELECT id, user_id, status, amount
            FROM deposits
            WHERE user_id = ? AND status = 'active'
            LIMIT 1
        ");
        $stmt->execute([$registerUserId]);
        $deposit = $stmt->fetch();
        $hasDeposit = ($deposit !== false);

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

            // Re-registration: Check deposit priority before updating status
            $registeredCount = (int)$event['registered_count'];
            $maxPlayers = (int)$event['max_players'];

            // If event is full, check deposit priority
            if ($registeredCount >= $maxPlayers) {
                if ($hasDeposit) {
                    // Depositor has priority - find last registered user WITHOUT deposit and move to waitlist
                    $stmt = $pdo->prepare("
                        SELECT r.id, r.user_id, r.created_at
                        FROM registrations r
                        LEFT JOIN deposits d ON r.user_id = d.user_id AND d.status = 'active'
                        WHERE r.event_id = ? AND r.status = 'registered' AND d.id IS NULL
                        ORDER BY r.created_at DESC
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
                        $stmt = $pdo->prepare("
                            UPDATE registrations
                            SET status = 'registered', registered_by = ?
                            WHERE id = ?
                        ");
                        $stmt->execute([$currentUser['id'], $existingRegistration['id']]);
                    } else {
                        // All registered users have deposits, so keep in waitlist
                        $stmt = $pdo->prepare("
                            UPDATE registrations
                            SET status = 'waitlist', registered_by = ?
                            WHERE id = ?
                        ");
                        $stmt->execute([$currentUser['id'], $existingRegistration['id']]);
                    }
                } else {
                    // Non-depositor and event is full - stays in waitlist
                    $stmt = $pdo->prepare("
                        UPDATE registrations
                        SET status = 'waitlist', registered_by = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([$currentUser['id'], $existingRegistration['id']]);
                }
            } else {
                // Event has space - simply update to registered
                $stmt = $pdo->prepare("
                    UPDATE registrations
                    SET status = 'registered', registered_by = ?
                    WHERE id = ?
                ");
                $stmt->execute([$currentUser['id'], $existingRegistration['id']]);
            }

            $registrationId = $existingRegistration['id'];

        } else {
            // NEW REGISTRATION: Deposit already checked above

            // Determine initial status based on capacity and deposit
            $registeredCount = (int)$event['registered_count'];
            $maxPlayers = (int)$event['max_players'];
            $status = 'registered';

            // If event is full
            if ($registeredCount >= $maxPlayers) {
                if ($hasDeposit) {
                    // Depositor has priority - find last registered user WITHOUT deposit and move to waitlist
                    // Use created_at to find truly the last person who registered (not by ID)
                    $stmt = $pdo->prepare("
                        SELECT r.id, r.user_id, r.created_at
                        FROM registrations r
                        LEFT JOIN deposits d ON r.user_id = d.user_id AND d.status = 'active'
                        WHERE r.event_id = ? AND r.status = 'registered' AND d.id IS NULL
                        ORDER BY r.created_at DESC
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

    // If unregistering someone else, verify permission via family_permissions OR current user is super_admin
    if ($unregisterUserId !== $currentUser['id']) {
        $pdo = getDbConnection();

        if ($currentUser['role'] !== 'super_admin') {
            // Regular users can only cancel registrations for users they have permission for
            // ONE-WAY permission: only requester can cancel target's registration (not vice versa)
            $stmt = $pdo->prepare("
                SELECT fp.id
                FROM family_permissions fp
                WHERE fp.requester_id = ?
                AND fp.target_id = ?
                AND fp.status = 'accepted'
            ");
            $stmt->execute([$currentUser['id'], $unregisterUserId]);

            if (!$stmt->fetch()) {
                sendError('You do not have permission to cancel this user\'s registration', 403);
            }
        }
        // Super admin can cancel anyone's registration - no check needed
    }
    
    $pdo = getDbConnection();
    
    try {
        $pdo->beginTransaction();
        
        // Fetch registration with event details (both registered and waitlist can be cancelled)
        $stmt = $pdo->prepare("
            SELECT r.id as registration_id, r.registered_by, r.status as registration_status, e.title, e.date_time, e.registration_cutoff_hours
            FROM registrations r
            JOIN events e ON r.event_id = e.id
            WHERE r.user_id = ? AND r.event_id = ? AND r.status IN ('registered', 'waitlist')
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

        // Check cancellation cutoff (skip for super admin)
        if ($currentUser['role'] !== 'super_admin') {
            $cutoffHours = $registration['registration_cutoff_hours'] ?? 1; // Default to 1 hour if NULL
            $cutoffSeconds = $cutoffHours * 3600;

            if (($eventTime - $now) < $cutoffSeconds) {
                $pdo->rollBack();
                sendError("Cancellation is not allowed {$cutoffHours} hours before the event", 400);
            }
        }
        
        // Update registration status
        $stmt = $pdo->prepare("UPDATE registrations SET status = 'canceled' WHERE id = ?");
        $stmt->execute([$registration['registration_id']]);

        // No refund logic needed as no payment was taken upfront

        // AUTOMATIC WAITLIST PROMOTION: Only when a registered user cancels (not waitlist)
        // Waitlist cancellation doesn't open a spot, so no promotion needed
        $wasRegistered = $registration['registration_status'] === 'registered';

        if ($wasRegistered) {
            // Check if anyone is waiting and promote them
            // This opens up 1 spot, so check if there are people on waitlist
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as waiting_count
                FROM registrations
                WHERE event_id = ? AND status = 'waitlist'
            ");
            $stmt->execute([$eventId]);
            $waitingCount = (int)$stmt->fetch()['waiting_count'];

            if ($waitingCount > 0) {
                // PRIORITY 1: Try to promote someone WITH deposit first
                $stmt = $pdo->prepare("
                    UPDATE registrations r
                    INNER JOIN deposits d ON r.user_id = d.user_id AND d.status = 'active'
                    SET r.status = 'registered'
                    WHERE r.event_id = ? AND r.status = 'waitlist'
                    ORDER BY r.created_at ASC
                    LIMIT 1
                ");
                $stmt->execute([$eventId]);
                $promotedWithDeposit = $stmt->rowCount();

                // PRIORITY 2: If no depositor waiting, promote oldest non-depositor
                if ($promotedWithDeposit === 0) {
                    $stmt = $pdo->prepare("
                        UPDATE registrations r
                        LEFT JOIN deposits d ON r.user_id = d.user_id AND d.status = 'active'
                        SET r.status = 'registered'
                        WHERE r.event_id = ? AND r.status = 'waitlist' AND d.id IS NULL
                        ORDER BY r.created_at ASC
                        LIMIT 1
                    ");
                    $stmt->execute([$eventId]);
                }
            }
        }

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
