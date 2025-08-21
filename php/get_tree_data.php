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
        // Format photo data as base64 if it exists
        if (!empty($rootMember['photo_data'])) {
            $mimeType = 'image/jpeg'; // Default to JPEG
            if (strpos($rootMember['photo_data'], 'data:image/') === 0) {
                // If it's already a data URL, use it as is
                $rootMember['photo_data'] = $rootMember['photo_data'];
            } else {
                // Convert binary data to base64 data URL
                $rootMember['photo_data'] = 'data:' . $mimeType . ';base64,' . base64_encode($rootMember['photo_data']);
            }
        }
        
        // Create a node structure for this root member
        $node = [
            'id' => $rootMember['id'],
            'full_name' => $rootMember['full_name'],
            'photo_data' => $rootMember['photo_data'],
            'children' => []
        ];
        
        // Find all children of this root member
        $childrenQuery = 'SELECT * FROM family_members WHERE parent_id = ? ORDER BY full_name ASC';
        $childrenStmt = $db->prepare($childrenQuery);
        $childrenStmt->bindValue(1, $rootMember['id'], SQLITE3_INTEGER);
        $childrenResult = $childrenStmt->execute();
        
        // Process each child
        while ($child = $childrenResult->fetchArray(SQLITE3_ASSOC)) {
            // Format photo data as base64 if it exists
            if (!empty($child['photo_data'])) {
                $mimeType = 'image/jpeg'; // Default to JPEG
                if (strpos($child['photo_data'], 'data:image/') === 0) {
                    // If it's already a data URL, use it as is
                    $child['photo_data'] = $child['photo_data'];
                } else {
                    // Convert binary data to base64 data URL
                    $child['photo_data'] = 'data:' . $mimeType . ';base64,' . base64_encode($child['photo_data']);
                }
            }
            
            // Create a node structure for this child
            $childNode = [
                'id' => $child['id'],
                'full_name' => $child['full_name'],
                'photo_data' => $child['photo_data'],
                'children' => []
            ];
            
            // Recursively find grandchildren
            getDescendants($db, $child['id'], $childNode['children'], 1, 3);
            
            // Add the child node to the root member's children
            $node['children'][] = $childNode;
        }
        
        // Add the root member node to the tree data
        $treeData[] = $node;
    }
    
    // If there are no root members, get all members
    if (empty($treeData)) {
        $allQuery = 'SELECT * FROM family_members ORDER BY full_name ASC';
        $allResult = $db->query($allQuery);
        
        while ($member = $allResult->fetchArray(SQLITE3_ASSOC)) {
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
            
            // Create a node structure for this member
            $node = [
                'id' => $member['id'],
                'full_name' => $member['full_name'],
                'photo_data' => $member['photo_data'],
                'children' => []
            ];
            
            $treeData[] = $node;
        }
    }
    
    // Close database connection
    closeDbConnection($db);
    
    // Log the final tree data before encoding
    error_log('Final tree data before JSON encoding: ' . print_r(['children' => $treeData], true));
    
    // Return JSON response
    echo json_encode(['children' => $treeData]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

// Helper function to recursively get descendants
function getDescendants($db, $parentId, &$children, $currentLevel, $maxLevel) {
    if ($currentLevel >= $maxLevel) {
        return;
    }
    
    $query = 'SELECT * FROM family_members WHERE parent_id = ? ORDER BY full_name ASC';
    $stmt = $db->prepare($query);
    $stmt->bindValue(1, $parentId, SQLITE3_INTEGER);
    $result = $stmt->execute();
    
    while ($descendant = $result->fetchArray(SQLITE3_ASSOC)) {
        // Format photo data as base64 if it exists
        if (!empty($descendant['photo_data'])) {
            $mimeType = 'image/jpeg'; // Default to JPEG
            if (strpos($descendant['photo_data'], 'data:image/') === 0) {
                // If it's already a data URL, use it as is
                $descendant['photo_data'] = $descendant['photo_data'];
            } else {
                // Convert binary data to base64 data URL
                $descendant['photo_data'] = 'data:' . $mimeType . ';base64,' . base64_encode($descendant['photo_data']);
            }
        }
        
        // Create a node structure for this descendant
        $node = [
            'id' => $descendant['id'],
            'full_name' => $descendant['full_name'],
            'photo_data' => $descendant['photo_data'],
            'children' => []
        ];
        
        // Recursively get its children
        getDescendants($db, $descendant['id'], $node['children'], $currentLevel + 1, $maxLevel);
        
        // Add the descendant node to the children array
        $children[] = $node;
    }
}
?>