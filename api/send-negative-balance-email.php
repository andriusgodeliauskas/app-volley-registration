<?php
/**
 * Send Negative Balance Email
 * 
 * Helper function to send negative balance notification
 * Called by cron job when user has negative balance for 4+ days
 * 
 * @param int $userId User ID
 * @param PDO $pdo Database connection
 * @return bool Success status
 */

require_once __DIR__ . '/email.php';
require_once __DIR__ . '/db.php';

function sendNegativeBalanceEmail(int $userId, PDO $pdo = null): bool
{
    if ($pdo === null) {
        $pdo = getDbConnection();
    }

    // Get user details
    $stmt = $pdo->prepare("
        SELECT name, email, balance, preferred_language
        FROM users
        WHERE id = ?
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        error_log("Negative balance email: User not found (ID: $userId)");
        return false;
    }

    // Check if balance is actually negative
    if ($user['balance'] >= -1.00) {
        error_log("Negative balance email: User balance not negative enough (ID: $userId, balance: {$user['balance']})");
        return false;
    }

    // Determine language (default to Lithuanian)
    $lang = $user['preferred_language'] ?? 'lt';
    if (!in_array($lang, ['lt', 'en'])) {
        $lang = 'lt';
    }

    // Render email template
    $emailHtml = renderEmailTemplate('negative-balance', [
        'user_name' => $user['name'],
        'balance' => $user['balance'],
        'app_url' => APP_URL,
        'lang' => $lang
    ]);

    // Email subject
    $subject = ($lang === 'lt') 
        ? 'Priminimas apie neigiamą likutį paskyroje' 
        : 'Reminder about negative account balance';

    // Send email with logging
    $emailSent = sendEmail(
        $user['email'], 
        $subject, 
        $emailHtml,
        '',
        'negative_balance',
        $userId
    );

    if ($emailSent) {
        // Record notification to prevent duplicate sends
        $stmt = $pdo->prepare("
            INSERT INTO negative_balance_notifications (user_id, balance_amount)
            VALUES (?, ?)
        ");
        $stmt->execute([$userId, $user['balance']]);

        error_log("Negative balance email sent to: {$user['email']} (user_id: $userId, balance: {$user['balance']})");
        return true;
    } else {
        error_log("Failed to send negative balance email to: {$user['email']} (user_id: $userId)");
        return false;
    }
}
