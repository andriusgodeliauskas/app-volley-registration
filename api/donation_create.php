<?php
/**
 * Volley Registration App - Create Donation API
 *
 * Endpoints:
 * - POST: Create a new donation (deduct from user balance)
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        handleCreateDonation($currentUser);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * POST - Create a donation
 */
function handleCreateDonation(array $currentUser): void
{
    $pdo = getDbConnection();

    // Validate input
    $input = getJsonInput();

    if (!isset($input['amount']) || !is_numeric($input['amount'])) {
        sendError('Invalid amount', 400);
    }

    $amount = floatval($input['amount']);

    if ($amount <= 0) {
        sendError('Amount must be greater than 0', 400);
    }

    try {
        // Start transaction
        $pdo->beginTransaction();

        // Check user balance
        $stmt = $pdo->prepare("SELECT balance FROM users WHERE id = ? FOR UPDATE");
        $stmt->execute([$currentUser['id']]);
        $user = $stmt->fetch();

        if (!$user) {
            $pdo->rollBack();
            sendError('User not found', 404);
        }

        $currentBalance = floatval($user['balance']);

        if ($currentBalance < $amount) {
            $pdo->rollBack();
            sendError('Insufficient balance', 400);
        }

        // Deduct from user balance
        $newBalance = $currentBalance - $amount;
        $stmt = $pdo->prepare("UPDATE users SET balance = ? WHERE id = ?");
        $stmt->execute([$newBalance, $currentUser['id']]);

        // Create donation record
        $stmt = $pdo->prepare("
            INSERT INTO donations (user_id, amount, created_at)
            VALUES (?, ?, NOW())
        ");
        $stmt->execute([$currentUser['id'], $amount]);

        // Create transaction record for user history
        $stmt = $pdo->prepare("
            INSERT INTO transactions (user_id, amount, type, description, created_at)
            VALUES (?, ?, 'payment', ?, NOW())
        ");
        $stmt->execute([
            $currentUser['id'],
            -$amount, // Negative amount for deduction
            'Support Organizer Donation'
        ]);

        // Commit transaction
        $pdo->commit();

        sendSuccess([
            'success' => true,
            'message' => 'Donation successful',
            'new_balance' => $newBalance
        ]);

    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to process donation', 500);
    }
}
