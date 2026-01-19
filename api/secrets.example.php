<?php
// Database Credentials Example - Rename to secrets.php and fill in details
define('DB_HOST', 'localhost'); // Database Host (e.g., localhost)
define('DB_NAME', 'your_database_name'); // Database Name
define('DB_USER', 'your_database_user'); // Database User
define('DB_PASS', 'your_database_password'); // Database Password

// Google OAuth Configuration
define('GOOGLE_CLIENT_ID', 'your_google_client_id.apps.googleusercontent.com');
define('GOOGLE_CLIENT_SECRET', 'your_google_client_secret');

// SMTP Email Configuration (REQUIRED for password reset functionality)
define('SMTP_HOST', 'smtp.gmail.com'); // SMTP server (Gmail, SendGrid, etc.)
define('SMTP_PORT', 587); // TLS: 587, SSL: 465
define('SMTP_ENCRYPTION', 'tls'); // 'tls' or 'ssl'
define('SMTP_USERNAME', 'your-email@gmail.com'); // SMTP username
define('SMTP_PASSWORD', 'your-app-specific-password'); // Gmail: App Password, not regular password
define('SMTP_FROM_EMAIL', 'noreply@godeliauskas.com'); // From email address
define('SMTP_FROM_NAME', 'Volley Registration'); // From name
