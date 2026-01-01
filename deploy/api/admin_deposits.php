<?php
/**
 * Volley Registration App - Admin Deposits API
 *
 * Endpoints:
 * - GET: Get all deposits (super_admin only)
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
    case 'GET':
        handleGetAllDeposits();
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * GET - Get all deposits with user information
 */
function handleGetAllDeposits(): void
{
    $pdo = getDbConnection();

    try {
        $stmt = $pdo->prepare("
            SELECT
                d.id,
                d.user_id,
                u.name AS user_name,
                u.surname AS user_surname,
                u.email AS user_email,
                d.amount,
                d.status,
                d.created_at,
                d.refunded_at,
                d.refunded_by,
                admin.name AS refunded_by_name,
                admin.surname AS refunded_by_surname
            FROM deposits d
            INNER JOIN users u ON d.user_id = u.id
            LEFT JOIN users admin ON d.refunded_by = admin.id
            ORDER BY d.created_at DESC
        ");
        $stmt->execute();
        $deposits = $stmt->fetchAll();

        sendSuccess($deposits);

    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to fetch deposits', 500);
    }
}
