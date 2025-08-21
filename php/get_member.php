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
    $stmt = $db->prepare('SELECT id, full_name, gender, state, occupation, status, birth_date, photo_data, notes, relationship, related_to, parent_id FROM family_members WHERE id = :id');
    $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
    $result = $stmt->execute();
    
    // Fetch the member data
    $member = $result->fetchArray(SQLITE3_ASSOC);
    
    if ($member) {
        // Format photo data as base64 if it exists
        if (!empty($member['photo_data'])) {
            $mimeType = 'image/jpeg'; // Default to JPEG
            if (strpos($member['photo_data'], 'data:image/') === 0) {
                // If it's already a data URL, use it as is
                $member['photo_data'] = $member['photo_data'];
            } else {
                // Convert binary data to base64 data URL
                $member['photo_data'] = 'data:' . $mimeType . ';base64,' . base64_encode($member['photo_data']);
            }
        }
        
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