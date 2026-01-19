<?php
/**
 * Reset Password Endpoint
 *
 * Atnaujina vartotojo slaptažodį naudojant reset token iš email.
 *
 * POST /api/reset-password.php
 *
 * Request Body:
 * {
 *   "token": "reset_token_from_email",
 *   "password": "NewSecurePassword123"
 * }
 *
 * Response (success):
 * {
 *   "success": true,
 *   "message": {
 *     "lt": "Slaptažodis pakeistas. Galite jungtis.",
 *     "en": "Password changed. You can now log in."
 *   }
 * }
 *
 * Response (error):
 * {
 *   "success": false,
 *   "message": {
 *     "lt": "Nuoroda nebegalioja.",
 *     "en": "Reset link has expired."
 *   }
 * }
 *
 * @package Volley\API\Auth
 * @author Coding Agent
 * @version 1.0
 */

require_once __DIR__ . '/db.php';

// Only allow POST requests
requirePost();

// Get JSON input
$input = getJsonInput();

// Validate required fields
$missing = validateRequired($input, ['token', 'password']);
if (!empty($missing)) {
    sendError('Missing required fields: ' . implode(', ', $missing), 400);
}

// Sanitize inputs
$token = trim($input['token']);
$password = $input['password'];

// Validate token format (should be 64 hex characters)
if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
    sendError([
        'lt' => 'Netinkama nuoroda.',
        'en' => 'Invalid reset link.'
    ], 400);
}

// Rate limiting - 5 attempts per 15 minutes per token
checkRateLimit($token, 'reset_password', 5, 15);

// Validate password strength
$passwordErrors = validatePasswordStrength($password);
if (!empty($passwordErrors)) {
    sendError([
        'lt' => 'Slaptažodis neatitinka reikalavimų',
        'en' => 'Password does not meet requirements'
    ], 400, [
        'validation_errors' => $passwordErrors
    ]);
}

try {
    $pdo = getDbConnection();
    $pdo->beginTransaction();

    // Find valid reset token
    $stmt = $pdo->prepare("
        SELECT id, user_id, expires_at
        FROM password_reset_tokens
        WHERE token = ? AND used_at IS NULL
    ");
    $stmt->execute([$token]);
    $resetToken = $stmt->fetch();

    if (!$resetToken) {
        $pdo->rollBack();
        sendError([
            'lt' => 'Netinkama nuoroda.',
            'en' => 'Invalid reset link.'
        ], 400);
    }

    // Check if token expired
    $now = new DateTime();
    $expiresAt = new DateTime($resetToken['expires_at']);

    if ($now > $expiresAt) {
        $pdo->rollBack();
        sendError([
            'lt' => 'Nuoroda nebegalioja. Prašome inicijuoti slaptažodžio keitimą iš naujo.',
            'en' => 'Reset link has expired. Please initiate password reset again.'
        ], 400);
    }

    // Hash new password using bcrypt with cost 12
    $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

    // Update user's password
    $stmt = $pdo->prepare("
        UPDATE users
        SET password_hash = ?, password_required = 1
        WHERE id = ?
    ");
    $stmt->execute([$passwordHash, $resetToken['user_id']]);

    // Mark token as used
    $stmt = $pdo->prepare("
        UPDATE password_reset_tokens
        SET used_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$resetToken['id']]);

    $pdo->commit();

    // Reset rate limit after successful password reset
    resetRateLimit($token, 'reset_password');

    // Log successful password reset
    error_log("Password reset successful for user_id: {$resetToken['user_id']}");

    sendSuccess([
        'message' => [
            'lt' => 'Slaptažodis pakeistas. Galite jungtis.',
            'en' => 'Password changed. You can now log in.'
        ],
        'auto_login' => false
    ]);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Reset password database error: " . $e->getMessage());
    error_log($e->getTraceAsString());

    if (APP_ENV === 'development') {
        sendError('Database error: ' . $e->getMessage(), 500);
    } else {
        sendError('An error occurred. Please try again later.', 500);
    }
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Reset password unexpected error: " . $e->getMessage());
    error_log($e->getTraceAsString());

    sendError('An error occurred. Please try again later.', 500);
}
