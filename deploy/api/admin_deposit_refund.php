<?php
/**
 * Volley Registration App - Admin Deposit Refund API
 *
 * Endpoints:
 * - POST: Refund a deposit to user (super_admin only)
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

// Require super_admin role
if ($currentUser['role'] !== 'super_admin') {
    sendError('Access denied. Super admin privileges required.', 403);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        handleRefundDeposit($currentUser);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * POST - Refund a deposit
 */
function handleRefundDeposit(array $currentUser): void
{
    $pdo = getDbConnection();

    // Validate input
    $input = getJsonInput();

    if (!isset($input['deposit_id']) || !is_numeric($input['deposit_id'])) {
        sendError('Invalid deposit_id', 400);
    }

    $depositId = intval($input['deposit_id']);

    try {
        // Start transaction
        $pdo->beginTransaction();

        // Get deposit with row lock
        $stmt = $pdo->prepare("
            SELECT id, user_id, amount, status
            FROM deposits
            WHERE id = ?
            FOR UPDATE
        ");
        $stmt->execute([$depositId]);
        $deposit = $stmt->fetch();

        if (!$deposit) {
            $pdo->rollBack();
            sendError('Deposit not found', 404);
        }

        if ($deposit['status'] !== 'active') {
            $pdo->rollBack();
            sendError('Deposit is not active. Cannot refund.', 400);
        }

        $userId = $deposit['user_id'];
        $amount = floatval($deposit['amount']);

        // Get user balance with row lock
        $stmt = $pdo->prepare("SELECT balance FROM users WHERE id = ? FOR UPDATE");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            $pdo->rollBack();
            sendError('User not found', 404);
        }

        $currentBalance = floatval($user['balance']);

        // Add deposit amount back to user balance
        $newBalance = $currentBalance + $amount;
        $stmt = $pdo->prepare("UPDATE users SET balance = ? WHERE id = ?");
        $stmt->execute([$newBalance, $userId]);

        // Update deposit status to refunded
        $stmt = $pdo->prepare("
            UPDATE deposits
            SET status = 'refunded',
                refunded_at = NOW(),
                refunded_by = ?
            WHERE id = ?
        ");
        $stmt->execute([$currentUser['id'], $depositId]);

        // Create transaction record for refund
        $stmt = $pdo->prepare("
            INSERT INTO transactions (user_id, amount, type, description, reference_id, created_by, created_at)
            VALUES (?, ?, 'deposit_refund', 'Deposit refund', ?, ?, NOW())
        ");
        $stmt->execute([
            $userId,
            $amount, // Positive amount for refund
            $depositId,
            $currentUser['id']
        ]);

        // Commit transaction
        $pdo->commit();

        sendSuccess([
            'success' => true,
            'message' => 'Deposit refunded successfully',
            'new_balance' => $newBalance
        ]);

    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to refund deposit', 500);
    }
}
