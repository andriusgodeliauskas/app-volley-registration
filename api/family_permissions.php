<?php
/**
 * Volley Registration App - Family Permissions API
 *
 * Šeimos leidimų valdymo endpoint'as.
 * Leidžia vartotojams prašyti ir valdyti leidimus mokėti už kitus šeimos narius.
 *
 * Endpoints:
 * - GET: Gauti vartotojo šeimos leidimus (išsiųsti prašymai, gauti prašymai, šeimos nariai)
 * - POST: Siųsti naują leidimo prašymą
 * - PUT: Atsakyti į gautą prašymą (priimti arba atmesti)
 * - DELETE: Panaikinti leidimą/prašymą
 *
 * @package Volley\API
 * @author Coding Agent
 * @version 1.0
 */

require_once __DIR__ . '/auth.php';

// Reikalauti autentifikacijos visiems veiksmams
$currentUser = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetPermissions($currentUser);
        break;
    case 'POST':
        handleSendRequest($currentUser);
        break;
    case 'PUT':
        handleRespondToRequest($currentUser);
        break;
    case 'DELETE':
        handleCancelPermission($currentUser);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * GET - Gauti vartotojo šeimos leidimus
 *
 * Grąžina 3 sąrašus:
 * 1. sent_requests - išsiųsti prašymai (requester_id = current_user)
 * 2. received_requests - gauti prašymai (target_id = current_user)
 * 3. family_members - aktyvūs šeimos nariai (status = 'accepted')
 *
 * @param array $currentUser Autentifikuoto vartotojo duomenys
 * @return void
 */
function handleGetPermissions(array $currentUser): void
{
    $pdo = getDbConnection();
    $userId = $currentUser['id'];

    try {
        // 1. Išsiųsti prašymai
        $stmt = $pdo->prepare("
            SELECT
                fp.id,
                fp.target_id,
                fp.status,
                fp.requested_at,
                fp.responded_at,
                u.name as target_name,
                u.email as target_email
            FROM family_permissions fp
            JOIN users u ON fp.target_id = u.id
            WHERE fp.requester_id = ?
            ORDER BY fp.requested_at DESC
        ");
        $stmt->execute([$userId]);
        $sentRequests = $stmt->fetchAll();

        // 2. Gauti prašymai
        $stmt = $pdo->prepare("
            SELECT
                fp.id,
                fp.requester_id,
                fp.status,
                fp.requested_at,
                fp.responded_at,
                u.name as requester_name,
                u.email as requester_email
            FROM family_permissions fp
            JOIN users u ON fp.requester_id = u.id
            WHERE fp.target_id = ?
            ORDER BY fp.requested_at DESC
        ");
        $stmt->execute([$userId]);
        $receivedRequests = $stmt->fetchAll();

        // 3. Aktyvūs šeimos nariai (status = 'accepted')
        $stmt = $pdo->prepare("
            SELECT
                fp.id,
                fp.requester_id,
                fp.target_id,
                fp.can_pay,
                fp.requested_at,
                fp.responded_at,
                CASE
                    WHEN fp.requester_id = ? THEN u_target.id
                    ELSE u_requester.id
                END as member_id,
                CASE
                    WHEN fp.requester_id = ? THEN u_target.name
                    ELSE u_requester.name
                END as member_name,
                CASE
                    WHEN fp.requester_id = ? THEN u_target.email
                    ELSE u_requester.email
                END as member_email
            FROM family_permissions fp
            JOIN users u_requester ON fp.requester_id = u_requester.id
            JOIN users u_target ON fp.target_id = u_target.id
            WHERE fp.status = 'accepted'
            AND (fp.requester_id = ? OR fp.target_id = ?)
            ORDER BY fp.responded_at DESC
        ");
        $stmt->execute([$userId, $userId, $userId, $userId, $userId]);
        $familyMembers = $stmt->fetchAll();

        // Formatuoti duomenis
        foreach ($sentRequests as &$request) {
            $request['id'] = (int)$request['id'];
            $request['target_id'] = (int)$request['target_id'];
        }

        foreach ($receivedRequests as &$request) {
            $request['id'] = (int)$request['id'];
            $request['requester_id'] = (int)$request['requester_id'];
        }

        foreach ($familyMembers as &$member) {
            $member['id'] = (int)$member['id'];
            $member['member_id'] = (int)$member['member_id'];
            $member['requester_id'] = (int)$member['requester_id'];
            $member['target_id'] = (int)$member['target_id'];
            $member['can_pay'] = (bool)$member['can_pay'];
        }

        sendSuccess([
            'sent_requests' => $sentRequests,
            'received_requests' => $receivedRequests,
            'family_members' => $familyMembers
        ]);

    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to fetch family permissions', 500);
    }
}

/**
 * POST - Siųsti naują leidimo prašymą
 *
 * Validacija:
 * - Negalima siųsti sau
 * - Tikrina ar toks vartotojas egzistuoja
 * - Tikrina ar nėra jau aktyvaus prašymo/leidimo
 *
 * Sukuria audit log įrašą 'request_sent'
 *
 * @param array $currentUser Autentifikuoto vartotojo duomenys
 * @return void
 */
function handleSendRequest(array $currentUser): void
{
    $pdo = getDbConnection();
    $input = getJsonInput();

    // Validacija: target_email privalo būti
    $required = ['target_email'];
    $missing = validateRequired($input, $required);

    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 400);
    }

    $targetEmail = trim($input['target_email']);

    // SECURITY: Validuoti email formatą
    if (!isValidEmail($targetEmail)) {
        sendError('Invalid email format', 400);
    }

    // Rate limiting - apsaugoti nuo spam'o
    checkRateLimit($currentUser['email'], 'family_request', 10, 60);

    try {
        // Patikrinti ar target vartotojas egzistuoja
        $stmt = $pdo->prepare("SELECT id, name, email, is_active FROM users WHERE email = ?");
        $stmt->execute([$targetEmail]);
        $targetUser = $stmt->fetch();

        if (!$targetUser) {
            sendError('User with this email does not exist', 404);
        }

        // Validacija: negalima siųsti prašymo sau
        if ((int)$targetUser['id'] === (int)$currentUser['id']) {
            sendError('Cannot send family permission request to yourself', 400);
        }

        // Validacija: tikrinti ar target vartotojas aktyvus
        if (!$targetUser['is_active']) {
            sendError('Target user account is inactive', 400);
        }

        // Tikrinti ar nėra jau aktyvaus prašymo/leidimo
        $stmt = $pdo->prepare("
            SELECT id, status
            FROM family_permissions
            WHERE requester_id = ? AND target_id = ?
        ");
        $stmt->execute([$currentUser['id'], $targetUser['id']]);
        $existingPermission = $stmt->fetch();

        if ($existingPermission) {
            if ($existingPermission['status'] === 'pending') {
                sendError('You already have a pending request to this user', 409);
            } elseif ($existingPermission['status'] === 'accepted') {
                sendError('You already have an active family permission with this user', 409);
            } elseif ($existingPermission['status'] === 'rejected') {
                // Jei buvo atmestas, leidžiame siųsti naują prašymą (update existing)
                $pdo->beginTransaction();

                $stmt = $pdo->prepare("
                    UPDATE family_permissions
                    SET status = 'pending', requested_at = NOW(), responded_at = NULL
                    WHERE id = ?
                ");
                $stmt->execute([$existingPermission['id']]);

                // Sukurti audit log įrašą
                createAuditLog($pdo, $existingPermission['id'], 'request_sent', $currentUser['id'], $targetUser['id']);

                $pdo->commit();

                sendSuccess([
                    'permission_id' => (int)$existingPermission['id'],
                    'status' => 'pending'
                ], 'Family permission request sent successfully', 200);
            }
        }

        // Sukurti naują prašymą
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            INSERT INTO family_permissions (requester_id, target_id, status, can_pay)
            VALUES (?, ?, 'pending', 1)
        ");
        $stmt->execute([$currentUser['id'], $targetUser['id']]);

        $permissionId = $pdo->lastInsertId();

        // Sukurti audit log įrašą
        createAuditLog($pdo, $permissionId, 'request_sent', $currentUser['id'], $targetUser['id']);

        $pdo->commit();

        // TODO: Siųsti email notification target vartotojui

        sendSuccess([
            'permission_id' => (int)$permissionId,
            'status' => 'pending',
            'target_user' => [
                'id' => (int)$targetUser['id'],
                'name' => $targetUser['name'],
                'email' => $targetUser['email']
            ]
        ], 'Family permission request sent successfully', 201);

    } catch (PDOException $e) {
        $pdo->rollBack();

        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to send family permission request', 500);
    }
}

/**
 * PUT - Atsakyti į gautą prašymą (priimti arba atmesti)
 *
 * Validacija:
 * - Tik target_id gali priimti/atmesti prašymą
 * - Prašymas turi būti 'pending' būsenoje
 *
 * Atnaujina status ir responded_at
 * Sukuria audit log įrašą
 *
 * @param array $currentUser Autentifikuoto vartotojo duomenys
 * @return void
 */
function handleRespondToRequest(array $currentUser): void
{
    $pdo = getDbConnection();
    $input = getJsonInput();

    // Validacija: permission_id ir action privalo būti
    $required = ['permission_id', 'action'];
    $missing = validateRequired($input, $required);

    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 400);
    }

    $permissionId = filter_var($input['permission_id'], FILTER_VALIDATE_INT);
    $action = trim($input['action']);

    // SECURITY: Validuoti integer
    if ($permissionId === false || $permissionId < 1) {
        sendError('Invalid permission_id', 400);
    }

    // Validacija: action turi būti 'accept' arba 'reject'
    if (!in_array($action, ['accept', 'reject'])) {
        sendError('Invalid action. Must be "accept" or "reject"', 400);
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

        // SECURITY: Tik target_id gali priimti/atmesti prašymą
        if ((int)$permission['target_id'] !== (int)$currentUser['id']) {
            sendError('Access denied. Only the target user can respond to this request', 403);
        }

        // Validacija: prašymas turi būti 'pending'
        if ($permission['status'] !== 'pending') {
            sendError('Cannot respond to a request that is not pending', 400);
        }

        $pdo->beginTransaction();

        // Atnaujinti leidimo statusą
        $newStatus = ($action === 'accept') ? 'accepted' : 'rejected';
        $stmt = $pdo->prepare("
            UPDATE family_permissions
            SET status = ?, responded_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$newStatus, $permissionId]);

        // Sukurti audit log įrašą
        createAuditLog($pdo, $permissionId, $newStatus, $currentUser['id'], $permission['requester_id']);

        $pdo->commit();

        // TODO: Siųsti email notification requester vartotojui

        sendSuccess([
            'permission_id' => (int)$permissionId,
            'status' => $newStatus
        ], "Family permission request {$newStatus} successfully");

    } catch (PDOException $e) {
        $pdo->rollBack();

        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to respond to family permission request', 500);
    }
}

/**
 * DELETE - Panaikinti leidimą/prašymą
 *
 * Validacija:
 * - Tik requester arba target gali panaikinti
 *
 * Pakeičia status į 'canceled' (soft delete)
 * Sukuria audit log įrašą
 *
 * @param array $currentUser Autentifikuoto vartotojo duomenys
 * @return void
 */
function handleCancelPermission(array $currentUser): void
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

        // SECURITY: Tik requester arba target gali panaikinti
        if ((int)$permission['requester_id'] !== (int)$currentUser['id'] && (int)$permission['target_id'] !== (int)$currentUser['id']) {
            sendError('Access denied. Only requester or target can cancel this permission', 403);
        }

        // Negalima panaikinti jau atšaukto
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
        $targetUserId = ($permission['requester_id'] == $currentUser['id'])
            ? $permission['target_id']
            : $permission['requester_id'];

        createAuditLog($pdo, $permissionId, 'canceled', $currentUser['id'], $targetUserId);

        $pdo->commit();

        sendSuccess([
            'permission_id' => (int)$permissionId,
            'status' => 'canceled'
        ], 'Family permission canceled successfully');

    } catch (PDOException $e) {
        $pdo->rollBack();

        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to cancel family permission', 500);
    }
}

/**
 * Sukurti audit log įrašą
 *
 * @param PDO $pdo Database connection
 * @param int $permissionId Family permission ID
 * @param string $action Action type
 * @param int $performedBy User who performed the action
 * @param int|null $targetUserId Target user (optional)
 * @return void
 */
function createAuditLog(PDO $pdo, int $permissionId, string $action, int $performedBy, ?int $targetUserId = null): void
{
    $details = json_encode([
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ], JSON_UNESCAPED_UNICODE);

    $stmt = $pdo->prepare("
        INSERT INTO family_audit_log
        (family_permission_id, action, performed_by, target_user_id, details)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$permissionId, $action, $performedBy, $targetUserId, $details]);
}
