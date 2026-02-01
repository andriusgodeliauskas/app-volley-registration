<?php
/**
 * Volley Registration App - Family Members API
 *
 * Grąžina sąrašą šeimos narių, už kuriuos dabartinis vartotojas gali registruotis į renginius.
 * Naudojama dropdown'ui EventDetails puslapyje.
 *
 * Endpoints:
 * - GET: Gauti šeimos narius, už kuriuos vartotojas gali mokėti
 *
 * @package Volley\API
 * @author Coding Agent
 * @version 1.0
 */

require_once __DIR__ . '/auth.php';

// Reikalauti autentifikacijos
$currentUser = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetFamilyMembers($currentUser);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * GET - Gauti šeimos narius, už kuriuos dabartinis vartotojas gali registruotis
 *
 * Grąžina sąrašą vartotojų, su kuriais yra aktyvus 'accepted' leidimas.
 * Tai apima:
 * - Vartotojus, kuriems dabartinis vartotojas prašė leidimo (requester_id = current_user)
 * - Vartotojus, kurie prašė leidimo dabartiniam vartotojui (target_id = current_user)
 *
 * Response format:
 * {
 *   "success": true,
 *   "members": [
 *     {"id": 123, "name": "Jonas Jonaitis", "email": "jonas@test.com"}
 *   ]
 * }
 *
 * @param array $currentUser Autentifikuoto vartotojo duomenys
 * @return void
 */
function handleGetFamilyMembers(array $currentUser): void
{
    $pdo = getDbConnection();
    $userId = $currentUser['id'];

    try {
        // Gauti šeimos narius, kuriuos dabartinis vartotojas GALI registruoti
        // ONE-WAY: tik kur dabartinis vartotojas yra requester (išsiuntė prašymą ir buvo patvirtintas)
        $stmt = $pdo->prepare("
            SELECT
                u_target.id,
                u_target.name,
                u_target.email,
                u_target.balance
            FROM family_permissions fp
            JOIN users u_target ON fp.target_id = u_target.id
            WHERE fp.requester_id = ?
            AND fp.status = 'accepted'
            AND fp.can_pay = 1
            AND u_target.is_active = 1
            ORDER BY u_target.name ASC
        ");
        $stmt->execute([$userId]);
        $members = $stmt->fetchAll();

        // Formatuoti duomenis
        $formattedMembers = [];
        foreach ($members as $member) {
            $formattedMembers[] = [
                'id' => (int)$member['id'],
                'name' => $member['name'],
                'email' => $member['email'],
                'balance' => (float)$member['balance']
            ];
        }

        sendSuccess([
            'members' => $formattedMembers
        ]);

    } catch (PDOException $e) {
        if (APP_ENV === 'development') {
            sendError('Database error: ' . $e->getMessage(), 500);
        }
        sendError('Failed to fetch family members', 500);
    }
}
