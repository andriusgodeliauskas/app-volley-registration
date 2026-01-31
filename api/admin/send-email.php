<?php
/**
 * Send Email API - Admin Only
 * 
 * Endpoint:
 * - POST: Send email to user
 * 
 * Request Body:
 * {
 *   "user_id": 5,
 *   "email_type": "account_activation" | "negative_balance"
 * }
 */

// Suppress warnings in production (they break JSON output)
// Errors are still logged to error_log
if (!defined('APP_ENV') || APP_ENV !== 'development') {
    error_reporting(E_ERROR | E_PARSE);
    ini_set('display_errors', '0');
}

require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../db.php';

// Require admin authentication
$currentUser = requireAuth();
if ($currentUser['role'] !== 'super_admin' && $currentUser['role'] !== 'group_admin') {
    sendError('Unauthorized - Admin access required', 403);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        handleSendEmail($currentUser);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * POST - Send email to user
 */
function handleSendEmail(array $currentUser): void
{
    try {
        $input = getJsonInput();

        // Validate input
        if (empty($input['user_id'])) {
            sendError('Missing user_id', 400);
        }

        if (empty($input['email_type'])) {
            sendError('Missing email_type', 400);
        }

        $userId = (int)$input['user_id'];
        $emailType = $input['email_type'];

        // Validate email type
        $allowedTypes = ['account_activation', 'negative_balance'];
        if (!in_array($emailType, $allowedTypes)) {
            sendError('Invalid email_type. Allowed: ' . implode(', ', $allowedTypes), 400);
        }

        // Rate limiting - max 10 manual emails per hour per admin
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count
            FROM email_logs
            WHERE sent_by_admin_id = ?
                AND sent_at > NOW() - INTERVAL 1 HOUR
        ");
        $stmt->execute([$currentUser['id']]);
        $count = $stmt->fetch()['count'];

        if ($count >= 10) {
            sendError('Rate limit exceeded. Maximum 10 manual emails per hour.', 429);
        }

        // Send email based on type
        $success = false;

        switch ($emailType) {
            case 'account_activation':
                require_once __DIR__ . '/../send-activation-email.php';
                $success = sendAccountActivationEmail($userId, $pdo);
                break;

            case 'negative_balance':
                require_once __DIR__ . '/../send-negative-balance-email.php';
                $success = sendNegativeBalanceEmail($userId, $pdo);
                break;
        }

        if ($success) {
            sendSuccess([
                'message' => 'Email sent successfully',
                'user_id' => $userId,
                'email_type' => $emailType
            ]);
        } else {
            sendError('Failed to send email', 500);
        }

    } catch (Exception $e) {
        error_log("Send email error: " . $e->getMessage());
        sendError('Failed to send email: ' . $e->getMessage(), 500);
    }
}
