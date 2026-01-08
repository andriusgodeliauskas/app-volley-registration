<?php
/**
 * Volley Registration App - Admin Top-up API
 * 
 * Endpoints:
 * - POST: Add funds to user wallet
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

// Only Super Admin can top up wallets
if ($currentUser['role'] !== 'super_admin') {
    sendError('Unauthorized access', 403);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    sendError('Method not allowed', 405);
}

handleTopUp($currentUser);

function handleTopUp(array $adminUser): void
{
    $input = getJsonInput();
    
    if (!isset($input['user_id']) || !isset($input['amount'])) {
        sendError('user_id and amount are required', 400);
    }
    
    $userId = (int)$input['user_id'];
    $amount = (float)$input['amount'];
    $description = isset($input['description']) ? trim($input['description']) : 'Manual Top-up';

    if ($amount == 0) {
        sendError('Amount cannot be zero', 400);
    }
    
    $pdo = getDbConnection();
    
    try {
        $pdo->beginTransaction();
        
        // Verify user exists
        $stmt = $pdo->prepare("SELECT id, name, balance FROM users WHERE id = ? FOR UPDATE");
        $stmt->execute([$userId]);
        $targetUser = $stmt->fetch();
        
        if (!$targetUser) {
            $pdo->rollBack();
            sendError('User not found', 404);
        }
        
        // Update balance
        $newBalance = (float)$targetUser['balance'] + $amount;
        $stmt = $pdo->prepare("UPDATE users SET balance = ? WHERE id = ?");
        $stmt->execute([$newBalance, $userId]);
        
    $createdAt = !empty($input['created_at']) ? $input['created_at'] : date('Y-m-d H:i:s');
        
        // Record transaction
        $stmt = $pdo->prepare("
            INSERT INTO transactions (user_id, amount, type, description, created_by, created_at)
            VALUES (?, ?, 'topup', ?, ?, ?)
        ");
        $stmt->execute([$userId, $amount, $description, $adminUser['id'], $createdAt]);
        
        $pdo->commit();

        $message = $amount > 0
            ? 'Wallet topped up successfully'
            : 'Funds deducted successfully';

        sendSuccess([
            'new_balance' => $newBalance,
            'topup_amount' => $amount
        ], $message, 201);
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to top up wallet', 500);
    }
}
