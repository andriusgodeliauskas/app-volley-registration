<?php
/**
 * Volley Registration App - User API
 * 
 * Endpoints:
 * - GET: Get current user profile and balance
 */

require_once __DIR__ . '/auth.php';

// Require authentication
$currentUser = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetUser($currentUser);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * GET - Get current user profile with fresh balance
 */
function handleGetUser(array $currentUser): void
{
    $pdo = getDbConnection();
    
    try {
        // Fetch fresh user data
        $stmt = $pdo->prepare("
            SELECT id, name, surname, email, role, balance, negative_balance_limit, parent_id, is_active, created_at, avatar, preferred_language, pay_for_family_members
            FROM users
            WHERE id = ?
        ");
        $stmt->execute([$currentUser['id']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            sendError('User not found', 404);
        }
        
        // Format data
        $user['id'] = (int)$user['id'];
        $user['balance'] = (float)$user['balance'];
        $user['parent_id'] = $user['parent_id'] ? (int)$user['parent_id'] : null;
        $user['is_active'] = (bool)$user['is_active'];
        $user['preferred_language'] = $user['preferred_language'] ?? 'lt';
        $user['pay_for_family_members'] = (bool)$user['pay_for_family_members'];
        
        // Fetch children if any
        $stmt = $pdo->prepare("
            SELECT id, name, email, balance, is_active
            FROM users 
            WHERE parent_id = ?
        ");
        $stmt->execute([$currentUser['id']]);
        $children = $stmt->fetchAll();
        
        foreach ($children as &$child) {
            $child['id'] = (int)$child['id'];
            $child['balance'] = (float)$child['balance'];
            $child['is_active'] = (bool)$child['is_active'];
        }
        
        $user['children'] = $children;
        
        // Fetch upcoming registrations count
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count
            FROM registrations r
            JOIN events e ON r.event_id = e.id
            WHERE r.user_id = ? AND r.status = 'registered' AND e.date_time > NOW()
        ");
        $stmt->execute([$currentUser['id']]);
        $user['upcoming_events_count'] = (int)$stmt->fetchColumn();
        
        sendSuccess(['user' => $user]);
        
    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to fetch user data', 500);
    }
}
