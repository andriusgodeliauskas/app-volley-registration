<?php
/**
 * Email Logs API - Admin Only
 * 
 * Endpoints:
 * - GET: Fetch email logs with optional filters
 * 
 * Query Parameters:
 * - user_id: Filter by user ID
 * - email_type: Filter by email type
 * - page: Page number (default: 1)
 * - per_page: Items per page (default: 50, max: 100)
 */

require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../db.php';

// Require admin authentication
$currentUser = requireAuth();
if ($currentUser['role'] !== 'super_admin' && $currentUser['role'] !== 'group_admin') {
    sendError('Unauthorized - Admin access required', 403);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetEmailLogs();
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * GET - Fetch email logs
 */
function handleGetEmailLogs(): void
{
    try {
        $pdo = getDbConnection();

        // Get query parameters
        $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
        $emailType = isset($_GET['email_type']) ? $_GET['email_type'] : null;
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $perPage = isset($_GET['per_page']) ? min(100, max(1, (int)$_GET['per_page'])) : 50;
        $offset = ($page - 1) * $perPage;

        // Build WHERE clause
        $where = [];
        $params = [];

        if ($userId) {
            $where[] = 'el.user_id = ?';
            $params[] = $userId;
        }

        if ($emailType) {
            $where[] = 'el.email_type = ?';
            $params[] = $emailType;
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        // Get total count
        $countStmt = $pdo->prepare("
            SELECT COUNT(*) as total
            FROM email_logs el
            $whereClause
        ");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];

        // Get email logs
        $stmt = $pdo->prepare("
            SELECT 
                el.id,
                el.user_id,
                el.email_type,
                el.recipient_email,
                el.subject,
                el.body_preview,
                el.sent_at,
                el.status,
                el.error_message,
                el.sent_by_admin_id,
                u.name as user_name,
                u.surname as user_surname,
                admin.name as admin_name,
                admin.surname as admin_surname
            FROM email_logs el
            INNER JOIN users u ON el.user_id = u.id
            LEFT JOIN users admin ON el.sent_by_admin_id = admin.id
            $whereClause
            ORDER BY el.sent_at DESC
            LIMIT ? OFFSET ?
        ");

        $stmt->execute(array_merge($params, [$perPage, $offset]));
        $emails = $stmt->fetchAll();

        sendSuccess([
            'emails' => $emails,
            'total' => (int)$total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => ceil($total / $perPage)
        ]);

    } catch (PDOException $e) {
        error_log("Failed to fetch email logs: " . $e->getMessage());
        sendError('Failed to fetch email logs', 500);
    }
}
