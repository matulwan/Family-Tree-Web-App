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

    // Common chart options
    const commonChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    font: {
                        size: 12
                    },
                    generateLabels: function(chart) {
                        const datasets = chart.data.datasets;
                        return chart.data.labels.map((label, i) => {
                            const value = datasets[0].data[i];
                            const total = datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            
                            return {
                                text: `${label} (${value} - ${percentage}%)`,
                                fillStyle: datasets[0].backgroundColor[i],
                                hidden: isNaN(value) || value === 0,
                                lineCap: 'butt',
                                lineDash: [],
                                lineDashOffset: 0,
                                lineJoin: 'miter',
                                lineWidth: 1,
                                strokeStyle: '#fff',
                                pointStyle: 'circle',
                                rotation: 0
                            };
                        });
                    }
                }
            },
            tooltip: {
                backgroundColor: '#30382F',
                titleFont: {
                    size: 14
                },
                bodyFont: {
                    size: 13
                },
                padding: 12,
                cornerRadius: 8,
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
        },
        onClick: function(event, elements) {
            if (elements && elements.length > 0) {
                const index = elements[0].index;
                const label = this.data.labels[index];
                const value = this.data.datasets[0].data[index];
                const total = this.data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                alert(`${label}: ${value} (${percentage}%)`);
            }
        }
    };

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
                if (!data || data.length === 0) {
                    $('#analyticsMessage').remove();
                    $('#membersTable').before('<div id="analyticsMessage" style="background:#F5F5F0;padding:2rem;text-align:center;border-radius:8px;color:#30382F;"><b>No family members found.</b><br>Add members using the Add Members page to see analytics.</div>');
                    $('#membersTable tbody').html('<tr><td colspan="6" class="text-center">No family members added yet.</td></tr>');
                    return;
                } else {
                    $('#analyticsMessage').remove();
                }
                statsData.members = data;
                processData();
                updateSummary();
                populateTable();
                initializeCharts();
            },
            error: function() {
                $('#analyticsMessage').remove();
                $('#membersTable').before('<div id="analyticsMessage" style="background:#F44336;padding:2rem;text-align:center;border-radius:8px;color:white;"><b>Error loading family data.</b><br>Please try again later or check your connection.</div>');
                $('#membersTable tbody').html('<tr><td colspan="6" class="text-center">Error loading data.</td></tr>');
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
                borderWidth: 1,
                hoverOffset: 4
            }]
        };

        // Load state flags
        const stateFlags = {};
        const stateLabels = Object.keys(statsData.byState);
        let loadedFlags = 0;

        console.log('Starting to load flags for states:', stateLabels);

        // Malaysian state flag URLs - using local paths
        const stateFlagUrls = {
            'Johor': './images/flags/johor.jpg',
            'Kedah': './images/flags/kedah.jpg',
            'Kelantan': './images/flags/kelantan.jpg',
            'Melaka': './images/flags/melaka.png',
            'Negeri Sembilan': './images/flags/n9.jpg',
            'Pahang': './images/flags/pahang.png',
            'Perak': './images/flags/perak.jpg',
            'Perlis': './images/flags/perlis.jpg',
            'Pulau Pinang': './images/flags/pinang.jpg',
            'Sabah': './images/flags/sabah.jpg',
            'Sarawak': './images/flags/sarawak.jpg',
            'Selangor': './images/flags/selangor.jpg',
            'Terengganu': './images/flags/terengganu.png',
            'WP Kuala Lumpur': './images/flags/wp.png',
            'WP Labuan': './images/flags/wp.png',
            'WP Putrajaya': './images/flags/wp.png'
        };

        // Function to create a colored circle as fallback
        function createFallbackFlag(state, index) {
            const canvas = document.createElement('canvas');
            canvas.width = 20;
            canvas.height = 15;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = chartColors[index % chartColors.length];
            ctx.beginPath();
            ctx.arc(10, 7.5, 7, 0, Math.PI * 2);
            ctx.fill();
            
            const fallbackImg = new Image();
            fallbackImg.src = canvas.toDataURL();
            return fallbackImg;
        }

        // Load flags with retry mechanism
        function loadFlag(state, index, retryCount = 0) {
            console.log(`Loading flag for state: ${state} (attempt ${retryCount + 1})`);
            const img = new Image();
            
            const flagUrl = stateFlagUrls[state];
            if (!flagUrl) {
                console.error(`No flag URL found for state: ${state}`);
                stateFlags[state] = createFallbackFlag(state, index);
                loadedFlags++;
                if (loadedFlags === stateLabels.length) {
                    updateStateChart();
                }
                return;
            }
            
            // Add timestamp to prevent caching issues
            const timestamp = new Date().getTime();
            img.src = `${flagUrl}?t=${timestamp}`;
            
            img.onload = () => {
                console.log(`Flag loaded successfully for state: ${state}`);
                // Create a resized version of the flag
                const canvas = document.createElement('canvas');
                canvas.width = 20;
                canvas.height = 15;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 20, 15);
                
                const resizedImg = new Image();
                resizedImg.src = canvas.toDataURL();
                stateFlags[state] = resizedImg;
                
                loadedFlags++;
                console.log(`Loaded ${loadedFlags} of ${stateLabels.length} flags`);
                if (loadedFlags === stateLabels.length) {
                    console.log('All flags loaded, updating chart');
                    updateStateChart();
                }
            };
            
            img.onerror = (error) => {
                console.error(`Error loading flag for state: ${state}`, error);
                if (retryCount < 2) { // Try up to 3 times
                    console.log(`Retrying flag load for ${state}...`);
                    setTimeout(() => loadFlag(state, index, retryCount + 1), 1000);
                } else {
                    console.log(`Creating fallback for ${state} after ${retryCount + 1} failed attempts`);
                    stateFlags[state] = createFallbackFlag(state, index);
                    loadedFlags++;
                    console.log(`Created fallback for ${state}, total loaded: ${loadedFlags}`);
                    if (loadedFlags === stateLabels.length) {
                        console.log('All flags loaded (including fallbacks), updating chart');
                        updateStateChart();
                    }
                }
            };
        }

        // Start loading flags
        stateLabels.forEach((state, index) => {
            loadFlag(state, index);
        });

        function updateStateChart() {
            console.log('Updating state chart with flags');
            if (stateChart) {
                stateChart.destroy();
            }
            
            stateChart = new Chart(stateCtx, {
                type: 'pie',
                data: stateData,
                options: {
                    ...commonChartOptions,
                    plugins: {
                        ...commonChartOptions.plugins,
                        title: {
                            display: true,
                            text: 'Distribution by State',
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            padding: {
                                bottom: 20
                            }
                        },
                        legend: {
                            position: 'bottom',
                            align: 'center',
                            labels: {
                                padding: 20,
                                font: {
                                    size: 12
                                },
                                generateLabels: function(chart) {
                                    const datasets = chart.data.datasets;
                                    return chart.data.labels.map((label, i) => {
                                        const flag = stateFlags[label];
                                        const value = datasets[0].data[i];
                                        const total = datasets[0].data.reduce((a, b) => a + b, 0);
                                        const percentage = Math.round((value / total) * 100);
                                        
                                        return {
                                            text: `${label} (${value} - ${percentage}%)`,
                                            fillStyle: datasets[0].backgroundColor[i],
                                            hidden: isNaN(value) || value === 0,
                                            lineCap: 'butt',
                                            lineDash: [],
                                            lineDashOffset: 0,
                                            lineJoin: 'miter',
                                            lineWidth: 1,
                                            strokeStyle: '#fff',
                                            pointStyle: 'circle',
                                            rotation: 0,
                                            image: flag
                                        };
                                    });
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
                                    return `${label}: ${value} members (${percentage}%)`;
                                }
                            }
                        }
                    },
                    elements: {
                        arc: {
                            borderWidth: 2,
                            borderColor: '#fff'
                        }
                    },
                    cutout: '0%',
                    radius: '90%',
                    animation: {
                        animateRotate: true,
                        animateScale: true
                    }
                }
            });
        }

        // Status Chart
        const statusCtx = document.getElementById('statusChart').getContext('2d');
        const statusData = {
            labels: Object.keys(statsData.byStatus),
            datasets: [{
                data: Object.values(statsData.byStatus),
                backgroundColor: chartColors,
                borderWidth: 1,
                hoverOffset: 4
            }]
        };

        statusChart = new Chart(statusCtx, {
            type: 'pie',
            data: statusData,
            options: {
                ...commonChartOptions,
                plugins: {
                    ...commonChartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Marital Status Distribution',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: {
                            bottom: 20
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
                borderWidth: 1,
                hoverOffset: 4
            }]
        };

        genderChart = new Chart(genderCtx, {
            type: 'pie',
            data: genderData,
            options: {
                ...commonChartOptions,
                plugins: {
                    ...commonChartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Gender Distribution',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: {
                            bottom: 20
                        }
                    }
                }
            }
        });

        // Age Chart
        const ageCtx = document.getElementById('ageChart').getContext('2d');
        const ageData = {
            labels: Object.keys(statsData.byAge),
            datasets: [{
                data: Object.values(statsData.byAge),
                backgroundColor: chartColors,
                borderWidth: 1,
                hoverOffset: 4
            }]
        };

        ageChart = new Chart(ageCtx, {
            type: 'pie',
            data: ageData,
            options: {
                ...commonChartOptions,
                plugins: {
                    ...commonChartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Age Distribution',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: {
                            bottom: 20
                        }
                    }
                }
            }
        });
    }

    // Function to populate table
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