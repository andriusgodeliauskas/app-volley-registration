<?php
/**
 * Cleanup Expired OAuth Temp Tokens
 *
 * Ištrina pasibaigusius laikinus OAuth token'us iš duomenų bazės.
 * Paleisti per cron kas valandą:
 * 0 * * * * php /path/to/api/cron/cleanup-temp-tokens.php
 *
 * @package Volley\API\Cron
 * @author Coding Agent
 * @version 1.0
 */

// Prevent direct web access - only CLI execution
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('Direct access forbidden. This script must be run from command line.');
}

// Include required files
require_once dirname(__DIR__) . '/db.php';

// =====================================================
// Main cleanup logic
// =====================================================

try {
    $pdo = getDbConnection();

    // Start transaction
    $pdo->beginTransaction();

    // Delete expired temp tokens
    $stmt = $pdo->prepare("
        DELETE FROM oauth_temp_tokens
        WHERE expires_at < NOW()
    ");
    $stmt->execute();

    $deletedCount = $stmt->rowCount();

    // Commit transaction
    $pdo->commit();

    // Log results
    $timestamp = date('Y-m-d H:i:s');
    echo "[$timestamp] OAuth temp tokens cleanup completed: $deletedCount expired token(s) deleted.\n";

    // Also log to error log
    error_log("OAuth temp tokens cleanup: deleted $deletedCount expired token(s)");

    exit(0);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    $timestamp = date('Y-m-d H:i:s');
    $errorMessage = "[$timestamp] ERROR: OAuth temp tokens cleanup failed - {$e->getMessage()}\n";

    echo $errorMessage;
    error_log("OAuth temp tokens cleanup error: " . $e->getMessage());
    error_log($e->getTraceAsString());

    exit(1);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    $timestamp = date('Y-m-d H:i:s');
    $errorMessage = "[$timestamp] ERROR: Unexpected error in cleanup - {$e->getMessage()}\n";

    echo $errorMessage;
    error_log("OAuth temp tokens cleanup unexpected error: " . $e->getMessage());
    error_log($e->getTraceAsString());

    exit(1);
}
