<?php
/**
 * Volley Registration App - User Deposits API
 *
 * Endpoints:
 * - GET: Get current user's deposit history
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetUserDeposits($currentUser);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * GET - Get user's deposit history
 */
function handleGetUserDeposits(array $currentUser): void
{
    $pdo = getDbConnection();

    try {
        $stmt = $pdo->prepare("
            SELECT
                id,
                amount,
                status,
                created_at,
                refunded_at
            FROM deposits
            WHERE user_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$currentUser['id']]);
        $deposits = $stmt->fetchAll();

        sendSuccess($deposits);

    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to fetch deposits', 500);
    }
}
