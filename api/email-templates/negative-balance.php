<?php
/**
 * Negative Balance Email Template
 * 
 * Variables:
 * - $user_name: User's first name
 * - $balance: Current negative balance (e.g., -5.50)
 * - $app_url: Application URL
 * - $lang: Language ('lt' or 'en')
 */

$translations = [
    'lt' => [
        'title' => 'Priminimas apie neigiamą likutį paskyroje',
        'greeting' => 'Sveiki',
        'message' => 'Informuojame, kad jūsų paskyroje yra minusinis likutis: €{balance}.',
        'action_text' => 'Prašome papildyti sąskaitą. Tai galite padaryti per kelias minutes naudojant automatinį papildymą per banką.',
        'wishes' => 'Linkėjimai',
        'team' => 'Volley komanda',
        'login_button' => 'Prisijungti ir papildyti',
        'footer_note' => 'Šis pranešimas išsiųstas automatiškai. Jei turite klausimų, susisiekite su mumis.'
    ],
    'en' => [
        'title' => 'Reminder about negative account balance',
        'greeting' => 'Hello',
        'message' => 'We inform you that your account has a negative balance: €{balance}.',
        'action_text' => 'Please top up your account. You can do this in a few minutes using automatic top-up via bank.',
        'wishes' => 'Best regards',
        'team' => 'Volley Team',
        'login_button' => 'Log In and Top Up',
        'footer_note' => 'This message was sent automatically. If you have questions, please contact us.'
    ]
];

$t = $translations[$lang] ?? $translations['lt'];
$message_text = str_replace('{balance}', number_format($balance, 2), $t['message']);
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
                        <td style="background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
                            <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                                <span style="font-size: 40px;">⚠️</span>
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
                            
                            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #92400e; font-size: 16px; line-height: 1.6; font-weight: 600;">
                                    <?= htmlspecialchars($message_text, ENT_QUOTES, 'UTF-8') ?>
                                </p>
                            </div>

                            <p style="margin: 0 0 30px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                <?= htmlspecialchars($t['action_text'], ENT_QUOTES, 'UTF-8') ?>
                            </p>

                            <!-- Login Button -->
                            <table role="presentation" style="width: 100%; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="<?= htmlspecialchars($app_url . '/wallet', ENT_QUOTES, 'UTF-8') ?>" 
                                           style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); transition: transform 0.2s;">
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
