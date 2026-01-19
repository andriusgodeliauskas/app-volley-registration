<?php
/**
 * Account Activation Email Template
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
        'message' => 'Jūsų paskyra svetainėje {app_url} yra aktyvuota. Dabar galite matyti renginius ir registruotis.',
        'wishes' => 'Linkėjimai',
        'team' => 'Volley komanda',
        'login_button' => 'Prisijungti',
        'footer_note' => 'Jei negavote šio laiško, prašome ignoruoti jį.'
    ],
    'en' => [
        'title' => 'Account Activated',
        'greeting' => 'Hello',
        'message' => 'Your account on {app_url} has been activated. You can now view events and register.',
        'wishes' => 'Best regards',
        'team' => 'Volley Team',
        'login_button' => 'Log In',
        'footer_note' => 'If you did not request this, please ignore this email.'
    ]
];

$t = $translations[$lang] ?? $translations['lt'];
$message_text = str_replace('{app_url}', $app_url, $t['message']);
?>
<!DOCTYPE html>
<html lang="<?= $lang ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($t['title'], ENT_QUOTES, 'UTF-8') ?></title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                                <span style="font-size: 40px;">✅</span>
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                <?= htmlspecialchars($t['title'], ENT_QUOTES, 'UTF-8') ?>
                            </h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px; color: #1a202c; font-size: 16px; line-height: 1.6;">
                                <?= htmlspecialchars($t['greeting'], ENT_QUOTES, 'UTF-8') ?><?= !empty($user_name) ? ' ' . htmlspecialchars($user_name, ENT_QUOTES, 'UTF-8') : '' ?>,
                            </p>
                            
                            <p style="margin: 0 0 30px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                <?= htmlspecialchars($message_text, ENT_QUOTES, 'UTF-8') ?>
                            </p>

                            <!-- Login Button -->
                            <table role="presentation" style="width: 100%; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="<?= htmlspecialchars($app_url, ENT_QUOTES, 'UTF-8') ?>" 
                                           style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
                                            <?= htmlspecialchars($t['login_button'], ENT_QUOTES, 'UTF-8') ?>
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                <?= htmlspecialchars($t['wishes'], ENT_QUOTES, 'UTF-8') ?>,<br>
                                <strong><?= htmlspecialchars($t['team'], ENT_QUOTES, 'UTF-8') ?></strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 10px; color: #718096; font-size: 14px; line-height: 1.5;">
                                <?= htmlspecialchars($t['footer_note'], ENT_QUOTES, 'UTF-8') ?>
                            </p>
                            <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                                © <?= date('Y') ?> Volley Registration. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
