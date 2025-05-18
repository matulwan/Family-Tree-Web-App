<?php
require_once 'db.php';

// Set content type to JSON
header('Content-Type: application/json');

try {
    // Get database connection
    $db = getDbConnection();
    
    // First, find members with no parent (root nodes)
    $rootQuery = 'SELECT * FROM family_members WHERE parent_id IS NULL ORDER BY full_name ASC';
    $rootResult = $db->query($rootQuery);
    
    $treeData = [];
    
    // Process each root member
    while ($rootMember = $rootResult->fetchArray(SQLITE3_ASSOC)) {
        // Add the root member to the tree data
        $treeData[] = $rootMember;
        
        // Find all children of this root member
        $childrenQuery = 'SELECT * FROM family_members WHERE parent_id = ? ORDER BY full_name ASC';
        $childrenStmt = $db->prepare($childrenQuery);
        $childrenStmt->bindValue(1, $rootMember['id'], SQLITE3_INTEGER);
        $childrenResult = $childrenStmt->execute();
        
        // Process each child
        while ($child = $childrenResult->fetchArray(SQLITE3_ASSOC)) {
            $treeData[] = $child;
            
            // Recursively find grandchildren (limit to 3 levels to prevent infinite loops)
            getDescendants($db, $child['id'], $treeData, 1, 3);
        }
    }
    
    // If there are no root members, get all members
    if (empty($treeData)) {
        $allQuery = 'SELECT * FROM family_members ORDER BY full_name ASC';
        $allResult = $db->query($allQuery);
        
        while ($member = $allResult->fetchArray(SQLITE3_ASSOC)) {
            $treeData[] = $member;
        }
    }
    
    // Close database connection
    closeDbConnection($db);
    
    // Return JSON response
    echo json_encode($treeData);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

// Helper function to recursively get descendants
function getDescendants($db, $parentId, &$treeData, $currentLevel, $maxLevel) {
    if ($currentLevel >= $maxLevel) {
        return;
    }
    
    $query = 'SELECT * FROM family_members WHERE parent_id = ? ORDER BY full_name ASC';
    $stmt = $db->prepare($query);
    $stmt->bindValue(1, $parentId, SQLITE3_INTEGER);
    $result = $stmt->execute();
    
    while ($descendant = $result->fetchArray(SQLITE3_ASSOC)) {
        $treeData[] = $descendant;
        getDescendants($db, $descendant['id'], $treeData, $currentLevel + 1, $maxLevel);
    }
}
?>