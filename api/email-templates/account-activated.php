<?php
/**
 * Account Activation Email Template - Simple Version
 * 
 * Variables:
 * - $user_name: User's first name
 * - $app_url: Application URL (e.g., https://volley.godeliauskas.com)
 * - $lang: Language ('lt' or 'en')
 */

$translations = [
    'lt' => [
        'title' => 'Paskyra aktyvuota',
        'greeting' => 'Sveiki',
        'message' => 'Jūsų paskyra yra aktyvuota. Dabar galite matyti renginius ir registruotis.',
        'wishes' => 'Linkėjimai',
        'team' => 'Volley komanda',
        'login_button' => 'Prisijungti',
        'footer_note' => 'Jei negavote šio laiško, prašome ignoruoti jį.'
    ],
    'en' => [
        'title' => 'Account Activated',
        'greeting' => 'Hello',
        'message' => 'Your account has been activated. You can now view events and register.',
        'wishes' => 'Best regards',
        'team' => 'Volley Team',
        'login_button' => 'Log In',
        'footer_note' => 'If you did not request this, please ignore this email.'
    ]
];

$t = $translations[$lang] ?? $translations['lt'];
?>
<!DOCTYPE html>
<html lang="<?= $lang ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($t['title'], ENT_QUOTES, 'UTF-8') ?></title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #ffffff; color: #000000;">
    <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse;">
        <tr>
            <td style="padding: 20px 0;">
                
                <!-- Header -->
                <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: bold; color: #000000;">
                    <?= htmlspecialchars($t['title'], ENT_QUOTES, 'UTF-8') ?>
                </h2>
                
                <!-- Content -->
                <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.5; color: #000000;">
                    <?= htmlspecialchars($t['greeting'], ENT_QUOTES, 'UTF-8') ?><?= !empty($user_name) ? ' ' . htmlspecialchars($user_name, ENT_QUOTES, 'UTF-8') : '' ?>,
                </p>
                
                <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #000000;">
                    <?= htmlspecialchars($t['message'], ENT_QUOTES, 'UTF-8') ?>
                </p>

                <!-- Login Button -->
                <table role="presentation" style="width: 100%; margin: 20px 0;">
                    <tr>
                        <td align="center">
                            <a href="<?= htmlspecialchars($app_url, ENT_QUOTES, 'UTF-8') ?>" 
                               style="display: inline-block; padding: 12px 30px; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 14px; border: 1px solid #000000;">
                                <?= htmlspecialchars($t['login_button'], ENT_QUOTES, 'UTF-8') ?>
                            </a>
                        </td>
                    </tr>
                </table>

                <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.5; color: #000000;">
                    <?= htmlspecialchars($t['wishes'], ENT_QUOTES, 'UTF-8') ?>,<br>
                    <?= htmlspecialchars($t['team'], ENT_QUOTES, 'UTF-8') ?>
                </p>
                
                <!-- Footer -->
                <p style="margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #cccccc; font-size: 12px; line-height: 1.5; color: #666666;">
                    <?= htmlspecialchars($t['footer_note'], ENT_QUOTES, 'UTF-8') ?>
                </p>
                
            </td>
        </tr>
    </table>
</body>
</html>
