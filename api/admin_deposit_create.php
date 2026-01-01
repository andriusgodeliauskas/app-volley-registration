<?php
/**
 * Volley Registration App - Admin Create Deposit API
 *
 * Endpoints:
 * - POST: Super admin manually creates a deposit for a user (without deducting from balance)
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

// Only super_admin can create deposits manually
if ($currentUser['role'] !== 'super_admin') {
    sendError('Access denied. Super Admin privileges required.', 403);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        handleAdminCreateDeposit($currentUser);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * POST - Admin creates a deposit for a user
 */
function handleAdminCreateDeposit(array $currentUser): void
{
    $input = getJsonInput();

    // Validate required fields
    $required = ['user_id', 'amount'];
    $missing = validateRequired($input, $required);

    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 400);
    }

    $userId = (int)$input['user_id'];
    $amount = floatval($input['amount']);
    $depositDate = $input['deposit_date'] ?? null; // Optional custom date

    if ($amount <= 0) {
        sendError('Amount must be greater than 0', 400);
    }

    $pdo = getDbConnection();

    try {
        // Start transaction
        $pdo->beginTransaction();

        // Check if user exists
        $stmt = $pdo->prepare("SELECT id, name, surname FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            $pdo->rollBack();
            sendError('User not found', 404);
        }

        // Check if user already has an active deposit
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM deposits WHERE user_id = ? AND status = 'active'");
        $stmt->execute([$userId]);
        $depositCheck = $stmt->fetch();

        if ($depositCheck['count'] > 0) {
            $pdo->rollBack();
            sendError('User already has an active deposit', 400);
        }

        // Check user balance FIRST (before creating deposit)
        $stmt = $pdo->prepare("SELECT balance FROM users WHERE id = ? FOR UPDATE");
        $stmt->execute([$userId]);
        $userBalance = $stmt->fetch();

        if (!$userBalance) {
            $pdo->rollBack();
            sendError('Failed to fetch user balance', 500);
        }

        $currentBalance = floatval($userBalance['balance']);

        if ($currentBalance < $amount) {
            $pdo->rollBack();
            sendError('User has insufficient balance. Current balance: €' . number_format($currentBalance, 2), 400);
        }

        // Check max_depositors limit for user's groups
        $stmt = $pdo->prepare("
            SELECT DISTINCT g.id, g.max_depositors
            FROM groups g
            INNER JOIN user_groups ug ON g.id = ug.group_id
            WHERE ug.user_id = ? AND g.is_active = 1
        ");
        $stmt->execute([$userId]);
        $userGroups = $stmt->fetchAll();

        // Check limits for each group
        foreach ($userGroups as $group) {
            if ($group['max_depositors'] !== null) {
                $maxDepositors = (int)$group['max_depositors'];

                // Count active deposits in this group
                $stmt = $pdo->prepare("
                    SELECT COUNT(DISTINCT d.user_id) as active_count
                    FROM deposits d
                    INNER JOIN user_groups ug ON d.user_id = ug.user_id
                    WHERE ug.group_id = ? AND d.status = 'active'
                ");
                $stmt->execute([$group['id']]);
                $depositCount = $stmt->fetch();
                $activeCount = (int)$depositCount['active_count'];

                if ($activeCount >= $maxDepositors) {
                    $pdo->rollBack();
                    sendError('Depositor limit reached for this group.', 400);
                }
            }
        }

        // Deduct from user balance
        $newBalance = $currentBalance - $amount;
        $stmt = $pdo->prepare("UPDATE users SET balance = ? WHERE id = ?");
        $stmt->execute([$newBalance, $userId]);

        // Create transaction record
        $stmt = $pdo->prepare("
            INSERT INTO transactions (user_id, type, amount, balance_after, description, created_at)
            VALUES (?, 'debit', ?, ?, 'Deposit payment (admin created)', NOW())
        ");
        $stmt->execute([$userId, $amount, $newBalance]);

        // Create deposit record with custom date if provided
        if ($depositDate) {
            // Validate date format
            $timestamp = strtotime($depositDate);
            if ($timestamp === false) {
                $pdo->rollBack();
                sendError('Invalid date format. Use YYYY-MM-DD or YYYY-MM-DD HH:MM:SS', 400);
            }
            $formattedDate = date('Y-m-d H:i:s', $timestamp);

            $stmt = $pdo->prepare("
                INSERT INTO deposits (user_id, amount, status, created_at)
                VALUES (?, ?, 'active', ?)
            ");
            $stmt->execute([$userId, $amount, $formattedDate]);
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO deposits (user_id, amount, status, created_at)
                VALUES (?, ?, 'active', NOW())
            ");
            $stmt->execute([$userId, $amount]);
        }

        $depositId = $pdo->lastInsertId();

        // Commit transaction
        $pdo->commit();

        sendSuccess([
            'success' => true,
            'message' => 'Deposit created successfully for ' . $user['name'] . ' ' . $user['surname'],
            'deposit_id' => $depositId,
            'user_name' => $user['name'] . ' ' . $user['surname']
        ]);

    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to create deposit', 500);
    }
}
