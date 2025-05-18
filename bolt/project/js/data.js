$(document).ready(function() {
    // Mobile menu toggle
    $('.mobile-menu').click(function() {
        $('.nav-links').toggleClass('active');
    });

    // Chart colors
    const chartColors = [
        '#6D9775', '#30382F', '#A4C3A2', '#4A6D52', '#9BBB9E',
        '#556B2F', '#7D956E', '#8FBC8F', '#708238', '#3A5311'
    ];

    // Initialize stats data
    let statsData = {
        members: [],
        byState: {},
        byStatus: {},
        byGender: {},
        byAge: {}
    };

    // Initialize charts
    let stateChart, statusChart, genderChart, ageChart;

    // Load the data
    loadFamilyData();

    // Search table functionality
    $('#searchTableBtn').click(function() {
        const searchTerm = $('#tableSearch').val().toLowerCase();
        searchTable(searchTerm);
    });

    $('#tableSearch').on('keyup', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = $(this).val().toLowerCase();
            searchTable(searchTerm);
        }
    });

    // Export CSV functionality
    $('#exportCSV').click(function() {
        exportTableToCSV('family_members.csv');
    });

    // Function to load family data
    function loadFamilyData() {
        $.ajax({
            url: 'php/get_members.php',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                statsData.members = data;
                processData();
                updateSummary();
                populateTable();
                initializeCharts();
            },
            error: function() {
                console.error('Error loading family data.');
                alert('Error loading family data. Please try again later.');
            }
        });
    }

    // Process data for statistics
    function processData() {
        // Reset data
        statsData.byState = {};
        statsData.byStatus = {};
        statsData.byGender = {};
        statsData.byAge = {
            '0-18': 0,
            '19-30': 0,
            '31-45': 0,
            '46-60': 0,
            '60+': 0,
            'Unknown': 0
        };

        // Process each member
        statsData.members.forEach(function(member) {
            // Process state data
            if (member.state) {
                if (!statsData.byState[member.state]) {
                    statsData.byState[member.state] = 0;
                }
                statsData.byState[member.state]++;
            }

            // Process status data
            if (member.status) {
                if (!statsData.byStatus[member.status]) {
                    statsData.byStatus[member.status] = 0;
                }
                statsData.byStatus[member.status]++;
            }

            // Process gender data
            if (member.gender) {
                if (!statsData.byGender[member.gender]) {
                    statsData.byGender[member.gender] = 0;
                }
                statsData.byGender[member.gender]++;
            }

            // Process age data
            if (member.birth_date) {
                const birthDate = new Date(member.birth_date);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }

                if (age <= 18) {
                    statsData.byAge['0-18']++;
                } else if (age <= 30) {
                    statsData.byAge['19-30']++;
                } else if (age <= 45) {
                    statsData.byAge['31-45']++;
                } else if (age <= 60) {
                    statsData.byAge['46-60']++;
                } else {
                    statsData.byAge['60+']++;
                }
            } else {
                statsData.byAge['Unknown']++;
            }
        });
    }

    // Update summary statistics
    function updateSummary() {
        // Total members
        $('#totalMembers').text(statsData.members.length);

        // Gender ratio
        const maleCount = statsData.byGender['Male'] || 0;
        const femaleCount = statsData.byGender['Female'] || 0;
        $('#genderRatio').text(`${maleCount}:${femaleCount}`);

        // Top state
        let topState = '-';
        let maxStateCount = 0;
        for (const state in statsData.byState) {
            if (statsData.byState[state] > maxStateCount) {
                maxStateCount = statsData.byState[state];
                topState = state;
            }
        }
        $('#topState').text(topState);

        // Top occupation (requires additional processing)
        const occupations = {};
        statsData.members.forEach(function(member) {
            if (member.occupation) {
                if (!occupations[member.occupation]) {
                    occupations[member.occupation] = 0;
                }
                occupations[member.occupation]++;
            }
        });

        let topOccupation = '-';
        let maxOccupationCount = 0;
        for (const occupation in occupations) {
            if (occupations[occupation] > maxOccupationCount) {
                maxOccupationCount = occupations[occupation];
                topOccupation = occupation;
            }
        }
        $('#topOccupation').text(topOccupation);
    }

    // Initialize charts
    function initializeCharts() {
        // State Chart
        const stateCtx = document.getElementById('stateChart').getContext('2d');
        const stateData = {
            labels: Object.keys(statsData.byState),
            datasets: [{
                data: Object.values(statsData.byState),
                backgroundColor: chartColors,
                borderWidth: 1
            }]
        };

        stateChart = new Chart(stateCtx, {
            type: 'pie',
            data: stateData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 15,
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Status Chart
        const statusCtx = document.getElementById('statusChart').getContext('2d');
        const statusData = {
            labels: Object.keys(statsData.byStatus),
            datasets: [{
                data: Object.values(statsData.byStatus),
                backgroundColor: chartColors,
                borderWidth: 1
            }]
        };

        statusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: statusData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 15,
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Gender Chart
        const genderCtx = document.getElementById('genderChart').getContext('2d');
        const genderData = {
            labels: Object.keys(statsData.byGender),
            datasets: [{
                data: Object.values(statsData.byGender),
                backgroundColor: chartColors,
                borderWidth: 1
            }]
        };

        genderChart = new Chart(genderCtx, {
            type: 'pie',
            data: genderData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 15,
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Age Chart
        const ageCtx = document.getElementById('ageChart').getContext('2d');
        const ageLabels = Object.keys(statsData.byAge);
        const ageData = {
            labels: ageLabels,
            datasets: [{
                label: 'Age Distribution',
                data: ageLabels.map(label => statsData.byAge[label]),
                backgroundColor: '#6D9775',
                borderColor: '#30382F',
                borderWidth: 1
            }]
        };

        ageChart = new Chart(ageCtx, {
            type: 'bar',
            data: ageData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Populate table with members data
    function populateTable() {
        const tableBody = $('#membersTable tbody');
        tableBody.empty();
        
        if (statsData.members.length === 0) {
            tableBody.html(`
                <tr>
                    <td colspan="6" class="text-center">No family members added yet.</td>
                </tr>
            `);
            return;
        }
        
        statsData.members.forEach(function(member) {
            // Calculate age if birth date is available
            let age = 'N/A';
            if (member.birth_date) {
                const birthDate = new Date(member.birth_date);
                const today = new Date();
                let ageValue = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    ageValue--;
                }
                age = ageValue;
            }
            
            const row = `
                <tr>
                    <td>${member.full_name}</td>
                    <td>${member.gender || 'N/A'}</td>
                    <td>${member.state || 'N/A'}</td>
                    <td>${member.occupation || 'N/A'}</td>
                    <td>${member.status || 'N/A'}</td>
                    <td>${age}</td>
                </tr>
            `;
            
            tableBody.append(row);
        });
    }

    // Function to search the table
    function searchTable(term) {
        if (term.trim() === '') {
            populateTable();
            return;
        }
        
        const filteredMembers = statsData.members.filter(function(member) {
            return (
                member.full_name.toLowerCase().includes(term) ||
                (member.gender && member.gender.toLowerCase().includes(term)) ||
                (member.state && member.state.toLowerCase().includes(term)) ||
                (member.occupation && member.occupation.toLowerCase().includes(term)) ||
                (member.status && member.status.toLowerCase().includes(term))
            );
        });
        
        const tableBody = $('#membersTable tbody');
        tableBody.empty();
        
        if (filteredMembers.length === 0) {
            tableBody.html(`
                <tr>
                    <td colspan="6" class="text-center">No results found for "${term}".</td>
                </tr>
            `);
            return;
        }
        
        filteredMembers.forEach(function(member) {
            // Calculate age if birth date is available
            let age = 'N/A';
            if (member.birth_date) {
                const birthDate = new Date(member.birth_date);
                const today = new Date();
                let ageValue = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    ageValue--;
                }
                age = ageValue;
            }
            
            const row = `
                <tr>
                    <td>${member.full_name}</td>
                    <td>${member.gender || 'N/A'}</td>
                    <td>${member.state || 'N/A'}</td>
                    <td>${member.occupation || 'N/A'}</td>
                    <td>${member.status || 'N/A'}</td>
                    <td>${age}</td>
                </tr>
            `;
            
            tableBody.append(row);
        });
    }

    // Function to export table to CSV
    function exportTableToCSV(filename) {
        const csv = [];
        const rows = document.querySelectorAll('#membersTable tr');
        
        for (let i = 0; i < rows.length; i++) {
            const row = [], cols = rows[i].querySelectorAll('td, th');
            
            for (let j = 0; j < cols.length; j++) {
                row.push('"' + cols[j].innerText.replace(/"/g, '""') + '"');
            }
            
            csv.push(row.join(','));
        }
        
        // Download CSV file
        downloadCSV(csv.join('\n'), filename);
    }

    function downloadCSV(csv, filename) {
        const csvFile = new Blob([csv], {type: 'text/csv'});
        const downloadLink = document.createElement('a');
        
        // File name
        downloadLink.download = filename;
        
        // Create a link to the file
        downloadLink.href = window.URL.createObjectURL(csvFile);
        
        // Hide download link
        downloadLink.style.display = 'none';
        
        // Add the link to DOM
        document.body.appendChild(downloadLink);
        
        // Click download link
        downloadLink.click();
        
        // Clean up
        document.body.removeChild(downloadLink);
    }
});