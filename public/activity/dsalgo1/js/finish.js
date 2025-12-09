// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const printResultsBtn = document.getElementById('printResultsBtn');
const downloadResultsBtn = document.getElementById('downloadResultsBtn');
const bonusNote = document.getElementById('bonusNote');

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
    excellent: 0.9,  // 90% and above
    good: 0.75,      // 75% to 89%
    average: 0.6,    // 60% to 74%
    poor: 0         // Below 60%
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Prevent access if no student ID in sessionStorage
    if (!sessionStorage.getItem('studentIDNumber')) {
        alert("You must log in with your student ID to access this page.");
        window.location.href = "/activity/dsalgo1/dsalgo1-finals-info.html";
        return;
    }

    // Prevent back navigation
    history.pushState(null, null, location.href);
    window.onpopstate = function() {
        history.go(1);
        showAlert("You cannot go back after submitting your exam.");
    };

    // Show loading overlay
    loadingOverlay.style.display = 'flex';

    // Load scores and populate the page
    populateScores();
    
    // Set submission time
    const now = new Date();
    document.getElementById('submissionTimeDisplay').textContent = 
        now.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

    // Event Listeners
    printResultsBtn.addEventListener('click', handlePrintResults);
    downloadResultsBtn.addEventListener('click', handleDownloadResults);
});

// Show alert function
function showAlert(message, type = 'warning') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

// Populate scores from server
async function populateScores() {
    const studentID = sessionStorage.getItem('studentIDNumber');
    const examID = "dsalgo1-finals";
    
    if (!studentID) {
        showAlert("Student ID not found. Please log in again.", "error");
        return;
    }

    try {
        const res = await fetch('/api/activity/dsalgo1-finals/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'load',
                examID,
                studentIDNumber: studentID
            })
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        
        if (data.success && data.data) {
            displayStudentInfo(data.data);
            displayScores(data.data.answers || {});
            hideLoading();
        } else {
            throw new Error(data.message || 'Failed to load results');
        }
    } catch (err) {
        console.error('Error loading scores:', err);
        showAlert('Unable to load results. Please try again later.', 'error');
        hideLoading();
    }
}

// Display student information
function displayStudentInfo(data) {
    document.getElementById('studentIDNumberDisplay').textContent = 
        data.studentIDNumber || '[Not found]';
    
    document.getElementById('studentNameDisplay').textContent = 
        [data.firstName, data.lastName].filter(Boolean).join(' ') || '[Not found]';
    
    document.getElementById('sectionDisplay').textContent = 
        data.section || '[Not found]';
}

// Display scores and calculate performance
function displayScores(answers) {
    const scores = {
        part1: parseInt(answers['score_part1']) || 0,
        part2: parseInt(answers['score_part2']) || 0,
        part3: parseInt(answers['score_part3']) || 0,
        part4Raw: parseInt(answers['score_part4_raw']) || 0,
        part4Max: parseInt(answers['score_part4_max']) || 0,
        part4Scaled: parseInt(answers['score']) || 0
    };

    // Display individual scores
    document.getElementById('score-part1').textContent = scores.part1;
    document.getElementById('score-part2').textContent = scores.part2;
    document.getElementById('score-part3').textContent = scores.part3;
    
    // Display Part 4 score
    let part4Display = `${scores.part4Scaled} / 50`;
    if (scores.part4Raw > 0) {
        part4Display += ` (Raw: ${scores.part4Raw} / ${scores.part4Max})`;
    }
    document.getElementById('score-part4').textContent = part4Display;

    // Display Part 4 details
    if (scores.part4Raw > 0) {
        const part4Details = document.getElementById('part4-details');
        part4Details.innerHTML = `
            <h3><i class="fas fa-info-circle"></i> Part 4 Details</h3>
            <p>Raw score: <strong>${scores.part4Raw} / ${scores.part4Max}</strong></p>
            <p>Scaled to: <strong>${scores.part4Scaled} / 50</strong> (${((scores.part4Scaled/50)*100).toFixed(1)}%)</p>
            <p>Extra points are counted as bonus if the raw score exceeds 50.</p>
        `;
    }

    // Calculate total
    let total = scores.part1 + scores.part2 + scores.part3 + scores.part4Scaled;
    document.getElementById('score-total').textContent = total;

    // Show bonus note if total > 115
    if (total > 115) {
        const bonusPoints = total - 115;
        bonusNote.innerHTML = `
            <i class="fas fa-star"></i>
            <span>Excellent! You earned <strong>${bonusPoints.toFixed(2)} bonus points</strong> beyond the maximum score!</span>
        `;
        bonusNote.style.display = 'flex';
        
        // Animate the total score
        document.getElementById('score-total').classList.add('bonus-animation');
    }

    // Calculate and display performance indicators
    calculatePerformance(scores);
    
    // Add data labels for responsive tables
    addDataLabels();
}

// Calculate performance indicators
function calculatePerformance(scores) {
    const maxScores = {
        part1: 30,
        part2: 10,
        part3: 25,
        part4: 50
    };

    const performances = {
        part1: scores.part1 / maxScores.part1,
        part2: scores.part2 / maxScores.part2,
        part3: scores.part3 / maxScores.part3,
        part4: scores.part4Scaled / maxScores.part4
    };

    Object.entries(performances).forEach(([part, percentage]) => {
        const element = document.getElementById(`performance-${part}`);
        let performanceClass = '';
        let performanceText = '';

        if (percentage >= PERFORMANCE_THRESHOLDS.excellent) {
            performanceClass = 'performance-excellent';
            performanceText = 'Excellent';
        } else if (percentage >= PERFORMANCE_THRESHOLDS.good) {
            performanceClass = 'performance-good';
            performanceText = 'Good';
        } else if (percentage >= PERFORMANCE_THRESHOLDS.average) {
            performanceClass = 'performance-average';
            performanceText = 'Average';
        } else {
            performanceClass = 'performance-poor';
            performanceText = 'Needs Improvement';
        }

        element.className = `performance-indicator ${performanceClass}`;
        element.textContent = `${(percentage * 100).toFixed(1)}% - ${performanceText}`;
    });
}

// Add data labels for responsive tables
function addDataLabels() {
    const cells = document.querySelectorAll('.results-table td');
    const headers = document.querySelectorAll('.results-table th');
    
    cells.forEach((cell, index) => {
        const headerIndex = index % headers.length;
        if (headers[headerIndex]) {
            cell.setAttribute('data-label', headers[headerIndex].textContent);
        }
    });
}

// Handle print results
function handlePrintResults() {
    window.print();
}

// Handle download results
function handleDownloadResults(e) {
    e.preventDefault();
    showAlert('PDF download feature coming soon!', 'info');
}

// Hide loading overlay
function hideLoading() {
    setTimeout(() => {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 300);
    }, 500);
}

// Add alert styles dynamically
const alertStyles = document.createElement('style');
alertStyles.textContent = `
    .alert {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    
    .alert-warning {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
    }
    
    .alert-error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    
    .alert-info {
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
    }
    
    .alert button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        margin-left: auto;
        color: inherit;
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;

document.head.appendChild(alertStyles);
