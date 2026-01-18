<?php
/**
 * Paysera Accept/Success Endpoint
 * 
 * User is redirected here after successful payment.
 * Redirects to wallet page with success message.
 */

require_once __DIR__ . '/paysera-config.php';

$orderId = $_GET['orderid'] ?? null;

// Build redirect URL to wallet with success parameter
$frontendUrl = getFrontendUrl();
$redirectUrl = $frontendUrl . '/wallet?payment=success';

if ($orderId) {
    $redirectUrl .= '&order=' . urlencode($orderId);
}

// Redirect to frontend
header('Location: ' . $redirectUrl);
exit;
