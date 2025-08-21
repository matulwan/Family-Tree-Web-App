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
        // Format photo data as base64 if it exists
        if (!empty($row['photo_data'])) {
            $mimeType = 'image/jpeg'; // Default to JPEG
            if (strpos($row['photo_data'], 'data:image/') === 0) {
                // If it's already a data URL, use it as is
                $row['photo_data'] = $row['photo_data'];
            } else {
                // Convert binary data to base64 data URL
                $row['photo_data'] = 'data:' . $mimeType . ';base64,' . base64_encode($row['photo_data']);
            }
        }
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