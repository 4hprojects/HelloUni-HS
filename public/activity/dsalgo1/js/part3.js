// /activity/dsalgo1/js/part3.js - Enhanced with UI/UX features

// Constants
const ANSWER_KEY = {
    // 3A – Undirected graph
    p3_1_A: "B, C",
    p3_1_B: "A, D, E",
    p3_1_C: "A, F",
    p3_1_D: "B",
    p3_1_E: "B",
    p3_1_F: "C",
    p3_2_1: "A-B",
    p3_2_2: "A-C",
    p3_2_3: "B-D",
    p3_2_4: "B-E",
    p3_2_5: "C-F",
    p3_3_1: "B",
    p3_3_2: "A",
    p3_3_3: "D",
    p3_3_4: "E",
    p3_3_5: "C",
    p3_3_6: "F",
    p3_4: "{A, B, C, D, E, F}",
    p3_5: "0: B\n1: A, D, E\n2: C, F",
    
    // 3B – Directed graph + BFS
    p3B_A: "B, C, D",
    p3B_B: "E",
    p3B_C: "D",
    p3B_D: "E",
    p3B_E: "F",
    p3B_F: "A",
    p3_7_1: "A",
    p3_7_2: "B",
    p3_7_3: "C",
    p3_7_4: "D",
    p3_7_5: "E",
    p3_7_6: "F",
    p3_8: "{A, B, C, D, E, F}",
    p3_9: "None",
    
    // 3C – MCST: Kruskal (Graph 1)
    p3_10_1_edge: "B-C",
    p3_10_1_weight: "1",
    p3_10_2_edge: "A-B",
    p3_10_2_weight: "2",
    p3_10_3_edge: "A-C",
    p3_10_3_weight: "3",
    p3_10_4_edge: "B-D",
    p3_10_4_weight: "4",
    p3_10_5_edge: "C-E",
    p3_10_5_weight: "5",
    p3_10_6_edge: "D-E",
    p3_10_6_weight: "7",
    p3_11_1: true,
    p3_11_2: true,
    p3_11_3: false,
    p3_11_4: true,
    p3_11_5: true,
    p3_11_6: false,
    p3_12: "12",
    
    // 3C – MCST: Prim (Graph 2)
    p3_13_1_edge: "P-R",
    p3_13_1_order: "1",
    p3_13_2_edge: "Q-R",
    p3_13_2_order: "2",
    p3_13_3_edge: "R-S",
    p3_13_3_order: "3",
    p3_13_4_edge: "",
    p3_13_4_order: "",
    p3_13_5_edge: "",
    p3_13_5_order: "",
    p3_14: "6"
};

// State management
let currentAnswers = {};
let autoSaveInterval;
let isSubmitting = false;
let currentDistanceIndex = 0;
let selectedNode = null;
let drawnEdges = [];

// Initialize the exam
function initExam() {
    console.log('DSALGO1 Finals Part 3 - Enhanced UI/UX initialized');
    
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
    
    // Setup event listeners
    setupAnswerListeners();
    setupDistanceGroups();
    setupGraphBuilder();
    setupKeyboardShortcuts();
    setupAutoFormatting();
    
    // Load any saved answers from localStorage
    loadFromLocalStorage();
    
    // Start auto-save interval (every 30 seconds)
    autoSaveInterval = setInterval(() => {
        if (Object.keys(currentAnswers).length > 0) {
            saveProgressToServer(true);
        }
    }, 30000);
}

// Setup answer change listeners
function setupAnswerListeners() {
    // Text inputs
    document.querySelectorAll('input[type="text"], textarea, select').forEach(input => {
        input.addEventListener('change', handleAnswerChange);
        input.addEventListener('input', handleAnswerChange);
    });
    
    // Checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleAnswerChange);
    });
    
    // BFS order inputs (special handling)
    document.querySelectorAll('.bfs-order-input').forEach(input => {
        input.addEventListener('input', function(e) {
            this.value = this.value.toUpperCase();
            handleAnswerChange();
            
            // Auto-focus next input
            if (this.value.length === 1 && this.nextElementSibling?.classList?.contains('bfs-order-input')) {
                this.nextElementSibling.focus();
            }
        });
        
        // Allow keyboard navigation
        input.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight' && this.nextElementSibling?.classList?.contains('bfs-order-input')) {
                this.nextElementSibling.focus();
            } else if (e.key === 'ArrowLeft' && this.previousElementSibling?.classList?.contains('bfs-order-input')) {
                this.previousElementSibling.focus();
            } else if (e.key === 'Backspace' && this.value === '' && this.previousElementSibling?.classList?.contains('bfs-order-input')) {
                this.previousElementSibling.focus();
            }
        });
    });
}

function handleAnswerChange() {
    const input = this;
    const name = input.name;
    let value;
    
    // Get value based on input type
    if (input.type === 'checkbox') {
        value = input.checked;
    } else if (input.type === 'select-one') {
        value = input.value;
    } else {
        value = input.value.trim();
    }
    
    // Update current answers
    if (value !== '' && value !== false) {
        currentAnswers[name] = value;
        
        // Add visual feedback
        input.classList.add('selected');
        setTimeout(() => input.classList.remove('selected'), 300);
    } else {
        delete currentAnswers[name];
    }
    
    // Update progress
    updateProgress();
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Auto-save to server after 1.5 seconds
    clearTimeout(window.autoSaveTimeout);
    window.autoSaveTimeout = setTimeout(() => {
        saveProgressToServer(true);
    }, 1500);
}

// Setup distance groups
function setupDistanceGroups() {
    const addDistanceBtn = document.getElementById('addDistanceBtn');
    const distanceContainer = document.getElementById('distanceGroupsContainer');
    
    if (!addDistanceBtn || !distanceContainer) return;
    
    // Add initial distance row if none exist
    if (distanceContainer.children.length === 0) {
        addDistanceRow(0);
    }
    
    addDistanceBtn.addEventListener('click', () => {
        currentDistanceIndex++;
        addDistanceRow(currentDistanceIndex);
    });
}

function addDistanceRow(index, value = '') {
    const distanceContainer = document.getElementById('distanceGroupsContainer');
    const row = document.createElement('div');
    row.className = 'distance-group';
    row.innerHTML = `
        <div class="distance-header">
            <span class="distance-level">Distance ${index}</span>
            ${index > 0 ? '<button type="button" class="btn-remove-distance">×</button>' : ''}
        </div>
        <div class="distance-vertices">
            <input type="text" 
                   class="distance-input" 
                   placeholder="Enter vertices (e.g., A, D, E)"
                   value="${value}"
                   data-distance="${index}">
        </div>
    `;
    
    distanceContainer.appendChild(row);
    
    // Add event listeners
    const input = row.querySelector('.distance-input');
    const removeBtn = row.querySelector('.btn-remove-distance');
    
    if (input) {
        input.addEventListener('input', handleDistanceChange);
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            row.remove();
            updateDistanceIndices();
            handleDistanceChange();
        });
    }
}

function updateDistanceIndices() {
    const distanceContainer = document.getElementById('distanceGroupsContainer');
    const groups = distanceContainer.querySelectorAll('.distance-group');
    
    groups.forEach((group, index) => {
        const levelSpan = group.querySelector('.distance-level');
        const input = group.querySelector('.distance-input');
        
        if (levelSpan) levelSpan.textContent = `Distance ${index}`;
        if (input) input.dataset.distance = index;
    });
    
    currentDistanceIndex = groups.length - 1;
}

function handleDistanceChange() {
    const groups = document.querySelectorAll('.distance-group');
    const lines = [];
    
    groups.forEach(group => {
        const level = group.querySelector('.distance-level').textContent.replace('Distance ', '');
        const input = group.querySelector('.distance-input');
        const value = input ? input.value.trim() : '';
        
        if (value) {
            lines.push(`${level}: ${value}`);
        }
    });
    
    const p3_5 = document.getElementById('p3_5');
    if (p3_5) {
        p3_5.value = lines.join('\n');
        if (lines.length > 0) {
            currentAnswers['p3_5'] = p3_5.value;
        } else {
            delete currentAnswers['p3_5'];
        }
        
        updateProgress();
        saveToLocalStorage();
    }
}

// Setup graph builder
function setupGraphBuilder() {
    const graphCanvas = document.querySelector('.graph-canvas');
    if (!graphCanvas) return;
    
    // Create initial nodes
    const nodes = [
        { id: 'A', x: 80, y: 130 },
        { id: 'B', x: 180, y: 70 },
        { id: 'C', x: 180, y: 190 },
        { id: 'D', x: 280, y: 130 },
        { id: 'E', x: 380, y: 130 },
        { id: 'F', x: 80, y: 50 }
    ];
    
    // Create nodes
    nodes.forEach(node => {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'graph-node';
        nodeEl.textContent = node.id;
        nodeEl.style.left = `${node.x}px`;
        nodeEl.style.top = `${node.y}px`;
        nodeEl.dataset.id = node.id;
        nodeEl.dataset.x = node.x;
        nodeEl.dataset.y = node.y;
        
        // Make draggable
        nodeEl.addEventListener('mousedown', startDrag);
        nodeEl.addEventListener('touchstart', startDrag);
        
        graphCanvas.appendChild(nodeEl);
    });
    
    // Add edge drawing functionality
    graphCanvas.addEventListener('click', handleCanvasClick);
    
    // Load saved edges
    loadGraphEdges();
}

function startDrag(e) {
    const node = e.target;
    const isTouch = e.type === 'touchstart';
    const startX = isTouch ? e.touches[0].clientX : e.clientX;
    const startY = isTouch ? e.touches[0].clientY : e.clientY;
    const startLeft = parseInt(node.style.left);
    const startTop = parseInt(node.style.top);
    
    function doDrag(moveEvent) {
        const currentX = isTouch ? moveEvent.touches[0].clientX : moveEvent.clientX;
        const currentY = isTouch ? moveEvent.touches[0].clientY : moveEvent.clientY;
        const dx = currentX - startX;
        const dy = currentY - startY;
        
        node.style.left = `${startLeft + dx}px`;
        node.style.top = `${startTop + dy}px`;
        node.dataset.x = startLeft + dx;
        node.dataset.y = startTop + dy;
        
        // Update edges connected to this node
        updateEdgesForNode(node.dataset.id);
    }
    
    function stopDrag() {
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('touchmove', doDrag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchend', stopDrag);
        
        saveGraphEdges();
    }
    
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('touchmove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
    
    e.preventDefault();
}

function handleCanvasClick(e) {
    if (e.target.classList.contains('graph-node')) {
        const node = e.target;
        
        if (!selectedNode) {
            selectedNode = node;
            node.style.backgroundColor = '#dcfce7';
        } else if (selectedNode === node) {
            selectedNode.style.backgroundColor = '';
            selectedNode = null;
        } else {
            // Create edge between selectedNode and node
            createEdge(selectedNode.dataset.id, node.dataset.id);
            selectedNode.style.backgroundColor = '';
            selectedNode = null;
        }
    } else if (e.target.classList.contains('graph-edge')) {
        // Remove edge on click
        removeEdge(e.target);
    }
}

function createEdge(fromId, toId) {
    // Check if edge already exists
    if (drawnEdges.some(edge => 
        (edge.from === fromId && edge.to === toId) || 
        (edge.from === toId && edge.to === fromId)
    )) {
        showMessage('Edge already exists!', 'warning');
        return;
    }
    
    const fromNode = document.querySelector(`.graph-node[data-id="${fromId}"]`);
    const toNode = document.querySelector(`.graph-node[data-id="${toId}"]`);
    
    if (!fromNode || !toNode) return;
    
    const x1 = parseInt(fromNode.dataset.x) + 20;
    const y1 = parseInt(fromNode.dataset.y) + 20;
    const x2 = parseInt(toNode.dataset.x) + 20;
    const y2 = parseInt(toNode.dataset.y) + 20;
    
    const edgeEl = document.createElement('div');
    edgeEl.className = 'graph-edge';
    edgeEl.dataset.from = fromId;
    edgeEl.dataset.to = toId;
    
    // Calculate position and rotation
    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    
    edgeEl.style.left = `${x1}px`;
    edgeEl.style.top = `${y1}px`;
    edgeEl.style.width = `${length}px`;
    edgeEl.style.transform = `rotate(${angle}deg)`;
    
    // Add arrow
    const arrow = document.createElement('div');
    arrow.className = 'graph-edge-arrow';
    arrow.style.left = `${length - 18}px`; // Offset for larger arrowhead
    arrow.style.top = '-10px'; // Center vertically
    edgeEl.appendChild(arrow);
    
    document.querySelector('.graph-canvas').appendChild(edgeEl);
    drawnEdges.push({ from: fromId, to: toId, element: edgeEl });
    
    saveGraphEdges();
    showMessage(`Edge ${fromId} → ${toId} added`, 'success');
}

function updateEdgesForNode(nodeId) {
    drawnEdges.forEach(edge => {
        if (edge.from === nodeId || edge.to === nodeId) {
            const fromNode = document.querySelector(`.graph-node[data-id="${edge.from}"]`);
            const toNode = document.querySelector(`.graph-node[data-id="${edge.to}"]`);
            
            if (fromNode && toNode) {
                const x1 = parseInt(fromNode.dataset.x) + 20;
                const y1 = parseInt(fromNode.dataset.y) + 20;
                const x2 = parseInt(toNode.dataset.x) + 20;
                const y2 = parseInt(toNode.dataset.y) + 20;
                
                const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                
                edge.element.style.left = `${x1}px`;
                edge.element.style.top = `${y1}px`;
                edge.element.style.width = `${length}px`;
                edge.element.style.transform = `rotate(${angle}deg)`;
                
                const arrow = edge.element.querySelector('.graph-edge-arrow');
                if (arrow) {
                    arrow.style.left = `${length - 18}px`;
                    arrow.style.top = '-10px';
                }
            }
        }
    });
}

function removeEdge(edgeElement) {
    const index = drawnEdges.findIndex(edge => edge.element === edgeElement);
    if (index !== -1) {
        drawnEdges.splice(index, 1);
        edgeElement.remove();
        saveGraphEdges();
        showMessage('Edge removed', 'success');
    }
}

function saveGraphEdges() {
    const edges = drawnEdges.map(edge => `${edge.from}->${edge.to}`).join(',');
    const hiddenInput = document.getElementById('p3B_edges');
    
    if (!hiddenInput) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.id = 'p3B_edges';
        input.name = 'p3B_edges';
        document.getElementById('part3Form').appendChild(input);
    }
    
    document.getElementById('p3B_edges').value = edges;
    currentAnswers['p3B_edges'] = edges;
    saveToLocalStorage();
}

function loadGraphEdges() {
    const savedEdges = localStorage.getItem('dsalgo1-finals_part3_edges');
    if (savedEdges) {
        try {
            const edges = JSON.parse(savedEdges);
            edges.forEach(edge => {
                createEdge(edge.from, edge.to);
            });
        } catch (e) {
            console.error('Error loading graph edges:', e);
        }
    }
}

// Setup auto-formatting for set inputs
function setupAutoFormatting() {
    // Format p3_4 (visited set)
    const input4 = document.getElementById('p3_4_input');
    const textarea4 = document.getElementById('p3_4');
    const formatDiv4 = document.getElementById('p3_4_format');
    
    if (input4 && textarea4 && formatDiv4) {
        setupSetFormatting(input4, textarea4, formatDiv4);
    }
    
    // Format p3_8 (reachable set)
    const input8 = document.getElementById('p3_8_input');
    const textarea8 = document.getElementById('p3_8');
    const formatDiv8 = document.getElementById('p3_8_format');
    
    if (input8 && textarea8 && formatDiv8) {
        setupSetFormatting(input8, textarea8, formatDiv8);
    }
}

function setupSetFormatting(input, textarea, formatDiv) {
    function updateFormat() {
        let vals = input.value.split(/[\s,]+/).map(v => v.trim().toUpperCase()).filter(v => v);
        vals = [...new Set(vals)];
        const formatted = vals.length ? `{${vals.join(', ')}}` : '';
        textarea.value = formatted;
        formatDiv.textContent = formatted ? `Your answer: ${formatted}` : '';
        
        // Update current answers
        if (formatted) {
            currentAnswers[textarea.name] = formatted;
        } else {
            delete currentAnswers[textarea.name];
        }
        
        updateProgress();
        saveToLocalStorage();
    }
    
    input.addEventListener('blur', updateFormat);
    input.addEventListener('input', function() {
        formatDiv.textContent = '';
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
        
        // Escape to clear selection in graph builder
        if (e.key === 'Escape' && selectedNode) {
            selectedNode.style.backgroundColor = '';
            selectedNode = null;
        }
    });
}

// Update progress display
function updateProgress() {
    const totalFields = 46; // Approximate total answer fields
    const answeredCount = Object.keys(currentAnswers).length;
    const percentage = Math.round((answeredCount / totalFields) * 100);
    
    // Update counters
    const answeredElement = document.getElementById('answeredCount');
    const percentageElement = document.getElementById('progressPercentage');
    const progressFill = document.getElementById('progressFill');
    
    if (answeredElement) answeredElement.textContent = answeredCount;
    if (percentageElement) percentageElement.textContent = `${percentage}%`;
    if (progressFill) progressFill.style.width = `${percentage}%`;
    
    // Update section progress
    updateSectionProgress();
    
    // Update submit button
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        if (answeredCount > totalFields * 0.8) { // 80% completed
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Submit Part 3';
            submitBtn.classList.add('pulse');
        } else {
            submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> Save Part 3 and Go to Part 4 (${answeredCount}/${totalFields})`;
            submitBtn.classList.remove('pulse');
        }
    }
}

// Update progress for each section
function updateSectionProgress() {
    const sections = ['3a', '3b', '3c'];
    
    sections.forEach(section => {
        const sectionFields = getSectionFields(section);
        const answeredInSection = sectionFields.filter(field => currentAnswers[field]).length;
        const totalInSection = sectionFields.length;
        const percentage = Math.round((answeredInSection / totalInSection) * 100);
        
        const progressElement = document.querySelector(`#section-${section} .section-progress`);
        if (progressElement) {
            progressElement.textContent = `${answeredInSection}/${totalInSection} (${percentage}%)`;
        }
    });
}

function getSectionFields(section) {
    switch(section) {
        case '3a':
            return ['p3_1_A', 'p3_1_B', 'p3_1_C', 'p3_1_D', 'p3_1_E', 'p3_1_F',
                   'p3_2_1', 'p3_2_2', 'p3_2_3', 'p3_2_4', 'p3_2_5',
                   'p3_3_1', 'p3_3_2', 'p3_3_3', 'p3_3_4', 'p3_3_5', 'p3_3_6',
                   'p3_4', 'p3_5'];
        case '3b':
            return ['p3B_A', 'p3B_B', 'p3B_C', 'p3B_D', 'p3B_E', 'p3B_F',
                   'p3_7_1', 'p3_7_2', 'p3_7_3', 'p3_7_4', 'p3_7_5', 'p3_7_6',
                   'p3_8', 'p3_9', 'p3B_edges'];
        case '3c':
            return ['p3_10_1_edge', 'p3_10_1_weight', 'p3_10_2_edge', 'p3_10_2_weight',
                   'p3_10_3_edge', 'p3_10_3_weight', 'p3_10_4_edge', 'p3_10_4_weight',
                   'p3_10_5_edge', 'p3_10_5_weight', 'p3_10_6_edge', 'p3_10_6_weight',
                   'p3_11_1', 'p3_11_2', 'p3_11_3', 'p3_11_4', 'p3_11_5', 'p3_11_6',
                   'p3_12', 'p3_13_1_edge', 'p3_13_1_order', 'p3_13_2_edge', 'p3_13_2_order',
                   'p3_13_3_edge', 'p3_13_3_order', 'p3_13_4_edge', 'p3_13_4_order',
                   'p3_13_5_edge', 'p3_13_5_order', 'p3_14'];
        default:
            return [];
    }
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
    
    // Calculate score
    const score = calculateScore();
    const payload = {
        action: 'save',
        examID,
        studentIDNumber: storedID,
        pageNumber: 3,
        answers: { ...currentAnswers, score_part3: score },
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
    
    Object.keys(ANSWER_KEY).forEach(key => {
        if (typeof ANSWER_KEY[key] === 'boolean') {
            // For checkboxes
            if (currentAnswers[key] === ANSWER_KEY[key]) {
                score++;
            }
        } else {
            // For strings (normalize both)
            if (currentAnswers[key]) {
                const normalizedAnswer = currentAnswers[key].toString().replace(/\s+/g, '').replace(/[–—-]/g, '-').toUpperCase();
                const normalizedKey = ANSWER_KEY[key].toString().replace(/\s+/g, '').replace(/[–—-]/g, '-').toUpperCase();
                
                if (normalizedAnswer === normalizedKey) {
                    score++;
                }
            }
        }
    });
    
    return score;
}

// Save to localStorage as backup
function saveToLocalStorage() {
    try {
        const examID = document.getElementById('examID')?.value || 'dsalgo1-finals';
        const key = `${examID}_part3_answers`;
        localStorage.setItem(key, JSON.stringify(currentAnswers));
        
        // Save graph edges separately
        localStorage.setItem(`${examID}_part3_edges`, JSON.stringify(drawnEdges.map(edge => ({ from: edge.from, to: edge.to }))));
        
        localStorage.setItem(`${examID}_part3_lastSave`, new Date().toISOString());
    } catch (e) {
        console.error('Local storage save failed:', e);
    }
}

// Load from localStorage backup
function loadFromLocalStorage() {
    try {
        const examID = document.getElementById('examID')?.value || 'dsalgo1-finals';
        const saved = localStorage.getItem(`${examID}_part3_answers`);
        
        if (saved) {
            const loadedAnswers = JSON.parse(saved);
            Object.assign(currentAnswers, loadedAnswers);
            
            // Restore all form fields
            Object.entries(loadedAnswers).forEach(([name, value]) => {
                const element = document.querySelector(`[name="${name}"]`);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = value;
                    } else if (element.type === 'select-one') {
                        element.value = value;
                    } else {
                        element.value = value;
                    }
                    
                    // Trigger change event to update UI
                    element.dispatchEvent(new Event('change'));
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
                    if (!key.startsWith('score_')) { // Don't load scores
                        const element = document.querySelector(`[name="${key}"]`);
                        if (element) {
                            if (element.type === 'checkbox') {
                                element.checked = value;
                            } else if (element.type === 'select-one') {
                                element.value = value;
                            } else {
                                element.value = value;
                            }
                            
                            currentAnswers[key] = value;
                            
                            // Trigger change event for formatting
                            element.dispatchEvent(new Event('change'));
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

// Section save buttons
function setupSectionSaveButtons() {
    // Part 3A Save
    const savePart3ABtn = document.getElementById('savePart3ABtn');
    const savePart3AStatus = document.getElementById('savePart3AStatus');
    
    if (savePart3ABtn) {
        savePart3ABtn.addEventListener('click', async () => {
            await saveSection('3a', savePart3ABtn, savePart3AStatus);
        });
    }
    
    // Part 3B Save
    const savePart3BBtn = document.getElementById('savePart3BBtn');
    const savePart3BStatus = document.getElementById('savePart3BStatus');
    
    if (savePart3BBtn) {
        savePart3BBtn.addEventListener('click', async () => {
            await saveSection('3b', savePart3BBtn, savePart3BStatus);
        });
    }
    
    // Part 3C Save
    const savePart3CBtn = document.getElementById('savePart3CBtn');
    const savePart3CStatus = document.getElementById('savePart3CStatus');
    
    if (savePart3CBtn) {
        savePart3CBtn.addEventListener('click', async () => {
            await saveSection('3c', savePart3CBtn, savePart3CStatus);
        });
    }
}

async function saveSection(section, button, statusElement) {
    button.disabled = true;
    statusElement.textContent = 'Saving...';
    
    // Collect only section answers
    const sectionAnswers = {};
    const sectionFields = getSectionFields(section);
    
    sectionFields.forEach(field => {
        if (currentAnswers[field] !== undefined) {
            sectionAnswers[field] = currentAnswers[field];
        }
    });
    
    // Also include graph edges for section B
    if (section === '3b') {
        const edges = document.getElementById('p3B_edges');
        if (edges && edges.value) {
            sectionAnswers['p3B_edges'] = edges.value;
        }
    }
    
    const examID = document.getElementById('examID')?.value || 'dsalgo1-finals';
    const storedID = sessionStorage.getItem('studentIDNumber');
    
    const payload = {
        action: 'save',
        examID,
        studentIDNumber: storedID,
        pageNumber: 3,
        answers: sectionAnswers,
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
        
        if (!data.success) {
            statusElement.textContent = data.message || 'Failed to save.';
            button.disabled = false;
            return;
        }
        
        statusElement.textContent = 'Saved!';
        setTimeout(() => {
            statusElement.textContent = '';
            button.disabled = false;
        }, 2000);
    } catch (err) {
        statusElement.textContent = 'Error saving. Please try again.';
        button.disabled = false;
    }
}

// Submit part 3
async function submitPart3() {
    if (isSubmitting) return;
    
    const storedID = sessionStorage.getItem('studentIDNumber');
    if (!storedID) {
        showMessage('No student ID found. Please return to the information page.', 'error');
        return;
    }
    
    // Check for required answers
    const requiredFields = [
        'p3_1_A', 'p3_1_B', 'p3_1_C', 'p3_1_D', 'p3_1_E', 'p3_1_F',
        'p3_4', 'p3_8'
    ];
    
    const missing = requiredFields.filter(field => !currentAnswers[field]);
    
    if (missing.length > 0) {
        const proceed = confirm(
            `You have ${missing.length} required fields missing.\n\n` +
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
        showMessage('Part 3 submitted successfully! Redirecting to Part 4...', 'success');
        
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
            window.location.href = '/activity/dsalgo1/dsalgo1-finals-part4';
        }, 2000);
    } else {
        showMessage('Submission failed. Please try again.', 'error');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Save Part 3 and Go to Part 4';
        }
        isSubmitting = false;
    }
}

// Setup back button
function setupBackButton() {
    const backLink = document.querySelector('a.button-link[href*="dsalgo1-finals-part2"]');
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
    
    // Setup section save buttons
    setupSectionSaveButtons();
    
    // Setup back button
    setupBackButton();
    
    // Setup form submission
    const form = document.getElementById('part3Form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitPart3();
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
    
    // Prevent Enter key from submitting form in inputs
    document.querySelectorAll('input[type="text"]').forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    });
});

// Cleanup on page unload
window.addEventListener('unload', () => {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
});
