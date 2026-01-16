<?php
/**
 * Volley Registration App - Authentication Middleware
 * 
 * Include this file in protected endpoints to verify the auth token.
 * 
 * Usage:
 *   require_once __DIR__ . '/auth.php';
 *   $currentUser = requireAuth(); // Returns user array or sends 401
 */

require_once __DIR__ . '/db.php';

// Note: CSRF protection now handled by httpOnly cookies with SameSite=Strict
// No need for session-based CSRF tokens

/**
 * Get the current authenticated user from the token
 *
 * @return array|null User data or null if not authenticated
 */
function getAuthUser(): ?array
{
    // Priority 1: Get token from httpOnly cookie (most secure)
    $token = $_COOKIE['auth_token'] ?? '';

    // Fallback: Authorization header (for API compatibility)
    if (empty($token)) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        // Support both "Bearer <token>" and just "<token>"
        if (preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
            $token = $matches[1];
        } elseif (!empty($authHeader)) {
            $token = $authHeader;
        }
    }

    // Fallback: Query string (for GET requests - least secure, only for backward compatibility)
    if (empty($token) && isset($_GET['token'])) {
        $token = $_GET['token'];
    }

    if (empty($token)) {
        // No auth_token found, try remember_me_token
        return tryRememberMeToken();
    }

    try {
        $pdo = getDbConnection();

        $stmt = $pdo->prepare("
            SELECT id, name, email, role, balance, parent_id, is_active, token_expiry, last_activity
            FROM users
            WHERE auth_token = ? AND is_active = 1
        ");
        $stmt->execute([$token]);

        $user = $stmt->fetch();

        if (!$user) {
            // Invalid auth_token, try remember_me_token
            return tryRememberMeToken();
        }

        // Check if token has expired (max lifetime: 7 days)
        if ($user['token_expiry'] && strtotime($user['token_expiry']) < time()) {
            // Token expired, try remember_me_token
            return tryRememberMeToken();
        }

        // Check for inactivity timeout (30 minutes)
        // SECURITY: Session expires after 30 minutes of inactivity
        if ($user['last_activity']) {
            $lastActivity = strtotime($user['last_activity']);
            $inactivityTimeout = 30 * 60; // 30 minutes in seconds

            if ((time() - $lastActivity) > $inactivityTimeout) {
                // Session expired due to inactivity - try remember_me_token
                return tryRememberMeToken();
            }
        }

        // Update last_activity to current time (session is still active)
        $stmt = $pdo->prepare("
            UPDATE users
            SET last_activity = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$user['id']]);

        // Remove sensitive fields
        unset($user['token_expiry']);
        unset($user['last_activity']);

        // Cast types
        $user['id'] = (int) $user['id'];
        $user['parent_id'] = $user['parent_id'] ? (int) $user['parent_id'] : null;
        $user['is_active'] = (bool) $user['is_active'];

        return $user;

    } catch (PDOException $e) {
        return null;
    }
}

/**
 * Try to authenticate using remember_me_token
 * If valid, creates a new auth_token and returns user
 *
 * @return array|null User data or null if not authenticated
 */
function tryRememberMeToken(): ?array
{
    // Get remember_me_token from cookie
    $rememberMeToken = $_COOKIE['remember_me_token'] ?? '';

    if (empty($rememberMeToken)) {
        return null;
    }

    try {
        $pdo = getDbConnection();

        $stmt = $pdo->prepare("
            SELECT id, name, email, role, balance, parent_id, is_active, remember_me_expiry
            FROM users
            WHERE remember_me_token = ? AND is_active = 1
        ");
        $stmt->execute([$rememberMeToken]);

        $user = $stmt->fetch();

        if (!$user) {
            return null;
        }

        // Check if remember_me_token has expired (30 days)
        if ($user['remember_me_expiry'] && strtotime($user['remember_me_expiry']) < time()) {
            // Remember me token expired, clear it
            $stmt = $pdo->prepare("
                UPDATE users
                SET remember_me_token = NULL, remember_me_expiry = NULL
                WHERE id = ?
            ");
            $stmt->execute([$user['id']]);

            // Clear cookie
            setcookie('remember_me_token', '', ['expires' => time() - 3600, 'path' => '/']);

            return null;
        }

        // Remember me token is valid! Create a new auth_token
        $newToken = generateToken(32);
        $tokenExpiry = date('Y-m-d H:i:s', strtotime('+' . TOKEN_EXPIRY_HOURS . ' hours'));

        $stmt = $pdo->prepare("
            UPDATE users
            SET auth_token = ?, token_expiry = ?, last_activity = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$newToken, $tokenExpiry, $user['id']]);

        // Set new auth_token cookie (session cookie, not persistent)
        $cookieOptions = [
            'expires' => 0, // Session cookie
            'path' => '/',
            'domain' => '',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Strict'
        ];
        setcookie('auth_token', $newToken, $cookieOptions);

        // Remove sensitive fields
        unset($user['remember_me_expiry']);

        // Cast types
        $user['id'] = (int) $user['id'];
        $user['parent_id'] = $user['parent_id'] ? (int) $user['parent_id'] : null;
        $user['is_active'] = (bool) $user['is_active'];

        return $user;

    } catch (PDOException $e) {
        return null;
    }
}

/**
 * Require authentication - sends 401 if not authenticated
 * 
 * @return array User data
 */
function requireAuth(): array
{
    $user = getAuthUser();

    if ($user === null) {
        sendError('Unauthorized. Please log in.', 401);
    }

    return $user;
}

/**
 * Require specific role(s) - sends 403 if user doesn't have required role
 * 
 * @param string|array $roles Single role or array of allowed roles
 * @return array User data
 */
function requireRole($roles): array
{
    $user = requireAuth();

    if (is_string($roles)) {
        $roles = [$roles];
    }

    if (!in_array($user['role'], $roles)) {
        sendError('Access denied. Insufficient permissions.', 403);
    }

    return $user;
}

/**
 * Require Super Admin role
 * 
 * @return array User data
 */
function requireSuperAdmin(): array
{
    return requireRole('super_admin');
}

/**
 * Require Group Admin or Super Admin role
 * 
 * @return array User data
 */
function requireGroupAdmin(): array
{
    return requireRole(['super_admin', 'group_admin']);
}
