// DOM Elements
const infoForm = document.getElementById('infoForm');
const messageContainer = document.getElementById('message');
const submitBtn = document.getElementById('submitBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const togglePassword = document.getElementById('togglePassword');
const examCodeInput = document.getElementById('examCode');
const examCodeHint = document.getElementById('examCodeHint');
const agreeTerms = document.getElementById('agreeTerms');
const sectionSelect = document.getElementById('section');

// Form validation patterns
const VALIDATION_PATTERNS = {
    studentID: /^\d{1,8}$/,
    name: /^[A-Za-z\s.'-]+$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    examCode: /^.{1,12}$/
};

// Section exam codes
const EXAM_CODES = {
    'IDB3': 'LETSGO!',
    'IDB4': 'ICANDOIT!'
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Auto-focus on student ID field
    document.getElementById('studentIDNumber').focus();
    
    // Load existing info if student ID is in session storage
    const storedID = sessionStorage.getItem('studentIDNumber');
    if (storedID) {
        loadExistingInfo(storedID);
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Show welcome message
    showMessage('Welcome to DSALGO1 Finals Examination. Please fill in your information to begin.', 'info');
});

// Setup all event listeners
function setupEventListeners() {
    // Student ID blur event for auto-load
    document.getElementById('studentIDNumber').addEventListener('blur', (e) => {
        const id = e.target.value.trim();
        if (id && VALIDATION_PATTERNS.studentID.test(id)) {
            loadExistingInfo(id);
        }
    });
    
    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = examCodeInput.getAttribute('type') === 'password' ? 'text' : 'password';
        examCodeInput.setAttribute('type', type);
        togglePassword.innerHTML = type === 'password' ? 
            '<i class="fas fa-eye"></i>' : 
            '<i class="fas fa-eye-slash"></i>';
    });
    
    // Section change event
    sectionSelect.addEventListener('change', updateExamCodeHint);
    
    // Form submission
    infoForm.addEventListener('submit', handleFormSubmit);
    
    // Real-time validation
    setupRealTimeValidation();
}

// Load existing student information
async function loadExistingInfo(studentIDNumber) {
    showLoading();
    
    const examID = document.getElementById('examID').value;
    
    try {
        const res = await fetch('/api/activity/dsalgo1-finals/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                examID, 
                studentIDNumber, 
                action: 'load' 
            })
        });
        
        const data = await res.json();
        
        if (data.success && data.data) {
            const doc = data.data;
            
            // Populate form fields
            if (doc.firstName) document.getElementById('firstName').value = doc.firstName;
            if (doc.lastName) document.getElementById('lastName').value = doc.lastName;
            if (doc.email) document.getElementById('email').value = doc.email;
            if (doc.section) {
                document.getElementById('section').value = doc.section;
                updateExamCodeHint(); // Update hint after setting section
            }
            if (doc.examCode) {
                document.getElementById('examCode').value = doc.examCode;
            }
            
            // Check if exam is already completed
            if (doc.answers && doc.answers.completed) {
                showMessage('You have already completed the exam. You cannot continue.', 'error');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="button-text">Exam Completed</span><span class="button-icon"><i class="fas fa-check"></i></span>';
            } else {
                showMessage('Your previous information has been loaded. Please review and continue.', 'success');
            }
            
            // Update the exam code hint
            updateExamCodeHint();
        }
    } catch (err) {
        console.error('Load error:', err);
        showMessage('Unable to load existing information. Please fill in all fields.', 'error');
    } finally {
        hideLoading();
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Reset message
    clearMessage();
    
    // Validate all fields
    if (!validateForm()) {
        return;
    }
    
    // Check terms agreement
    if (!agreeTerms.checked) {
        showMessage('You must agree to the examination rules and academic integrity policy.', 'error');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="button-text">Saving Information...</span><span class="button-icon"><i class="fas fa-spinner fa-spin"></i></span>';
    
    // Prepare payload
    const payload = {
        examID: document.getElementById('examID').value,
        studentIDNumber: document.getElementById('studentIDNumber').value.trim(),
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        section: document.getElementById('section').value,
        examCode: document.getElementById('examCode').value.trim(),
        pageNumber: 0,
        answers: {},
        action: 'save',
        timestamp: new Date().toISOString()
    };
    
    try {
        const res = await fetch('/api/activity/dsalgo1-finals/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to save information');
        }
        
        // Save student ID to session storage
        sessionStorage.setItem('studentIDNumber', payload.studentIDNumber);
        
        // Show success message
        showMessage('Information saved successfully! Redirecting to Part 1...', 'success');
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = '/activity/dsalgo1/dsalgo1-finals-part1.html';
        }, 1500);
        
    } catch (err) {
        console.error('Save error:', err);
        showMessage(`Error: ${err.message || 'Failed to save information. Please try again.'}`, 'error');
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="button-text">Save and Proceed to Part 1</span><span class="button-icon"><i class="fas fa-arrow-right"></i></span>';
    }
}

// Validate all form fields
function validateForm() {
    const studentID = document.getElementById('studentIDNumber').value.trim();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const section = document.getElementById('section').value;
    const examCode = document.getElementById('examCode').value.trim();
    
    // Validate student ID
    if (!VALIDATION_PATTERNS.studentID.test(studentID)) {
        showMessage('Student ID must be up to 8 digits (numbers only).', 'error');
        highlightField('studentIDNumber', 'error');
        return false;
    }
    
    // Validate names
    if (!firstName || firstName.length > 30) {
        showMessage('First name is required and must be 30 characters or less.', 'error');
        highlightField('firstName', 'error');
        return false;
    }
    
    if (!lastName || lastName.length > 30) {
        showMessage('Last name is required and must be 30 characters or less.', 'error');
        highlightField('lastName', 'error');
        return false;
    }
    
    // Validate email
    if (!VALIDATION_PATTERNS.email.test(email) || email.length > 50) {
        showMessage('Please enter a valid email address (50 characters maximum).', 'error');
        highlightField('email', 'error');
        return false;
    }
    
    // Validate section
    if (!section) {
        showMessage('Please select your section.', 'error');
        highlightField('section', 'error');
        return false;
    }
    
    // Validate exam code
    if (!examCode || examCode.length > 12) {
        showMessage('Exam code is required and must be 12 characters or less.', 'error');
        highlightField('examCode', 'error');
        return false;
    }
    
    // Validate exam code matches section
    if (EXAM_CODES[section] && examCode !== EXAM_CODES[section]) {
        showMessage(`Exam code does not match your section (${section}). Please use the correct code.`, 'error');
        highlightField('examCode', 'error');
        return false;
    }
    
    return true;
}

// Update exam code hint based on selected section
function updateExamCodeHint() {
    const section = sectionSelect.value;
    const codeItem = document.querySelector(`.code-item[data-section="${section}"]`);
    
    // Reset all code items
    document.querySelectorAll('.code-item').forEach(item => {
        item.style.opacity = '0.6';
        item.style.transform = 'scale(0.95)';
    });
    
    if (section && codeItem) {
        // Highlight the correct code
        codeItem.style.opacity = '1';
        codeItem.style.transform = 'scale(1)';
        codeItem.style.background = '#e0f2fe';
        codeItem.style.borderColor = '#38bdf8';
        
        // Update hint text
        examCodeHint.textContent = `Use exam code: ${EXAM_CODES[section]}`;
        examCodeHint.style.color = '#0066cc';
        examCodeHint.style.fontWeight = '500';
    } else {
        examCodeHint.textContent = 'Enter the exam code provided by your instructor';
        examCodeHint.style.color = '';
        examCodeHint.style.fontWeight = '';
    }
}

// Setup real-time validation
function setupRealTimeValidation() {
    const inputs = infoForm.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            clearFieldHighlight(input.id);
            clearMessage();
        });
        
        input.addEventListener('change', () => {
            clearFieldHighlight(input.id);
            clearMessage();
        });
    });
}

// Show message with type
function showMessage(text, type = 'info') {
    messageContainer.textContent = text;
    messageContainer.className = `message-container ${type} show`;
    
    // Auto-hide info messages after 5 seconds
    if (type === 'info') {
        setTimeout(() => {
            messageContainer.classList.remove('show');
        }, 5000);
    }
}

// Clear message
function clearMessage() {
    messageContainer.textContent = '';
    messageContainer.className = 'message-container';
}

// Highlight field with error or success
function highlightField(fieldId, type = 'error') {
    const field = document.getElementById(fieldId);
    const input = field.closest('.form-group')?.querySelector('input, select');
    
    if (input) {
        input.classList.remove('field-error', 'field-success');
        input.classList.add(`field-${type}`);
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
            input.classList.remove(`field-${type}`);
        }, 3000);
    }
}

// Clear field highlight
function clearFieldHighlight(fieldId) {
    const field = document.getElementById(fieldId);
    const input = field.closest('.form-group')?.querySelector('input, select');
    
    if (input) {
        input.classList.remove('field-error', 'field-success');
    }
}

// Show loading overlay
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Add CSS for field highlighting
const style = document.createElement('style');
style.textContent = `
    .field-error {
        border-color: #dc2626 !important;
        background: #fef2f2 !important;
    }
    
    .field-success {
        border-color: #059669 !important;
        background: #f0fdf4 !important;
    }
    
    .message-container.show {
        display: block;
    }
`;
document.head.appendChild(style);
