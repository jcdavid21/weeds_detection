<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <title>Real-Time Video Detection</title>
    <style>
        .video-container {
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 20px auto;
            max-width: 960px;
            background-color: #000;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
        }

        .video-player {
            width: 100%;
            height: 540px;
            object-fit: contain;
            background-color: #000;
        }

        .video-placeholder {
            width: 100%;
            height: 540px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background-color: #f8f9fa;
            color: #6c757d;
            text-align: center;
            border-radius: 8px;
        }

        .progress {
            height: 24px;
            margin-bottom: 1rem;
            border-radius: 4px;
            background-color: #e9ecef;
        }

        .progress-bar {
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            font-weight: bold;
            transition: width 0.6s ease;
        }

        .canvas-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }

        .processing-indicator {
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            display: none;
        }

        .frame-controls {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 10px;
        }

        .frame-controls button {
            min-width: 100px;
        }
    </style>
</head>

<body>
    <?php include 'navbar.php'; ?>

    <section id="video-detection" class="container mb-5 mt-5">
        <div class="card shadow-sm">
            <div class="card-header bg-success text-white">
                <h2 class="h4 mb-0"><i class="fas fa-video me-2"></i>Real-Time Video Detection</h2>
            </div>
            <div class="card-body">
                <div class="row mb-4">
                    <div class="col-md-12">
                        <div class="upload-container">
                            <div class="mb-3">
                                <label for="videoUpload" class="form-label">Upload Video File</label>
                                <input class="form-control" type="file" id="videoUpload" accept="video/mp4,video/avi,video/mov">
                                <div class="form-text">Supported formats: MP4, AVI, MOV (max 50MB)</div>
                            </div>
                            <div class="d-flex gap-2">
                                <button type="button" class="btn btn-success" id="processVideoBtn">
                                    <i class="fas fa-play-circle me-1"></i> Start Processing
                                </button>
                                <button type="button" class="btn btn-danger" id="stopProcessingBtn" disabled>
                                    <i class="fas fa-stop-circle me-1"></i> Stop Processing
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-8">
                        <div class="card mb-3">
                            <div class="card-header bg-light">
                                <div class="video-container">
                                    <div id="videoPlaceholder" class="video-placeholder">
                                        <i class="fas fa-video fa-3x mb-3"></i>
                                        <h4>No Video Loaded</h4>
                                        <p>Upload and process a video to see the detection results</p>
                                    </div>
                                    <video id="videoPlayer" class="video-player d-none" controls></video>
                                    <canvas id="detectionCanvas" class="canvas-overlay d-none"></canvas>
                                    <div id="processingIndicator" class="processing-indicator">
                                        <i class="fas fa-spinner fa-spin me-1"></i> Processing Frame...
                                    </div>
                                </div>
                                <div class="frame-controls">
                                    <button id="prevFrameBtn" class="btn btn-secondary btn-sm" disabled>
                                        <i class="fas fa-step-backward me-1"></i> Previous Frame
                                    </button>
                                    <button id="nextFrameBtn" class="btn btn-secondary btn-sm" disabled>
                                        <i class="fas fa-step-forward me-1"></i> Next Frame
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="card h-100">
                            <div class="card-header bg-light">
                                <h5 class="mb-0">Detection Statistics</h5>
                            </div>
                            <div class="card-body">
                                <div class="detection-stats mb-4">
                                    <div class="stat-item mb-3">
                                        <h6>Paddy Plants</h6>
                                        <div class="progress">
                                            <div id="countPaddy" class="progress-bar bg-success"
                                                role="progressbar"
                                                aria-valuenow="0"
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                                style="width: 0%">0</div>
                                        </div>
                                    </div>
                                    <div class="stat-item mb-3">
                                        <h6>Weeds</h6>
                                        <div class="progress">
                                            <div id="countWeed" class="progress-bar bg-danger"
                                                role="progressbar"
                                                aria-valuenow="0"
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                                style="width: 0%">0</div>
                                        </div>
                                    </div>
                                    <div class="stat-item">
                                        <h6>Weed Density</h6>
                                        <div class="progress">
                                            <div id="weedDensity" class="progress-bar bg-warning"
                                                role="progressbar"
                                                aria-valuenow="0"
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                                style="width: 0%">0%
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="detection-summary">
                                    <div class="card bg-light">
                                        <div class="card-body py-2">
                                            <h6 class="mb-2">Summary</h6>
                                            <ul class="list-unstyled mb-0">
                                                <li><i class="fas fa-seedling text-success me-2"></i>Paddy: <span id="totalPaddy">0</span></li>
                                                <li><i class="fas fa-tree text-danger me-2"></i>Weeds: <span id="totalWeed">0</span></li>
                                                <li><i class="fas fa-chart-pie me-2"></i>Weed %: <span id="weedPercent">0%</span></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div class="frame-info mt-3">
                                    <div class="card bg-light">
                                        <div class="card-body py-2">
                                            <h6 class="mb-2">Frame Information</h6>
                                            <ul class="list-unstyled mb-0">
                                                <li><i class="fas fa-image me-2"></i>Current Frame: <span id="currentFrame">0</span></li>
                                                <li><i class="fas fa-clock me-2"></i>Processing Time: <span id="processingTime">0</span>ms</li>
                                                <li><i class="fas fa-tachometer-alt me-2"></i>FPS: <span id="processingFPS">0</span></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <?php include 'footer.php'; ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script>
        $(document).ready(function() {
            const videoPlayer = document.getElementById('videoPlayer');
            const videoUpload = document.getElementById('videoUpload');
            const processVideoBtn = document.getElementById('processVideoBtn');
            const stopProcessingBtn = document.getElementById('stopProcessingBtn');
            const videoPlaceholder = document.getElementById('videoPlaceholder');
            const detectionCanvas = document.getElementById('detectionCanvas');
            const processingIndicator = document.getElementById('processingIndicator');
            const prevFrameBtn = document.getElementById('prevFrameBtn');
            const nextFrameBtn = document.getElementById('nextFrameBtn');

            // Statistics elements
            const countPaddy = document.getElementById('countPaddy');
            const countWeed = document.getElementById('countWeed');
            const weedDensity = document.getElementById('weedDensity');
            const totalPaddy = document.getElementById('totalPaddy');
            const totalWeed = document.getElementById('totalWeed');
            const weedPercent = document.getElementById('weedPercent');
            const currentFrame = document.getElementById('currentFrame');
            const processingTime = document.getElementById('processingTime');
            const processingFPS = document.getElementById('processingFPS');

            let videoFile = null;
            let isProcessing = false;
            let processingInterval = null;
            let frameQueue = [];
            let currentFrameIndex = 0;
            let frameHistory = [];
            let historyIndex = -1;
            let lastProcessingTime = 0;
            let frameTimes = [];

            // Canvas context
            const ctx = detectionCanvas.getContext('2d');

            // Video upload handler
            videoUpload.addEventListener('change', function(e) {
                if (e.target.files.length > 0) {
                    videoFile = e.target.files[0];

                    // Validate file size (max 50MB)
                    if (videoFile.size > 50 * 1024 * 1024) {
                        Swal.fire({
                            icon: 'error',
                            title: 'File too large',
                            text: 'Maximum file size is 50MB'
                        });
                        videoUpload.value = '';
                        videoFile = null;
                        return;
                    }

                    // Create video URL and display the video
                    const videoURL = URL.createObjectURL(videoFile);
                    videoPlayer.src = videoURL;
                    videoPlayer.classList.remove('d-none');
                    videoPlaceholder.classList.add('d-none');
                    detectionCanvas.classList.remove('d-none');

                    // Reset controls
                    processVideoBtn.disabled = false;
                    stopProcessingBtn.disabled = true;
                    prevFrameBtn.disabled = true;
                    nextFrameBtn.disabled = true;

                    // Reset statistics
                    resetStatistics();
                }
            });

            // Process video button handler
            processVideoBtn.addEventListener('click', function() {
                if (!videoFile) {
                    Swal.fire({
                        icon: 'error',
                        title: 'No video selected',
                        text: 'Please upload a video file first'
                    });
                    return;
                }

                if (isProcessing) return;

                // Initialize processing
                isProcessing = true;
                processVideoBtn.disabled = true;
                stopProcessingBtn.disabled = false;
                processingIndicator.style.display = 'block';

                // Reset frame history
                frameHistory = [];
                historyIndex = -1;

                // Set canvas dimensions to match video
                detectionCanvas.width = videoPlayer.videoWidth;
                detectionCanvas.height = videoPlayer.videoHeight;

                // Start processing frames
                processCurrentFrame();

                // Also process frames on timeupdate (when video plays)
                videoPlayer.addEventListener('timeupdate', processCurrentFrame);
            });

            // Stop processing button handler
            stopProcessingBtn.addEventListener('click', function() {
                if (!isProcessing) return;

                isProcessing = false;
                processVideoBtn.disabled = false;
                stopProcessingBtn.disabled = true;
                processingIndicator.style.display = 'none';

                // Remove timeupdate listener
                videoPlayer.removeEventListener('timeupdate', processCurrentFrame);

                // Enable frame navigation buttons
                prevFrameBtn.disabled = false;
                nextFrameBtn.disabled = false;
            });

            // Previous frame button
            prevFrameBtn.addEventListener('click', function() {
                if (historyIndex > 0) {
                    historyIndex--;
                    videoPlayer.currentTime = frameHistory[historyIndex].timestamp;
                    // No need to call processCurrentFrame here as the timeupdate event will handle it
                    updateNavigationButtons();
                }
            });

            // Next frame button
            nextFrameBtn.addEventListener('click', function() {
                if (historyIndex < frameHistory.length - 1) {
                    historyIndex++;
                    videoPlayer.currentTime = frameHistory[historyIndex].timestamp;
                    // No need to call processCurrentFrame here as the timeupdate event will handle it
                    updateNavigationButtons();
                }
            });

            // Function to draw detection boxes on current frame
            function drawDetectionBoxes(frameData) {
                // First draw the current video frame
                ctx.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height);
                ctx.drawImage(videoPlayer, 0, 0, detectionCanvas.width, detectionCanvas.height);

                // Then draw the detection boxes
                frameData.results.forEach(detection => {
                    const [centerX, centerY, width, height] = detection.bbox;
                    const x = centerX - width / 2;
                    const y = centerY - height / 2;

                    ctx.strokeStyle = detection.class === 'Paddy' ? '#00ff00' : '#ff0000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, width, height);

                    // Draw label background
                    ctx.fillStyle = detection.class === 'Paddy' ? '#00ff00' : '#ff0000';
                    const text = `${detection.class} ${(detection.confidence * 100).toFixed(0)}%`;
                    const textWidth = ctx.measureText(text).width;
                    ctx.fillRect(x, y - 20, textWidth + 10, 20);

                    // Draw label text
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '12px Arial';
                    ctx.fillText(text, x + 5, y - 5);
                });

                // Update frame counter
                currentFrame.textContent = historyIndex + 1;
            }


            function processCurrentFrame() {
                if (!isProcessing) return;

                const startTime = performance.now();
                processingIndicator.style.display = 'block';

                // Capture current frame from video
                ctx.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height);
                ctx.drawImage(videoPlayer, 0, 0, detectionCanvas.width, detectionCanvas.height);

                // Get current timestamp
                const currentTime = videoPlayer.currentTime;

                // Check if we already processed this frame (by timestamp)
                const existingFrameIndex = frameHistory.findIndex(f => Math.abs(f.timestamp - currentTime) < 0.04);

                if (existingFrameIndex >= 0) {
                    // Use cached results
                    historyIndex = existingFrameIndex;
                    drawDetectionBoxes(frameHistory[historyIndex]);
                    processingIndicator.style.display = 'none';
                    updateNavigationButtons();
                    return;
                }

                // Get image data for processing
                const imageData = detectionCanvas.toDataURL('image/jpeg', 0.8);

                // Send frame to server for processing
                $.ajax({
                    url: 'http://localhost:8800/process-frame',
                    type: 'POST',
                    data: JSON.stringify({
                        image: imageData
                    }),
                    contentType: 'application/json',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    success: function(response) {
                        if (response.status === 'success') {
                            const frameData = {
                                timestamp: currentTime,
                                results: response.results,
                                statistics: response.statistics,
                                processingTime: performance.now() - startTime
                            };

                            // Add to history if not duplicate
                            if (existingFrameIndex === -1) {
                                frameHistory.push(frameData);
                                historyIndex = frameHistory.length - 1;
                            }

                            // Draw results
                            drawDetectionBoxes(frameData);
                            updateStatistics(frameData.statistics);
                            updatePerformanceMetrics(frameData.processingTime);
                            updateNavigationButtons();
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('Error processing frame:', error);
                    },
                    complete: function() {
                        processingIndicator.style.display = 'none';
                    }
                });
            }

            // Improved display frame results function
            function displayFrameResults(frameData) {
                // Clear canvas
                ctx.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height);

                // Re-draw the original frame from stored image data
                const img = new Image();
                img.onload = function() {
                    ctx.drawImage(img, 0, 0, detectionCanvas.width, detectionCanvas.height);

                    // Draw detection boxes
                    frameData.results.forEach(detection => {
                        const [centerX, centerY, width, height] = detection.bbox;
                        const x = centerX - width / 2;
                        const y = centerY - height / 2;

                        ctx.strokeStyle = detection.class === 'Paddy' ? '#00ff00' : '#ff0000';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, width, height);

                        // Draw label background
                        ctx.fillStyle = detection.class === 'Paddy' ? '#00ff00' : '#ff0000';
                        const text = `${detection.class} ${(detection.confidence * 100).toFixed(0)}%`;
                        const textWidth = ctx.measureText(text).width;
                        ctx.fillRect(x, y - 20, textWidth + 10, 20);

                        // Draw label text
                        ctx.fillStyle = '#ffffff';
                        ctx.font = '12px Arial';
                        ctx.fillText(text, x + 5, y - 5);
                    });

                    // Update statistics and frame info
                    updateStatistics(frameData.statistics);
                    currentFrame.textContent = historyIndex + 1;
                    videoPlayer.currentTime = frameData.timestamp;
                };
                img.src = frameData.imageData;
            }

            // Function to update navigation buttons state
            function updateNavigationButtons() {
                prevFrameBtn.disabled = historyIndex <= 0;
                nextFrameBtn.disabled = historyIndex >= frameHistory.length - 1;
            }

            // Function to update statistics display
            function updateStatistics(stats) {
                const totalPlants = stats.paddy_count + stats.weed_count;

                // Update progress bars
                countPaddy.style.width = `${(stats.paddy_count / Math.max(totalPlants, 1)) * 100}%`;
                countPaddy.textContent = stats.paddy_count;
                countPaddy.setAttribute('aria-valuenow', stats.paddy_count);

                countWeed.style.width = `${(stats.weed_count / Math.max(totalPlants, 1)) * 100}%`;
                countWeed.textContent = stats.weed_count;
                countWeed.setAttribute('aria-valuenow', stats.weed_count);

                weedDensity.style.width = `${stats.weed_density}%`;
                weedDensity.textContent = `${stats.weed_density.toFixed(1)}%`;
                weedDensity.setAttribute('aria-valuenow', stats.weed_density);

                // Update summary
                totalPaddy.textContent = stats.paddy_count;
                totalWeed.textContent = stats.weed_count;
                weedPercent.textContent = `${stats.weed_density.toFixed(1)}%`;
            }

            // Function to update performance metrics
            function updatePerformanceMetrics(time) {
                // Add to frame times (keep last 10 for average)
                frameTimes.push(time);
                if (frameTimes.length > 10) frameTimes.shift();

                // Calculate average
                const avgTime = frameTimes.reduce((sum, t) => sum + t, 0) / frameTimes.length;
                const fps = 1000 / avgTime;

                // Update display
                processingTime.textContent = avgTime.toFixed(1);
                processingFPS.textContent = fps.toFixed(1);
            }

            // Function to reset statistics
            function resetStatistics() {
                countPaddy.style.width = '0%';
                countPaddy.textContent = '0';
                countPaddy.setAttribute('aria-valuenow', 0);

                countWeed.style.width = '0%';
                countWeed.textContent = '0';
                countWeed.setAttribute('aria-valuenow', 0);

                weedDensity.style.width = '0%';
                weedDensity.textContent = '0%';
                weedDensity.setAttribute('aria-valuenow', 0);

                totalPaddy.textContent = '0';
                totalWeed.textContent = '0';
                weedPercent.textContent = '0%';

                currentFrame.textContent = '0';
                processingTime.textContent = '0';
                processingFPS.textContent = '0';

                frameTimes = [];
            }

            // Clean up when leaving the page
            window.addEventListener('beforeunload', function() {
                if (videoPlayer.src) {
                    URL.revokeObjectURL(videoPlayer.src);
                }
            });
        });
    </script>
</body>

</html>