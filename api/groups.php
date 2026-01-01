<?php
/**
 * Volley Registration App - Groups API
 * 
 * Endpoints:
 * - GET: Fetch all groups
 * - POST: Create a new group (admin only)
 */

require_once __DIR__ . '/auth.php';

// Require authentication for all group operations
$currentUser = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetGroups($currentUser);
        break;
    case 'POST':
        handleCreateGroup($currentUser);
        break;
    case 'PUT':
    case 'PATCH':
        handleUpdateGroup($currentUser);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * GET - Fetch all groups
 */
function handleGetGroups(array $currentUser): void
{
    $pdo = getDbConnection();
    
    try {
        $sql = "
            SELECT
                g.id,
                g.name,
                g.description,
                g.owner_id,
                g.is_active,
                g.max_depositors,
                g.created_at,
                u.name as owner_name
            FROM groups g
            LEFT JOIN users u ON g.owner_id = u.id
            WHERE g.is_active = 1
            ORDER BY g.name ASC
        ";
        
        $stmt = $pdo->query($sql);
        $groups = $stmt->fetchAll();
        
        // Format data
        foreach ($groups as &$group) {
            $group['id'] = (int)$group['id'];
            $group['owner_id'] = (int)$group['owner_id'];
            $group['is_active'] = (bool)$group['is_active'];
        }
        
        sendSuccess(['groups' => $groups]);
        
    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to fetch groups', 500);
    }
}

/**
 * POST - Create a new group (admin only)
 */
function handleCreateGroup(array $currentUser): void
{
    // Check admin permissions
    if (!in_array($currentUser['role'], ['super_admin', 'group_admin'])) {
        sendError('Access denied. Admin privileges required.', 403);
    }

    $input = getJsonInput();

    // Validate required fields
    $required = ['name'];
    $missing = validateRequired($input, $required);

    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 400);
    }

    $pdo = getDbConnection();

    try {
        $stmt = $pdo->prepare("
            INSERT INTO groups (name, description, owner_id, is_active, created_at)
            VALUES (?, ?, ?, 1, NOW())
        ");

        $stmt->execute([
            trim($input['name']),
            $input['description'] ?? null,
            $currentUser['id']
        ]);

        $groupId = $pdo->lastInsertId();

        sendSuccess(['group_id' => (int)$groupId], 'Group created successfully', 201);

    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to create group', 500);
    }
}

/**
 * PUT/PATCH - Update a group (super_admin only)
 */
function handleUpdateGroup(array $currentUser): void
{
    // Only super_admin can update max_depositors
    if ($currentUser['role'] !== 'super_admin') {
        sendError('Access denied. Super Admin privileges required.', 403);
    }

    $input = getJsonInput();

    // Validate group_id
    if (empty($input['group_id'])) {
        sendError('Missing required field: group_id', 400);
    }

    $groupId = (int)$input['group_id'];

    $pdo = getDbConnection();

    try {
        // Check if group exists
        $stmt = $pdo->prepare("SELECT id FROM groups WHERE id = ? AND is_active = 1");
        $stmt->execute([$groupId]);
        if (!$stmt->fetch()) {
            sendError('Group not found', 404);
        }

        // Update max_depositors
        if (isset($input['max_depositors'])) {
            $maxDepositors = $input['max_depositors'];

            // NULL means unlimited, otherwise must be positive integer
            if ($maxDepositors !== null) {
                $maxDepositors = (int)$maxDepositors;
                if ($maxDepositors < 0) {
                    sendError('max_depositors must be a positive number or null', 400);
                }
            }

            $stmt = $pdo->prepare("
                UPDATE groups
                SET max_depositors = ?, updated_at = NOW()
                WHERE id = ?
            ");

            $stmt->execute([$maxDepositors, $groupId]);

            sendSuccess(['group_id' => $groupId], 'Group updated successfully');
        } else {
            sendError('No fields to update', 400);
        }

    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to update group', 500);
    }
}
