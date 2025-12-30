<?php
/**
 * ============================================
 * VOLLEY APP - Backend API
 * ============================================
 * Šis failas tvarko visus backend užklausas:
 * - Google Login autentifikacija
 * - Renginių duomenų gavimas
 * - Registracija/atsiregistravimas
 * - Atsijungimas
 * ============================================
 */

// Pradedame sesiją
session_start();

// ============================================
// DUOMENŲ BAZĖS KONFIGŪRACIJA
// ============================================
// ⚠️ SVARBU: Įveskite savo MySQL duomenų bazės prisijungimo duomenis čia:
// ============================================
define('DB_HOST', 'localhost');           // Jūsų MySQL serverio adresas (paprastai 'localhost')
define('DB_NAME', 'volley_app');          // Jūsų duomenų bazės pavadinimas
define('DB_USER', 'your_db_username');    // Jūsų MySQL vartotojo vardas
define('DB_PASS', 'your_db_password');    // Jūsų MySQL slaptažodis
define('DB_CHARSET', 'utf8mb4');

// ============================================
// ADMIN KONFIGŪRACIJA
// ============================================
// Čia galite nurodyti Google ID, kurie turės admin teises
// Pavyzdys: define('ADMIN_GOOGLE_IDS', ['123456789', '987654321']);
// ============================================
define('ADMIN_GOOGLE_IDS', []); // Kol kas tuščias, pridėkite Google ID vėliau

// ============================================
// DUOMENŲ BAZĖS PRISIJUNGIMAS
// ============================================
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Nepavyko prisijungti prie duomenų bazės: ' . $e->getMessage()
    ]);
    exit;
}

// ============================================
// CORS HEADERS (jei reikia)
// ============================================
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ============================================
// HELPER FUNKCIJOS
// ============================================

/**
 * Patikrina Google ID Token
 * @param string $idToken - Google ID token
 * @return array|false - Vartotojo duomenys arba false
 */
function verifyGoogleToken($idToken) {
    $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        return false;
    }
    
    $data = json_decode($response, true);
    
    // Patikrinkite, ar token'as galiojantis
    if (!isset($data['sub']) || !isset($data['email'])) {
        return false;
    }
    
    return [
        'google_id' => $data['sub'],
        'email' => $data['email'],
        'full_name' => $data['name'] ?? $data['email'],
    ];
}

/**
 * Patikrina, ar vartotojas prisijungęs
 * @return bool
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Grąžina JSON atsakymą
 * @param array $data
 * @param int $statusCode
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================
// API ENDPOINT ROUTING
// ============================================

$action = $_GET['action'] ?? '';

switch ($action) {
    
    // ========================================
    // GET EVENT DATA
    // ========================================
    // Grąžina artimiausią aktyvų renginį ir jo dalyvius
    // ========================================
    case 'get_event_data':
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            jsonResponse(['success' => false, 'error' => 'Neteisingas užklausos metodas'], 405);
        }
        
        try {
            // Randame artimiausią aktyvų renginį (ateityje arba šiandien)
            $stmt = $pdo->prepare("
                SELECT id, event_date, max_players, is_active 
                FROM events 
                WHERE is_active = 1 AND event_date >= CURDATE()
                ORDER BY event_date ASC 
                LIMIT 1
            ");
            $stmt->execute();
            $event = $stmt->fetch();
            
            if (!$event) {
                jsonResponse([
                    'success' => true,
                    'event' => null,
                    'players' => [],
                    'current_user_registered' => false
                ]);
            }
            
            // Gauname visus užsiregistravusius žaidėjus
            $stmt = $pdo->prepare("
                SELECT u.id, u.full_name, r.registered_at 
                FROM registrations r
                JOIN users u ON r.user_id = u.id
                WHERE r.event_id = :event_id
                ORDER BY r.registered_at ASC
            ");
            $stmt->execute(['event_id' => $event['id']]);
            $players = $stmt->fetchAll();
            
            // Patikriname, ar dabartinis vartotojas užsiregistravęs
            $currentUserRegistered = false;
            if (isLoggedIn()) {
                foreach ($players as $player) {
                    if ($player['id'] == $_SESSION['user_id']) {
                        $currentUserRegistered = true;
                        break;
                    }
                }
            }
            
            jsonResponse([
                'success' => true,
                'event' => $event,
                'players' => $players,
                'current_user_registered' => $currentUserRegistered,
                'logged_in' => isLoggedIn(),
                'user_name' => $_SESSION['full_name'] ?? null
            ]);
            
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'error' => 'Klaida gaunant duomenis: ' . $e->getMessage()], 500);
        }
        break;
    
    // ========================================
    // GOOGLE LOGIN
    // ========================================
    // Priima Google ID token ir autentifikuoja vartotoją
    // ========================================
    case 'google_login':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'error' => 'Neteisingas užklausos metodas'], 405);
        }
        
        // Gauname JSON duomenis
        $input = json_decode(file_get_contents('php://input'), true);
        $idToken = $input['id_token'] ?? '';
        
        if (empty($idToken)) {
            jsonResponse(['success' => false, 'error' => 'Trūksta ID token'], 400);
        }
        
        // Patikriname Google token'ą
        $userData = verifyGoogleToken($idToken);
        
        if (!$userData) {
            jsonResponse(['success' => false, 'error' => 'Neteisingas Google token'], 401);
        }
        
        try {
            // Patikriname, ar vartotojas jau egzistuoja
            $stmt = $pdo->prepare("SELECT id, full_name, email, is_admin FROM users WHERE google_id = :google_id");
            $stmt->execute(['google_id' => $userData['google_id']]);
            $user = $stmt->fetch();
            
            if ($user) {
                // Atnaujinkime vartotojo duomenis
                $stmt = $pdo->prepare("
                    UPDATE users 
                    SET full_name = :full_name, email = :email, updated_at = CURRENT_TIMESTAMP 
                    WHERE google_id = :google_id
                ");
                $stmt->execute([
                    'full_name' => $userData['full_name'],
                    'email' => $userData['email'],
                    'google_id' => $userData['google_id']
                ]);
                $userId = $user['id'];
                $isAdmin = $user['is_admin'];
            } else {
                // Sukuriame naują vartotoją
                $isAdmin = in_array($userData['google_id'], ADMIN_GOOGLE_IDS);
                
                $stmt = $pdo->prepare("
                    INSERT INTO users (google_id, full_name, email, is_admin) 
                    VALUES (:google_id, :full_name, :email, :is_admin)
                ");
                $stmt->execute([
                    'google_id' => $userData['google_id'],
                    'full_name' => $userData['full_name'],
                    'email' => $userData['email'],
                    'is_admin' => $isAdmin ? 1 : 0
                ]);
                $userId = $pdo->lastInsertId();
            }
            
            // Sukuriame sesiją
            $_SESSION['user_id'] = $userId;
            $_SESSION['google_id'] = $userData['google_id'];
            $_SESSION['full_name'] = $userData['full_name'];
            $_SESSION['email'] = $userData['email'];
            $_SESSION['is_admin'] = $isAdmin;
            
            jsonResponse([
                'success' => true,
                'user' => [
                    'id' => $userId,
                    'full_name' => $userData['full_name'],
                    'email' => $userData['email'],
                    'is_admin' => $isAdmin
                ]
            ]);
            
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'error' => 'Klaida kuriant vartotoją: ' . $e->getMessage()], 500);
        }
        break;
    
    // ========================================
    // REGISTER
    // ========================================
    // Užregistruoja vartotoją į renginį
    // ========================================
    case 'register':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'error' => 'Neteisingas užklausos metodas'], 405);
        }
        
        if (!isLoggedIn()) {
            jsonResponse(['success' => false, 'error' => 'Turite būti prisijungę'], 401);
        }
        
        try {
            // Randame artimiausią aktyvų renginį
            $stmt = $pdo->prepare("
                SELECT id FROM events 
                WHERE is_active = 1 AND event_date >= CURDATE()
                ORDER BY event_date ASC 
                LIMIT 1
            ");
            $stmt->execute();
            $event = $stmt->fetch();
            
            if (!$event) {
                jsonResponse(['success' => false, 'error' => 'Nerasta aktyvių renginių'], 404);
            }
            
            // Patikriname, ar vartotojas jau užsiregistravęs
            $stmt = $pdo->prepare("
                SELECT id FROM registrations 
                WHERE event_id = :event_id AND user_id = :user_id
            ");
            $stmt->execute([
                'event_id' => $event['id'],
                'user_id' => $_SESSION['user_id']
            ]);
            
            if ($stmt->fetch()) {
                jsonResponse(['success' => false, 'error' => 'Jūs jau užsiregistravote'], 400);
            }
            
            // Registruojame vartotoją
            $stmt = $pdo->prepare("
                INSERT INTO registrations (event_id, user_id) 
                VALUES (:event_id, :user_id)
            ");
            $stmt->execute([
                'event_id' => $event['id'],
                'user_id' => $_SESSION['user_id']
            ]);
            
            jsonResponse([
                'success' => true,
                'message' => 'Sėkmingai užsiregistravote!'
            ]);
            
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'error' => 'Klaida registruojantis: ' . $e->getMessage()], 500);
        }
        break;
    
    // ========================================
    // UNREGISTER
    // ========================================
    // Atšaukia vartotojo registraciją
    // ========================================
    case 'unregister':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'error' => 'Neteisingas užklausos metodas'], 405);
        }
        
        if (!isLoggedIn()) {
            jsonResponse(['success' => false, 'error' => 'Turite būti prisijungę'], 401);
        }
        
        try {
            // Randame artimiausią aktyvų renginį
            $stmt = $pdo->prepare("
                SELECT id FROM events 
                WHERE is_active = 1 AND event_date >= CURDATE()
                ORDER BY event_date ASC 
                LIMIT 1
            ");
            $stmt->execute();
            $event = $stmt->fetch();
            
            if (!$event) {
                jsonResponse(['success' => false, 'error' => 'Nerasta aktyvių renginių'], 404);
            }
            
            // Pašaliname registraciją
            $stmt = $pdo->prepare("
                DELETE FROM registrations 
                WHERE event_id = :event_id AND user_id = :user_id
            ");
            $stmt->execute([
                'event_id' => $event['id'],
                'user_id' => $_SESSION['user_id']
            ]);
            
            if ($stmt->rowCount() === 0) {
                jsonResponse(['success' => false, 'error' => 'Jūs nebuvote užsiregistravę'], 400);
            }
            
            jsonResponse([
                'success' => true,
                'message' => 'Registracija atšaukta'
            ]);
            
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'error' => 'Klaida atšaukiant registraciją: ' . $e->getMessage()], 500);
        }
        break;
    
    // ========================================
    // LOGOUT
    // ========================================
    // Atsijungia vartotoją
    // ========================================
    case 'logout':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'error' => 'Neteisingas užklausos metodas'], 405);
        }
        
        // Sunaikiname sesiją
        session_unset();
        session_destroy();
        
        jsonResponse([
            'success' => true,
            'message' => 'Sėkmingai atsijungėte'
        ]);
        break;
    
    // ========================================
    // DEFAULT - Nežinomas action
    // ========================================
    default:
        jsonResponse(['success' => false, 'error' => 'Nežinomas veiksmas'], 400);
        break;
}
