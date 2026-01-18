<?php
/**
 * Paysera Cancel/Error Endpoint
 * 
 * User is redirected here if payment is cancelled or fails.
 * Redirects to wallet page with cancel message.
 */

require_once __DIR__ . '/paysera-config.php';
require_once __DIR__ . '/db.php';

$orderId = $_GET['orderid'] ?? null;

// Update payment status to cancelled if we have order ID
if ($orderId) {
    try {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("
            UPDATE paysera_payments 
            SET status = 'cancelled', updated_at = NOW()
            WHERE order_id = ? AND status = 'pending'
        ");
        $stmt->execute([$orderId]);
    } catch (Exception $e) {
        // Log but don't block redirect
        error_log('Failed to update cancelled payment: ' . $e->getMessage());
    }
}

// Build redirect URL to wallet with cancel parameter
$frontendUrl = getFrontendUrl();
$redirectUrl = $frontendUrl . '/wallet?payment=cancelled';

if ($orderId) {
    $redirectUrl .= '&order=' . urlencode($orderId);
}

// Redirect to frontend
header('Location: ' . $redirectUrl);
exit;
