<?php
// Database configuration
$dbPath = __DIR__ . '/../database/family_tree.db';
$dbDir = dirname($dbPath);

// Create database directory if it doesn't exist
if (!file_exists($dbDir)) {
    mkdir($dbDir, 0777, true);
}
// Initialize database connection
function getDbConnection() {
    global $dbPath;
    
    try {
        // Create a new SQLite database connection
        $db = new SQLite3($dbPath);
        $db->exec('PRAGMA foreign_keys = ON');
        
        // Create tables if they don't exist
        createTables($db);
        
        return $db;
    } catch (Exception $e) {
        die('Database connection failed: ' . $e->getMessage());
    }
}

// Create necessary tables if they don't exist
function createTables($db) {
    // Family members table
    $db->exec('
        CREATE TABLE IF NOT EXISTS family_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            gender TEXT,
            state TEXT,
            occupation TEXT,
            status TEXT,
            birth_date TEXT,
            photo_data BLOB,
            notes TEXT,
            relationship TEXT,
            related_to INTEGER,
            parent_id INTEGER,
            FOREIGN KEY (parent_id) REFERENCES family_members(id) ON DELETE SET NULL
        )
    ');
    
    // Relationships table for more complex family connections
    $db->exec('
        CREATE TABLE IF NOT EXISTS relationships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member1_id INTEGER NOT NULL,
            member2_id INTEGER NOT NULL,
            relationship_type TEXT NOT NULL,
            FOREIGN KEY (member1_id) REFERENCES family_members(id) ON DELETE CASCADE,
            FOREIGN KEY (member2_id) REFERENCES family_members(id) ON DELETE CASCADE
        )
    ');
}

// Close database connection
function closeDbConnection($db) {
    if ($db) {
        $db->close();
    }
}

// Function to sanitize input data
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Function to upload photo
function uploadPhoto($file) {
    // Check if image file is a actual image or fake image
    $check = getimagesize($file['tmp_name']);
    if ($check === false) {
        return ['success' => false, 'message' => 'File is not an image.'];
    }
    
    // Check file size
    if ($file['size'] > 5000000) { // 5MB
        return ['success' => false, 'message' => 'File is too large.'];
    }
    
    // Get file extension
    $imageFileType = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    
    // Allow certain file formats
    if ($imageFileType !== 'jpg' && $imageFileType !== 'png' && $imageFileType !== 'jpeg' && $imageFileType !== 'gif') {
        return ['success' => false, 'message' => 'Only JPG, JPEG, PNG & GIF files are allowed.'];
    }
    
    // Read the file content
    $imageData = file_get_contents($file['tmp_name']);
    if ($imageData === false) {
        return ['success' => false, 'message' => 'Error reading file.'];
    }
    
    return [
        'success' => true, 
        'data' => $imageData,
        'type' => $file['type']
    ];
}
?>