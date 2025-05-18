<?php
require_once 'db.php';

// Set content type to JSON
header('Content-Type: application/json');

// Initialize response array
$response = ['success' => false, 'message' => ''];

// Check if POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get member ID from POST data
        $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
        
        if ($id <= 0) {
            throw new Exception('Invalid member ID.');
        }
        
        // Get database connection
        $db = getDbConnection();
        
        // First, check if the member has a photo to delete
        $photoStmt = $db->prepare('SELECT photo_path FROM family_members WHERE id = :id');
        $photoStmt->bindValue(':id', $id, SQLITE3_INTEGER);
        $photoResult = $photoStmt->execute();
        $photoRow = $photoResult->fetchArray(SQLITE3_ASSOC);
        
        // Delete the member from the database
        $stmt = $db->prepare('DELETE FROM family_members WHERE id = :id');
        $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        
        if ($result) {
            // Also delete any relationships
            $relStmt = $db->prepare('DELETE FROM relationships WHERE member1_id = :id OR member2_id = :id');
            $relStmt->bindValue(':id', $id, SQLITE3_INTEGER);
            $relStmt->execute();
            
            // If there's a photo, try to delete the file
            if ($photoRow && !empty($photoRow['photo_path'])) {
                $filePath = __DIR__ . '/../' . $photoRow['photo_path'];
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            }
            
            $response['success'] = true;
            $response['message'] = 'Family member deleted successfully!';
        } else {
            throw new Exception('Error deleting family member.');
        }
        
        // Close database connection
        closeDbConnection($db);
        
    } catch (Exception $e) {
        $response['message'] = $e->getMessage();
    }
} else {
    $response['message'] = 'Invalid request method.';
}

// Return JSON response
echo json_encode($response);
?>