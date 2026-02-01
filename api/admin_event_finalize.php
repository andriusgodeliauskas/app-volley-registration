<?php
/**
 * Volley Registration App - Admin Event Finalize API
 * 
 * Endpoints:
 * - POST: Finalize event (charge registered users)
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

// Only Admins can finalize events
if ($currentUser['role'] !== 'super_admin' && $currentUser['role'] !== 'group_admin') {
    sendError('Unauthorized access', 403);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    sendError('Method not allowed', 405);
}

handleFinalizeEvent($currentUser);

function handleFinalizeEvent(array $adminUser): void
{
    $input = getJsonInput();
    
    if (!isset($input['event_id'])) {
        sendError('event_id is required', 400);
    }
    
    $eventId = (int)$input['event_id'];
    
    $pdo = getDbConnection();
    
    try {
        $pdo->beginTransaction();
        
        // Fetch event details
        $stmt = $pdo->prepare("SELECT * FROM events WHERE id = ? FOR UPDATE");
        $stmt->execute([$eventId]);
        $event = $stmt->fetch();
        
        if (!$event) {
            $pdo->rollBack();
            sendError('Event not found', 404);
        }
        
        if ($event['status'] === 'closed') {
            $pdo->rollBack();
            sendError('Event is already closed/finalized', 400);
        }

        // Allow finalizing canceled events? Probably not.
        if ($event['status'] === 'canceled') {
           // Maybe allow reviving? But for now, deny.
           $pdo->rollBack();
           sendError('Cannot finalize a canceled event', 400);
        }
        
        $eventPrice = (float)$event['price_per_person'];
        
        // If price is 0, just close the event
        if ($eventPrice <= 0) {
            $stmt = $pdo->prepare("UPDATE events SET status = 'closed' WHERE id = ?");
            $stmt->execute([$eventId]);
            $pdo->commit();
            sendSuccess([], 'Event closed (free event)');
            return;
        }
        
        // Fetch REGISTERED users, strictly ordered by registration ID, limited to max_players
        // This ensures we only charge the people who actually "got in" (including filled waitlist slots if they moved up logically)
        // Waitlist users beyond the capacity are ignored
        
        $stmt = $pdo->prepare("
            SELECT r.id as registration_id, r.user_id, r.registered_by
            FROM registrations r
            WHERE r.event_id = ? AND r.status = 'registered'
            ORDER BY r.id ASC
            LIMIT ?
        ");
        $stmt->execute([$eventId, $event['max_players']]);
        $registrationsToCharge = $stmt->fetchAll();
        
        $chargedCount = 0;

        foreach ($registrationsToCharge as $reg) {
            // Nustatyti kas moka (kas registravo arba pats dalyvis)
            $payerId = !empty($reg['registered_by']) ? $reg['registered_by'] : $reg['user_id'];
            $participantId = $reg['user_id'];

            // Patikrinti ar tai šeimos mokėjimas (moka už kitą)
            $isFamilyPayment = ($payerId !== $participantId);

            if ($isFamilyPayment) {
                // SECURITY: Patikrinti ar egzistuoja šeimos leidimas
                $stmt = $pdo->prepare("
                    SELECT id FROM family_permissions
                    WHERE requester_id = ? AND target_id = ? AND status = 'accepted'
                ");
                $stmt->execute([$payerId, $participantId]);

                if (!$stmt->fetch()) {
                    // Nėra leidimo - grįžti prie dalyvio mokėjimo už save
                    $payerId = $participantId;
                    $isFamilyPayment = false;
                }
            }

            if ($isFamilyPayment) {
                // Gauti mokėtojo nustatymus
                $stmt = $pdo->prepare("SELECT pay_for_family_members, name, balance FROM users WHERE id = ? FOR UPDATE");
                $stmt->execute([$payerId]);
                $payer = $stmt->fetch();
                $payerName = $payer ? $payer['name'] : 'Unknown';
                $payForFamilyMembers = $payer ? (bool)$payer['pay_for_family_members'] : false;
                $payerBalance = $payer ? (float)$payer['balance'] : 0.0;

                // Gauti dalyvio vardą
                $stmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
                $stmt->execute([$participantId]);
                $participant = $stmt->fetch();
                $participantName = $participant ? $participant['name'] : 'Unknown';

                // SECURITY: Patikrinti ar mokėtojas turi pakankamai lėšų prieš triple-transaction
                if ($payForFamilyMembers && $payerBalance < $eventPrice) {
                    // Nepakanka lėšų - grįžti prie senos logikos (dalyvis moka už save)
                    $payForFamilyMembers = false;
                }

                if ($payForFamilyMembers) {
                    // NAUJA LOGIKA: Trys transakcijos (skaidrus pinigų kelias)

                    // 1. Mokėtojas perveda pinigus dalyviui
                    $stmt = $pdo->prepare("UPDATE users SET balance = balance - ? WHERE id = ?");
                    $stmt->execute([$eventPrice, $payerId]);

                    $stmt = $pdo->prepare("
                        INSERT INTO transactions (user_id, amount, type, description, reference_id, created_by)
                        VALUES (?, ?, 'family_transfer', ?, ?, ?)
                    ");
                    $stmt->execute([
                        $payerId,
                        -$eventPrice,
                        "Transfer to {$participantName} for: {$event['title']}",
                        $reg['registration_id'],
                        $adminUser['id']
                    ]);

                    // 2. Dalyvis gauna pinigus iš mokėtojo
                    $stmt = $pdo->prepare("UPDATE users SET balance = balance + ? WHERE id = ?");
                    $stmt->execute([$eventPrice, $participantId]);

                    $stmt = $pdo->prepare("
                        INSERT INTO transactions (user_id, amount, type, description, reference_id, created_by)
                        VALUES (?, ?, 'family_transfer', ?, ?, ?)
                    ");
                    $stmt->execute([
                        $participantId,
                        $eventPrice,
                        "Transfer from {$payerName} for: {$event['title']}",
                        $reg['registration_id'],
                        $adminUser['id']
                    ]);

                    // 3. Dalyvis moka už renginį
                    $stmt = $pdo->prepare("UPDATE users SET balance = balance - ? WHERE id = ?");
                    $stmt->execute([$eventPrice, $participantId]);

                    $stmt = $pdo->prepare("
                        INSERT INTO transactions (user_id, amount, type, description, reference_id, created_by)
                        VALUES (?, ?, 'payment', ?, ?, ?)
                    ");
                    $stmt->execute([
                        $participantId,
                        -$eventPrice,
                        "Payment for: {$event['title']}",
                        $reg['registration_id'],
                        $adminUser['id']
                    ]);

                } else {
                    // SENA LOGIKA: Viena transakcija (tiesioginis mokėjimas)
                    $stmt = $pdo->prepare("UPDATE users SET balance = balance - ? WHERE id = ?");
                    $stmt->execute([$eventPrice, $payerId]);

                    $stmt = $pdo->prepare("
                        INSERT INTO transactions (user_id, amount, type, description, reference_id, created_by)
                        VALUES (?, ?, 'payment', ?, ?, ?)
                    ");
                    $stmt->execute([
                        $payerId,
                        -$eventPrice,
                        "Payment for: {$event['title']} (už {$participantName})",
                        $reg['registration_id'],
                        $adminUser['id']
                    ]);
                }

            } else {
                // Normalus atvejis: dalyvis moka už save
                $stmt = $pdo->prepare("UPDATE users SET balance = balance - ? WHERE id = ?");
                $stmt->execute([$eventPrice, $payerId]);

                $stmt = $pdo->prepare("
                    INSERT INTO transactions (user_id, amount, type, description, reference_id, created_by)
                    VALUES (?, ?, 'payment', ?, ?, ?)
                ");
                $stmt->execute([
                    $payerId,
                    -$eventPrice,
                    "Payment for: {$event['title']}",
                    $reg['registration_id'],
                    $adminUser['id']
                ]);
            }

            $chargedCount++;
        }
        
        // Update event status to closed
        $stmt = $pdo->prepare("UPDATE events SET status = 'closed' WHERE id = ?");
        $stmt->execute([$eventId]);
        
        $pdo->commit();
        
        sendSuccess([
            'charged_count' => $chargedCount,
            'total_amount' => $chargedCount * $eventPrice
        ], 'Event finalized and payments processed successfully');
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to finalize event', 500);
    }
}
