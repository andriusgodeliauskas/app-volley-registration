<?php
/**
 * Debug script for Volley App - Upload to server and access via browser
 * DELETE THIS FILE AFTER DEBUGGING!
 */

require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

// Test database connection
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    $dbConnected = true;
    $dbError = null;
} catch (PDOException $e) {
    $dbConnected = false;
    $dbError = $e->getMessage();
}

// Check tables
$tables = [];
if ($dbConnected) {
    try {
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (PDOException $e) {
        $tables = ['error' => $e->getMessage()];
    }
}

// Check users
$users = [];
if ($dbConnected && in_array('users', $tables)) {
    try {
        $stmt = $pdo->query("SELECT id, name, email, role, is_active, LEFT(password_hash, 20) as hash_preview FROM users LIMIT 10");
        $users = $stmt->fetchAll();
    } catch (PDOException $e) {
        $users = ['error' => $e->getMessage()];
    }
}

// Test password verification for admin
$passwordTest = null;
if ($dbConnected && in_array('users', $tables)) {
    try {
        $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE email = ?");
        $stmt->execute(['admin@volleyapp.com']);
        $adminRow = $stmt->fetch();
        
        if ($adminRow) {
            $testPassword = 'admin123';
            $hash = $adminRow['password_hash'];
            $verified = password_verify($testPassword, $hash);
            
            $passwordTest = [
                'admin_exists' => true,
                'hash_length' => strlen($hash),
                'hash_prefix' => substr($hash, 0, 7),
                'password_verified' => $verified,
                'test_password' => $testPassword
            ];
        } else {
            $passwordTest = ['admin_exists' => false];
        }
    } catch (PDOException $e) {
        $passwordTest = ['error' => $e->getMessage()];
    }
}

// Generate a correct hash for admin123
$correctHash = password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]);

echo json_encode([
    'status' => 'debug',
    'php_version' => PHP_VERSION,
    'database' => [
        'connected' => $dbConnected,
        'error' => $dbError,
        'tables' => $tables
    ],
    'users' => $users,
    'password_test' => $passwordTest,
    'new_correct_hash' => $correctHash,
    'fix_sql' => "UPDATE users SET password_hash = '" . $correctHash . "' WHERE email = 'admin@volleyapp.com';"
], JSON_PRETTY_PRINT);
