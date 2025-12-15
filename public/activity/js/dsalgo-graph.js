// Graph Traversal Visualizer - Simplified version
class GraphTraversalVisualizer {
    constructor() {
        this.graph = {
            adjacency: [],
            positions: [],
            labels: [],
            directed: false
        };

        this.currentAnimation = null;
        this.isAnimating = false;
        this.stepDelayMs = 1000;

        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.svg = document.getElementById("graphCanvas");
        this.vertexCountInput = document.getElementById("vertexCount");
        this.generateGraphBtn = document.getElementById("generateGraphBtn");
        this.startVertexSelect = document.getElementById("startVertex");
        this.runTraversalBtn = document.getElementById("runTraversalBtn");
        this.traversalOrder = document.getElementById("traversalOrder");
        this.adjacencyListPre = document.getElementById("adjacencyList");
        this.statusBar = document.getElementById("statusBar");
        // New elements
        this.adjacencyMatrixContainer = document.getElementById("adjacencyMatrixContainer");
        this.edgeListPre = document.getElementById("edgeList");
        this.parentListPre = document.getElementById("parentList");
        this.frontierContainer = document.getElementById("frontierContainer");
        this.speedSlider = document.getElementById("speedSlider");
        this.speedValue = document.getElementById("speedValue");
        this.pauseBtn = document.getElementById("pauseBtn");
        this.resumeBtn = document.getElementById("resumeBtn");
        this.stepForwardBtn = document.getElementById("stepForwardBtn");
        this.isPaused = false;
        this.animationInterval = null;
        this.stepIndex = 0;
        this.snapshots = [];
    }

    initializeEventListeners() {
        this.generateGraphBtn.addEventListener("click", () => this.generateGraph());
        this.runTraversalBtn.addEventListener("click", () => this.runTraversal());
        this.svg.addEventListener('click', (e) => this.handleNodeClick(e));
        this.speedSlider.addEventListener('input', () => this.updateSpeed());
        this.pauseBtn.addEventListener('click', () => this.pauseAnimation());
        this.resumeBtn.addEventListener('click', () => this.resumeAnimation());
        this.stepForwardBtn.addEventListener('click', () => this.stepForward());
    }

    generateGraph() {
        if (this.isAnimating) {
            this.stopAnimation();
        }

        const n = parseInt(this.vertexCountInput.value, 10);
        const graphType = document.querySelector("input[name='graphType']:checked").value;
        const directed = graphType === "directed";

        this.graph = this.createRandomGraph(n, directed);
        this.fillStartVertexSelect(this.graph.labels);
        this.drawGraph(this.graph);
        this.showAdjacencyList(this.graph);
        this.renderAdjacencyMatrix(this.graph);
        this.renderEdgeList(this.graph);

        this.statusBar.textContent = "Graph generated. Select start vertex and algorithm.";
        this.runTraversalBtn.disabled = false;
        this.traversalOrder.textContent = "-";
        this.parentListPre.textContent = "Run a traversal to see parent relationships";
        this.frontierContainer.innerHTML = "Run traversal to see frontier";
        this.pauseBtn.disabled = true;
        this.resumeBtn.disabled = true;
        this.stepForwardBtn.disabled = true;
    }

    runTraversal() {
        if (!this.graph || this.graph.adjacency.length === 0) return;
        if (this.isAnimating) return;

        const type = document.querySelector("input[name='traversalType']:checked").value;
        const startIndex = this.startVertexSelect.selectedIndex;
        if (startIndex < 0) return;

        const { order, parent, snapshots } = (type === 'bfs')
            ? this.bfsWithSnapshots(this.graph.adjacency, startIndex)
            : this.dfsWithSnapshots(this.graph.adjacency, startIndex);

        this.snapshots = snapshots;
        this.animateTraversal(order, parent, type);
    }

    handleNodeClick(e) {
        if (this.isAnimating) return;
        
        const nodeGroup = e.target.closest('g[data-index]');
        if (nodeGroup) {
            const index = parseInt(nodeGroup.getAttribute('data-index'));
            this.startVertexSelect.selectedIndex = index;
            
            // Visual feedback
            document.querySelectorAll('.node-group').forEach(group => {
                group.classList.remove('node-start');
            });
            nodeGroup.classList.add('node-start');
        }
    }

    // Graph creation methods
    createRandomGraph(n, directed) {
        const adjacency = Array.from({ length: n }, () => []);
        const labels = Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));

        // Create a connected graph
        for (let v = 1; v < n; v++) {
            const u = Math.floor(Math.random() * v);
            if (directed) {
                if (Math.random() < 0.5) {
                    this.addDirectedEdge(adjacency, u, v);
                } else {
                    this.addDirectedEdge(adjacency, v, u);
                }
            } else {
                this.addUndirectedEdge(adjacency, u, v);
            }
        }

        // Add some extra edges
        const extraEdgeProbability = 0.3;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) continue;
                if (adjacency[i].includes(j)) continue;
                if (Math.random() < extraEdgeProbability) {
                    if (directed) {
                        this.addDirectedEdge(adjacency, i, j);
                    } else if (i < j) {
                        this.addUndirectedEdge(adjacency, i, j);
                    }
                }
            }
        }

        // Sort neighbours for consistent traversal
        adjacency.forEach(neighbours => neighbours.sort((a, b) => a - b));

        const positions = this.computeCircularPositions(n, 600, 400, 150);
        return { adjacency, labels, positions, directed };
    }

    addUndirectedEdge(adj, u, v) {
        if (!adj[u].includes(v)) adj[u].push(v);
        if (!adj[v].includes(u)) adj[v].push(u);
    }

    addDirectedEdge(adj, from, to) {
        if (!adj[from].includes(to)) adj[from].push(to);
    }

    computeCircularPositions(n, width, height, radius) {
        const cx = width / 2;
        const cy = height / 2;
        const positions = [];
        for (let i = 0; i < n; i++) {
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            positions.push({ x, y });
        }
        return positions;
    }

    fillStartVertexSelect(labels) {
        this.startVertexSelect.innerHTML = "";
        labels.forEach((label, index) => {
            const opt = document.createElement("option");
            opt.value = index;
            opt.textContent = label;
            this.startVertexSelect.appendChild(opt);
        });
    }

    drawGraph(g) {
        while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);

        const svgNS = "http://www.w3.org/2000/svg";

        // Arrowhead for directed graphs
        if (g.directed) {
            const defs = document.createElementNS(svgNS, "defs");
            const marker = document.createElementNS(svgNS, "marker");
            marker.setAttribute("id", "arrowhead");
            marker.setAttribute("markerWidth", "10");
            marker.setAttribute("markerHeight", "7");
            marker.setAttribute("refX", "9");
            marker.setAttribute("refY", "3.5");
            marker.setAttribute("orient", "auto");

            const polygon = document.createElementNS(svgNS, "polygon");
            polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
            polygon.setAttribute("fill", "#bdc3c7");

            marker.appendChild(polygon);
            defs.appendChild(marker);
            this.svg.appendChild(defs);
        }

        const { adjacency, positions, labels, directed } = g;
        const n = adjacency.length;

        // Draw edges
        this.drawEdges(g, svgNS);

        // Draw nodes
        for (let i = 0; i < n; i++) {
            const group = document.createElementNS(svgNS, "g");
            group.setAttribute("data-index", i);
            group.setAttribute("class", "node-group");

            const circle = document.createElementNS(svgNS, "circle");
            circle.setAttribute("cx", positions[i].x);
            circle.setAttribute("cy", positions[i].y);
            circle.setAttribute("r", 20);
            circle.setAttribute("class", "node-circle");

            const label = document.createElementNS(svgNS, "text");
            label.setAttribute("x", positions[i].x);
            label.setAttribute("y", positions[i].y);
            label.setAttribute("class", "node-label");
            label.textContent = labels[i];

            const step = document.createElementNS(svgNS, "text");
            step.setAttribute("x", positions[i].x);
            step.setAttribute("y", positions[i].y + 25);
            step.setAttribute("class", "node-step");
            step.setAttribute("id", `step-${i}`);
            step.textContent = "";

            group.appendChild(circle);
            group.appendChild(label);
            group.appendChild(step);
            this.svg.appendChild(group);
        }
    }

    drawEdges(g, svgNS) {
        const { adjacency, positions, directed } = g;
        const n = adjacency.length;
        const nodeRadius = 20;

        for (let u = 0; u < n; u++) {
            for (const v of adjacency[u]) {
                if (!directed && v < u) continue; // Avoid duplicate edges in undirected

                const line = this.createEdgeLine(positions[u], positions[v], nodeRadius, directed);
                line.setAttribute("class", "edge");
                line.dataset.u = u;
                line.dataset.v = v;
                
                if (directed) {
                    line.setAttribute("marker-end", "url(#arrowhead)");
                }
                
                this.svg.appendChild(line);
            }
        }
    }

    createEdgeLine(startPos, endPos, nodeRadius, isDirected) {
        const svgNS = "http://www.w3.org/2000/svg";
        const line = document.createElementNS(svgNS, "line");
        
        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return line;

        const unitX = dx / length;
        const unitY = dy / length;

        // Adjust start and end points to node circumference
        const startX = startPos.x + unitX * nodeRadius;
        const startY = startPos.y + unitY * nodeRadius;
        const endX = endPos.x - unitX * nodeRadius;
        const endY = endPos.y - unitY * nodeRadius;

        line.setAttribute("x1", startX);
        line.setAttribute("y1", startY);
        line.setAttribute("x2", endX);
        line.setAttribute("y2", endY);

        return line;
    }

    showAdjacencyList(g) {
        const { adjacency, labels, directed } = g;
        const heading = directed ? "Directed Graph" : "Undirected Graph";
        let html = `<div class="adj-heading">${heading}</div>`;
        html += adjacency.map((nbrs, i) => {
            const neighbours = nbrs.map(idx => labels[idx]).join(", ");
            return `<div class="adj-row" data-vertex="${i}"><span class="adj-vertex">${labels[i]}:</span> ${neighbours}</div>`;
        }).join("");
        this.adjacencyListPre.innerHTML = html;
    }

    // Build adjacency matrix
    buildAdjacencyMatrix(adjacency, n) {
        const matrix = Array.from({ length: n }, () => Array(n).fill(0));
        for (let u = 0; u < n; u++) {
            for (const v of adjacency[u]) {
                matrix[u][v] = 1;
            }
        }
        if (!this.graph.directed) {
            // Ensure symmetry (already set) - optional
        }
        return matrix;
    }

    renderAdjacencyMatrix(g) {
        const { adjacency, labels } = g;
        const n = adjacency.length;
        const matrix = this.buildAdjacencyMatrix(adjacency, n);
        let html = '<table><thead><tr><th></th>';
        for (let i = 0; i < n; i++) html += `<th>${labels[i]}</th>`;
        html += '</tr></thead><tbody>';
        for (let r = 0; r < n; r++) {
            html += `<tr><th>${labels[r]}</th>`;
            for (let c = 0; c < n; c++) {
                html += `<td data-r="${r}" data-c="${c}">${matrix[r][c]}</td>`;
            }
            html += '</tr>';
        }
        html += '</tbody></table>';
        this.adjacencyMatrixContainer.innerHTML = html;
    }

    buildEdgeList(adjacency, directed) {
        const edges = [];
        for (let u = 0; u < adjacency.length; u++) {
            for (const v of adjacency[u]) {
                if (directed) {
                    edges.push([u, v]);
                } else if (u < v) {
                    edges.push([u, v]);
                }
            }
        }
        return edges;
    }

    renderEdgeList(g) {
        const edges = this.buildEdgeList(g.adjacency, g.directed);
        const labels = g.labels;
        const lines = edges.map(([u, v]) => `${labels[u]} -> ${labels[v]}`);
        const heading = g.directed ? 'Edges (Directed)' : 'Edges (Undirected)';
        this.edgeListPre.textContent = heading + '\n' + (lines.length ? lines.join('\n') : '(none)');
    }

    renderParentList(parent) {
        const labels = this.graph.labels;
        const lines = [];
        for (let i = 0; i < parent.length; i++) {
            const p = parent[i] === null ? '-' : labels[parent[i]];
            lines.push(`${labels[i]} <- ${p}`);
        }
        this.parentListPre.textContent = 'Parent Relationships\n' + lines.join('\n');
    }

    renderFrontier(stepIndex) {
        if (!this.snapshots || !this.snapshots.length) return;
        const snapshot = this.snapshots[stepIndex];
        if (!snapshot) return;
        const labels = this.graph.labels;
        this.frontierContainer.innerHTML = '';
        snapshot.frontier.forEach((idx, pos) => {
            const div = document.createElement('div');
            div.className = 'frontier-item';
            div.textContent = labels[idx];
            // Mark current if matches current vertex (next to process for BFS or top for DFS)
            if (pos === 0) div.classList.add('current');
            this.frontierContainer.appendChild(div);
        });
        if (snapshot.frontier.length === 0) {
            this.frontierContainer.textContent = '(empty)';
        }
    }

    // Traversal algorithms
    bfs(adjacency, start) {
        const n = adjacency.length;
        const visited = new Array(n).fill(false);
        const parent = new Array(n).fill(null);
        const order = [];
        const queue = [start];

        visited[start] = true;
        parent[start] = null;

        while (queue.length > 0) {
            const u = queue.shift();
            order.push(u);

            for (const v of adjacency[u]) {
                if (!visited[v]) {
                    visited[v] = true;
                    parent[v] = u;
                    queue.push(v);
                }
            }
        }

        return { order, parent };
    }

    dfs(adjacency, start) {
        const n = adjacency.length;
        const visited = new Array(n).fill(false);
        const parent = new Array(n).fill(null);
        const order = [];
        const stack = [start];

        visited[start] = true;
        parent[start] = null;

        while (stack.length > 0) {
            const u = stack.pop();
            order.push(u);

            // Reverse neighbors to maintain consistent order with recursive DFS
            for (let i = adjacency[u].length - 1; i >= 0; i--) {
                const v = adjacency[u][i];
                if (!visited[v]) {
                    visited[v] = true;
                    parent[v] = u;
                    stack.push(v);
                }
            }
        }

        return { order, parent };
    }

    // BFS with frontier snapshots
    bfsWithSnapshots(adjacency, start) {
        const n = adjacency.length;
        const visited = new Array(n).fill(false);
        const parent = new Array(n).fill(null);
        const order = [];
        const queue = [start];
        const snapshots = [];
        visited[start] = true;
        parent[start] = null;
        snapshots.push({ frontier: [...queue] });
        while (queue.length > 0) {
            const u = queue.shift();
            order.push(u);
            for (const v of adjacency[u]) {
                if (!visited[v]) {
                    visited[v] = true;
                    parent[v] = u;
                    queue.push(v);
                }
            }
            snapshots.push({ frontier: [...queue] });
        }
        return { order, parent, snapshots };
    }

    // DFS with frontier snapshots (stack)
    dfsWithSnapshots(adjacency, start) {
        const n = adjacency.length;
        const visited = new Array(n).fill(false);
        const parent = new Array(n).fill(null);
        const order = [];
        const stack = [start];
        const snapshots = [];
        visited[start] = true;
        parent[start] = null;
        snapshots.push({ frontier: [...stack] });
        while (stack.length > 0) {
            const u = stack.pop();
            order.push(u);
            for (let i = adjacency[u].length - 1; i >= 0; i--) {
                const v = adjacency[u][i];
                if (!visited[v]) {
                    visited[v] = true;
                    parent[v] = u;
                    stack.push(v);
                }
            }
            snapshots.push({ frontier: [...stack] });
        }
        return { order, parent, snapshots };
    }

    // Animation methods
    stopAnimation() {
        if (this.currentAnimation) {
            this.currentAnimation.forEach(timeout => clearTimeout(timeout));
            this.currentAnimation = null;
        }
        this.isAnimating = false;
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        this.isPaused = false;
        this.runTraversalBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.resumeBtn.disabled = true;
        this.stepForwardBtn.disabled = true;
    }

    animateTraversal(order, parent, type) {
        this.isAnimating = true;
        this.runTraversalBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.resumeBtn.disabled = true;
        this.stepForwardBtn.disabled = false;
        this.stepIndex = 0;
        this.order = order;
        this.parent = parent;
        this.traversalType = type;
        this.resetGraphState();
        this.highlightTreeEdges(parent);
        const algorithmName = type === 'bfs' ? 'Breadth-First Search' : 'Depth-First Search';
        this.statusBar.textContent = `Running ${algorithmName}...`;
        this.renderParentList(parent);
        this.animationInterval = setInterval(() => {
            if (this.isPaused) return;
            if (this.stepIndex >= this.order.length) {
                clearInterval(this.animationInterval);
                this.animationInterval = null;
                this.isAnimating = false;
                this.runTraversalBtn.disabled = false;
                this.pauseBtn.disabled = true;
                this.resumeBtn.disabled = true;
                this.stepForwardBtn.disabled = true;
                this.statusBar.textContent = `${algorithmName} completed.`;
                return;
            }
            const vertexIndex = this.order[this.stepIndex];
            this.animateStep(vertexIndex, this.stepIndex, this.order, this.traversalType);
            this.renderFrontier(this.stepIndex);
            this.stepIndex++;
        }, this.stepDelayMs);
    }

    resetGraphState() {
        // Reset all nodes
        document.querySelectorAll('.node-group').forEach(group => {
            group.classList.remove('node-visited', 'node-current', 'node-start');
        });
        
        // Reset all edges
        document.querySelectorAll('.edge').forEach(edge => {
            edge.classList.remove('edge-tree');
        });
        
        // Reset step numbers
        for (let i = 0; i < this.graph.labels.length; i++) {
            const stepElement = document.getElementById(`step-${i}`);
            if (stepElement) stepElement.textContent = "";
        }
    }

    highlightTreeEdges(parent) {
        for (let v = 0; v < parent.length; v++) {
            const u = parent[v];
            if (u !== null) {
                const edge = this.svg.querySelector(`.edge[data-u="${u}"][data-v="${v}"]`);
                if (edge) {
                    edge.classList.add('edge-tree');
                }
            }
        }
    }

    animateStep(vertexIndex, step, order, type) {
        const nodeGroup = this.svg.querySelector(`.node-group[data-index="${vertexIndex}"]`);
        const stepElement = document.getElementById(`step-${vertexIndex}`);
        
        // Remove current class from previous node
        document.querySelectorAll('.node-group').forEach(group => {
            group.classList.remove('node-current');
        });
        
        // Mark current node
        nodeGroup.classList.add('node-current');
        if (stepElement) stepElement.textContent = step + 1;
        
        // Mark as visited (but keep current styling)
        if (step > 0) {
            const prevNode = this.svg.querySelector(`.node-group[data-index="${order[step-1]}"]`);
            if (prevNode) {
                prevNode.classList.remove('node-current');
                prevNode.classList.add('node-visited');
            }
        }
        
        // Update traversal order display
        const currentLabels = order.slice(0, step + 1).map(i => this.graph.labels[i]);
        this.traversalOrder.textContent = currentLabels.join(' → ');
        
        // Update status
        const algorithmName = type === 'bfs' ? 'BFS' : 'DFS';
        this.statusBar.textContent = `${algorithmName} Step ${step + 1}: Visiting ${this.graph.labels[vertexIndex]}`;
        this.updateMatrixHighlights(vertexIndex);
    }

    updateMatrixHighlights(currentIndex) {
        // Clear previous highlights
        this.adjacencyMatrixContainer.querySelectorAll('td').forEach(td => {
            td.classList.remove('highlight-current');
            td.classList.remove('highlight-neighbour');
        });
        // Highlight row of current vertex
        const rowCells = this.adjacencyMatrixContainer.querySelectorAll(`td[data-r="${currentIndex}"]`);
        rowCells.forEach(cell => {
            if (cell.textContent === '1') cell.classList.add('highlight-current');
        });
        // Highlight neighbour columns
        const neighbours = this.graph.adjacency[currentIndex];
        neighbours.forEach(nbr => {
            const colCells = this.adjacencyMatrixContainer.querySelectorAll(`td[data-c="${nbr}"][data-r]`);
            colCells.forEach(cell => {
                if (cell.textContent === '1') cell.classList.add('highlight-neighbour');
            });
        });
        this.highlightAdjacencyRows(currentIndex, neighbours);
    }

    highlightAdjacencyRows(current, neighbours) {
        if (!this.adjacencyListPre) return;
        this.adjacencyListPre.querySelectorAll('.adj-row').forEach(row => {
            row.classList.remove('current', 'neighbour');
        });
        const currentRow = this.adjacencyListPre.querySelector(`.adj-row[data-vertex="${current}"]`);
        if (currentRow) currentRow.classList.add('current');
        neighbours.forEach(nbr => {
            const nbrRow = this.adjacencyListPre.querySelector(`.adj-row[data-vertex="${nbr}"]`);
            if (nbrRow) nbrRow.classList.add('neighbour');
        });
    }

    updateSpeed() {
        const val = parseInt(this.speedSlider.value, 10);
        this.stepDelayMs = val;
        this.speedValue.textContent = (val / 1000).toFixed(1) + 's';
        // If animating with interval, restart interval with new speed
        if (this.animationInterval && !this.isPaused) {
            clearInterval(this.animationInterval);
            this.animationInterval = setInterval(() => {
                if (this.isPaused) return;
                if (this.stepIndex >= this.order.length) {
                    clearInterval(this.animationInterval);
                    this.animationInterval = null;
                    this.isAnimating = false;
                    this.runTraversalBtn.disabled = false;
                    this.pauseBtn.disabled = true;
                    this.resumeBtn.disabled = true;
                    this.stepForwardBtn.disabled = true;
                    this.statusBar.textContent = `${(this.traversalType === 'bfs' ? 'Breadth-First Search' : 'Depth-First Search')} completed.`;
                    return;
                }
                const vertexIndex = this.order[this.stepIndex];
                this.animateStep(vertexIndex, this.stepIndex, this.order, this.traversalType);
                this.renderFrontier(this.stepIndex);
                this.stepIndex++;
            }, this.stepDelayMs);
        }
    }

    pauseAnimation() {
        if (!this.isAnimating || this.isPaused) return;
        this.isPaused = true;
        this.pauseBtn.disabled = true;
        this.resumeBtn.disabled = false;
        this.statusBar.textContent += ' (Paused)';
        document.querySelector('.container')?.classList.add('paused');
    }

    resumeAnimation() {
        if (!this.isAnimating || !this.isPaused) return;
        this.isPaused = false;
        this.pauseBtn.disabled = false;
        this.resumeBtn.disabled = true;
        this.statusBar.textContent = this.statusBar.textContent.replace(' (Paused)', '');
        document.querySelector('.container')?.classList.remove('paused');
    }

    stepForward() {
        if (!this.isAnimating) return;
        if (!this.isPaused) return; // Only allow manual steps while paused
        if (this.stepIndex >= this.order.length) return;
        const vertexIndex = this.order[this.stepIndex];
        this.animateStep(vertexIndex, this.stepIndex, this.order, this.traversalType);
        this.renderFrontier(this.stepIndex);
        this.stepIndex++;
        if (this.stepIndex >= this.order.length) {
            this.isAnimating = false;
            this.pauseBtn.disabled = true;
            this.resumeBtn.disabled = true;
            this.stepForwardBtn.disabled = true;
            this.runTraversalBtn.disabled = false;
            this.statusBar.textContent = `${(this.traversalType === 'bfs' ? 'Breadth-First Search' : 'Depth-First Search')} completed.`;
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const visualizer = new GraphTraversalVisualizer();
    // Generate initial graph
    visualizer.generateGraphBtn.click();
});