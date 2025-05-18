<?php
require_once 'db.php';

// Set content type to JSON
header('Content-Type: application/json');

try {
    // Get database connection
    $db = getDbConnection();
    
    // Prepare and execute the SQL query
    $query = 'SELECT * FROM family_members ORDER BY full_name ASC';
    $result = $db->query($query);
    
    // Fetch all rows
    $members = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $members[] = $row;
    }
    
    // Close database connection
    closeDbConnection($db);
    
    // Return JSON response
    echo json_encode($members);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>