<?php
/**
 * New User Registration Notification Email Template
 * Sent to Super Admins when a new user registers
 *
 * Variables:
 * - $new_user_email: Email of the newly registered user
 * - $app_url: Application URL (e.g., https://volley.godeliauskas.com)
 */

// Only Lithuanian - Super Admins don't need EN
$t = [
    'title' => 'Naujas vartotojas užsiregistravo',
    'greeting' => 'Sveiki',
    'message' => 'Naujas vartotojas užsiregistravo sistemoje:',
    'wishes' => 'Linkėjimai',
    'team' => 'AG Volley komanda',
    'login_button' => 'Prisijungti',
    'footer_note' => 'Tai automatinis pranešimas apie naują registraciją.'
];
?>
<!DOCTYPE html>
<html lang="lt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($t['title'], ENT_QUOTES, 'UTF-8') ?></title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #ffffff; color: #000000;">
    <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse;">
        <tr>
            <td style="padding: 20px 0;">

                <!-- Content -->
                <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.5; color: #000000;">
                    <?= htmlspecialchars($t['greeting'], ENT_QUOTES, 'UTF-8') ?>,
                </p>

                <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.5; color: #000000;">
                    <?= htmlspecialchars($t['message'], ENT_QUOTES, 'UTF-8') ?>
                </p>

                <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #000000; font-weight: bold;">
                    <?= htmlspecialchars($new_user_email, ENT_QUOTES, 'UTF-8') ?>
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
