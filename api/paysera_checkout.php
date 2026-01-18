<?php
/**
 * Paysera Checkout Endpoint
 * 
 * Initiates a payment request to Paysera and returns redirect URL.
 * User will be redirected to Paysera payment page.
 */

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/paysera-config.php';
require_once __DIR__ . '/lib/WebToPay.php';

// Require authentication
$currentUser = requireAuth();
requirePost();

$data = getJsonInput();
$amount = $data['amount'] ?? null;

// Validate amount
if (!$amount || !is_numeric($amount)) {
    sendError('Amount is required and must be numeric', 400);
}

$amount = floatval($amount);

if ($amount < PAYSERA_MIN_AMOUNT || $amount > PAYSERA_MAX_AMOUNT) {
    sendError('Amount must be between €' . PAYSERA_MIN_AMOUNT . ' and €' . PAYSERA_MAX_AMOUNT, 400);
}

try {
    $pdo = getDbConnection();
    
    // Create payment record first to get auto-increment ID
    $stmt = $pdo->prepare("
        INSERT INTO paysera_payments (user_id, order_id, amount, currency, status)
        VALUES (?, ?, ?, ?, 'pending')
    ");
    // Use temporary order_id, will update after getting ID
    $tempOrderId = 'temp_' . time();
    $stmt->execute([$currentUser['id'], $tempOrderId, $amount, PAYSERA_CURRENCY]);
    
    // Get the auto-increment ID
    $paymentId = $pdo->lastInsertId();
    
    // Generate order ID in format: ag_12345
    $orderId = 'ag_' . str_pad($paymentId, 5, '0', STR_PAD_LEFT);
    
    // Update the order_id with the proper format
    $stmt = $pdo->prepare("UPDATE paysera_payments SET order_id = ? WHERE id = ?");
    $stmt->execute([$orderId, $paymentId]);
    
    // Get callback URLs
    $callbacks = getPayseraCallbackUrls();
    
    // Build Paysera payment request
    $request = WebToPay::buildRequest([
        'projectid' => PAYSERA_PROJECT_ID,
        'sign_password' => PAYSERA_PROJECT_PASSWORD,
        'orderid' => $orderId,
        'amount' => (int)($amount * 100), // Convert to cents
        'currency' => PAYSERA_CURRENCY,
        'country' => PAYSERA_COUNTRY,
        'accepturl' => $callbacks['accepturl'],
        'cancelurl' => $callbacks['cancelurl'],
        'callbackurl' => $callbacks['callbackurl'],
        'test' => PAYSERA_TEST_MODE,
        'p_firstname' => $currentUser['name'],
        'p_lastname' => $currentUser['surname'] ?? '',
        'p_email' => $currentUser['email'],
        'buyer_consent' => 1, // User consent for payment initiation services
    ]);
    
    // Construct full Paysera URL
    $payseraUrl = 'https://bank.paysera.com/pay/?' . http_build_query($request, '', '&');
    
    // Return redirect URL
    sendSuccess(['redirect_url' => $payseraUrl], 'Payment initiated successfully');
    
} catch (PDOException $e) {
    if (APP_ENV === 'development') {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
    sendError('Failed to create payment request', 500);
} catch (Exception $e) {
    if (APP_ENV === 'development') {
        sendError('Paysera error: ' . $e->getMessage(), 500);
    }
    sendError('Failed to initiate payment', 500);
}
