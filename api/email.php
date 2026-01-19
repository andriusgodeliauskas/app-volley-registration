<?php
/**
 * Email Sending Utility
 *
 * Naudoja PHPMailer biblioteką email siuntimui.
 *
 * @package Volley\API\Utilities
 * @author Coding Agent
 * @version 1.0
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/config.php';

/**
 * Išsiunčia email
 *
 * @param string $to Gavėjo email
 * @param string $subject Email tema
 * @param string $bodyHtml HTML body
 * @param string $bodyText Plain text body (fallback)
 * @return bool Success
 */
function sendEmail($to, $subject, $bodyHtml, $bodyText = '') {
    $mail = new PHPMailer(true);

    try {
        // SMTP Configuration
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USERNAME;
        $mail->Password = SMTP_PASSWORD;
        $mail->SMTPSecure = SMTP_ENCRYPTION;
        $mail->Port = SMTP_PORT;

        // Sender & Recipient
        $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
        $mail->addAddress($to);
        $mail->CharSet = 'UTF-8';

        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $bodyHtml;
        $mail->AltBody = $bodyText ?: strip_tags($bodyHtml);

        // Send
        $mail->send();

        // Log success
        error_log("Email sent successfully to: $to, subject: $subject");

        return true;

    } catch (Exception $e) {
        // Log error
        error_log("Email sending failed to: $to, error: {$mail->ErrorInfo}");
        return false;
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
