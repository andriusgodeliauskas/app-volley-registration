<?php
/**
 * Password Reset Email Template - Simple Version
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
        'intro' => 'Gavome jūsų prašymą sukurti naują prisijungimo slaptažodį. Paspauskite mygtuką ir būsite nukreipti į puslapį, kuriame galėsite sukurti naują slaptažodį.',
        'button_text' => 'Sukurti naują slaptažodį',
        'expiry_warning' => 'Ši nuoroda galioja 1 valandą.',
        'not_requested' => 'Jei jūs neprašėte naujo slaptažodžio sukūrimo, ignoruokite šį laišką.',
        'regards' => 'Pagarbiai,',
        'team' => 'Volley Registration komanda',
        'footer' => '© 2026 Volley Registration. Visos teisės saugomos.'
    ],
    'en' => [
        'subject' => 'Password Reset',
        'greeting' => 'Hello,',
        'intro' => 'We received a request to create a new password for your account. Click the button below to be redirected to a page where you can create a new password.',
        'button_text' => 'Create new password',
        'expiry_warning' => 'This link is valid for 1 hour.',
        'not_requested' => 'If you did not request a new password, ignore this email.',
        'regards' => 'Best regards,',
        'team' => 'Volley Registration Team',
        'footer' => '© 2026 Volley Registration. All rights reserved.'
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
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #ffffff; color: #000000;">
    <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse;">
        <tr>
            <td style="padding: 20px 0;">
                
                <!-- Content -->
                <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.5; color: #000000;">
                    <?php echo htmlspecialchars($t['greeting'], ENT_QUOTES, 'UTF-8'); ?>
                </p>

                <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #000000;">
                    <?php echo htmlspecialchars($t['intro'], ENT_QUOTES, 'UTF-8'); ?>
                </p>

                <!-- Reset Button -->
                <table role="presentation" style="width: 100%; margin: 20px 0;">
                    <tr>
                        <td align="center">
                            <a href="<?php echo htmlspecialchars($reset_link, ENT_QUOTES, 'UTF-8'); ?>" 
                               style="display: inline-block; padding: 12px 30px; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 14px; border: 1px solid #000000;">
                                <?php echo htmlspecialchars($t['button_text'], ENT_QUOTES, 'UTF-8'); ?>
                            </a>
                        </td>
                    </tr>
                </table>

                <!-- Warning -->
                <p style="margin: 20px 0 15px 0; font-size: 14px; line-height: 1.5; color: #000000;">
                    <?php echo htmlspecialchars($t['expiry_warning'], ENT_QUOTES, 'UTF-8'); ?>
                </p>

                <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #000000;">
                    <?php echo htmlspecialchars($t['not_requested'], ENT_QUOTES, 'UTF-8'); ?>
                </p>

                <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.5; color: #000000;">
                    <?php echo htmlspecialchars($t['regards'], ENT_QUOTES, 'UTF-8'); ?><br>
                    <?php echo htmlspecialchars($t['team'], ENT_QUOTES, 'UTF-8'); ?>
                </p>
                
                <!-- Footer -->
                <p style="margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #cccccc; font-size: 12px; line-height: 1.5; color: #666666;">
                    <?php echo htmlspecialchars($t['footer'], ENT_QUOTES, 'UTF-8'); ?>
                </p>
                
            </td>
        </tr>
    </table>
</body>
</html>
