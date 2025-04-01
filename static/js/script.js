document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const predictBtn = document.getElementById('predictBtn');
    const originalImage = document.getElementById('originalImage');
    const resultImage = document.getElementById('resultImage');
    const resultsTableBody = document.getElementById('resultsTableBody');
    const statsSection = document.getElementById('statsSection');
    const totalObjects = document.getElementById('totalObjects');
    const paddyCount = document.getElementById('paddyCount');
    const cropCount = document.getElementById('cropCount');
    const weedCount = document.getElementById('weedCount');
    const clear_historyBtn = document.getElementById('clearHistoryBtn');

    let detectionHistory = JSON.parse(localStorage.getItem('detectionHistory')) || [];
    let detectionChart, confidenceChart;
    let selectedFile = null;

    // Initialize Charts
    function initCharts() {
        const ctx1 = document.getElementById('detectionChart').getContext('2d');
        const ctx2 = document.getElementById('confidenceChart').getContext('2d');

        detectionChart = new Chart(ctx1, {
            type: 'pie',
            data: {
                labels: ['Paddy', 'Weed'],  // Paddy first, Weed second
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#28a745', '#dc3545']  // Green for Paddy, Red for Weed
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        confidenceChart = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['High (≥70%)', 'Medium (50-69%)', 'Low (<50%)'],
                datasets: [{
                    label: 'Confidence Distribution',
                    data: [0, 0, 0],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545']
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        updateHistoryTable();
    }



    function updateAnalytics(data) {
        // Get counts from backend statistics instead of counting manually
        let paddies = data.statistics.paddy_count || 0;
        let weeds = data.statistics.weed_count || 0;
        let highConf = 0, mediumConf = 0, lowConf = 0; // Properly declare variables here

        if (data.results && data.results.length > 0) {
            data.results.forEach(result => {
                const confidence = result.confidence || 0; // Add safety check
                // Confidence distribution
                if (confidence >= 0.7) highConf++;
                else if (confidence >= 0.5) mediumConf++;
                else lowConf++;
            });
        }

        // Update stats display
        totalObjects.textContent = data.statistics.total_objects || 0;
        paddyCount.textContent = paddies;
        weedCount.textContent = weeds;

        // Update charts - ensure Paddy is first (green) and Weed is second (red)
        detectionChart.data.datasets[0].data = [paddies, weeds];
        detectionChart.update();

        confidenceChart.data.datasets[0].data = [highConf, mediumConf, lowConf];
        confidenceChart.update();
    }

    function updateHistoryTable() {
        const historyBody = document.getElementById('historyBody');
        historyBody.innerHTML = '';

        // disable clear history button if no history
        document.getElementById('clearHistoryBtn').disabled = detectionHistory.length === 0;
        // off the disabled class
        document.getElementById('clearHistoryBtn').classList.toggle('disabled', detectionHistory.length === 0);

        if (detectionHistory.length === 0) {
            historyBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="no-results">
                        <i class="fas fa-info-circle fa-2x mb-2"></i>
                        <p class="mb-0">No detection history yet</p>
                    </div>
                </td>
            </tr>
        `;
            return;
        }

        detectionHistory.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${entry.date}</td>
            <td><img src="${entry.image}" class="img-thumbnail" style="width:80px;height:60px;"></td>
            <td>${entry.paddies}</td>
            <td>${entry.weeds}</td>
            <td>${(entry.avgConfidence * 100).toFixed(1)}%</td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-result" data-index="${index}">
                    <i class="fas fa-eye"></i> View
                </button>
                                <a href="healthRisk.php" class="btn btn-sm btn-outline-danger view-risk" data-index="${index}">
                    <i class="fas fa-heartbeat"></i> Risk
                </a>
            </td>
        `;
            historyBody.appendChild(row);
        });

        // Add event listeners to view buttons
        document.querySelectorAll('.view-result').forEach(btn => {
            btn.addEventListener('click', function () {
                const index = this.getAttribute('data-index');
                const entry = detectionHistory[index];

                // Display the original and result images
                originalImage.innerHTML = `<img src="${entry.image.replace('predicted_', '')}" class="img-fluid">`;
                originalImage.querySelector('img').style.maxWidth = '100%';
                originalImage.querySelector('img').style.maxHeight = '100%';
                originalImage.querySelector('img').style.objectFit = 'contain';
                resultImage.innerHTML = `<img src="${entry.image}" class="img-fluid">`;
                resultImage.querySelector('img').style.maxWidth = '100%';
                resultImage.querySelector('img').style.maxHeight = '100%';
                resultImage.querySelector('img').style.objectFit = 'contain';

                // Display the results in the table
                displayResultsFromHistory(entry.fullData);
            });
        });

        // Store data for health risk page when clicking risk button
        document.querySelectorAll('.view-risk').forEach(btn => {
            btn.addEventListener('click', function (e) {
                const index = this.getAttribute('data-index');
                const entry = detectionHistory[index];
                localStorage.setItem('detectionData', JSON.stringify(entry.fullData));
            });
        });
    }


    function clearDetectionHistory() {
        // Show confirmation dialog
        Swal.fire({
            title: 'Are you sure?',
            text: "This will clear all detection history!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, clear it!'
        }).then((result) => {
            if (result.isConfirmed) {
                // Clear the displayed history but keep data in localStorage
                detectionHistory = [];
                localStorage.setItem('detectionHistory', JSON.stringify(detectionHistory));
                localStorage.removeItem('detectionData'); // Clear detection data for health risk page

                // Update the history table
                updateHistoryTable();

                // Show success message
                const toast = document.createElement('div');
                toast.className = 'alert alert-success position-fixed bottom-0 end-0 m-3';
                toast.style.zIndex = '1100';
                toast.innerHTML = `
                <div class="d-flex">
                    <i class="fas fa-check-circle me-2"></i>
                    <div>Detection history cleared successfully</div>
                    <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
                </div>
            `;
                document.body.appendChild(toast);

                setTimeout(() => toast.remove(), 3000);
            }
        });
    }

    // Function to update charts
    function updateCharts(data) {
        const paddies = data.statistics.paddy_count || 0;
        const weeds = data.statistics.weed_count || 0;

        // Update detection chart
        detectionChart.data.datasets[0].data = [paddies, weeds];
        detectionChart.update();

        // Update confidence chart
        if (data.results && data.results.length > 0) {
            let high = 0, medium = 0, low = 0;
            data.results.forEach(result => {
                const conf = result.confidence || 0;
                if (conf >= 0.7) high++;
                else if (conf >= 0.5) medium++;
                else low++;
            });
            confidenceChart.data.datasets[0].data = [high, medium, low];
            confidenceChart.update();
        }
    }

    // Function to display results from history
    function displayResultsFromHistory(data) {
        // Clear previous results
        resultsTableBody.innerHTML = '';

        // Show stats section
        statsSection.classList.remove('d-none');

        // Update stats display
        totalObjects.textContent = data.statistics.total_objects || 0;
        paddyCount.textContent = data.statistics.paddy_count || 0;
        weedCount.textContent = data.statistics.weed_count || 0;

        // Update charts
        updateCharts(data);

        // Process and display detection results
        if (data.results && data.results.length > 0) {
            data.results.forEach(result => {
                const row = document.createElement('tr');
                row.innerHTML = `
                <td>${result.class === 'Paddy' ? '<i class="fas fa-seedling text-success me-2"></i> Paddy' : '<i class="fas fa-tree text-danger me-2"></i> Weed'}</td>
                <td>${result.class}</td>
                <td>
                    <span class="badge bg-${getConfidenceClass(result.confidence)}">
                        ${(result.confidence * 100).toFixed(1)}%
                    </span>
                </td>
                <td>${result.bbox.join(', ')}</td>
                <td>${Math.round(result.bbox[2] * result.bbox[3])} px²</td>
                <td>${result.class === 'Paddy' ? '🌾' : '🌿'}</td>
            `;
                resultsTableBody.appendChild(row);
            });
        } else {
            resultsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="no-results">
                        <i class="fas fa-search fa-2x mb-2"></i>
                        <p>No objects detected in the image</p>
                    </div>
                </td>
            </tr>
        `;
        }
    }
    // Helper function to get confidence class
    function getConfidenceClass(confidence) {
        if (confidence >= 0.7) return 'success';
        if (confidence >= 0.5) return 'warning';
        return 'danger';
    }

    // Helper function to calculate average confidence
    function calculateAverageConfidence(results) {
        if (!results || results.length === 0) return 0;

        const sum = results.reduce((total, result) => total + (result.confidence || 0), 0);
        return sum / results.length;
    }

    // Add a new function to link to the health risk page
    function addHealthRiskButton() {
        // Add a button to view health risk analysis
        const resultSection = document.getElementById('statsSection');

        // Check if button already exists
        if (!document.getElementById('viewHealthRiskBtn')) {
            const healthRiskBtn = document.createElement('div');
            healthRiskBtn.className = 'text-center mt-4';
            healthRiskBtn.innerHTML = `
            <a id="viewHealthRiskBtn" href="healthRisk.php" class="btn btn-primary">
                <i class="fas fa-heartbeat me-2"></i> View Health Risk Analysis
            </a>
        `;
            resultSection.appendChild(healthRiskBtn);
        }
    }


    // Generate Recommendations
    function generateRecommendations(crops, weeds) {
        const weedRec = document.getElementById('weedRecommendations');
        const cropRec = document.getElementById('cropRecommendations');
        const activeRec = document.getElementById('activeRecommendations');

        // Show recommendations section
        document.getElementById('recommendationsContent').querySelector('.alert').classList.add('d-none');
        activeRec.classList.remove('d-none');

        // Weed recommendations
        weedRec.innerHTML = '';
        if (weeds === 0) {
            weedRec.innerHTML = '<div class="alert alert-success"><i class="fas fa-check-circle me-2"></i> No weeds detected. Excellent field condition!</div>';
        } else {
            let weedLevel = weeds < 3 ? 'light' : weeds < 10 ? 'moderate' : 'heavy';
            weedRec.innerHTML = `
                <div class="alert alert-${weedLevel === 'heavy' ? 'danger' : weedLevel === 'moderate' ? 'warning' : 'info'}">
                    <h5><i class="fas fa-exclamation-triangle me-2"></i> ${weedLevel.charAt(0).toUpperCase() + weedLevel.slice(1)} Weed Infestation</h5>
                    <p>${weeds} weeds detected in the image.</p>
                    <hr>
                    <ul class="mb-0">
                        <li>${weedLevel === 'heavy' ? '🚨 Immediate herbicide application recommended' : '✋ Manual removal may be sufficient'}</li>
                        <li>🔍 Monitor field every ${weedLevel === 'heavy' ? '3-4' : '7-10'} days</li>
                        <li>🔄 Consider crop rotation to prevent weed adaptation</li>
                    </ul>
                </div>
            `;
        }

        // Crop recommendations
        cropRec.innerHTML = '';
        if (crops === 0) {
            cropRec.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i> No crops detected. Check your planting.</div>';
        } else {
            cropRec.innerHTML = `
                <div class="alert alert-success">
                    <h5><i class="fas fa-seedling me-2"></i> Crop Health Status</h5>
                    <p>${crops} healthy plants detected.</p>
                    <hr>
                    <ul class="mb-0">
                        <li>${weeds > crops ? '⚠️ Weeds are competing with crops - prioritize weed control' : '✅ Good crop-to-weed ratio'}</li>
                        <li>💧 Monitor soil moisture and nutrient levels</li>
                        <li>🌱 Consider fertilization in 2-3 weeks</li>
                        ${weeds > 0 ? '<li>📅 Schedule next inspection in ' + (weeds > 5 ? '3-5' : '7-10') + ' days</li>' : ''}
                    </ul>
                </div>
            `;
        }
    }

    // File Handling
    function handleFileSelection(file) {
        // Display the selected image
        if (!file.type.match('image.*')) {
            showError('Please select an image file (JPEG, PNG)');
            return;
        }

        selectedFile = file;
        predictBtn.disabled = false;

        const reader = new FileReader();
        reader.onload = function (e) {
            originalImage.innerHTML = '';
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'img-fluid rounded';

            // Set styles to ensure it's visible and fits container
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.display = 'block';  // Ensure it's not hidden
            img.style.objectFit = 'contain';  // Maintain aspect ratio while fitting within container

            originalImage.appendChild(img);

            // Clear previous results
            resultImage.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center h-100">
            <i class="fas fa-chart-bar fa-4x text-muted mb-3"></i>
            <p class="text-muted">Click "Analyze Image" to see results</p>
        </div>
    `;

            resultsTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4">
                <div class="no-results">
                    <i class="fas fa-info-circle fa-2x mb-2"></i>
                    <p class="mb-0">No detection results yet</p>
                </div>
            </td>
        </tr>
    `;

            // Hide stats section
            statsSection.classList.add('d-none');
        };
        reader.readAsDataURL(file);
    }

    // Prediction Function
    function predictImage() {
        if (!selectedFile) return;

        // Disable button during processing
        predictBtn.disabled = true;
        predictBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Analyzing...';

        const formData = new FormData();
        formData.append('file', selectedFile);

        fetch('http://localhost:8800/predict', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server responded with ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.error) throw new Error(data.error);
                displayResults(data);
            })
            .catch(error => {
                console.error('Prediction error:', error);
                showError(error.message || 'Failed to analyze image');
            })
            .finally(() => {
                predictBtn.disabled = false;
                predictBtn.innerHTML = '<i class="fas fa-search me-2"></i> Analyze Image';
            });
    }

    function displayResults(data) {
        // Clear previous results
        resultImage.innerHTML = '';
        resultsTableBody.innerHTML = '';

        // Show stats section
        statsSection.classList.remove('d-none');

        // Display predicted image with error handling
        if (data.predicted) {
            const resultImg = new Image();
            resultImg.onload = function () {
                resultImage.innerHTML = '';
                resultImg.className = 'img-fluid rounded';
                resultImg.alt = 'Detection results';
                resultImg.style.maxWidth = '100%';
                resultImg.style.maxHeight = '100%';
                resultImage.appendChild(resultImg);
            };
            resultImg.onerror = function () {
                resultImage.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Failed to load result image
                    </div>
                `;
            };
            resultImg.src = data.predicted;
        } else {
            resultImage.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    No result image available
                </div>
            `;
        }

        // Process and display detection results
        if (data.results && data.results.length > 0) {
            let totalConfidence = 0;
            let paddyCount = 0;
            let weedCount = 0;

            data.results.forEach((result, index) => {
                const confidence = result.confidence || 0;
                totalConfidence += confidence;

                const confidenceClass = confidence >= 0.7 ? 'high' :
                    confidence >= 0.5 ? 'medium' : 'low';

                // Ensure class is properly formatted
                const className = result.class ? String(result.class).toLowerCase() : 'unknown';
                const isPaddy = className.includes('paddy');

                if (isPaddy) {
                    paddyCount++;
                } else {
                    weedCount++;
                }

                const typeIcon = isPaddy ?
                    '<i class="fas fa-seedling text-success me-2"></i>' :
                    '<i class="fas fa-tree text-danger me-2"></i>';

                const bbox = result.bbox || [0, 0, 0, 0];
                const size = Math.round(bbox[2] * bbox[3]);

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${typeIcon} ${isPaddy ? 'Paddy' : 'Weed'}</td>
                    <td>${isPaddy ? 'Paddy Plant' : 'Weed'}</td>
                    <td>
                        <span class="badge bg-${confidenceClass === 'high' ? 'success' :
                        confidenceClass === 'medium' ? 'warning' : 'danger'}">
                            ${(confidence * 100).toFixed(1)}%
                        </span>
                    </td>
                    <td>${bbox.map(x => x.toFixed(1)).join(', ')}</td>
                    <td>${size} px²</td>
                    <td>${isPaddy ? '🌾' : '🌿'}</td>
                `;
                resultsTableBody.appendChild(row);
            });

            // Calculate average confidence
            const avgConfidence = totalConfidence / data.results.length;

            // Update statistics in data object for health risk analysis
            data.statistics = data.statistics || {};
            data.statistics.paddy_count = paddyCount;
            data.statistics.weed_count = weedCount;
            data.statistics.total_objects = data.results.length;

            // Update analytics
            updateAnalytics(data);

            // Create history entry
            const historyEntry = {
                date: new Date().toLocaleString(),
                image: data.predicted,
                paddies: paddyCount,
                weeds: weedCount,
                avgConfidence: avgConfidence,
                fullData: data  // Store complete data for health risk analysis
            };

            // Add to beginning of history array
            detectionHistory.unshift(historyEntry);

            // Keep only last 10 entries
            if (detectionHistory.length > 10) {
                detectionHistory.pop();
            }

            // Save to localStorage
            localStorage.setItem('detectionHistory', JSON.stringify(detectionHistory));
            localStorage.setItem('detectionData', JSON.stringify(data)); // For health risk page

            // Update history table
            updateHistoryTable();

            // Generate recommendations
            generateRecommendations(paddyCount, weedCount);

            // Add health risk button if not already present
            addHealthRiskButton();
        } else {
            resultsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="no-results">
                            <i class="fas fa-search fa-2x mb-2"></i>
                            <p>No objects detected in the image</p>
                            ${data.message ? `<p class="small text-muted mt-2">${data.message}</p>` : ''}
                        </div>
                    </td>
                </tr>
            `;

            // Still update analytics with zero values
            updateAnalytics({
                results: [],
                statistics: {
                    total_objects: 0,
                    paddy_count: 0,
                    weed_count: 0
                }
            });
        }
    }


    function updateStatistics(stats) {
        // Update main counters
        totalObjects.textContent = stats.total_objects;
        cropCount.textContent = stats.paddy_count;
        weedCount.textContent = stats.weed_count;

        // Update weed density display (add this element to your HTML)
        const weedDensityElement = document.getElementById('weedDensity');
        if (weedDensityElement) {
            weedDensityElement.innerHTML = `
            <div class="progress" style="height: 25px;">
                <div class="progress-bar bg-danger" role="progressbar" 
                     style="width: ${stats.weed_density}%" 
                     aria-valuenow="${stats.weed_density}" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                    ${stats.weed_density}% Weed Density
                </div>
            </div>
        `;
        }

        // Update additional stats (add these elements to your HTML)
        const statsContainer = document.getElementById('detailedStats');
        if (statsContainer) {
            statsContainer.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <div class="stat-card">
                        <i class="fas fa-seedling text-success"></i>
                        <h4>Crop Ratio</h4>
                        <p>${((stats.paddy_count / stats.total_objects) * 100).toFixed(1)}%</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card">
                        <i class="fas fa-tree text-danger"></i>
                        <h4>Weed Ratio</h4>
                        <p>${((stats.weed_count / stats.total_objects) * 100).toFixed(1)}%</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card">
                        <i class="fas fa-chart-pie text-primary"></i>
                        <h4>Weed Density</h4>
                        <p>${stats.weed_density}%</p>
                    </div>
                </div>
            </div>
        `;
        }
    }

    // Error Handling
    function showError(message) {
        console.error('Error:', message);

        resultsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="no-results error">
                        <i class="fas fa-exclamation-circle fa-2x mb-2"></i>
                        <p>${message || 'Prediction failed'}</p>
                    </div>
                </td>
            </tr>
        `;

        statsSection.classList.add('d-none');

        const toast = document.createElement('div');
        toast.className = 'alert alert-danger position-fixed bottom-0 end-0 m-3';
        toast.style.zIndex = '1100';
        toast.innerHTML = `
            <div class="d-flex">
                <i class="fas fa-exclamation-circle me-2"></i>
                <div>${message}</div>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 5000);
    }

    // Event Listeners
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-3', 'border-success');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('border-3', 'border-success');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-3', 'border-success');
        if (e.dataTransfer.files.length) handleFileSelection(e.dataTransfer.files[0]);
    });

    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => fileInput.files.length && handleFileSelection(fileInput.files[0]));
    predictBtn.addEventListener('click', predictImage);

    clear_historyBtn.addEventListener('click', clearDetectionHistory);

    // Initialize the application
    initCharts();
    displayResultsFromHistory(detectionHistory[0] || {});
});