<?php 
require_once 'db.php';

// Set content type to JSON
header('Content-Type: application/json');

// Initialize response array
$response = ['success' => false, 'message' => ''];

// Check if form was submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get and validate member ID
        $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
        if ($id <= 0) {
            throw new Exception('Invalid member ID.');
        }
        
        // Get database connection
        $db = getDbConnection();
        
        // Check if member exists
        $checkStmt = $db->prepare('SELECT id FROM family_members WHERE id = :id');
        $checkStmt->bindValue(':id', $id, SQLITE3_INTEGER);
        $checkResult = $checkStmt->execute();
        
        if (!$checkResult->fetchArray()) {
            throw new Exception('Member not found.');
        }
        
        // Get and sanitize form data
        $fullName = sanitizeInput($_POST['fullName']);
        $gender = isset($_POST['gender']) ? sanitizeInput($_POST['gender']) : null;
        $state = isset($_POST['state']) ? sanitizeInput($_POST['state']) : null;
        $occupation = isset($_POST['occupation']) ? sanitizeInput($_POST['occupation']) : null;
        $status = isset($_POST['status']) ? sanitizeInput($_POST['status']) : null;
        $birthDate = isset($_POST['birthDate']) ? sanitizeInput($_POST['birthDate']) : null;
        $notes = isset($_POST['notes']) ? sanitizeInput($_POST['notes']) : null;
        $relationship = isset($_POST['relationship']) ? sanitizeInput($_POST['relationship']) : null;
        $relatedTo = isset($_POST['relatedTo']) && !empty($_POST['relatedTo']) ? (int)$_POST['relatedTo'] : null;
        
        // Handle photo upload if provided
        $photoData = null;
        $updatePhoto = false;
        
        if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
            $uploadResult = uploadPhoto($_FILES['photo']);
            if ($uploadResult['success']) {
                $photoData = $uploadResult['data'];
                $updatePhoto = true;
            } else {
                throw new Exception($uploadResult['message']);
            }
        }
        
        // Determine parent_id based on relationship
        $parentId = null;
        if ($relationship && $relatedTo) {
            if ($relationship === 'child') {
                $parentId = $relatedTo;
            }
        }
        
        // Start building the SQL statement
        $sql = 'UPDATE family_members SET 
                full_name = :full_name, 
                gender = :gender, 
                state = :state, 
                occupation = :occupation, 
                status = :status, 
                birth_date = :birth_date, 
                notes = :notes, 
                relationship = :relationship, 
                related_to = :related_to, 
                parent_id = :parent_id';
        
        // Only update photo if a new one was uploaded
        if ($updatePhoto) {
            $sql .= ', photo_data = :photo_data';
        }
        
        $sql .= ' WHERE id = :id';
        
        // Prepare and execute the SQL statement
        $stmt = $db->prepare($sql);
        
        $stmt->bindValue(':full_name', $fullName, SQLITE3_TEXT);
        $stmt->bindValue(':gender', $gender, SQLITE3_TEXT);
        $stmt->bindValue(':state', $state, SQLITE3_TEXT);
        $stmt->bindValue(':occupation', $occupation, SQLITE3_TEXT);
        $stmt->bindValue(':status', $status, SQLITE3_TEXT);
        $stmt->bindValue(':birth_date', $birthDate, SQLITE3_TEXT);
        $stmt->bindValue(':notes', $notes, SQLITE3_TEXT);
        $stmt->bindValue(':relationship', $relationship, SQLITE3_TEXT);
        $stmt->bindValue(':related_to', $relatedTo, SQLITE3_INTEGER);
        $stmt->bindValue(':parent_id', $parentId, SQLITE3_INTEGER);
        $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
        
        if ($updatePhoto) {
            $stmt->bindValue(':photo_data', $photoData, SQLITE3_BLOB);
        }
        
        $result = $stmt->execute();
        
        if ($result) {
            // Update relationships if necessary
            if ($relationship && $relatedTo && $relationship !== 'child') {
                // First delete existing relationships
                $delStmt = $db->prepare('DELETE FROM relationships WHERE member1_id = :id');
                $delStmt->bindValue(':id', $id, SQLITE3_INTEGER);
                $delStmt->execute();
                
                // Then add the new relationship
                $relationshipType = $relationship;
                
                $relStmt = $db->prepare('
                    INSERT INTO relationships (
                        member1_id, member2_id, relationship_type
                    ) VALUES (
                        :member1_id, :member2_id, :relationship_type
                    )
                ');
                
                $relStmt->bindValue(':member1_id', $id, SQLITE3_INTEGER);
                $relStmt->bindValue(':member2_id', $relatedTo, SQLITE3_INTEGER);
                $relStmt->bindValue(':relationship_type', $relationshipType, SQLITE3_TEXT);
                
                $relStmt->execute();
            }
            
            $response['success'] = true;
            $response['message'] = 'Family member updated successfully!';
        } else {
            throw new Exception('Error updating family member.');
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