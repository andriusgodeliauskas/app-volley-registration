<?php
/**
 * Negative Balance Email Template - Simple Version
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
                
                <!-- Balance Warning -->
                <p style="margin: 0 0 15px 0; padding: 12px; background-color: #f5f5f5; border-left: 3px solid #000000; font-size: 14px; line-height: 1.5; color: #000000; font-weight: bold;">
                    <?= htmlspecialchars($message_text, ENT_QUOTES, 'UTF-8') ?>
                </p>

                <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #000000;">
                    <?= htmlspecialchars($t['action_text'], ENT_QUOTES, 'UTF-8') ?>
                </p>

                <!-- Login Button -->
                <table role="presentation" style="width: 100%; margin: 20px 0;">
                    <tr>
                        <td align="center">
                            <a href="<?= htmlspecialchars($app_url . '/wallet', ENT_QUOTES, 'UTF-8') ?>" 
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
