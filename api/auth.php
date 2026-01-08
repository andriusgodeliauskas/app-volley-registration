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
        return null;
    }
    
    try {
        $pdo = getDbConnection();
        
        $stmt = $pdo->prepare("
            SELECT id, name, email, role, balance, parent_id, is_active, token_expiry
            FROM users 
            WHERE auth_token = ? AND is_active = 1
        ");
        $stmt->execute([$token]);
        
        $user = $stmt->fetch();
        
        if (!$user) {
            return null;
        }
        
        // Check if token has expired
        if ($user['token_expiry'] && strtotime($user['token_expiry']) < time()) {
            return null;
        }
        
        // Remove sensitive fields
        unset($user['token_expiry']);
        
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
