<?php
/**
 * Volley Registration App - Database Connection & CORS Handler
 * 
 * This file handles:
 * 1. CORS headers for cross-origin requests
 * 2. PDO database connection
 * 3. Common response helper functions
 */

require_once __DIR__ . '/config.php';

// =====================================================
// CORS HEADERS
// =====================================================

/**
 * Handle CORS headers for API requests
 */
function handleCors(): void
{
    // Get the origin of the request
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    // Check if origin is in allowed list
    if (in_array($origin, ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
    } elseif (APP_ENV === 'development') {
        // In development, be more permissive
        header("Access-Control-Allow-Origin: *");
    }
    
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 86400"); // Cache preflight for 24 hours
    
    // Handle preflight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Apply CORS headers immediately
handleCors();

// Set JSON content type for all API responses
header("Content-Type: application/json; charset=UTF-8");

// =====================================================
// DATABASE CONNECTION
// =====================================================

/**
 * Get PDO database connection (singleton pattern)
 * 
 * @return PDO
 * @throws PDOException
 */
function getDbConnection(): PDO
{
    static $pdo = null;
    
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
        ];
        
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Don't expose connection details in production
            if (APP_ENV === 'development') {
                sendError('Database connection failed: ' . $e->getMessage(), 500);
            } else {
                sendError('Database connection failed', 500);
            }
        }
    }
    
    return $pdo;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get JSON input from request body
 * 
 * @return array
 */
function getJsonInput(): array
{
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        return [];
    }
    
    return $data ?? [];
}

/**
 * Send a success JSON response
 * 
 * @param mixed $data Data to include in response
 * @param string|null $message Optional message
 * @param int $statusCode HTTP status code
 */
function sendSuccess($data = null, ?string $message = null, int $statusCode = 200): void
{
    http_response_code($statusCode);
    
    $response = ['success' => true];
    
    if ($message !== null) {
        $response['message'] = $message;
    }
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Send an error JSON response
 * 
 * @param string $message Error message
 * @param int $statusCode HTTP status code
 * @param array|null $errors Additional error details
 */
function sendError(string $message, int $statusCode = 400, ?array $errors = null): void
{
    http_response_code($statusCode);
    
    $response = [
        'success' => false,
        'message' => $message
    ];
    
    if ($errors !== null) {
        $response['errors'] = $errors;
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Validate required fields in input data
 * 
 * @param array $data Input data
 * @param array $requiredFields List of required field names
 * @return array Missing fields
 */
function validateRequired(array $data, array $requiredFields): array
{
    $missing = [];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            $missing[] = $field;
        }
    }
    
    return $missing;
}

/**
 * Generate a secure random token
 * 
 * @param int $length Token length in bytes (will be doubled in hex)
 * @return string
 */
function generateToken(int $length = 32): string
{
    return bin2hex(random_bytes($length));
}

/**
 * Validate email format
 * 
 * @param string $email
 * @return bool
 */
function isValidEmail(string $email): bool
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Require POST method for an endpoint
 */
function requirePost(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed. Use POST.', 405);
    }
}

/**
 * Require GET method for an endpoint
 */
function requireGet(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        sendError('Method not allowed. Use GET.', 405);
    }
}
