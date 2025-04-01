<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Health Risk Analysis - CropSense</title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../static/css/style.css">
</head>

<body>
    <?php include 'navbar.php'; ?>

    <!-- Hero Section -->
    <section class="hero-section text-center bg-light py-4">
        <div class="container">
            <h1 class="display-4 fw-bold mb-3">Paddy Health Risk Analysis</h1>
            <p class="lead mb-4">Evaluate potential health concerns based on weed detection and crop analysis</p>
        </div>
    </section>

    <!-- Main Health Risk Section -->
    <section id="health-risk" class="container mb-5 py-3">
        <div class="row justify-content-center">
            <div class="col-lg-10">
                <div class="card shadow-sm">
                    <div class="card-header bg-success text-white">
                        <h2 class="h4 mb-0"><i class="fas fa-heartbeat me-2"></i>Health Risk Assessment</h2>
                    </div>
                    <div class="card-body">
                        <div id="loadingMessage" class="text-center p-4">
                            <p>Please select an analyzed image from the detection page to view health risk information.</p>
                            <a href="index.html" class="btn btn-success">
                                <i class="fas fa-arrow-left me-1"></i> Return to Detection
                            </a>
                        </div>

                        <div id="healthRiskData" class="d-none">
                            <!-- Risk Overview Section -->
                            <div class="mb-4">
                                <h3 class="h5 mb-3">Risk Overview</h3>
                                <div class="row g-3">
                                    <div class="col-md-4">
                                        <div class="card bg-light h-100">
                                            <div class="card-body text-center">
                                                <h4 class="h6 text-uppercase mb-2">Overall Risk Level</h4>
                                                <div id="overallRiskBadge" class="badge bg-success mb-2 p-2">Low Risk</div>
                                                <div id="overallRiskScore" class="display-6 mb-2">0</div>
                                                <p id="overallRiskDescription" class="small text-muted mb-0">No significant health risks detected</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card bg-light h-100">
                                            <div class="card-body text-center">
                                                <h4 class="h6 text-uppercase mb-2">Weed Infestation</h4>
                                                <div id="weedRiskBadge" class="badge bg-success mb-2 p-2">Low</div>
                                                <div class="progress mb-2" style="height: 10px;">
                                                    <div id="weedRiskProgress" class="progress-bar bg-success" role="progressbar" style="width: 10%;" aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                                <p id="weedRiskDescription" class="small text-muted mb-0">Low weed pressure detected</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card bg-light h-100">
                                            <div class="card-body text-center">
                                                <h4 class="h6 text-uppercase mb-2">Paddy Health</h4>
                                                <div id="cropHealthBadge" class="badge bg-success mb-2 p-2">Healthy</div>
                                                <div class="progress mb-2" style="height: 10px;">
                                                    <div id="cropHealthProgress" class="progress-bar bg-success" role="progressbar" style="width: 90%;" aria-valuenow="90" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                                <p id="cropHealthDescription" class="small text-muted mb-0">Paddy appear to be in good condition</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Detection Image Section -->
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-header bg-light">
                                            <h3 class="h5 mb-0">Detection Image</h3>
                                        </div>
                                        <div class="card-body p-2 text-center">
                                            <img id="detectionImage" src="" alt="Detection results" class="img-fluid">
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <div class="card-header bg-light">
                                            <h3 class="h5 mb-0">Detection Summary</h3>
                                        </div>
                                        <div class="card-body">
                                            <div class="row g-2">
                                                <div class="col-6">
                                                    <div class="border rounded p-2 text-center">
                                                        <p class="small text-muted mb-1">Paddy Detected</p>
                                                        <h4 id="cropsDetected" class="mb-0">0</h4>
                                                    </div>
                                                </div>
                                                <div class="col-6">
                                                    <div class="border rounded p-2 text-center">
                                                        <p class="small text-muted mb-1">Weeds Detected</p>
                                                        <h4 id="weedsDetected" class="mb-0">0</h4>
                                                    </div>
                                                </div>
                                                <div class="col-6">
                                                    <div class="border rounded p-2 text-center">
                                                        <p class="small text-muted mb-1">Weed-to-Crop Ratio</p>
                                                        <h4 id="weedCropRatio" class="mb-0">0%</h4>
                                                    </div>
                                                </div>
                                                <div class="col-6">
                                                    <div class="border rounded p-2 text-center">
                                                        <p class="small text-muted mb-1">Analysis Date</p>
                                                        <h4 id="analysisDate" class="mb-0 small">-</h4>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Detailed Risk Analysis -->
                            <div class="card shadow-sm mb-4">
                                <div class="card-header bg-light">
                                    <h3 class="h5 mb-0"><i class="fas fa-clipboard-list me-2"></i>Detailed Risk Analysis</h3>
                                </div>
                                <div class="card-body">
                                    <div class="table-responsive">
                                        <table class="table table-hover">
                                            <thead class="table-light">
                                                <tr>
                                                    <th>Risk Factor</th>
                                                    <th>Risk Level</th>
                                                    <th>Description</th>
                                                    <th>Recommendation</th>
                                                </tr>
                                            </thead>
                                            <tbody id="riskFactorsTable">
                                                <!-- Will be populated by JavaScript -->
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <!-- Intervention Recommendations -->
                            <div class="card shadow-sm">
                                <div class="card-header bg-light">
                                    <h3 class="h5 mb-0"><i class="fas fa-first-aid me-2"></i>Recommended Interventions</h3>
                                </div>
                                <div class="card-body">
                                    <div id="interventionsContent">
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

    <?php include 'footer.php'; ?>

    <!-- Bootstrap JS Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <!-- jQuery -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="../static/js/healthRisk.js"></script>
</body>

</html>