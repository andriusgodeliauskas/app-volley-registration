<?php
/**
 * Email Template: Password Reset
 *
 * Variables:
 * - $reset_link: Password reset URL
 * - $lang: Language code ('lt' or 'en')
 */

// Prevent direct access
if (!isset($reset_link) || !isset($lang)) {
    exit('Direct access not allowed');
}

// Translation strings
$translations = [
    'lt' => [
        'subject' => 'Slaptažodžio atkūrimas',
        'greeting' => 'Sveiki,',
        'intro' => 'Gavome jūsų prašymą atstatyti slaptažodį Volley Registration sistemoje.',
        'button_text' => 'Atkurti slaptažodį',
        'expiry_warning' => 'Ši nuoroda galioja 1 valandą.',
        'not_requested' => 'Jei jūs neprašėte slaptažodžio atkūrimo, tiesiog ignoruokite šį laišką.',
        'no_reply' => 'Prašome neatsakinėti į šį laišką - jis išsiųstas automatiškai.',
        'regards' => 'Pagarbiai,',
        'team' => 'Volley Registration komanda',
        'footer' => '© 2026 Volley Registration. Visos teisės saugomos.',
        'security_note' => 'Saugumo sumetimais, jei negavote šio laiško, prašome susisiekti su administratoriumi.'
    ],
    'en' => [
        'subject' => 'Password Reset',
        'greeting' => 'Hello,',
        'intro' => 'We received a request to reset your password for Volley Registration system.',
        'button_text' => 'Reset Password',
        'expiry_warning' => 'This link is valid for 1 hour.',
        'not_requested' => 'If you did not request a password reset, simply ignore this email.',
        'no_reply' => 'Please do not reply to this email - it was sent automatically.',
        'regards' => 'Best regards,',
        'team' => 'Volley Registration Team',
        'footer' => '© 2026 Volley Registration. All rights reserved.',
        'security_note' => 'For security reasons, if you did not receive this email, please contact the administrator.'
    ]
];

$t = $translations[$lang] ?? $translations['lt'];
?>
<!DOCTYPE html>
<html lang="<?php echo htmlspecialchars($lang, ENT_QUOTES, 'UTF-8'); ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($t['subject'], ENT_QUOTES, 'UTF-8'); ?></title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
            color: #ffffff;
        }
        .email-header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .email-body {
            padding: 40px 30px;
        }
        .email-body p {
            margin: 0 0 16px;
            font-size: 16px;
            color: #555;
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .reset-button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            transition: opacity 0.3s;
        }
        .reset-button:hover {
            opacity: 0.9;
        }
        .warning-box {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .warning-box p {
            margin: 0;
            color: #856404;
            font-size: 14px;
        }
        .security-note {
            background-color: #f8f9fa;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #666;
        }
        .email-footer {
            background-color: #f8f9fa;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }
        .email-footer p {
            margin: 8px 0;
            font-size: 13px;
            color: #888;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            .email-body {
                padding: 24px 20px;
            }
            .email-header {
                padding: 24px 20px;
            }
            .reset-button {
                padding: 12px 24px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            <h1>🏐 Volley Registration</h1>
        </div>

        <!-- Body -->
        <div class="email-body">
            <p><strong><?php echo htmlspecialchars($t['greeting'], ENT_QUOTES, 'UTF-8'); ?></strong></p>

            <p><?php echo htmlspecialchars($t['intro'], ENT_QUOTES, 'UTF-8'); ?></p>

            <!-- Reset Button -->
            <div class="button-container">
                <a href="<?php echo htmlspecialchars($reset_link, ENT_QUOTES, 'UTF-8'); ?>" class="reset-button">
                    <?php echo htmlspecialchars($t['button_text'], ENT_QUOTES, 'UTF-8'); ?>
                </a>
            </div>

            <!-- Warning Box -->
            <div class="warning-box">
                <p><strong>⏱️ <?php echo htmlspecialchars($t['expiry_warning'], ENT_QUOTES, 'UTF-8'); ?></strong></p>
            </div>

            <p><?php echo htmlspecialchars($t['not_requested'], ENT_QUOTES, 'UTF-8'); ?></p>

            <!-- Security Note -->
            <div class="security-note">
                <p><strong>🔒 <?php echo htmlspecialchars($t['security_note'], ENT_QUOTES, 'UTF-8'); ?></strong></p>
            </div>

            <p style="margin-top: 32px;">
                <?php echo htmlspecialchars($t['regards'], ENT_QUOTES, 'UTF-8'); ?><br>
                <strong><?php echo htmlspecialchars($t['team'], ENT_QUOTES, 'UTF-8'); ?></strong>
            </p>

            <p style="font-size: 13px; color: #888; margin-top: 24px;">
                <?php echo htmlspecialchars($t['no_reply'], ENT_QUOTES, 'UTF-8'); ?>
            </p>
        </div>

        <!-- Footer -->
        <div class="email-footer">
            <p><?php echo htmlspecialchars($t['footer'], ENT_QUOTES, 'UTF-8'); ?></p>
        </div>
    </div>
</body>
</html>
