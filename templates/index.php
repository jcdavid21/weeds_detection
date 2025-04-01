<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crop & Weed Detector</title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link rel="stylesheet" href="../static/ccs/style.css">

</head>

<body>
    <?php include 'navbar.php'; ?>

    <!-- Hero Section -->
    <section class="hero-section text-center">
        <div class="container">
            <h1 class="display-4 fw-bold mb-3">Advanced Paddy & Weed Detection</h1>
            <p class="lead mb-4">Harness the power of AI to distinguish between paddy and weeds with unprecedented accuracy</p>
            <a href="#detector" class="btn btn-success btn-lg px-4 me-2">
                <i class="fas fa-play me-1"></i> Try Now
            </a>
        </div>
    </section>

    <!-- Main Detector Section -->
    <section id="detector" class="container mb-5">
        <div class="row justify-content-center">
            <div class="col-lg-12">
                <div class="card shadow-sm">
                    <div class="card-header bg-success text-white">
                        <h2 class="h4 mb-0"><i class="fas fa-camera me-2"></i>Plant Detection</h2>
                    </div>
                    <div class="card-body">
                        <div class="upload-section text-center mb-4">
                            <div class="dropzone mb-3" id="dropzone">
                                <i class="fas fa-cloud-upload-alt fa-3x mb-3 text-success"></i>
                                <h4 class="mb-2">Drag & Drop Your Image Here</h4>
                                <p class="text-muted mb-3">or click to browse files</p>
                                <input type="file" id="fileInput" accept="image/*" class="d-none">
                                <button class="btn btn-outline-success">
                                    <i class="fas fa-folder-open me-1"></i> Select Image
                                </button>
                            </div>
                            <button id="predictBtn" class="btn btn-success btn-lg" disabled>
                                <i class="fas fa-search me-1"></i> Analyze Image
                            </button>
                        </div>

                        <!-- Detection Stats -->
                        <div class="row mb-4 d-none" id="statsSection">
                            <div class="col-md-4">
                                <div class="detection-stats text-center">
                                    <div class="stat-value" id="totalObjects">0</div>
                                    <div class="stat-label">Total Objects Detected</div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="detection-stats text-center">
                                    <div class="stat-value"><i class="fas fa-seedling drop-icon me-2"></i><span id="paddyCount">0</span></div>
                                    <div class="stat-label">Paddy Identified</div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="detection-stats text-center">
                                    <div class="stat-value"><i class="fas fa-tree weed-icon me-2"></i><span id="weedCount">0</span></div>
                                    <div class="stat-label">Weeds Identified</div>
                                </div>
                            </div>

                            <div class="row mt-3">
                                <div class="col-md-12">
                                    <div class="card">
                                        <div class="card-header bg-light">
                                            <h4 class="mb-0"><i class="fas fa-chart-bar me-2"></i>Detailed Statistics</h4>
                                        </div>
                                        <div class="card-body">
                                            <!-- Weed Density Progress Bar -->
                                            <div class="mb-3">
                                                <h5>Weed Density</h5>
                                                <div id="weedDensity"></div>
                                                <small class="text-muted">Percentage of weeds among all detected plants</small>
                                            </div>

                                            <!-- Detailed Stats Cards -->
                                            <div id="detailedStats"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="results-section row g-4 mb-4">
                            <div class="col-md-6">
                                <div class="card result-card h-100">
                                    <div class="card-header bg-light">
                                        <h3 class="h5 mb-0">Original Image</h3>
                                    </div>
                                    <div class="card-body p-0">
                                        <div class="image-placeholder" id="originalImage">
                                            <i class="fas fa-image fa-4x text-muted mb-3"></i>
                                            <p class="text-muted">No image selected</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card result-card h-100">
                                    <div class="card-header bg-light">
                                        <h3 class="h5 mb-0">Detection Results</h3>
                                    </div>
                                    <div class="card-body p-0">
                                        <div class="image-placeholder" id="resultImage">
                                            <i class="fas fa-chart-bar fa-4x text-muted mb-3"></i>
                                            <p class="text-muted">Results will appear here</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="detection-results card shadow-sm">
                            <div class="card-header bg-light">
                                <h3 class="h5 mb-0"><i class="fas fa-list-alt me-2"></i>Detection Details</h3>
                            </div>
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-hover mb-0">
                                        <thead class="table-light">
                                            <tr>
                                                <th>Date</th>
                                                <th>Image</th>
                                                <th>Paddy</th> <!-- Changed from "Crops" to "Paddy" -->
                                                <th>Weeds</th>
                                                <th>Avg Confidence</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody id="resultsTableBody">
                                            <tr>
                                                <td colspan="5" class="text-center py-4">
                                                    <div class="no-results">
                                                        <i class="fas fa-info-circle fa-2x mb-2"></i>
                                                        <p class="mb-0">No detection results yet</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Analytics Dashboard Section -->
    <section id="analytics" class="container py-5">
        <div class="card shadow-sm mb-5">
            <div class="card-header bg-success text-white">
                <h2 class="h4 mb-0"><i class="fas fa-chart-pie me-2"></i>Detection Analytics</h2>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <div class="chart-container" style="position: relative; height:300px;">
                            <canvas id="detectionChart"></canvas>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="chart-container" style="position: relative; height:300px;">
                            <canvas id="confidenceChart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="row mt-4">
                    <div class="col-md-12">
                        <h4 class="mb-3">Detection History</h4>

                        <div class="table-responsive">
                            <table class="table table-hover" id="historyTable">
                                <thead class="table-light">
                                    <tr>
                                        <th>Date</th>
                                        <th>Image</th>
                                        <th>Paddy</th>
                                        <th>Weeds</th>
                                        <th>Avg Confidence</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="historyBody">
                                    <!-- Will be populated by JavaScript -->
                                </tbody>
                            </table>
                            <button id="clearHistoryBtn" class="btn btn-sm btn-outline-danger">
                                <i class="fas fa-trash-alt me-1"></i> Clear History
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Recommendations Section -->
    <section id="recommendations" class="container mb-5">
        <div class="card shadow-sm">
            <div class="card-header bg-success text-white">
                <h2 class="h4 mb-0"><i class="fas fa-lightbulb me-2"></i>Agricultural Recommendations</h2>
            </div>
            <div class="card-body">
                <div id="recommendationsContent">
                    <div class="alert alert-info">
                        Upload and analyze an image to get personalized recommendations.
                    </div>
                    <div class="d-none" id="activeRecommendations">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card mb-3">
                                    <div class="card-header bg-light">
                                        <h5 class="mb-0">Weed Management</h5>
                                    </div>
                                    <div class="card-body" id="weedRecommendations">
                                        <!-- Will be populated by JavaScript -->
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card mb-3">
                                    <div class="card-header bg-light">
                                        <h5 class="mb-0">Paddy Health</h5>
                                    </div>
                                    <div class="card-body" id="cropRecommendations">
                                        <!-- Will be populated by JavaScript -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- How It Works Section -->
    <section id="how-it-works" class="bg-light py-5">
        <div class="container">
            <div class="text-center mb-5">
                <h2 class="display-5 fw-bold mb-3">How It Works</h2>
                <p class="lead">Simple steps to detect paddy and weeds</p>
            </div>
            <div class="row g-4">
                <div class="col-md-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body text-center p-4">
                            <i class="fas fa-upload fa-3x text-success mb-3"></i>
                            <h3 class="h5">Upload Image</h3>
                            <p class="text-muted">Simply drag and drop your agricultural image or click to browse files from your device.</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body text-center p-4">
                            <i class="fas fa-brain fa-3x text-success mb-3"></i>
                            <h3 class="h5">AI Analysis</h3>
                            <p class="text-muted">Our advanced AI processes the image to identify paddy and weeds with high accuracy.</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body text-center p-4">
                            <i class="fas fa-chart-bar fa-3x text-success mb-3"></i>
                            <h3 class="h5">Get Results</h3>
                            <p class="text-muted">View detailed detection results with confidence scores and bounding boxes.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section id="about" class="container py-5">
        <div class="row align-items-center">
            <div class="col-lg-6 mb-4 mb-lg-0">
                <img src="../assets/FARM.avif" alt="Farm field" class="img-fluid rounded shadow">
            </div>
            <div class="col-lg-6">
                <h2 class="display-5 fw-light mb-3">About paddyense</h2>
                <p>WeedSense is an advanced detection system designed to help farmers and agronomists quickly identify paddy and weeds in their fields. Our system uses cutting-edge computer vision algorithms to provide accurate, real-time analysis of field conditions.</p>
                <p>By leveraging the power of YOLOv5, we've created a solution that's both powerful and easy to use, helping agricultural professionals make better decisions about crop management and weed control.</p>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <?php include 'footer.php'; ?>

    <!-- Bootstrap JS Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <!-- jQuery -->
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script src="../static/js/script.js"></script>
</body>

</html>