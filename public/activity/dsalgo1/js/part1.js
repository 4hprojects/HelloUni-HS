// /activity/dsalgo1/js/part1.js

// Answer key for Part 1
const ANSWER_KEY = {
    q1: 'b',
    q2: 'b',
    q3: 'b',
    q4: 'd',
    q5: 'b',
    q6: 'c',
    q7: 'b',
    q8: 'c',
    q9: 'c',
    q10: 'b',
    q11: 'b',
    q12: 'c',
    q13: 'c',
    q14: 'b',
    q15: 'b',
    q16: 'b',
    q17: 'b',
    q18: 'b',
    q19: 'b',
    q20: 'c',
    q21: 'b',
    q22: 'b',
    q23: 'c',
    q24: 'b',
    q25: 'a',
    q26: 'c',
    q27: 'b',
    q28: 'b',
    q29: 'b',
    q30: 'b'
};

// Fisher–Yates shuffle
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Randomize options (labels) inside a .question div
function randomizeQuestionOptions(questionEl) {
    if (!questionEl) return;

    const labels = Array.from(questionEl.querySelectorAll('label'));
    if (labels.length <= 1) return;

    const shuffled = shuffleArray(labels.slice());

    shuffled.forEach(label => {
        questionEl.appendChild(label);
    });
}

// Compute score based on ANSWER_KEY
function computeScore(answers) {
    let score = 0;
    for (let i = 1; i <= 30; i++) {
        const key = `q${i}`;
        if (answers[key] === ANSWER_KEY[key]) {
            score++;
        }
    }
    return { score, total: 30 };
}

document.addEventListener('DOMContentLoaded', () => {
    const storedID = sessionStorage.getItem('studentIDNumber');

    const idSpan = document.getElementById('studentIDNumberDisplay');
    const nameSpan = document.getElementById('studentNameDisplay');
    const sectionSpan = document.getElementById('sectionDisplay');
    const form = document.getElementById('part1Form');
    const messageEl = document.getElementById('message');
    const examIDInput = document.getElementById('examID');
    const submitButton = form ? form.querySelector('button[type="submit"]') : null;

    // Safety defaults for tab monitor globals
    if (typeof window.tabSwitchCount === 'undefined') {
        window.tabSwitchCount = 0;
    }
    if (typeof window.tabSwitchTimestamps === 'undefined') {
        window.tabSwitchTimestamps = [];
    }
    if (typeof window.isNavigatingAway === 'undefined') {
        window.isNavigatingAway = false;
    }

    // Randomize options for all questions
    const questionDivs = document.querySelectorAll('.question');
    questionDivs.forEach(q => randomizeQuestionOptions(q));

    // Mark navigation via any .button-link anchors
    document.querySelectorAll('a.button-link').forEach(link => {
        link.addEventListener('click', () => {
            window.isNavigatingAway = true;
        });
    });

    if (!storedID) {
        if (idSpan) idSpan.textContent = '[not found]';
        if (nameSpan) nameSpan.textContent = '[not found]';
        if (sectionSpan) sectionSpan.textContent = '[not found]';
        if (messageEl) {
            messageEl.textContent = 'No student ID found. Please return to the information page.';
        }
        if (submitButton) {
            submitButton.disabled = true;
        }
        return;
    }

    if (idSpan) {
        idSpan.textContent = storedID;
    }

    const examID = examIDInput ? examIDInput.value : 'dsalgo1-finals';

    loadExistingPart1(storedID, examID, {
        nameSpan,
        sectionSpan,
        messageEl,
        submitButton
    });

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        window.isNavigatingAway = true; // Prevent tab alert during navigation

        const answers = {};
        let firstMissing = null;

        for (let i = 1; i <= 30; i++) {
            const name = `q${i}`;
            const checked = document.querySelector(`input[name="${name}"]:checked`);
            if (checked) {
                answers[name] = checked.value;
            } else if (firstMissing === null) {
                firstMissing = i;
            }
        }

        if (firstMissing !== null) {
            if (messageEl) {
                messageEl.textContent =
                    `Please answer all items before proceeding. Check item ${firstMissing}.`;
            }
            window.isNavigatingAway = false;
            return;
        }

        const { score } = computeScore(answers);
        answers['score_part1'] = score; // <-- Store score inside answers

        const payload = {
            action: 'save',
            examID,
            studentIDNumber: storedID,
            pageNumber: 1,
            answers, // score_part1 is now inside answers
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
                if (messageEl) {
                    messageEl.textContent =
                        data.message || 'Failed to save. Please try again.';
                }
                window.isNavigatingAway = false;
                return;
            }

            sessionStorage.setItem('studentIDNumber', storedID);

            if (typeof window.resetTabMonitor === 'function') {
                window.resetTabMonitor();
            }

            window.location.href = '/activity/dsalgo1/dsalgo1-finals-part2';
        } catch (err) {
            console.error('Save error:', err);
            if (messageEl) {
                messageEl.textContent =
                    'An error occurred while saving. Please try again.';
            }
            window.isNavigatingAway = false;
        }
    });
});

// Load existing record and prefill if available
async function loadExistingPart1(studentIDNumber, examID, refs) {
    const { nameSpan, sectionSpan, messageEl, submitButton } = refs;

    try {
        console.log('Loading info for studentIDNumber:', studentIDNumber);

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
            if (messageEl) {
                messageEl.textContent =
                    'No student record found. Please return to the information page.';
            }
            if (submitButton) submitButton.disabled = true;
            return;
        }

        const doc = data.data;
        const fullName = [doc.firstName, doc.lastName].filter(Boolean).join(' ');

        if (nameSpan) nameSpan.textContent = fullName || '[name not set]';
        if (sectionSpan) sectionSpan.textContent = doc.section || '[section not set]';
        if (messageEl) messageEl.textContent = '';

        if (doc.answers && typeof doc.answers === 'object') {
            Object.entries(doc.answers).forEach(([key, value]) => {
                const radios = document.querySelectorAll(`input[name="${key}"]`);
                radios.forEach(r => {
                    if (r.value === value) {
                        r.checked = true;
                    }
                });
            });
        }

        if (submitButton) submitButton.disabled = false;
    } catch (err) {
        console.error('Error loading student info:', err);
        if (nameSpan) nameSpan.textContent = '[error loading]';
        if (sectionSpan) sectionSpan.textContent = '[error loading]';
        if (messageEl) {
            messageEl.textContent = 'Error loading student info.';
        }
        if (submitButton) submitButton.disabled = true;
    }
}

if (!sessionStorage.getItem('studentIDNumber')) {
    alert("You must log in with your student ID to access this page.");
    window.location.href = "/activity/dsalgo1/dsalgo1-finals-info.html";
    throw new Error("No student ID in sessionStorage");
}
