$(document).ready(function() {
    // Mobile menu toggle
    $('.mobile-menu').click(function() {
        $('.nav-links').toggleClass('active');
    });

    // Initialize variables
    let familyData = [];
    let currentLayout = 'vertical';
    let currentScale = 1;
    const layouts = {
        vertical: drawVerticalLayout,
        horizontal: drawHorizontalLayout,
        radial: drawRadialLayout
    };

    // SVG dimensions
    let width = $('#familyTreeContainer').width();
    let height = 600;

    // Create SVG container
    const svg = d3.select('#familyTreeContainer')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .call(d3.zoom().on('zoom', function(event) {
            g.attr('transform', event.transform);
        }));

    // Create a group for the tree
    const g = svg.append('g')
        .attr('transform', `translate(${width / 2}, 50)`);

    // Load family data
    loadFamilyData();

    // Function to load family data
    function loadFamilyData() {
        $.ajax({
            url: 'php/get_tree_data.php?t=' + new Date().getTime(), // Use the correct endpoint and prevent caching
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                renderFamilyTree(data);
            },
            error: function() {
                $('#familyTreeContainer').html('<p style="color:red;">Failed to load family tree data.</p>');
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

    // Vertical tree layout function
    function drawVerticalLayout() {
        // D3 hierarchical data setup
        const root = d3.stratify()
            .id(d => d.id)
            .parentId(d => d.parent_id)(familyData);
        
        const treeLayout = d3.tree()
            .size([width - 100, height - 100]);
        
        const treeData = treeLayout(root);
        
        // Draw links
        g.selectAll('.link')
            .data(treeData.links())
            .enter()
            .append('path')
            .attr('class', 'connector parent-child')
            .attr('d', d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y)
            );
        
        // Draw nodes
        const nodes = g.selectAll('.node')
            .data(treeData.descendants())
            .enter()
            .append('g')
            .attr('class', 'tree-node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .on('click', (event, d) => showMemberDetails(d.data.details));
        
        // Create node cards
        createNodeCards(nodes);
    }

    // Horizontal tree layout function
    function drawHorizontalLayout() {
        // D3 hierarchical data setup
        const root = d3.stratify()
            .id(d => d.id)
            .parentId(d => d.parent_id)(familyData);
        
        const treeLayout = d3.tree()
            .size([height - 100, width - 200]);
        
        treeLayout(root);
        
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

    // Radial tree layout function
    function drawRadialLayout() {
        // D3 hierarchical data setup
        const root = d3.stratify()
            .id(d => d.id)
            .parentId(d => d.parent_id)(familyData);
        
        const treeLayout = d3.tree()
            .size([2 * Math.PI, Math.min(width, height) / 2 - 100]);
        
        treeLayout(root);
        
        // Draw links
        g.selectAll('.link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'connector parent-child')
            .attr('d', d3.linkRadial()
                .angle(d => d.x)
                .radius(d => d.y)
            );
        
        // Draw nodes
        const nodes = g.selectAll('.node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'tree-node')
            .attr('transform', d => `
                translate(${d.y * Math.cos(d.x - Math.PI / 2)},
                ${d.y * Math.sin(d.x - Math.PI / 2)})
            `)
            .on('click', (event, d) => showMemberDetails(d.data));
        
        // Create node cards
        createNodeCards(nodes);
    }

    // Create node cards
    function createNodeCards(nodes) {
        nodes.append('rect')
            .attr('class', d => `node-card ${d.data.gender.toLowerCase()}`)
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
            .attr('xlink:href', d => d.data.photo)
            .attr('clip-path', 'circle(25px at 25px 25px)');

        nodes.append('text')
            .attr('class', 'node-name')
            .attr('x', 0)
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .text(d => d.data.name);
    }

    // Show member details
    function showMemberDetails(memberData) {
        const panel = $('#memberDetailsPanel');
        const content = panel.find('.panel-content');
        
        content.html(`
            <div class="member-details">
                <div class="member-photo">
                    <img src="${memberData.photo_path || 'images/profile-placeholder.png'}" alt="${memberData.full_name}">
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
    $('#zoomIn').click(function() {
        currentScale *= 1.2;
        updateZoom();
    });

    $('#zoomOut').click(function() {
        currentScale *= 0.8;
        updateZoom();
    });

    $('#zoomReset').click(function() {
        currentScale = 1;
        updateZoom();
    });

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

    // Function to update zoom
    function updateZoom() {
        g.attr('transform', `translate(${width / 2}, 50) scale(${currentScale})`);
    }
});