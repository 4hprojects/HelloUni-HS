// /activity/dsalgo1/js/part1.js - Enhanced with UI/UX features

// Constants
const TOTAL_QUESTIONS = 30;
const ANSWER_KEY = {
    q1: 'b', q2: 'b', q3: 'b', q4: 'd', q5: 'b',
    q6: 'c', q7: 'b', q8: 'c', q9: 'c', q10: 'b',
    q11: 'b', q12: 'c', q13: 'c', q14: 'b', q15: 'b',
    q16: 'b', q17: 'b', q18: 'b', q19: 'b', q20: 'c',
    q21: 'b', q22: 'b', q23: 'c', q24: 'b', q25: 'a',
    q26: 'c', q27: 'b', q28: 'b', q29: 'b', q30: 'b'
};

// State management
let currentAnswers = {};
let autoSaveInterval;
let isSubmitting = false;
let lastSaveTime = null;

// Fisher-Yates shuffle
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Randomize options
function randomizeQuestionOptions(questionEl) {
    if (!questionEl) return;

    const optionsContainer = questionEl.querySelector('.options');
    if (!optionsContainer) return;

    const optionElements = Array.from(optionsContainer.querySelectorAll('.option'));
    if (optionElements.length <= 1) return;

    const shuffled = shuffleArray(optionElements.slice());
    
    // Clear and reappend shuffled options
    shuffled.forEach(option => {
        optionsContainer.appendChild(option);
    });
}

// Compute score
function computeScore(answers) {
    let score = 0;
    for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
        const key = `q${i}`;
        if (answers[key] === ANSWER_KEY[key]) {
            score++;
        }
    }
    return { score, total: TOTAL_QUESTIONS };
}

// Update progress display
function updateProgress() {
    const answeredCount = Object.keys(currentAnswers).length;
    const percentage = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);
    
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
        if (answeredCount === TOTAL_QUESTIONS) {
            submitBtn.innerHTML = '✓ All Questions Answered - Submit Part 1';
            submitBtn.classList.add('pulse');
        } else {
            submitBtn.innerHTML = `Save Part 1 and Go to Part 2 (${answeredCount}/${TOTAL_QUESTIONS})`;
            submitBtn.classList.remove('pulse');
        }
    }
    
    // Update section progress
    updateSectionProgress();
}

// Update progress for each section
function updateSectionProgress() {
    const sections = ['A', 'B', 'C'];
    sections.forEach((section, sectionIndex) => {
        const startQuestion = sectionIndex * 10 + 1;
        const endQuestion = startQuestion + 9;
        let answeredInSection = 0;
        
        for (let i = startQuestion; i <= endQuestion; i++) {
            if (currentAnswers[`q${i}`]) {
                answeredInSection++;
            }
        }
        
        const sectionProgress = document.querySelector(`#section-${section.toLowerCase()} .section-progress`);
        if (sectionProgress) {
            sectionProgress.textContent = `${answeredInSection}/10 answered`;
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
    
    const { score } = computeScore(currentAnswers);
    const payload = {
        action: 'save',
        examID,
        studentIDNumber: storedID,
        pageNumber: 1,
        answers: { ...currentAnswers, score_part1: score },
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

// Save to localStorage as backup
function saveToLocalStorage() {
    try {
        const examID = document.getElementById('examID')?.value || 'dsalgo1-finals';
        const key = `${examID}_answers`;
        localStorage.setItem(key, JSON.stringify(currentAnswers));
        localStorage.setItem(`${examID}_lastSave`, new Date().toISOString());
    } catch (e) {
        console.error('Local storage save failed:', e);
    }
}

// Load from localStorage backup
function loadFromLocalStorage() {
    try {
        const examID = document.getElementById('examID')?.value || 'dsalgo1-finals';
        const saved = localStorage.getItem(`${examID}_answers`);
        if (saved) {
            const loadedAnswers = JSON.parse(saved);
            Object.assign(currentAnswers, loadedAnswers);
            
            // Restore radio selections
            Object.entries(loadedAnswers).forEach(([question, answer]) => {
                const radio = document.querySelector(`input[name="${question}"][value="${answer}"]`);
                if (radio) {
                    radio.checked = true;
                    radio.closest('.option')?.classList.add('selected');
                }
            });
            
            updateProgress();
            showMessage('Previously saved answers loaded', 'success', 3000);
        }
    } catch (e) {
        console.error('Local storage load failed:', e);
    }
}

// Setup answer change listeners
function setupAnswerListeners() {
    document.querySelectorAll('.option input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const option = this.closest('.option');
            const question = option.closest('.question');
            
            // Update visual selection
            question.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            option.classList.add('selected');
            
            // Update current answers
            currentAnswers[this.name] = this.value;
            
            // Update progress
            updateProgress();
            
            // Save to localStorage
            saveToLocalStorage();
            
            // Auto-save to server after 1.5 seconds
            clearTimeout(window.autoSaveTimeout);
            window.autoSaveTimeout = setTimeout(() => {
                saveProgressToServer(true);
            }, 1500);
        });
    });
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveProgressToServer();
        }
        
        // Number keys 1-4 for answer selection when focused on question
        if (e.target.closest('.question') && e.key >= '1' && e.key <= '4') {
            const question = e.target.closest('.question');
            const options = question.querySelectorAll('.option input[type="radio"]');
            const index = parseInt(e.key) - 1;
            
            if (options[index]) {
                options[index].checked = true;
                options[index].dispatchEvent(new Event('change'));
            }
        }
        
        // Spacebar to toggle selection (for accessibility)
        if (e.key === ' ' && e.target.closest('.option')) {
            e.preventDefault();
            const radio = e.target.closest('.option').querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        }
    });
}

// Review answers functionality
function setupReviewButton() {
    const reviewBtn = document.getElementById('reviewBtn');
    if (!reviewBtn) return;
    
    reviewBtn.addEventListener('click', function() {
        const unanswered = [];
        for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
            if (!currentAnswers[`q${i}`]) {
                unanswered.push(i);
            }
        }
        
        if (unanswered.length === 0) {
            showMessage('All questions have been answered!', 'success');
        } else {
            showMessage(
                `You have ${unanswered.length} unanswered questions: ${unanswered.join(', ')}`,
                'warning'
            );
            
            // Scroll to first unanswered question
            if (unanswered.length > 0) {
                const firstUnanswered = document.getElementById(`q${unanswered[0]}`);
                if (firstUnanswered) {
                    firstUnanswered.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstUnanswered.classList.add('pulse');
                    setTimeout(() => firstUnanswered.classList.remove('pulse'), 2000);
                }
            }
        }
    });
}

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
    
    // Randomize questions
    document.querySelectorAll('.question').forEach(q => randomizeQuestionOptions(q));
    
    // Setup event listeners
    setupAnswerListeners();
    setupKeyboardShortcuts();
    setupReviewButton();
    
    // Load any saved answers
    loadFromLocalStorage();
    
    // Start auto-save interval (every 30 seconds)
    autoSaveInterval = setInterval(() => {
        if (Object.keys(currentAnswers).length > 0) {
            saveProgressToServer(true);
        }
    }, 30000);
    
    console.log('Enhanced DSALGO1 Finals Part 1 initialized');
}

// Submit part 1
async function submitPart1() {
    if (isSubmitting) return;
    
    const storedID = sessionStorage.getItem('studentIDNumber');
    if (!storedID) {
        showMessage('No student ID found. Please return to the information page.', 'error');
        return;
    }
    
    // Check if all questions answered
    const unanswered = [];
    for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
        if (!currentAnswers[`q${i}`]) {
            unanswered.push(i);
        }
    }
    
    if (unanswered.length > 0) {
        const proceed = confirm(
            `You have ${unanswered.length} unanswered questions.\n\n` +
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
        showMessage('Part 1 submitted successfully! Redirecting to Part 2...', 'success');
        
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
            window.location.href = '/activity/dsalgo1/dsalgo1-finals-part2';
        }, 2000);
    } else {
        showMessage('Submission failed. Please try again.', 'error');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Part 1 and Go to Part 2';
        }
        isSubmitting = false;
    }
}

// Load existing student data and answers from server
async function loadExistingPart1(studentIDNumber, examID, refs) {
    const { nameSpan, sectionSpan, submitButton } = refs;
    
    try {
        const res = await fetch('/api/activity/dsalgo1-finals/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'load',
                examID,
                studentIDNumber
            })
        });
        
        const data = await res.json();
        
        if (!data.success || !data.data) {
            if (nameSpan) nameSpan.textContent = '[no record found]';
            if (sectionSpan) sectionSpan.textContent = '[no record found]';
            if (submitButton) submitButton.disabled = true;
            return;
        }
        
        const doc = data.data;
        const fullName = [doc.firstName, doc.lastName].filter(Boolean).join(' ');
        
        if (nameSpan) nameSpan.textContent = fullName || '[name not set]';
        if (sectionSpan) sectionSpan.textContent = doc.section || '[section not set]';
        
        // Load server answers if they exist
        if (doc.answers && typeof doc.answers === 'object') {
            Object.entries(doc.answers).forEach(([key, value]) => {
                if (key !== 'score_part1') {
                    const radio = document.querySelector(`input[name="${key}"][value="${value}"]`);
                    if (radio) {
                        radio.checked = true;
                        radio.closest('.option')?.classList.add('selected');
                        currentAnswers[key] = value;
                    }
                }
            });
            
            updateProgress();
            showMessage('Answers loaded from server', 'success', 3000);
        }
        
        if (submitButton) submitButton.disabled = false;
        
    } catch (err) {
        console.error('Error loading student info:', err);
        if (nameSpan) nameSpan.textContent = '[error loading]';
        if (sectionSpan) sectionSpan.textContent = '[error loading]';
        if (submitButton) submitButton.disabled = true;
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
    
    const storedID = sessionStorage.getItem('studentIDNumber');
    const idSpan = document.getElementById('studentIDNumberDisplay');
    const nameSpan = document.getElementById('studentNameDisplay');
    const sectionSpan = document.getElementById('sectionDisplay');
    const form = document.getElementById('part1Form');
    const messageEl = document.getElementById('message');
    const examIDInput = document.getElementById('examID');
    const submitButton = form ? form.querySelector('button[type="submit"]') : null;
    
    // Update ID display
    if (idSpan) {
        idSpan.textContent = storedID;
    }
    
    // Initialize exam features
    initExam();
    
    // Load student data and server answers
    const examID = examIDInput ? examIDInput.value : 'dsalgo1-finals';
    loadExistingPart1(storedID, examID, {
        nameSpan,
        sectionSpan,
        messageEl,
        submitButton
    });
    
    // Setup form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitPart1();
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
    
    // Mark navigation for external links
    document.querySelectorAll('a.button-link').forEach(link => {
        link.addEventListener('click', () => {
            window.isNavigatingAway = true;
        });
    });
});

// Cleanup on page unload
window.addEventListener('unload', () => {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
});
