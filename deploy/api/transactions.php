<?php
/**
 * Volley Registration App - User Transactions API
 * 
 * Endpoints:
 * - GET: Fetch transaction history for current user
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetTransactions($currentUser);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * GET - Fetch transactions
 */
function handleGetTransactions(array $currentUser): void
{
    $pdo = getDbConnection();
    
    try {
        // Fetch last 50 transactions
        // Join with users table to get admin name for top-ups if needed
        $stmt = $pdo->prepare("
            SELECT t.*, u.name as admin_name 
            FROM transactions t 
            LEFT JOIN users u ON t.created_by = u.id 
            WHERE t.user_id = ? 
            ORDER BY t.created_at DESC 
            LIMIT 50
        ");
        $stmt->execute([$currentUser['id']]);
        $transactions = $stmt->fetchAll();
        
        sendSuccess($transactions);
        
    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to fetch transactions', 500);
    }
}
