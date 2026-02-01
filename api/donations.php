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
        handleGetDonations($currentUser);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * GET - Fetch current user's donations
 */
function handleGetDonations(array $currentUser): void
{
    try {
        $pdo = getDbConnection();

        // Get current user ID from authentication
        $userId = $currentUser['id'];

        // Fetch only current user's donations
        $stmt = $pdo->prepare("
            SELECT 
                d.id, d.amount, d.created_at,
                u.name as user_name, u.surname as user_surname
            FROM donations d
            INNER JOIN users u ON d.user_id = u.id
            WHERE d.user_id = ?
            ORDER BY d.created_at DESC
        ");
        $stmt->execute([$userId]);

        $donations = $stmt->fetchAll();

        sendSuccess(['donations' => $donations]);

    } catch (PDOException $e) {
        error_log("Failed to fetch donations: " . $e->getMessage());
        sendError('Failed to fetch donations', 500);
    }
}
