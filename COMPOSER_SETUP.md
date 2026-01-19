# Composer Setup Instructions

## PHPMailer Dependency Installation

This project now uses PHPMailer for email functionality (password reset, notifications, etc.).

### Installation Steps

#### 1. On Development Machine (Local)

```bash
# Navigate to project root
cd D:\Andriaus\Projects\my-projects\app-volley-registration

# Install Composer dependencies
composer install
```

This will create a `vendor/` directory with PHPMailer and its dependencies.

#### 2. On Production/Staging Server

When deploying to the server, run the following command in the project root:

```bash
composer install --no-dev --optimize-autoloader
```

Flags:
- `--no-dev`: Only install production dependencies (no dev tools)
- `--optimize-autoloader`: Generate optimized autoloader for better performance

#### 3. Server Requirements

Ensure the server has:
- PHP 7.4 or higher
- Composer installed
- Write permissions for `vendor/` directory

### Alternative: Manual Deployment

If Composer is not available on the production server, you can:

1. Run `composer install` locally
2. Include the `vendor/` directory in your deployment package
3. Upload the entire `vendor/` directory to the server

**Note**: The `vendor/` directory is gitignored, so it won't be committed to version control.

### SMTP Configuration

After installing dependencies, configure SMTP settings:

#### Production
Edit `api/secrets.php` and add:
```php
define('SMTP_USERNAME', 'your-email@gmail.com');
define('SMTP_PASSWORD', 'your-app-password');
```

#### Staging
Edit `api/config-staging.php` and update the SMTP settings section.

### Testing Email Functionality

To test if emails are working:

1. Send a password reset request via `/api/forgot-password.php`
2. Check error logs for email sending status:
   - Success: "Email sent successfully to: email@example.com"
   - Failure: "Email sending failed to: email@example.com, error: ..."

### Troubleshooting

#### Composer not found
```bash
# Install Composer globally (Windows)
# Download from: https://getcomposer.org/download/

# Verify installation
composer --version
```

#### PHPMailer errors
- Check SMTP credentials are correct
- Verify SMTP_HOST and SMTP_PORT settings
- Ensure firewall allows outbound SMTP connections (port 587)
- For Gmail: Use App Password, not regular password

#### Autoloader not found
If you see "vendor/autoload.php not found" errors:
```bash
composer install
```

### Security Notes

- Never commit `vendor/` to git
- Never commit SMTP passwords to version control
- Use App Passwords for Gmail (not regular passwords)
- Keep Composer dependencies up to date: `composer update`

### Files Added/Modified

New files:
- `composer.json` - Dependency configuration
- `api/email.php` - Email utility functions
- `api/email-templates/password-reset.php` - Password reset email template
- `api/forgot-password.php` - Forgot password endpoint
- `api/reset-password.php` - Reset password endpoint

Modified files:
- `api/config.php` - Added SMTP and APP_URL configuration
- `api/config-staging.php` - Added SMTP and APP_URL configuration
- `api/login.php` - Removed is_active check
- `api/google-auth.php` - Immediate login for new Google users
- `api/auth.php` - Removed is_active check
- `api/events.php` - Added user_has_groups check
