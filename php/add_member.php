<?php 
require_once 'db.php';

// Set content type to JSON
header('Content-Type: application/json');

// Initialize response array
$response = ['success' => false, 'message' => ''];

// Check if form was submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get database connection
        $db = getDbConnection();
        
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
        if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
            $uploadResult = uploadPhoto($_FILES['photo']);
            if ($uploadResult['success']) {
                $photoData = $uploadResult['data'];
            } else {
                throw new Exception($uploadResult['message']);
            }
        }
        
        // Determine parent_id based on relationship
        $parentId = null;
        if ($relationship === 'child' && $relatedTo) {
            // For child relationship, set the parent_id to the related member's ID
            $parentId = $relatedTo;
            
            // Verify that the parent exists
            $checkParentStmt = $db->prepare('SELECT id FROM family_members WHERE id = ?');
            $checkParentStmt->bindValue(1, $parentId, SQLITE3_INTEGER);
            $parentResult = $checkParentStmt->execute();
            
            if (!$parentResult->fetchArray()) {
                throw new Exception('Selected parent does not exist.');
            }
        } elseif ($relationship === 'self') {
            // For self, parent_id should be null
            $parentId = null;
        }
        
        // Prepare and execute the SQL statement
        $stmt = $db->prepare('
            INSERT INTO family_members (
                full_name, gender, state, occupation, status, 
                birth_date, photo_data, notes, relationship, related_to, parent_id
            ) VALUES (
                :full_name, :gender, :state, :occupation, :status, 
                :birth_date, :photo_data, :notes, :relationship, :related_to, :parent_id
            )
        ');
        
        $stmt->bindValue(':full_name', $fullName, SQLITE3_TEXT);
        $stmt->bindValue(':gender', $gender, SQLITE3_TEXT);
        $stmt->bindValue(':state', $state, SQLITE3_TEXT);
        $stmt->bindValue(':occupation', $occupation, SQLITE3_TEXT);
        $stmt->bindValue(':status', $status, SQLITE3_TEXT);
        $stmt->bindValue(':birth_date', $birthDate, SQLITE3_TEXT);
        $stmt->bindValue(':photo_data', $photoData, SQLITE3_BLOB);
        $stmt->bindValue(':notes', $notes, SQLITE3_TEXT);
        $stmt->bindValue(':relationship', $relationship, SQLITE3_TEXT);
        $stmt->bindValue(':related_to', $relatedTo, SQLITE3_INTEGER);
        $stmt->bindValue(':parent_id', $parentId, SQLITE3_INTEGER);
        
        $result = $stmt->execute();
        
        if ($result) {
            $memberId = $db->lastInsertRowID();
            
            // If there's a relationship other than child, add it to the relationships table
            if ($relationship && $relatedTo && $relationship !== 'child') {
                $relationshipType = $relationship;
                
                $relStmt = $db->prepare('
                    INSERT INTO relationships (
                        member1_id, member2_id, relationship_type
                    ) VALUES (
                        :member1_id, :member2_id, :relationship_type
                    )
                ');
                
                $relStmt->bindValue(':member1_id', $memberId, SQLITE3_INTEGER);
                $relStmt->bindValue(':member2_id', $relatedTo, SQLITE3_INTEGER);
                $relStmt->bindValue(':relationship_type', $relationshipType, SQLITE3_TEXT);
                
                $relStmt->execute();
            }
            
            $response['success'] = true;
            $response['message'] = 'Family member added successfully!';
            $response['id'] = $memberId;
        } else {
            throw new Exception('Error adding family member to database.');
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