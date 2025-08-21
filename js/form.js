$(document).ready(function() {
    // Mobile menu toggle
    $('.mobile-menu').click(function() {
        $('.nav-links').toggleClass('active');
    });

    // Photo preview functionality
    $('#photo').change(function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $('#photoPreview').attr('src', e.target.result);
            }
            reader.readAsDataURL(file);
        }
    });

    // Intercept form submit for add/edit
    $('#familyMemberForm').off('submit').on('submit', function(e) {
        e.preventDefault();
        const editId = $(this).data('edit-id');
        const submitBtn = $(this).find('button[type="submit"]');
        const originalText = submitBtn.text();
        
        // Prevent double submission
        if (submitBtn.prop('disabled')) {
            return;
        }
        
        submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Processing...');
        const formData = new FormData(this);
        
        // Ensure edit ID is properly set
        if (editId) {
            formData.set('id', editId); // Use set instead of append to ensure no duplicates
            url = 'php/update_member.php';
        } else {
            url = 'php/add_member.php';
        }
        $.ajax({
            url: url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                try {
                    const result = typeof response === 'string' ? JSON.parse(response) : response;
                    if (result.success) {
                        const successMessage = $('<div>')
                            .addClass('alert alert-success')
                            .css({
                                'background-color': '#6D9775',
                                'color': 'white',
                                'padding': '1rem',
                                'border-radius': '4px',
                                'margin-bottom': '1rem',
                                'text-align': 'center'
                            })
                            .html('<i class="fas fa-check-circle"></i> ' + (editId ? 'Family member updated successfully!' : 'Family member added successfully!'));
                        $('#familyMemberForm').before(successMessage);
                        setTimeout(() => { successMessage.fadeOut(400, function() { $(this).remove(); }); }, 3000);
                        $('#familyMemberForm')[0].reset();
                        $('#photoPreview').attr('src', 'images/profile-placeholder.png');
                        $('#familyMemberForm').removeData('edit-id');
                        $('#familyMemberForm button[type="submit"]').text('Add Member');
                        // Refresh members list and dropdown immediately
                        loadFamilyMembers();
                        loadRelatedToOptions();
                    } else {
                        const errorMessage = $('<div>')
                            .addClass('alert alert-error')
                            .css({
                                'background-color': '#F44336',
                                'color': 'white',
                                'padding': '1rem',
                                'border-radius': '4px',
                                'margin-bottom': '1rem',
                                'text-align': 'center'
                            })
                            .html(`<i class=\"fas fa-exclamation-circle\"></i> ${result.message}`);
                        $('#familyMemberForm').before(errorMessage);
                        setTimeout(() => { errorMessage.fadeOut(400, function() { $(this).remove(); }); }, 3000);
                    }
                } catch (e) {
                    console.error('Error parsing response:', e);
                }
            },
            error: function() {
                const errorMessage = $('<div>')
                    .addClass('alert alert-error')
                    .css({
                        'background-color': '#F44336',
                        'color': 'white',
                        'padding': '1rem',
                        'border-radius': '4px',
                        'margin-bottom': '1rem',
                        'text-align': 'center'
                    })
                    .html('<i class="fas fa-exclamation-circle"></i> An error occurred. Please try again.');
                $('#familyMemberForm').before(errorMessage);
                setTimeout(() => { errorMessage.fadeOut(400, function() { $(this).remove(); }); }, 3000);
            },
            complete: function() {
                submitBtn.prop('disabled', false).text(originalText);
            }
        });
    });

    // Search functionality
    $('#searchBtn').click(function() {
        const searchTerm = $('#memberSearch').val().toLowerCase();
        searchMembers(searchTerm);
    });
    $('#memberSearch').on('keyup', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = $(this).val().toLowerCase();
            searchMembers(searchTerm);
        }
    });

    // Print functionality
    $('#printBtn').click(function() {
        window.print();
    });

    // Load family members and dropdown on page load
    loadFamilyMembers();
    loadRelatedToOptions();

    // Function to load family members
    function loadFamilyMembers() {
        $.ajax({
            url: 'php/get_members.php?t=' + new Date().getTime(), // Prevent caching
            type: 'GET',
            dataType: 'json',
            cache: false,
            success: function(data) {
                setTimeout(function() {
                    displayFamilyMembers(data);
                }, 0);
            },
            error: function() {
                console.error('Error loading family members.');
            }
        });
    }

    // Function to load related to dropdown options
    function loadRelatedToOptions() {
        $.ajax({
            url: 'php/get_members.php',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                const selectElement = $('#relatedTo');
                selectElement.empty();
                selectElement.append('<option value="" disabled selected>Select existing member</option>');
                data.forEach(function(member) {
                    selectElement.append(`<option value="${member.id}">${member.full_name}</option>`);
                });
            },
            error: function() {
                console.error('Error loading family members for dropdown.');
            }
        });
    }

    // Function to display family members
    function displayFamilyMembers(members) {
        const membersGrid = $('#membersGrid');
        membersGrid.empty();
        if (members.length === 0) {
            membersGrid.html(`
                <div class="no-members-message">
                    <p>No family members added yet. Use the form above to add your first member.</p>
                </div>
            `);
            return;
        }
        members.forEach(function(member) {
            // Use the data URL directly if available, otherwise use placeholder
            const photoSrc = member.photo_data || 'images/profile-placeholder.png';
            
            const memberCard = `
                <div class="member-card" data-id="${member.id}">
                    <div class="member-photo">
                        <img src="${photoSrc}" alt="${member.full_name}" onerror="this.src='images/profile-placeholder.png'">
                    </div>
                    <div class="member-info">
                        <h3>${member.full_name}</h3>
                        <p class="occupation">${member.occupation}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${member.state}</p>
                        <p><i class="fas fa-ring"></i> ${member.status}</p>
                    </div>
                    <div class="member-actions">
                        <button class="view" data-id="${member.id}"><i class="fas fa-eye"></i> View</button>
                        <button class="edit" data-id="${member.id}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="delete" data-id="${member.id}"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                </div>
            `;
            membersGrid.append(memberCard);
        });
        // Add event listeners for actions
        $('.member-card .view').click(function() {
            const memberId = $(this).data('id');
            viewMember(memberId);
        });
        $('.member-card .edit').click(function() {
            const memberId = $(this).data('id');
            editMember(memberId);
        });
        $('.member-card .delete').click(function() {
            const memberId = $(this).data('id');
            deleteMember(memberId);
        });
    }

    // Function to search members
    function searchMembers(term = '') {
        if (term.trim() === '') {
            loadFamilyMembers();
            return;
        }
        $.ajax({
            url: 'php/search_members.php',
            type: 'GET',
            data: { term: term },
            dataType: 'json',
            success: function(data) {
                displayFamilyMembers(data);
            },
            error: function() {
                console.error('Error searching family members.');
            }
        });
    }

    // Function to view member details
    function viewMember(id) {
        $.ajax({
            url: 'php/get_member.php',
            type: 'GET',
            data: { id: id },
            dataType: 'json',
            success: function(data) {
                if (data) {
                    // Use the data URL directly if available, otherwise use placeholder
                    const photoSrc = data.photo_data || 'images/profile-placeholder.png';
                    
                    const modalHtml = `
                        <div class="modal" style="
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: rgba(0, 0, 0, 0.5);
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            z-index: 1000;
                        ">
                            <div class="modal-content" style="
                                background: white;
                                padding: 2rem;
                                border-radius: 8px;
                                max-width: 500px;
                                width: 90%;
                                max-height: 90vh;
                                overflow-y: auto;
                            ">
                                <div class="modal-header" style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    margin-bottom: 1rem;
                                ">
                                    <h2>${data.full_name}</h2>
                                    <button class="close-modal" style="
                                        background: none;
                                        border: none;
                                        font-size: 1.5rem;
                                        cursor: pointer;
                                    ">&times;</button>
                                </div>
                                <div class="modal-body">
                                    <div class="member-photo" style="text-align: center; margin-bottom: 1rem;">
                                        <img src="${photoSrc}" alt="${data.full_name}" style="
                                            max-width: 200px;
                                            border-radius: 50%;
                                            margin-bottom: 1rem;
                                        " onerror="this.src='images/profile-placeholder.png'">
                                    </div>
                                    <div class="member-details">
                                        <p><strong>Occupation:</strong> ${data.occupation}</p>
                                        <p><strong>State:</strong> ${data.state}</p>
                                        <p><strong>Status:</strong> ${data.status}</p>
                                        <p><strong>Gender:</strong> ${data.gender}</p>
                                        <p><strong>Birth Date:</strong> ${data.birth_date}</p>
                                        <p><strong>Relationship:</strong> ${data.relationship}</p>
                                        ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    $('body').append(modalHtml);
                    
                    // Close modal when clicking the close button or outside the modal
                    $('.close-modal, .modal').click(function(e) {
                        if (e.target === this) {
                            $('.modal').remove();
                        }
                    });
                }
            },
            error: function() {
                console.error('Error loading member details.');
            }
        });
    }

    // Function to populate form for editing
    function editMember(id) {
        $.ajax({
            url: 'php/get_member.php',
            type: 'GET',
            data: { id: id },
            dataType: 'json',
            success: function(data) {
                if (data) {
                    $('#fullName').val(data.full_name);
                    $('#state').val(data.state);
                    $('#occupation').val(data.occupation);
                    $('#status').val(data.status);
                    $('#gender').val(data.gender);
                    $('#birthDate').val(data.birth_date);
                    $('#notes').val(data.notes);
                    $('#relationship').val(data.relationship);
                    $('#relatedTo').val(data.related_to);
                    if (data.photo_data) {
                        $('#photoPreview').attr('src', data.photo_data);
                    }
                    $('#familyMemberForm').data('edit-id', id);
                    $('#familyMemberForm button[type="submit"]').text('Update Member');
                    $('html, body').animate({
                        scrollTop: $('.form-section').offset().top - 100
                    }, 500);
                }
            },
            error: function() {
                console.error('Error loading member for editing.');
            }
        });
    }

    // Function to delete member
    function deleteMember(id) {
        if (confirm('Are you sure you want to delete this family member? This action cannot be undone.')) {
            $.ajax({
                url: 'php/delete_member.php',
                type: 'POST',
                data: { id: id },
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        const successMessage = $('<div>')
                            .addClass('alert alert-success')
                            .css({
                                'background-color': '#6D9775',
                                'color': 'white',
                                'padding': '1rem',
                                'border-radius': '4px',
                                'margin-bottom': '1rem',
                                'text-align': 'center'
                            })
                            .html('<i class="fas fa-check-circle"></i> ' + response.message);
                        $('.members-list').before(successMessage);
                        setTimeout(() => { successMessage.fadeOut(400, function() { $(this).remove(); }); }, 3000);
                        // Refresh members list and dropdown
                        loadFamilyMembers();
                        loadRelatedToOptions();
                    } else {
                        const errorMessage = $('<div>')
                            .addClass('alert alert-error')
                            .css({
                                'background-color': '#F44336',
                                'color': 'white',
                                'padding': '1rem',
                                'border-radius': '4px',
                                'margin-bottom': '1rem',
                                'text-align': 'center'
                            })
                            .html('<i class="fas fa-exclamation-circle"></i> ' + response.message);
                        $('.members-list').before(errorMessage);
                        setTimeout(() => { errorMessage.fadeOut(400, function() { $(this).remove(); }); }, 3000);
                    }
                },
                error: function() {
                    const errorMessage = $('<div>')
                        .addClass('alert alert-error')
                        .css({
                            'background-color': '#F44336',
                            'color': 'white',
                            'padding': '1rem',
                            'border-radius': '4px',
                            'margin-bottom': '1rem',
                            'text-align': 'center'
                        })
                        .html('<i class="fas fa-exclamation-circle"></i> An error occurred while deleting the member. Please try again.');
                    $('.members-list').before(errorMessage);
                    setTimeout(() => { errorMessage.fadeOut(400, function() { $(this).remove(); }); }, 3000);
                }
            });
        }
    }
});
