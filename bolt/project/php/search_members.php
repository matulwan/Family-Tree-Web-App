<?php
require_once 'db.php';

// Set content type to JSON
header('Content-Type: application/json');

// Get search term from query parameter
$term = isset($_GET['term']) ? sanitizeInput($_GET['term']) : '';

if (empty($term)) {
    echo json_encode([]);
    exit;
}

try {
    // Get database connection
    $db = getDbConnection();
    
    // Prepare and execute the SQL query with LIKE for searching
    $stmt = $db->prepare('
        SELECT * FROM family_members 
        WHERE full_name LIKE :term 
        OR state LIKE :term 
        OR occupation LIKE :term 
        OR status LIKE :term 
        OR gender LIKE :term
        ORDER BY full_name ASC
    ');
    
    $searchTerm = '%' . $term . '%';
    $stmt->bindValue(':term', $searchTerm, SQLITE3_TEXT);
    $result = $stmt->execute();
    
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