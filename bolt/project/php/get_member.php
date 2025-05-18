<?php
require_once 'db.php';

// Set content type to JSON
header('Content-Type: application/json');

// Get member ID from query parameter
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    echo json_encode(['error' => 'Invalid member ID.']);
    exit;
}

try {
    // Get database connection
    $db = getDbConnection();
    
    // Prepare and execute the SQL query
    $stmt = $db->prepare('SELECT * FROM family_members WHERE id = :id');
    $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
    $result = $stmt->execute();
    
    // Fetch the member data
    $member = $result->fetchArray(SQLITE3_ASSOC);
    
    if ($member) {
        // Close database connection
        closeDbConnection($db);
        
        // Return JSON response
        echo json_encode($member);
    } else {
        echo json_encode(['error' => 'Member not found.']);
    }
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>