document.addEventListener('DOMContentLoaded', () => {
    if (!sessionStorage.getItem('studentIDNumber')) {
        alert("You must log in with your student ID to access this page.");
        window.location.href = "/activity/dsalgo1/dsalgo1-finals-info.html";
        throw new Error("No student ID in sessionStorage");
    }

    const storedID = sessionStorage.getItem('studentIDNumber');
    const idSpan = document.getElementById('studentIDNumberDisplay');
    const nameSpan = document.getElementById('studentNameDisplay');
    const sectionSpan = document.getElementById('sectionDisplay');
    const messageEl = document.getElementById('message');
    const form = document.getElementById('part3Form');

    // Prevent Enter key from submitting the form
    if (form) {
        form.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
                e.preventDefault();
            }
        });
    }

    const distanceContainer = document.getElementById('distanceGroupsContainer');
    const addDistanceBtn = document.getElementById('addDistanceBtn');
    let currentDistanceIndex = 0; // Distance 0 exists by default

    function addDistanceRow(index, value = '') {
        const row = document.createElement('div');
        row.className = 'distance-row';
        row.innerHTML = `
            <span>Distance ${index}:</span>
            <input type="text" class="distance-input" placeholder="Example: A, D, E" value="${value}">
            <button type="button" class="remove-distance-btn" title="Remove this distance level" style="margin-left:8px;${index === 0 ? 'display:none;' : ''}">Remove</button>
        `;
        distanceContainer.appendChild(row);

        // Add remove button event
        if (index !== 0) {
            row.querySelector('.remove-distance-btn').addEventListener('click', () => {
                row.remove();
                // Optionally, re-index the distance labels after removal
                Array.from(distanceContainer.children).forEach((child, idx) => {
                    child.querySelector('span').textContent = `Distance ${idx}:`;
                    // Hide remove button for Distance 0
                    const btn = child.querySelector('.remove-distance-btn');
                    if (btn) btn.style.display = idx === 0 ? 'none' : '';
                });
                currentDistanceIndex = distanceContainer.children.length - 1;
            });
        }
    }

    // Add distance level button
    if (addDistanceBtn) {
        addDistanceBtn.addEventListener('click', () => {
            currentDistanceIndex++;
            addDistanceRow(currentDistanceIndex);
        });
    }

    // If no stored ID, lock page
    if (!storedID) {
        idSpan.textContent = '[not found]';
        nameSpan.textContent = '[not found]';
        sectionSpan.textContent = '[not found]';
        messageEl.textContent = 'No student ID found. Please return to the information page.';
        form.querySelector('button[type="submit"]').disabled = true;
        return;
    }

    idSpan.textContent = storedID;
    loadExistingPart3(storedID);

    // In loadExistingPart3, restore Prim's algorithm dropdowns for question 13
    async function loadExistingPart3(studentIDNumber) {
        const examID = document.getElementById('examID').value;
        try {
            const res = await fetch('/api/activity/dsalgo1-finals/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'load', examID, studentIDNumber })
            });

            const data = await res.json();
            if (!data.success || !data.data) {
                nameSpan.textContent = '[no record found]';
                sectionSpan.textContent = '[no record found]';
                messageEl.textContent = 'No student record found. Please return to the information page.';
                form.querySelector('button[type="submit"]').disabled = true;
                return;
            }

            const doc = data.data;
            const fullName = [doc.firstName, doc.lastName].filter(Boolean).join(' ');
            nameSpan.textContent = fullName || '[name not set]';
            sectionSpan.textContent = doc.section || '[section not set]';
            messageEl.textContent = '';

            // prefill part3 answers if present
            if (doc.answers) {
                // Part 3A: Adjacency List
                ['A','B','C','D','E','F'].forEach(v => {
                    const field = document.querySelector(`[name="p3_1_${v}"]`);
                    if (field && doc.answers[`p3_1_${v}`]) {
                        field.value = doc.answers[`p3_1_${v}`];
                    }
                });
                // Part 3A: Unique Edges
                for (let i = 1; i <= 5; i++) {
                    const field = document.querySelector(`[name="p3_2_${i}"]`);
                    if (field && doc.answers[`p3_2_${i}`]) {
                        field.value = doc.answers[`p3_2_${i}`];
                    }
                }
                // Part 3A: BFS Order
                for (let i = 1; i <= 6; i++) {
                    const field = document.querySelector(`[name="p3_3_${i}"]`);
                    if (field && doc.answers[`p3_3_${i}`]) {
                        field.value = doc.answers[`p3_3_${i}`];
                    }
                }
                    // For p3_4 (final visited set after BFS from B)
    if (doc.answers['p3_4'] !== undefined) {
        const textarea = document.getElementById('p3_4');
        const input = document.getElementById('p3_4_input');
        if (textarea) textarea.value = doc.answers['p3_4'];
        if (input) {
            // Remove braces and commas for display in input
            input.value = doc.answers['p3_4'].replace(/[{},]/g, '').replace(/\s+/g, ' ').trim();
        }
    }

    // For p3_8 (reachable vertices after BFS from A)
    if (doc.answers['p3_8'] !== undefined) {
        const textarea8 = document.getElementById('p3_8');
        const input8 = document.getElementById('p3_8_input');
        if (textarea8) textarea8.value = doc.answers['p3_8'];
        if (input8) {
            input8.value = doc.answers['p3_8'].replace(/[{},]/g, '').replace(/\s+/g, ' ').trim();
        }
    }
                // Part 3B: Adjacency List
                ['A','B','C','D','E','F'].forEach(v => {
                    const field = document.querySelector(`[name="p3B_${v}"]`);
                    if (field && doc.answers[`p3B_${v}`]) {
                        field.value = doc.answers[`p3B_${v}`];
                    }
                });
                // Part 3B: BFS Order
                for (let i = 1; i <= 6; i++) {
                    const field = document.querySelector(`[name="p3_7_${i}"]`);
                    if (field && doc.answers[`p3_7_${i}`]) {
                        field.value = doc.answers[`p3_7_${i}`];
                    }
                }
                // Part 3C: Kruskal Edges and Weights
                for (let i = 1; i <= 6; i++) {
                    const edgeField = document.querySelector(`[name="p3_10_${i}_edge"]`);
                    const weightField = document.querySelector(`[name="p3_10_${i}_weight"]`);
                    const kruskalCheck = document.querySelector(`[name="p3_11_${i}"]`);
                    if (edgeField && doc.answers[`p3_10_${i}_edge`] !== undefined) {
                        edgeField.value = doc.answers[`p3_10_${i}_edge`];
                    }
                    if (weightField && doc.answers[`p3_10_${i}_weight`] !== undefined) {
                        weightField.value = doc.answers[`p3_10_${i}_weight`];
                    }
                    if (kruskalCheck && doc.answers[`p3_11_${i}`] !== undefined) {
                        kruskalCheck.checked = !!doc.answers[`p3_11_${i}`];
                    }
                }
                // Part 3C: Prim's Algorithm
                for (let i = 1; i <= 5; i++) {
                    const edgeSel = document.querySelector(`[name="p3_13_${i}_edge"]`);
                    const orderSel = document.querySelector(`[name="p3_13_${i}_order"]`);
                    if (edgeSel && doc.answers[`p3_13_${i}_edge`] !== undefined) {
                        edgeSel.value = doc.answers[`p3_13_${i}_edge`] === "None" ? "" : doc.answers[`p3_13_${i}_edge`];
                    }
                    if (orderSel && doc.answers[`p3_13_${i}_order`] !== undefined) {
                        orderSel.value = doc.answers[`p3_13_${i}_order`] === "None" ? "" : doc.answers[`p3_13_${i}_order`];
                    }
                }
                // Other answers (p3_4, p3_5, p3_8, p3_9, p3_12, p3_14, etc.)
                [
                    "p3_4", "p3_5", "p3_8", "p3_9", "p3_12", "p3_14",
                    "p3_16", "p3_17", "p3_18", "p3_19", "p3_20", "p3_21"
                ].forEach(name => {
                    const field = document.querySelector(`[name="${name}"]`);
                    if (field && doc.answers[name] !== undefined) {
                        field.value = doc.answers[name];
                    }
                });
            }
            // restore distance groups from p3_5 (if any)
            const p3_5 = document.getElementById('p3_5');
            if (p3_5 && doc.answers['p3_5']) {
                p3_5.value = doc.answers['p3_5'];
                const lines = p3_5.value.split('\n').map(l => l.trim()).filter(l => l !== '');
                distanceContainer.innerHTML = '';
                currentDistanceIndex = 0;
                lines.forEach((line, idx) => {
                    const parts = line.split(':');
                    const value = parts.length > 1 ? parts[1].trim() : '';
                    addDistanceRow(idx, value);
                    currentDistanceIndex = idx;
                });
                if (lines.length === 0) {
                    distanceContainer.innerHTML = '';
                    currentDistanceIndex = 0;
                    addDistanceRow(0);
                }
            } else {
                currentDistanceIndex = distanceContainer.querySelectorAll('.distance-row').length - 1;
            }

            // Restore graph builder edges
            if (doc.answers['p3B_edges']) {
                const p3B_edges = document.getElementById('p3B_edges');
                if (p3B_edges) {
                    p3B_edges.value = doc.answers['p3B_edges'];
                    loadGraphBuilderEdges();
                }
            }

            // Restore Prim's algorithm dropdowns for question 13
            for (let i = 1; i <= 5; i++) {
                const edgeSel = document.querySelector(`[name="p3_13_${i}_edge"]`);
                const orderSel = document.querySelector(`[name="p3_13_${i}_order"]`);
                if (edgeSel && doc.answers && typeof doc.answers[`p3_13_${i}_edge`] !== 'undefined') {
                    // If value is empty or "None", set to "None"
                    edgeSel.value = doc.answers[`p3_13_${i}_edge`] === "" ? "" : doc.answers[`p3_13_${i}_edge`] === "None" ? "" : doc.answers[`p3_13_${i}_edge`];
                    if (doc.answers[`p3_13_${i}_edge`] === "None") {
                        edgeSel.value = "";
                    }
                }
                if (orderSel && doc.answers && typeof doc.answers[`p3_13_${i}_order`] !== 'undefined') {
                    // If value is empty or "None", set to "None"
                    orderSel.value = doc.answers[`p3_13_${i}_order`] === "" ? "" : doc.answers[`p3_13_${i}_order`] === "None" ? "" : doc.answers[`p3_13_${i}_order`];
                    if (doc.answers[`p3_13_${i}_order`] === "None") {
                        orderSel.value = "";
                    }
                }
            }

            form.querySelector('button[type="submit"]').disabled = false;
        } catch (err) {
            nameSpan.textContent = '[error loading]';
            sectionSpan.textContent = '[error loading]';
            messageEl.textContent = 'Error loading student info.';
            form.querySelector('button[type="submit"]').disabled = true;
        }
    }

    // Prevent alert on navigation via links
    document.querySelectorAll('a.button-link').forEach(link => {
        link.addEventListener('click', () => {
            window.isNavigatingAway = true;
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        window.isNavigatingAway = true;
        messageEl.textContent = '';

        const examID = document.getElementById('examID').value;
        const studentIDNumber = storedID;

        // Compose distance groups into hidden p3_5 before collecting answers
        const distanceInputs = document.querySelectorAll('.distance-input');
        const lines = [];
        distanceInputs.forEach((input, idx) => {
            const value = input.value.trim();
            if (value !== '') {
                lines.push(`Distance ${idx}: ${value}`);
            }
        });
        const p3_5 = document.getElementById('p3_5');
        if (p3_5) {
            p3_5.value = lines.join('\n');
        }

        // collect answers p3_1_A–p3_1_F, p3_2_1–p3_2_5, p3_3_1–p3_3_6, p3_4–p3_21
        const answers = {};
        // Adjacency list
        ['A','B','C','D','E','F'].forEach(v => {
            const field = document.querySelector(`[name="p3_1_${v}"]`);
            if (field && field.value.trim() !== '') {
                answers[`p3_1_${v}`] = field.value.trim();
            }
        });
        // Unique edges
        for (let i = 1; i <= 5; i++) {
            const field = document.querySelector(`[name="p3_2_${i}"]`);
            if (field && field.value.trim() !== '') {
                answers[`p3_2_${i}`] = field.value.trim();
            }
        }
        // BFS order
        for (let i = 1; i <= 6; i++) {
            const field = document.querySelector(`[name="p3_3_${i}"]`);
            if (field && field.value.trim() !== '') {
                answers[`p3_3_${i}`] = field.value.trim();
            }
        }
        // Other answers
        for (let i = 4; i <= 21; i++) {
            const name = `p3_${i}`;
            const field = document.querySelector(`[name="${name}"]`);
            if (field && field.value.trim() !== '') {
                answers[name] = field.value.trim();
            }
        }
        // Add distance groups to answers
        if (p3_5 && p3_5.value.trim() !== '') {
            answers['p3_5'] = p3_5.value.trim();
        }

        // 1. Place this at the top of your file (or before the submit handler)
const part3AnswerKey = {
    // 3A – Undirected graph
    p3_1_A: "B, C",
    p3_1_B: "A, D, E",
    p3_1_C: "A, F",
    p3_1_D: "B",
    p3_1_E: "B",
    p3_1_F: "C",
    p3_2_1: "A–B",
    p3_2_2: "A–C",
    p3_2_3: "B–D",
    p3_2_4: "B–E",
    p3_2_5: "C–F",
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

// 2. Add this function before your submit handler
function scorePart3(answers) {
    let score = 0;
    // For string answers, ignore case and whitespace
    function normalize(val) {
        if (typeof val === "string") return val.replace(/\s+/g, '').replace(/[–—-]/g, '-').toUpperCase();
        return val;
    }
    Object.keys(part3AnswerKey).forEach(key => {
        if (typeof part3AnswerKey[key] === "boolean") {
            // For checkboxes (true/false)
            if (answers[key] === part3AnswerKey[key]) score++;
        } else {
            // For strings (normalize both)
            if (
                answers[key] !== undefined &&
                normalize(answers[key]) === normalize(part3AnswerKey[key])
            ) {
                score++;
            }
        }
    });
    return score;
}

// 3. In your main form submit handler, after collecting answers, add:
const score = scorePart3(answers);
answers['score_part3'] = score;

        const payload = {
            action: 'save',
            examID,
            studentIDNumber,
            pageNumber: 3,
            answers,
            tabSwitchCount: window.tabSwitchCount,
            tabSwitchTimestamps: window.tabSwitchTimestamps
        };

        try {
            const res = await fetch('/api/activity/dsalgo1-finals/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!data.success) {
                messageEl.textContent = data.message || 'Failed to save. Please try again.';
                window.isNavigatingAway = false;
                return;
            }

            window.resetTabMonitor();

            // Go to finish page
            window.location.href = '/activity/dsalgo1/dsalgo1-finals-part4';
        } catch (err) {
            console.error('Save error:', err);
            messageEl.textContent = 'An error occurred while saving. Please try again.';
            window.isNavigatingAway = false;
        }
    });

    const savePart3ABtn = document.getElementById('savePart3ABtn');
    const savePart3AStatus = document.getElementById('savePart3AStatus');

    if (savePart3ABtn) {
        savePart3ABtn.addEventListener('click', async () => {
            savePart3ABtn.disabled = true;
            savePart3AStatus.textContent = 'Saving...';

            // Compose distance groups into hidden p3_5 before collecting answers
            const distanceInputs = document.querySelectorAll('.distance-input');
            const lines = [];
            distanceInputs.forEach((input, idx) => {
                const value = input.value.trim();
                if (value !== '') {
                    lines.push(`Distance ${idx}: ${value}`);
                }
            });
            const p3_5 = document.getElementById('p3_5');
            if (p3_5) {
                p3_5.value = lines.join('\n');
            }

            // Collect only Part 3A answers
            const answers = {};
            // Adjacency list
            ['A','B','C','D','E','F'].forEach(v => {
                const field = document.querySelector(`[name="p3_1_${v}"]`);
                if (field && field.value.trim() !== '') {
                    answers[`p3_1_${v}`] = field.value.trim();
                }
            });
            // Unique edges
            for (let i = 1; i <= 5; i++) {
                const field = document.querySelector(`[name="p3_2_${i}"]`);
                if (field && field.value.trim() !== '') {
                    answers[`p3_2_${i}`] = field.value.trim();
                }
            }
            // BFS order
            for (let i = 1; i <= 6; i++) {
                const field = document.querySelector(`[name="p3_3_${i}"]`);
                if (field && field.value.trim() !== '') {
                    answers[`p3_3_${i}`] = field.value.trim();
                }
            }
            // Final visited set
            const p3_4 = document.querySelector(`[name="p3_4"]`);
            if (p3_4 && p3_4.value.trim() !== '') {
                answers['p3_4'] = p3_4.value.trim();
            }
            // Distance groups
            if (p3_5 && p3_5.value.trim() !== '') {
                answers['p3_5'] = p3_5.value.trim();
            }

            const examID = document.getElementById('examID').value;
            const studentIDNumber = sessionStorage.getItem('studentIDNumber');

            const payload = {
                action: 'save',
                examID,
                studentIDNumber,
                pageNumber: 3,
                answers,
                tabSwitchCount: window.tabSwitchCount,
                tabSwitchTimestamps: window.tabSwitchTimestamps
            };

            try {
                const res = await fetch('/api/activity/dsalgo1-finals/info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (!data.success) {
                    savePart3AStatus.textContent = data.message || 'Failed to save.';
                    savePart3ABtn.disabled = false;
                    return;
                }
                savePart3AStatus.textContent = 'Saved!';
                setTimeout(() => {
                    savePart3AStatus.textContent = '';
                    savePart3ABtn.disabled = false;
                }, 2000);
            } catch (err) {
                savePart3AStatus.textContent = 'Error saving. Please try again.';
                savePart3ABtn.disabled = false;
            }
        });
    }

    // --- Graph Builder Edge Saving/Loading ---

    // Utility to get vertex label from circle coordinates
    function getVertexLabelByCoords(x, y) {
        const labels = Array.from(document.querySelectorAll('#graph-builder text'));
        for (const label of labels) {
            const lx = parseFloat(label.getAttribute('x'));
            const ly = parseFloat(label.getAttribute('y'));
            // Adjust for label offset if needed
            if (Math.abs(lx - x) < 1 && Math.abs(ly - (y + 5)) < 1) {
                return label.textContent.trim();
            }
            // For direct match (if label is centered)
            if (Math.abs(lx - x) < 1 && Math.abs(ly - y) < 6) {
                return label.textContent.trim();
            }
        }
        return null;
    }

    // Save edges to hidden input
    function saveGraphBuilderEdges() {
        const svg = document.querySelector('#graph-builder svg');
        const edgeLines = Array.from(svg.querySelectorAll('line.edge'));
        const edges = edgeLines.map(line => {
            const x1 = parseFloat(line.getAttribute('x1'));
            const y1 = parseFloat(line.getAttribute('y1'));
            const x2 = parseFloat(line.getAttribute('x2'));
            const y2 = parseFloat(line.getAttribute('y2'));
            const from = getVertexLabelByCoords(x1, y1);
            const to = getVertexLabelByCoords(x2, y2);
            return from && to ? `${from}->${to}` : '';
        }).filter(Boolean);
        const hidden = document.getElementById('p3B_edges');
        if (hidden) hidden.value = edges.join(',');
    }

    // Load edges from hidden input
    function loadGraphBuilderEdges() {
        const svg = document.querySelector('#graph-builder svg');
        const hidden = document.getElementById('p3B_edges');
        if (!svg || !hidden || !hidden.value) return;
        // Remove existing edges
        svg.querySelectorAll('line.edge').forEach(line => line.remove());
        const edges = hidden.value.split(',').map(e => e.trim()).filter(Boolean);
        edges.forEach(edge => {
            const [from, to] = edge.split('->');
            if (!from || !to) return;
            // Find circles by label
            const fromLabel = Array.from(document.querySelectorAll('#graph-builder text')).find(t => t.textContent.trim() === from);
            const toLabel = Array.from(document.querySelectorAll('#graph-builder text')).find(t => t.textContent.trim() === to);
            if (!fromLabel || !toLabel) return;
            const x1 = parseFloat(fromLabel.getAttribute('x'));
            const y1 = parseFloat(fromLabel.getAttribute('y')) - 5;
            const x2 = parseFloat(toLabel.getAttribute('x'));
            const y2 = parseFloat(toLabel.getAttribute('y')) - 5;

            // Draw line with arrowhead
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('class', 'edge');
            line.setAttribute('marker-end', 'url(#arrowhead)');
            line.style.cursor = 'pointer';
            line.addEventListener('click', function(ev) {
                ev.stopPropagation();
                svg.removeChild(line);
                saveGraphBuilderEdges();
            });
            svg.appendChild(line);
        });
    }

    // Add hidden input for storing edges if not present
    if (!document.getElementById('p3B_edges')) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.id = 'p3B_edges';
        input.name = 'p3B_edges';
        document.getElementById('part3Form').appendChild(input);
    }

    // Update graph builder click handler to save edges
    const graphBuilder = document.getElementById('graph-builder');
    if (graphBuilder) {
        const svg = graphBuilder.querySelector('svg');
        let selectedNode = null;

        svg.querySelectorAll('circle').forEach(circle => {
            circle.setAttribute('pointer-events', 'bounding-box');
            circle.style.cursor = 'pointer';
        });

        // Helper: Draw arrow marker definition once
        if (!svg.querySelector('marker#arrowhead')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead');
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '7');
            marker.setAttribute('refX', '10');
            marker.setAttribute('refY', '3.5');
            marker.setAttribute('orient', 'auto');
            marker.setAttribute('markerUnits', 'strokeWidth');
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
            polygon.setAttribute('fill', '#999');
            marker.appendChild(polygon);
            defs.appendChild(marker);
            svg.insertBefore(defs, svg.firstChild);
        }

        // Utility to check for duplicate edge
        function edgeExists(x1, y1, x2, y2) {
            return Array.from(svg.querySelectorAll('line.edge')).some(line => {
                return (
                    parseFloat(line.getAttribute('x1')) === x1 &&
                    parseFloat(line.getAttribute('y1')) === y1 &&
                    parseFloat(line.getAttribute('x2')) === x2 &&
                    parseFloat(line.getAttribute('y2')) === y2
                );
            });
        }

        svg.addEventListener('click', (e) => {
            let target = e.target;
            if (target.tagName === 'text') {
                const x = target.getAttribute('x');
                const y = parseFloat(target.getAttribute('y')) - 5;
                target = Array.from(svg.querySelectorAll('circle')).find(c =>
                    parseFloat(c.getAttribute('cx')) === parseFloat(x) &&
                    parseFloat(c.getAttribute('cy')) === y
                );
            }

            if (target && target.tagName === 'circle') {
                if (!selectedNode) {
                    selectedNode = target;
                    selectedNode.setAttribute('stroke', 'red');
                } else if (selectedNode !== target) {
                    const startNode = selectedNode;
                    const endNode = target;
                    startNode.setAttribute('stroke', '#333');
                    selectedNode = null;

                    const x1 = parseFloat(startNode.getAttribute('cx'));
                    const y1 = parseFloat(startNode.getAttribute('cy'));
                    const x2 = parseFloat(endNode.getAttribute('cx'));
                    const y2 = parseFloat(endNode.getAttribute('cy'));

                    if (edgeExists(x1, y1, x2, y2)) {
                        return;
                    }

                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', x1);
                    line.setAttribute('y1', y1);
                    line.setAttribute('x2', x2);
                    line.setAttribute('y2', y2);
                    line.setAttribute('class', 'edge');
                    line.setAttribute('marker-end', 'url(#arrowhead)');
                    line.style.cursor = 'pointer';
                    line.addEventListener('click', function(ev) {
                        ev.stopPropagation();
                        svg.removeChild(line);
                        saveGraphBuilderEdges();
                    });
                    svg.appendChild(line);
                    saveGraphBuilderEdges();
                } else {
                    selectedNode.setAttribute('stroke', '#333');
                    selectedNode = null;
                }
            }
            // If an edge (line) is clicked directly, remove it
            if (e.target.tagName === 'line' && e.target.classList.contains('edge')) {
                svg.removeChild(e.target);
                saveGraphBuilderEdges();
            }
        });

        // Load edges on page load
        loadGraphBuilderEdges();
    }

    // --- Update Save Button Handler for Part 3B ---
    const savePart3BBtn = document.getElementById('savePart3BBtn');
    const savePart3BStatus = document.getElementById('savePart3BStatus');
    if (savePart3BBtn) {
        savePart3BBtn.addEventListener('click', async () => {
            savePart3BBtn.disabled = true;
            savePart3BStatus.textContent = 'Saving...';

            // Collect only Part 3B answers
            const answers = {};
            // Adjacency list for 3B
            ['A','B','C','D','E','F'].forEach(v => {
                const field = document.querySelector(`[name="p3B_${v}"]`);
                if (field && field.value.trim() !== '') {
                    answers[`p3B_${v}`] = field.value.trim();
                }
            });
            // BFS order for 3B (now p3_7_1 to p3_7_6)
            for (let i = 1; i <= 6; i++) {
                const field = document.querySelector(`[name="p3_7_${i}"]`);
                if (field && field.value.trim() !== '') {
                    answers[`p3_7_${i}`] = field.value.trim();
                }
            }
            // Reachable set (now p3_8)
            const p3_8 = document.querySelector(`[name="p3_8"]`);
            if (p3_8 && p3_8.value.trim() !== '') {
                answers['p3_8'] = p3_8.value.trim();
            }
            // Unreachable (now p3_9)
            const p3_9 = document.querySelector(`[name="p3_9"]`);
            if (p3_9 && p3_9.value.trim() !== '') {
                answers['p3_9'] = p3_9.value.trim();
            }
            // Graph builder edges
            const p3B_edges = document.getElementById('p3B_edges');
            if (p3B_edges && p3B_edges.value.trim() !== '') {
                answers['p3B_edges'] = p3B_edges.value.trim();
            }

            const examID = document.getElementById('examID').value;
            const studentIDNumber = sessionStorage.getItem('studentIDNumber');

            const payload = {
                action: 'save',
                examID,
                studentIDNumber,
                pageNumber: 3,
                answers,
                tabSwitchCount: window.tabSwitchCount,
                tabSwitchTimestamps: window.tabSwitchTimestamps
            };

            try {
                const res = await fetch('/api/activity/dsalgo1-finals/info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (!data.success) {
                    savePart3BStatus.textContent = data.message || 'Failed to save.';
                    savePart3BBtn.disabled = false;
                    return;
                }
                savePart3BStatus.textContent = 'Saved!';
                setTimeout(() => {
                    savePart3BStatus.textContent = '';
                    savePart3BBtn.disabled = false;
                }, 2000);
            } catch (err) {
                savePart3BStatus.textContent = 'Error saving. Please try again.';
                savePart3BBtn.disabled = false;
            }
        });
    }

    // --- On load, restore edges if present ---
    document.addEventListener('DOMContentLoaded', () => {
        loadGraphBuilderEdges();
    });

    // BFS visited set formatting for Part 3A
    const input = document.getElementById('p3_4_input');
    const textarea = document.getElementById('p3_4');
    const formatDiv = document.getElementById('p3_4_format');
    if (input && textarea && formatDiv) {
        function updateFormat() {
            let vals = input.value.split(/[\s,]+/).map(v => v.trim().toUpperCase()).filter(v => v);
            vals = [...new Set(vals)];
            const formatted = vals.length ? `{${vals.join(', ')}}` : '';
            textarea.value = formatted;
            formatDiv.textContent = formatted ? `Your answer: ${formatted}` : '';
        }
        input.addEventListener('blur', updateFormat);
        input.addEventListener('input', () => {
            formatDiv.textContent = '';
        });
    }

    // BFS visited set formatting for Part 3B
    const input7 = document.getElementById('p3_7_input');
    const textarea7 = document.getElementById('p3_7');
    const formatDiv7 = document.getElementById('p3_7_format');
    if (input7 && textarea7 && formatDiv7) {
        function updateFormat7() {
            let vals = input7.value.split(/[\s,]+/).map(v => v.trim().toUpperCase()).filter(v => v);
            vals = [...new Set(vals)];
            const formatted = vals.length ? `{${vals.join(', ')}}` : '';
            textarea7.value = formatted;
            formatDiv7.textContent = formatted ? `Your answer: ${formatted}` : '';
        }
        input7.addEventListener('blur', updateFormat7);
        input7.addEventListener('input', () => {
            formatDiv7.textContent = '';
        });
    }

    // Update formatting for reachable set (now p3_8)
    const input8 = document.getElementById('p3_8_input');
    const textarea8 = document.getElementById('p3_8');
    const formatDiv8 = document.getElementById('p3_8_format');
    if (input8 && textarea8 && formatDiv8) {
        function updateFormat8() {
            let vals = input8.value.split(/[\s,]+/).map(v => v.trim().toUpperCase()).filter(v => v);
            vals = [...new Set(vals)];
            const formatted = vals.length ? `{${vals.join(', ')}}` : '';
            textarea8.value = formatted;
            formatDiv8.textContent = formatted ? `Your answer: ${formatted}` : '';
        }
        input8.addEventListener('blur', updateFormat8);
        input8.addEventListener('input', () => {
            formatDiv8.textContent = '';
        });
    }

    const savePart3CBtn = document.getElementById('savePart3CBtn');
    const savePart3CStatus = document.getElementById('savePart3CStatus');
    if (savePart3CBtn) {
        savePart3CBtn.addEventListener('click', async () => {
            savePart3CBtn.disabled = true;
            savePart3CStatus.textContent = 'Saving...';

            // Collect only Part 3C answers
            const answers = {};
            // Edges and weights for Kruskal
            for (let i = 1; i <= 6; i++) {
                const edgeField = document.querySelector(`[name="p3_10_${i}_edge"]`);
                const weightField = document.querySelector(`[name="p3_10_${i}_weight"]`);
                const kruskalCheck = document.querySelector(`[name="p3_11_${i}"]`);
                answers[`p3_10_${i}_edge`] = edgeField ? edgeField.value.trim() : '';
                answers[`p3_10_${i}_weight`] = weightField ? weightField.value.trim() : '';
                answers[`p3_11_${i}`] = kruskalCheck ? kruskalCheck.checked : false;
            }
            // MCST total cost for Kruskal
            const p3_12 = document.querySelector(`[name="p3_12"]`);
            answers['p3_12'] = p3_12 ? p3_12.value.trim() : '';
            // Prim's algorithm edge order and order
            for (let i = 1; i <= 5; i++) {
                const edgeSel = document.querySelector(`[name="p3_13_${i}_edge"]`);
                const orderSel = document.querySelector(`[name="p3_13_${i}_order"]`);
                answers[`p3_13_${i}_edge`] = edgeSel && edgeSel.value ? edgeSel.value : "None";
                answers[`p3_13_${i}_order`] = orderSel && orderSel.value ? orderSel.value : "None";
            }
            // MCST total cost for Prim
            const p3_14 = document.querySelector(`[name="p3_14"]`);
            answers['p3_14'] = p3_14 ? p3_14.value.trim() : '';

            const examID = document.getElementById('examID').value;
            const studentIDNumber = sessionStorage.getItem('studentIDNumber');

            const payload = {
                action: 'save',
                examID,
                studentIDNumber,
                pageNumber: 3,
                answers,
                tabSwitchCount: window.tabSwitchCount,
                tabSwitchTimestamps: window.tabSwitchTimestamps
            };

            try {
                const res = await fetch('/api/activity/dsalgo1-finals/info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (!data.success) {
                    savePart3CStatus.textContent = data.message || 'Failed to save.';
                    savePart3CBtn.disabled = false;
                    return;
                }
                savePart3CStatus.textContent = 'Saved!';
                setTimeout(() => {
                    savePart3CStatus.textContent = '';
                    savePart3CBtn.disabled = false;
                }, 2000);
            } catch (err) {
                savePart3CStatus.textContent = 'Error saving. Please try again.';
                savePart3CBtn.disabled = false;
            }
        });
    }

    // Watch for changes in p3_4_input and update both display and stored value
    const inputP34 = document.getElementById('p3_4_input');
    const textareaP34 = document.getElementById('p3_4');
    const formatDivP34 = document.getElementById('p3_4_format');
    if (inputP34 && textareaP34 && formatDivP34) {
        function updateP34() {
            let vals = inputP34.value.split(/[\s,]+/).map(v => v.trim().toUpperCase()).filter(v => v);
            vals = [...new Set(vals)];
            const formatted = vals.length ? `{${vals.join(', ')}}` : '';
            textareaP34.value = formatted;
            formatDivP34.textContent = formatted ? `Your answer: ${formatted}` : '';
        }
        inputP34.addEventListener('input', updateP34);
        inputP34.addEventListener('blur', updateP34);
    }

    // Watch for changes in p3_8_input and update both display and stored value
    const inputP38 = document.getElementById('p3_8_input');
    const textareaP38 = document.getElementById('p3_8');
    const formatDivP38 = document.getElementById('p3_8_format');
    if (inputP38 && textareaP38 && formatDivP38) {
        function updateP38() {
            let vals = inputP38.value.split(/[\s,]+/).map(v => v.trim().toUpperCase()).filter(v => v);
            vals = [...new Set(vals)];
            const formatted = vals.length ? `{${vals.join(', ')}}` : '';
            textareaP38.value = formatted;
            formatDivP38.textContent = formatted ? `Your answer: ${formatted}` : '';
        }
        inputP38.addEventListener('input', updateP38);
        inputP38.addEventListener('blur', updateP38);
    }

});