<?php
/**
 * Send Account Activation Email
 * 
 * Helper function to send account activation notification
 * Called when administrator activates a user account
 * 
 * @param int $userId User ID
 * @param PDO $pdo Database connection
 * @return bool Success status
 */

require_once __DIR__ . '/email.php';
require_once __DIR__ . '/db.php';

function sendAccountActivationEmail(int $userId, PDO $pdo = null): bool
{
    if ($pdo === null) {
        $pdo = getDbConnection();
    }

    // Get user details
    $stmt = $pdo->prepare("
        SELECT name, email, preferred_language
        FROM users
        WHERE id = ?
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        error_log("Account activation email: User not found (ID: $userId)");
        return false;
    }

    // Determine language (default to Lithuanian)
    $lang = $user['preferred_language'] ?? 'lt';
    if (!in_array($lang, ['lt', 'en'])) {
        $lang = 'lt';
    }

    // Render email template
    $emailHtml = renderEmailTemplate('account-activated', [
        'user_name' => $user['name'],
        'app_url' => APP_URL,
        'lang' => $lang
    ]);

    // Email subject
    $subject = ($lang === 'lt') 
        ? 'Paskyra aktyvuota' 
        : 'Account Activated';

    // Send email
    $emailSent = sendEmail($user['email'], $subject, $emailHtml);

    if ($emailSent) {
        error_log("Account activation email sent to: {$user['email']} (user_id: $userId)");
        return true;
    } else {
        error_log("Failed to send account activation email to: {$user['email']} (user_id: $userId)");
        return false;
    }
}
