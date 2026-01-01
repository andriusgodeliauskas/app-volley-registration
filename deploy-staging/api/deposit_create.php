<?php
/**
 * Volley Registration App - Create Deposit API
 *
 * Endpoints:
 * - POST: Create a new deposit (deduct 50 EUR from user balance)
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        handleCreateDeposit($currentUser);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * POST - Create a deposit
 */
function handleCreateDeposit(array $currentUser): void
{
    $pdo = getDbConnection();

    // Fixed deposit amount
    $amount = 50.00;

    try {
        // Start transaction
        $pdo->beginTransaction();

        // Check user balance with row lock
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
            sendError('Insufficient balance. You need at least 50 EUR to pay a deposit.', 400);
        }

        // Deduct from user balance
        $newBalance = $currentBalance - $amount;
        $stmt = $pdo->prepare("UPDATE users SET balance = ? WHERE id = ?");
        $stmt->execute([$newBalance, $currentUser['id']]);

        // Create deposit record
        $stmt = $pdo->prepare("
            INSERT INTO deposits (user_id, amount, status, created_at)
            VALUES (?, ?, 'active', NOW())
        ");
        $stmt->execute([$currentUser['id'], $amount]);
        $depositId = $pdo->lastInsertId();

        // Create transaction record for user history
        $stmt = $pdo->prepare("
            INSERT INTO transactions (user_id, amount, type, description, reference_id, created_by, created_at)
            VALUES (?, ?, 'deposit_payment', 'Deposit payment for priority registration', ?, ?, NOW())
        ");
        $stmt->execute([
            $currentUser['id'],
            -$amount, // Negative amount for deduction
            $depositId,
            $currentUser['id']
        ]);

        // Commit transaction
        $pdo->commit();

        sendSuccess([
            'success' => true,
            'message' => 'Deposit payment successful',
            'new_balance' => $newBalance,
            'deposit_id' => $depositId
        ]);

    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to process deposit payment', 500);
    }
}
