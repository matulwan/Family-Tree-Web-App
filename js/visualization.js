$(document).ready(function() {
    // Mobile menu toggle
    $('.mobile-menu').click(function() {
        $('.nav-links').toggleClass('active');
    });

    // Initialize variables
    let familyData = [];
    let currentLayout = 'horizontal';
    let currentScale = 1;
    const layouts = {
        horizontal: drawHorizontalLayout
    };

    // SVG dimensions
    let width = $('#familyTreeContainer').width();
    let height = 800; // Increased height for better visibility

    // Create SVG container
    const svg = d3.select('#familyTreeContainer')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Add a circular clipPath definition for member photos
    svg.append('defs')
        .append('clipPath')
        .attr('id', 'circleClip')
        .append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 25);

    // Create a group for the tree
    const g = svg.append('g')
        .attr('transform', `translate(${width / 2}, 100)`); // Center horizontally, 100px from top

    // Load family data
    loadFamilyData();

    // Function to load family data
    function loadFamilyData() {
        console.log('Attempting to load family data...');
        $.ajax({
            url: 'php/get_tree_data.php?t=' + new Date().getTime(), // Use the correct endpoint and prevent caching
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log('Family data loaded successfully:', data);
                if (!data || (Array.isArray(data) && data.length === 0) || (data.children && data.children.length === 0)) {
                    $('#familyTreeContainer').html('<div style="background:#F5F5F0;padding:2rem;text-align:center;border-radius:8px;color:#30382F;"><b>No family tree data found.</b><br>Add yourself as <b>Self</b> and then add children to see the tree.</div>');
                    return;
                }
                renderFamilyTree(data);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Failed to load family tree data:', textStatus, errorThrown, jqXHR);
                $('#familyTreeContainer').html('<div style="background:#F44336;padding:2rem;text-align:center;border-radius:8px;color:white;"><b>Failed to load family tree data.</b><br>Please try again later or check your connection. Error: ' + textStatus + '</div>');
            }
        });
    }

    function showErrorMessage(message) {
        $('.loading-tree').html(`
            <p>${message}</p>
            <a href="form.html" class="btn-primary">Add Family Members</a>
        `);
    }

    function showNoDataMessage() {
        $('.loading-tree').show();
    }

    // Function to redraw the tree
    function redrawTree() {
        g.selectAll('*').remove();
        
        if (familyData.length === 0) {
            showNoDataMessage();
            return;
        }
        
        try {
            layouts[currentLayout]();
        } catch (error) {
            console.error('Error drawing tree:', error);
            showErrorMessage('Error drawing family tree. Please try a different layout.');
        }
    }

    // Horizontal tree layout function
    function drawHorizontalLayout() {
        // Use d3.hierarchy for nested data
        const root = d3.hierarchy(familyData[0]); // Assuming the first element is the root or create a dummy root if multiple top-level members

        const treeLayout = d3.tree()
            .size([height - 200, width - 200]); // Adjusted size for better spacing
        treeLayout(root);
        
        // Center the tree vertically
        const yOffset = (height - 200) / 2;
        g.attr('transform', `translate(100, ${yOffset})`);
        
        // Draw links
        g.selectAll('.link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'connector parent-child')
            .attr('d', d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x)
            );
        
        // Draw nodes
        const nodes = g.selectAll('.node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'tree-node')
            .attr('transform', d => `translate(${d.y}, ${d.x})`)
            .on('click', (event, d) => showMemberDetails(d.data));
        
        // Create node cards
        createNodeCards(nodes);
    }

    // Create node cards
    function createNodeCards(nodes) {
        nodes.append('rect')
            .attr('class', d => `node-card ${d.data.gender ? d.data.gender.toLowerCase() : 'other'}`)
            .attr('x', -60)
            .attr('y', -30)
            .attr('width', 120)
            .attr('height', 60)
            .attr('rx', 5);
        nodes.append('image')
            .attr('x', -25)
            .attr('y', -25)
            .attr('width', 50)
            .attr('height', 50)
            .attr('xlink:href', d => d.data.photo_data || 'images/profile-placeholder.png')
            .attr('clip-path', 'url(#circleClip)')
            .attr('preserveAspectRatio', 'xMidYMid slice')
            .on('error', function() {
                d3.select(this).attr('xlink:href', 'images/profile-placeholder.png');
            });
        nodes.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 25)
            .attr('fill', 'none')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
        nodes.append('text')
            .attr('class', 'node-name')
            .attr('x', 0)
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .text(d => d.data.full_name);
    }

    // Show member details
    function showMemberDetails(memberData) {
        const panel = $('#memberDetailsPanel');
        const content = panel.find('.panel-content');
        
        content.html(`
            <div class="member-details">
                <div class="member-photo">
                    <img src="${memberData.photo_data || 'images/profile-placeholder.png'}" alt="${memberData.full_name}" onerror="this.src='images/profile-placeholder.png'">
                </div>
                <div class="member-info">
                    <h4>${memberData.full_name}</h4>
                    <p><strong>Gender:</strong> ${memberData.gender || 'Not specified'}</p>
                    <p><strong>State:</strong> ${memberData.state || 'Not specified'}</p>
                    <p><strong>Occupation:</strong> ${memberData.occupation || 'Not specified'}</p>
                    <p><strong>Status:</strong> ${memberData.status || 'Not specified'}</p>
                    <p><strong>Birth Date:</strong> ${memberData.birth_date || 'Not specified'}</p>
                    <p><strong>Notes:</strong> ${memberData.notes || 'No notes available'}</p>
                </div>
            </div>
        `);
        
        panel.addClass('active');
    }

    // Event handlers for controls
    $('#layoutType').change(function() {
        currentLayout = $(this).val();
        redrawTree();
    });

    // Close member details panel
    $('.close-panel').click(function() {
        $('#memberDetailsPanel').removeClass('active');
    });

    // Window resize handler
    $(window).resize(function() {
        width = $('#familyTreeContainer').width();
        svg.attr('width', width);
        redrawTree();
    });

    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 3]) // Min and max zoom scale
        .on('zoom', function(event) {
            g.attr('transform', event.transform);
        });

    // Enable zoom and pan on the SVG
    svg.call(zoom);

    // Add double-click reset
    svg.on('dblclick.zoom', function() {
        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity);
    });

    // Add mouse drag panning
    svg.call(d3.drag()
        .on('drag', function(event) {
            const transform = d3.zoomTransform(svg.node());
            transform.x += event.dx;
            transform.y += event.dy;
            g.attr('transform', transform);
        })
    );

    // Update zoom buttons
    $('#zoomIn').click(function() {
        svg.transition()
            .duration(750)
            .call(zoom.scaleBy, 1.2);
    });

    $('#zoomOut').click(function() {
        svg.transition()
            .duration(750)
            .call(zoom.scaleBy, 0.8);
    });

    $('#zoomReset').click(function() {
        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity);
    });

    // Add this function after variable declarations
    function renderFamilyTree(data) {
        if (data && data.children) {
            familyData = data.children; // Access the array from the children property
            $('.loading-tree').hide();
            redrawTree();
        } else {
            // Handle case where data format is unexpected or empty
            showNoDataMessage();
        }
    }
});