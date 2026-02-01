<?php
/**
 * Volley Registration App - Admin Family Permissions API
 *
 * Admin endpoint'as šeimos leidimų valdymui.
 * Leidžia super admin peržiūrėti, kurti ir šalinti šeimos leidimus.
 *
 * Endpoints:
 * - GET: Gauti visus šeimos leidimus (su paginacija ir filtrais)
 * - POST: Admin sukuria patvirtintą šeimos ryšį
 * - DELETE: Admin pašalina šeimos ryšį
 *
 * @package Volley\API
 * @author Coding Agent
 * @version 1.0
 */

require_once __DIR__ . '/auth.php';

// SECURITY: Reikalauti Super Admin rolės
$currentUser = requireSuperAdmin();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetAllPermissions($currentUser);
        break;
    case 'POST':
        handleAdminCreatePermission($currentUser);
        break;
    case 'DELETE':
        handleAdminRemovePermission($currentUser);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * GET - Gauti visus šeimos leidimus su paginacija ir filtrais
 *
 * Query parametrai:
 * - page: puslapio numeris (default: 1)
 * - limit: rezultatų limitas per puslapį (default: 20, max: 100)
 * - status: filtruoti pagal status ('all', 'pending', 'accepted', 'rejected', 'canceled')
 * - search: paieška pagal vardą arba email
 *
 * @param array $currentUser Autentifikuoto admin vartotojo duomenys
 * @return void
 */
function handleGetAllPermissions(array $currentUser): void
{
    $pdo = getDbConnection();

    // Gauti query parametrus
    $page = max(1, filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT) ?: 1);
    $limit = min(100, max(1, filter_var($_GET['limit'] ?? 20, FILTER_VALIDATE_INT) ?: 20));
    $status = $_GET['status'] ?? 'all';
    $search = trim($_GET['search'] ?? '');

    $offset = ($page - 1) * $limit;

    try {
        // Base query
        $sql = "
            SELECT
                fp.id,
                fp.requester_id,
                fp.target_id,
                fp.status,
                fp.can_pay,
                fp.requested_at,
                fp.responded_at,
                u_requester.name as requester_name,
                u_requester.email as requester_email,
                u_requester.balance as requester_balance,
                u_target.name as target_name,
                u_target.email as target_email,
                u_target.balance as target_balance
            FROM family_permissions fp
            JOIN users u_requester ON fp.requester_id = u_requester.id
            JOIN users u_target ON fp.target_id = u_target.id
            WHERE 1=1
        ";

        $countSql = "
            SELECT COUNT(*) as total
            FROM family_permissions fp
            JOIN users u_requester ON fp.requester_id = u_requester.id
            JOIN users u_target ON fp.target_id = u_target.id
            WHERE 1=1
        ";

        $params = [];

        // Filtruoti pagal status
        if ($status !== 'all') {
            $validStatuses = ['pending', 'accepted', 'rejected', 'canceled'];
            if (in_array($status, $validStatuses)) {
                $sql .= " AND fp.status = :status";
                $countSql .= " AND fp.status = :status";
                $params['status'] = $status;
            }
        }

        // Paieška pagal vardą arba email
        if (!empty($search)) {
            // SECURITY: Escape LIKE special characters
            $escapedSearch = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search);
            $searchPattern = '%' . $escapedSearch . '%';
            $sql .= " AND (
                u_requester.name LIKE :search ESCAPE '\\\\'
                OR u_requester.email LIKE :search ESCAPE '\\\\'
                OR u_target.name LIKE :search ESCAPE '\\\\'
                OR u_target.email LIKE :search ESCAPE '\\\\'
            )";
            $countSql .= " AND (
                u_requester.name LIKE :search ESCAPE '\\\\'
                OR u_requester.email LIKE :search ESCAPE '\\\\'
                OR u_target.name LIKE :search ESCAPE '\\\\'
                OR u_target.email LIKE :search ESCAPE '\\\\'
            )";
            $params['search'] = $searchPattern;
        }

        // Gauti bendrą kiekį
        $countStmt = $pdo->prepare($countSql);
        foreach ($params as $key => $value) {
            $countStmt->bindValue(":$key", $value);
        }
        $countStmt->execute();
        $totalCount = $countStmt->fetch()['total'];

        // Pridėti rikiavimą ir paginaciją
        $sql .= " ORDER BY fp.requested_at DESC LIMIT :limit OFFSET :offset";

        // Vykdyti pagrindinį query
        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $permissions = $stmt->fetchAll();

        // Formatuoti duomenis
        $formattedPermissions = [];
        foreach ($permissions as $permission) {
            $formattedPermissions[] = [
                'id' => (int)$permission['id'],
                'requester' => [
                    'id' => (int)$permission['requester_id'],
                    'name' => $permission['requester_name'],
                    'email' => $permission['requester_email'],
                    'balance' => (float)$permission['requester_balance']
                ],
                'target' => [
                    'id' => (int)$permission['target_id'],
                    'name' => $permission['target_name'],
                    'email' => $permission['target_email'],
                    'balance' => (float)$permission['target_balance']
                ],
                'status' => $permission['status'],
                'can_pay' => (bool)$permission['can_pay'],
                'requested_at' => $permission['requested_at'],
                'responded_at' => $permission['responded_at']
            ];
        }

        // Apskaičiuoti paginacijos metadatą
        $totalPages = ceil($totalCount / $limit);

        sendSuccess([
            'permissions' => $formattedPermissions,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => (int)$totalCount,
                'total_pages' => $totalPages,
                'has_next' => $page < $totalPages,
                'has_previous' => $page > 1
            ]
        ]);

    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to fetch family permissions', 500);
    }
}

/**
 * POST - Admin sukuria patvirtintą šeimos ryšį
 *
 * Sukuria patvirtintą leidimą be prašymo proceso.
 *
 * Parametrai:
 * - requester_id: vartotojo ID, kuris prašo leidimo
 * - target_id: vartotojo ID, kuriam prašoma leidimo
 *
 * Audit log: 'admin_added'
 *
 * @param array $currentUser Autentifikuoto admin vartotojo duomenys
 * @return void
 */
function handleAdminCreatePermission(array $currentUser): void
{
    $pdo = getDbConnection();
    $input = getJsonInput();

    // Validacija: requester_id ir target_id privalo būti
    $required = ['requester_id', 'target_id'];
    $missing = validateRequired($input, $required);

    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 400);
    }

    $requesterId = filter_var($input['requester_id'], FILTER_VALIDATE_INT);
    $targetId = filter_var($input['target_id'], FILTER_VALIDATE_INT);

    // SECURITY: Validuoti integer
    if ($requesterId === false || $requesterId < 1) {
        sendError('Invalid requester_id', 400);
    }

    if ($targetId === false || $targetId < 1) {
        sendError('Invalid target_id', 400);
    }

    // Validacija: requester ir target negali būti tas pats
    if ($requesterId === $targetId) {
        sendError('Requester and target cannot be the same user', 400);
    }

    try {
        // Patikrinti ar abu vartotojai egzistuoja
        $stmt = $pdo->prepare("SELECT id, name, email, is_active FROM users WHERE id IN (?, ?)");
        $stmt->execute([$requesterId, $targetId]);
        $users = $stmt->fetchAll();

        if (count($users) !== 2) {
            sendError('One or both users not found', 404);
        }

        $requesterUser = null;
        $targetUser = null;
        foreach ($users as $user) {
            if ((int)$user['id'] === (int)$requesterId) {
                $requesterUser = $user;
            }
            if ((int)$user['id'] === (int)$targetId) {
                $targetUser = $user;
            }
        }

        // Patikrinti ar abu vartotojai aktyvūs
        if (!$requesterUser['is_active']) {
            sendError('Requester user account is inactive', 400);
        }
        if (!$targetUser['is_active']) {
            sendError('Target user account is inactive', 400);
        }

        // Tikrinti ar nėra jau egzistuojančio leidimo
        $stmt = $pdo->prepare("
            SELECT id, status
            FROM family_permissions
            WHERE requester_id = ? AND target_id = ?
        ");
        $stmt->execute([$requesterId, $targetId]);
        $existingPermission = $stmt->fetch();

        if ($existingPermission) {
            if ($existingPermission['status'] === 'accepted') {
                sendError('Family permission already exists and is active', 409);
            }

            // Jei leidimas egzistuoja bet nėra accepted, atnaujinti jį
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("
                UPDATE family_permissions
                SET status = 'accepted', responded_at = NOW(), requested_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$existingPermission['id']]);

            // Sukurti audit log įrašą
            createAdminAuditLog($pdo, $existingPermission['id'], 'admin_added', $currentUser['id'], $requesterId, $targetId);

            $pdo->commit();

            sendSuccess([
                'permission_id' => (int)$existingPermission['id'],
                'status' => 'accepted'
            ], 'Family permission updated and activated by admin', 200);

            return;
        }

        // Sukurti naują patvirtintą leidimą
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            INSERT INTO family_permissions (requester_id, target_id, status, can_pay, requested_at, responded_at)
            VALUES (?, ?, 'accepted', 1, NOW(), NOW())
        ");
        $stmt->execute([$requesterId, $targetId]);

        $permissionId = $pdo->lastInsertId();

        // Sukurti audit log įrašą
        createAdminAuditLog($pdo, $permissionId, 'admin_added', $currentUser['id'], $requesterId, $targetId);

        $pdo->commit();

        sendSuccess([
            'permission_id' => (int)$permissionId,
            'status' => 'accepted',
            'requester' => [
                'id' => (int)$requesterUser['id'],
                'name' => $requesterUser['name'],
                'email' => $requesterUser['email']
            ],
            'target' => [
                'id' => (int)$targetUser['id'],
                'name' => $targetUser['name'],
                'email' => $targetUser['email']
            ]
        ], 'Family permission created by admin successfully', 201);

    } catch (PDOException $e) {
        $pdo->rollBack();

        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to create family permission', 500);
    }
}

/**
 * DELETE - Admin pašalina šeimos ryšį
 *
 * Pakeičia status į 'canceled' (soft delete).
 *
 * Parametrai:
 * - permission_id: leidimo ID
 *
 * Audit log: 'admin_removed'
 *
 * @param array $currentUser Autentifikuoto admin vartotojo duomenys
 * @return void
 */
function handleAdminRemovePermission(array $currentUser): void
{
    $pdo = getDbConnection();

    // Gauti permission_id iš query parametrų
    $permissionId = filter_var($_GET['permission_id'] ?? 0, FILTER_VALIDATE_INT);

    // SECURITY: Validuoti integer
    if ($permissionId === false || $permissionId < 1) {
        sendError('Invalid or missing permission_id', 400);
    }

    try {
        // Gauti leidimo duomenis
        $stmt = $pdo->prepare("
            SELECT id, requester_id, target_id, status
            FROM family_permissions
            WHERE id = ?
        ");
        $stmt->execute([$permissionId]);
        $permission = $stmt->fetch();

        if (!$permission) {
            sendError('Family permission not found', 404);
        }

        // Negalima pašalinti jau atšaukto
        if ($permission['status'] === 'canceled') {
            sendError('This permission is already canceled', 400);
        }

        $pdo->beginTransaction();

        // Pakeisti status į 'canceled'
        $stmt = $pdo->prepare("
            UPDATE family_permissions
            SET status = 'canceled', responded_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$permissionId]);

        // Sukurti audit log įrašą
        createAdminAuditLog(
            $pdo,
            $permissionId,
            'admin_removed',
            $currentUser['id'],
            $permission['requester_id'],
            $permission['target_id']
        );

        $pdo->commit();

        sendSuccess([
            'permission_id' => (int)$permissionId,
            'status' => 'canceled'
        ], 'Family permission removed by admin successfully');

    } catch (PDOException $e) {
        $pdo->rollBack();

        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to remove family permission', 500);
    }
}

/**
 * Sukurti admin audit log įrašą
 *
 * @param PDO $pdo Database connection
 * @param int $permissionId Family permission ID
 * @param string $action Action type ('admin_added' or 'admin_removed')
 * @param int $performedBy Admin user ID
 * @param int $requesterId Requester user ID
 * @param int $targetId Target user ID
 * @return void
 */
function createAdminAuditLog(
    PDO $pdo,
    int $permissionId,
    string $action,
    int $performedBy,
    int $requesterId,
    int $targetId
): void {
    $details = json_encode([
        'admin_id' => $performedBy,
        'requester_id' => $requesterId,
        'target_id' => $targetId,
        'action' => $action
    ], JSON_UNESCAPED_UNICODE);

    $stmt = $pdo->prepare("
        INSERT INTO family_audit_log
        (family_permission_id, action, performed_by, target_user_id, details)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$permissionId, $action, $performedBy, $targetId, $details]);
}
