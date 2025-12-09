// /activity/dsalgo1/js/part4.js - Enhanced with UI/UX features

// Constants
const VERTEX_COUNT = 10;
const MAX_EDGES = 25;

// State management
let currentAnswers = {};
let autoSaveInterval;
let isSubmitting = false;
let edgeCount = 1;
let selectedVertex = null;
let graphEdges = [];
let matrixSize = 5;
let adjacencyData = null;

// Initialize the exam
function initExam() {
    console.log('DSALGO1 Finals Part 4 - Enhanced UI/UX initialized');
    
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
    setupEdgeList();
    setupGraphBuilder();
    setupMatrixBuilder();
    setupAnswerListeners();
    setupKeyboardShortcuts();
    
    // Load any saved answers from localStorage
    loadFromLocalStorage();
    
    // Start auto-save interval (every 30 seconds)
    autoSaveInterval = setInterval(() => {
        if (Object.keys(currentAnswers).length > 0) {
            saveProgressToServer(true);
        }
    }, 30000);
}

// Generate symmetric adjacency list
function generateSymmetricAdjacencyList(vertexCount = VERTEX_COUNT, maxEdges = MAX_EDGES) {
    const labels = [];
    for (let i = 0; i < vertexCount; i++) {
        labels.push(String.fromCharCode(65 + i));
    }
    
    const adjacency = {};
    for (let i = 0; i < vertexCount; i++) {
        adjacency[labels[i]] = [];
    }
    
    // Generate all possible unique edges
    const possibleEdges = [];
    for (let i = 0; i < vertexCount; i++) {
        for (let j = i + 1; j < vertexCount; j++) {
            possibleEdges.push([labels[i], labels[j]]);
        }
    }
    
    // Shuffle and pick edges
    for (let i = possibleEdges.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [possibleEdges[i], possibleEdges[j]] = [possibleEdges[j], possibleEdges[i]];
    }
    
    const selectedEdges = possibleEdges.slice(0, maxEdges);
    
    // Build adjacency
    selectedEdges.forEach(([a, b]) => {
        adjacency[a].push(b);
        adjacency[b].push(a);
    });
    
    // Sort neighbors
    for (let v of labels) {
        adjacency[v] = Array.from(new Set(adjacency[v])).sort();
    }
    
    return { labels, adjacency };
}

// Display adjacency list
function displayAdjacencyList(labels, adjacency) {
    const container = document.getElementById('adjacencyListDisplay');
    if (!container) return;
    
    container.innerHTML = '';
    
    labels.forEach(label => {
        const vertexDiv = document.createElement('div');
        vertexDiv.className = 'adjacency-vertex';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'vertex-name';
        nameSpan.textContent = `${label}: `;
        
        const neighborsSpan = document.createElement('span');
        neighborsSpan.className = 'vertex-neighbors';
        neighborsSpan.textContent = adjacency[label].join(', ');
        
        vertexDiv.appendChild(nameSpan);
        vertexDiv.appendChild(neighborsSpan);
        container.appendChild(vertexDiv);
    });
}

// Setup edge list
function setupEdgeList() {
    const addEdgeBtn = document.getElementById('addEdgeBtn');
    const edgeListContainer = document.getElementById('edgeListContainer');
    
    if (!addEdgeBtn || !edgeListContainer) return;
    
    // Add initial edge row
    addEdgeRow();
    
    addEdgeBtn.addEventListener('click', () => {
        addEdgeRow();
        updateProgress();
    });
}

function addEdgeRow(value = '') {
    const edgeListContainer = document.getElementById('edgeListContainer');
    const row = document.createElement('div');
    row.className = 'edge-row';
    
    row.innerHTML = `
        <span class="edge-label">Edge ${edgeCount}:</span>
        <input type="text" 
               class="edge-input" 
               name="p4_1_edge_${edgeCount}"
               placeholder="e.g., A-B"
               value="${value}"
               maxlength="5">
        <button type="button" class="edge-remove-btn">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    edgeListContainer.appendChild(row);
    
    // Add event listeners
    const input = row.querySelector('.edge-input');
    const removeBtn = row.querySelector('.edge-remove-btn');
    
    input.addEventListener('input', handleEdgeInput);
    removeBtn.addEventListener('click', () => {
        row.remove();
        updateEdgeNumbers();
        updateProgress();
        saveToLocalStorage();
    });
    
    edgeCount++;
}

function updateEdgeNumbers() {
    const rows = document.querySelectorAll('.edge-row');
    edgeCount = 1;
    
    rows.forEach((row, index) => {
        const label = row.querySelector('.edge-label');
        const input = row.querySelector('.edge-input');
        
        if (label) label.textContent = `Edge ${edgeCount}:`;
        if (input) input.name = `p4_1_edge_${edgeCount}`;
        
        edgeCount++;
    });
}

function handleEdgeInput() {
    const value = this.value.trim().toUpperCase();
    
    // Validate format (e.g., A-B)
    if (value && !/^[A-Z]-[A-Z]$/.test(value)) {
        this.style.borderColor = 'var(--danger-color)';
        this.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
    } else {
        this.style.borderColor = '';
        this.style.boxShadow = '';
        
        // Update current answers
        currentAnswers[this.name] = value;
        updateProgress();
        saveToLocalStorage();
        
        // Auto-save to server
        clearTimeout(window.autoSaveTimeout);
        window.autoSaveTimeout = setTimeout(() => {
            saveProgressToServer(true);
        }, 1500);
    }
}

// Setup graph builder
function setupGraphBuilder() {
    const vertexCountInput = document.getElementById('vertexCountInput');
    const vertexLabelsContainer = document.getElementById('vertexLabelsContainer');
    const graphCanvas = document.getElementById('graphCanvas');
    
    if (!vertexCountInput || !vertexLabelsContainer || !graphCanvas) return;
    
    // Initialize vertex labels
    updateVertexLabels(parseInt(vertexCountInput.value, 10));
    
    vertexCountInput.addEventListener('input', () => {
        const count = parseInt(vertexCountInput.value, 10);
        const clampedCount = Math.min(Math.max(count, 2), 10);
        
        if (clampedCount !== count) {
            vertexCountInput.value = clampedCount;
        }
        
        updateVertexLabels(clampedCount);
        updateProgress();
        saveToLocalStorage();
    });
    
    // Setup canvas
    setupGraphCanvas();
}

function updateVertexLabels(count, labels = []) {
    const container = document.getElementById('vertexLabelsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'vertex-label-input';
        input.maxLength = 2;
        input.placeholder = String.fromCharCode(65 + i);
        input.value = labels[i] || '';
        input.dataset.index = i;
        
        input.addEventListener('input', function() {
            const value = this.value.trim().toUpperCase();
            this.value = value;
            
            // Update graph display
            updateGraphDisplay();
            
            // Save to current answers
            currentAnswers[`p4_2_vertex_${this.dataset.index}`] = value;
            updateProgress();
            saveToLocalStorage();
        });
        
        container.appendChild(input);
    }
    
    updateGraphDisplay();
}

function setupGraphCanvas() {
    const canvas = document.getElementById('graphCanvas');
    if (!canvas) return;
    
    // Set up SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '300');
    svg.setAttribute('viewBox', '0 0 500 300');
    svg.id = 'graphSvg';
    
    canvas.innerHTML = '';
    canvas.appendChild(svg);
    
    updateGraphDisplay();
}

function updateGraphDisplay() {
    const svg = document.getElementById('graphSvg');
    if (!svg) return;
    
    svg.innerHTML = '';
    
    const vertexLabels = Array.from(document.querySelectorAll('.vertex-label-input'))
        .map(input => input.value.trim().toUpperCase())
        .filter(label => label);
    
    if (vertexLabels.length === 0) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '250');
        text.setAttribute('y', '150');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '16');
        text.setAttribute('fill', '#666');
        text.textContent = 'Enter vertex labels to display graph';
        svg.appendChild(text);
        return;
    }
    
    // Calculate positions
    const radius = 20;
    const centerX = 250;
    const centerY = 150;
    const circleRadius = 100;
    const positions = [];
    
    for (let i = 0; i < vertexLabels.length; i++) {
        const angle = (2 * Math.PI * i) / vertexLabels.length - Math.PI / 2;
        const x = centerX + circleRadius * Math.cos(angle);
        const y = centerY + circleRadius * Math.sin(angle);
        positions.push({ x, y, label: vertexLabels[i] });
    }
    
    // Draw edges
    graphEdges.forEach(edge => {
        const fromIndex = vertexLabels.indexOf(edge.from);
        const toIndex = vertexLabels.indexOf(edge.to);
        
        if (fromIndex !== -1 && toIndex !== -1) {
            const from = positions[fromIndex];
            const to = positions[toIndex];
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', from.x);
            line.setAttribute('y1', from.y);
            line.setAttribute('x2', to.x);
            line.setAttribute('y2', to.y);
            line.setAttribute('class', 'edge-line');
            line.setAttribute('data-edge', `${edge.from}-${edge.to}`);
            
            line.addEventListener('click', () => {
                removeGraphEdge(edge.from, edge.to);
            });
            
            svg.appendChild(line);
        }
    });
    
    // Draw vertices
    positions.forEach((pos, index) => {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pos.x);
        circle.setAttribute('cy', pos.y);
        circle.setAttribute('r', radius);
        circle.setAttribute('class', `vertex-circle ${selectedVertex === index ? 'selected' : ''}`);
        circle.setAttribute('data-index', index);
        circle.setAttribute('data-label', pos.label);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', pos.x);
        text.setAttribute('y', pos.y);
        text.setAttribute('class', 'vertex-text');
        text.textContent = pos.label;
        
        circle.addEventListener('click', (e) => {
            e.stopPropagation();
            handleVertexClick(index, pos.label);
        });
        
        group.appendChild(circle);
        group.appendChild(text);
        svg.appendChild(group);
    });
    
    // Update edge list display
    updateEdgeListDisplay();
    
    // Add click handler to clear selection
    svg.addEventListener('click', () => {
        selectedVertex = null;
        updateGraphDisplay();
    });
}

function handleVertexClick(index, label) {
    if (selectedVertex === null) {
        selectedVertex = index;
        updateGraphDisplay();
    } else if (selectedVertex !== index) {
        const selectedLabel = document.querySelector(`.vertex-circle[data-index="${selectedVertex}"]`)?.dataset.label;
        
        if (selectedLabel && label && selectedLabel !== label) {
            addGraphEdge(selectedLabel, label);
        }
        
        selectedVertex = null;
        updateGraphDisplay();
    } else {
        selectedVertex = null;
        updateGraphDisplay();
    }
}

function addGraphEdge(from, to) {
    // Check if edge already exists
    const exists = graphEdges.some(edge => 
        (edge.from === from && edge.to === to) || 
        (edge.from === to && edge.to === from)
    );
    
    if (exists) {
        showMessage('Edge already exists!', 'warning');
        return;
    }
    
    graphEdges.push({ from, to });
    
    // Update current answers
    currentAnswers['p4_2_edges'] = graphEdges.map(e => `${e.from}-${e.to}`);
    updateProgress();
    saveToLocalStorage();
    
    showMessage(`Edge ${from}-${to} added`, 'success');
}

function removeGraphEdge(from, to) {
    graphEdges = graphEdges.filter(edge => 
        !(edge.from === from && edge.to === to) &&
        !(edge.from === to && edge.to === from)
    );
    
    // Update current answers
    currentAnswers['p4_2_edges'] = graphEdges.map(e => `${e.from}-${e.to}`);
    updateProgress();
    saveToLocalStorage();
    
    showMessage('Edge removed', 'success');
}

function updateEdgeListDisplay() {
    const container = document.getElementById('edgeListDisplay');
    if (!container) return;
    
    container.innerHTML = '<strong>Edges:</strong> ';
    
    if (graphEdges.length === 0) {
        container.innerHTML += '<span style="color: #888;">No edges added</span>';
        return;
    }
    
    graphEdges.forEach(edge => {
        const span = document.createElement('span');
        span.textContent = `${edge.from}-${edge.to}`;
        container.appendChild(span);
    });
}

// Setup matrix builder
function setupMatrixBuilder() {
    const matrixSizeInput = document.getElementById('matrixSizeInput');
    const matrixLabelsContainer = document.getElementById('matrixLabelsContainer');
    
    if (!matrixSizeInput || !matrixLabelsContainer) return;
    
    // Initialize matrix
    updateMatrixLabels(parseInt(matrixSizeInput.value, 10));
    
    matrixSizeInput.addEventListener('input', () => {
        const size = parseInt(matrixSizeInput.value, 10);
        const clampedSize = Math.min(Math.max(size, 2), 10);
        
        if (clampedSize !== size) {
            matrixSizeInput.value = clampedSize;
        }
        
        updateMatrixLabels(clampedSize);
        updateProgress();
        saveToLocalStorage();
    });
}

function updateMatrixLabels(size, labels = []) {
    const container = document.getElementById('matrixLabelsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < size; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'vertex-label-input';
        input.maxLength = 2;
        input.placeholder = String.fromCharCode(65 + i);
        input.value = labels[i] || '';
        input.dataset.index = i;
        
        input.addEventListener('input', function() {
            const value = this.value.trim().toUpperCase();
            this.value = value;
            
            // Update matrix table
            updateMatrixTable();
            
            // Save to current answers
            currentAnswers[`p4_3_label_${this.dataset.index}`] = value;
            updateProgress();
            saveToLocalStorage();
        });
        
        container.appendChild(input);
    }
    
    updateMatrixTable();
}

function updateMatrixTable() {
    const wrapper = document.getElementById('matrixTableWrapper');
    if (!wrapper) return;
    
    const labels = Array.from(document.querySelectorAll('#matrixLabelsContainer .vertex-label-input'))
        .map(input => input.value.trim().toUpperCase())
        .filter(label => label);
    
    if (labels.length === 0) {
        wrapper.innerHTML = '<p style="color: #666; text-align: center;">Enter vertex labels to create matrix</p>';
        return;
    }
    
    let html = `
        <div class="matrix-table-wrapper">
            <table class="matrix-table">
                <thead>
                    <tr>
                        <th></th>
    `;
    
    // Header row
    labels.forEach(label => {
        html += `<th>${label}</th>`;
    });
    
    html += `</tr></thead><tbody>`;
    
    // Data rows
    labels.forEach((rowLabel, rowIndex) => {
        html += `<tr><th>${rowLabel}</th>`;
        
        labels.forEach((colLabel, colIndex) => {
            const isDiagonal = rowIndex === colIndex;
            const name = `p4_3_${rowLabel}_${colLabel}`;
            const value = currentAnswers[name] || '0';
            
            html += `
                <td>
                    <input type="text" 
                           class="matrix-input ${value === '1' ? 'edge' : ''}"
                           name="${name}"
                           value="${value}"
                           maxlength="1"
                           ${isDiagonal ? 'disabled' : ''}
                           style="${isDiagonal ? 'background: #f1f5f9; color: #94a3b8;' : ''}">
                </td>
            `;
        });
        
        html += `</tr>`;
    });
    
    html += `</tbody></table></div>`;
    
    wrapper.innerHTML = html;
    
    // Add event listeners to matrix inputs
    wrapper.querySelectorAll('.matrix-input:not(:disabled)').forEach(input => {
        input.addEventListener('input', handleMatrixInput);
        input.addEventListener('focus', handleMatrixFocus);
    });
}

function handleMatrixInput() {
    const value = this.value.trim();
    
    // Only allow 0 or 1
    if (value !== '0' && value !== '1') {
        this.value = '';
        delete currentAnswers[this.name];
    } else {
        this.value = value;
        this.classList.toggle('edge', value === '1');
        
        // Update current answers
        currentAnswers[this.name] = value;
    }
    
    updateProgress();
    saveToLocalStorage();
    
    // Auto-save to server
    clearTimeout(window.autoSaveTimeout);
    window.autoSaveTimeout = setTimeout(() => {
        saveProgressToServer(true);
    }, 1500);
}

function handleMatrixFocus() {
    this.select();
}

// Setup answer listeners
function setupAnswerListeners() {
    // Edge list inputs are handled in setupEdgeList
    // Graph builder inputs are handled in setupGraphBuilder
    // Matrix inputs are handled in updateMatrixTable
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
        if (e.key === 'Escape' && selectedVertex !== null) {
            selectedVertex = null;
            updateGraphDisplay();
        }
        
        // Tab navigation for edge inputs
        if (e.key === 'Tab' && e.target.classList.contains('edge-input')) {
            e.preventDefault();
            const inputs = Array.from(document.querySelectorAll('.edge-input'));
            const currentIndex = inputs.indexOf(e.target);
            const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
            
            if (nextIndex >= 0 && nextIndex < inputs.length) {
                inputs[nextIndex].focus();
                inputs[nextIndex].select();
            }
        }
    });
}

// Update progress display
function updateProgress() {
    const totalFields = calculateTotalFields();
    const answeredCount = Object.keys(currentAnswers).length;
    const percentage = Math.round((answeredCount / totalFields) * 100);
    
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
        if (answeredCount > totalFields * 0.7) { // 70% completed
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Ready to Submit Part 4';
            submitBtn.classList.add('pulse');
        } else {
            submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> Submit Part 4 (${answeredCount}/${totalFields})`;
            submitBtn.classList.remove('pulse');
        }
    }
}

function calculateTotalFields() {
    let count = 0;
    
    // Edge list inputs
    count += document.querySelectorAll('.edge-input').length;
    
    // Vertex labels in graph builder
    count += document.querySelectorAll('#vertexLabelsContainer .vertex-label-input').length;
    
    // Graph edges
    count += graphEdges.length > 0 ? 1 : 0;
    
    // Matrix labels
    count += document.querySelectorAll('#matrixLabelsContainer .vertex-label-input').length;
    
    // Matrix cells (excluding diagonal)
    const matrixSize = document.querySelectorAll('#matrixLabelsContainer .vertex-label-input').length;
    count += matrixSize > 0 ? matrixSize * matrixSize - matrixSize : 0;
    
    return count;
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
    
    // Collect all answers
    const answers = collectAllAnswers();
    
    // Calculate score
    const score = calculateScore(answers);
    answers['score_part4'] = score;
    
    const payload = {
        action: 'save',
        examID,
        studentIDNumber: storedID,
        pageNumber: 4,
        answers: answers,
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

function collectAllAnswers() {
    const answers = {};
    
    // Edge list answers
    document.querySelectorAll('.edge-input').forEach(input => {
        if (input.value.trim()) {
            answers[input.name] = input.value.trim().toUpperCase();
        }
    });
    
    // Graph builder answers
    document.querySelectorAll('#vertexLabelsContainer .vertex-label-input').forEach(input => {
        if (input.value.trim()) {
            answers[`p4_2_vertex_${input.dataset.index}`] = input.value.trim().toUpperCase();
        }
    });
    
    // Graph edges
    if (graphEdges.length > 0) {
        answers['p4_2_edges'] = graphEdges.map(e => `${e.from}-${e.to}`);
    }
    
    // Matrix labels
    document.querySelectorAll('#matrixLabelsContainer .vertex-label-input').forEach(input => {
        if (input.value.trim()) {
            answers[`p4_3_label_${input.dataset.index}`] = input.value.trim().toUpperCase();
        }
    });
    
    // Matrix cells
    document.querySelectorAll('.matrix-input:not(:disabled)').forEach(input => {
        if (input.value.trim()) {
            answers[input.name] = input.value.trim();
        }
    });
    
    // Store adjacency data
    if (adjacencyData) {
        answers['generatedLabels'] = adjacencyData.labels;
        answers['generatedAdjacency'] = adjacencyData.adjacency;
    }
    
    return answers;
}

function calculateScore(answers) {
    if (!adjacencyData) return 0;
    
    let score = 0;
    const { labels, adjacency } = adjacencyData;
    
    // Q1: Edge list scoring
    const correctEdges = [];
    for (let v of labels) {
        for (let n of adjacency[v]) {
            if (labels.indexOf(v) < labels.indexOf(n)) {
                correctEdges.push(`${v}-${n}`);
            }
        }
    }
    
    const studentEdges = [];
    Object.keys(answers).filter(k => k.startsWith('p4_1_edge_')).forEach(k => {
        if (answers[k]) studentEdges.push(answers[k].replace(/\s/g, ''));
    });
    
    score += studentEdges.filter(e => correctEdges.includes(e)).length;
    
    // Q2: Graph builder scoring
    const studentVertices = Object.keys(answers)
        .filter(k => k.startsWith('p4_2_vertex_'))
        .map(k => answers[k])
        .filter(v => v);
    
    // Vertex count
    if (studentVertices.length === labels.length) score += 1;
    
    // Vertex labels
    studentVertices.forEach(v => {
        if (labels.includes(v)) score += 1;
        else score -= 1;
    });
    
    // Graph edges
    const studentGraphEdges = answers['p4_2_edges'] || [];
    studentGraphEdges.forEach(edge => {
        if (correctEdges.includes(edge) || correctEdges.includes(edge.split('-').reverse().join('-'))) {
            score += 1;
        } else {
            score -= 1;
        }
    });
    
    // Q3: Matrix scoring
    let matrixScore = 0;
    for (let r of labels) {
        for (let c of labels) {
            const key = `p4_3_${r}_${c}`;
            if (answers[key] !== undefined) {
                const correct = adjacency[r].includes(c) ? '1' : '0';
                if (answers[key] === correct) matrixScore++;
                else matrixScore--;
            }
        }
    }
    
    score += matrixScore;
    
    // Clamp to zero
    return Math.max(0, score);
}

// Save to localStorage as backup
function saveToLocalStorage() {
    try {
        const examID = document.getElementById('examID')?.value || 'dsalgo1-finals';
        const key = `${examID}_part4_answers`;
        const answers = collectAllAnswers();
        
        // Save graph edges separately
        localStorage.setItem(`${examID}_part4_graphEdges`, JSON.stringify(graphEdges));
        localStorage.setItem(key, JSON.stringify(answers));
        localStorage.setItem(`${examID}_part4_lastSave`, new Date().toISOString());
    } catch (e) {
        console.error('Local storage save failed:', e);
    }
}

// Load from localStorage backup
function loadFromLocalStorage() {
    try {
        const examID = document.getElementById('examID')?.value || 'dsalgo1-finals';
        const saved = localStorage.getItem(`${examID}_part4_answers`);
        
        if (saved) {
            const loadedAnswers = JSON.parse(saved);
            Object.assign(currentAnswers, loadedAnswers);
            
            // Restore edge list
            const edgeKeys = Object.keys(loadedAnswers).filter(k => k.startsWith('p4_1_edge_'));
            if (edgeKeys.length > 0) {
                edgeKeys.sort((a, b) => {
                    const numA = parseInt(a.split('_').pop(), 10);
                    const numB = parseInt(b.split('_').pop(), 10);
                    return numA - numB;
                });
                
                edgeKeys.forEach(key => {
                    addEdgeRow(loadedAnswers[key]);
                });
            }
            
            // Restore graph edges
            const savedEdges = localStorage.getItem(`${examID}_part4_graphEdges`);
            if (savedEdges) {
                try {
                    graphEdges = JSON.parse(savedEdges);
                    updateEdgeListDisplay();
                } catch (e) {
                    console.error('Error loading graph edges:', e);
                }
            }
            
            // Restore graph builder
            const vertexCount = Object.keys(loadedAnswers).filter(k => k.startsWith('p4_2_vertex_')).length;
            if (vertexCount > 0) {
                document.getElementById('vertexCountInput').value = vertexCount;
                const vertexLabels = [];
                for (let i = 0; i < vertexCount; i++) {
                    vertexLabels.push(loadedAnswers[`p4_2_vertex_${i}`] || '');
                }
                updateVertexLabels(vertexCount, vertexLabels);
            }
            
            updateProgress();
            showMessage('Previously saved answers loaded', 'success', 3000);
        }
    } catch (e) {
        console.error('Local storage load failed:', e);
    }
}

// Load student data and adjacency list from server
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
            
            // Load or generate adjacency list
            if (doc.answers && doc.answers.generatedAdjacency && doc.answers.generatedLabels) {
                adjacencyData = {
                    labels: doc.answers.generatedLabels,
                    adjacency: doc.answers.generatedAdjacency
                };
            } else {
                adjacencyData = generateSymmetricAdjacencyList();
                
                // Save generated adjacency to server
                await fetch('/api/activity/dsalgo1-finals/info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'save',
                        examID,
                        studentIDNumber: storedID,
                        pageNumber: 4,
                        answers: {
                            generatedLabels: adjacencyData.labels,
                            generatedAdjacency: adjacencyData.adjacency
                        }
                    })
                });
            }
            
            // Display adjacency list
            displayAdjacencyList(adjacencyData.labels, adjacencyData.adjacency);
            
            // Load server answers if they exist
            if (doc.answers) {
                Object.entries(doc.answers).forEach(([key, value]) => {
                    if (!key.startsWith('score_') && !key.startsWith('generated')) {
                        currentAnswers[key] = value;
                        
                        // Update UI elements
                        const element = document.querySelector(`[name="${key}"]`);
                        if (element) {
                            element.value = value;
                            
                            if (element.classList.contains('matrix-input')) {
                                element.classList.toggle('edge', value === '1');
                            }
                        }
                    }
                });
                
                // Update graph builder if edges exist
                if (doc.answers.p4_2_edges) {
                    graphEdges = doc.answers.p4_2_edges.map(edge => {
                        const [from, to] = edge.split('-');
                        return { from, to };
                    });
                    updateEdgeListDisplay();
                }
                
                updateProgress();
                updateMatrixTable();
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

// Save button handler
function setupSaveButton() {
    const saveBtn = document.getElementById('savePart4Btn');
    const saveStatus = document.getElementById('savePart4Status');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            saveBtn.disabled = true;
            saveStatus.textContent = 'Saving...';
            
            const result = await saveProgressToServer();
            
            if (result?.success) {
                saveStatus.textContent = 'Saved!';
                setTimeout(() => {
                    saveStatus.textContent = '';
                    saveBtn.disabled = false;
                }, 2000);
            } else {
                saveStatus.textContent = 'Failed to save';
                saveBtn.disabled = false;
            }
        });
    }
}

// Submit part 4
async function submitPart4() {
    if (isSubmitting) return;
    
    const storedID = sessionStorage.getItem('studentIDNumber');
    if (!storedID) {
        showMessage('No student ID found. Please return to the information page.', 'error');
        return;
    }
    
    // Confirm submission
    const fullName = document.getElementById('studentNameDisplay').textContent;
    const enteredName = prompt(
        "This is your final submission for Part 4.\n\n" +
        "To confirm, please enter your full name exactly as shown below:\n\n" +
        fullName + "\n\n" +
        "Once submitted, you cannot make further changes."
    );
    
    if (!enteredName || enteredName.trim() !== fullName) {
        alert("Submission cancelled. The entered name does not match your registered full name.");
        return;
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
        showMessage('Part 4 submitted successfully!', 'success');
        
        // Mark as completed
        window.isNavigatingAway = true;
        
        // Clear auto-save interval
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
        }
        
        // Reset tab monitor if function exists
        if (typeof window.resetTabMonitor === 'function') {
            window.resetTabMonitor();
        }
        
        // Mark completion in backend
        await fetch('/api/activity/dsalgo1-finals/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save',
                examID: document.getElementById('examID').value,
                studentIDNumber: storedID,
                pageNumber: 4,
                answers: { completed: true }
            })
        });
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = '/activity/dsalgo1/dsalgo1-finals-finish';
        }, 2000);
    } else {
        showMessage('Submission failed. Please try again.', 'error');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Part 4';
        }
        isSubmitting = false;
    }
}

// Setup back button
function setupBackButton() {
    const backLink = document.querySelector('a.button-link[href*="dsalgo1-finals-part3"]');
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
    
    // Load student data and adjacency list
    loadStudentData();
    
    // Setup save button
    setupSaveButton();
    
    // Setup back button
    setupBackButton();
    
    // Setup form submission
    const form = document.getElementById('part4Form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitPart4();
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
