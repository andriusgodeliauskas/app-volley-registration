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
 * @return bool Success
 */
function sendEmail($to, $subject, $bodyHtml, $bodyText = '') {
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
            return true;
        } else {
            error_log("Email sending failed to: $to (mail() returned false)");
            return false;
        }

    } catch (Exception $e) {
        error_log("Email sending exception to: $to, error: {$e->getMessage()}");
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
