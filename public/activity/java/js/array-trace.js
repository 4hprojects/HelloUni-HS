// ===== Utility helpers =====

function randomInt(min, maxInclusive) {
    const minCeil = Math.ceil(min);
    const maxFloor = Math.floor(maxInclusive);
    return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
}

// ===== Template definitions =====

const templates = [
    {
        id: "scores2d",
        name: "2D array – scores, totals, pass count",
        description:
            "Trace a nested loop over a 2D int array. Follow row, column, current score, rowSum, total, and passCount.",

        generateInstance() {
            // Choose dimensions for the array.
            const rows = randomInt(3, 4);
            const cols = 3;

            // Choose a passing score and value range.
            const passingScore = randomInt(75, 80);
            const minScore = randomInt(60, 70);
            const maxScore = 100;

            // Build the 2D array.
            const scores = [];
            for (let r = 0; r < rows; r++) {
                const row = [];
                for (let c = 0; c < cols; c++) {
                    row.push(randomInt(minScore, maxScore));
                }
                scores.push(row);
            }

            // Build the Java code snippet.
            const codeLines = [];

            codeLines.push("int[][] scores = {");
            for (let r = 0; r < rows; r++) {
                const rowValues = scores[r].join(", ");
                const linePrefix = "    { " + rowValues + " }";
                const suffix = r === rows - 1 ? "" : ",";
                codeLines.push(linePrefix + suffix);
            }
            codeLines.push("};");
            codeLines.push("");
            codeLines.push("int passingScore = " + passingScore + ";");
            codeLines.push("int total = 0;");
            codeLines.push("int passCount = 0;");
            codeLines.push("");
            codeLines.push("for (int row = 0; row < scores.length; row++) {");
            codeLines.push("    int rowSum = 0;");
            codeLines.push("    for (int col = 0; col < scores[row].length; col++) {");
            codeLines.push("        int current = scores[row][col];");
            codeLines.push("        rowSum += current;");
            codeLines.push("        total += current;");
            codeLines.push("        if (current >= passingScore) {");
            codeLines.push("            passCount++;");
            codeLines.push("        }");
            codeLines.push('        System.out.print(current + " ");');
            codeLines.push("    }");
            codeLines.push('    System.out.println(" | Row total: " + rowSum);');
            codeLines.push("}");
            codeLines.push(
                'System.out.println("Overall total: " + total);'
            );
            codeLines.push(
                'System.out.println("Passing scores: " + passCount);'
            );

            const code = codeLines.join("\n");

            // Build the trace rows by simulating the loops.
            const traceRows = [];
            let total = 0;
            let passCount = 0;
            let step = 1;

            for (let row = 0; row < scores.length; row++) {
                let rowSum = 0;
                for (let col = 0; col < scores[row].length; col++) {
                    const current = scores[row][col];
                    rowSum += current;
                    total += current;
                    if (current >= passingScore) {
                        passCount++;
                    }

                    traceRows.push({
                        step,
                        row,
                        col,
                        current,
                        rowSum,
                        total,
                        passCount
                    });

                    step += 1;
                }
            }

            const resultSummary = {
                rows,
                cols,
                passingScore,
                total,
                passCount
            };

            const columns = [
                { key: "step", label: "Step" },
                { key: "row", label: "row" },
                { key: "col", label: "col" },
                { key: "current", label: "current" },
                { key: "rowSum", label: "rowSum" },
                { key: "total", label: "total" },
                { key: "passCount", label: "passCount" }
            ];

            return {
                code,
                traceRows,
                resultSummary,
                meta: { scores },
                columns
            };
        }
    },
    {
        id: "scores1d",
        name: "1D array – scores, total, pass count",
        description:
            "Trace a loop over a 1D int array. Follow index, current score, total, and passCount.",

        generateInstance() {
            // Choose length for the array.
            const len = randomInt(5, 6);
            const passingScore = randomInt(75, 80);
            const minScore = randomInt(60, 70);
            const maxScore = 100;

            // Build the 1D array.
            const scores = [];
            for (let i = 0; i < len; i++) {
                scores.push(randomInt(minScore, maxScore));
            }

            // Build the Java code snippet.
            const codeLines = [];
            codeLines.push("int[] scores = { " + scores.join(", ") + " };");
            codeLines.push("int passingScore = " + passingScore + ";");
            codeLines.push("int total = 0;");
            codeLines.push("int passCount = 0;");
            codeLines.push("");
            codeLines.push("for (int i = 0; i < scores.length; i++) {");
            codeLines.push("    int current = scores[i];");
            codeLines.push("    total += current;");
            codeLines.push("    if (current >= passingScore) {");
            codeLines.push("        passCount++;");
            codeLines.push("    }");
            codeLines.push('    System.out.print(current + " ");');
            codeLines.push("}");
            codeLines.push('System.out.println("\\nTotal steps: " + total);');
            codeLines.push('System.out.println("Passing scores: " + passCount);');

            const code = codeLines.join("\n");

            // Build the trace rows by simulating the loop.
            const traceRows = [];
            let total = 0;
            let passCount = 0;
            let step = 1;

            for (let i = 0; i < scores.length; i++) {
                const current = scores[i];
                total += current;
                if (current >= passingScore) {
                    passCount++;
                }
                traceRows.push({
                    step,
                    i,
                    current,
                    total,
                    passCount
                });
                step += 1;
            }

            const resultSummary = {
                len,
                passingScore,
                total,
                passCount
            };

            const columns = [
                { key: "step", label: "Step" },
                { key: "i", label: "i" },
                { key: "current", label: "current" },
                { key: "total", label: "total" },
                { key: "passCount", label: "passCount" }
            ];

            return {
                code,
                traceRows,
                resultSummary,
                meta: { scores },
                columns
            };
        }
    }
];

// ===== Global state =====

let currentTemplate = null;
let currentInstance = null;
let userInfo = null;

// ===== DOM references =====

const templateSelectEl = document.getElementById("template-select");
const generateBtn = document.getElementById("generate-btn");
const checkAnswersBtn = document.getElementById("check-answers-btn");
const showAnswersBtn = document.getElementById("show-answers-btn");
const codeSnippetEl = document.getElementById("code-snippet");
const tableContainerEl = document.getElementById("table-container");
const resultSummaryEl = document.getElementById("result-summary");
const messageEl = document.getElementById("message");
const modal = document.getElementById("tracing-modal");
const form = document.getElementById("tracing-form");

// ===== Initialisation =====

function init() {
    // Show modal on load
    modal.style.display = 'flex';
    generateBtn.disabled = true;

    // Setup modal form submission
    form.onsubmit = function (e) {
        e.preventDefault();

        const studentIDNumber = form.studentIDNumber.value.trim();
        const email = form.email.value.trim();
        const fullname = form.fullname.value.trim();

        // Simple validation
        if (!studentIDNumber || !email || !fullname) {
            alert('Please fill in all fields.');
            return;
        }
        // Basic email format check
        if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        // Store user info
        userInfo = { studentIDNumber, email, fullname };

        // Hide modal and enable activity
        modal.style.display = 'none';
        generateBtn.disabled = false;
        
        // Populate templates dropdown
        populateTemplateSelect();
    };
}

function populateTemplateSelect() {
    templateSelectEl.innerHTML = "";

    templates.forEach((tpl, index) => {
        const option = document.createElement("option");
        option.value = tpl.id;
        option.textContent = tpl.name;
        if (index === 0) {
            option.selected = true;
        }
        templateSelectEl.appendChild(option);
    });

    // Default current template.
    currentTemplate = templates[0] || null;
}

function onTemplateChange() {
    const selectedId = templateSelectEl.value;
    const tpl = templates.find((t) => t.id === selectedId) || templates[0];
    currentTemplate = tpl;
    resetView();
}

function resetView() {
    currentInstance = null;
    codeSnippetEl.textContent = '// Click "Generate new set" to start.';
    tableContainerEl.innerHTML = "";
    resultSummaryEl.textContent = "";
    messageEl.textContent = "";
    checkAnswersBtn.disabled = true;
    showAnswersBtn.disabled = true;
}

// ===== Rendering =====

function renderCode(code) {
    codeSnippetEl.textContent = code;
}

function renderTraceTable(instance, mode) {
    const { traceRows, columns } = instance;

    if (!traceRows || traceRows.length === 0) {
        tableContainerEl.innerHTML = "<p>No trace data.</p>";
        return;
    }

    const table = document.createElement("table");
    table.className = "trace-table";

    // Set column widths based on number of columns
    const columnCount = columns.length;
    table.style.tableLayout = 'fixed';

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    columns.forEach((col) => {
        const th = document.createElement("th");
        th.textContent = col.label;
        th.style.width = columnCount <= 6 ? 'auto' : '80px';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    traceRows.forEach((rowData, rowIndex) => {
        const tr = document.createElement("tr");

        columns.forEach((col) => {
            const td = document.createElement("td");
            const key = col.key;
            const value = rowData[key];

            if (key === "step" || mode === "answer") {
                td.textContent = String(value);
            } else {
                if (mode === "blank") {
                    const input = document.createElement("input");
                    input.type = "text";
                    input.className = "trace-input";
                    input.dataset.rowIndex = String(rowIndex);
                    input.dataset.key = key;
                    input.autocomplete = "off";
                    input.id = `trace-input-${rowIndex}-${key}`;
                    td.appendChild(input);
                } else {
                    td.textContent = String(value);
                }
            }

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);

    tableContainerEl.innerHTML = "";
    tableContainerEl.appendChild(table);
    
    // Focus first input if in blank mode
    if (mode === "blank" && traceRows.length > 0) {
        const firstInput = document.querySelector('.trace-input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function renderResultSummary(instance) {
    const { resultSummary } = instance;
    let summaryText = "";

    if (typeof resultSummary.total === "number" && typeof resultSummary.passCount === "number") {
        summaryText += `Final total: ${resultSummary.total}<br>`;
        summaryText += `Final pass count: ${resultSummary.passCount}`;
    }
    
    if (resultSummary.rows && resultSummary.cols) {
        summaryText += `<br>Array size: ${resultSummary.rows}×${resultSummary.cols}`;
    }

    resultSummaryEl.innerHTML = summaryText;
}

// ===== Answer checking =====

function normaliseValue(str) {
    return str.trim();
}

async function checkAnswers() {
    if (!currentInstance || !userInfo) return;

    // Confirmation before checking and submitting
    const confirmFinal = window.confirm(
        "Are you sure you want to check and submit your final answers? You cannot edit after this."
    );
    if (!confirmFinal) return;

    const { traceRows, columns } = currentInstance;
    const keysToCheck = columns.map((c) => c.key).filter((key) => key !== "step");

    let totalCells = 0;
    let correctCells = 0;
    let userAnswers = [];

    // Check each cell and collect answers
    traceRows.forEach((rowData, rowIndex) => {
        let rowAnswers = {};
        keysToCheck.forEach((key) => {
            const input = document.getElementById(`trace-input-${rowIndex}-${key}`);
            if (!input) return;
            totalCells++;
            const userValue = normaliseValue(input.value);
            rowAnswers[key] = userValue;
            if (userValue === String(rowData[key])) {
                correctCells++;
                input.classList.add("cell-correct");
                input.classList.remove("cell-incorrect");
            } else {
                input.classList.add("cell-incorrect");
                input.classList.remove("cell-correct");
            }
            input.readOnly = true;
        });
        userAnswers.push(rowAnswers);
    });

    // Calculate score and percentage
    const score = correctCells;
    const total = totalCells;
    const percent = total > 0 ? Math.round((score / total) * 100) : 0;

    // Submit to backend (simulated)
    try {
        // In a real application, you would send this to your server
        console.log('Submitting:', {
            userInfo,
            score,
            total,
            percent,
            answers: userAnswers
        });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        messageEl.innerHTML = `
            <strong>Answers submitted successfully!</strong><br>
            Score: ${score} / ${total} (${percent}%)<br>
            Student: ${userInfo.fullname} (${userInfo.studentIDNumber})
        `;
    } catch (err) {
        messageEl.textContent = "Error submitting your answers. Please try again.";
    }

    checkAnswersBtn.disabled = true;
    showAnswersBtn.disabled = false;
}

function hasUserData() {
    if (!currentInstance) return false;
    const { traceRows, columns } = currentInstance;
    for (let rowIndex = 0; rowIndex < traceRows.length; rowIndex++) {
        for (const col of columns) {
            if (col.key === "step") continue;
            const input = document.getElementById(`trace-input-${rowIndex}-${col.key}`);
            if (input && (input.value.trim() !== "" || input.readOnly)) {
                return true;
            }
        }
    }
    return false;
}

// ===== Event handlers =====

function onGenerateClick() {
    if (hasUserData()) {
        const confirmNew = window.confirm(
            "Are you sure? Generating a new set will discard your current work."
        );
        if (!confirmNew) return;
    }

    if (!currentTemplate) {
        return;
    }

    const instance = currentTemplate.generateInstance();
    currentInstance = instance;

    renderCode(instance.code);
    renderTraceTable(instance, "blank");
    renderResultSummary(instance);



    checkAnswersBtn.disabled = false;
    showAnswersBtn.disabled = false;
}

function onShowAnswersClick() {
    if (!currentInstance) return;

    const confirmDiscard = window.confirm(
        "Are you sure? Showing answers will discard your work and nothing will be recorded."
    );
    if (!confirmDiscard) return;

    // Lock all inputs and disable check/submit
    const { traceRows, columns } = currentInstance;
    columns.forEach((col) => {
        if (col.key === "step") return;
        traceRows.forEach((_, rowIndex) => {
            const input = document.getElementById(`trace-input-${rowIndex}-${col.key}`);
            if (input) {
                input.readOnly = true;
                input.classList.remove("cell-correct", "cell-incorrect");
            }
        });
    });

    checkAnswersBtn.disabled = true;
    showAnswersBtn.disabled = true;
    messageEl.textContent = "Answers discarded. Nothing was recorded.";

    // Show the correct answers
    renderTraceTable(currentInstance, "answer");
}

// ===== Wire up =====

document.addEventListener('DOMContentLoaded', init);

templateSelectEl.addEventListener("change", onTemplateChange);
generateBtn.addEventListener("click", onGenerateClick);
checkAnswersBtn.addEventListener("click", checkAnswers);
showAnswersBtn.addEventListener("click", onShowAnswersClick);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+Enter to check answers
    if (e.ctrlKey && e.key === 'Enter' && !checkAnswersBtn.disabled) {
        checkAnswers();
    }
    // Ctrl+Shift+N for new set
    if (e.ctrlKey && e.shiftKey && e.key === 'N' && !generateBtn.disabled) {
        onGenerateClick();
    }
});

// Auto-advance between inputs on Enter
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('trace-input')) {
        e.preventDefault();
        const currentId = e.target.id;
        const match = currentId.match(/trace-input-(\d+)-(\w+)/);
        if (match) {
            const rowIndex = parseInt(match[1]);
            const key = match[2];
            const { columns } = currentInstance || {};
            if (columns) {
                const currentColIndex = columns.findIndex(col => col.key === key);
                if (currentColIndex < columns.length - 1) {
                    // Move to next column in same row
                    const nextCol = columns[currentColIndex + 1];
                    const nextInput = document.getElementById(`trace-input-${rowIndex}-${nextCol.key}`);
                    if (nextInput) nextInput.focus();
                } else {
                    // Move to first column of next row
                    const nextRowInput = document.getElementById(`trace-input-${rowIndex + 1}-${columns[1].key}`);
                    if (nextRowInput) nextRowInput.focus();
                }
            }
        }
    }
});