<?php
/**
 * Send New User Registration Notification to Super Admins
 *
 * Helper function to notify all active Super Admins when a new user registers
 * Called after successful user registration
 *
 * @param string $newUserEmail New user's email address
 * @param PDO $pdo Database connection
 * @return array Array with 'sent' and 'failed' counts
 */

require_once __DIR__ . '/email.php';
require_once __DIR__ . '/db.php';

function sendNewUserRegistrationNotification(string $newUserEmail, PDO $pdo = null): array
{
    if ($pdo === null) {
        $pdo = getDbConnection();
    }

    // Initialize result counters
    $result = [
        'sent' => 0,
        'failed' => 0
    ];

    // Get all active Super Admins
    $stmt = $pdo->prepare("
        SELECT id, name, email
        FROM users
        WHERE role = 'super_admin' AND is_active = 1
    ");
    $stmt->execute();
    $superAdmins = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($superAdmins)) {
        error_log("No active Super Admins found to notify about new user registration: $newUserEmail");
        return $result;
    }

    // Render email template
    $emailHtml = renderEmailTemplate('new-user-registered', [
        'new_user_email' => $newUserEmail,
        'app_url' => APP_URL
    ]);

    $subject = 'Naujas vartotojas užsiregistravo';

    // Send notification to each Super Admin
    foreach ($superAdmins as $admin) {
        $emailSent = sendEmail(
            $admin['email'],
            $subject,
            $emailHtml,
            '',
            'new_user_registration',
            $admin['id']
        );

        if ($emailSent) {
            $result['sent']++;
            error_log("New user registration notification sent to Super Admin: {$admin['email']} (new user: $newUserEmail)");
        } else {
            $result['failed']++;
            error_log("Failed to send new user notification to Super Admin: {$admin['email']} (new user: $newUserEmail)");
        }
    }

    return $result;
}
