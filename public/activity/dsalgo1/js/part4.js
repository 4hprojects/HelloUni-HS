document.addEventListener('DOMContentLoaded', async () => {
    const idSpan = document.getElementById('studentIDNumberDisplay');
    const nameSpan = document.getElementById('studentNameDisplay');
    const sectionSpan = document.getElementById('sectionDisplay');
    const messageEl = document.getElementById('message');
    const form = document.getElementById('part4Form');
    const examID = document.getElementById('examID').value;
    const storedID = sessionStorage.getItem('studentIDNumber');

    // --- Redirect if no student ID ---
    if (!storedID) {
        alert("You must log in with your student ID to access this page.");
        window.location.href = "/activity/dsalgo1/dsalgo1-finals-info.html";
        throw new Error("No student ID in sessionStorage");
    }

    // Default display
    idSpan.textContent = '[loading...]';
    nameSpan.textContent = '[loading...]';
    sectionSpan.textContent = '[loading...]';

    if (!storedID) {
        idSpan.textContent = '[not found]';
        nameSpan.textContent = '[not found]';
        sectionSpan.textContent = '[not found]';
        messageEl.textContent = 'No student ID found. Please return to the information page.';
        form.querySelector('button[type="submit"]').disabled = true;
        document.getElementById('savePart4Btn').disabled = true;
        return;
    }

    idSpan.textContent = storedID;

    // --- Adjacency List Generation and Persistence ---
    function generateSymmetricAdjacencyList(vertexCount = 10, maxEdges = 25) {
        const labels = [];
        for (let i = 0; i < vertexCount; i++) {
            labels.push(String.fromCharCode(65 + i)); // A, B, C, ...
        }
        const adjacency = {};
        for (let i = 0; i < vertexCount; i++) {
            adjacency[labels[i]] = [];
        }
        // Generate all possible unique edges (ascending order)
        const possibleEdges = [];
        for (let i = 0; i < vertexCount; i++) {
            for (let j = i + 1; j < vertexCount; j++) {
                possibleEdges.push([labels[i], labels[j]]);
            }
        }
        // Shuffle and pick up to maxEdges
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

    let initialLabels = null;
    let initialAdjacency = null;

    function displayAdjacencyList(labels, adjacency) {
        let adjacencyListPre = document.getElementById('generatedAdjacencyList');
        if (!adjacencyListPre) {
            adjacencyListPre = document.createElement('pre');
            adjacencyListPre.id = 'generatedAdjacencyList';
            adjacencyListPre.style.background = '#f8f9fa';
            adjacencyListPre.style.padding = '0.75rem';
            adjacencyListPre.style.borderRadius = '4px';
            adjacencyListPre.style.marginBottom = '1rem';
            document.querySelector('main').insertBefore(adjacencyListPre, document.querySelector('form'));
        }
        adjacencyListPre.textContent = Object.entries(adjacency)
            .map(([v, neighbors]) => `${v}: ${neighbors.join(', ')}`).join('\n');
    }

    // Load student info and previous answers
    let doc = null;
    try {
        const res = await fetch('/api/activity/dsalgo1-finals/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'load', examID, studentIDNumber: storedID })
        });
        const data = await res.json();
        if (!data.success || !data.data) {
            nameSpan.textContent = '[no record found]';
            sectionSpan.textContent = '[no record found]';
            messageEl.textContent = 'No student record found. Please return to the information page.';
            form.querySelector('button[type="submit"]').disabled = true;
            document.getElementById('savePart4Btn').disabled = true;
            return;
        }
        doc = data.data;
        const fullName = [doc.firstName, doc.lastName].filter(Boolean).join(' ');
        nameSpan.textContent = fullName || '[name not set]';
        sectionSpan.textContent = doc.section || '[section not set]';
        messageEl.textContent = '';

        // --- Adjacency List: Load or Generate ---
        if (doc.answers && doc.answers.generatedAdjacency && doc.answers.generatedLabels) {
            initialLabels = doc.answers.generatedLabels;
            initialAdjacency = doc.answers.generatedAdjacency;
        } else {
            const generated = generateSymmetricAdjacencyList(10, 25);
            initialLabels = generated.labels;
            initialAdjacency = generated.adjacency;
            // Save to backend immediately so it's persistent
            await fetch('/api/activity/dsalgo1-finals/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save',
                    examID,
                    studentIDNumber: storedID,
                    pageNumber: 4,
                    answers: {
                        generatedLabels: initialLabels,
                        generatedAdjacency: initialAdjacency
                    }
                })
            });
        }
        displayAdjacencyList(initialLabels, initialAdjacency);

        // --- Dynamic Edge List Logic ---
        const edgesListContainer = document.getElementById('edgesListContainer');
        const addEdgeBtn = document.getElementById('addEdgeBtn');
        let edgeCount = 0;

        function createEdgeRow(value = '') {
            edgeCount++;
            const row = document.createElement('div');
            row.className = 'edges-list-row';
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '0.5rem';

            const label = document.createElement('span');
            label.textContent = `Edge ${edgeCount}:`;

            const input = document.createElement('input');
            input.type = 'text';
            input.name = `p4_1_edge_${edgeCount}`;
            input.placeholder = 'e.g. A–B';
            input.value = value;
            input.style.flex = '1';

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.textContent = 'Delete';
            delBtn.style.marginLeft = '0.5rem';
            delBtn.onclick = () => {
                edgesListContainer.removeChild(row);
                updateEdgeLabels();
            };

            row.appendChild(label);
            row.appendChild(input);
            row.appendChild(delBtn);
            edgesListContainer.appendChild(row);
        }

        function updateEdgeLabels() {
            const rows = edgesListContainer.querySelectorAll('.edges-list-row');
            edgeCount = 0;
            rows.forEach((row, idx) => {
                edgeCount++;
                row.querySelector('span').textContent = `Edge ${edgeCount}:`;
                row.querySelector('input').name = `p4_1_edge_${edgeCount}`;
            });
        }

        addEdgeBtn.addEventListener('click', () => {
            createEdgeRow('');
        });

        // --- Prefill answers if present ---
        if (doc.answers) {
            // Q1: Dynamic edge list
            // Populate edge rows from saved data
            const edgeKeys = doc.answers ? Object.keys(doc.answers).filter(k => k.startsWith('p4_1_edge_')) : [];
            if (edgeKeys.length) {
                edgeKeys.sort((a, b) => {
                    const na = parseInt(a.split('_').pop(), 10);
                    const nb = parseInt(b.split('_').pop(), 10);
                    return na - nb;
                });
                edgeKeys.forEach(k => createEdgeRow(doc.answers[k]));
            } else {
                createEdgeRow('');
            }
        } else {
            createEdgeRow('');
        }

        form.querySelector('button[type="submit"]').disabled = false;
        document.getElementById('savePart4Btn').disabled = false;
    } catch (err) {
        nameSpan.textContent = '[error loading]';
        sectionSpan.textContent = '[error loading]';
        messageEl.textContent = 'Error loading student info.';
        form.querySelector('button[type="submit"]').disabled = true;
        document.getElementById('savePart4Btn').disabled = true;
        return;
    }

    // --- Dynamic Graph Builder for Q2 ---
    const vertexCountInput = document.getElementById('vertexCountInput');
    const vertexLabelsContainer = document.getElementById('vertexLabelsContainer');
    const graphCanvas = document.getElementById('graphCanvas');
    const edgeListContainer = document.getElementById('edgeListContainer');

    let vertexLabels = [];
    let edges = [];
    let selectedVertex = null;

    function renderVertexLabels(count, labels = []) {
        vertexLabelsContainer.innerHTML = '';
        vertexLabels = [];
        for (let i = 0; i < count; i++) {
            const labelInput = document.createElement('input');
            labelInput.type = 'text';
            labelInput.maxLength = 2;
            labelInput.placeholder = '';
            labelInput.value = labels[i] || '';
            labelInput.style.width = '40px';
            labelInput.style.marginRight = '8px';
            labelInput.oninput = () => {
                vertexLabels[i] = labelInput.value.trim().toUpperCase();
                renderGraphCanvas();
                renderEdgeList();
            };
            vertexLabelsContainer.appendChild(labelInput);
            vertexLabels.push(labelInput.value.trim().toUpperCase());
        }
        renderGraphCanvas();
        renderEdgeList();
    }

    function renderGraphCanvas() {
        graphCanvas.innerHTML = '';
        const count = vertexLabels.length;
        const radius = 22;
        const cx = 240, cy = 140, r = 100;
        const positions = [];
        for (let i = 0; i < count; i++) {
            const angle = (2 * Math.PI * i) / count - Math.PI / 2;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            positions.push({ x, y });
        }
        // Draw edges
        edges.forEach(edge => {
            const idx1 = vertexLabels.indexOf(edge[0]);
            const idx2 = vertexLabels.indexOf(edge[1]);
            if (idx1 !== -1 && idx2 !== -1) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', positions[idx1].x);
                line.setAttribute('y1', positions[idx1].y);
                line.setAttribute('x2', positions[idx2].x);
                line.setAttribute('y2', positions[idx2].y);
                line.setAttribute('stroke', '#22863a');
                line.setAttribute('stroke-width', '3');
                line.style.cursor = 'pointer';
                line.addEventListener('click', () => {
                    edges = edges.filter(e => !(e[0] === edge[0] && e[1] === edge[1]));
                    renderGraphCanvas();
                    renderEdgeList();
                });
                graphCanvas.appendChild(line);
            }
        });
        // Draw vertices (group for easier click)
        for (let i = 0; i < count; i++) {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.style.cursor = 'pointer';

            // Highlight selection with a larger transparent circle
            if (selectedVertex === i) {
                const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                highlight.setAttribute('cx', positions[i].x);
                highlight.setAttribute('cy', positions[i].y);
                highlight.setAttribute('r', radius + 8);
                highlight.setAttribute('fill', '#ffe5b4');
                highlight.setAttribute('stroke', '#e67e22');
                highlight.setAttribute('stroke-width', '2');
                group.appendChild(highlight);
            }

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', positions[i].x);
            circle.setAttribute('cy', positions[i].y);
            circle.setAttribute('r', radius);
            circle.setAttribute('fill', '#fff');
            circle.setAttribute('stroke', selectedVertex === i ? '#e67e22' : '#333');
            circle.setAttribute('stroke-width', selectedVertex === i ? '4' : '2');
            group.appendChild(circle);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', positions[i].x);
            text.setAttribute('y', positions[i].y + 6);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '18');
            text.setAttribute('font-weight', 'bold');
            text.textContent = vertexLabels[i];
            group.appendChild(text);

            group.addEventListener('click', () => {
                if (selectedVertex === null) {
                    selectedVertex = i;
                    renderGraphCanvas();
                } else if (selectedVertex !== i) {
                    // Add edge if not exists
                    const v1 = vertexLabels[selectedVertex];
                    const v2 = vertexLabels[i];
                    if (v1 && v2 && !edges.some(e => (e[0] === v1 && e[1] === v2) || (e[0] === v2 && e[1] === v1))) {
                        edges.push([v1, v2]);
                    }
                    selectedVertex = null;
                    renderGraphCanvas();
                    renderEdgeList();
                } else {
                    selectedVertex = null;
                    renderGraphCanvas();
                }
            });

            graphCanvas.appendChild(group);
        }
    }

    // Render edge list
    function renderEdgeList() {
        edgeListContainer.innerHTML = '<strong>Edges:</strong> ';
        if (!edges.length) {
            edgeListContainer.innerHTML += '<span style="color:#888;">None</span>';
            return;
        }
        edges.forEach((edge, idx) => {
            const span = document.createElement('span');
            span.textContent = `${edge[0]}–${edge[1]}`;
            span.style.marginRight = '12px';
            edgeListContainer.appendChild(span);
        });
    }

    // Initial setup
    vertexCountInput.addEventListener('input', () => {
        let count = parseInt(vertexCountInput.value, 10);
        if (isNaN(count) || count < 2) count = 2;
        if (count > 10) count = 10;
        edges = [];
        selectedVertex = null;
        renderVertexLabels(count);
    });
    renderVertexLabels(parseInt(vertexCountInput.value, 10));

    // --- Dynamic Adjacency Matrix Builder ---
    const matrixSizeInput = document.getElementById('matrixSizeInput');
    const matrixVertexLabelsContainer = document.getElementById('matrixVertexLabelsContainer');
    const dynamicMatrixWrapper = document.getElementById('dynamicMatrixWrapper');

    let matrixVertexLabels = [];

    function renderMatrixVertexLabels(size, labels = []) {
        matrixVertexLabelsContainer.innerHTML = '';
        matrixVertexLabels = [];
        for (let i = 0; i < size; i++) {
            const labelInput = document.createElement('input');
            labelInput.type = 'text';
            labelInput.maxLength = 2;
            labelInput.placeholder = '';
            labelInput.value = labels[i] || '';
            labelInput.style.width = '40px';
            labelInput.style.marginRight = '8px';
            labelInput.oninput = () => {
                matrixVertexLabels[i] = labelInput.value.trim().toUpperCase();
                renderDynamicMatrix();
            };
            matrixVertexLabelsContainer.appendChild(labelInput);
            matrixVertexLabels.push(labelInput.value.trim().toUpperCase());
        }
        renderDynamicMatrix();
    }

    function renderDynamicMatrix() {
        dynamicMatrixWrapper.innerHTML = '';
        const size = matrixVertexLabels.length;
        const table = document.createElement('table');
        table.className = 'matrix-table';
        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        headRow.appendChild(document.createElement('th'));
        for (let i = 0; i < size; i++) {
            const th = document.createElement('th');
            th.textContent = matrixVertexLabels[i];
            headRow.appendChild(th);
        }
        thead.appendChild(headRow);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        for (let r = 0; r < size; r++) {
            const row = document.createElement('tr');
            const th = document.createElement('th');
            th.textContent = matrixVertexLabels[r];
            row.appendChild(th);
            for (let c = 0; c < size; c++) {
                const td = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.placeholder = '0/1';
                input.name = `p4_3_${matrixVertexLabels[r]}_${matrixVertexLabels[c]}`;
                td.appendChild(input);
                row.appendChild(td);
            }
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        dynamicMatrixWrapper.appendChild(table);
    }

    // Initial setup
    matrixSizeInput.addEventListener('input', () => {
        let size = parseInt(matrixSizeInput.value, 10);
        if (isNaN(size) || size < 2) size = 2;
        if (size > 10) size = 10;
        renderMatrixVertexLabels(size);
    });
    renderMatrixVertexLabels(parseInt(matrixSizeInput.value, 10));

    // --- Save Handler ---
    async function savePart4() {
        const answers = {};

        // Q1: Edge list
        document.querySelectorAll('.edges-list-row input[type="text"]').forEach((input, idx) => {
            answers[`p4_1_edge_${idx + 1}`] = input.value.trim();
        });

        // Q2: Graph builder
        answers['p4_2_vertices'] = vertexLabels.slice();
        answers['p4_2_edges'] = edges.map(e => [e[0], e[1]]);
        const quickCheck = document.getElementById('quickCheck');
        if (quickCheck) answers['p4_2_quickCheck'] = quickCheck.value.trim();

        // Q3: Matrix
        document.querySelectorAll('#dynamicMatrixWrapper input[type="text"]').forEach(input => {
            answers[input.name] = input.value.trim();
        });

        // Store the generated adjacency list and labels for this student
        answers['generatedLabels'] = initialLabels;
        answers['generatedAdjacency'] = initialAdjacency;

        // Score
        const rawScore = scorePart4(answers, initialAdjacency, initialLabels);
        answers['score_part4_raw'] = rawScore;

        // Calculate max possible points for this student's graph
        const maxEdges = (() => {
            let count = 0;
            for (let v of initialLabels) {
                for (let n of initialAdjacency[v]) {
                    if (initialLabels.indexOf(v) < initialLabels.indexOf(n)) count++;
                }
            }
            return count;
        })();
        const maxPoints = maxEdges + 1 + initialLabels.length + maxEdges + (initialLabels.length * initialLabels.length);
        // edge list + vertex count + vertex labels + graph builder edges + matrix

        answers['score_part4_max'] = maxPoints;

        // Scale to 50 points (divide by 3, round to 2 decimals, allow bonus)
        const scaledScore = Math.round((rawScore / 3) * 100) / 100;
        answers['score'] = scaledScore;

        // --- Compute total score before redirecting ---
        const getNum = v => (typeof v === 'number' ? v : Number(v) || 0);
        const totalScore =
            getNum(answers['score_part1']) +
            getNum(answers['score_part2']) +
            getNum(answers['score_part3']) +
            scaledScore;
        answers['total_score'] = totalScore;

        // Save to backend
        document.getElementById('savePart4Btn').disabled = true;
        document.getElementById('savePart4Status').textContent = 'Saving...';
        try {
            const res = await fetch('/api/activity/dsalgo1-finals/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save',
                    examID,
                    studentIDNumber: storedID,
                    pageNumber: 4,
                    answers
                })
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById('savePart4Status').textContent = 'Saved!';
            } else {
                document.getElementById('savePart4Status').textContent = 'Failed to save.';
            }
        } catch (err) {
            document.getElementById('savePart4Status').textContent = 'Error saving.';
        }
        setTimeout(() => {
            document.getElementById('savePart4Status').textContent = '';
            document.getElementById('savePart4Btn').disabled = false;
        }, 2000);
    }

    document.getElementById('savePart4Btn').addEventListener('click', savePart4);
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Prompt for full name confirmation
        const fullName = [nameSpan.textContent].join(' ').trim();
        let enteredName = prompt(
            "This is your final submission for Part 4.\n\nTo confirm, please enter your full name exactly as shown below:\n\n" +
            fullName +
            "\n\nOnce submitted, you cannot make further changes."
        );

        if (!enteredName || enteredName.trim() !== fullName) {
            alert("Submission cancelled. The entered name does not match your registered full name.");
            return;
        }

        await savePart4();
        // Mark as completed in backend (optional, but recommended to do in backend on save)
        await fetch('/api/activity/dsalgo1-finals/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save',
                examID,
                studentIDNumber: storedID,
                pageNumber: 4,
                answers: { completed: true }
            })
        });
        alert("Your answers have been submitted. This is your final submission for Part 4.");
        window.location.href = '/activity/dsalgo1/dsalgo1-finals-finish';
    });

    // Prevent tab switch recording when navigating back to Part 3
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function (e) {
            const href = link.getAttribute('href');
            if (href && href.includes('dsalgo1-finals-part3')) {
                window.isNavigatingAway = true;
                if (typeof window.resetTabMonitor === 'function') {
                    window.resetTabMonitor();
                }
            }
        });
    });

    // --- Scoring Function ---
    function scorePart4(answers, initialAdjacency, initialLabels) {
        let score = 0;
        // Q1: Edge list
        const correctEdges = [];
        for (let v of initialLabels) {
            for (let n of initialAdjacency[v]) {
                if (initialLabels.indexOf(v) < initialLabels.indexOf(n)) {
                    correctEdges.push(`${v}–${n}`);
                }
            }
        }
        const studentEdges = [];
        Object.keys(answers).filter(k => k.startsWith('p4_1_edge_')).forEach(k => {
            if (answers[k]) studentEdges.push(answers[k].replace(/\s/g, ''));
        });
        score += studentEdges.filter(e => correctEdges.includes(e)).length; // 1pt per correct edge

        // Q2: Graph builder
        let vCount = answers['p4_2_vertices'] ? answers['p4_2_vertices'].length : 0;
        score += (vCount === initialLabels.length) ? 1 : 0; // 1pt for correct vertex count

        let labelScore = 0;
        if (answers['p4_2_vertices']) {
            answers['p4_2_vertices'].forEach(l => {
                if (initialLabels.includes(l)) labelScore++;
                else labelScore--;
            });
        }
        score += labelScore; // 1pt per correct label, -1 for invalid

        let edgeScore = 0;
        if (answers['p4_2_edges']) {
            answers['p4_2_edges'].forEach(e => {
                if (correctEdges.includes(`${e[0]}–${e[1]}`) || correctEdges.includes(`${e[1]}–${e[0]}`)) edgeScore++;
                else edgeScore--;
            });
        }
        score += edgeScore; // 1pt per correct edge, -1 for invalid

        // Q3: Matrix
        let matrixScore = 0;
        for (let r of initialLabels) {
            for (let c of initialLabels) {
                const key = `p4_3_${r}_${c}`;
                if (answers[key] !== undefined) {
                    const correct = initialAdjacency[r].includes(c) ? '1' : '0';
                    if (answers[key] === correct) matrixScore++;
                    else matrixScore--;
                }
            }
        }
        score += matrixScore;

        // Clamp score to zero
        if (score < 0) score = 0;
        return score;
    }

    if (doc.answers) {
        // Try to infer matrix size and labels from saved keys
        const matrixKeys = Object.keys(doc.answers).filter(k => k.startsWith('p4_3_'));
        const labelSet = new Set();
        matrixKeys.forEach(k => {
            const parts = k.split('_');
            if (parts.length === 4) {
                labelSet.add(parts[2]);
                labelSet.add(parts[3]);
            }
        });
        const matrixLabels = Array.from(labelSet);
        if (matrixLabels.length) {
            matrixSizeInput.value = matrixLabels.length;
            renderMatrixVertexLabels(matrixLabels.length, matrixLabels);
            // Populate cell values
            document.querySelectorAll('#dynamicMatrixWrapper input[type="text"]').forEach(input => {
                if (doc.answers[input.name] !== undefined) {
                    input.value = doc.answers[input.name];
                }
            });
        } else {
            renderMatrixVertexLabels(parseInt(matrixSizeInput.value, 10));
        }
    } else {
        renderMatrixVertexLabels(parseInt(matrixSizeInput.value, 10));
    }

    // --- Populate Graph Builder (vertex count, labels, edges) ---
    if (doc.answers && Array.isArray(doc.answers['p4_2_vertices'])) {
        // Set the value of the number input to the saved number of vertices
        vertexCountInput.value = doc.answers['p4_2_vertices'].length;

        // Render vertex labels using saved labels
        renderVertexLabels(doc.answers['p4_2_vertices'].length, doc.answers['p4_2_vertices']);

        // Restore edges array and redraw
        edges = Array.isArray(doc.answers['p4_2_edges']) ? doc.answers['p4_2_edges'].map(e => [e[0], e[1]]) : [];
        renderGraphCanvas();
        renderEdgeList();
    } else {
        // Default rendering if no saved data
        renderVertexLabels(parseInt(vertexCountInput.value, 10));
    }

    if (doc.answers && doc.answers.completed) {
        messageEl.textContent = "You have already completed and submitted this exam. You cannot make further changes.";
        Array.from(form.elements).forEach(el => el.disabled = true);
        return;
    }
});