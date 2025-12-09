const form = document.getElementById('part2Form');

const examID = document.getElementById('examID').value;
const storedID = sessionStorage.getItem('studentIDNumber');

if (!sessionStorage.getItem('studentIDNumber')) {
    alert("You must log in with your student ID to access this page.");
    window.location.href = "/activity/dsalgo1/dsalgo1-finals-info.html";
    throw new Error("No student ID in sessionStorage");
}

const part2AnswerKey = {
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

let isSubmitButton = false;
const submitBtn = form.querySelector('button[type="submit"]');
if (submitBtn) {
    submitBtn.addEventListener('click', () => {
        isSubmitButton = true;
    });
}

// Update the submit handler:
form.addEventListener('submit', async (e) => {
    if (!isSubmitButton) {
        // Reset flag and allow default (for navigation or other submits)
        isSubmitButton = false;
        return;
    }
    e.preventDefault();

    const answers = {};
    let score = 0;
    let firstMissing = null;

    // Collect answers and check for missing
    for (let i = 1; i <= 10; i++) {
        const name = `m${i}`; // <-- use m1 to m10
        const select = document.querySelector(`[name="${name}"]`);
        if (select && select.value) {
            answers[name] = select.value.trim().toUpperCase();
            if (part2AnswerKey[name] && select.value.trim().toUpperCase() === part2AnswerKey[name]) {
                score++;
            }
        } else if (firstMissing === null) {
            firstMissing = i;
        }
    }

    if (firstMissing !== null) {
        alert(`Please answer all items before proceeding. Check item ${firstMissing}.`);
        isSubmitButton = false;
        return;
    }

    answers['score_part2'] = score; // Store score inside answers

    const payload = {
        action: 'save',
        examID,
        studentIDNumber: storedID,
        pageNumber: 2,
        answers
    };

    try {
        const res = await fetch('/api/activity/dsalgo1-finals/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) {
            alert(data.message || 'Failed to save. Please try again.');
            isSubmitButton = false;
            return;
        }
        // Go to Part 3
        window.location.href = '/activity/dsalgo1/dsalgo1-finals-part3.html';
    } catch (err) {
        alert('An error occurred while saving. Please try again.');
    }
    isSubmitButton = false;
});

async function populateStudentInfo() {
    const idSpan = document.getElementById('studentIDNumberDisplay');
    const nameSpan = document.getElementById('studentNameDisplay');
    const sectionSpan = document.getElementById('sectionDisplay');

    idSpan.textContent = storedID || '[not found]';

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
            nameSpan.textContent = [doc.firstName, doc.lastName].filter(Boolean).join(' ') || '[name not set]';
            sectionSpan.textContent = doc.section || '[section not set]';

            // --- Populate existing answers ---
            if (doc.answers) {
                for (let i = 1; i <= 10; i++) {
                    const name = `m${i}`;
                    if (doc.answers[name]) {
                        const select = document.querySelector(`[name="${name}"]`);
                        if (select) select.value = doc.answers[name];
                    }
                }
            }
        } else {
            nameSpan.textContent = '[not found]';
            sectionSpan.textContent = '[not found]';
        }
    } catch (err) {
        nameSpan.textContent = '[error]';
        sectionSpan.textContent = '[error]';
    }
}

function shuffleOptions(selectId, keepFirst=true) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const options = Array.from(select.options);
    let firstOption = [];
    let rest = options;
    if (keepFirst) {
        firstOption = [options[0]]; // "Select letter"
        rest = options.slice(1);
    }
    // Fisher-Yates shuffle
    for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    select.innerHTML = '';
    [...firstOption, ...rest].forEach(opt => select.appendChild(opt));
}

// Prevent tab switch alert/counter when navigating back to Part 1
const backLink = document.querySelector('a.button-link[href*="dsalgo1-finals-part1"]');
if (backLink) {
    backLink.addEventListener('click', function () {
        window.isNavigatingAway = true;
        if (typeof window.resetTabMonitor === 'function') {
            window.resetTabMonitor();
        }
    });
}

populateStudentInfo();
