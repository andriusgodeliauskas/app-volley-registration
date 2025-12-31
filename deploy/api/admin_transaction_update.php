<?php
/**
 * Volley Registration App - Admin Update Transaction API
 * 
 * Endpoints:
 * - POST: Update transaction details (amount, date, description)
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

// Only Super Admin can edit financial records
if ($currentUser['role'] !== 'super_admin') {
    sendError('Unauthorized access', 403);
}

$input = getJsonInput();
$transactionId = isset($input['transaction_id']) ? (int)$input['transaction_id'] : 0;

if (!$transactionId) {
    sendError('Transaction ID is required', 400);
}

$pdo = getDbConnection();

try {
    $pdo->beginTransaction();

    // Fetch existing transaction with lock
    $stmt = $pdo->prepare("SELECT * FROM transactions WHERE id = ? FOR UPDATE");
    $stmt->execute([$transactionId]);
    $transaction = $stmt->fetch();

    if (!$transaction) {
        $pdo->rollBack();
        sendError('Transaction not found', 404);
    }

    $userId = $transaction['user_id'];
    $oldAmount = (float)$transaction['amount'];
    
    // Determine new values (use existing if not provided)
    $newAmount = isset($input['amount']) ? (float)$input['amount'] : $oldAmount;
    $newDescription = isset($input['description']) ? trim($input['description']) : $transaction['description'];
    $newCreatedAt = isset($input['created_at']) ? $input['created_at'] : $transaction['created_at'];

    // Update Transaction
    $stmt = $pdo->prepare("
        UPDATE transactions 
        SET amount = ?, description = ?, created_at = ? 
        WHERE id = ?
    ");
    $stmt->execute([$newAmount, $newDescription, $newCreatedAt, $transactionId]);

    // Update User Balance if amount changed
    if (abs($newAmount - $oldAmount) > 0.001) {
        $diff = $newAmount - $oldAmount;
        
        // Fetch user to update balance lock
        $stmt = $pdo->prepare("SELECT balance FROM users WHERE id = ? FOR UPDATE");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        $newBalance = (float)$user['balance'] + $diff;
        
        $stmt = $pdo->prepare("UPDATE users SET balance = ? WHERE id = ?");
        $stmt->execute([$newBalance, $userId]);
    }

    $pdo->commit();
    sendSuccess([], 'Transaction updated successfully');

} catch (PDOException $e) {
    $pdo->rollBack();
    if (APP_ENV === 'development') {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
    sendError('Failed to update transaction', 500);
}
