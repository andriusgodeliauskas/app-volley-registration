<?php
/**
 * Paysera Callback Endpoint
 * 
 * This is called by Paysera servers after payment processing.
 * CRITICAL: This endpoint validates payment and updates user balance.
 * Must return "OK" to confirm receipt.
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/paysera-config.php';
require_once __DIR__ . '/lib/WebToPay.php';

// Log callback for debugging (without sensitive data)
error_log('Paysera callback received at ' . date('Y-m-d H:i:s'));

try {
    // Validate and parse Paysera callback data
    $response = WebToPay::validateAndParseData(
        $_REQUEST,
        PAYSERA_PROJECT_ID,
        PAYSERA_PROJECT_PASSWORD
    );
    
    $orderId = $response['orderid'];
    $status = $response['status'];
    $payAmount = $response['payamount'] / 100; // Convert from cents to euros
    $payCurrency = $response['paycurrency'];
    $requestId = $response['requestid'] ?? null;
    
    $pdo = getDbConnection();
    
    // Get payment record
    $stmt = $pdo->prepare("SELECT * FROM paysera_payments WHERE order_id = ?");
    $stmt->execute([$orderId]);
    $payment = $stmt->fetch();
    
    if (!$payment) {
        throw new Exception('Payment record not found for order: ' . $orderId);
    }
    
    // Validate amount and currency match
    if (abs($payAmount - floatval($payment['amount'])) > 0.01 || $payCurrency !== $payment['currency']) {
        throw new Exception('Payment amount or currency mismatch');
    }
    
    // Check if already processed (prevent duplicate processing)
    if ($payment['status'] === 'completed') {
        error_log('Payment already processed: ' . $orderId);
        echo 'OK';
        exit;
    }
    
    // Process based on payment status
    if ($status == '1') {
        // Payment successful - update balance and create transaction
        $pdo->beginTransaction();
        
        try {
            // Create transaction record
            $stmt = $pdo->prepare("
                INSERT INTO transactions (user_id, type, amount, description, created_at)
                VALUES (?, 'topup', ?, ?, NOW())
            ");
            $stmt->execute([
                $payment['user_id'],
                $payment['amount'],
                'Automatic top-up via Paysera'
            ]);
            $transactionId = $pdo->lastInsertId();
            
            // Update user balance
            $stmt = $pdo->prepare("
                UPDATE users SET balance = balance + ? WHERE id = ?
            ");
            $stmt->execute([$payment['amount'], $payment['user_id']]);
            
            // Update payment record to completed
            $stmt = $pdo->prepare("
                UPDATE paysera_payments 
                SET status = 'completed', 
                    transaction_id = ?,
                    paysera_response = ?,
                    paysera_request_id = ?,
                    updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([
                $transactionId,
                json_encode($response),
                $requestId,
                $payment['id']
            ]);
            
            $pdo->commit();
            
            error_log('Payment completed successfully: ' . $orderId . ' - €' . $payment['amount']);
            echo 'OK';
            
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log('Transaction failed for payment ' . $orderId . ': ' . $e->getMessage());
            throw $e;
        }
        
    } elseif ($status == '0') {
        // Payment pending - keep as pending
        $stmt = $pdo->prepare("
            UPDATE paysera_payments 
            SET paysera_response = ?,
                paysera_request_id = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([json_encode($response), $requestId, $payment['id']]);
        
        error_log('Payment pending: ' . $orderId);
        echo 'OK';
        
    } else {
        // Payment failed or cancelled
        $stmt = $pdo->prepare("
            UPDATE paysera_payments 
            SET status = 'failed',
                paysera_response = ?,
                paysera_request_id = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([json_encode($response), $requestId, $payment['id']]);
        
        error_log('Payment failed: ' . $orderId . ' - Status: ' . $status);
        echo 'OK';
    }
    
} catch (Exception $e) {
    // Log error but don't expose details to Paysera
    error_log('Paysera callback error: ' . $e->getMessage());
    
    // Return error to Paysera (they will retry)
    http_response_code(500);
    echo 'ERROR: ' . $e->getMessage();
}
