<?php
/**
 * Forgot Password Endpoint
 *
 * Inicijuoja slaptažodžio atkūrimo procesą išsiunčiant email su reset nuoroda.
 *
 * POST /api/forgot-password.php
 *
 * Request Body:
 * {
 *   "email": "user@example.com"
 * }
 *
 * Response (visada success - security best practice):
 * {
 *   "success": true,
 *   "message": {
 *     "lt": "Jums išsiųstas laiškas su instrukcijomis...",
 *     "en": "An email has been sent with instructions..."
 *   }
 * }
 *
 * @package Volley\API\Auth
 * @author Coding Agent
 * @version 1.0
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/email.php';

// Only allow POST requests
requirePost();

// Get JSON input
$input = getJsonInput();

// Validate required fields
$missing = validateRequired($input, ['email']);
if (!empty($missing)) {
    sendError('Missing required fields: ' . implode(', ', $missing), 400);
}

// Sanitize inputs
$email = trim(strtolower($input['email']));

// Validate email format
if (!isValidEmail($email)) {
    sendError('Invalid email format', 400);
}

// Rate limiting - 3 attempts per 60 minutes per email
checkRateLimit($email, 'forgot_password', 3, 60);

try {
    $pdo = getDbConnection();

    // Check if user exists
    $stmt = $pdo->prepare("SELECT id, name FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // IMPORTANT: Always return success for security (don't reveal if email exists)
    // But only send email if user actually exists
    if ($user) {
        // Generate secure random token (64 characters)
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

        // Insert reset token
        $stmt = $pdo->prepare("
            INSERT INTO password_reset_tokens (user_id, token, expires_at)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$user['id'], $token, $expiresAt]);

        // Determine language (default to Lithuanian)
        // TODO: Get user's preferred language from database
        $lang = 'lt';

        // Build reset link
        $resetLink = APP_URL . "/reset-password?token=" . $token;

        // Render email template
        $emailHtml = renderEmailTemplate('password-reset', [
            'reset_link' => $resetLink,
            'lang' => $lang
        ]);

        // Send email
        $subject = ($lang === 'lt')
            ? 'Slaptažodžio priminimas'
            : 'Password Reset';

        $emailSent = sendEmail($email, $subject, $emailHtml);

        if (!$emailSent) {
            error_log("Failed to send password reset email to: $email");
            // Don't reveal failure to user - still return success
        } else {
            error_log("Password reset email sent to: $email, token expires: $expiresAt");
        }
    } else {
        // User doesn't exist - log warning but still return success
        error_log("Password reset requested for non-existent email: $email");
    }

    // Reset rate limit after successful processing
    resetRateLimit($email, 'forgot_password');

    // ALWAYS return success (security best practice)
    sendSuccess([
        'message' => [
            'lt' => 'Jums išsiųstas laiškas su instrukcijomis. Jei nematote, patikrinkite spam aplanką.',
            'en' => 'An email has been sent with instructions. If you don\'t see it, check your spam folder.'
        ]
    ]);

} catch (PDOException $e) {
    error_log("Forgot password database error: " . $e->getMessage());

    if (APP_ENV === 'development') {
        sendError('Database error: ' . $e->getMessage(), 500);
    } else {
        sendError('An error occurred. Please try again later.', 500);
    }
} catch (Exception $e) {
    error_log("Forgot password unexpected error: " . $e->getMessage());
    error_log($e->getTraceAsString());

    sendError('An error occurred. Please try again later.', 500);
}
