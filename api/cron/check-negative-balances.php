<?php
/**
 * Cron Job: Check Negative Balances
 * 
 * Purpose: Send email notifications to users with negative balance < -1 EUR for 4+ days
 * Schedule: Run daily at 10:00 AM
 * 
 * Cron setup:
 * 0 10 * * * /usr/bin/php /path/to/api/cron/check-negative-balances.php
 */

// Prevent web access
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    die('This script can only be run from command line');
}

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../send-negative-balance-email.php';

try {
    $pdo = getDbConnection();

    echo "[" . date('Y-m-d H:i:s') . "] Starting negative balance check...\n";

    // Find users with balance < -1 EUR for 4+ days
    // Exclude users who received notification in last 7 days
    $stmt = $pdo->prepare("
        SELECT 
            u.id, 
            u.name, 
            u.email, 
            u.balance, 
            u.preferred_language,
            MIN(t.created_at) as first_negative_transaction
        FROM users u
        INNER JOIN transactions t ON u.id = t.user_id
        LEFT JOIN negative_balance_notifications nbn 
            ON u.id = nbn.user_id 
            AND nbn.notification_sent_at > NOW() - INTERVAL 7 DAY
        WHERE u.balance < -1.00
            AND nbn.id IS NULL
            AND t.amount < 0
        GROUP BY u.id
        HAVING first_negative_transaction < NOW() - INTERVAL 4 DAY
    ");

    $stmt->execute();
    $users = $stmt->fetchAll();

    echo "Found " . count($users) . " users with negative balance for 4+ days\n";

    $successCount = 0;
    $failCount = 0;

    foreach ($users as $user) {
        echo "Processing user ID: {$user['id']}, email: {$user['email']}, balance: {$user['balance']}\n";

        $sent = sendNegativeBalanceEmail($user['id'], $pdo);

        if ($sent) {
            $successCount++;
            echo "  ✓ Email sent successfully\n";
        } else {
            $failCount++;
            echo "  ✗ Failed to send email\n";
        }
    }

    echo "\n[" . date('Y-m-d H:i:s') . "] Negative balance check completed\n";
    echo "Summary: {$successCount} sent, {$failCount} failed\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    error_log("Negative balance cron error: " . $e->getMessage());
    exit(1);
}
