// /activity/dsalgo1/js/part2.js - Enhanced with UI/UX features

// Constants
const TOTAL_ITEMS = 10;
const ANSWER_KEY = {
    m1: 'A', // Vertex → A. A point or node that represents an object
    m2: 'B', // Edge → B. A connection between two vertices
    m3: 'C', // Path → C. A sequence of vertices connected by edges
    m4: 'D', // Cycle → D. A path where first and last vertex are the same
    m5: 'E', // Weighted edge → E. Edge with cost/time/distance stored
    m6: 'F', // Kruskal → F. Picks edges by increasing weight, skips cycles
    m7: 'G', // Prim → G. Grows tree by attaching cheapest edge to a new vertex
    m8: 'H', // BFS undirected → H. Level-by-level search
    m9: 'I', // BFS directed → I. Same BFS but only using outgoing edges
    m10: 'J' // MCST → J. Connects all vertices with minimum total cost
};

// State management
let currentAnswers = {};
let autoSaveInterval;
let isSubmitting = false;
let lastSaveTime = null;

// Initialize the exam
function initExam() {
    // Setup safety defaults for tab monitor
    if (typeof window.tabSwitchCount === 'undefined') {
        window.tabSwitchCount = 0;
    }
    if (typeof window.tabSwitchTimestamps === 'undefined') {
        window.tabSwitchTimestamps = [];
    }
    if (typeof window.isNavigatingAway === 'undefined') {
        window.isNavigatingAway = false;
    }
    
    // Shuffle dropdown options
    for (let i = 1; i <= 10; i++) {
        shuffleOptions(`m${i}`, i <= 5);
    }
    
    // Setup event listeners
    setupAnswerListeners();
    setupKeyboardShortcuts();
    setupReviewButton();
    
    // Load any saved answers from localStorage
    loadFromLocalStorage();
    
    // Start auto-save interval (every 30 seconds)
    autoSaveInterval = setInterval(() => {
        if (Object.keys(currentAnswers).length > 0) {
            saveProgressToServer(true);
        }
    }, 30000);
    
    console.log('Enhanced DSALGO1 Finals Part 2 initialized');
}

// Fisher-Yates shuffle for dropdown options
function shuffleOptions(selectId, isSectionA = true) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const options = Array.from(select.options);
    const firstOption = options[0]; // "Select letter"
    const rest = options.slice(1);
    
    // Fisher-Yates shuffle
    for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    
    select.innerHTML = '';
    select.appendChild(firstOption);
    rest.forEach(opt => select.appendChild(opt));
}

// Setup answer change listeners
function setupAnswerListeners() {
    for (let i = 1; i <= TOTAL_ITEMS; i++) {
        const select = document.getElementById(`m${i}`);
        if (select) {
            select.addEventListener('change', function() {
                const value = this.value.trim().toUpperCase();
                const name = this.name;
                
                // Update visual selection
                this.classList.toggle('selected', value !== '');
                
                // Update current answers
                if (value) {
                    currentAnswers[name] = value;
                } else {
                    delete currentAnswers[name];
                }
                
                // Update progress
                updateProgress();
                
                // Save to localStorage
                saveToLocalStorage();
                
                // Show feedback for correct/incorrect (optional)
                if (value) {
                    const isCorrect = ANSWER_KEY[name] === value;
                    const row = this.closest('tr');
                    if (row) {
                        row.style.animation = `none`;
                        void row.offsetWidth; // Trigger reflow
                        row.style.animation = `${isCorrect ? 'correctAnswer' : 'incorrectAnswer'} 0.5s ease`;
                    }
                }
                
                // Auto-save to server after 1.5 seconds
                clearTimeout(window.autoSaveTimeout);
                window.autoSaveTimeout = setTimeout(() => {
                    saveProgressToServer(true);
                }, 1500);
            });
        }
    }
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveProgressToServer();
        }
        
        // Tab to navigate between dropdowns
        if (e.key === 'Tab' && e.target.tagName === 'SELECT') {
            e.preventDefault();
            const currentSelect = e.target;
            const allSelects = Array.from(document.querySelectorAll('select'));
            const currentIndex = allSelects.indexOf(currentSelect);
            const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
            
            if (nextIndex >= 0 && nextIndex < allSelects.length) {
                allSelects[nextIndex].focus();
            }
        }
        
        // Escape to clear selection
        if (e.key === 'Escape' && e.target.tagName === 'SELECT') {
            e.target.value = '';
            e.target.dispatchEvent(new Event('change'));
        }
    });
}

// Update progress display
function updateProgress() {
    const answeredCount = Object.keys(currentAnswers).length;
    const percentage = Math.round((answeredCount / TOTAL_ITEMS) * 100);
    
    // Update counters
    const answeredElement = document.getElementById('answeredCount');
    const percentageElement = document.getElementById('progressPercentage');
    const progressFill = document.getElementById('progressFill');
    
    if (answeredElement) answeredElement.textContent = answeredCount;
    if (percentageElement) percentageElement.textContent = `${percentage}%`;
    if (progressFill) progressFill.style.width = `${percentage}%`;
    
    // Update submit button
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        if (answeredCount === TOTAL_ITEMS) {
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> All Items Answered - Submit Part 2';
            submitBtn.classList.add('pulse');
        } else {
            submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> Save Part 2 and Go to Part 3 (${answeredCount}/${TOTAL_ITEMS})`;
            submitBtn.classList.remove('pulse');
        }
    }
    
    // Update section progress
    updateSectionProgress();
}

// Update progress for each section
function updateSectionProgress() {
    const sections = ['A', 'B'];
    sections.forEach((section, sectionIndex) => {
        const startItem = sectionIndex * 5 + 1;
        const endItem = startItem + 4;
        let answeredInSection = 0;
        
        for (let i = startItem; i <= endItem; i++) {
            if (currentAnswers[`m${i}`]) {
                answeredInSection++;
            }
        }
        
        const sectionProgress = document.querySelector(`#section-${section.toLowerCase()} .section-progress`);
        if (sectionProgress) {
            sectionProgress.textContent = `${answeredInSection}/5 answered`;
        }
    });
}

// Show message to user
function showMessage(text, type = 'info', duration = 5000) {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;
    
    // Clear existing classes
    messageDiv.className = 'message';
    
    // Set new content and class
    messageDiv.innerHTML = `<span>${text}</span>`;
    messageDiv.classList.add(type);
    
    // Auto-hide if duration is specified
    if (duration) {
        setTimeout(() => {
            messageDiv.className = 'message';
        }, duration);
    }
}

// Save progress to server
async function saveProgressToServer(isAutoSave = false) {
    const storedID = sessionStorage.getItem('studentIDNumber');
    const examID = document.getElementById('examID')?.value || 'dsalgo1-finals';
    
    if (!storedID) return null;
    
    const { score } = calculateScore();
    const payload = {
        action: 'save',
        examID,
        studentIDNumber: storedID,
        pageNumber: 2,
        answers: { ...currentAnswers, score_part2: score },
        tabSwitchCount: window.tabSwitchCount || 0,
        tabSwitchTimestamps: window.tabSwitchTimestamps || []
    };
    
    try {
        const res = await fetch('/api/activity/dsalgo1-finals/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (data.success) {
            lastSaveTime = new Date();
            if (!isAutoSave) {
                showMessage('Progress saved successfully!', 'success');
            }
            return data;
        } else {
            if (!isAutoSave) {
                showMessage(data.message || 'Failed to save. Please try again.', 'error');
            }
            return null;
        }
    } catch (err) {
        console.error('Save error:', err);
        if (!isAutoSave) {
            showMessage('Network error. Your answers are saved locally.', 'warning');
        }
        return null;
    }
}

// Calculate score
function calculateScore() {
    let score = 0;
    for (let i = 1; i <= TOTAL_ITEMS; i++) {
        const name = `m${i}`;
        if (currentAnswers[name] && currentAnswers[name] === ANSWER_KEY[name]) {
            score++;
        }
    }
    return { score, total: TOTAL_ITEMS };
}

// Save to localStorage as backup
function saveToLocalStorage() {
    try {
        const examID = document.getElementById('examID')?.value || 'dsalgo1-finals';
        const key = `${examID}_part2_answers`;
        localStorage.setItem(key, JSON.stringify(currentAnswers));
        localStorage.setItem(`${examID}_part2_lastSave`, new Date().toISOString());
    } catch (e) {
        console.error('Local storage save failed:', e);
    }
}

// Load from localStorage backup
function loadFromLocalStorage() {
    try {
        const examID = document.getElementById('examID')?.value || 'dsalgo1-finals';
        const saved = localStorage.getItem(`${examID}_part2_answers`);
        if (saved) {
            const loadedAnswers = JSON.parse(saved);
            Object.assign(currentAnswers, loadedAnswers);
            
            // Restore dropdown selections
            Object.entries(loadedAnswers).forEach(([name, value]) => {
                const select = document.querySelector(`select[name="${name}"]`);
                if (select) {
                    select.value = value;
                    select.classList.add('selected');
                }
            });
            
            updateProgress();
            showMessage('Previously saved answers loaded', 'success', 3000);
        }
    } catch (e) {
        console.error('Local storage load failed:', e);
    }
}

// Load student data and answers from server
async function loadStudentData() {
    const storedID = sessionStorage.getItem('studentIDNumber');
    const examID = document.getElementById('examID')?.value || 'dsalgo1-finals';
    
    if (!storedID) return;
    
    const idSpan = document.getElementById('studentIDNumberDisplay');
    const nameSpan = document.getElementById('studentNameDisplay');
    const sectionSpan = document.getElementById('sectionDisplay');
    
    if (idSpan) {
        idSpan.textContent = storedID;
    }
    
    try {
        const res = await fetch('/api/activity/dsalgo1-finals/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'load',
                examID,
                studentIDNumber: storedID
            })
        });
        
        const data = await res.json();
        
        if (data.success && data.data) {
            const doc = data.data;
            const fullName = [doc.firstName, doc.lastName].filter(Boolean).join(' ');
            
            if (nameSpan) nameSpan.textContent = fullName || '[name not set]';
            if (sectionSpan) sectionSpan.textContent = doc.section || '[section not set]';
            
            // Load server answers if they exist
            if (doc.answers && typeof doc.answers === 'object') {
                Object.entries(doc.answers).forEach(([key, value]) => {
                    if (key.startsWith('m') && key !== 'score_part2') {
                        const select = document.querySelector(`select[name="${key}"]`);
                        if (select) {
                            select.value = value;
                            select.classList.add('selected');
                            currentAnswers[key] = value;
                        }
                    }
                });
                
                updateProgress();
                showMessage('Answers loaded from server', 'success', 3000);
            }
        } else {
            if (nameSpan) nameSpan.textContent = '[not found]';
            if (sectionSpan) sectionSpan.textContent = '[not found]';
        }
    } catch (err) {
        console.error('Error loading student info:', err);
        if (nameSpan) nameSpan.textContent = '[error loading]';
        if (sectionSpan) sectionSpan.textContent = '[error loading]';
    }
}

// Review answers functionality
function setupReviewButton() {
    const reviewBtn = document.getElementById('reviewBtn');
    if (!reviewBtn) return;
    
    reviewBtn.addEventListener('click', function() {
        const unanswered = [];
        for (let i = 1; i <= TOTAL_ITEMS; i++) {
            if (!currentAnswers[`m${i}`]) {
                unanswered.push(i);
            }
        }
        
        if (unanswered.length === 0) {
            showMessage('All items have been answered!', 'success');
        } else {
            showMessage(
                `You have ${unanswered.length} unanswered items: ${unanswered.join(', ')}`,
                'warning'
            );
            
            // Scroll to first unanswered item
            if (unanswered.length > 0) {
                const firstUnanswered = document.getElementById(`m${unanswered[0]}`);
                if (firstUnanswered) {
                    firstUnanswered.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstUnanswered.focus();
                }
            }
        }
    });
}

// Submit part 2
async function submitPart2() {
    if (isSubmitting) return;
    
    const storedID = sessionStorage.getItem('studentIDNumber');
    if (!storedID) {
        showMessage('No student ID found. Please return to the information page.', 'error');
        return;
    }
    
    // Check if all items answered
    const unanswered = [];
    for (let i = 1; i <= TOTAL_ITEMS; i++) {
        if (!currentAnswers[`m${i}`]) {
            unanswered.push(i);
        }
    }
    
    if (unanswered.length > 0) {
        const proceed = confirm(
            `You have ${unanswered.length} unanswered items.\n\n` +
            `Unanswered: ${unanswered.join(', ')}\n\n` +
            `Are you sure you want to submit?`
        );
        
        if (!proceed) {
            return;
        }
    }
    
    isSubmitting = true;
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Submitting...';
    }
    
    // Final save
    const result = await saveProgressToServer();
    
    if (result?.success) {
        showMessage('Part 2 submitted successfully! Redirecting to Part 3...', 'success');
        
        // Mark navigation
        window.isNavigatingAway = true;
        
        // Clear auto-save interval
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
        }
        
        // Reset tab monitor if function exists
        if (typeof window.resetTabMonitor === 'function') {
            window.resetTabMonitor();
        }
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = '/activity/dsalgo1/dsalgo1-finals-part3.html';
        }, 2000);
    } else {
        showMessage('Submission failed. Please try again.', 'error');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Save Part 2 and Go to Part 3';
        }
        isSubmitting = false;
    }
}

// Setup back button functionality
function setupBackButton() {
    const backLink = document.querySelector('a.button-link[href*="dsalgo1-finals-part1"]');
    if (backLink) {
        backLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Save current progress before leaving
            saveProgressToServer().then(() => {
                window.isNavigatingAway = true;
                if (typeof window.resetTabMonitor === 'function') {
                    window.resetTabMonitor();
                }
                window.location.href = this.href;
            });
        });
    }
}

// Main initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check if student is logged in
    if (!sessionStorage.getItem('studentIDNumber')) {
        alert("You must log in with your student ID to access this page.");
        window.location.href = "/activity/dsalgo1/dsalgo1-finals-info.html";
        return;
    }
    
    // Initialize exam features
    initExam();
    
    // Load student data and server answers
    loadStudentData();
    
    // Setup back button
    setupBackButton();
    
    // Setup form submission
    const form = document.getElementById('part2Form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitPart2();
        });
    }
    
    // Warn before leaving page
    window.addEventListener('beforeunload', (e) => {
        if (!window.isNavigatingAway && Object.keys(currentAnswers).length > 0) {
            e.preventDefault();
            e.returnValue = 'You have unsaved answers. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
});

// Cleanup on page unload
window.addEventListener('unload', () => {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
});
