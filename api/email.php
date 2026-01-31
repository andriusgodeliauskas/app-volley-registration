<?php
/**
 * Email Sending Utility
 *
 * Naudoja natyvią PHP mail() funkciją su SMTP konfigūracija.
 * Serveriai.lt palaiko SMTP per 587 prievadą.
 *
 * @package Volley\API\Utilities
 * @author Coding Agent
 * @version 2.0
 */

require_once __DIR__ . '/config.php';

/**
 * Išsiunčia email naudojant PHP mail() funkciją
 *
 * @param string $to Gavėjo email
 * @param string $subject Email tema
 * @param string $bodyHtml HTML body
 * @param string $bodyText Plain text body (fallback)
 * @param string $emailType Type of email (password_reset, account_activation, negative_balance)
 * @param int|null $userId User ID (for logging)
 * @return bool Success
 */
function sendEmail($to, $subject, $bodyHtml, $bodyText = '', $emailType = 'manual', $userId = null) {
    $success = false;
    $errorMessage = null;

    try {
        // Email headers
        $headers = [];
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-Type: text/html; charset=UTF-8';
        $headers[] = 'From: ' . SMTP_FROM_NAME . ' <' . SMTP_FROM_EMAIL . '>';
        $headers[] = 'Reply-To: ' . SMTP_FROM_EMAIL;
        $headers[] = 'X-Mailer: PHP/' . phpversion();

        // Additional parameters for SMTP
        // Serveriai.lt automatically uses configured SMTP settings
        $additionalParams = '-f' . SMTP_FROM_EMAIL;

        // Send email
        $success = mail(
            $to,
            $subject,
            $bodyHtml,
            implode("\r\n", $headers),
            $additionalParams
        );

        if ($success) {
            error_log("Email sent successfully to: $to, subject: $subject");
        } else {
            $errorMessage = "mail() returned false";
            error_log("Email sending failed to: $to (mail() returned false)");
        }

    } catch (Exception $e) {
        $errorMessage = $e->getMessage();
        error_log("Email sending exception to: $to, error: {$e->getMessage()}");
        $success = false;
    }

    // Log email to database
    logEmail([
        'user_id' => $userId,
        'email_type' => $emailType,
        'recipient_email' => $to,
        'subject' => $subject,
        'body_preview' => substr(preg_replace('/\s+/', ' ', trim(strip_tags($bodyHtml))), 0, 1000),
        'status' => $success ? 'sent' : 'failed',
        'error_message' => $errorMessage
    ]);

    return $success;
}

/**
 * Log email to database
 *
 * @param array $data Email data to log
 * @return void
 */
function logEmail(array $data): void
{
    try {
        $pdo = getDbConnection();
        
        // Get admin ID if in session (for manually sent emails)
        $adminId = null;
        if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['user_id'])) {
            $adminId = $_SESSION['user_id'];
        }

        $stmt = $pdo->prepare("
            INSERT INTO email_logs 
            (user_id, email_type, recipient_email, subject, body_preview, status, error_message, sent_by_admin_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $data['user_id'],
            $data['email_type'],
            $data['recipient_email'],
            $data['subject'],
            $data['body_preview'],
            $data['status'],
            $data['error_message'] ?? null,
            $adminId
        ]);

    } catch (PDOException $e) {
        // Don't fail email sending if logging fails
        error_log("Failed to log email: " . $e->getMessage());
    }
}

/**
 * Render email template
 *
 * Įkelia ir rendrina email template su pateiktais duomenimis
 *
 * @param string $templateName Template file name (be .php)
 * @param array $data Template variables
 * @return string Rendered HTML
 * @throws Exception Jei template nerastas
 */
function renderEmailTemplate($templateName, $data = []) {
    $templatePath = __DIR__ . "/email-templates/{$templateName}.php";

    if (!file_exists($templatePath)) {
        throw new Exception("Email template not found: $templateName");
    }

    // Extract variables for template
    extract($data);

    // Start output buffering
    ob_start();
    include $templatePath;
    $html = ob_get_clean();

    return $html;
}
