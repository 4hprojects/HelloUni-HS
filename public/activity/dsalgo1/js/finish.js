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

// Debug mode
const DEBUG = true;

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

    // Load scores and populate the page
    populateScores();
    
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

// Debug logging function
function debugLog(message, data = null) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`, data || '');
    }
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
        debugLog("Fetching scores for student:", studentID);
        
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
        debugLog("Server response:", data);
        
        if (data.success && data.data) {
            displayStudentInfo(data.data);
            displayScores(data.data);
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
function displayScores(data) {
    debugLog("Display scores - Full data:", data);
    
    // Check different possible locations for scores
    const answers = data.answers || {};
    const scoresFromAnswers = data.scores || {};
    
    debugLog("Answers object:", answers);
    debugLog("Scores object:", scoresFromAnswers);
    
    // Try multiple possible key names for Part 4 scores
    let part4Scaled = 0;
    let part4Raw = 0;
    let part4Max = 50; // Default maximum
    
    // Try to find Part 4 scores in different locations
    const possibleKeys = [
        'score', 'score_part4', 'part4_score', 'adjacency_matrix_score',
        'scaled_score', 'final_score', 'total_score'
    ];
    
    for (const key of possibleKeys) {
        if (answers[key] !== undefined) {
            debugLog(`Found ${key}:`, answers[key]);
            part4Scaled = parseInt(answers[key]) || 0;
            break;
        }
        if (scoresFromAnswers[key] !== undefined) {
            debugLog(`Found ${key} in scores:`, scoresFromAnswers[key]);
            part4Scaled = parseInt(scoresFromAnswers[key]) || 0;
            break;
        }
    }
    
    // Look for raw score specifically
    const rawScoreKeys = ['score_part4_raw', 'raw_score', 'adjacency_raw'];
    for (const key of rawScoreKeys) {
        if (answers[key] !== undefined) {
            part4Raw = parseInt(answers[key]) || 0;
            debugLog(`Found raw score ${key}:`, part4Raw);
            break;
        }
    }
    
    // Look for max score
    const maxScoreKeys = ['score_part4_max', 'max_score', 'adjacency_max'];
    for (const key of maxScoreKeys) {
        if (answers[key] !== undefined) {
            part4Max = parseInt(answers[key]) || 50;
            debugLog(`Found max score ${key}:`, part4Max);
            break;
        }
    }
    
    // If no raw score found but we have scaled, try to reverse calculate
    if (part4Raw === 0 && part4Scaled > 0) {
        part4Raw = Math.round((part4Scaled / 50) * part4Max);
        debugLog("Calculated raw score from scaled:", part4Raw);
    }
    
    // Get other part scores with fallbacks
    const scores = {
        part1: parseInt(answers['score_part1']) || 
               parseInt(scoresFromAnswers['part1']) || 
               parseInt(scoresFromAnswers['score_part1']) || 0,
        part2: parseInt(answers['score_part2']) || 
               parseInt(scoresFromAnswers['part2']) || 
               parseInt(scoresFromAnswers['score_part2']) || 0,
        part3: parseInt(answers['score_part3']) || 
               parseInt(scoresFromAnswers['part3']) || 
               parseInt(scoresFromAnswers['score_part3']) || 0,
        part4Raw: part4Raw,
        part4Max: part4Max,
        part4Scaled: part4Scaled
    };
    
    debugLog("Parsed scores:", scores);
    
    // Display individual scores
    animateScoreDisplay('score-part1', scores.part1);
    animateScoreDisplay('score-part2', scores.part2);
    animateScoreDisplay('score-part3', scores.part3);
    animateScoreDisplay('score-part4', scores.part4Scaled);
    
    // Display Part 4 details
    if (scores.part4Scaled > 0 || scores.part4Raw > 0) {
        const part4Details = document.getElementById('part4-details');
        part4Details.innerHTML = `
            <h3><i class="fas fa-info-circle"></i> Part 4 - Adjacency Matrix Details</h3>
            <p><strong>Scaled Score:</strong> ${scores.part4Scaled} / 50</p>
            ${scores.part4Raw > 0 ? `
                <p><strong>Raw Score:</strong> ${scores.part4Raw} / ${scores.part4Max}</p>
                <p><strong>Scaling Factor:</strong> ${(scores.part4Scaled / scores.part4Raw * 50).toFixed(2)}x</p>
            ` : ''}
            <p><em>Note: Raw scores are scaled to fit the 50-point maximum for this section.</em></p>
        `;
        part4Details.style.display = 'block';
    } else {
        // Hide part4 details if no score
        document.getElementById('part4-details').style.display = 'none';
    }
    
    // Calculate totals
    const rawTotal = scores.part1 + scores.part2 + scores.part3 + scores.part4Raw;
    const finalTotal = scores.part1 + scores.part2 + scores.part3 + scores.part4Scaled;
    const percentage = ((finalTotal / 115) * 100).toFixed(1);
    
    debugLog("Totals - Raw:", rawTotal, "Final:", finalTotal, "Percentage:", percentage);
    
    // Animate total score display
    animateTotalScore(finalTotal);
    
    // Display score summary
    document.getElementById('raw-total').textContent = `${rawTotal} points`;
    document.getElementById('final-score').textContent = `${finalTotal} / 115`;
    document.getElementById('percentage-score').textContent = `${percentage}%`;
    
    // Show bonus note if total > 115
    if (finalTotal > 115) {
        const bonusPoints = finalTotal - 115;
        bonusNote.innerHTML = `
            <i class="fas fa-crown"></i>
            <span>Outstanding Performance! You earned <strong>${bonusPoints.toFixed(1)} bonus points</strong> (${(bonusPoints/115*100).toFixed(1)}%) beyond the maximum score!</span>
        `;
        bonusNote.style.display = 'flex';
        
        // Animate the total score
        document.getElementById('score-total').classList.add('bonus-animation');
    } else {
        bonusNote.style.display = 'none';
    }
    
    // Calculate and display performance indicators
    calculatePerformance(scores);
}

// Animate score display
function animateScoreDisplay(elementId, score) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element not found: ${elementId}`);
        return;
    }
    
    element.textContent = '0';
    element.classList.add('score-reveal');
    
    let current = 0;
    const increment = Math.max(score / 30, 0.1); // Adjust speed, minimum increment
    const timer = setInterval(() => {
        current += increment;
        if (current >= score) {
            current = score;
            clearInterval(timer);
            element.classList.remove('score-reveal');
        }
        element.textContent = Math.floor(current);
    }, 20);
}

// Animate total score display
function animateTotalScore(finalScore) {
    const element = document.getElementById('score-total');
    if (!element) {
        console.error('Total score element not found');
        return;
    }
    
    element.textContent = '0';
    
    let current = 0;
    const increment = Math.max(finalScore / 40, 0.1); // Adjust speed
    const timer = setInterval(() => {
        current += increment;
        if (current >= finalScore) {
            current = finalScore;
            clearInterval(timer);
            element.classList.add('score-reveal');
        }
        element.textContent = Math.floor(current);
    }, 20);
}

// Calculate performance indicators
function calculatePerformance(scores) {
    const maxScores = {
        part1: 30,
        part2: 10,
        part3: 25,
        part4: 50
    };
    
    const parts = ['part1', 'part2', 'part3', 'part4'];
    
    parts.forEach(part => {
        const element = document.getElementById(`performance-${part}`);
        if (!element) {
            console.warn(`Performance element not found: performance-${part}`);
            return;
        }
        
        const score = part === 'part4' ? scores.part4Scaled : scores[part];
        const maxScore = maxScores[part];
        const percentage = score / maxScore;
        
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
        element.textContent = `${performanceText} (${(percentage * 100).toFixed(1)}%)`;
        element.title = `Score: ${score}/${maxScore} - ${performanceText} Performance`;
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

// Debug function to check what's actually being returned from server
async function testServerResponse() {
    const studentID = sessionStorage.getItem('studentIDNumber');
    const examID = "dsalgo1-finals";
    
    console.log("=== TESTING SERVER RESPONSE ===");
    console.log("Student ID:", studentID);
    console.log("Exam ID:", examID);
    
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
        
        const data = await res.json();
        console.log("Full server response:", data);
        console.log("Data structure:", JSON.stringify(data, null, 2));
        
        if (data.data && data.data.answers) {
            console.log("Keys in answers:", Object.keys(data.data.answers));
            console.log("All answers:", data.data.answers);
        }
        
        return data;
    } catch (error) {
        console.error("Test failed:", error);
        return null;
    }
}

// Uncomment to test server response
// document.addEventListener('DOMContentLoaded', function() {
//     setTimeout(testServerResponse, 1000);
// });
