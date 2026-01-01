<?php
/**
 * Volley Registration App - Donations API
 *
 * Endpoints:
 * - GET: Fetch all donations list (for public display)
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetDonations();
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * GET - Fetch all donations
 */
function handleGetDonations(): void
{
    $pdo = getDbConnection();

    try {
        // Fetch all donations with user info
        $stmt = $pdo->prepare("
            SELECT d.id, d.user_id, d.amount, d.created_at,
                   u.name as user_name, u.surname as user_surname
            FROM donations d
            INNER JOIN users u ON d.user_id = u.id
            ORDER BY d.created_at DESC
            LIMIT 100
        ");
        $stmt->execute();
        $donations = $stmt->fetchAll();

        sendSuccess(['donations' => $donations]);

    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to fetch donations', 500);
    }
}
