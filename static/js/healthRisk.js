// health-risk.js - Handles the health risk analysis functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if there's detection data in localStorage
    const detectionData = localStorage.getItem('detectionData');
    
    if (detectionData) {
        const data = JSON.parse(detectionData);
        console.log('Detection data:', data);
        displayHealthRiskAnalysis(data);
    } else {
        // No data available, keep the loading message visible
        document.getElementById('loadingMessage').classList.remove('d-none');
        document.getElementById('healthRiskData').classList.add('d-none');
    }
});

function displayHealthRiskAnalysis(data) {
    // Hide loading message and show health risk data
    document.getElementById('loadingMessage').classList.add('d-none');
    document.getElementById('healthRiskData').classList.remove('d-none');
    
    // Set the detection image
    document.getElementById('detectionImage').src = data.predicted;
    
    // Parse detection results
    const results = data.results;
    let cropCount = data.statistics.paddy_count;
    let weedCount = data.statistics.weed_count;
    
    // Update detection summary
    document.getElementById('cropsDetected').textContent = cropCount;
    document.getElementById('weedsDetected').textContent = weedCount;
    
    // Calculate weed-to-crop ratio
    let weedCropRatio = 0;
    if (cropCount > 0) {
        weedCropRatio = (weedCount / (cropCount + weedCount) * 100).toFixed(1);
    }
    document.getElementById('weedCropRatio').textContent = `${weedCropRatio}%`;
    
    // Set analysis date
    document.getElementById('analysisDate').textContent = new Date().toLocaleString();
    
    // Calculate risk level based on weed-to-crop ratio
    calculateRiskLevel(cropCount, weedCount, weedCropRatio);
    
    // Generate risk factors table
    generateRiskFactorsTable(cropCount, weedCount, weedCropRatio);
    
    // Generate intervention recommendations
    generateInterventionRecommendations(cropCount, weedCount, weedCropRatio);
}

function calculateRiskLevel(cropCount, weedCount, weedCropRatio) {
    // Determine weed infestation risk
    let weedRisk = 'Low';
    let weedRiskProgress = 10;
    let weedRiskClass = 'bg-success';
    let weedRiskDescription = 'Low weed pressure detected';
    
    if (weedCropRatio > 50) {
        weedRisk = 'Severe';
        weedRiskProgress = 90;
        weedRiskClass = 'bg-danger';
        weedRiskDescription = 'Critical weed infestation detected';
    } else if (weedCropRatio > 30) {
        weedRisk = 'High';
        weedRiskProgress = 70;
        weedRiskClass = 'bg-warning';
        weedRiskDescription = 'Significant weed pressure detected';
    } else if (weedCropRatio > 15) {
        weedRisk = 'Moderate';
        weedRiskProgress = 40;
        weedRiskClass = 'bg-info';
        weedRiskDescription = 'Moderate weed presence detected';
    }
    
    // Update weed risk UI elements
    document.getElementById('weedRiskBadge').textContent = weedRisk;
    document.getElementById('weedRiskBadge').className = `badge ${weedRiskClass} mb-2 p-2`;
    document.getElementById('weedRiskProgress').style.width = `${weedRiskProgress}%`;
    document.getElementById('weedRiskProgress').className = `progress-bar ${weedRiskClass}`;
    document.getElementById('weedRiskDescription').textContent = weedRiskDescription;
    
    // Determine crop health risk
    let cropHealth = 'Healthy';
    let cropHealthProgress = 90;
    let cropHealthClass = 'bg-success';
    let cropHealthDescription = 'Crops appear to be in good condition';
    
    if (weedCropRatio > 50) {
        cropHealth = 'Poor';
        cropHealthProgress = 20;
        cropHealthClass = 'bg-danger';
        cropHealthDescription = 'Crops at high risk due to weed competition';
    } else if (weedCropRatio > 30) {
        cropHealth = 'At Risk';
        cropHealthProgress = 40;
        cropHealthClass = 'bg-warning';
        cropHealthDescription = 'Crops potentially suffering from weed competition';
    } else if (weedCropRatio > 15) {
        cropHealth = 'Fair';
        cropHealthProgress = 70;
        cropHealthClass = 'bg-info';
        cropHealthDescription = 'Some impact on paddy health from weeds';
    }
    
    // Update crop health UI elements
    document.getElementById('cropHealthBadge').textContent = cropHealth;
    document.getElementById('cropHealthBadge').className = `badge ${cropHealthClass} mb-2 p-2`;
    document.getElementById('cropHealthProgress').style.width = `${cropHealthProgress}%`;
    document.getElementById('cropHealthProgress').className = `progress-bar ${cropHealthClass}`;
    document.getElementById('cropHealthDescription').textContent = cropHealthDescription;
    
    // Calculate overall risk score (0-100)
    let overallRiskScore = 0;
    if (weedCropRatio > 0) {
        overallRiskScore = Math.min(Math.round(weedCropRatio * 1.5), 100);
    }
    
    // Determine overall risk level
    let overallRisk = 'Low Risk';
    let overallRiskClass = 'bg-success';
    let overallRiskDescription = 'No significant health risks detected';
    
    if (overallRiskScore > 75) {
        overallRisk = 'Critical Risk';
        overallRiskClass = 'bg-danger';
        overallRiskDescription = 'Immediate intervention required';
    } else if (overallRiskScore > 50) {
        overallRisk = 'High Risk';
        overallRiskClass = 'bg-warning';
        overallRiskDescription = 'Significant risk to paddy health and yield';
    } else if (overallRiskScore > 25) {
        overallRisk = 'Moderate Risk';
        overallRiskClass = 'bg-info';
        overallRiskDescription = 'Some risk factors present';
    }
    
    // Update overall risk UI elements
    document.getElementById('overallRiskBadge').textContent = overallRisk;
    document.getElementById('overallRiskBadge').className = `badge ${overallRiskClass} mb-2 p-2`;
    document.getElementById('overallRiskScore').textContent = overallRiskScore;
    document.getElementById('overallRiskDescription').textContent = overallRiskDescription;
}

function generateRiskFactorsTable(cropCount, weedCount, weedCropRatio) {
    const riskFactors = [
        {
            factor: 'Weed Competition',
            level: getRiskLevel(weedCropRatio, 15, 30, 50),
            description: 'Competition for nutrients, water, and sunlight',
            recommendation: getWeedCompetitionRecommendation(weedCropRatio)
        },
        {
            factor: 'Paddy Density',
            level: getCropDensityRiskLevel(cropCount),
            description: 'Evaluation of paddy population density',
            recommendation: getCropDensityRecommendation(cropCount)
        },
        {
            factor: 'Potential Yield Loss',
            level: getRiskLevel(weedCropRatio, 15, 30, 50),
            description: 'Estimated impact on harvest yield',
            recommendation: getYieldLossRecommendation(weedCropRatio)
        },
        {
            factor: 'Herbicide Resistance Risk',
            level: getHerbicideResistanceRisk(weedCount, weedCropRatio),
            description: 'Risk of developing herbicide resistance',
            recommendation: getHerbicideResistanceRecommendation(weedCount, weedCropRatio)
        },
        {
            factor: 'Soil Health Impact',
            level: getSoilHealthRisk(weedCount, weedCropRatio),
            description: 'Impact on soil nutrients and structure',
            recommendation: getSoilHealthRecommendation(weedCount, weedCropRatio)
        }
    ];
    
    const tableBody = document.getElementById('riskFactorsTable');
    tableBody.innerHTML = '';
    
    riskFactors.forEach(risk => {
        const row = document.createElement('tr');
        
        const factorCell = document.createElement('td');
        factorCell.textContent = risk.factor;
        
        const levelCell = document.createElement('td');
        const levelBadge = document.createElement('span');
        levelBadge.className = `badge ${getRiskBadgeClass(risk.level)} me-2`;
        levelBadge.textContent = risk.level;
        levelCell.appendChild(levelBadge);
        
        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = risk.description;
        
        const recommendationCell = document.createElement('td');
        recommendationCell.textContent = risk.recommendation;
        
        row.appendChild(factorCell);
        row.appendChild(levelCell);
        row.appendChild(descriptionCell);
        row.appendChild(recommendationCell);
        
        tableBody.appendChild(row);
    });
}

function generateInterventionRecommendations(cropCount, weedCount, weedCropRatio) {
    const interventionsContent = document.getElementById('interventionsContent');
    interventionsContent.innerHTML = '';
    
    // Create recommendations based on risk level
    let recommendations = [];
    
    if (weedCropRatio > 50) {
        recommendations = [
            {
                title: 'Immediate Herbicide Application',
                content: 'Apply a broad-spectrum herbicide as soon as possible to prevent further paddy damage. Consider consulting with an agronomist to select the most effective product.',
                icon: 'fa-spray-can',
                priority: 'high'
            },
            {
                title: 'Manual Weed Removal',
                content: 'For severely affected areas, consider manual weed removal to immediately reduce competition with crops.',
                icon: 'fa-hands',
                priority: 'high'
            },
            {
                title: 'Soil Testing',
                content: 'Conduct soil tests to assess nutrient depletion and adjust fertilization accordingly.',
                icon: 'fa-flask',
                priority: 'medium'
            },
            {
                title: 'Paddy Health Assessment',
                content: 'Evaluate paddy stress levels and consider supplemental irrigation or fertilization to support recovery.',
                icon: 'fa-seedling',
                priority: 'medium'
            }
        ];
    } else if (weedCropRatio > 30) {
        recommendations = [
            {
                title: 'Targeted Herbicide Application',
                content: 'Apply selective herbicides to control the weed population while minimizing impact on crops.',
                icon: 'fa-spray-can',
                priority: 'medium'
            },
            {
                title: 'Increased Monitoring',
                content: 'Schedule weekly field inspections to track weed growth patterns and paddy response.',
                icon: 'fa-search',
                priority: 'medium'
            },
            {
                title: 'Consider Inter-row Cultivation',
                content: 'Mechanical cultivation between paddy rows may help reduce weed pressure.',
                icon: 'fa-tractor',
                priority: 'medium'
            }
        ];
    } else if (weedCropRatio > 15) {
        recommendations = [
            {
                title: 'Preventative Herbicide Application',
                content: 'Apply a light herbicide treatment to prevent weed population growth.',
                icon: 'fa-spray-can',
                priority: 'low'
            },
            {
                title: 'Regular Monitoring',
                content: 'Continue monitoring fields for changes in weed population.',
                icon: 'fa-search',
                priority: 'low'
            }
        ];
    } else {
        recommendations = [
            {
                title: 'Routine Monitoring',
                content: 'Maintain standard field observation schedules.',
                icon: 'fa-eye',
                priority: 'low'
            },
            {
                title: 'Preventative Practices',
                content: 'Continue implementing good agricultural practices like paddy rotation and proper field margin management.',
                icon: 'fa-sync',
                priority: 'low'
            }
        ];
    }
    
    // Create recommendation cards
    const row = document.createElement('div');
    row.className = 'row g-3';
    
    recommendations.forEach(rec => {
        const col = document.createElement('div');
        col.className = 'col-md-6';
        
        const card = document.createElement('div');
        card.className = 'card h-100';
        if (rec.priority === 'high') {
            card.classList.add('border-danger');
        } else if (rec.priority === 'medium') {
            card.classList.add('border-warning');
        }
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        
        // Create priority badge if needed
        if (rec.priority !== 'low') {
            const priorityBadge = document.createElement('span');
            priorityBadge.className = `badge float-end ${rec.priority === 'high' ? 'bg-danger' : 'bg-warning'}`;
            priorityBadge.textContent = `${rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)} Priority`;
            cardBody.appendChild(priorityBadge);
        }
        
        // Create title with icon
        const title = document.createElement('h4');
        title.className = 'h5 mb-3';
        
        const icon = document.createElement('i');
        icon.className = `fas ${rec.icon} me-2`;
        
        title.appendChild(icon);
        title.appendChild(document.createTextNode(rec.title));
        
        // Create content
        const content = document.createElement('p');
        content.className = 'mb-0';
        content.textContent = rec.content;
        
        // Append elements
        cardBody.appendChild(title);
        cardBody.appendChild(content);
        card.appendChild(cardBody);
        col.appendChild(card);
        row.appendChild(col);
    });
    
    interventionsContent.appendChild(row);
}

// Helper functions for risk assessment
function getRiskLevel(value, moderateThreshold, highThreshold, criticalThreshold) {
    if (value > criticalThreshold) return 'Critical';
    if (value > highThreshold) return 'High';
    if (value > moderateThreshold) return 'Moderate';
    return 'Low';
}

function getRiskBadgeClass(level) {
    switch (level) {
        case 'Critical': return 'bg-danger';
        case 'High': return 'bg-warning';
        case 'Moderate': return 'bg-info';
        default: return 'bg-success';
    }
}

function getCropDensityRiskLevel(cropCount) {
    if (cropCount < 3) return 'Critical';
    if (cropCount < 5) return 'High';
    if (cropCount < 8) return 'Moderate';
    return 'Low';
}

function getWeedCompetitionRecommendation(weedCropRatio) {
    if (weedCropRatio > 50) {
        return 'Immediate weed control action required';
    } else if (weedCropRatio > 30) {
        return 'Schedule weed control within 7 days';
    } else if (weedCropRatio > 15) {
        return 'Monitor and plan for weed control measures';
    } else {
        return 'Continue regular monitoring';
    }
}

function getCropDensityRecommendation(cropCount) {
    if (cropCount < 3) {
        return 'Consider replanting or supplemental seeding';
    } else if (cropCount < 5) {
        return 'Provide additional nutrients to support existing crops';
    } else if (cropCount < 8) {
        return 'Monitor for adequate spacing and growth';
    } else {
        return 'Maintain current management practices';
    }
}

function getYieldLossRecommendation(weedCropRatio) {
    if (weedCropRatio > 50) {
        return 'Expect >30% yield reduction without intervention';
    } else if (weedCropRatio > 30) {
        return 'Potential 15-30% yield impact if untreated';
    } else if (weedCropRatio > 15) {
        return 'Possible 5-15% yield impact';
    } else {
        return 'Minimal impact on yield expected';
    }
}

function getHerbicideResistanceRisk(weedCount, weedCropRatio) {
    if (weedCount > 10 && weedCropRatio > 40) {
        return 'High';
    } else if (weedCount > 5 && weedCropRatio > 25) {
        return 'Moderate';
    } else {
        return 'Low';
    }
}

function getHerbicideResistanceRecommendation(weedCount, weedCropRatio) {
    if (weedCount > 10 && weedCropRatio > 40) {
        return 'Use herbicide rotation and integrated weed management';
    } else if (weedCount > 5 && weedCropRatio > 25) {
        return 'Consider alternating herbicide modes of action';
    } else {
        return 'Follow standard resistance management practices';
    }
}

function getSoilHealthRisk(weedCount, weedCropRatio) {
    if (weedCount > 12 && weedCropRatio > 45) {
        return 'High';
    } else if (weedCount > 7 && weedCropRatio > 30) {
        return 'Moderate';
    } else {
        return 'Low';
    }
}

function getSoilHealthRecommendation(weedCount, weedCropRatio) {
    if (weedCount > 12 && weedCropRatio > 45) {
        return 'Conduct soil tests and consider amendments';
    } else if (weedCount > 7 && weedCropRatio > 30) {
        return 'Monitor soil nutrient levels';
    } else {
        return 'Maintain standard soil health practices';
    }
}